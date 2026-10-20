const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Readable } = require("stream");

const Booking = require("../models/Booking");
const VesselPricing = require("../models/VesselPricing");
const FerrySchedule = require("../models/FerrySchedule");
const DiscountRequest = require("../models/DiscountRequest");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const createRateLimiter = require("../middleware/rateLimitMiddleware");

const router = express.Router();
const displayVesselName = value => /^MV\s+Felipe\s+III$/i.test(String(value || "").trim()) ? "MV Felipe" : String(value || "").trim();

// =========================================================
// MONGODB GRIDFS STORAGE
// =========================================================
// New payment proofs are stored in MongoDB GridFS so they remain available
// on Render after restarts/redeployments. server.js must serve this bucket
// at /uploads/payment-proofs/:filename using the same bucket name.

const GRIDFS_BUCKET_NAME = "paymentProofs";
const storage = multer.memoryStorage();
const uploadProofLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 12,
    keyGenerator: req => `payment-proof:${req.user?.userId || req.ip}`,
    message: "Too many payment receipts were uploaded. Please try again later."
});

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
    protect,
    uploadProofLimiter,
    upload.single("paymentProof"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No payment proof was uploaded."
                });
            }

            const isJpeg = req.file.buffer?.[0] === 0xff && req.file.buffer?.[1] === 0xd8 && req.file.buffer?.[2] === 0xff;
            const isPng = req.file.buffer?.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
            if (!((req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/jpg") && isJpeg) && !(req.file.mimetype === "image/png" && isPng)) {
                return res.status(400).json({ success: false, message: "The uploaded file is not a valid JPG or PNG image." });
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

            const filename = `payment-proof-${crypto.randomUUID()}${safeExtension}`;

            const uploadStream = bucket.openUploadStream(filename, {
                contentType: req.file.mimetype,
                metadata: {
                    originalName: req.file.originalname,
                    contentType: req.file.mimetype,
                    uploadedAt: new Date(),
                    userId: String(req.user.userId)
                }
            });

            await new Promise((resolve, reject) => {
                uploadStream.once("error", reject);
                uploadStream.once("finish", resolve);
                Readable.from(req.file.buffer).pipe(uploadStream);
            });

            const fileUrl = `/api/payment/proof/${encodeURIComponent(filename)}`;

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

const authenticateProofReader = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token) return res.status(401).json({ success: false, message: "Authentication required." });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === "ADMIN") {
            req.proofReader = { role: "ADMIN", id: decoded.id || decoded.adminId || "" };
        } else if (decoded.userId && !decoded.role) {
            req.proofReader = { role: "USER", id: String(decoded.userId) };
        } else {
            return res.status(403).json({ success: false, message: "You are not allowed to view this payment receipt." });
        }
        return next();
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired authentication token." });
    }
};

