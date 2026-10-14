const test = require('node:test');
const assert = require('node:assert/strict');
const Booking = require('../models/Booking');
const paymentRoutes = require('../routes/paymentRoutes');

const createBooking = paymentRoutes.stack.find(layer => layer.route?.path === '/create-booking').route.stack.at(-1).handle;
const owner = '507f1f77bcf86cd799439011';
const body = {
    bookingReference: 'GG-UI-CHECK', origin: 'Iloilo', destination: 'Guimaras',
    date: '2026-10-14', time: '09:30', passengerName: 'Test Passenger',
    passengerAge: 24, passengerGender: 'Female', passengers: 1,
    vehicleType: 'Motorcycle', plateNumber: 'TEST 123', passengerFare: 40,
    motorcycleFare: 150, ppaFee: 65, requiredAmount: 255, paymentMethod: 'Maya / QRPh',
    paymentProof: { fileName: 'test.png', originalName: 'test.png', fileType: 'image/png', fileSize: 100, url: '/uploads/payment-proofs/test.png' }
};
const response = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } });

test('client motorcycle answers are stored without changing fares, ownership, or payment state', async t => {
    t.mock.method(console, 'log', () => {});
    t.mock.method(Booking, 'findOne', async () => null);
    t.mock.method(Booking.prototype, 'save', async function () { await this.validate(); return this; });
    for (const motorcycleType of ['standard', 'big-bike']) {
        const res = response();
        await createBooking({ user: { userId: owner }, body: { ...body, motorcycleType, userId: 'ignored-client-owner' } }, res);
        assert.equal(res.statusCode, 201);
        const saved = res.body.booking.toObject();
        assert.equal(saved.motorcycleType, motorcycleType);
        assert.equal(saved.vehicleType, 'Motorcycle');
        assert.equal(String(saved.userId), owner);
        assert.equal(saved.motorcycleFare, 150);
        assert.equal(saved.requiredAmount, 255);
        assert.equal(saved.paymentStatus, 'PENDING VERIFICATION');
        assert.equal(saved.totalPaid, null);
    }
    const legacy = response();
    await createBooking({ user: { userId: owner }, body }, legacy);
    assert.equal(legacy.body.booking.motorcycleType, 'standard');
    const passengerOnly = response();
    await createBooking({ user: { userId: owner }, body: { ...body, vehicleType: 'No Motorcycle', motorcycleType: 'big-bike', motorcycleFare: 0, requiredAmount: 105 } }, passengerOnly);
    assert.equal(passengerOnly.body.booking.motorcycleType, '');
});

test('invalid motorcycle answers are rejected before reserving or saving a booking', async t => {
    t.mock.method(console, 'log', () => {});
    const find = t.mock.method(Booking, 'findOne', async () => null);
    const save = t.mock.method(Booking.prototype, 'save', async function () { return this; });
    const res = response();
    await createBooking({ user: { userId: owner }, body: { ...body, motorcycleType: 'car' } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(find.mock.callCount(), 0);
    assert.equal(save.mock.callCount(), 0);
});
