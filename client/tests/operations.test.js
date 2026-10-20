import test from "node:test";
import assert from "node:assert/strict";
import { createOperationsStore, DEFAULT_PRICES, discountCategory, operationsStore, personIssue, quoteRide } from "../src/components/operations/operationsStore.js";
import { createStaffPreviewApi } from "../src/pages/Staff/staffPreviewApi.js";
import { createAdminPreviewApi } from "../src/pages/Admin/adminPreviewApi.js";

test("discounts require matching individual IDs and exclude motorcycle and PPA charges", () => {
    const store = createOperationsStore();
    const [sarah, ana] = store.getSnapshot().requests.map(item => item.passenger);
    assert.equal(quoteRide(DEFAULT_PRICES, [sarah, ana], true, store.getSnapshot().requests).total, 425);
    assert.throws(() => store.decide("sample-missing-id", "approved"), /photo is required/);
    store.decide("sample-clear-id", "approved");
    const quote = quoteRide(DEFAULT_PRICES, [sarah, ana], true, store.getSnapshot().requests);
    assert.deepEqual([quote.passengerFare, quote.motorcycleFare, quote.discount, quote.ppa, quote.total], [70, 285, 7, 65, 418]);
    assert.equal(quoteRide(DEFAULT_PRICES, [{ ...sarah, name: "Different person" }], false, store.getSnapshot().requests).discount, 0);
    assert.equal(quoteRide(DEFAULT_PRICES, [sarah], false, store.getSnapshot().requests, true).total, 100);
    assert.equal(discountCategory({ ...sarah, category: "Regular", age: 60 }), "Senior");
    assert.equal(personIssue({ ...sarah, age: 59, category: "Senior" }), "Senior eligibility begins at age 60.");
});

test("review decisions require a reason, remain terminal, and do not create a payment", () => {
    const store = createOperationsStore();
    assert.throws(() => store.decide("sample-missing-id", "requested"), /reason/);
    store.decide("sample-missing-id", "requested", "Unclear photo");
    assert.throws(() => store.decide("sample-missing-id", "approved"), /already been reviewed/);
    const state = store.getSnapshot();
    assert.equal(state.requests[1].reason, "Unclear photo");
    assert.equal(state.bookings.length, 0);
    const resubmission = store.requestID(state.requests[1].passenger, "data:image/png;base64,sample");
    assert.notEqual(resubmission, "sample-missing-id");
    store.decide(resubmission, "approved");
    assert.equal(quoteRide(DEFAULT_PRICES, [state.requests[1].passenger], false, store.getSnapshot().requests).discount, 7);
});

test("pricing changes affect only one vessel and leave paid receipts unchanged", () => {
    const store = createOperationsStore();
    store.addBooking({ _id: "paid", passengerName: "Sarah", totalPaid: 105, fareSnapshot: { prices: { ...DEFAULT_PRICES } } });
    store.savePrices("MV Felipe", { ...DEFAULT_PRICES, solo: 80, motorcycle: 230, companion: 160 });
    const state = store.getSnapshot();
    assert.equal(state.prices["MV Halili"].solo, 35);
    assert.equal(state.prices["MV Felipe"].solo, 80);
    assert.equal(state.bookings[0].totalPaid, 105);
    assert.equal(state.bookings[0].fareSnapshot.prices.solo, 35);
    assert.throws(() => store.savePrices("MV Felipe", { ...DEFAULT_PRICES, student: 101 }), /between 0 and 100/);
    store.markRead("admin");
    assert.equal(store.getSnapshot().read.staff.length, 0);
    assert.ok(store.getSnapshot().read.admin.includes(state.events[0].id));
});

test("assisted preview validates payment and capacity, shares tickets with Admin, and is idempotent", async () => {
    operationsStore.reset();
    const staff = createStaffPreviewApi();
    const workspace = (await staff.get("/staff/workspace")).data;
    const trip = workspace.trips.find(item => item.vesselName === "MV Halili");
    operationsStore.savePrices("MV Halili", { ...DEFAULT_PRICES, solo: 80, motorcycle: 230, companion: 160 });
    const person = { id: "test-person", name: "Test passenger", age: 30, gender: "Female", category: "Regular", savedProfile: true };
    const body = { operations: true, tripId: trip.id, date: trip.date, saleId: "test-sale", passengerName: person.name, passengers: 1, passengerDetails: [person], accompanyingPassengers: [], vehicleType: "No Motorcycle", totalCollected: 145, paymentReceived: true };
    await assert.rejects(staff.post("/staff/walk-in", { ...body, paymentReceived: false }), /confirm the collected cash/);
    await assert.rejects(staff.post("/staff/walk-in", { ...body, totalCollected: 105 }), /confirm the collected cash/);
    const booking = (await staff.post("/staff/walk-in", body)).data.booking;
    assert.equal(booking.totalPaid, 145);
    assert.equal((await staff.post("/staff/walk-in", body)).data.booking._id, booking._id);
    operationsStore.savePrices("MV Halili", { ...DEFAULT_PRICES, solo: 100, motorcycle: 250, companion: 200 });
    assert.equal((await createAdminPreviewApi().get("/bookings")).data.bookings.find(item => item._id === booking._id).totalPaid, 145);
    await staff.put(`/staff/bookings/${booking._id}/board`, { tripId: trip.id });
    await assert.rejects(staff.put(`/staff/bookings/${booking._id}/board`, { tripId: trip.id }), /second time/);
    assert.equal((await createAdminPreviewApi().get("/bookings")).data.bookings.find(item => item._id === booking._id).boardingStatus, "ON BOARD");
    await assert.rejects(staff.post("/staff/walk-in", { ...body, saleId: "oversized", passengers: 11, operations: false }), /valid passenger count/);
    operationsStore.reset();
});
