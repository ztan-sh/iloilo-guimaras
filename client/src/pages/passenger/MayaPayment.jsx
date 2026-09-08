import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const MayaPayment = () => {

    const navigate = useNavigate();

    // =========================================================
    // API
    // =========================================================

    const API_URL =
        (import.meta.env.VITE_API_BASE_URL ||
            "http://localhost:5000/api").replace(
                /\/api\/?$/,
                ""
            );

    // =========================================================
    // AUTHENTICATION TOKEN
    // =========================================================
    //
    // Login stores the normal passenger JWT in sessionStorage
    // when "Remember me" is OFF, and localStorage when it is ON.
    // The protected create-booking endpoint needs that JWT.
    // This helper supports both storage locations without
    // changing the existing booking/payment logic.
    //

    const getAuthToken = () => {

        return (
            localStorage.getItem("token") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("authToken") ||
            sessionStorage.getItem("authToken") ||
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken") ||
            ""
        );

    };

    // =========================================================
    // GUIMARASGO LOGO
    // =========================================================

    const LOGO_URL =
        "https://scontent.fcgy2-2.fna.fbcdn.net/v/t1.15752-9/775468126_1793367781697550_3767041847597317415_n.png?stp=dst-png&cstp=mx532x469&ctp=s532x469&_nc_cat=103&ccb=1-7&_nc_sid=9f807c&_nc_eui2=AeEKTnmoEB20Fs5gE6WYWTxBd_QaoqEL1HV39BqioQvUdc9ZjhsVKyPy19OQYcSyO20Y_14PqMHIf2M01vrRKE4U&_nc_ohc=fK0ygs4SALUQ7kNvwEhUgQl&_nc_oc=Adr97yUKqKQuY-Rb-Lpj__Sjoqm7YY75sVczdULR8n8AbUyhy3oVy9DJ-YO_YUPfnTE&_nc_zt=23&_nc_ht=scontent.fcgy2-2.fna&_nc_ss=7a2a8&oh=03_Q7cD6AFmBhmkMTNembwVy95XQOYfaHONnpCT7udBE1IJnmNvHg&oe=6AB20956";

    // =========================================================
    // MAYA QR
    // =========================================================

    const MAYA_QR_URL = "/images/maya-qr.jpg";

    // =========================================================
    // PAYMENT PROOF STATE
    // =========================================================

    const [paymentProof, setPaymentProof] =
        useState(null);

    const [proofPreview, setProofPreview] =
        useState(null);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    // =========================================================
    // GET TRIP DETAILS
    // =========================================================

    const savedTrip =
        sessionStorage.getItem("tripDetails");

    let trip = null;

    try {

        trip =
            savedTrip
                ? JSON.parse(savedTrip)
                : null;

    } catch (error) {

        console.error(
            "Unable to recover trip details:",
            error
        );

        trip = null;
    }

    // =========================================================
    // NORMALIZE TRIP
    // =========================================================

    const normalizedTrip = trip
        ? {

            ...trip,

            /* =================================================
               FERRY / VESSEL INFORMATION
            ================================================= */

            ferryId:
                trip.ferryId ||
                trip.selectedFerry?.id ||
                trip.selectedTrip?.id ||
                "",

            ferryName:
                trip.ferryName ||
                trip.vesselName ||
                trip.vessel ||
                trip.ferry ||
                trip.selectedFerry?.ferryName ||
                trip.selectedFerry?.vesselName ||
                trip.selectedTrip?.ferryName ||
                trip.selectedTrip?.vesselName ||
                "",

            vesselName:
                trip.vesselName ||
                trip.ferryName ||
                trip.vessel ||
                trip.ferry ||
                trip.selectedFerry?.vesselName ||
                trip.selectedFerry?.ferryName ||
                trip.selectedTrip?.vesselName ||
                trip.selectedTrip?.ferryName ||
                "",

            departureTime:
                trip.departureTime ||
                trip.selectedFerry?.departureTime ||
                trip.selectedFerry?.time ||
                trip.selectedTrip?.departureTime ||
                trip.selectedTrip?.time ||
                trip.time ||
                "",

            passengerName:
                trip.passengerName ||
                trip.name ||
                "",

            passengerAge:
                trip.passengerAge ||
                trip.age ||
                "",

            passengerGender:
                trip.passengerGender ||
                trip.gender ||
                "",

            passengers:
                Number(
                    trip.passengers ||
                    trip.numberOfPassengers ||
                    1
                ),

            vehicleType:
                trip.vehicleType ||
                trip.vehicle ||
                trip.vehicleDetails?.type ||
                "Motorcycle",

            plateNumber:
                trip.plateNumber ||
                trip.plate_number ||
                trip.plate ||
                trip.motorcyclePlateNumber ||
                trip.vehiclePlateNumber ||
                trip.vehicleDetails?.plateNumber ||
                trip.vehicleDetails?.plate ||
                trip.motorcycle?.plateNumber ||
                ""
        }
        : null;

    // =========================================================
    // MISSING TRIP
    // =========================================================

    if (!normalizedTrip) {

        return (

            <main className="maya-page">

                <div className="maya-container maya-missing-container">

                    <div className="maya-missing-icon">
                        !
                    </div>

                    <h2>
                        Trip Details Not Found
                    </h2>

                    <p>
                        Please return to the booking page
                        and select your trip again.
                    </p>

                    <button
                        type="button"
                        className="maya-primary-button"
                        onClick={() =>
                            navigate("/book-trip")
                        }
                    >
                        Back to Book Trip
                    </button>

                </div>

                <style>{`

                    * {
                        box-sizing: border-box;
                    }

                    .maya-page {
                        min-height: 100vh;

                        display: flex;
                        align-items: center;
                        justify-content: center;

                        padding: 20px;

                        background: #f7f8fa;

                        font-family:
                            Arial,
                            Helvetica,
                            sans-serif;
                    }

                    .maya-missing-container {
                        width: 100%;
                        max-width: 520px;

                        padding: 40px;

                        text-align: center;

                        background: #ffffff;

                        border:
                            1px solid #e8e8e8;

                        border-radius: 18px;

                        box-shadow:
                            0 10px 35px
                            rgba(0,0,0,0.06);
                    }

                    .maya-missing-icon {
                        width: 55px;
                        height: 55px;

                        margin: 0 auto 15px;

                        display: flex;
                        align-items: center;
                        justify-content: center;

                        border-radius: 50%;

                        background: #fff1e4;

                        color: #f28c28;

                        font-size: 25px;
                        font-weight: 800;
                    }

                    .maya-missing-container h2 {
                        margin: 0 0 8px;

                        color: #222222;

                        font-size: 22px;
                    }

                    .maya-missing-container p {
                        margin: 0 0 25px;

                        color: #777777;

                        font-size: 13px;

                        line-height: 1.5;
                    }

                    .maya-primary-button {
                        width: 100%;

                        height: 50px;

                        border: none;

                        border-radius: 10px;

                        background: #f28c28;

                        color: #ffffff;

                        font-size: 14px;

                        font-weight: 700;

                        cursor: pointer;
                    }

                `}</style>

            </main>
        );
    }

    // =========================================================
    // FARES
    // =========================================================

    const passengers =
        Math.max(
            1,
            Number(
                normalizedTrip.passengers || 1
            )
        );

    const passengerFare =
        passengers * 40;

    const motorcycleFare =
        String(normalizedTrip.vehicleType || '')
            .trim()
            .toLowerCase() === 'motorcycle'
            ? 150
            : 0;

    const ppaFee =
        65;

    const totalFare =
        passengerFare +
        motorcycleFare +
        ppaFee;

    // =========================================================
    // BOOKING REFERENCE
    // =========================================================

    let bookingReference =
        sessionStorage.getItem(
            "currentBookingReference"
        );

    if (!bookingReference) {

        bookingReference =
            trip.bookingReference ||
            "GG-" +
            Math.floor(
                100000 +
                Math.random() * 900000
            );

        sessionStorage.setItem(
            "currentBookingReference",
            bookingReference
        );
    }

    // =========================================================
    // DISPLAY VALUES
    // =========================================================

    const displayPassengerName =
        normalizedTrip.passengerName ||
        "N/A";

    const displayPassengerAge =
        normalizedTrip.passengerAge ||
        "N/A";

    const displayPassengerGender =
        normalizedTrip.passengerGender ||
        "N/A";

    const displayRoute =
        `${normalizedTrip.origin || "N/A"} → ${
            normalizedTrip.destination || "N/A"
        }`;

    const displayVehicle =
        normalizedTrip.vehicleType ||
        "Motorcycle";

    const displayPlate =
        normalizedTrip.plateNumber
            ? String(
                normalizedTrip.plateNumber
            )
                .trim()
                .toUpperCase()
            : "N/A";

    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (date) => {

        if (!date) {
            return "N/A";
        }

        try {

            return new Date(
                `${date}T00:00:00`
            ).toLocaleDateString(
                "en-US",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );

        } catch (error) {

            return date;
        }
    };

    // =========================================================
    // FORMAT TIME
    // =========================================================

    const formatTime = (time) => {

        if (!time) {
            return "N/A";
        }

        const stringTime =
            String(time);

        if (
            stringTime
                .toUpperCase()
                .includes("AM") ||
            stringTime
                .toUpperCase()
                .includes("PM")
        ) {
            return stringTime;
        }

        const parts =
            stringTime.split(":");

        if (parts.length < 2) {
            return stringTime;
        }

        const hours =
            Number(parts[0]);

        const minutes =
            parts[1];

        const suffix =
            hours >= 12
                ? "PM"
                : "AM";

        const displayHour =
            hours % 12 || 12;

        return `${displayHour}:${minutes} ${suffix}`;
    };

    // =========================================================
    // PAYMENT PROOF UPLOAD
    // =========================================================

    const handleProofUpload = (event) => {

        setErrorMessage("");

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        // =====================================================
        // FILE TYPE
        // =====================================================

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png"
        ];

        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            setErrorMessage(
                "Please upload a JPG, JPEG, or PNG image."
            );

            event.target.value = "";

            return;
        }

        // =====================================================
        // FILE SIZE
        // =====================================================

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            setErrorMessage(
                "The payment proof must be smaller than 5 MB."
            );

            event.target.value = "";

            return;
        }

        // =====================================================
        // SAVE FILE
        // =====================================================

        setPaymentProof(file);

        // =====================================================
        // CREATE PREVIEW
        // =====================================================

        const reader =
            new FileReader();

        reader.onload = () => {

            setProofPreview(
                reader.result
            );
        };

        reader.onerror = () => {

            setErrorMessage(
                "Unable to read the payment proof image."
            );

            setPaymentProof(null);

            setProofPreview(null);
        };

        reader.readAsDataURL(file);
    };

    // =========================================================
    // REMOVE PAYMENT PROOF
    // =========================================================

    const handleRemoveProof = () => {

        setPaymentProof(null);

        setProofPreview(null);

        setErrorMessage("");

        const input =
            document.getElementById(
                "payment-proof"
            );

        if (input) {
            input.value = "";
        }
    };

    // =========================================================
    // COMPLETE PAYMENT
    // =========================================================

    const handleCompletedPayment =
        async () => {

        setErrorMessage("");

        // =====================================================
        // CHECK PAYMENT PROOF
        // =====================================================

        if (
            !paymentProof ||
            !proofPreview
        ) {

            setErrorMessage(
                "Please upload your Maya payment receipt screenshot before submitting."
            );

            return;
        }

        setIsSubmitting(true);

        try {

            // =================================================
            // STEP 1 — UPLOAD PAYMENT PROOF
            // =================================================

            const formData =
                new FormData();

            formData.append(
                "paymentProof",
                paymentProof
            );

            const uploadResponse =
                await fetch(
                    `${API_URL}/api/payment/upload-proof`,
                    {
                        method: "POST",

                        body:
                            formData
                    }
                );

            let uploadResult;

            try {

                uploadResult =
                    await uploadResponse.json();

            } catch (jsonError) {

                throw new Error(
                    "The server returned an invalid response while uploading the payment proof."
                );
            }

            if (
                !uploadResponse.ok ||
                !uploadResult.success
            ) {

                throw new Error(
                    uploadResult.message ||
                    "Payment proof upload failed."
                );
            }

            const uploadedProof =
                uploadResult.file;

            if (!uploadedProof) {

                throw new Error(
                    "The server did not return the uploaded payment proof."
                );
            }

            // =================================================
            // STEP 2 — CREATE COMPLETE BOOKING
            // =================================================

            const completedBooking = {

                bookingReference,

                // ---------------------------------------------
                // ROUTE
                // ---------------------------------------------

                origin:
                    normalizedTrip.origin,

                destination:
                    normalizedTrip.destination,

                // ---------------------------------------------
                // SCHEDULE
                // ---------------------------------------------

                date:
                    normalizedTrip.date,

                time:
                    normalizedTrip.time,

                // ---------------------------------------------
                // SELECTED FERRY
                // ---------------------------------------------

                ferryId:
                    normalizedTrip.ferryId ||
                    "",

                ferryName:
                    normalizedTrip.ferryName ||
                    normalizedTrip.vesselName ||
                    "",

                vesselName:
                    normalizedTrip.vesselName ||
                    normalizedTrip.ferryName ||
                    "",

                departureTime:
                    normalizedTrip.departureTime ||
                    normalizedTrip.time ||
                    "",

                // ---------------------------------------------
                // PASSENGER
                // ---------------------------------------------

                passengerName:
                    normalizedTrip.passengerName,

                passengerAge:
                    normalizedTrip.passengerAge,

                passengerGender:
                    normalizedTrip.passengerGender,

                passengers,

                // ---------------------------------------------
                // VEHICLE
                // ---------------------------------------------

                vehicleType:
                    normalizedTrip.vehicleType,

                plateNumber:
                    normalizedTrip.plateNumber,

                // ---------------------------------------------
                // FARE
                // ---------------------------------------------

                passengerFare,

                motorcycleFare,

                ppaFee,

                totalFare,

                requiredAmount:
                    totalFare,

                totalPaid:
                    null,

                // ---------------------------------------------
                // PAYMENT
                // ---------------------------------------------

                paymentMethod:
                    "Maya / QRPh",

                paymentStatus:
                    "PENDING VERIFICATION",

                // ---------------------------------------------
                // BOOKING STATUS
                // ---------------------------------------------

                status:
                    "PENDING PAYMENT VERIFICATION",

                // ---------------------------------------------
                // PAYMENT PROOF
                // ---------------------------------------------

                paymentProof: {

                    fileName:
                        uploadedProof.filename,

                    originalName:
                        uploadedProof.originalName,

                    fileType:
                        uploadedProof.mimetype,

                    fileSize:
                        uploadedProof.size,

                    url:
                        uploadedProof.url,

                    uploadedAt:
                        new Date().toISOString()
                },

                // ---------------------------------------------
                // TIMESTAMP
                // ---------------------------------------------

                bookedAt:
                    new Date().toISOString()
            };

            // =================================================
            // STEP 3 — SAVE BOOKING TO MONGODB
            // =================================================

            let bookingResponse;
            let bookingResult;

            // =================================================
            // STEP 3 — SAVE BOOKING TO MONGODB
            // =================================================
            //
            // A booking reference must be unique in MongoDB.
            // If an old/stale reference is still present in
            // sessionStorage, the server may return HTTP 409.
            // In that case we generate a completely fresh
            // reference and retry the same booking once.
            // This does NOT change any trip, fare, passenger,
            // vehicle, or payment information.
            //

            const createBookingRequest = async (bookingData) => {

                const response =
                    await fetch(
                        `${API_URL}/api/payment/create-booking`,
                        {
                            method: "POST",

                            headers: (() => {

                                const token =
                                    getAuthToken();

                                if (!token) {

                                    throw new Error(
                                        "Authentication required. Please log in again before submitting the payment."
                                    );

                                }

                                return {
                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`
                                };

                            })(),

                            body:
                                JSON.stringify(
                                    bookingData
                                )
                        }
                    );

                let result;

                try {

                    result =
                        await response.json();

                } catch (jsonError) {

                    throw new Error(
                        "The server returned an invalid response while saving the booking."
                    );
                }

                return {
                    response,
                    result
                };
            };

            ({
                response: bookingResponse,
                result: bookingResult
            } = await createBookingRequest(
                completedBooking
            ));

            // =================================================
            // HANDLE STALE / DUPLICATE REFERENCE
            // =================================================

            if (
                bookingResponse.status === 409 &&
                bookingResult?.message ===
                    "This booking reference already exists."
            ) {

                const timestamp =
                    Date.now().toString().slice(-8);

                const randomPart =
                    Math.floor(
                        1000 +
                        Math.random() * 9000
                    );

                bookingReference =
                    `GG-${timestamp}-${randomPart}`;

                completedBooking.bookingReference =
                    bookingReference;

                // Keep the new reference synchronized
                // with the current browser session.
                sessionStorage.setItem(
                    "currentBookingReference",
                    bookingReference
                );

                sessionStorage.setItem(
                    "bookingReference",
                    bookingReference
                );

                // Retry the exact same booking with the
                // newly generated unique reference.
                ({
                    response: bookingResponse,
                    result: bookingResult
                } = await createBookingRequest(
                    completedBooking
                ));
            }

            if (
                !bookingResponse.ok ||
                !bookingResult.success
            ) {

                throw new Error(
                    bookingResult.message ||
                    "Unable to save booking to the database."
                );
            }

            // =================================================
            // STEP 4 — GET SAVED BOOKING
            // =================================================

            const savedBooking =
                bookingResult.booking ||
                completedBooking;

            // =================================================
            // STEP 5 — SAVE PAYMENT STATUS
            // =================================================

            sessionStorage.setItem(
                "paymentStatus",
                "PENDING VERIFICATION"
            );

            sessionStorage.setItem(
                "paymentMethod",
                "Maya / QRPh"
            );

            // =================================================
            // STEP 6 — SAVE CONFIRMED BOOKING
            // =================================================

            sessionStorage.setItem(
                "confirmedBooking",
                JSON.stringify(
                    savedBooking
                )
            );

            // =================================================
            // STEP 7 — SAVE LATEST BOOKING
            // =================================================

            sessionStorage.setItem(
                "latestBooking",
                JSON.stringify(
                    savedBooking
                )
            );

            // =================================================
            // STEP 8 — SAVE BOOKING HISTORY
            // =================================================

            let allBookings = [];

            try {

                const savedAllBookings =
                    sessionStorage.getItem(
                        "allBookings"
                    );

                if (savedAllBookings) {

                    const parsed =
                        JSON.parse(
                            savedAllBookings
                        );

                    if (
                        Array.isArray(parsed)
                    ) {

                        allBookings =
                            parsed;
                    }
                }

            } catch (historyError) {

                console.error(
                    "Unable to load booking history:",
                    historyError
                );

                allBookings = [];
            }

            // =================================================
            // CHECK DUPLICATE
            // =================================================

            const existingIndex =
                allBookings.findIndex(
                    (item) =>
                        item.bookingReference ===
                        savedBooking.bookingReference
                );

            if (
                existingIndex === -1
            ) {

                allBookings.push(
                    savedBooking
                );

            } else {

                allBookings[
                    existingIndex
                ] = {

                    ...allBookings[
                        existingIndex
                    ],

                    ...savedBooking
                };
            }

            // =================================================
            // SAVE ALL BOOKINGS
            // =================================================

            sessionStorage.setItem(
                "allBookings",
                JSON.stringify(
                    allBookings
                )
            );

            // =================================================
            // SAVE RECENT BOOKINGS
            // =================================================

            const recentBookings =
                [...allBookings]
                    .reverse()
                    .slice(0, 3);

            sessionStorage.setItem(
                "recentBookings",
                JSON.stringify(
                    recentBookings
                )
            );

            // =================================================
            // SAVE PAYMENT DETAILS
            // =================================================

            const paymentDetails = {

                paymentMethod:
                    "maya_qrph",

                amount:
                    totalFare,

                currency:
                    "PHP",

                status:
                    "PENDING VERIFICATION",

                bookingReference,

                paymentProof: {

                    fileName:
                        uploadedProof.filename,

                    originalName:
                        uploadedProof.originalName,

                    fileType:
                        uploadedProof.mimetype,

                    fileSize:
                        uploadedProof.size,

                    url:
                        uploadedProof.url
                },

                trip:
                    normalizedTrip
            };

            sessionStorage.setItem(
                "paymentDetails",
                JSON.stringify(
                    paymentDetails
                )
            );

            // =================================================
            // CLEAN CURRENT REFERENCE
            // =================================================

            sessionStorage.removeItem(
                "currentBookingReference"
            );

            sessionStorage.removeItem(
                "bookingReference"
            );

            // =================================================
            // GO TO CONFIRMATION
            // =================================================

            navigate(
                "/confirmation",
                {
                    replace: true
                }
            );

        } catch (error) {

            console.error(
                "Payment submission failed:",
                error
            );

            setErrorMessage(
                error.message ||
                "Unable to submit payment. Please try again."
            );

        } finally {

            setIsSubmitting(false);
        }
    };

    // =========================================================
    // PAGE
    // =========================================================

    return (

        <main className="maya-page">

            <div className="maya-container">

                {/* =================================================
                    BACK BUTTON
                ================================================= */}

                <button
                    type="button"
                    className="maya-back-button"
                    onClick={() =>
                        navigate("/payment")
                    }
                >
                    ← Back to Payment
                </button>


                {/* =================================================
                    LOGO
                ================================================= */}

                <div className="maya-logo">

                    <img
                        src={LOGO_URL}
                        alt="GuimarasGo Logo"
                    />

                </div>


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="maya-heading">

                    <div className="maya-icon">
                        M
                    </div>

                    <div>

                        <h1>
                            Maya / QRPh Payment
                        </h1>

                        <p>
                            Scan the merchant QR code
                            to make your payment.
                        </p>

                    </div>

                </div>


                {/* =================================================
                    PAYMENT NOTICE
                ================================================= */}

                <div className="maya-payment-notice">

                    <strong>
                        IMPORTANT
                    </strong>

                    <p>
                        • Scan the QR code below using
                        Maya or another supported QRPh
                        payment app.
                    </p>

                    <p>
                        • After successfully paying,
                        save a screenshot of your Maya
                        payment receipt.
                    </p>

                </div>


                {/* =================================================
                    MAYA QR
                ================================================= */}

                <div className="maya-qr-section">

                    <div className="maya-merchant-label">
                        Maya Business Merchant
                    </div>

                    <img
                        className="maya-qr"
                        src={MAYA_QR_URL}
                        alt="Maya Business Merchant QR Code"
                    />

                    <h3>
                        GuimarasGO
                    </h3>

                    <p>
                        Scan this QR code using
                        Maya or any supported QRPh
                        payment app.
                    </p>

                </div>


                {/* =================================================
                    AMOUNT
                ================================================= */}

                <div className="maya-amount-card">

                    <span>
                        Amount to Pay
                    </span>

                    <strong>
                        ₱{totalFare.toFixed(2)}
                    </strong>

                    <p>
                        Please send exactly this amount
                        to the merchant.
                    </p>

                </div>


                {/* =================================================
                    PAYMENT DETAILS
                    UNIQUE CLASS NAMES
                    TO PREVENT CSS CONFLICTS
                ================================================= */}

                <section className="maya-payment-details">

                    <div className="maya-payment-details-header">

                        <div>

                            <h2>
                                Payment Details
                            </h2>

                            <p>
                                Review your booking information
                                before submitting your payment.
                            </p>

                        </div>

                    </div>


                    <div className="maya-details-grid">

                        {/* =================================================
                            BOOKING REFERENCE
                        ================================================= */}

                        <div className="maya-detail-item">

                            <span className="maya-detail-label">
                                Booking Reference
                            </span>

                            <strong className="maya-detail-value maya-reference">
                                {bookingReference}
                            </strong>

                        </div>


                        {/* =================================================
                            FERRY / VESSEL
                        ================================================= */}

                        <div className="maya-detail-item">

                            <span className="maya-detail-label">
                                Ferry / Vessel
                            </span>

                            <strong className="maya-detail-value">
                                {normalizedTrip.vesselName ||
                                    normalizedTrip.ferryName ||
                                    "N/A"}
                            </strong>

                        </div>


                        {/* =================================================
                            PASSENGER
                        ================================================= */}

                        <div className="maya-detail-item">

                            <span className="maya-detail-label">
                                Passenger
                            </span>

                            <strong className="maya-detail-value">
                                {displayPassengerName}
                            </strong>

                        </div>


                        {/* =================================================
                            AGE
                        ================================================= */}

                        <div className="maya-detail-item">

                            <span className="maya-detail-label">
                                Age
                            </span>

                            <strong className="maya-detail-value">
                                {displayPassengerAge}
                            </strong>

                        </div>


                        {/* =================================================
                            GENDER
                        ================================================= */}

                        <div className="maya-detail-item">

                            <span className="maya-detail-label">
                                Gender
                            </span>

                            <strong className="maya-detail-value">
                                {displayPassengerGender}
                            </strong>

                        </div>


                        {/* =================================================
                            PASSENGERS
                        ================================================= */}

                        <div className="maya-detail-item">

                            <span className="maya-detail-label">
                                Passengers
                            </span>

                            <strong className="maya-detail-value">
                                {passengers}
                                {" "}
                                {passengers === 1
                                    ? "Passenger"
                                    : "Passengers"}
                            </strong>

                        </div>


                        {/* =================================================
                            ROUTE
                        ================================================= */}

                        <div className="maya-detail-item maya-route-item">

                            <span className="maya-detail-label">
                                Route
                            </span>

                            <strong className="maya-detail-value maya-route-value">
                                {displayRoute}
                            </strong>

                        </div>


                        {/* =================================================
                            DEPARTURE
                        ================================================= */}

                        <div className="maya-detail-item">

                            <span className="maya-detail-label">
                                Departure
                            </span>

                            <strong className="maya-detail-value">
                                {formatTime(
                                    normalizedTrip.time
                                )}
                            </strong>

                        </div>


                        {/* =================================================
                            VEHICLE
                        ================================================= */}

                        <div className="maya-detail-item">

                            <span className="maya-detail-label">
                                Vehicle
                            </span>

                            <strong className="maya-detail-value">
                                {displayVehicle}
                            </strong>

                        </div>
                        <div className="maya-detail-item">

                            <span className="maya-detail-label">
                                Plate Number
                            </span>

                            <strong className="maya-detail-value maya-plate-value">
                                {displayPlate}
                            </strong>

                        </div>

                    </div>

                </section>
                <section className="maya-payment-proof-section">

                    <div className="maya-section-heading">

                        <h2>
                            Upload Payment Receipt
                        </h2>

                        <p>
                            Upload a screenshot of your
                            Maya payment receipt.
                        </p>

                    </div>


                    <label
                        htmlFor="payment-proof"
                        className="maya-upload-button"
                    >

                        <span className="maya-upload-icon">
                            ↑
                        </span>

                        <span>
                            {paymentProof
                                ? "Change Payment Receipt"
                                : "Choose Payment Receipt"}
                        </span>

                    </label>


                    <input
                        id="payment-proof"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={
                            handleProofUpload
                        }
                        hidden
                    />


                    <p className="maya-upload-note">
                        JPG, JPEG, or PNG only • Maximum 5 MB
                    </p>


                    {/* =================================================
                        PREVIEW
                    ================================================= */}

                    {proofPreview && (

                        <div className="maya-proof-preview">

                            <div className="maya-proof-preview-header">

                                <strong>
                                    Payment Receipt Preview
                                </strong>

                                <button
                                    type="button"
                                    className="maya-remove-proof"
                                    onClick={
                                        handleRemoveProof
                                    }
                                >
                                    Remove
                                </button>

                            </div>


                            <img
                                src={proofPreview}
                                alt="Payment receipt preview"
                            />


                            <p>
                                {paymentProof?.name}
                            </p>

                        </div>

                    )}


                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {errorMessage && (

                        <div className="maya-error-message">

                            <strong>
                                Unable to continue
                            </strong>

                            <span>
                                {errorMessage}
                            </span>

                        </div>

                    )}

                </section>


                {/* =================================================
                    SUBMIT BUTTON
                ================================================= */}

                <button
                    type="button"
                    className="maya-complete-payment-button"
                    onClick={
                        handleCompletedPayment
                    }
                    disabled={isSubmitting}
                >

                    {isSubmitting
                        ? "Submitting Payment..."
                        : "Submit Payment"
                    }

                </button>


                {/* =================================================
                    BOTTOM NOTE
                ================================================= */}

                <p className="maya-bottom-note">

                    Your payment will remain
                    <strong>
                        {" "}Pending Verification
                    </strong>
                    {" "}until an administrator
                    verifies your receipt.

                </p>

            </div>


            {/* =====================================================
                ALL PAGE CSS
            ===================================================== */}

            <style>{`

                /* =================================================
                   GLOBAL
                ================================================= */

                * {
                    box-sizing: border-box;
                }

                html,
                body,
                #root {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    min-height: 100%;
                }

                body {
                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    background:
                        #f7f8fa;
                }

                button,
                input {
                    font-family: inherit;
                }


                /* =================================================
                   PAGE
                ================================================= */

                .maya-page {

                    width: 100%;
                    min-height: 100vh;

                    padding:
                        35px 20px 60px;

                    background:
                        linear-gradient(
                            180deg,
                            #fffaf7 0%,
                            #f7f8fa 45%,
                            #f7f8fa 100%
                        );
                }


                /* =================================================
                   MAIN CONTAINER
                ================================================= */

                .maya-container {

                    width: 100%;

                    max-width:
                        760px;

                    margin:
                        0 auto;

                    padding:
                        28px 32px 35px;

                    background:
                        #ffffff;

                    border:
                        1px solid #e7e7e7;

                    border-radius:
                        20px;

                    box-shadow:
                        0 12px 40px
                        rgba(
                            0,
                            0,
                            0,
                            0.06
                        );
                }


                /* =================================================
                   BACK BUTTON
                ================================================= */

                .maya-back-button {

                    border:
                        none;

                    background:
                        transparent;

                    color:
                        #777777;

                    font-size:
                        12px;

                    font-weight:
                        600;

                    cursor:
                        pointer;

                    padding:
                        4px 0;

                    margin-bottom:
                        12px;
                }

                .maya-back-button:hover {
                    color:
                        #f28c28;
                }


                /* =================================================
                   LOGO
                ================================================= */

                .maya-logo {

                    width:
                        150px;

                    height:
                        90px;

                    margin:
                        0 auto 5px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;
                }

                .maya-logo img {

                    width:
                        150px;

                    height:
                        90px;

                    object-fit:
                        contain;

                    display:
                        block;
                }


                /* =================================================
                   HEADER
                ================================================= */

                .maya-heading {

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    gap:
                        12px;

                    margin:
                        5px auto 22px;

                    text-align:
                        left;

                    max-width:
                        560px;
                }

                .maya-icon {

                    width:
                        48px;

                    height:
                        48px;

                    flex:
                        0 0 48px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        13px;

                    background:
                        #eaf8ef;

                    color:
                        #159447;

                    font-size:
                        22px;

                    font-weight:
                        800;
                }

                .maya-heading h1 {

                    margin:
                        0;

                    color:
                        #222222;

                    font-size:
                        23px;

                    line-height:
                        1.2;

                    font-weight:
                        800;
                }

                .maya-heading p {

                    margin:
                        5px 0 0;

                    color:
                        #888888;

                    font-size:
                        12px;

                    line-height:
                        1.4;
                }


                /* =================================================
                   PAYMENT NOTICE
                ================================================= */

                .maya-payment-notice {

                    width:
                        100%;

                    margin-bottom:
                        20px;

                    padding:
                        15px 17px;

                    border:
                        1px solid #f4dfc7;

                    border-left:
                        4px solid #f28c28;

                    border-radius:
                        11px;

                    background:
                        #fff9f1;
                }

                .maya-payment-notice strong {

                    display:
                        block;

                    margin-bottom:
                        6px;

                    color:
                        #c56d13;

                    font-size:
                        12px;

                    font-weight:
                        800;
                }

                .maya-payment-notice p {

                    margin:
                        4px 0;

                    color:
                        #777777;

                    font-size:
                        11px;

                    line-height:
                        1.55;
                }


                /* =================================================
                   MAYA QR SECTION
                ================================================= */

                .maya-qr-section {

                    width:
                        100%;

                    margin-bottom:
                        20px;

                    padding:
                        22px;

                    text-align:
                        center;

                    border:
                        1px solid #e8e8e8;

                    border-radius:
                        15px;

                    background:
                        #ffffff;
                }

                .maya-merchant-label {

                    margin-bottom:
                        14px;

                    color:
                        #777777;

                    font-size:
                        12px;

                    font-weight:
                        600;
                }

                .maya-qr {

                    display:
                        block;

                    width:
                        260px;

                    height:
                        260px;

                    max-width:
                        100%;

                    margin:
                        0 auto;

                    object-fit:
                        contain;

                    border:
                        1px solid #eeeeee;

                    border-radius:
                        8px;

                    background:
                        #ffffff;
                }

                .maya-qr-section h3 {

                    margin:
                        15px 0 5px;

                    color:
                        #222222;

                    font-size:
                        17px;

                    font-weight:
                        800;
                }

                .maya-qr-section p {

                    margin:
                        0;

                    color:
                        #888888;

                    font-size:
                        11px;

                    line-height:
                        1.5;
                }


                /* =================================================
                   AMOUNT
                ================================================= */

                .maya-amount-card {

                    width:
                        100%;

                    margin-bottom:
                        20px;

                    padding:
                        20px;

                    text-align:
                        center;

                    border:
                        1px solid #eee4ff;

                    border-radius:
                        15px;

                    background:
                        #faf8ff;
                }

                .maya-amount-card span {

                    display:
                        block;

                    margin-bottom:
                        5px;

                    color:
                        #777777;

                    font-size:
                        12px;
                }

                .maya-amount-card strong {

                    display:
                        block;

                    color:
                        #7046d8;

                    font-size:
                        30px;

                    line-height:
                        1.2;

                    font-weight:
                        800;
                }

                .maya-amount-card p {

                    margin:
                        7px 0 0;

                    color:
                        #888888;

                    font-size:
                        11px;

                    line-height:
                        1.45;
                }


                /* =================================================
                   PAYMENT DETAILS CARD
                   IMPORTANT:
                   UNIQUE CLASS NAMES
                ================================================= */

                .maya-payment-details {

                    width:
                        100%;

                    margin-bottom:
                        20px;

                    padding:
                        22px;

                    border:
                        1px solid #e5e5e5;

                    border-radius:
                        16px;

                    background:
                        #ffffff;

                    overflow:
                        hidden;
                }


                .maya-payment-details-header {

                    width:
                        100%;

                    margin-bottom:
                        18px;

                    padding-bottom:
                        14px;

                    border-bottom:
                        1px solid #eeeeee;
                }


                .maya-payment-details-header h2 {

                    margin:
                        0;

                    color:
                        #222222;

                    font-size:
                        18px;

                    line-height:
                        1.25;

                    font-weight:
                        800;
                }


                .maya-payment-details-header p {

                    margin:
                        5px 0 0;

                    color:
                        #888888;

                    font-size:
                        11px;

                    line-height:
                        1.5;
                }


                /* =================================================
                   NEW GRID
                ================================================= */

                .maya-details-grid {

                    width:
                        100%;

                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            3,
                            minmax(
                                0,
                                1fr
                            )
                        );

                    gap:
                        0;

                    border:
                        1px solid #eeeeee;

                    border-radius:
                        12px;

                    overflow:
                        hidden;

                    background:
                        #ffffff;
                }


                /* =================================================
                   EACH DETAIL
                ================================================= */

                .maya-detail-item {

                    min-width:
                        0;

                    min-height:
                        88px;

                    padding:
                        16px 17px;

                    display:
                        flex;

                    flex-direction:
                        column;

                    justify-content:
                        center;

                    background:
                        #ffffff;

                    border-right:
                        1px solid #eeeeee;

                    border-bottom:
                        1px solid #eeeeee;
                }


                /* Remove right border
                   from every third item */

                .maya-detail-item:nth-child(3n) {

                    border-right:
                        none;
                }


                /* Remove bottom border
                   from the final row */

                .maya-detail-item:nth-child(7),
                .maya-detail-item:nth-child(8),
                .maya-detail-item:nth-child(9) {

                    border-bottom:
                        none;
                }


                /* =================================================
                   LABEL
                ================================================= */

                .maya-detail-label {

                    display:
                        block;

                    margin-bottom:
                        7px;

                    color:
                        #777777;

                    font-size:
                        11px;

                    line-height:
                        1.3;

                    font-weight:
                        500;

                    white-space:
                        normal;
                }


                /* =================================================
                   VALUE
                ================================================= */

                .maya-detail-value {

                    display:
                        block;

                    min-width:
                        0;

                    max-width:
                        100%;

                    color:
                        #222222;

                    font-size:
                        14px;

                    line-height:
                        1.35;

                    font-weight:
                        700;

                    white-space:
                        normal;

                    overflow-wrap:
                        break-word;

                    word-break:
                        normal;
                }


                /* =================================================
                   BOOKING REFERENCE
                ================================================= */

                .maya-reference {

                    color:
                        #f28c28;

                    letter-spacing:
                        0.2px;

                    white-space:
                        nowrap;
                }


                /* =================================================
                   ROUTE
                ================================================= */

                .maya-route-value {

                    white-space:
                        normal;

                    overflow-wrap:
                        normal;

                    word-break:
                        normal;
                }


                /* =================================================
                   PLATE
                ================================================= */

                .maya-plate-value {

                    text-transform:
                        uppercase;

                    letter-spacing:
                        0.3px;

                    white-space:
                        nowrap;
                }


                /* =================================================
                   PAYMENT PROOF
                ================================================= */

                .maya-payment-proof-section {

                    width:
                        100%;

                    margin-bottom:
                        18px;

                    padding:
                        22px;

                    border:
                        1px solid #e5e5e5;

                    border-radius:
                        16px;

                    background:
                        #ffffff;
                }


                .maya-section-heading {

                    margin-bottom:
                        15px;
                }


                .maya-section-heading h2 {

                    margin:
                        0;

                    color:
                        #222222;

                    font-size:
                        18px;

                    font-weight:
                        800;
                }


                .maya-section-heading p {

                    margin:
                        5px 0 0;

                    color:
                        #888888;

                    font-size:
                        11px;

                    line-height:
                        1.5;
                }


                /* =================================================
                   UPLOAD
                ================================================= */

                .maya-upload-button {

                    width:
                        100%;

                    min-height:
                        54px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    gap:
                        9px;

                    padding:
                        12px;

                    border:
                        1px dashed #9a7be8;

                    border-radius:
                        11px;

                    background:
                        #faf8ff;

                    color:
                        #7046d8;

                    font-size:
                        13px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;
                }


                .maya-upload-button:hover {

                    background:
                        #f2edff;

                    border-color:
                        #7046d8;
                }


                .maya-upload-icon {

                    width:
                        25px;

                    height:
                        25px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        50%;

                    background:
                        #eee7ff;

                    font-size:
                        16px;
                }


                .maya-upload-note {

                    margin:
                        8px 0 0;

                    text-align:
                        center;

                    color:
                        #999999;

                    font-size:
                        10px;
                }


                /* =================================================
                   PREVIEW
                ================================================= */

                .maya-proof-preview {

                    margin-top:
                        18px;

                    padding:
                        12px;

                    border:
                        1px solid #eeeeee;

                    border-radius:
                        10px;

                    background:
                        #fafafa;
                }


                .maya-proof-preview-header {

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        10px;

                    margin-bottom:
                        10px;
                }


                .maya-proof-preview-header strong {

                    color:
                        #333333;

                    font-size:
                        13px;
                }


                .maya-remove-proof {

                    border:
                        none;

                    background:
                        transparent;

                    color:
                        #d33b3b;

                    font-size:
                        12px;

                    font-weight:
                        700;

                    cursor:
                        pointer;
                }


                .maya-remove-proof:hover {

                    text-decoration:
                        underline;
                }


                .maya-proof-preview img {

                    display:
                        block;

                    width:
                        100%;

                    max-height:
                        500px;

                    object-fit:
                        contain;

                    border-radius:
                        8px;

                    background:
                        #ffffff;
                }


                .maya-proof-preview p {

                    margin:
                        8px 0 0;

                    color:
                        #777777;

                    font-size:
                        11px;

                    word-break:
                        break-word;
                }


                /* =================================================
                   ERROR
                ================================================= */

                .maya-error-message {

                    display:
                        flex;

                    flex-direction:
                        column;

                    gap:
                        3px;

                    margin-top:
                        12px;

                    padding:
                        11px 12px;

                    border:
                        1px solid #ffd1d1;

                    border-left:
                        4px solid #d33b3b;

                    border-radius:
                        9px;

                    background:
                        #fff4f4;

                    color:
                        #c62828;

                    font-size:
                        11px;

                    line-height:
                        1.4;
                }


                .maya-error-message strong {

                    font-size:
                        12px;
                }


                /* =================================================
                   SUBMIT
                ================================================= */

                .maya-complete-payment-button {

                    width:
                        100%;

                    min-height:
                        54px;

                    border:
                        none;

                    border-radius:
                        11px;

                    background:
                        #7046d8;

                    color:
                        #ffffff;

                    font-size:
                        14px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;
                }


                .maya-complete-payment-button:hover:not(:disabled) {

                    transform:
                        translateY(-1px);

                    box-shadow:
                        0 7px 18px
                        rgba(
                            112,
                            70,
                            216,
                            0.20
                        );
                }


                .maya-complete-payment-button:active:not(:disabled) {

                    transform:
                        translateY(0);
                }


                .maya-complete-payment-button:disabled {

                    opacity:
                        0.65;

                    cursor:
                        not-allowed;
                }


                /* =================================================
                   BOTTOM NOTE
                ================================================= */

                .maya-bottom-note {

                    margin:
                        14px 0 0;

                    text-align:
                        center;

                    color:
                        #888888;

                    font-size:
                        10px;

                    line-height:
                        1.5;
                }


                .maya-bottom-note strong {

                    color:
                        #7046d8;
                }


                /* =================================================
                   TABLET
                ================================================= */

                @media (max-width: 700px) {

                    .maya-page {

                        padding:
                            20px 14px 40px;
                    }


                    .maya-container {

                        padding:
                            24px 20px 28px;

                        border-radius:
                            17px;
                    }


                    .maya-details-grid {

                        grid-template-columns:
                            repeat(
                                2,
                                minmax(
                                    0,
                                    1fr
                                )
                            );
                    }


                    .maya-detail-item:nth-child(3n) {

                        border-right:
                            1px solid #eeeeee;
                    }


                    .maya-detail-item:nth-child(2n) {

                        border-right:
                            none;
                    }


                    .maya-detail-item:nth-child(7),
                    .maya-detail-item:nth-child(8),
                    .maya-detail-item:nth-child(9) {

                        border-bottom:
                            1px solid #eeeeee;
                    }


                    .maya-detail-item:nth-last-child(-n + 2) {

                        border-bottom:
                            none;
                    }


                    .maya-heading {

                        justify-content:
                            flex-start;
                    }

                }


                /* =================================================
                   MOBILE
                ================================================= */

                @media (max-width: 480px) {

                    .maya-page {

                        padding:
                            12px 9px 30px;
                    }


                    .maya-container {

                        padding:
                            20px 14px 24px;

                        border-radius:
                            15px;
                    }


                    .maya-logo {

                        width:
                            125px;

                        height:
                            80px;
                    }


                    .maya-logo img {

                        width:
                            125px;

                        height:
                            80px;
                    }


                    .maya-heading {

                        gap:
                            10px;

                        margin-bottom:
                            17px;
                    }


                    .maya-icon {

                        width:
                            40px;

                        height:
                            40px;

                        flex:
                            0 0 40px;

                        border-radius:
                            11px;

                        font-size:
                            18px;
                    }


                    .maya-heading h1 {

                        font-size:
                            19px;
                    }


                    .maya-heading p {

                        font-size:
                            10px;
                    }


                    .maya-payment-notice {

                        padding:
                            13px 14px;
                    }


                    .maya-payment-notice p {

                        font-size:
                            11px;
                    }


                    .maya-qr {

                        width:
                            220px;

                        height:
                            220px;
                    }


                    .maya-amount-card {

                        padding:
                            15px;

                        margin-bottom:
                            18px;
                    }


                    .maya-amount-card strong {

                        font-size:
                            27px;
                    }


                    .maya-payment-details,
                    .maya-payment-proof-section {

                        padding:
                            15px;
                    }


                    .maya-payment-details-header h2,
                    .maya-section-heading h2 {

                        font-size:
                            16px;
                    }


                    /* =================================================
                       PHONE = ONE CLEAN COLUMN
                    ================================================= */

                    .maya-details-grid {

                        grid-template-columns:
                            1fr;
                    }


                    .maya-detail-item {

                        min-height:
                            auto;

                        padding:
                            13px 14px;

                        border-right:
                            none !important;

                        border-bottom:
                            1px solid #eeeeee;
                    }


                    .maya-detail-item:last-child {

                        border-bottom:
                            none;
                    }


                    .maya-detail-label {

                        margin-bottom:
                            5px;

                        font-size:
                            10px;
                    }


                    .maya-detail-value {

                        font-size:
                            13px;

                        line-height:
                            1.4;
                    }


                    .maya-reference,
                    .maya-plate-value {

                        white-space:
                            normal;
                    }


                    .maya-route-value {

                        white-space:
                            normal;
                    }


                    .maya-upload-button {

                        min-height:
                            50px;

                        font-size:
                            12px;
                    }

                }

            `}</style>

        </main>
    );
};

export default MayaPayment;