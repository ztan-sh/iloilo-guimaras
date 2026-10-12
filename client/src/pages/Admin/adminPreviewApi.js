import { deriveEvents, normalizeTrip, todayInManila, tripLabel, tripStatistics } from "./adminUtils.js";
import { operationsStore } from "../../components/operations/operationsStore.js";
import { createId } from "../../utils/createId.js";

const copy = value => structuredClone(value);
const fail = (message, status = 400) => {
    const error = new Error(message);
    error.response = { status, data: { message } };
    throw error;
};

// A local, resettable adapter. It never calls the API or writes authentication.
export const createAdminPreviewApi = () => {
    const date = todayInManila();
    let sequence = 4;
    const schedules = ["09:30", "10:30", "11:30", "12:30"].map((time, i) => normalizeTrip({
        id: `admin-preview-trip-${i}`, vesselName: "MV Halili", date,
        route: i % 2 ? "Guimaras → Iloilo" : "Iloilo → Guimaras", departureTime: time,
        arrivalTime: `${time.slice(0, 2) === "09" ? "10" : String(Number(time.slice(0, 2)) + 1)}:00`,
        passengerCapacity: 100, motorcycleCapacity: 10, walkInMotorcycleCapacity: 2
    }));
    schedules.push(...["Felipe III", "Lite Ferry 22"].map((vesselName, i) => normalizeTrip({ id: `admin-preview-vessel-${i}`, vesselName, date, route: "Iloilo → Guimaras", departureTime: "09:30", arrivalTime: "10:00", passengerCapacity: 100, motorcycleCapacity: 10, walkInMotorcycleCapacity: 2 })));
    const stamp = time => `${date}T${time}:00+08:00`;
    const base = { date, origin: "Iloilo", destination: "Guimaras", time: "09:30", vesselName: "MV Halili",
        passengers: 1, vehicleType: "Motorcycle", motorcycleModel: "Honda Click", plateNumber: "ABC 1234",
        ticketSource: "ONLINE", paymentStatus: "VERIFIED", status: "CONFIRMED", boardingStatus: "NOT BOARDED",
        paymentMethod: "GCash", paidAt: stamp("08:12"), createdAt: stamp("08:10"), totalPaid: 255, requiredAmount: 255 };
    const bookings = [
        { ...base, _id: "admin-sarah", bookingReference: "GGO-0001", paymentReference: "PAY-0001", passengerName: "Sarah Fukiko", passengers: 2, accompanyingPassengers: ["Ana Fukiko"], passengerDetails: [{ id: "sample-sarah", name: "Sarah Fukiko", age: 24, gender: "Female", category: "Student", savedProfile: true }, { id: "sample-ana", name: "Ana Fukiko", age: 23, gender: "Female", category: "Student" }], requiredAmount: 295, totalPaid: 295 },
        { ...base, _id: "admin-paolo", bookingReference: "GGO-0002", paymentReference: "PAY-0002", passengerName: "Paolo Santos", motorcycleModel: "Yamaha Mio", plateNumber: "DEF 5678", paidAt: stamp("08:18"), boardingStatus: "ON BOARD", boardedAt: stamp("09:02"), boardedByName: "Terminal staff" },
        { ...base, _id: "admin-nika", bookingReference: "GGO-0003", paymentReference: "PAY-0003", passengerName: "Nika Garcia", passengers: 2, accompanyingPassengers: ["Luis Garcia"], ticketSource: "WALK_IN", paymentMethod: "Cash", motorcycleModel: "Honda Beat", plateNumber: "GHI 9012", totalPaid: 295, requiredAmount: 295, paidAt: stamp("08:25"), boardingStatus: "ON BOARD", boardedAt: stamp("09:04"), boardedByName: "Terminal staff" },
        { ...base, _id: "admin-miguel", bookingReference: "GGO-0004", paymentReference: "PAY-0004", passengerName: "Miguel Reyes", vehicleType: "No Motorcycle", plateNumber: "", motorcycleModel: "", totalPaid: 105, requiredAmount: 105 },
        ...["Rosa Cruz", "Andrea Lopez", "Carlo Ramos"].map((name, i) => ({ ...base, _id: `admin-attempt-${i}`, bookingReference: `GG-PENDING-${i}`, paymentReference: `PAY-00${19 + i}`, passengerName: name,
            paymentStatus: i === 2 ? "REJECTED" : "PENDING VERIFICATION", status: i === 2 ? "CANCELLED" : "PENDING PAYMENT VERIFICATION", totalPaid: null, paidAt: null, updatedAt: stamp(`09:0${5 + i}`) })),
        ...Array.from({ length: 10 }, (_, i) => ({ ...base, _id: `admin-full-${i}`, bookingReference: `GGO-FULL-${i + 1}`, passengerName: `Sample group ${i + 1}`, passengers: 10,
            accompanyingPassengers: Array.from({ length: 9 }, (_, p) => `Sample passenger ${i + 1}.${p + 2}`), time: "11:30", ticketSource: i >= 8 ? "WALK_IN" : "ONLINE", requiredAmount: 615, totalPaid: 615 }))
    ];
    const scheduleEvents = [{ id: "preview-schedule-initial", time: stamp("07:30"), event: "Schedule updated", detail: "Departure set to 09:30 AM", reference: "HL-0930", actor: "Administrator", result: "Saved" }];
    const allBookings = () => [...bookings, ...operationsStore.getSnapshot().bookings.filter(item => !bookings.some(booking => booking._id === item._id))];
    const respond = value => ({ data: copy(value) });
    const wait = async signal => {
        await new Promise(resolve => setTimeout(resolve, 120));
        if (signal?.aborted) throw new DOMException("Request cancelled", "AbortError");
    };
    const save = (id, body) => {
        const existing = id ? schedules.find(trip => trip.id === id) : null;
        if (id && !existing) fail("Sample trip not found.", 404);
        if (schedules.some(trip => trip.id !== id && trip.date === body.date && trip.vesselName === body.vesselName && trip.departureTime === body.departureTime)) fail("This vessel already has a trip at that departure time.", 409);
        const trip = normalizeTrip({ ...body, id: id || `admin-preview-trip-${sequence++}` });
        if (existing) Object.assign(existing, trip); else schedules.push(trip);
        scheduleEvents.push({ id: `preview-event-${createId()}`, time: new Date().toISOString(), event: id ? "Schedule updated" : "Schedule created", detail: `Departure ${trip.departureTime}`, reference: tripLabel(trip), actor: "Administrator", result: "Saved" });
        return respond({ schedule: trip, message: "Trip saved." });
    };
    return {
        async get(url, config = {}) {
            await wait(config.signal);
            if (url === "/admin/me") return respond({ admin: { name: "Administrator", email: "admin@guimarasgo.example" } });
            if (url === "/bookings") return respond({ bookings: allBookings() });
            if (url === "/bookings/schedules") return respond({ schedules: schedules.filter(trip => trip.date === (config.params?.date || date)).map(trip => ({ ...trip, passengers: tripStatistics(allBookings(), trip).paidPassengers })) });
            if (url === "/preview/admin/events") return respond({ events: [...deriveEvents(allBookings(), []), ...scheduleEvents].sort((a, b) => new Date(b.time) - new Date(a.time)) });
            fail("This preview action is unavailable.", 404);
        },
        async post(url, body) { await wait(); if (url !== "/bookings/schedules") fail("Preview action unavailable."); return save(null, body); },
        async put(url, body) { await wait(); if (!url.startsWith("/bookings/schedules/")) fail("Preview action unavailable."); return save(url.split("/").pop(), body); }
    };
};
