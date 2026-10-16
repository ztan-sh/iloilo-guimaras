import { hasMotorcycle, matchesTrip, passengerCount, todayInManila } from "../Staff/staffUtils.js";

export { formatTime, formatTimestamp, formatTripDate, money, sourceLabel, todayInManila } from "../Staff/staffUtils.js";
export { hasMotorcycle, passengerCount };

export const timeValue = value => {
    const match = String(value || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return "";
    const hour = match[3] ? Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0) : Number(match[1]);
    return `${String(hour).padStart(2, "0")}:${match[2]}`;
};

export const normalizeTrip = trip => {
    const motorcycles = Number(trip.motorcycleCapacity ?? trip.vehicleCapacity ?? 10);
    const walkIn = Math.min(motorcycles, Math.max(0, Number(trip.walkInMotorcycleCapacity) || 0));
    return { ...trip, id: String(trip._scheduleId || trip.scheduleId || trip._id || trip.id),
        departureTime: timeValue(trip.time || trip.departureTime), arrivalTime: timeValue(trip.arrivalTime),
        passengerCapacity: Number(trip.passengerCapacity ?? 100), motorcycleCapacity: motorcycles,
        walkInMotorcycleCapacity: walkIn, onlineMotorcycleCapacity: motorcycles - walkIn };
};

export const tripLabel = trip => {
    if (!trip) return "—";
    const name = trip.vesselName.replace(/^M\/?V\s*/i, "");
    const code = (name.replace(/[aeiou\s]/gi, "").slice(0, 2) || name.slice(0, 2)).toUpperCase();
    return `${code}-${timeValue(trip.departureTime).replace(":", "")}`;
};
export const weekdayDate = date => new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Manila", weekday: "long", day: "2-digit", month: "long"
}).format(new Date(`${date || todayInManila()}T12:00:00+08:00`));

export const isPaid = booking => booking.paymentStatus === "VERIFIED";
export const isValidTicket = booking => isPaid(booking) && booking.status === "CONFIRMED" && booking.boardingStatus !== "REJECTED";
export const paymentState = booking => isPaid(booking) ? "Paid" : booking.paymentStatus === "REJECTED" ? "Failed" : "Processing";
export const paymentReference = booking => booking.paymentReference || booking.bookingReference || booking._id;
export const paymentAmount = booking => Number(isPaid(booking) ? booking.totalPaid ?? booking.requiredAmount : booking.requiredAmount) || 0;
export const paymentTime = booking => booking.paidAt || booking.updatedAt || booking.createdAt;
export const boardingState = booking => booking.boardingStatus === "ON BOARD" ? "Boarded" : booking.boardingStatus === "REJECTED" || booking.status === "CANCELLED" ? "Rejected" : "Ready";
export const recordsForTrip = (bookings, trip) => bookings.filter(booking => matchesTrip(booking, trip));

export const tripStatistics = (bookings, trip) => {
    const records = recordsForTrip(bookings, trip);
    const paid = records.filter(isValidTicket);
    const online = paid.filter(b => b.ticketSource !== "WALK_IN");
    const walkIn = paid.filter(b => b.ticketSource === "WALK_IN");
    const boarded = paid.filter(b => b.boardingStatus === "ON BOARD");
    const passengers = rows => rows.reduce((total, b) => total + passengerCount(b), 0);
    const motorcycles = rows => rows.filter(hasMotorcycle).length;
    return { paid, records, paidPassengers: passengers(paid), onlinePassengers: passengers(online), walkInPassengers: passengers(walkIn),
        motorcycles: motorcycles(paid), onlineMotorcycles: motorcycles(online), walkInMotorcycles: motorcycles(walkIn),
        boardedPassengers: passengers(boarded), boardedMotorcycles: motorcycles(boarded),
        revenue: records.filter(isPaid).reduce((total, b) => total + paymentAmount(b), 0) };
};

export const tripState = (trip, bookings) => {
    if (trip.manualClosed) return "Closed";
    const reserved = trip.passengers ?? tripStatistics(bookings, trip).paidPassengers;
    return reserved >= trip.passengerCapacity ? "Sold out" : "Ready";
};