router.get("/proof/:filename", authenticateProofReader, async (req, res) => {
    try {
        const filename = String(req.params.filename || "");
        if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,180}\.(?:jpg|jpeg|png)$/i.test(filename)) {
            return res.status(400).json({ success: false, message: "Invalid payment receipt reference." });
        }

        const ownershipQuery = { "paymentProof.fileName": filename };
        if (req.proofReader.role === "USER") ownershipQuery.userId = req.proofReader.id;
        const associatedBooking = await Booking.exists(ownershipQuery);
        if (!associatedBooking) return res.status(404).json({ success: false, message: "Payment receipt not found." });

        res.set({
            "Content-Type": /\.png$/i.test(filename) ? "image/png" : "image/jpeg",
            "Content-Disposition": `inline; filename="${filename}"`,
            "Cache-Control": "private, no-store, max-age=0",
            "X-Content-Type-Options": "nosniff"
        });

        const localDirectory = path.resolve(__dirname, "../uploads/payment-proofs");
        const localPath = path.resolve(localDirectory, filename);
        if (localPath.startsWith(`${localDirectory}${path.sep}`) && fs.existsSync(localPath)) {
            return fs.createReadStream(localPath).pipe(res);
        }

        if (!mongoose.connection.db) return res.status(503).json({ success: false, message: "Payment receipt storage is not ready." });
        const { GridFSBucket } = require("mongodb");
        const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: GRIDFS_BUCKET_NAME });
        const file = await bucket.find({ filename }).sort({ uploadDate: -1 }).next();
        if (!file) return res.status(404).json({ success: false, message: "Payment receipt not found." });
        if (req.proofReader.role === "USER" && String(file.metadata?.userId || "") !== req.proofReader.id) {
            return res.status(404).json({ success: false, message: "Payment receipt not found." });
        }
        return bucket.openDownloadStream(file._id).pipe(res);
    } catch (error) {
        console.error("Payment proof retrieval error:", error);
        if (!res.headersSent) return res.status(500).json({ success: false, message: "Unable to retrieve payment receipt." });
        return res.destroy(error);
    }
});

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

            let {

                bookingReference,

                origin,

                destination,

                date,

                time,

                passengerName,

                passengerAge,

                passengerGender,

                passengerDetails,

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

            const proofFilename = String(paymentProof?.fileName || paymentProof?.filename || "").trim();
            if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,180}\.(?:jpg|jpeg|png)$/i.test(proofFilename) || !mongoose.connection.db) {
                return res.status(400).json({ success: false, message: "Upload a valid payment receipt before submitting this booking." });
            }
            const { GridFSBucket } = require("mongodb");
            const proofBucket = new GridFSBucket(mongoose.connection.db, { bucketName: GRIDFS_BUCKET_NAME });
            const ownedProof = await proofBucket.find({
                filename: proofFilename,
                "metadata.userId": String(req.user.userId)
            }).sort({ uploadDate: -1 }).next();
            if (!ownedProof) {
                return res.status(403).json({ success: false, message: "This payment receipt does not belong to your account. Upload your own receipt and try again." });
            }
            req.body.paymentProof = {
                fileName: proofFilename,
                originalName: String(ownedProof.metadata?.originalName || "payment-receipt").slice(0, 255),
                fileType: ownedProof.metadata?.contentType === "image/png" ? "image/png" : "image/jpeg",
                fileSize: Number(ownedProof.length) || 0,
                url: `/api/payment/proof/${encodeURIComponent(proofFilename)}`
            };
            paymentProof = req.body.paymentProof;

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
            req.body.vesselName = displayVesselName(schedule.vesselName);
            req.body.ferryName = req.body.vesselName;

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
            const bookingPassengers = Array.isArray(passengerDetails) && passengerDetails.length === passengerCount
                ? passengerDetails
                : passengerCount === 1
                    ? [{ id: String(req.user.userId), name: passengerName, age: passengerAge, gender: passengerGender, category: req.body.passengerCategory || "Regular" }]
                    : [];
            if (Array.isArray(passengerDetails) && passengerDetails.length && passengerDetails.length !== passengerCount) {
                return res.status(400).json({ success: false, message: "Provide complete details for every passenger." });
            }
            const normalizedPassengers = [];
            let discountTotal = 0;
            const account = await User.findById(req.user.userId).select("fullName age gender category").lean();
            for (const passenger of bookingPassengers) {
                const passengerId = String(passenger.id || "");
                const isAccountHolder = passengerId === String(req.user.userId);
                const name = String(isAccountHolder ? account?.fullName : passenger.name || "").trim();
                const age = Number(isAccountHolder ? account?.age ?? passenger.age : passenger.age);
                const gender = String(isAccountHolder ? account?.gender || passenger.gender : passenger.gender || "").trim();
                const passengerCategory = isAccountHolder ? account?.category || passenger.category : passenger.category;
                const category = age >= 60 ? "Senior" : ["Student", "PWD"].includes(passengerCategory) ? passengerCategory : "Regular";
                let request = null;
                let amount = 0;
                if (category !== "Regular") {
                    request = await DiscountRequest.findOne({ userId: req.user.userId, passengerId, passengerName: name, age, gender, category, photo: { $ne: "" } }).lean();
                    if (!request) return res.status(400).json({ success: false, message: `Upload an ID photo for ${name || "each eligible passenger"} before continuing.` });
                    if (request.status === "approved") amount = Math.round((Number(configured.solo) * Number(configured[category.toLowerCase()]) / 100) * 100) / 100;
                }
                discountTotal += amount;
                normalizedPassengers.push({ passengerId, name, age, gender, category, discountRequestId: request?._id || null, discountStatus: request?.status || "not eligible", discountAmount: amount });
            }
            if (vehicleType === "Motorcycle" && !["standard", "big-bike"].includes(motorcycleType || "standard")) {
                return res.status(400).json({ success: false, message: "Choose a standard motorcycle or big bike." });
            }
            if (vehicleType === "Motorcycle" && motorcycleType === "big-bike" && passengerCount > 3) {
                return res.status(400).json({ success: false, message: "Big-bike bookings are limited to 3 passengers." });
            }
            const grossPassengerFare = Math.round(passengerCount * Number(configured.solo) * 100) / 100;
            const serverPassengerFare = grossPassengerFare;
            const serverMotorcycleFare = vehicleType !== "Motorcycle" ? 0 : motorcycleType === "big-bike"
                ? Number(configured.bigBike)
                : Number(configured.motorcycle);
            const serverStampFee = vehicleType !== "Motorcycle" ? 0 : motorcycleType === "big-bike"
                ? Number(configured.bigBikeStamp) : Number(configured.smallBikeStamp);
            const serverPpaFee = Number(configured.ppa);
            const serverRequiredAmount = Math.round((serverPassengerFare + serverMotorcycleFare + serverStampFee - discountTotal + serverPpaFee) * 100) / 100;
            // Persist server-calculated values, not the amounts supplied by the browser.
            req.body.passengerFare = serverPassengerFare;
            req.body.motorcycleFare = serverMotorcycleFare;
            req.body.stampFee = serverStampFee;
            req.body.ppaFee = serverPpaFee;
            req.body.requiredAmount = serverRequiredAmount;
            req.body.discountAmount = discountTotal;
            req.body.passengerDetails = normalizedPassengers;

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

            // Reserve the next passenger queue position for this exact departure.
            // This makes the number available as soon as the booking is saved,
            // while payment verification can still happen afterward.
            const queuedSchedule = await FerrySchedule.findOneAndUpdate(
                { _id: schedule._id, active: { $ne: false } },
                { $inc: { queueCounter: 1 } },
                { new: true }
            );
            if (!queuedSchedule) {
                return res.status(409).json({ success: false, message: "This departure is no longer available. Choose another trip." });
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

                    queueNumber: `MT-${String(queuedSchedule.queueCounter).padStart(2, "0")}`,

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

                    passengerDetails: req.body.passengerDetails,

                    vehicleType,

                    motorcycleType: vehicleType === "Motorcycle" ? motorcycleType || "standard" : "",

                    plateNumber:
                        plateNumber || "",

                    passengerFare: req.body.passengerFare,

                    motorcycleFare: req.body.motorcycleFare,

                    stampFee: req.body.stampFee,

                    ppaFee: req.body.ppaFee,

                    discountAmount: req.body.discountAmount,

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
