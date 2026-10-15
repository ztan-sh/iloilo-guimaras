import { createId } from "../../utils/createId.js";

export const VESSELS = ["MV Halili", "MV FastCraft", "MV Felipe", "Felipe III", "Lite Ferry 22"];
export const DEFAULT_PRICES = Object.freeze({ solo: 35, motorcycle: 285, smallBikeStamp: 5, bigBike: 353, bigBikeStamp: 7, companion: 70, student: 20, pwd: 20, senior: 20, ppa: 65 });
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
export const passengerIdentity = person => JSON.stringify([person.id, person.name?.trim(), Number(person.age), person.gender, person.category]);
export const discountCategory = person => Number(person.age) >= 60 ? "Senior" : ["Student", "PWD"].includes(person.category) ? person.category : "Regular";
export function pricingIssue(prices) {
    if (Object.values(prices).some(value => value == null || value === "" || !Number.isFinite(Number(value)))) return "Enter valid amounts and percentages.";
    if (Object.values(prices).some(value => Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) > 0.000001)) return "Use at most two decimal places for fares and percentages.";
    if (prices.solo <= 0 || prices.motorcycle < prices.solo || Number(prices.bigBike) < 0 || prices.ppa < 0) return "Solo fare must be positive. Motorcycle fare must include at least the solo fare.";
    if (round(prices.companion) !== round(prices.solo * 2)) return "The companion fare must equal two solo passenger fares.";
    if ([prices.student, prices.pwd, prices.senior].some(value => value < 0 || value > 100)) return "Discount percentages must be between 0 and 100.";
    return "";
}
export function quoteRide(prices, passengers, motorcycle, requests = [], regularFare = false, motorcycleType = "standard") {
    const passengerFare = round(passengers.length * prices.solo);
    const motorcycleFare = motorcycle ? round(motorcycleType === "big-bike" ? Number(prices.bigBike ?? 353) : Number(prices.motorcycle ?? 285)) : 0;
    const stampFee = motorcycle ? round(motorcycleType === "big-bike" ? Number(prices.bigBikeStamp ?? 7) : Number(prices.smallBikeStamp ?? 5)) : 0;
    const discounts = passengers.map(person => {
        const category = discountCategory(person);
        const approval = requests.find(request => request.passenger.id === person.id && request.identity === passengerIdentity(person) && request.status === "approved" && request.photo);
        const percent = !regularFare && approval && category !== "Regular" ? Number(prices[category.toLowerCase()]) : 0;
        return { id: person.id, category, percent, amount: round(prices.solo * percent / 100) };
    });
    const discount = round(discounts.reduce((sum, item) => sum + item.amount, 0));
    return { passengerFare, motorcycleFare, stampFee, discounts, discount, ppa: prices.ppa, total: round(passengerFare + motorcycleFare + stampFee - discount + prices.ppa) };
}
export const personIssue = person => !person.name?.trim() || person.age == null || person.age === "" || !Number.isInteger(Number(person.age)) || Number(person.age) < 0 || Number(person.age) > 120 || !person.gender ? "Enter every passenger’s name, age and gender." : person.category === "Senior" && Number(person.age) < 60 ? "Senior eligibility begins at age 60." : "";
export const samplePhoto = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360"><rect width="600" height="360" rx="24" fill="#e4f5f2"/><text x="40" y="60" font-family="Arial" font-size="22" fill="#06655e">PREVIEW SAMPLE — NOT REAL IDENTIFICATION</text><rect x="40" y="90" width="140" height="190" rx="16" fill="#079d92"/><circle cx="110" cy="150" r="30" fill="#fff"/><path d="M60 250a50 50 0 0 1 100 0" fill="#fff"/><g font-family="Arial" fill="#1f1f1d"><text x="210" y="135" font-size="26">Sarah Fukiko</text><text x="210" y="180" font-size="22">Student · Age 24</text><text x="210" y="225" font-size="18">Sample valid student ID</text><text x="40" y="325" font-size="18">For testing the approval flow only</text></g></svg>');
const newId = createId;
const seed = () => {
    const sarah = { id: "sample-sarah", name: "Sarah Fukiko", age: 24, gender: "Female", category: "Student" };
    const ana = { id: "sample-ana", name: "Ana Fukiko", age: 23, gender: "Female", category: "Student" };
    return { prices: Object.fromEntries(VESSELS.map(vessel => [vessel, { ...DEFAULT_PRICES }])), drafts: {}, bookings: [],
        requests: [{ id: "sample-clear-id", passenger: sarah, identity: passengerIdentity(sarah), photo: samplePhoto, status: "pending", reason: "", source: "Sample account registration" },
            { id: "sample-missing-id", passenger: ana, identity: passengerIdentity(ana), photo: "", status: "pending", reason: "", source: "Sample booking GG-DEMO-VALID" }],
        events: [{ id: "sample-booking-update", type: "booking", title: "Booking received", detail: "Sarah Fukiko · Payment confirmed", bookingId: "preview-valid", adminBookingId: "admin-sarah", roles: ["staff", "admin"], time: new Date().toISOString() },
            { id: "sample-id-update", type: "discount", title: "Passenger IDs awaiting review", detail: "Two sample requests are ready to review.", roles: ["staff", "admin"], time: new Date().toISOString() }], read: { staff: [], admin: [] }, bookingVersion: 0 };
};