export const passengerNames = booking => {
    const full = (booking.passengerDetails || []).map(p => typeof p === "string" ? p : p.name).filter(Boolean);
    const names = full.length ? full : [booking.passengerName, ...(booking.accompanyingPassengers || [])].filter(Boolean);
    return Array.from({ length: passengerCount(booking) }, (_, i) => names[i] || (i === 0 ? "Name not recorded" : `Accompanying passenger ${i}`));
};
export const passengerRows = bookings => bookings.flatMap(booking => passengerNames(booking).map((name, index) => ({
    booking, name, index, role: index === 0 ? "Ticket holder" : "Accompanying passenger"
})));

export const matchesSearch = (query, ...values) => values.join(" ").toLowerCase().includes(query.trim().toLowerCase());
export const timestampDate = value => value ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)) : "";

export const manilaMonth = date => String(date || todayInManila()).slice(0, 7);
export const monthTitle = month => new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00+08:00`));
export function monthlyTicketReport(bookings, month) {
    const [year, monthNumber] = String(month || manilaMonth()).split("-").map(Number);
    if (!year || monthNumber < 1 || monthNumber > 12) return { rows: [], tickets: 0, bookings: 0, revenue: 0 };
    const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const rows = Array.from({ length: dayCount }, (_, index) => {
        const day = String(index + 1).padStart(2, "0");
        const date = `${year}-${String(monthNumber).padStart(2, "0")}-${day}`;
        const label = new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", weekday: "short", day: "2-digit", month: "short" }).format(new Date(`${date}T12:00:00+08:00`));
        return { date, label, tickets: 0, bookings: 0, revenue: 0, cumulativeTickets: 0 };
    });
    const byDate = new Map(rows.map(row => [row.date, row]));
    for (const booking of bookings) {
        if (!isValidTicket(booking)) continue;
        // paidAt is the actual sale date; createdAt is a safe fallback for legacy tickets.
        const saleDate = timestampDate(booking.paidAt || booking.createdAt);
        if (!saleDate.startsWith(`${month}-`)) continue;
        const row = byDate.get(saleDate);
        if (!row) continue;
        row.tickets += passengerCount(booking);
        row.bookings += 1;
        row.revenue += paymentAmount(booking);
    }
    let tickets = 0;
    let totalBookings = 0;
    let revenue = 0;
    for (const row of rows) {
        tickets += row.tickets;
        totalBookings += row.bookings;
        revenue += row.revenue;
        row.cumulativeTickets = tickets;
    }
    return { rows, tickets, bookings: totalBookings, revenue };
}

// Existing records expose the latest payment state and boarding timestamps,
// rather than a persisted audit history. Do not invent missing events or actors.
export const deriveEvents = (bookings, schedules) => {
    const events = bookings.flatMap(b => {
        const rows = [];
        const time = paymentTime(b);
        if (time) rows.push({ id: `${b._id}-payment`, time, event: b.paidAt ? "Payment confirmed" : "Payment record updated",
            detail: b.paidAt ? "Successful payment" : "Latest recorded payment state", reference: paymentReference(b),
            actor: b.recordedByName || "Payment record", result: paymentState(b) });
        if (b.boardedAt) rows.push({ id: `${b._id}-boarded`, time: b.boardedAt, event: "Boarding recorded",
            detail: `${passengerCount(b)} passengers · ${hasMotorcycle(b) ? 1 : 0} motorcycle`, reference: b.bookingReference,
            actor: b.boardedByName || "Terminal staff", result: "Boarded" });
        if (b.rejectedAt) rows.push({ id: `${b._id}-rejected`, time: b.rejectedAt, event: "Boarding rejected",
            detail: b.rejectionReason || "Rejected boarding", reference: b.bookingReference, actor: "Boarding record", result: "Rejected" });
        return rows;
    });
    for (const trip of schedules) if (trip.updatedAt || trip.createdAt) events.push({ id: `${trip.id}-schedule`, time: trip.updatedAt || trip.createdAt,
        event: "Schedule updated", detail: `Departure ${trip.departureTime}`, reference: tripLabel(trip), actor: "Schedule record", result: "Saved" });
    return events.sort((a, b) => new Date(b.time) - new Date(a.time));
};
