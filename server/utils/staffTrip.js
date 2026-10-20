const manilaDate = (date = new Date()) => new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit"
}).format(date);

const normalizeDate = (value) => {
    const text = String(value || "").trim();
    const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return slash ? `${slash[3]}-${slash[1].padStart(2, "0")}-${slash[2].padStart(2, "0")}` : text;
};

const normalizeTime = (value) => {
    const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return "";
    let hour = Number(match[1]);
    if (match[3]) hour = hour % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
    if (hour > 23 || Number(match[2]) > 59) return "";
    return `${String(hour).padStart(2, "0")}:${match[2]}`;
};

const normalizeVessel = (value) => {
    const vessel = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
    // Older bookings used the former display name for the same ferry.
    if (/^(?:m\/?v\s+)?felipe iii$/.test(vessel)) return "mv felipe";
    return vessel;
};

const hasMotorcycle = (booking) => {
    const value = String(booking.vehicleType || "").toLowerCase().trim();
    return !["", "no motorcycle", "nomotorcycle", "no vehicle", "none", "passenger only", "passenger-only", "passenger"].includes(value)
        && value.includes("motorcycle");
};

// A vessel may make several crossings a day. Match date, direction and time,
// then identity; a vessel name alone must never combine separate departures.
const belongsToTrip = (booking, trip) => {
    const [origin, destination] = String(trip.route || "").split(/\s*→\s*/);
    const normalize = (value) => String(value || "").trim().toLowerCase();
    if (normalizeDate(booking.date) !== trip.date
        || normalizeTime(booking.time || booking.departureTime) !== normalizeTime(trip.departureTime || trip.time)
        || normalize(booking.origin) !== normalize(origin)
        || normalize(booking.destination) !== normalize(destination)) return false;
    const vesselNames = [booking.vesselName, booking.ferryName].filter(Boolean).map(normalizeVessel);
    const tripVessel = normalizeVessel(trip.vesselName);
    if (vesselNames.includes(tripVessel)) return true;
    const id = String(booking.ferryId || "");
    if (id && (id === String(trip._id || trip.id) || normalizeVessel(id) === tripVessel)) return true;
    return vesselNames.length === 0 && !id;
};

const summarizeTrip = (trip, records) => {
    const paid = records.filter(b => b.paymentStatus === "VERIFIED" && b.status === "CONFIRMED" && b.boardingStatus !== "REJECTED");
    const countPassengers = (items) => items.reduce((n, b) => n + Math.max(1, Number(b.passengers) || 1), 0);
    const countMotorcycles = (items) => items.filter(hasMotorcycle).length;
    const walkIn = paid.filter(b => b.ticketSource === "WALK_IN");
    const online = paid.filter(b => b.ticketSource !== "WALK_IN");
    const boarded = paid.filter(b => b.boardingStatus === "ON BOARD");
    const passengerCapacity = Number(trip.passengerCapacity) || 100;
    const motorcycleCapacity = Number(trip.motorcycleCapacity ?? 10);
    const walkInMotorcycleCapacity = Math.min(motorcycleCapacity, Math.max(0, Number(trip.walkInMotorcycleCapacity) || 0));
    return {
        paidPassengers: countPassengers(paid), onlinePassengers: countPassengers(online), walkInPassengers: countPassengers(walkIn),
        motorcycles: countMotorcycles(paid), onlineMotorcycles: countMotorcycles(online), walkInMotorcycles: countMotorcycles(walkIn),
        boardedPassengers: countPassengers(boarded), boardedMotorcycles: countMotorcycles(boarded),
        passengerCapacity, motorcycleCapacity, walkInMotorcycleCapacity,
        onlineMotorcycleCapacity: motorcycleCapacity - walkInMotorcycleCapacity
    };
};

// Keep terminal fare calculation aligned with the existing passenger checkout.
const terminalFare = (passengers, motorcycle) => ({
    passengerFare: passengers * 40, motorcycleFare: motorcycle ? 150 : 0,
    ppaFee: 65, requiredAmount: passengers * 40 + (motorcycle ? 150 : 0) + 65
});

module.exports = { manilaDate, normalizeDate, normalizeTime, hasMotorcycle, belongsToTrip, summarizeTrip, terminalFare };
