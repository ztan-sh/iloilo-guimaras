import { boardingIssue, hasMotorcycle, matchesTrip, passengerCount, todayInManila } from "./staffUtils.js";
import { discountCategory, operationsStore, passengerIdentity, personIssue, quoteRide } from "../../components/operations/operationsStore.js";

export const sampleTickets = [
    { label: "Paid ticket", reference: "GG-DEMO-VALID" },
    { label: "Already boarded", reference: "GG-DEMO-USED" },
    { label: "Unpaid ticket", reference: "GG-DEMO-UNPAID" },
    { label: "Wrong trip", reference: "GG-DEMO-WRONG" }
];

const fares = { passenger: 40, motorcycle: 150, ppa: 65 };
const copy = value => structuredClone(value);
const fail = (message, status = 400, booking) => {
    const error = new Error(message);
    error.response = { status, data: { message, ...(booking ? { booking: copy(booking) } : {}) } };
    throw error;
};

// This adapter is used only by the local design-preview routes. All changes
// stay in memory; it does not create a session or contact the real API.
export const createStaffPreviewApi = () => {
    const initialDate = todayInManila();
    const schedules = [
        { id: "preview-iloilo", vesselName: "MV Halili", route: "Iloilo → Guimaras", departureTime: "09:30", arrivalTime: "10:00", passengerCapacity: 100, motorcycleCapacity: 10, walkInMotorcycleCapacity: 2 },
        { id: "preview-guimaras", vesselName: "MV Halili", route: "Guimaras → Iloilo", departureTime: "10:15", arrivalTime: "10:45", passengerCapacity: 100, motorcycleCapacity: 10, walkInMotorcycleCapacity: 2 },
        ...["Felipe III", "Lite Ferry 22"].map((vesselName, i) => ({ id: `preview-vessel-${i}`, vesselName, route: "Iloilo → Guimaras", departureTime: "09:30", arrivalTime: "10:00", passengerCapacity: 100, motorcycleCapacity: 10, walkInMotorcycleCapacity: 2 }))
    ];
    const base = {
        date: initialDate, origin: "Iloilo", destination: "Guimaras", time: "09:30", vesselName: "MV Halili",
        passengers: 1, accompanyingPassengers: [], vehicleType: "Motorcycle", motorcycleModel: "Honda Click", plateNumber: "ABC 1234",
        ticketSource: "ONLINE", paymentStatus: "VERIFIED", status: "CONFIRMED", boardingStatus: "NOT BOARDED",
        paymentMethod: "GCash", totalPaid: 255, paidAt: `${initialDate}T08:45:00+08:00`, boardedAt: null, timedOutAt: null
    };
    const bookings = [
        { ...base, _id: "preview-valid", bookingReference: "GG-DEMO-VALID", passengerName: "Sarah Fukiko", passengers: 2, accompanyingPassengers: ["Ana Fukiko"], passengerDetails: [{ id: "sample-sarah", name: "Sarah Fukiko", age: 24, gender: "Female", category: "Student", savedProfile: true }, { id: "sample-ana", name: "Ana Fukiko", age: 23, gender: "Female", category: "Student" }], totalPaid: 295 },
        { ...base, _id: "preview-used", bookingReference: "GG-DEMO-USED", passengerName: "Paolo Santos", boardingStatus: "ON BOARD", boardedAt: `${initialDate}T09:08:00+08:00`, boardedByName: "Terminal staff" },
        { ...base, _id: "preview-walk-in", bookingReference: "GG-DEMO-WALKIN", passengerName: "Nika Garcia", ticketSource: "WALK_IN", paymentMethod: "Cash", boardingStatus: "ON BOARD", boardedAt: `${initialDate}T09:04:00+08:00` },
        { ...base, _id: "preview-passenger", bookingReference: "GG-DEMO-PASSENGER", passengerName: "Miguel Reyes", vehicleType: "No Motorcycle", motorcycleModel: "", plateNumber: "", totalPaid: 105 },
        { ...base, _id: "preview-unpaid", bookingReference: "GG-DEMO-UNPAID", passengerName: "Andrea Cruz", paymentStatus: "PENDING", status: "PENDING", totalPaid: 0, paidAt: null },
        { ...base, _id: "preview-wrong", bookingReference: "GG-DEMO-WRONG", passengerName: "Luis Rivera", origin: "Guimaras", destination: "Iloilo", time: "10:15" }
    ];

    const allBookings = () => [...bookings, ...operationsStore.getSnapshot().bookings.filter(item => !bookings.some(booking => booking._id === item._id))];
    const tripById = (id, date) => {
        const schedule = schedules.find(trip => trip.id === id);
        if (!schedule) fail("Select a sample departure.");
        return { ...schedule, date };
    };
    const statistics = trip => {
        const paid = allBookings().filter(b => matchesTrip(b, trip) && b.paymentStatus === "VERIFIED" && b.status === "CONFIRMED" && b.boardingStatus !== "REJECTED");
        const online = paid.filter(b => b.ticketSource !== "WALK_IN");
        const walkIn = paid.filter(b => b.ticketSource === "WALK_IN");
        const boarded = paid.filter(b => b.boardingStatus === "ON BOARD");
        const passengers = records => records.reduce((total, b) => total + passengerCount(b), 0);
        const motorcycles = records => records.filter(hasMotorcycle).length;
        return {
            passengerCapacity: trip.passengerCapacity, motorcycleCapacity: trip.motorcycleCapacity,
            onlineMotorcycleCapacity: trip.motorcycleCapacity - trip.walkInMotorcycleCapacity, walkInMotorcycleCapacity: trip.walkInMotorcycleCapacity,
            paidPassengers: passengers(paid), onlinePassengers: passengers(online), walkInPassengers: passengers(walkIn),
            motorcycles: motorcycles(paid), onlineMotorcycles: motorcycles(online), walkInMotorcycles: motorcycles(walkIn),
            boardedPassengers: passengers(boarded), boardedMotorcycles: motorcycles(boarded)
        };
    };
    const respond = value => ({ data: copy(value) });
    const wait = async signal => {
        await new Promise(resolve => setTimeout(resolve, 180));
        if (signal?.aborted) throw new DOMException("Request cancelled", "AbortError");
    };

    return {
        async get(url, config = {}) {
            await wait(config.signal);
            if (url === "/staff/workspace") {
                const date = config.params?.date || initialDate;
                return respond({ date, fares, trips: schedules.map(schedule => {
                    const trip = { ...schedule, date };
                    return { ...trip, statistics: statistics(trip) };
                }), bookings: allBookings().filter(b => b.date === date) });
            }
            const reference = decodeURIComponent(url.split("/").pop());
            const booking = allBookings().find(b => b.bookingReference.toUpperCase() === reference.toUpperCase());
            if (!booking) fail("Ticket not found. Choose a sample ticket or enter its reference.", 404);
            return respond({ booking });
        },
        async put(url, body = {}) {
            await wait();
            const [, id, action] = url.match(/\/bookings\/([^/]+)\/(board|timeout|reject)$/) || [];
            const original = allBookings().find(b => b._id === id);
            const booking = original && copy(original);
            if (!booking) fail("Sample ticket not found.", 404);
            const trip = tripById(body.tripId, booking.date);
            let message;
            if (action === "board") {
                const issue = boardingIssue(booking, trip);
                if (issue) fail(issue.detail, 400, booking);
                Object.assign(booking, { boardingStatus: "ON BOARD", boardedAt: new Date().toISOString(), boardedByName: "Terminal staff" });
                message = "Passenger marked as boarded successfully.";
            } else if (action === "timeout") {
                if (!matchesTrip(booking, trip) || booking.boardingStatus !== "ON BOARD" || booking.timedOutAt) fail("This ticket cannot be timed out again.", 409, booking);
                booking.timedOutAt = new Date().toISOString();
                message = "Passenger arrival and time out confirmed successfully.";
            } else {
                if (booking.boardingStatus !== "NOT BOARDED" || !body.reason?.trim()) fail("A reason and an unused ticket are required.", 400, booking);
                Object.assign(booking, { boardingStatus: "REJECTED", status: "CANCELLED", rejectionReason: body.reason.trim() });
                message = "Passenger boarding has been rejected.";
            }
            const local = bookings.findIndex(item => item._id === id);
            if (local >= 0) bookings[local] = booking; else operationsStore.updateBooking(id, booking);
            return respond({ booking, message });
        },
        async post(url, body = {}) {
            await wait();
            if (url !== "/staff/walk-in") fail("This action is unavailable in the design preview.");
            const previous = allBookings().find(b => b._id === body.saleId);
            if (previous) return respond({ booking: previous });
            const trip = tripById(body.tripId, body.date || initialDate);
            const motorcycle = body.vehicleType === "Motorcycle";
            const ops = operationsStore.getSnapshot();
            let quote;
            const prices = ops.prices[trip.vesselName];
            if (body.operations) {
                if (!Array.isArray(body.passengerDetails) || body.passengerDetails.length !== body.passengers || body.passengerDetails.some(personIssue)) fail("Complete each passenger’s individual details.");
                if (!body.regularFare && body.passengerDetails.some(person => discountCategory(person) !== "Regular" && !ops.requests.some(request => request.identity === passengerIdentity(person) && request.status === "approved" && request.photo))) fail("Approve each eligible ID or explicitly choose the regular fare.");
                if (motorcycle && (!body.motorcycleModel?.trim() || !body.plateNumber?.trim())) fail("Enter the motorcycle model and plate number.");
                quote = quoteRide(prices, body.passengerDetails, motorcycle, ops.requests, body.regularFare);
            }
            if (!Number.isInteger(body.passengers) || body.passengers < 1 || body.passengers > (motorcycle ? 3 : 10)) fail("Choose a valid passenger count.");
            const total = quote ? quote.total : body.passengers * fares.passenger + (motorcycle ? fares.motorcycle : 0) + fares.ppa;
            if (!body.passengerName?.trim() || !body.paymentReceived || body.totalCollected !== total) fail("Enter passenger details and confirm the collected cash.");
            const s = statistics(trip);
            if (s.paidPassengers + body.passengers > s.passengerCapacity || (motorcycle && (s.walkInMotorcycles >= s.walkInMotorcycleCapacity || s.motorcycles >= s.motorcycleCapacity))) fail("This sample departure has insufficient capacity.", 409);
            const [origin, destination] = trip.route.split(" → ");
            const booking = {
                ...base, _id: body.saleId, bookingReference: `GG-DEMO-W-${body.saleId.slice(-6).toUpperCase()}`,
                date: trip.date, time: trip.departureTime, vesselName: trip.vesselName, origin, destination, passengerName: body.passengerName,
                passengers: body.passengers, accompanyingPassengers: body.accompanyingPassengers, vehicleType: body.vehicleType,
                motorcycleModel: motorcycle ? body.motorcycleModel : "", plateNumber: motorcycle ? body.plateNumber : "",
                ticketSource: "WALK_IN", paymentMethod: "Cash", totalPaid: total, requiredAmount: total, paidAt: new Date().toISOString(), createdAt: new Date().toISOString(),
                ...(quote ? { passengerDetails: copy(body.passengerDetails), fareSnapshot: { prices: copy(prices), ...quote } } : {})
            };
            operationsStore.addBooking(booking);
            return respond({ booking });
        }
    };
};
