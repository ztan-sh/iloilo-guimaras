import test from "node:test";
import assert from "node:assert/strict";
import { deriveEvents, normalizeTrip, passengerRows, paymentAmount, recordsForTrip, tripStatistics } from "../src/pages/Admin/adminUtils.js";

const trip = normalizeTrip({ id: "trip-1", route: "Iloilo → Guimaras", vesselName: "MV Halili", date: "2026-10-11", departureTime: "9:30 AM", arrivalTime: "10:00 AM", passengerCapacity: 100, motorcycleCapacity: 10, walkInMotorcycleCapacity: 2 });
const base = { _id: "ticket-1", passengerName: "Sarah", passengers: 2, accompanyingPassengers: ["Ana"], bookingReference: "GG-1", date: "10/11/2026", time: "09:30", origin: "Iloilo", destination: "Guimaras", vesselName: "MV Halili", paymentStatus: "VERIFIED", status: "CONFIRMED", boardingStatus: "ON BOARD", vehicleType: "Motorcycle", totalPaid: 295 };

test("trip metrics exclude other crossings and unconfirmed or rejected tickets", () => {
    const records = [base, { ...base, _id: "walk-in", passengers: 1, ticketSource: "WALK_IN", vehicleType: "No Motorcycle", totalPaid: 105, boardingStatus: "NOT BOARDED" },
        { ...base, paymentStatus: "PENDING VERIFICATION", totalPaid: null }, { ...base, paymentStatus: "REJECTED", status: "CANCELLED", totalPaid: null },
        { ...base, time: "10:30" }, { ...base, date: "2026-10-12" }, { ...base, vesselName: "MV Felipe" }, { ...base, origin: "Guimaras", destination: "Iloilo" }];
    const stats = tripStatistics(records, trip);
    assert.equal(recordsForTrip(records, trip).length, 4);
    assert.deepEqual([stats.paidPassengers, stats.motorcycles, stats.boardedPassengers, stats.boardedMotorcycles, stats.revenue], [3, 1, 2, 1, 400]);
    assert.deepEqual([trip.departureTime, trip.arrivalTime, trip.onlineMotorcycleCapacity, trip.walkInMotorcycleCapacity], ["09:30", "10:00", 8, 2]);
});

test("manifest preserves companion rows without double-counting motorcycles", () => {
    const rows = passengerRows([base, { ...base, _id: "online", passengerDetails: [{ name: "Holder" }, { name: "Companion" }] }]);
    assert.deepEqual(rows.map(row => [row.name, row.index]), [["Sarah", 0], ["Ana", 1], ["Holder", 0], ["Companion", 1]]);
    assert.equal(rows[1].booking.bookingReference, "GG-1");
    assert.equal(paymentAmount({ ...base, totalPaid: 0, requiredAmount: 295 }), 0);
});

test("system records use available timestamps without inventing schedule history", () => {
    assert.deepEqual(deriveEvents([base], [trip]), []);
    const events = deriveEvents([{ ...base, paidAt: "2026-10-11T00:12:00Z", boardedAt: "2026-10-11T01:02:00Z", boardedByName: "Test staff" }], [trip]);
    assert.deepEqual(events.map(event => [event.event, event.actor, event.result]), [["Boarding recorded", "Test staff", "Boarded"], ["Payment confirmed", "Payment record", "Paid"]]);
});

test("legacy Felipe III schedules display as the supported MV Felipe vessel", () => {
    const legacy = normalizeTrip({ id: "legacy", vesselName: "MV Felipe III", departureTime: "04:00 AM" });
    assert.equal(legacy.vesselName, "MV Felipe");
    assert.equal(legacy.ferryName, "MV Felipe");
});
