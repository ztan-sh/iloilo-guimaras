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
    deleteSchedule,
    resetSchedulesForDate
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
    "/schedules",
    adminAuth,
    resetSchedulesForDate
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
// ADMIN CANCEL BOOKING + CREATE PASSENGER NOTIFICATION
// =====================================================
// This is an in-app notification only. Email delivery is not claimed.
router.put("/:id/cancel", adminAuth, async (req, res) => {
    try {
        const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
        if (!reason) return res.status(400).json({ message: "A cancellation reason is required." });
        if (reason.length > 1000) return res.status(400).json({ message: "The cancellation reason must be 1,000 characters or fewer." });

        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found." });
        if (booking.status === "CANCELLED") return res.status(409).json({ message: "This booking is already cancelled." });

        booking.status = "CANCELLED";
        // Keep the reason on the record where the schema supports it; notification is the source of passenger-facing reason.
        await booking.save();

        let notificationCreated = false;
        if (booking.userId) {
            const Notification = require("../models/Notification");
            await Notification.create({
                userId: booking.userId,
                type: "booking_cancelled",
                title: "Booking cancelled by the terminal",
                message: `Booking ${booking.bookingReference} was cancelled. Reason: ${reason}`,
                bookingId: booking._id,
                bookingReference: booking.bookingReference
            });
            notificationCreated = true;
        }

        return res.json({
            message: notificationCreated
                ? "Booking cancelled and passenger in-app notification created."
                : "Booking cancelled. No linked passenger account was found, so an in-app notification could not be delivered.",
            notificationCreated,
            emailSent: false,
            booking: { id: booking._id, bookingReference: booking.bookingReference, status: booking.status }
        });
    } catch (error) {
        console.error("Cancel booking error:", error);
        return res.status(500).json({ message: "Unable to cancel booking." });
    }
});

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