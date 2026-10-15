const express = require("express");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const { Readable } = require("stream");

const Booking = require("../models/Booking");
const VesselPricing = require("../models/VesselPricing");
const FerrySchedule = require("../models/FerrySchedule");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =========================================================
// MONGODB GRIDFS STORAGE
// =========================================================
// New payment proofs are stored in MongoDB GridFS so they remain available
// on Render after restarts/redeployments. server.js must serve this bucket
// at /uploads/payment-proofs/:filename using the same bucket name.

const GRIDFS_BUCKET_NAME = "paymentProofs";
const storage = multer.memoryStorage();

// =========================================================
// FILE FILTER
// =========================================================

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png"
    ];

    if (
        allowedTypes.includes(
            file.mimetype
        )
    ) {

        cb(null, true);

    } else {

        cb(
            new Error(
                "Only JPG, JPEG, and PNG files are allowed."
            ),
            false
        );
    }
};

// =========================================================
// MULTER
// =========================================================

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter
});

// =========================================================
// UPLOAD PAYMENT PROOF
// =========================================================

router.post(
    "/upload-proof",
    upload.single("paymentProof"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No payment proof was uploaded."
                });
            }

            if (!mongoose.connection.db) {
                return res.status(503).json({
                    success: false,
                    message: "MongoDB is not connected. Please try again."
                });
            }

            const { GridFSBucket } = require("mongodb");
            const bucket = new GridFSBucket(mongoose.connection.db, {
                bucketName: GRIDFS_BUCKET_NAME
            });

            const originalExtension = path.extname(req.file.originalname).toLowerCase();
            const safeExtension = [".jpg", ".jpeg", ".png"].includes(originalExtension)
                ? originalExtension
                : (req.file.mimetype === "image/png" ? ".png" : ".jpg");

            const filename = `payment-proof-${Date.now()}-${Math.round(Math.random() * 1000000000)}${safeExtension}`;

            const uploadStream = bucket.openUploadStream(filename, {
                contentType: req.file.mimetype,
                metadata: {
                    originalName: req.file.originalname,
                    contentType: req.file.mimetype,
                    uploadedAt: new Date()
                }
            });

            await new Promise((resolve, reject) => {
                uploadStream.once("error", reject);
                uploadStream.once("finish", resolve);
                Readable.from(req.file.buffer).pipe(uploadStream);
            });

            const fileUrl = `/uploads/payment-proofs/${filename}`;

            console.log("Payment proof saved to MongoDB GridFS:", filename);

            return res.status(200).json({
                success: true,
                message: "Payment proof uploaded successfully.",
                file: {
                    originalName: req.file.originalname,
                    filename,
                    fileName: filename,
                    mimetype: req.file.mimetype,
                    fileType: req.file.mimetype,
                    size: req.file.size,
                    fileSize: req.file.size,
                    url: fileUrl
                }
            });
        } catch (error) {
            console.error("Payment proof upload error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Unable to upload payment proof."
            });
        }
    }
);

// =========================================================
// CREATE BOOKING
// =========================================================

