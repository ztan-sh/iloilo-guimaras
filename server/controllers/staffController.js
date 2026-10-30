const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const FerrySchedule = require("../models/FerrySchedule");
const Notification = require("../models/Notification");
const { manilaDate, belongsToTrip } = require("../utils/staffTrip");
const { recordActivity } = require("../utils/activityAudit");

const getBookingByReferenceForStaff = async (req, res) => {
    try {
        const booking = await Booking.findOne({ bookingReference: String(req.params.bookingReference || "").trim() });
        if (!booking) {
            await recordActivity({ req, actorRole: "staff", actorId: req.staff.staffId, actorName: req.staff.name, actorEmail: req.staff.email,
                action: "Ticket lookup unsuccessful", summary: `${req.staff.name} looked up an unrecognized ticket reference`, entityType: "ticket", subject: String(req.params.bookingReference || "").trim() });
            return res.status(404).json({ success: false, message: "Ticket not found. Check the booking reference and try again." });
        }
        await recordActivity({ req, actorRole: "staff", actorId: req.staff.staffId, actorName: req.staff.name, actorEmail: req.staff.email,
            action: "Scanned ticket", summary: `${req.staff.name} scanned ${booking.bookingReference} for ${booking.passengerName}`,
            entityType: "ticket", entityId: booking._id, subject: booking.bookingReference,
            details: { passengerName: booking.passengerName, vesselName: booking.vesselName || booking.ferryName || "", route: `${booking.origin || ""} → ${booking.destination || ""}`, date: booking.date || "", departureTime: booking.departureTime || booking.time || "" } });
        res.json({ success: true, booking });
    } catch (error) {
        console.error("Staff ticket lookup error:", error);
        res.status(500).json({ success: false, message: "Unable to retrieve booking information." });
    }
};

const findBooking = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400).json({ success: false, message: "Invalid booking ID." });
        return null;
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) res.status(404).json({ success: false, message: "Booking not found." });
    return booking;
};

const validateSelectedTrip = async (req, res, booking) => {
    // Older staff clients did not send a selected departure. The new desktop
    // flow always supplies it and validates the exact crossing on the server.
    if (!req.body?.tripId) return true;
    if (!mongoose.Types.ObjectId.isValid(req.body.tripId)) {
        res.status(400).json({ success: false, message: "Invalid selected trip." });
        return false;
    }
    const trip = await FerrySchedule.findOne({ _id: req.body.tripId, active: { $ne: false } });
    if (!trip || !belongsToTrip(booking, trip)) {
        res.status(400).json({ success: false, message: "This ticket does not match the selected trip.", booking });
        return false;
    }
    return true;
};

const verifyBoarding = async (req, res) => {
    try {
        const booking = await findBooking(req, res);
        if (!booking) return;
        if (booking.paymentStatus !== "VERIFIED" || booking.status !== "CONFIRMED") return res.status(400).json({ success: false, message: "Payment and booking must be confirmed before boarding.", booking });
        if (booking.boardingStatus !== "NOT BOARDED") return res.status(400).json({ success: false, message: booking.boardingStatus === "ON BOARD" ? "Passenger is already marked as boarded." : "This ticket has been rejected for boarding.", booking });
        if (!await validateSelectedTrip(req, res, booking)) return;
        const updated = await Booking.findOneAndUpdate({ _id: booking._id, paymentStatus: "VERIFIED", status: "CONFIRMED", boardingStatus: "NOT BOARDED" }, { $set: { boardingStatus: "ON BOARD", boardedAt: new Date(), boardedByName: req.staff.name || "Terminal staff" } }, { new: true, runValidators: true });
        if (!updated) return res.status(409).json({ success: false, message: "This ticket was updated by another staff member. Scan it again.", booking: await Booking.findById(booking._id) });
        req.auditLogged = true;
        await recordActivity({ req, actorRole: "staff", actorId: req.staff.staffId, actorName: req.staff.name, actorEmail: req.staff.email,
            action: "Boarded passenger", summary: `${req.staff.name} boarded ${updated.passengerName} on ticket ${updated.bookingReference}`,
            entityType: "ticket", entityId: updated._id, subject: updated.bookingReference,
            details: { passengerName: updated.passengerName, vesselName: updated.vesselName || updated.ferryName || "", route: `${updated.origin || ""} → ${updated.destination || ""}`, date: updated.date || "", departureTime: updated.departureTime || updated.time || "" } });
        res.json({ success: true, message: "Passenger marked as boarded successfully.", booking: updated });
    } catch (error) {
        console.error("Verify boarding error:", error);
        res.status(500).json({ success: false, message: "Unable to verify passenger boarding." });
    }
};

