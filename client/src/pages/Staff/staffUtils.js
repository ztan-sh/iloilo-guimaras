export const todayInManila = () => new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit"
}).format(new Date());

export const formatTripDate = (date, short = false) => date ? new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Manila", day: "2-digit", month: short ? "short" : "long", year: "numeric"
}).format(new Date(`${date}T12:00:00+08:00`)) : "—";

export const formatTime = (time) => {
    if (!time) return "—";
    const match = String(time).match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!match) return time;
    if (match[3]) return `${match[1].padStart(2, "0")}:${match[2]} ${match[3].toUpperCase()}`;
    const hour = Number(match[1]);
    return `${String(hour % 12 || 12).padStart(2, "0")}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
};

export const timeToMinutes = (time) => {
    const formatted = formatTime(time);
    const match = String(formatted).match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return Number.POSITIVE_INFINITY;
    const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
    return hour * 60 + Number(match[2]);
};

export const formatTimestamp = (value, date = false) => value ? new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Manila", ...(date ? { day: "2-digit", month: "short", year: "numeric" } : {}),
    hour: "2-digit", minute: "2-digit", hour12: true
}).format(new Date(value)).replace(/\b(am|pm)\b/gi, period => period.toUpperCase()) : "—";

export const money = (amount) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(amount) || 0);
export const sourceLabel = (booking) => booking.ticketSource === "WALK_IN" ? "Walk-in" : "Online";
export const passengerCount = (booking) => Math.max(1, Number(booking.passengers) || 1);

export const hasMotorcycle = (booking) => {
    const value = String(booking.vehicleType || "").toLowerCase().trim();
    return !["", "no motorcycle", "nomotorcycle", "no vehicle", "none", "passenger only", "passenger-only", "passenger"].includes(value) && value.includes("motorcycle");
};

const normalizeTime = (value) => {
    const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return "";
    const hour = match[3] ? Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0) : Number(match[1]);
    return `${String(hour).padStart(2, "0")}:${match[2]}`;
};

export const matchesTrip = (booking, trip) => {
    if (!trip) return false;
    const normalize = value => String(value || "").trim().toLowerCase();
    const [origin, destination] = trip.route.split(/\s*→\s*/);
    const slash = String(booking.date || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const date = slash ? `${slash[3]}-${slash[1].padStart(2, "0")}-${slash[2].padStart(2, "0")}` : booking.date;
    if (date !== trip.date || normalizeTime(booking.time || booking.departureTime) !== normalizeTime(trip.departureTime || trip.time)
        || normalize(booking.origin) !== normalize(origin) || normalize(booking.destination) !== normalize(destination)) return false;
    const vessel = normalize(booking.vesselName || booking.ferryName);
    if (vessel) return vessel === normalize(trip.vesselName);
    return !booking.ferryId || String(booking.ferryId) === trip.id || normalize(booking.ferryId) === normalize(trip.vesselName);
};

export const boardingIssue = (booking, trip) => {
    if (booking.boardingStatus === "REJECTED" || booking.status === "CANCELLED") return { title: "Boarding rejected", detail: booking.rejectionReason || "This ticket has been cancelled or rejected for boarding." };
    if (booking.paymentStatus !== "VERIFIED") return { title: "Payment is not confirmed", detail: "Payment must be verified by an administrator before this ticket can be boarded." };
    if (booking.status !== "CONFIRMED") return { title: "Booking is not confirmed", detail: "Ask an administrator to review this booking." };
    if (!matchesTrip(booking, trip)) return { title: "Ticket belongs to another trip", detail: "This ticket does not match the selected date, route, vessel and departure. Select its original trip before continuing." };
    if (booking.boardingStatus === "ON BOARD") return { title: booking.timedOutAt ? "Arrival already confirmed" : "Already boarded", detail: `This ticket was used at ${formatTimestamp(booking.boardedAt)}. Boarding cannot be recorded a second time.` };
    return null;
};

export const extractBookingReference = (text) => {
    const value = String(text || "").trim();
    if (!value) return null;
    try {
        const parsed = JSON.parse(value);
        const reference = parsed.bookingReference || parsed.booking_reference || parsed.reference || parsed.bookingRef || parsed.bookingCode;
        if (typeof reference === "string") return reference.trim();
    } catch { /* Older printed tickets contain labeled or plain references. */ }
    const labeled = value.match(/(?:Booking\s*Reference|Reference)\s*:\s*([A-Za-z0-9-]+)/i);
    if (labeled) return labeled[1];
    return value.match(/\b(?:GG|GGO)-[A-Za-z0-9-]+\b/i)?.[0] || null;
};
