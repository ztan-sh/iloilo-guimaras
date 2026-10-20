const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Booking = require("../models/Booking");

// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const uploadDirectory = path.join(
    __dirname,
    "../uploads/payment-proofs"
);

// Create folder automatically
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory);
    },

    filename: function (req, file, cb) {
        const extension =
            path.extname(file.originalname);

        const uniqueName =
            `payment-${Date.now()}-${Math.round(
                Math.random() * 1e9
            )}${extension}`;

        cb(null, uniqueName);
    }
});

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only image files are allowed."
            ),
            false
        );
    }
};

// =====================================================
// UPLOAD CONFIGURATION
// =====================================================

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter
});

// =====================================================
// UPLOAD PAYMENT PROOF
// =====================================================

const uploadPaymentProof = (
    req,
    res
) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message:
                "Payment proof is required."
        });
    }

    const file = req.file;

    const fileUrl =
        `/uploads/payment-proofs/${file.filename}`;

    return res.status(200).json({
        success: true,

        message:
            "Payment proof uploaded successfully.",

        file: {
            filename: file.filename,

            originalName:
                file.originalname,

            mimetype:
                file.mimetype,

            size:
                file.size,

            url:
                fileUrl
        }
    });
};

// =====================================================
// CREATE BOOKING
// =====================================================

const createBooking = async (
    req,
    res
) => {

    try {

        const {
            bookingReference,
            origin,
            destination,
            date,
            time,
            ferryId,
            ferryName,
            vesselName,
            departureTime,
            passengerName,
            passengerAge,
            passengerGender,
            passengers,
            vehicleType,
            plateNumber,
            passengerFare,
            motorcycleFare,
            stampFee,
            ppaFee,
            requiredAmount,
            paymentMethod,
            paymentProof
        } = req.body;

        // =============================================
        // CHECK DUPLICATE BOOKING
        // =============================================

        const existingBooking =
            await Booking.findOne({
                bookingReference
            });

        if (existingBooking) {

            return res.status(409).json({
                success: false,
                message:
                    "Booking reference already exists."
            });

        }

        // =============================================
        // CREATE BOOKING
        // =============================================

        const booking =
            await Booking.create({

                bookingReference,

                origin,

                destination,

                date,

                time,

                ferryId: ferryId || "",

                ferryName: ferryName || vesselName || "",

                vesselName: vesselName || ferryName || "",

                departureTime: departureTime || time || "",

                passengerName,

                passengerAge,

                passengerGender,

                passengers,

                vehicleType,

                plateNumber,

                passengerFare,

                motorcycleFare,

                stampFee: Number(stampFee) || 0,

                ppaFee,

                discountAmount: Math.max(0, Math.round((
                    (Number(passengerFare) || 0)
                    + (Number(motorcycleFare) || 0)
                    + (Number(stampFee) || 0)
                    + (Number(ppaFee) || 0)
                    - (Number(requiredAmount) || 0)
                ) * 100) / 100),

                requiredAmount,

                verifiedAmount: null,

                paymentMethod:
                    paymentMethod ||
                    "Maya / QRPh",

                paymentStatus:
                    "PENDING VERIFICATION",

                status:
                    "PENDING PAYMENT VERIFICATION",

                paymentProof: {
                    fileName:
                        paymentProof?.fileName,

                    originalName:
                        paymentProof?.originalName,

                    fileType:
                        paymentProof?.fileType,

                    fileSize:
                        paymentProof?.fileSize,

                    url:
                        paymentProof?.url,

                    uploadedAt:
                        new Date()
                }
            });

        return res.status(201).json({

            success: true,

            message:
                "Booking submitted successfully.",

            booking
        });

    } catch (error) {

        console.error(
            "Create booking error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to create booking.",

            error:
                error.message
        });
    }
};

// =====================================================
// GET PENDING BOOKINGS
// =====================================================

const getPendingBookings = async (
    req,
    res
) => {

    try {

        const bookings =
            await Booking.find({
                paymentStatus:
                    "PENDING VERIFICATION"
            })
            .sort({
                createdAt: -1
            });

        res.json({
            success: true,
            bookings
        });

    } catch (error) {

        console.error(
            "Get pending bookings error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to retrieve bookings."
        });
    }
};

// =====================================================
// VERIFY PAYMENT
// =====================================================

const verifyPayment = async (
    req,
    res
) => {

    try {

        const {
            verifiedAmount,
            action
        } = req.body;

        const booking =
            await Booking.findById(
                req.params.id
            );

        if (!booking) {

            return res.status(404).json({
                success: false,
                message:
                    "Booking not found."
            });
        }

        const amount =
            Number(verifiedAmount);

        if (
            !Number.isFinite(amount) ||
            amount < 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid payment amount."
            });
        }

        booking.verifiedAmount =
            amount;

        // =============================================
        // APPROVE
        // =============================================

        if (action === "approve") {

            if (
                amount <
                booking.requiredAmount
            ) {

                booking.paymentStatus =
                    "UNDERPAID";

                booking.status =
                    "PENDING PAYMENT VERIFICATION";

            } else {

                booking.paymentStatus =
                    "VERIFIED";

                booking.status =
                    "CONFIRMED";
            }
        }

        // =============================================
        // REJECT
        // =============================================

        if (action === "reject") {

            booking.paymentStatus =
                "REJECTED";

            booking.status =
                "REJECTED";
        }

        await booking.save();

        return res.json({

            success: true,

            message:
                "Payment verification updated.",

            booking
        });

    } catch (error) {

        console.error(
            "Verify payment error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to verify payment."
        });
    }
};

module.exports = {
    upload,
    uploadPaymentProof,
    createBooking,
    getPendingBookings,
    verifyPayment
};
