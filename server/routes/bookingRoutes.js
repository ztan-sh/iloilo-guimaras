const express = require("express");

const router = express.Router();

const adminAuth =
    require("../middleware/adminAuth");

const protect =
    require("../middleware/authMiddleware");

const Booking =
    require("../models/Booking");

const {

    getAllBookings,

    getPendingPayments,

    getVerifiedPayments,

    getBookingById,

    getBookingByReference,

    setFerryBookingStatus,

    verifyPayment,

    rejectPayment,

    getBookingStatistics,

    getBookingCapacity

} = require("../controllers/bookingController");


const {
    getSchedulesForDate,
    createSchedule,
    updateSchedule,
    deleteSchedule
} = require("../controllers/ferryScheduleController");


// =====================================================
// AUTHENTICATED PASSENGER BOOKINGS
// =====================================================
// Only bookings belonging to the logged-in passenger are returned.
// =====================================================

router.get(
    "/my",
    protect,
    async (req, res) => {
        try {
            const bookings =
                await Booking.find({
                    userId: req.user.userId
                }).sort({
                    createdAt: -1
                });

            return res.status(200).json({
                success: true,
                bookings
            });
        } catch (error) {
            console.error(
                "Get my bookings error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to retrieve your bookings."
            });
        }
    }
);


// =====================================================
// PUBLIC TOURIST BOOKING LOOKUP
// =====================================================
//
// Used by the tourist My Bookings page to retrieve
// the latest booking status from MongoDB.
//

router.get(
    "/reference/:bookingReference",
    protect,
    async (req, res) => {
        try {
            const booking =
                await Booking.findOne({
                    bookingReference: req.params.bookingReference,
                    $or: [
                        { userId: req.user.userId },
                        { userId: null },
                        { userId: { $exists: false } }
                    ]
                });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found."
                });
            }

            // Legacy bookings created before userId was added can still be
            // synchronized once by the authenticated passenger.
            if (!booking.userId) {
                booking.userId = req.user.userId;
                await booking.save();
            }

            return res.status(200).json({
                success: true,
                booking
            });
        } catch (error) {
            console.error(
                "Get passenger booking error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to retrieve booking."
            });
        }
    }
);


// =====================================================
// PUBLIC FERRY CAPACITY
// =====================================================
//
// Used by Trips.jsx to retrieve the latest passenger
// and motorcycle capacity for each ferry.
//
// IMPORTANT:
// This route is intentionally PUBLIC because tourists
// need to see available capacity before booking.
//
// DO NOT add adminAuth here.
//

router.get(
    "/capacity",
    getBookingCapacity
);


// =====================================================
// PUBLIC FERRY SCHEDULE AVAILABILITY
// =====================================================
//
// Used by BookTrip.jsx to display the Admin-managed
// ferry schedule for the travel date selected by the
// passenger. This endpoint is intentionally public.
//
router.get(
    "/schedules/available",
    getSchedulesForDate
);


// =====================================================
// ADMIN FERRY SCHEDULE MANAGEMENT
// =====================================================

router.get(
    "/schedules",
    adminAuth,
    getSchedulesForDate
);

router.post(
    "/schedules",
    adminAuth,
    createSchedule
);

router.put(
    "/schedules/:id",
    adminAuth,
    updateSchedule
);

router.delete(
    "/schedules/:id",
    adminAuth,
    deleteSchedule
);


// =====================================================
// ADMIN DASHBOARD STATISTICS
// =====================================================

router.get(
    "/statistics",
    adminAuth,
    getBookingStatistics
);


// =====================================================
// ADMIN PENDING PAYMENTS
// =====================================================

router.get(
    "/pending-payments",
    adminAuth,
    getPendingPayments
);


// =====================================================
// ADMIN VERIFIED PAYMENTS
// =====================================================

router.get(
    "/verified-payments",
    adminAuth,
    getVerifiedPayments
);


// =====================================================
// ADMIN SEARCH BOOKING BY REFERENCE
// =====================================================
//
// Example:
//
// GET
// /api/bookings/search/reference/GG-123456
//
// IMPORTANT:
//
// We use the existing getBookingByReference controller
// instead of creating a duplicate controller function.
//
// adminAuth is still applied, so only administrators
// can use this search endpoint.
//

router.get(
    "/search/reference/:bookingReference",
    adminAuth,
    getBookingByReference
);


// =====================================================
// ADMIN ALL BOOKINGS
// =====================================================

router.get(
    "/",
    adminAuth,
    getAllBookings
);



// =====================================================
// ADMIN FERRY ONLINE BOOKING CONTROL
// =====================================================

router.put(
    "/ferry-closure",
    adminAuth,
    setFerryBookingStatus
);

// =====================================================
// ADMIN SINGLE BOOKING
// =====================================================

router.get(
    "/:id",
    adminAuth,
    getBookingById
);


// =====================================================
// ADMIN VERIFY PAYMENT
// =====================================================

router.put(
    "/:id/verify",
    adminAuth,
    verifyPayment
);


// =====================================================
// ADMIN REJECT PAYMENT
// =====================================================

router.put(
    "/:id/reject",
    adminAuth,
    rejectPayment
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;