const timeOutBooking = async (req, res) => {
    try {
        const booking = await findBooking(req, res);
        if (!booking) return;
        if (booking.paymentStatus !== "VERIFIED" || booking.status !== "CONFIRMED" || booking.boardingStatus !== "ON BOARD" || booking.timedOutAt) return res.status(400).json({ success: false, message: booking.timedOutAt ? "Passenger arrival has already been confirmed." : "A confirmed, paid and boarded ticket is required to record arrival.", booking });
        if (!await validateSelectedTrip(req, res, booking)) return;
        const updated = await Booking.findOneAndUpdate({ _id: booking._id, paymentStatus: "VERIFIED", status: "CONFIRMED", boardingStatus: "ON BOARD", timedOutAt: null }, { $set: { timedOutAt: new Date() } }, { new: true, runValidators: true });
        if (!updated) return res.status(409).json({ success: false, message: "Arrival was already recorded or this ticket was updated. Scan it again.", booking: await Booking.findById(booking._id) });
        req.auditLogged = true;
        await recordActivity({ req, actorRole: "staff", actorId: req.staff.staffId, actorName: req.staff.name, actorEmail: req.staff.email,
            action: "Confirmed passenger arrival", summary: `${req.staff.name} confirmed arrival for ${updated.passengerName} on ticket ${updated.bookingReference}`,
            entityType: "ticket", entityId: updated._id, subject: updated.bookingReference,
            details: { passengerName: updated.passengerName, vesselName: updated.vesselName || updated.ferryName || "", date: updated.date || "" } });
        res.json({ success: true, message: "Passenger arrival and time out confirmed successfully.", booking: updated });
    } catch (error) {
        console.error("Time out booking error:", error);
        res.status(500).json({ success: false, message: "Unable to confirm passenger arrival." });
    }
};

const rejectBoarding = async (req, res) => {
    try {
        const reason = req.body?.reason;
        if (typeof reason !== "string" || !reason.trim() || reason.trim().length > 500) return res.status(400).json({ success: false, message: "A rejection reason of 1–500 characters is required." });
        const booking = await findBooking(req, res);
        if (!booking) return;
        const updated = await Booking.findOneAndUpdate({ _id: booking._id, boardingStatus: { $nin: ["ON BOARD", "REJECTED"] } }, { $set: { boardingStatus: "REJECTED", status: "CANCELLED", rejectionReason: reason.trim(), rejectedAt: new Date() } }, { new: true, runValidators: true });
        if (!updated) return res.status(409).json({ success: false, message: "This ticket has already been boarded or rejected.", booking: await Booking.findById(booking._id) });
        if (updated.userId) {
            try {
                await Notification.create({
                    userId: updated.userId,
                    bookingId: updated._id,
                    bookingReference: updated.bookingReference || updated._id.toString(),
                    type: "BOARDING_REJECTED",
                    title: "Boarding rejected",
                    message: `Boarding for booking ${updated.bookingReference || ""} was rejected. Reason: ${reason.trim()}`
                });
            } catch (notificationError) {
                console.error("Create boarding rejection notification error:", notificationError);
            }
        }
        req.auditLogged = true;
        await recordActivity({ req, actorRole: "staff", actorId: req.staff.staffId, actorName: req.staff.name, actorEmail: req.staff.email,
            action: "Rejected ticket for boarding", summary: `${req.staff.name} rejected ${updated.passengerName} on ticket ${updated.bookingReference}`,
            entityType: "ticket", entityId: updated._id, subject: updated.bookingReference,
            details: { passengerName: updated.passengerName, reason: reason.trim(), vesselName: updated.vesselName || updated.ferryName || "", date: updated.date || "" } });
        res.json({ success: true, message: "Passenger boarding has been rejected.", booking: updated });
    } catch (error) {
        console.error("Reject boarding error:", error);
        res.status(500).json({ success: false, message: "Unable to reject passenger boarding." });
    }
};

const getTodayBoardingBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ date: manilaDate(), paymentStatus: "VERIFIED", status: "CONFIRMED", boardingStatus: "NOT BOARDED" }).sort({ time: 1 });
        res.json({ success: true, count: bookings.length, bookings });
    } catch (error) {
        console.error("Staff boarding list error:", error);
        res.status(500).json({ success: false, message: "Unable to retrieve today's boarding bookings." });
    }
};

const getBoardingStatistics = async (req, res) => {
    try {
        const date = manilaDate();
        const filters = [{}, { status: "CONFIRMED" }, { paymentStatus: "VERIFIED" }, { boardingStatus: "NOT BOARDED" }, { boardingStatus: "ON BOARD" }, { boardingStatus: "REJECTED" }];
        const [totalBookings, confirmedBookings, verifiedPayments, notBoarded, boarded, rejected] = await Promise.all(filters.map(filter => Booking.countDocuments({ date, ...filter })));
        res.json({ success: true, statistics: { date, totalBookings, confirmedBookings, verifiedPayments, notBoarded, boarded, rejected } });
    } catch (error) {
        console.error("Staff statistics error:", error);
        res.status(500).json({ success: false, message: "Unable to retrieve boarding statistics." });
    }
};

module.exports = { getBookingByReferenceForStaff, verifyBoarding, timeOutBooking, rejectBoarding, getTodayBoardingBookings, getBoardingStatistics };
