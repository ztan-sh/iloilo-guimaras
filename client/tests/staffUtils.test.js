import test from "node:test";
import assert from "node:assert/strict";
import { boardingIssue, extractBookingReference, hasMotorcycle, matchesTrip } from "../src/pages/Staff/staffUtils.js";

const trip = { id: "trip-1", route: "Iloilo → Guimaras", vesselName: "MV Halili", date: "2026-10-11", departureTime: "09:30" };
const booking = { date: "10/11/2026", time: "9:30 AM", origin: "Iloilo", destination: "Guimaras", vesselName: "MV Halili", paymentStatus: "VERIFIED", status: "CONFIRMED", boardingStatus: "NOT BOARDED" };

test("supports current, legacy and manual ticket references", () => {
    for (const text of ['{"type":"FERRY_TICKET","bookingReference":"GG-123456"}', "Booking Reference:\nGG-123456", "GG-123456", "Reference: GG-123456"]) assert.equal(extractBookingReference(text), "GG-123456");
    assert.equal(extractBookingReference("GGO-0002"), "GGO-0002");
    assert.equal(extractBookingReference("GG-W-ABCD1234"), "GG-W-ABCD1234");
    assert.equal(extractBookingReference("unrelated QR payload"), null);
});

test("UI rejects another crossing on the same vessel", () => {
    assert.equal(matchesTrip(booking, trip), true);
    assert.equal(matchesTrip({ ...booking, time: "10:00" }, trip), false);
    assert.equal(boardingIssue({ ...booking, date: "2026-10-12" }, trip).title, "Ticket belongs to another trip");
});

test("unpaid, cancelled and used tickets cannot show valid for boarding", () => {
    assert.equal(boardingIssue(booking, trip), null);
    for (const change of [{ paymentStatus: "PENDING VERIFICATION" }, { status: "CANCELLED" }, { boardingStatus: "ON BOARD" }, { boardingStatus: "REJECTED" }]) assert.ok(boardingIssue({ ...booking, ...change }, trip));
    assert.equal(hasMotorcycle({ vehicleType: "No Motorcycle" }), false);
});
