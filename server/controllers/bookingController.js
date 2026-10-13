const Booking = require("../models/Booking");
const FerryClosure = require("../models/FerryClosure");
const User = require("../models/User");
const Notification = require("../models/Notification");

const {
    sendCancellationEmail
} = require("../services/emailService");
// =========================================================
// FERRY ONLINE BOOKING CLOSURE
// =========================================================
// Uses the existing FerryClosure model.
// Booking records are not modified when an Admin closes a ferry.
// =========================================================

const normalizeFerryId = (value) =>
    String(value || "").trim().toLowerCase();

const setFerryBookingStatus = async (req, res) => {
    try {
        const {
            ferryId,
            ferryName,
            date,
            closed
        } = req.body || {};

        const normalizedFerryId =
            String(ferryId || "").trim();

        const normalizedFerryName =
            String(
                ferryName ||
                ferryId ||
                ""
            ).trim();

        const requestedDate =
            String(
                date ||
                new Date().toISOString().split("T")[0]
            ).trim();

        if (!normalizedFerryId) {
            return res.status(400).json({
                success: false,
                message: "Ferry ID is required."
            });
        }

        if (!normalizedFerryName) {
            return res.status(400).json({
                success: false,
                message: "Ferry name is required."
            });
        }

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(
                requestedDate
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "A valid booking date is required (YYYY-MM-DD)."
            });
        }

        const shouldClose =
            closed === true ||
            closed === "true";

        // =====================================================
        // CLOSE ONLINE BOOKING
        // =====================================================

        if (shouldClose) {
            const closure =
                await FerryClosure.findOneAndUpdate(
                    {
                        ferryId:
                            normalizedFerryId,

                        date:
                            requestedDate
                    },
                    {
                        $set: {
                            ferryId:
                                normalizedFerryId,

                            ferryName:
                                normalizedFerryName,

                            date:
                                requestedDate,

                            isClosed:
                                true,

                            closedAt:
                                new Date()
                        }
                    },
                    {
                        new: true,
                        upsert: true,
                        setDefaultsOnInsert: true
                    }
                );

            return res.status(200).json({
                success: true,

                message:
                    "Online booking closed for this ferry.",

                closure
            });
        }

        // =====================================================
        // REOPEN ONLINE BOOKING
        // =====================================================
        //
        // Delete the manual closure record.
        // This keeps the ferry open and does not touch bookings.
        //
        // =====================================================

        await FerryClosure.deleteOne({
            ferryId:
                normalizedFerryId,

            date:
                requestedDate
        });

        return res.status(200).json({
            success: true,

            message:
                "Online booking reopened for this ferry.",

            ferryId:
                normalizedFerryId,

            ferryName:
                normalizedFerryName,

            date:
                requestedDate,

            closed:
                false
        });

    } catch (error) {
        console.error(
            "Set ferry booking status error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to update ferry online booking status."
        });
    }
};


// =========================================================
// GET ALL BOOKINGS FOR ADMIN
// =========================================================

const getAllBookings = async (req, res) => {
    try {

        const bookings =
            await Booking.find()
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            bookings
        });

    } catch (error) {

        console.error(
            "Get all bookings error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve bookings."
        });
    }
};


// =========================================================
// GET PENDING PAYMENT VERIFICATIONS
// =========================================================

const getPendingPayments = async (req, res) => {
    try {

        const bookings =
            await Booking.find({
                paymentStatus:
                    "PENDING VERIFICATION"
            })
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            bookings
        });

    } catch (error) {

        console.error(
            "Get pending payments error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve pending payments."
        });
    }
};


// =========================================================
// GET VERIFIED PAYMENTS
// =========================================================

const getVerifiedPayments = async (req, res) => {
    try {

        const bookings =
            await Booking.find({
                paymentStatus:
                    "VERIFIED"
            })
            .sort({
                updatedAt: -1
            });

        return res.status(200).json({
            success: true,
            bookings
        });

    } catch (error) {

        console.error(
            "Get verified payments error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve verified payments."
        });
    }
};


// =========================================================
// GET BOOKING BY ID
// =========================================================

const getBookingById = async (req, res) => {
    try {

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

        return res.status(200).json({
            success: true,
            booking
        });

    } catch (error) {

        console.error(
            "Get booking error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve booking."
        });
    }
};