// All new mutations deliberately stay in the local frontend preview.
// The normal workspace never reads or writes this sample store.
export function createOperationsStore() {
    let state = seed();
    const listeners = new Set();
    const commit = patch => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };
    const event = (type, title, detail, extra = {}) => ({ id: newId(), type, title, detail, roles: ["staff", "admin"], time: new Date().toISOString(), ...extra });
    return {
        getSnapshot: () => state,
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        reset() { state = seed(); listeners.forEach(listener => listener()); },
        savePrices(vessel, prices) {
            if (!VESSELS.includes(vessel)) throw new Error("Choose a supported vessel.");
            const issue = pricingIssue(prices); if (issue) throw new Error(issue);
            commit({ prices: { ...state.prices, [vessel]: Object.fromEntries(Object.entries(prices).map(([key, value]) => [key, Number(value)])) }, events: [event("pricing", "Vessel pricing updated", `${vessel} · New bookings only`, { vessel }), ...state.events] });
        },
        saveDraft(id, draft) { commit({ drafts: { ...state.drafts, [id]: draft } }); },
        requestID(passenger, photo, source = "Assisted booking") {
            if (personIssue(passenger) || discountCategory(passenger) === "Regular") throw new Error("A complete eligible passenger profile is required.");
            const identity = passengerIdentity(passenger);
            const existing = state.requests.find(request => request.identity === identity && request.status !== "requested");
            if (existing) return existing.id;
            const id = newId();
            commit({ requests: [...state.requests, { id, passenger: { ...passenger }, identity, photo, status: "pending", reason: "", source }],
                events: [event("discount", "ID photo submitted for review", `${passenger.name} · ${discountCategory(passenger)}`, { requestId: id }), ...state.events] });
            return id;
        },
        decide(id, decision, reason = "") {
            const request = state.requests.find(item => item.id === id);
            if (!request || request.status !== "pending") throw new Error("This request has already been reviewed.");
            if (!["approved", "requested"].includes(decision)) throw new Error("Choose a valid review decision.");
            if (decision === "approved" && !request.photo) throw new Error("An ID photo is required before approval.");
            if (decision === "requested" && !reason.trim()) throw new Error("Give the passenger a reason for the new photo.");
            commit({ requests: state.requests.map(item => item.id === id ? { ...item, status: decision, reason: reason.trim(), reviewedAt: new Date().toISOString() } : item),
                events: [event("discount", decision === "approved" ? "Discount ID approved" : "New ID photo requested", `${request.passenger.name} · ${decision === "approved" ? "Individual eligibility approved; payment still required." : reason.trim()}`, { requestId: id }), ...state.events] });
        },
        markRead(role) { commit({ read: { ...state.read, [role]: state.events.filter(item => item.roles.includes(role)).map(item => item.id) } }); },
        addBooking(booking) {
            const existing = state.bookings.find(item => item._id === booking._id);
            if (existing) return existing;
            const saved = structuredClone(booking);
            commit({ bookings: [...state.bookings, saved], bookingVersion: state.bookingVersion + 1,
                events: [event("booking", booking.userId ? booking.paymentStatus === "VERIFIED" ? "Your ticket is ready" : booking.paymentStatus === "REJECTED" ? "Payment needs attention" : "Payment verification underway" : "Paid assisted booking issued", `${booking.passengerName} · ${booking.bookingReference}`, { bookingId: booking._id }), ...state.events] });
            return saved;
        },
        updateBooking(id, patch) { commit({ bookings: state.bookings.map(item => item._id === id ? { ...item, ...patch } : item), bookingVersion: state.bookingVersion + 1 }); }
    };
}
export const operationsStore = createOperationsStore();
