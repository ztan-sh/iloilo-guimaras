const test = require("node:test");
const assert = require("node:assert/strict");
const Booking = require("../models/Booking");
const FerrySchedule = require("../models/FerrySchedule");
const mongoose = require("mongoose");
const FerryClosure = require("../models/FerryClosure");
const { getSchedulesForDate } = require("../controllers/ferryScheduleController");
const { belongsToTrip, hasMotorcycle, manilaDate, summarizeTrip, terminalFare } = require("../utils/staffTrip");
const { verifyBoarding, rejectBoarding, timeOutBooking } = require("../controllers/staffController");
const { createWalkInTicket } = require("../controllers/staffWorkspaceController");

const trip = { _id: "507f1f77bcf86cd799439011", route: "Iloilo → Guimaras", vesselName: "MV Halili", date: "2026-10-11", departureTime: "09:30", passengerCapacity: 100, motorcycleCapacity: 10, walkInMotorcycleCapacity: 4 };
const ticket = { _id: "507f1f77bcf86cd799439012", date: trip.date, time: "9:30 AM", origin: "Iloilo", destination: "Guimaras", vesselName: trip.vesselName, passengers: 2, vehicleType: "Motorcycle", paymentStatus: "VERIFIED", status: "CONFIRMED", boardingStatus: "NOT BOARDED" };
const response = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("matches the exact crossing, including legacy date and time formats", () => {
    assert.equal(belongsToTrip(ticket, trip), true);
    assert.equal(belongsToTrip({ ...ticket, date: "10/11/2026" }, trip), true);
    for (const change of [{ time: "10:00" }, { date: "2026-10-12" }, { origin: "Guimaras", destination: "Iloilo" }, { vesselName: "MV Felipe III" }]) assert.equal(belongsToTrip({ ...ticket, ...change }, trip), false);
});

test("paid capacity counts every passenger and excludes unpaid and cancelled tickets", () => {
    const records = [ticket, { ...ticket, passengers: 1, ticketSource: "WALK_IN", boardingStatus: "ON BOARD" }, { ...ticket, passengers: 5, paymentStatus: "PENDING VERIFICATION" }, { ...ticket, status: "CANCELLED" }];
    const result = summarizeTrip(trip, records);
    assert.equal(result.paidPassengers, 3);
    assert.equal(result.boardedPassengers, 1);
    assert.equal(result.onlineMotorcycles, 1);
    assert.equal(result.walkInMotorcycles, 1);
    assert.equal(result.onlineMotorcycleCapacity, 6);
    assert.equal(result.passengerCapacity, 100);
});

test("passenger-only records do not consume motorcycle capacity and zero capacity remains zero", () => {
    assert.equal(hasMotorcycle({ vehicleType: "No Motorcycle" }), false);
    assert.equal(hasMotorcycle({ vehicleType: "Motorcycle" }), true);
    assert.equal(summarizeTrip({ ...trip, motorcycleCapacity: 0 }, []).motorcycleCapacity, 0);
    assert.equal(summarizeTrip({ ...trip, walkInMotorcycleCapacity: 99 }, []).walkInMotorcycleCapacity, 10);
});

test("uses Manila calendar date across the UTC midnight boundary", () => {
    assert.equal(manilaDate(new Date("2026-10-10T17:00:00Z")), "2026-10-11");
});

test("terminal fare matches the current passenger checkout", () => {
    assert.deepEqual(terminalFare(2, true), { passengerFare: 80, motorcycleFare: 150, ppaFee: 65, requiredAmount: 295 });
    assert.equal(terminalFare(1, false).requiredAmount, 105);
});

test("walk-in cash tickets validate without invented age, gender or uploaded proof", async () => {
    const booking = new Booking({ ...ticket, ticketSource: "WALK_IN", bookingReference: "GG-W-TEST", passengerName: "Alex", ...terminalFare(2, true), paymentMethod: "Cash" });
    await booking.validate();
    const online = new Booking({ ...booking.toObject(), ticketSource: "ONLINE" });
    await assert.rejects(online.validate(), /passengerAge|passengerGender|paymentProof/);
});