// =========================================================
// GET BOOKING BY REFERENCE
// =========================================================
//
// This endpoint is used by the tourist Bookings page
// to retrieve the latest status from MongoDB.
//

const getBookingByReference = async (req, res) => {
    try {

        const booking =
            await Booking.findOne({
                bookingReference:
                    req.params.bookingReference
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
};


// =========================================================
// NORMALIZE TEXT
// =========================================================
//
// Used by the ferry-capacity calculation.
//
// This prevents small differences such as:
//
// "MV Halili"
// " mv halili "
// "MV HALILI"
//
// from being treated as different ferry names.
//

const normalizeText = (value) => {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
};


// =========================================================
// NORMALIZE BOOKING DATE
// =========================================================
//
// Existing bookings may contain dates in different display
// formats (for example YYYY-MM-DD or MM/DD/YYYY). The capacity
// calculation must treat equivalent dates as the same day.
//
const normalizeBookingDate = (value) => {

    if (value === null || value === undefined || value === "") {
        return "";
    }

    const text = String(value).trim();

    // YYYY-MM-DD (also safely handles an ISO date prefix).
    const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

    if (isoMatch) {
        return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2, "0")}-${String(isoMatch[3]).padStart(2, "0")}`;
    }

    // MM/DD/YYYY or M/D/YYYY.
    const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (slashMatch) {
        return `${slashMatch[3]}-${String(slashMatch[1]).padStart(2, "0")}-${String(slashMatch[2]).padStart(2, "0")}`;
    }

    // MM-DD-YYYY or M-D-YYYY.
    const dashMatch = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);

    if (dashMatch) {
        return `${dashMatch[3]}-${String(dashMatch[1]).padStart(2, "0")}-${String(dashMatch[2]).padStart(2, "0")}`;
    }

    return text;
};


// =========================================================
// NORMALIZE TIME
// =========================================================
//
// Converts:
//
// 03:30
// 3:30 AM
// 03:30 AM
// 8:00
// 8:00 AM
//
// into the same HH:mm format.
//
// This is important because bookings may have been
// saved using either "09:00" or "9:00 AM".
//

const normalizeTime = (value) => {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }

    const text =
        String(value)
            .trim()
            .toUpperCase();

    // Already HH:mm
    if (
        /^\d{1,2}:\d{2}$/.test(
            text
        )
    ) {

        const parts =
            text.split(":");

        const hour =
            Number(parts[0]);

        const minute =
            Number(parts[1]);

        if (
            Number.isFinite(hour) &&
            Number.isFinite(minute)
        ) {

            return (
                String(hour).padStart(2, "0") +
                ":" +
                String(minute).padStart(2, "0")
            );
        }
    }


    // HH:mm AM/PM
    const match =
        text.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
        );

    if (!match) {
        return text;
    }

    let hour =
        Number(match[1]);

    const minute =
        Number(match[2]);

    const period =
        match[3];


    if (
        period === "AM" &&
        hour === 12
    ) {
        hour = 0;
    }


    if (
        period === "PM" &&
        hour !== 12
    ) {
        hour += 12;
    }


    return (
        String(hour).padStart(2, "0") +
        ":" +
        String(minute).padStart(2, "0")
    );
};


// =========================================================
// GET REAL-TIME FERRY CAPACITY
// =========================================================
//
// PUBLIC ENDPOINT
//
// GET:
//
// /api/bookings/capacity?date=YYYY-MM-DD
//
// Passenger capacity:
//
// 100 passengers per ferry
//
// Motorcycle capacity:
//
// 10 motorcycles per ferry
//
// Passenger-only booking:
//
// +1 passenger
//
// Motorcycle booking:
//
// +passenger count
// +1 motorcycle
//
// Cancelled bookings:
//
// DO NOT COUNT
//
// Rejected payments:
//
// DO NOT COUNT
//
// Pending verification:
//
// COUNT
//
// Confirmed:
//
// COUNT
//
// =========================================================

const getBookingCapacity = async (req, res) => {

    try {

        // =====================================================
        // DATE
        // =====================================================

        const requestedDate =
            req.query.date ||
            new Date()
                .toISOString()
                .split("T")[0];


        // =====================================================
        // CAPACITY LIMITS
        // =====================================================

        const PASSENGER_CAPACITY = 100;

        const MOTORCYCLE_CAPACITY = 10;


        // =====================================================
        // MANUAL ADMIN FERRY CLOSURES
        // =====================================================
        //
        // IMPORTANT:
        //
        // FerryClosure uses "isClosed".
        //
        // Do NOT use "closed" here.
        //
        // =====================================================

        const manualClosures =
            await FerryClosure.find({
                date:
                    requestedDate,

                isClosed:
                    true
            }).lean();


        const manualClosureMap =
            new Map(
                manualClosures.map(
                    (closure) => [
                        normalizeFerryId(
                            closure.ferryId
                        ),
                        true
                    ]
                )
            );


        // =====================================================
        // FERRY SCHEDULE
        // =====================================================
        //
        // IMPORTANT:
        //
        // These MUST match the ferries displayed in Trips.jsx.
        //
        // Current system:
        //
        // MV Felipe III
        // MV FastCraft
        // MV Halili
        //
        // =====================================================

        const ferries = [

            {
                id:
                    "MV Felipe III",

                vesselName:
                    "MV Felipe III",

                departureTime:
                    "3:30 AM",

                time:
                    "03:30"
            },

            {
                id:
                    "MV FastCraft",

                vesselName:
                    "MV FastCraft",

                departureTime:
                    "8:00 AM",

                time:
                    "08:00"
            },

            {
                id:
                    "MV Halili",

                vesselName:
                    "MV Halili",

                departureTime:
                    "9:00 AM",

                time:
                    "09:00"
            }

        ];


        // =====================================================
        // FIND ACTIVE BOOKINGS
        // =====================================================
        //
        // We intentionally include:
        //
        // PENDING VERIFICATION
        // VERIFIED
        //
        // because a submitted booking has already reserved
        // a capacity slot.
        //
        // We exclude:
        //
        // CANCELLED
        // REJECTED
        //
        // =====================================================

        const bookings =
            await Booking.find({

                status: {
                    $ne:
                        "CANCELLED"
                },

                paymentStatus: {
                    $ne:
                        "REJECTED"
                }

            })
            .lean();

        // Keep the capacity calculation compatible with existing
        // bookings regardless of how their date was formatted.
        const activeBookingsForDate =
            bookings.filter(
                (booking) =>
                    normalizeBookingDate(booking?.date) ===
                    normalizeBookingDate(requestedDate)
            );


        // =====================================================
        // DEBUG INFORMATION
        // =====================================================

        console.log(
            "=========================================="
        );

        console.log(
            "FERRY CAPACITY CHECK"
        );

        console.log(
            "Requested date:",
            requestedDate
        );

        console.log(
            "Total active bookings for requested date:",
            activeBookingsForDate.length
        );


        // =====================================================
        // CALCULATE EACH FERRY
        // =====================================================

        const capacities =
            ferries.map(
                (ferry) => {

                    // =================================================
                    // NORMALIZED FERRY INFORMATION
                    // =================================================

                    const normalizedFerryId =
                        normalizeText(
                            ferry.id
                        );

                    const normalizedFerryName =
                        normalizeText(
                            ferry.vesselName
                        );

                    const normalizedFerryTime =
                        normalizeTime(
                            ferry.time
                        );

                    const normalizedDepartureTime =
                        normalizeTime(
                            ferry.departureTime
                        );


                    // =================================================
                    // FIND BOOKINGS FOR THIS FERRY
                    // =================================================

                    const ferryBookings =
                        activeBookingsForDate.filter(
                            (booking) => {

                                // =====================================
                                // POSSIBLE BOOKING FERRY ID
                                // =====================================

                                const bookingFerryId =
                                    normalizeText(
                                        booking.ferryId ||
                                        booking.selectedFerry?.id ||
                                        booking.selectedTrip?.id ||
                                        booking.trip?.id ||
                                        ""
                                    );


                                // =====================================
                                // POSSIBLE BOOKING VESSEL NAME
                                // =====================================

                                const bookingVesselName =
                                    normalizeText(
                                        booking.vesselName ||
                                        booking.ferryName ||
                                        booking.vessel ||
                                        booking.ferry ||
                                        booking.selectedFerry?.vesselName ||
                                        booking.selectedFerry?.ferryName ||
                                        booking.selectedTrip?.vesselName ||
                                        booking.selectedTrip?.ferryName ||
                                        ""
                                    );


                                // =====================================
                                // POSSIBLE BOOKING TIME
                                // =====================================

                                const bookingTime =
                                    normalizeTime(
                                        booking.time ||
                                        booking.departureTime ||
                                        booking.tripTime ||
                                        booking.selectedFerry?.time ||
                                        booking.selectedFerry?.departureTime ||
                                        booking.selectedTrip?.time ||
                                        booking.selectedTrip?.departureTime ||
                                        ""
                                    );


                                // =====================================
                                // MATCH FERRY ID
                                // =====================================

                                const ferryIdMatches =
                                    bookingFerryId !== "" &&
                                    bookingFerryId ===
                                    normalizedFerryId;


                                // =====================================
                                // MATCH VESSEL NAME
                                // =====================================

                                const vesselNameMatches =
                                    bookingVesselName !== "" &&
                                    bookingVesselName ===
                                    normalizedFerryName;


                                // =====================================
                                // MATCH TIME
                                // =====================================

                                const timeMatches =
                                    bookingTime !== "" &&
                                    (
                                        bookingTime ===
                                        normalizedFerryTime ||

                                        bookingTime ===
                                        normalizedDepartureTime
                                    );


                                // =====================================
                                // IMPORTANT MATCHING RULE
                                // =====================================
                                //
                                // Use OR instead of allowing an
                                // incorrect ferryId to block a correct
                                // vessel-name match.
                                //
                                // This fixes old bookings that may
                                // contain:
                                //
                                // ferryId = ""
                                //
                                // or
                                //
                                // ferryId = different value
                                //
                                // while vesselName is correct.
                                //
                                // =====================================

                                const matches =
                                    ferryIdMatches ||
                                    vesselNameMatches ||
                                    (
                                        bookingVesselName === "" &&
                                        timeMatches
                                    );


                                // =====================================
                                // DEBUG BOOKING MATCH
                                // =====================================

                                if (matches) {

                                    console.log(
                                        "Booking matched:",
                                        {
                                            bookingReference:
                                                booking.bookingReference,

                                            bookingFerryId:
                                                booking.ferryId,

                                            bookingVesselName:
                                                booking.vesselName,

                                            bookingTime:
                                                booking.time,

                                            targetFerry:
                                                ferry.vesselName
                                        }
                                    );
                                }


                                return matches;
                            }
                        );


                    // =================================================
                    // PASSENGER COUNT
                    // =================================================
                    //
                    // Every passenger consumes one passenger slot.
                    //
                    // Example:
                    //
                    // 1 passenger:
                    //
                    // 1/100
                    //
                    // 3 passengers:
                    //
                    // 3/100
                    //
                    // =================================================

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


                                if (
                                    !Number.isFinite(
                                        passengerCount
                                    )
                                ) {

                                    return (
                                        total + 1
                                    );
                                }


                                return (
                                    total +
                                    Math.max(
                                        1,
                                        passengerCount
                                    )
                                );
                            },
                            0
                        );


                    // =================================================
                    // MOTORCYCLE COUNT
                    // =================================================
                    //
                    // Motorcycle:
                    //
                    // +1 motorcycle
                    //
                    // Passenger-only:
                    //
                    // +0 motorcycles
                    //
                    // =================================================

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
                                    normalizeText(
                                        vehicleType
                                    );


                                // =====================================
                                // NO VEHICLE VALUES
                                // =====================================

                                const isNoMotorcycle =
                                    normalizedVehicle ===
                                        "no motorcycle" ||

                                    normalizedVehicle ===
                                        "nomotorcycle" ||

                                    normalizedVehicle ===
                                        "no vehicle" ||

                                    normalizedVehicle ===
                                        "novehicle" ||

                                    normalizedVehicle ===
                                        "none" ||

                                    normalizedVehicle ===
                                        "passenger only" ||

                                    normalizedVehicle ===
                                        "passenger-only" ||

                                    normalizedVehicle ===
                                        "passenger" ||

                                    normalizedVehicle ===
                                        "";


                                // =====================================
                                // MOTORCYCLE VALUES
                                // =====================================

                                const hasMotorcycle =
                                    !isNoMotorcycle &&
                                    (
                                        normalizedVehicle ===
                                            "motorcycle" ||

                                        normalizedVehicle.includes(
                                            "motorcycle"
                                        )
                                    );


                                if (
                                    hasMotorcycle
                                ) {

                                    return (
                                        total + 1
                                    );
                                }


                                return total;
                            },
                            0
                        );


                    // =================================================
                    // REMAINING PASSENGER CAPACITY
                    // =================================================

                    const passengerRemaining =
                        Math.max(
                            0,
                            PASSENGER_CAPACITY -
                            passengers
                        );


                    // =================================================
                    // REMAINING MOTORCYCLE CAPACITY
                    // =================================================

                    const vehicleRemaining =
                        Math.max(
                            0,
                            MOTORCYCLE_CAPACITY -
                            vehicles
                        );


                    // =====================================================
                    // BOOKING STATUS
                    // =====================================================

                    const manualClosed =
                        manualClosureMap.get(
                            normalizeFerryId(
                                ferry.id
                            )
                        ) === true;


                    // Passenger capacity closes the ferry for all online
                    // passenger bookings. Motorcycle capacity does NOT.
                    // A ferry with 10/10 motorcycles can still accept
                    // passenger-only bookings while passenger slots remain.
                    const passengerFull =
                        passengers >=
                        PASSENGER_CAPACITY;

                    const motorcycleFull =
                        vehicles >=
                        MOTORCYCLE_CAPACITY;

                    const automaticallyFull =
                        passengerFull;

                    const bookingClosed =
                        manualClosed ||
                        passengerFull;


                    // =================================================
                    // DEBUG FERRY RESULT
                    // =================================================

                    console.log(
                        `${ferry.vesselName} => ${passengers}/${PASSENGER_CAPACITY} passengers | ${vehicles}/${MOTORCYCLE_CAPACITY} motorcycles | manualClosed=${manualClosed} | automaticallyFull=${automaticallyFull}`
                    );


                    // =================================================
                    // RETURN CAPACITY
                    // =================================================

                    return {

                        id:
                            ferry.id,

                        vesselName:
                            ferry.vesselName,

                        departureTime:
                            ferry.departureTime,

                        time:
                            ferry.time,

                        passengers:
                            passengers,

                        passengerCapacity:
                            PASSENGER_CAPACITY,

                        passengerRemaining:
                            passengerRemaining,

                        vehicles:
                            vehicles,

                        vehicleCapacity:
                            MOTORCYCLE_CAPACITY,

                        vehicleRemaining:
                            vehicleRemaining,

                        manualClosed:
                            manualClosed,

                        automaticallyFull:
                            automaticallyFull,

                        passengerFull:
                            passengerFull,

                        motorcycleFull:
                            motorcycleFull,

                        bookingClosed:
                            bookingClosed
                    };
                }
            );


        // =====================================================
        // FINAL DEBUG
        // =====================================================

        console.log(
            "=========================================="
        );


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success:
                true,

            date:
                requestedDate,

            capacities:
                capacities

        });


    } catch (error) {

        console.error(
            "Get ferry capacity error:",
            error
        );

        return res.status(500).json({

            success:
                false,

            message:
                "Unable to retrieve ferry capacity.",

            error:
                error.message

        });
    }
};


// =========================================================
// VERIFY PAYMENT
// =========================================================

const verifyPayment = async (req, res) => {

    try {

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


        // =================================================
        // PREVENT DUPLICATE PROCESSING
        // =================================================

        if (
            booking.paymentStatus !==
            "PENDING VERIFICATION"
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    `This payment has already been ${booking.paymentStatus.toLowerCase()}.`

            });
        }


        // =================================================
        // VERIFY PAYMENT
        // =================================================

        booking.paymentStatus =
            "VERIFIED";

        booking.status =
            "CONFIRMED";

        booking.totalPaid =
            booking.requiredAmount;


        await booking.save();


        return res.status(200).json({

            success:
                true,

            message:
                "Payment verified successfully.",

            booking

        });


    } catch (error) {

        console.error(
            "Verify payment error:",
            error
        );

        return res.status(500).json({

            success:
                false,

            message:
                "Unable to verify payment."

        });
    }
};


// =========================================================
// REJECT PAYMENT
// =========================================================

const rejectPayment = async (req, res) => {

    try {

        const booking =
            await Booking.findById(
                req.params.id
            );


        if (!booking) {

            return res.status(404).json({

                success:
                    false,

                message:
                    "Booking not found."

            });
        }


        // =================================================
        // PREVENT DUPLICATE PROCESSING
        // =================================================

        if (
            booking.paymentStatus !==
            "PENDING VERIFICATION"
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    `This payment has already been ${booking.paymentStatus.toLowerCase()}.`

            });
        }


        // =================================================
        // REJECT PAYMENT
        // =================================================

        booking.paymentStatus =
            "REJECTED";

        booking.status =
            "CANCELLED";

        booking.totalPaid =
            null;


        await booking.save();


        return res.status(200).json({

            success:
                true,

            message:
                "Payment rejected successfully.",

            booking

        });


    } catch (error) {

        console.error(
            "Reject payment error:",
            error
        );

        return res.status(500).json({

            success:
                false,

            message:
                "Unable to reject payment."

        });
    }
};


// =========================================================
// DASHBOARD STATISTICS
// =========================================================

const getBookingStatistics = async (req, res) => {

    try {

        const totalBookings =
            await Booking.countDocuments();


        const pendingPayments =
            await Booking.countDocuments({

                paymentStatus:
                    "PENDING VERIFICATION"

            });


        const verifiedPayments =
            await Booking.countDocuments({

                paymentStatus:
                    "VERIFIED"

            });


        const rejectedPayments =
            await Booking.countDocuments({

                paymentStatus:
                    "REJECTED"

            });


        return res.status(200).json({

            success:
                true,

            statistics: {

                totalBookings,

                pendingPayments,

                verifiedPayments,

                rejectedPayments

            }

        });


    } catch (error) {

        console.error(
            "Booking statistics error:",
            error
        );

        return res.status(500).json({

            success:
                false,

            message:
                "Unable to retrieve booking statistics."

        });
    }
};



const cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;

        const cancellationReason =
            typeof req.body?.reason === "string"
                ? req.body.reason.trim()
                : "";

        if (!cancellationReason) {
            return res.status(400).json({
                success: false,
                message: "A cancellation reason is required."
            });
        }

        if (cancellationReason.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "The cancellation reason must not exceed 1000 characters."
            });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        if (booking.status === "CANCELLED") {
            return res.status(400).json({
                success: false,
                message: "This booking has already been cancelled."
            });
        }

        if (!booking.userId) {
            return res.status(400).json({
                success: false,
                message:
                    "This booking is not linked to a passenger account. Link it to the correct passenger before cancelling."
            });
        }

        const passenger = await User.findById(booking.userId);

        if (!passenger) {
            return res.status(400).json({
                success: false,
                message: "The passenger account linked to this booking was not found."
            });
        }

        // Save the cancellation without changing paymentStatus.
        booking.status = "CANCELLED";
        await booking.save();

        const reference =
            booking.bookingReference || booking._id.toString();

        let notification;

        try {
            notification = await Notification.create({
                userId: passenger._id,
                bookingId: booking._id,
                bookingReference: reference,
                type: "BOOKING_CANCELLED",
                title: "Booking Cancelled",
                message:
                    `Your booking ${reference} has been cancelled. Reason: ${cancellationReason}`,
                cancellationReason
            });
        } catch (notificationError) {
            console.error(
                "Create cancellation notification error:",
                notificationError
            );

            // Avoid reporting complete success if the persistent
            // passenger notification could not be created.
            return res.status(500).json({
                success: false,
                bookingCancelled: true,
                message:
                    "The booking was cancelled, but the passenger notification could not be saved. Please retry notification delivery without cancelling the booking again."
            });
        }

        // Email is best-effort; it must not undo the cancellation.
        const emailResult = await sendCancellationEmail({
            to: passenger.email,
            passengerName: passenger.fullName,
            bookingReference: reference,
            cancellationReason
        });

        return res.status(200).json({
            success: true,
            message: "Booking cancelled and passenger notified.",
            booking,
            notification,
            emailSent: emailResult.sent
        });
    } catch (error) {
        console.error("Cancel booking error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to cancel the booking."
        });
    }
};


// =========================================================
// EXPORT
// =========================================================
module.exports = {
    getAllBookings,
    getPendingPayments,
    getVerifiedPayments,
    getBookingById,
    getBookingByReference,
    setFerryBookingStatus,
    verifyPayment,
    rejectPayment,
    cancelBooking,
    getBookingStatistics,
    getBookingCapacity
};