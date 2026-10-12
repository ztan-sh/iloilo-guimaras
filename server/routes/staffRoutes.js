const express = require("express");

const router = express.Router();


// =========================================================
// STAFF AUTHENTICATION
// =========================================================

const staffAuth = require("../middleware/staffAuth");
const { getWorkspace, createWalkInTicket } = require("../controllers/staffWorkspaceController");

router.get("/workspace", staffAuth, getWorkspace);
router.post("/walk-in", staffAuth, createWalkInTicket);


// =========================================================
// STAFF CONTROLLER
// =========================================================

const {
    getBookingByReferenceForStaff,
    verifyBoarding,
    timeOutBooking,
    rejectBoarding,
    getTodayBoardingBookings,
    getBoardingStatistics
} = require("../controllers/staffController");


// =========================================================
// STAFF BOOKING LOOKUP
// =========================================================
//
// Staff scans the passenger QR code.
//
// GET /api/staff/bookings/reference/:bookingReference
//
// =========================================================

router.get(
    "/bookings/reference/:bookingReference",
    staffAuth,
    getBookingByReferenceForStaff
);


// =========================================================
// STAFF BOARDING BOOKINGS
// =========================================================
//
// GET /api/staff/boarding
//
// =========================================================

router.get(
    "/boarding",
    staffAuth,
    getTodayBoardingBookings
);


// =========================================================
// STAFF BOARDING STATISTICS
// =========================================================
//
// GET /api/staff/statistics
//
// =========================================================

router.get(
    "/statistics",
    staffAuth,
    getBoardingStatistics
);


// =========================================================
// VERIFY / BOARD PASSENGER
// =========================================================
//
// PUT /api/staff/bookings/:id/board
//
// This matches StaffScanner.jsx:
//
// api.put(`/staff/bookings/${booking._id}/board`)
//
// =========================================================

router.put(
    "/bookings/:id/board",
    staffAuth,
    verifyBoarding
);


// =========================================================
// TIME OUT / CONFIRM ARRIVAL
// =========================================================
// PUT /api/staff/bookings/:id/timeout
// =========================================================

router.put(
    "/bookings/:id/timeout",
    staffAuth,
    timeOutBooking
);


// =========================================================
// REJECT PASSENGER BOARDING
// =========================================================
//
// PUT /api/staff/bookings/:id/reject
//
// =========================================================

router.put(
    "/bookings/:id/reject",
    staffAuth,
    rejectBoarding
);


// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;