router.post(
    "/create-booking",
    protect,
    async (req, res) => {

        try {

            console.log(
                "Creating booking..."
            );

            console.log(
                "Booking data:",
                req.body
            );

            const {

                bookingReference,

                origin,

                destination,

                date,

                time,

                passengerName,

                passengerAge,

                passengerGender,

                passengers,

                vehicleType,

                motorcycleType,

                plateNumber,

                passengerFare,

                motorcycleFare,

                ppaFee,

                requiredAmount,

                paymentMethod,

                paymentProof

            } = req.body;

            // =================================================
            // REQUIRED FIELD CHECK
            // =================================================

            if (
                !bookingReference ||
                !origin ||
                !destination ||
                !date ||
                !time ||
                !passengerName ||
                passengerAge === undefined ||
                !passengerGender ||
                !passengers ||
                !vehicleType ||
                passengerFare === undefined ||
                motorcycleFare === undefined ||
                ppaFee === undefined ||
                requiredAmount === undefined ||
                !paymentMethod ||
                !paymentProof
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Some required booking information is missing."
                });
            }

            if (vehicleType === "Motorcycle" && motorcycleType && !["standard", "big-bike"].includes(motorcycleType)) {
                return res.status(400).json({
                    success: false,
                    message: "Choose a standard motorcycle or big bike."
                });
            }

            // Validate against the saved trip so a client cannot bypass the
            // Philippine-time booking window by changing the browser clock.
            const ferryId = String(req.body.ferryId || "").trim();
            const schedule = ferryId && mongoose.Types.ObjectId.isValid(ferryId)
                ? await FerrySchedule.findOne({ _id: ferryId, active: { $ne: false } })
                : null;
            if (!schedule || String(schedule.date) !== String(date)) {
                return res.status(409).json({
                    success: false,
                    message: "This departure is no longer available. Please choose a current trip."
                });
            }
            const departure = new Date(`${schedule.date}T${schedule.departureTime}:00+08:00`);
            const cutoffMs = (vehicleType === "Motorcycle" ? 24 : 3) * 60 * 60 * 1000;
            const timeUntilDeparture = departure.getTime() - Date.now();
            if (!Number.isFinite(departure.getTime()) || timeUntilDeparture <= 0) {
                return res.status(409).json({ success: false, message: "This departure has already left. Choose a future trip." });
            }
            if (timeUntilDeparture < cutoffMs) {
                return res.status(400).json({
                    success: false,
                    message: vehicleType === "Motorcycle"
                        ? "Motorcycle bookings must be made at least 1 day before departure (Philippine time)."
                        : "Passenger bookings must be made at least 3 hours before departure (Philippine time)."
                });
            }
            // Persist the schedule's canonical route and times, not client edits.
            req.body.origin = String(schedule.route || "").split(/\s*(?:→|->|↔)\s*/)[0] || origin;
            req.body.destination = String(schedule.route || "").split(/\s*(?:→|->|↔)\s*/)[1] || destination;
            req.body.date = schedule.date;
            req.body.time = schedule.departureTime;
            req.body.vesselName = schedule.vesselName;
            req.body.ferryName = schedule.vesselName;

            // Calculate the amount on the server from saved pricing. Never trust client totals.
            const vesselName = String(req.body.vesselName || req.body.ferryName || "").trim();
            if (!vesselName || vesselName.length > 120) {
                return res.status(400).json({ success: false, message: "A valid vessel name is required." });
            }

            const DEFAULT_VESSEL_PRICES = {
                solo: 35,
                motorcycle: 285,
                smallBikeStamp: 5,
                bigBike: 353,
                bigBikeStamp: 7,
                companion: 70,
                student: 20,
                pwd: 20,
                senior: 20,
                ppa: 65
            };

            // New schedule vessels should remain bookable even before an admin
            // has customized their fares. Seed a default record so the vessel
            // also appears in the admin pricing list for later editing.
            let pricing = await VesselPricing.findOne({
                vesselName: { $regex: `^${vesselName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
            }).lean();

            if (!pricing) {
                try {
                    const created = await VesselPricing.findOneAndUpdate(
                        { vesselName },
                        { $setOnInsert: { vesselName, ...DEFAULT_VESSEL_PRICES } },
                        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
                    );
                    pricing = created?.toObject ? created.toObject() : created;
                } catch (seedError) {
                    // A concurrent booking may seed the same vessel first.
                    pricing = await VesselPricing.findOne({ vesselName }).lean();
                    if (!pricing) throw seedError;
                }
            }

            const configured = { ...DEFAULT_VESSEL_PRICES, ...(pricing || {}) };
            const passengerCount = Math.max(1, Math.min(10, Number(passengers) || 1));
            if (vehicleType === "Motorcycle" && !["standard", "big-bike"].includes(motorcycleType || "standard")) {
                return res.status(400).json({ success: false, message: "Choose a standard motorcycle or big bike." });
            }
            if (vehicleType === "Motorcycle" && motorcycleType === "big-bike" && passengerCount > 3) {
                return res.status(400).json({ success: false, message: "Big-bike bookings are limited to 3 passengers." });
            }
            const serverPassengerFare = Math.round(passengerCount * Number(configured.solo) * 100) / 100;
            const serverMotorcycleFare = vehicleType !== "Motorcycle" ? 0 : motorcycleType === "big-bike"
                ? Number(configured.bigBike)
                : Number(configured.motorcycle);
            const serverStampFee = vehicleType !== "Motorcycle" ? 0 : motorcycleType === "big-bike"
                ? Number(configured.bigBikeStamp) : Number(configured.smallBikeStamp);
            const serverPpaFee = Number(configured.ppa);
            const serverRequiredAmount = Math.round((serverPassengerFare + serverMotorcycleFare + serverStampFee + serverPpaFee) * 100) / 100;
            // Persist server-calculated values, not the amounts supplied by the browser.
            req.body.passengerFare = serverPassengerFare;
            req.body.motorcycleFare = serverMotorcycleFare;
            req.body.stampFee = serverStampFee;
            req.body.ppaFee = serverPpaFee;
            req.body.requiredAmount = serverRequiredAmount;

            // =================================================
            // CHECK DUPLICATE BOOKING REFERENCE
            // =================================================

            const existingBooking =
                await Booking.findOne({
                    bookingReference
                });

            if (existingBooking) {

                return res.status(409).json({

                    success: false,

                    message:
                        "This booking reference already exists."
                });
            }

            // =================================================
            // CREATE BOOKING
            // =================================================

            const booking =
                new Booking({

                    // IMPORTANT: never trust a userId sent by the client.
                    // The authenticated JWT is the source of ownership.
                    userId: req.user.userId,

                    bookingReference,

                    origin: req.body.origin,

                    destination: req.body.destination,

                    date: req.body.date,

                    time: req.body.time,

                    ferryId: String(schedule._id),

                    ferryName: schedule.vesselName,

                    vesselName: schedule.vesselName,

                    departureTime: schedule.departureTime,

                    arrivalTime: schedule.arrivalTime || "",

                    passengerName,

                    passengerAge,

                    passengerGender,

                    passengers,

                    vehicleType,

                    motorcycleType: vehicleType === "Motorcycle" ? motorcycleType || "standard" : "",

                    plateNumber:
                        plateNumber || "",

                    passengerFare: req.body.passengerFare,

                    motorcycleFare: req.body.motorcycleFare,

                    stampFee: req.body.stampFee,

                    ppaFee: req.body.ppaFee,

                    requiredAmount: req.body.requiredAmount,

                    totalPaid:
                        null,

                    paymentMethod,

                    paymentStatus:
                        "PENDING VERIFICATION",

                    status:
                        "PENDING PAYMENT VERIFICATION",

                    paymentProof: {

                        fileName:
                            paymentProof.fileName,

                        originalName:
                            paymentProof.originalName,

                        fileType:
                            paymentProof.fileType,

                        fileSize:
                            paymentProof.fileSize,

                        url:
                            paymentProof.url,

                        uploadedAt:
                            new Date()
                    }
                });

            // =================================================
            // SAVE TO MONGODB
            // =================================================

            const savedBooking =
                await booking.save();

            console.log(
                "Booking successfully saved:",
                savedBooking.bookingReference
            );

            // =================================================
            // RESPONSE
            // =================================================

            return res.status(201).json({

                success: true,

                message:
                    "Booking created successfully.",

                booking:
                    savedBooking
            });

        } catch (error) {

            console.error(
                "Create booking error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to save booking to MongoDB.",

                error:
                    error.message
            });
        }
    }
);
// =========================================================
// GET BOOKING BY BOOKING REFERENCE
// Used by the Tourist Bookings page to get the
// latest booking/payment status from MongoDB.
// =========================================================

router.get(
    "/booking/:bookingReference",
    protect,
    async (req, res) => {

        try {

            const booking =
                await Booking.findOne({
                    bookingReference:
                        req.params.bookingReference,
                    userId: req.user.userId
                });

            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking not found."
                });
            }

            return res.status(200).json({

                success: true,

                booking
            });

        } catch (error) {

            console.error(
                "Get booking by reference error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to retrieve booking."
            });
        }
    }
);

// =========================================================
// GET REAL-TIME FERRY CAPACITY
// =========================================================
//
// PUBLIC ROUTE
//
// Used by Trips.jsx:
//
// GET /api/bookings/capacity?date=YYYY-MM-DD
//
// This uses the existing getBookingCapacity controller.
// No admin authentication is required because tourists
// need to see available capacity before booking.
//
// =========================================================

router.get(
    "/capacity",
    async (req, res) => {

        try {

            const requestedDate =
                req.query.date ||
                new Date()
                    .toISOString()
                    .split("T")[0];

            // Keep the capacity calculation in the
            // existing bookingController.
            //
            // We call the controller here so your
            // existing booking logic remains untouched.

            const bookings =
                await Booking.find({
                    date: requestedDate
                });

            const PASSENGER_CAPACITY = 100;
            const MOTORCYCLE_CAPACITY = 10;

            const ferries = [
                {
                    id: "MV-ISLAND-PRINCESS",
                    vesselName:
                        "MV Island Princess",
                    departureTime:
                        "6:00 AM",
                    time:
                        "06:00"
                },
                {
                    id: "MV-SEA-EXPLORER",
                    vesselName:
                        "MV Sea Explorer",
                    departureTime:
                        "8:00 AM",
                    time:
                        "08:00"
                }
            ];

            const capacities =
                ferries.map((ferry) => {

                    const ferryBookings =
                        bookings.filter(
                            (booking) => {

                                const bookingVessel =
                                    booking.vesselName ||
                                    booking.ferryName ||
                                    booking.vessel ||
                                    booking.ferry ||
                                    booking.selectedFerry?.vesselName ||
                                    booking.selectedFerry?.ferryName ||
                                    "";

                                const bookingTime =
                                    booking.time ||
                                    booking.departureTime ||
                                    booking.tripTime ||
                                    booking.selectedFerry?.time ||
                                    booking.selectedFerry?.departureTime ||
                                    "";

                                const vesselMatches =
                                    String(
                                        bookingVessel
                                    )
                                        .trim()
                                        .toLowerCase() ===
                                    String(
                                        ferry.vesselName
                                    )
                                        .trim()
                                        .toLowerCase();

                                const timeMatches =
                                    String(
                                        bookingTime
                                    )
                                        .trim()
                                        .toLowerCase() ===
                                    String(
                                        ferry.time
                                    )
                                        .trim()
                                        .toLowerCase() ||
                                    String(
                                        bookingTime
                                    )
                                        .trim()
                                        .toLowerCase() ===
                                    String(
                                        ferry.departureTime
                                    )
                                        .trim()
                                        .toLowerCase();

                                return (
                                    vesselMatches ||
                                    timeMatches
                                );
                            }
                        );

                    const passengers =
                        ferryBookings.reduce(
                            (
                                total,
                                booking
                            ) => {

                                const passengerCount =
                                    Number(
                                        booking.passengers ||
                                        booking.numberOfPassengers ||
                                        booking.passengerCount ||
                                        1
                                    );

                                return (
                                    total +
                                    (
                                        Number.isFinite(
                                            passengerCount
                                        )
                                            ? Math.max(
                                                0,
                                                passengerCount
                                            )
                                            : 1
                                    )
                                );
                            },
                            0
                        );

                    const vehicles =
                        ferryBookings.reduce(
                            (
                                total,
                                booking
                            ) => {

                                const vehicleType =
                                    booking.vehicleType ||
                                    booking.vehicle ||
                                    booking.vehicleDetails?.type ||
                                    "";

                                const normalizedVehicle =
                                    String(
                                        vehicleType
                                    )
                                        .trim()
                                        .toLowerCase();

                                const hasMotorcycle =
                                    normalizedVehicle.includes(
                                        "motorcycle"
                                    ) ||
                                    normalizedVehicle.includes(
                                        "motor"
                                    );

                                return hasMotorcycle
                                    ? total + 1
                                    : total;
                            },
                            0
                        );

                    return {

                        id:
                            ferry.id,

                        vesselName:
                            ferry.vesselName,

                        departureTime:
                            ferry.departureTime,

                        time:
                            ferry.time,

                        passengers,

                        passengerCapacity:
                            PASSENGER_CAPACITY,

                        passengerRemaining:
                            Math.max(
                                0,
                                PASSENGER_CAPACITY -
                                passengers
                            ),

                        vehicles,

                        vehicleCapacity:
                            MOTORCYCLE_CAPACITY,

                        vehicleRemaining:
                            Math.max(
                                0,
                                MOTORCYCLE_CAPACITY -
                                vehicles
                            )
                    };
                });

            return res.status(200).json({

                success: true,

                date:
                    requestedDate,

                capacities
            });

        } catch (error) {

            console.error(
                "Get ferry capacity error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to retrieve ferry capacity."
            });
        }
    }
);

module.exports = router;