test("unpaid and already boarded tickets cannot be boarded", async t => {
    let selected = { ...ticket, paymentStatus: "PENDING VERIFICATION" };
    t.mock.method(Booking, "findById", async () => selected);
    const mutation = t.mock.method(Booking, "findOneAndUpdate", async () => ticket);
    const req = { params: { id: ticket._id }, staff: { name: "Staff" }, body: {} };
    let res = response(); await verifyBoarding(req, res); assert.equal(res.statusCode, 400);
    selected = { ...ticket, boardingStatus: "ON BOARD" };
    res = response(); await verifyBoarding(req, res); assert.equal(res.statusCode, 400);
    assert.equal(mutation.mock.callCount(), 0);
});

test("boarding verifies the selected trip and changes state atomically", async t => {
    t.mock.method(Booking, "findById", async () => ticket);
    t.mock.method(FerrySchedule, "findOne", async () => trip);
    const mutation = t.mock.method(Booking, "findOneAndUpdate", async () => ({ ...ticket, boardingStatus: "ON BOARD" }));
    const res = response();
    await verifyBoarding({ params: { id: ticket._id }, body: { tripId: trip._id }, staff: { name: "Ava" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(mutation.mock.calls[0].arguments[0].boardingStatus, "NOT BOARDED");
    assert.equal(mutation.mock.calls[0].arguments[1].$set.boardedByName, "Ava");
});

test("another departure on the same vessel is rejected on the server", async t => {
    t.mock.method(Booking, "findById", async () => ({ ...ticket, time: "10:00" }));
    t.mock.method(FerrySchedule, "findOne", async () => trip);
    const mutation = t.mock.method(Booking, "findOneAndUpdate", async () => ticket);
    const res = response();
    await verifyBoarding({ params: { id: ticket._id }, body: { tripId: trip._id }, staff: {} }, res);
    assert.equal(res.statusCode, 400); assert.equal(mutation.mock.callCount(), 0);
});

test("a simultaneous boarding update returns conflict rather than counting twice", async t => {
    t.mock.method(Booking, "findById", async () => ticket);
    t.mock.method(Booking, "findOneAndUpdate", async () => null);
    const res = response();
    await verifyBoarding({ params: { id: ticket._id }, body: {}, staff: {} }, res);
    assert.equal(res.statusCode, 409);
});

test("arrival requires a boarded ticket and only records the first arrival", async t => {
    t.mock.method(Booking, "findById", async () => ({ ...ticket, boardingStatus: "ON BOARD" }));
    const mutation = t.mock.method(Booking, "findOneAndUpdate", async () => ({ ...ticket, timedOutAt: new Date() }));
    const res = response();
    await timeOutBooking({ params: { id: ticket._id }, body: {} }, res);
    assert.equal(res.statusCode, 200); assert.equal(mutation.mock.calls[0].arguments[0].timedOutAt, null);
});

test("rejection keeps admin payment state and excludes boarded tickets atomically", async t => {
    t.mock.method(Booking, "findById", async () => ticket);
    const mutation = t.mock.method(Booking, "findOneAndUpdate", async () => ticket);
    const res = response();
    await rejectBoarding({ params: { id: ticket._id }, body: { reason: "Identity could not be verified." } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(mutation.mock.calls[0].arguments[0].boardingStatus.$nin, ["ON BOARD", "REJECTED"]);
    assert.equal(mutation.mock.calls[0].arguments[1].$set.paymentStatus, undefined);
});

const sale = { tripId: trip._id, saleId: "507f1f77bcf86cd799439013", passengerName: "Alex", passengers: 1, accompanyingPassengers: [], vehicleType: "Motorcycle", motorcycleModel: "Honda Click", plateNumber: "ABC 123", paymentReceived: true, totalCollected: 255 };

test("walk-in sale requires cash confirmation and a server-calculated fare", async () => {
    for (const change of [{ paymentReceived: false }, { totalCollected: 1 }, { passengers: 2, accompanyingPassengers: [] }]) {
        const res = response(); await createWalkInTicket({ body: { ...sale, ...change }, staff: {} }, res); assert.equal(res.statusCode, 400);
    }
});

test("retrying the same terminal sale returns the original ticket", async t => {
    t.mock.method(Booking, "findById", async () => ({ ticketSource: "WALK_IN", recordedBy: "staff-1", bookingReference: "GG-W-ORIGINAL" }));
    const res = response(); await createWalkInTicket({ body: sale, staff: { staffId: "staff-1" } }, res);
    assert.equal(res.statusCode, 200); assert.equal(res.body.booking.bookingReference, "GG-W-ORIGINAL");
});

test("walk-in sales enforce reservations, walk-in quota and total capacity", async t => {
    t.mock.timers.enable({ apis: ["Date"], now: Date.UTC(2026, 9, 11, 0) });
    t.mock.method(Booking, "findById", async () => null);
    t.mock.method(mongoose, "startSession", async () => ({ withTransaction: async fn => fn(), endSession: async () => {} }));
    t.mock.method(FerrySchedule, "findOneAndUpdate", async () => ({ ...trip, walkInMotorcycleCapacity: 0 }));
    t.mock.method(Booking, "find", () => ({ session: () => ({ lean: async () => [] }) }));
    const create = t.mock.method(Booking, "create", async () => [ticket]);
    const res = response(); await createWalkInTicket({ body: sale, staff: { staffId: "staff-1" } }, res);
    assert.equal(res.statusCode, 409); assert.equal(create.mock.callCount(), 0);
});

test("schedule availability reserves the walk-in allocation within the unchanged total", async t => {
    t.mock.method(FerrySchedule, "findOneAndUpdate", async () => null);
    t.mock.method(FerrySchedule, "find", () => ({ sort: async () => [trip] }));
    t.mock.method(Booking, "find", () => ({ lean: async () => [ticket, { ...ticket, ticketSource: "WALK_IN" }, { ...ticket, time: "10:00" }, { ...ticket, vehicleType: "No Motorcycle" }] }));
    t.mock.method(FerryClosure, "findOne", () => ({ lean: async () => null }));
    const res = response(); await getSchedulesForDate({ query: { date: trip.date } }, res);
    const schedule = res.body.schedules[0];
    assert.equal(schedule.motorcycleCapacity, 10);
    assert.equal(schedule.onlineMotorcycleCapacity, 6);
    assert.equal(schedule.vehicleRemaining, 5);
    assert.equal(schedule.motorcycles, 2);
    assert.equal(schedule.passengers, 6);
});

test("cash sale creates a confirmed ticket with the original fare and no fabricated proof", async t => {
    t.mock.timers.enable({ apis: ["Date"], now: Date.UTC(2026, 9, 11, 0) });
    t.mock.method(Booking, "findById", async () => null);
    t.mock.method(mongoose, "startSession", async () => ({ withTransaction: async fn => fn(), endSession: async () => {} }));
    t.mock.method(FerrySchedule, "findOneAndUpdate", async () => trip);
    t.mock.method(Booking, "find", () => ({ session: () => ({ lean: async () => [] }) }));
    const create = t.mock.method(Booking, "create", async rows => rows);
    const res = response(); await createWalkInTicket({ body: sale, staff: { staffId: "staff-1", name: "Ava" } }, res);
    assert.equal(res.statusCode, 201);
    const saved = create.mock.calls[0].arguments[0][0];
    assert.equal(saved.totalPaid, 255); assert.equal(saved.paymentStatus, "VERIFIED");
    assert.equal(saved.status, "CONFIRMED"); assert.equal(saved.ticketSource, "WALK_IN");
    assert.equal(saved.paymentProof, undefined); assert.equal(saved.passengerAge, undefined);
    assert.equal(saved.recordedBy, "staff-1");
    await new Booking(saved).validate();
});
