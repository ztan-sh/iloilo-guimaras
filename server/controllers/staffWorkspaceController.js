const mongoose = require("mongoose");
const { randomUUID } = require("node:crypto");
const Booking = require("../models/Booking");
const FerrySchedule = require("../models/FerrySchedule");
const { manilaDate, normalizeDate, belongsToTrip, summarizeTrip, hasMotorcycle, terminalFare } = require("../utils/staffTrip");
const { recordActivity } = require("../utils/activityAudit");

const dateFilter = (date) => {
    const [year, month, day] = date.split("-");
    return { date: { $in: [date, `${Number(month)}/${Number(day)}/${year}`, `${month}/${day}/${year}`] } };
};

const getWorkspace = async (req, res) => {
    try {
        const date = req.query.date || manilaDate();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "A valid trip date is required." });
        const [schedules, bookings] = await Promise.all([
            FerrySchedule.find({ date, active: { $ne: false } }).sort({ departureTime: 1 }).lean(),
            Booking.find(dateFilter(date)).select("-paymentProof -userId").sort({ boardedAt: -1, createdAt: -1 }).lean()
        ]);
        const trips = schedules.map(trip => {
            const records = bookings.filter(b => belongsToTrip(b, trip));
            return { ...trip, id: String(trip._id), statistics: summarizeTrip(trip, records) };
        });
        res.json({ success: true, date, trips, bookings, fares: { passenger: 40, motorcycle: 150, ppa: 65 } });
    } catch (error) {
        console.error("Staff workspace error:", error);
        res.status(500).json({ message: "Unable to load terminal trips. Please try again." });
    }
};

const createWalkInTicket = async (req, res) => {
    const body = req.body || {};
    const passengerName = String(body.passengerName || "").trim();
    const passengers = Number(body.passengers);
    const motorcycle = body.vehicleType === "Motorcycle";
    const companions = Array.isArray(body.accompanyingPassengers) ? body.accompanyingPassengers.map(n => String(n).trim()) : [];
    if (!mongoose.Types.ObjectId.isValid(body.tripId) || !mongoose.Types.ObjectId.isValid(body.saleId)
        || !passengerName || passengerName.length > 150
        || !Number.isInteger(passengers) || passengers < 1 || passengers > (motorcycle ? 3 : 10)
        || companions.length !== passengers - 1 || companions.some(n => !n || n.length > 150)
        || !["Motorcycle", "No Motorcycle"].includes(body.vehicleType)
        || (motorcycle && (!String(body.plateNumber || "").trim() || !String(body.motorcycleModel || "").trim()))
        || body.paymentReceived !== true) {
        return res.status(400).json({ message: "Enter valid passenger details and confirm that cash payment has been received." });
    }
    const fare = terminalFare(passengers, motorcycle);
    if (Number(body.totalCollected) !== fare.requiredAmount) {
        return res.status(400).json({ message: "The collected amount must match the current fare." });
    }
    let session;
    try {
        const previous = await Booking.findById(body.saleId);
        if (previous) {
            if (previous.ticketSource !== "WALK_IN" || previous.recordedBy !== req.staff.staffId) return res.status(409).json({ message: "Sale ID is already in use." });
            return res.json({ success: true, booking: previous });
        }
        session = await mongoose.startSession();
        let booking;
        await session.withTransaction(async () => {
            // Writes to this departure serialize concurrent terminal sales. A
            // retried transaction recalculates capacity from its new snapshot.
            const trip = await FerrySchedule.findOneAndUpdate(
                { _id: body.tripId, active: { $ne: false } },
                { $inc: { staffSalesVersion: 1 } }, { new: true, session }
            );
            if (!trip || trip.date !== manilaDate()) throw Object.assign(new Error("Select an active departure for today."), { status: 400 });
            const departure = new Date(`${trip.date}T${trip.departureTime}:00+08:00`);
            if (departure <= new Date()) throw Object.assign(new Error("This departure has already left. Select an upcoming trip."), { status: 400 });
            const records = (await Booking.find({ ...dateFilter(trip.date), status: { $ne: "CANCELLED" }, paymentStatus: { $ne: "REJECTED" } }).session(session).lean())
                .filter(b => belongsToTrip(b, trip));
            const statistics = summarizeTrip(trip, records);
            const reservedPassengers = records.reduce((n, b) => n + Math.max(1, Number(b.passengers) || 1), 0);
            if (reservedPassengers + passengers > statistics.passengerCapacity
                || (motorcycle && (records.filter(hasMotorcycle).length + 1 > statistics.motorcycleCapacity
                    || records.filter(b => b.ticketSource === "WALK_IN" && hasMotorcycle(b)).length + 1 > statistics.walkInMotorcycleCapacity))) {
                throw Object.assign(new Error("This trip has insufficient passenger or walk-in motorcycle capacity."), { status: 409 });
            }
            const [origin, destination] = trip.route.split(/\s*→\s*/);
            [booking] = await Booking.create([{
                _id: body.saleId, bookingReference: `GG-W-${randomUUID().slice(0, 8).toUpperCase()}`,
                origin, destination, date: normalizeDate(trip.date), time: trip.departureTime,
                departureTime: trip.departureTime, ferryId: String(trip._id), ferryName: trip.vesselName, vesselName: trip.vesselName,
                passengerName, passengers, accompanyingPassengers: companions,
                contactNumber: String(body.contactNumber || "").trim().slice(0, 30),
                vehicleType: body.vehicleType, motorcycleModel: motorcycle ? String(body.motorcycleModel).trim().slice(0, 100) : "",
                plateNumber: motorcycle ? String(body.plateNumber).trim().slice(0, 30) : "",
                ...fare, totalPaid: fare.requiredAmount, paymentMethod: "Cash", paymentStatus: "VERIFIED", status: "CONFIRMED",
                ticketSource: "WALK_IN", paidAt: new Date(), recordedBy: req.staff.staffId, recordedByName: req.staff.name || "Terminal staff"
            }], { session });
        });
        req.auditLogged = true;
        await recordActivity({ req, actorRole: "staff", actorId: req.staff.staffId, actorName: req.staff.name, actorEmail: req.staff.email,
            action: "Created walk-in ticket", summary: `${req.staff.name} created walk-in ticket ${booking.bookingReference} for ${booking.passengerName}`,
            entityType: "ticket", entityId: booking._id, subject: booking.bookingReference,
            details: { passengerName: booking.passengerName, vesselName: booking.vesselName, route: `${booking.origin} → ${booking.destination}`, date: booking.date, departureTime: booking.departureTime } });
        res.status(201).json({ success: true, booking });
    } catch (error) {
        if (error.code === 11000) {
            const previous = await Booking.findById(body.saleId);
            if (previous?.recordedBy === req.staff.staffId && previous.ticketSource === "WALK_IN") return res.json({ success: true, booking: previous });
        }
        if (!error.status) console.error("Walk-in sale error:", error);
        res.status(error.status || 500).json({ message: error.status ? error.message : "Unable to record this sale. Please retry with the same form." });
    } finally {
        if (session) await session.endSession();
    }
};

module.exports = { getWorkspace, createWalkInTicket };
