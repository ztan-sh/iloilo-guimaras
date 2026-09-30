import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* =========================================================
   LOGO
========================================================= */

const LOGO_URL =
    "/images/guimarasgo-logo.png";

const Payment = () => {

    const navigate = useNavigate();
    const location = useLocation();


    /* =========================================================
       GET TRIP DETAILS
    ========================================================= */

    const savedTrip = sessionStorage.getItem("tripDetails");

    let storedTrip = null;

    try {

        storedTrip = savedTrip
            ? JSON.parse(savedTrip)
            : null;

    } catch (error) {

        console.error(
            "Unable to recover saved trip:",
            error
        );

        storedTrip = null;
    }


    const trip =
        location.state?.trip ||
        storedTrip ||
        null;


    /* =========================================================
       NORMALIZE TRIP INFORMATION
    ========================================================= */

    const normalizedTrip = trip
        ? {

            ...trip,

            /* =================================================
               FERRY / VESSEL INFORMATION

               Preserve the exact ferry selected on the
               passenger booking page all the way through
               payment. Older trip objects are also supported.
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


            /* Passenger information */

            passengerName:
                trip.passengerName ||
                trip.fullName ||
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


            /* =================================================
               PASSENGER COUNT

               Supports the different possible names that
               may come from the booking page.
            ================================================= */

            passengers:
                Number(
                    trip.passengers ||
                    trip.numberOfPassengers ||
                    trip.passengerCount ||
                    trip.totalPassengers ||
                    1
                ),


            /* Plate number */

            plateNumber:
                trip.plateNumber ||
                trip.plate_number ||
                trip.plate ||
                trip.motorcyclePlateNumber ||
                trip.vehiclePlateNumber ||
                trip.vehicleDetails?.plateNumber ||
                trip.vehicleDetails?.plate ||
                trip.motorcycle?.plateNumber ||
                "",


            /* Vehicle */

            vehicleType:
                trip.vehicleType ||
                trip.vehicle ||
                trip.vehicleDetails?.type ||
                "No Motorcycle",

        }
        : null;


    /* =========================================================
       PAYMENT METHOD
    ========================================================= */

    const [paymentMethod, setPaymentMethod] =
        useState("maya");


    /* =========================================================
       IF TRIP INFORMATION IS MISSING
    ========================================================= */

    if (!normalizedTrip) {

        return (

            <main className="payment-page">

                <div className="payment-container missing-trip">

                    <h2>
                        No trip details found.
                    </h2>

                    <p>
                        Please select your trip details
                        first.
                    </p>

                    <button
                        type="button"
                        className="back-trip-button"
                        onClick={() =>
                            navigate("/book-trip")
                        }
                    >
                        ← Back to Trip Details
                    </button>


                    <style>{`

                        * {
                            box-sizing: border-box;
                        }

                        body {
                            margin: 0;
                        }

                        .payment-page {
                            min-height: 100vh;
                            min-height: 100dvh;
                            background: #f7f8fa;
                            font-family:
                                Arial,
                                Helvetica,
                                sans-serif;
                            padding: 30px 20px;
                        }

                        .payment-container {
                            width: 100%;
                            max-width: 650px;
                            margin: 0 auto;
                            background: #ffffff;
                            border-radius: 24px;
                            box-shadow:
                                0 10px 35px
                                rgba(0, 0, 0, 0.08);
                        }

                        .missing-trip {
                            padding: 40px 30px;
                            text-align: center;
                        }

                        .missing-trip h2 {
                            margin: 0 0 10px;
                            color: #111111;
                        }

                        .missing-trip p {
                            color: #777777;
                        }

                        .back-trip-button {
                            margin-top: 20px;
                            border: none;
                            background: transparent;
                            color: #777777;
                            font-size: 13px;
                            cursor: pointer;
                        }

                        .back-trip-button:hover {
                            color: #f28c28;
                        }

                    `}</style>

                </div>

            </main>
        );
    }


    /* =========================================================
       PASSENGERS
    ========================================================= */

    const passengers =
        Number(
            normalizedTrip.passengers || 1
        );


    /* =========================================================
       FARES
    ========================================================= */

    const passengerRate = 40;

    const motorcycleFare = 150;

    const ppaFee = 65;


    /* =========================================================
       DETERMINE VEHICLE TYPE

       This is the important fix.

       Motorcycle bookings receive the motorcycle fare.

       Passenger-only bookings DO NOT receive the
       motorcycle fare.
    ========================================================= */

    const vehicleTypeValue =
        String(
            normalizedTrip.vehicleType || ""
        )
            .trim()
            .toLowerCase();


    /*
       IMPORTANT:

       "No Motorcycle" must NEVER be treated as a
       motorcycle booking just because the word
       "motorcycle" appears in the value.

       Motorcycle = motorcycle fare included.
       No Motorcycle / Passenger Only = no vehicle fare.
    */
    const isNoMotorcycle =
        vehicleTypeValue === "no motorcycle" ||
        vehicleTypeValue === "nomotorcycle" ||
        vehicleTypeValue === "no vehicle" ||
        vehicleTypeValue === "none" ||
        vehicleTypeValue === "passenger only" ||
        vehicleTypeValue === "passenger-only" ||
        vehicleTypeValue === "passenger" ||
        vehicleTypeValue === "";


    const isMotorcycle =
        !isNoMotorcycle &&
        (
            vehicleTypeValue === "motorcycle" ||
            vehicleTypeValue.includes("motorcycle")
        );


    /* =========================================================
       PASSENGER FARE
    ========================================================= */

    const passengerFare =
        passengers * passengerRate;


    /* =========================================================
       VEHICLE FARE
    ========================================================= */

    const applicableMotorcycleFare =
        isMotorcycle
            ? motorcycleFare
            : 0;


    /* =========================================================
       TOTAL FARE

       Passenger fare is ALWAYS included.

       Motorcycle fare is ONLY included when the booking
       contains a motorcycle.

       PPA fee is included for the booking.
    ========================================================= */

    const totalFare =
        passengerFare +
        applicableMotorcycleFare +
        ppaFee;


    /* =========================================================
       FORMAT DATE
    ========================================================= */

    const formattedDate =
        normalizedTrip.date
            ? new Date(
                `${normalizedTrip.date}T00:00:00`
            ).toLocaleDateString(
                "en-US",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }
            )
            : "N/A";


    /* =========================================================
       FORMAT TIME
    ========================================================= */

    const formatTime = (time) => {

        if (!time) {
            return "N/A";
        }

        const timeString =
            String(time).trim();


        if (
            timeString
                .toUpperCase()
                .includes("AM") ||
            timeString
                .toUpperCase()
                .includes("PM")
        ) {

            return timeString;
        }


        const parts =
            timeString.split(":");


        if (parts.length < 2) {
            return timeString;
        }


        const hours =
            Number(parts[0]);


        const minutes =
            parts[1];


        if (Number.isNaN(hours)) {
            return timeString;
        }


        const suffix =
            hours >= 12
                ? "PM"
                : "AM";


        const displayHour =
            hours % 12 || 12;


        return `${displayHour}:${minutes} ${suffix}`;
    };


    /* =========================================================
       GENERATE BOOKING REFERENCE
    ========================================================= */

    const generateBookingReference = () => {

        const randomNumber =
            Math.floor(
                100000 +
                Math.random() * 900000
            );

        return `GG-${randomNumber}`;
    };


    /* =========================================================
       GENERATE A UNIQUE REFERENCE FOR THIS BOOKING

       IMPORTANT:
       Do NOT recover the previous booking reference.
       A tourist is allowed to create multiple bookings, even
       when the new booking has exactly the same trip details.

       We also remember references already generated in this
       browser session so the next booking cannot reuse the
       previous reference.
    ========================================================= */

    const generateUniqueBookingReference = () => {

        let usedReferences = [];

        try {
            const savedReferences =
                sessionStorage.getItem(
                    "usedBookingReferences"
                );

            usedReferences = savedReferences
                ? JSON.parse(savedReferences)
                : [];

            if (!Array.isArray(usedReferences)) {
                usedReferences = [];
            }

            /*
               Also treat the old bookingReference as used.
               This is important for your current browser because
               the old reference (for example GG-136550) may still
               be stored in sessionStorage from the previous code.
            */
            const oldBookingReference =
                sessionStorage.getItem(
                    "bookingReference"
                );

            if (
                oldBookingReference &&
                !usedReferences.includes(oldBookingReference)
            ) {
                usedReferences.push(
                    oldBookingReference
                );
            }
        } catch (error) {
            console.error(
                "Unable to recover used booking references:",
                error
            );

            usedReferences = [];
        }

        let newReference =
            generateBookingReference();

        let attempts = 0;

        while (
            usedReferences.includes(newReference) &&
            attempts < 100
        ) {
            newReference =
                generateBookingReference();

            attempts += 1;
        }

        return newReference;
    };


    /* =========================================================
       CREATE UNIQUE TRIP KEY
    ========================================================= */

    const tripKey = JSON.stringify({

        origin:
            normalizedTrip.origin || "",

        destination:
            normalizedTrip.destination || "",

        date:
            normalizedTrip.date || "",

        time:
            normalizedTrip.time || "",

        passengerName:
            normalizedTrip.passengerName || "",

        passengerAge:
            normalizedTrip.passengerAge || "",

        passengerGender:
            normalizedTrip.passengerGender || "",

        passengers:
            Number(
                normalizedTrip.passengers || 1
            ),

        vehicleType:
            normalizedTrip.vehicleType ||
            "No Motorcycle",

        plateNumber:
            normalizedTrip.plateNumber || "",
    });


    /* =========================================================
       NEW BOOKING REFERENCE

       IMPORTANT:
       Never use the old bookingReference / bookingReferenceTripKey
       to decide whether this is a new booking. Those values caused
       the same reference to be reused when the trip details matched.

       Every time the Payment page is entered, a fresh reference is
       created for the new booking.
    ========================================================= */

    const [bookingReference] =
        useState(() =>
            generateUniqueBookingReference()
        );


    /* =========================================================
       SAVE BOOKING REFERENCE
    ========================================================= */

    sessionStorage.setItem(
        "bookingReference",
        bookingReference
    );


    sessionStorage.setItem(
        "bookingReferenceTripKey",
        tripKey
    );


    /* =========================================================
       BACK TO TRIP DETAILS
    ========================================================= */

    const handleBackToTripDetails = () => {

        sessionStorage.setItem(
            "tripDetails",
            JSON.stringify(normalizedTrip)
        );


        sessionStorage.setItem(
            "pendingTrip",
            JSON.stringify(normalizedTrip)
        );


        navigate("/book-trip", {

            state: {

                trip:
                    normalizedTrip,

            },

        });
    };


    /* =========================================================
       BOOK NOW
    ========================================================= */

    const handleBookNow = () => {


        /* Make sure payment method is selected */

        if (!paymentMethod) {

            alert(
                "Please select a payment method."
            );

            return;
        }


        /* =====================================================
           CURRENT DEMO PAYMENT
        ===================================================== */

        if (paymentMethod !== "maya") {

            alert(
                `${paymentMethod === "gcash"
                    ? "GCash"
                    : "Debit/Credit Card"
                } payment is not yet available in the current demo. Please select Maya.`
            );

            return;
        }


        /* =====================================================
           CHECK PLATE NUMBER

           IMPORTANT:

           Only motorcycle bookings require a plate number.

           Passenger-only bookings can continue without one.
        ===================================================== */

        if (isMotorcycle) {

            if (
                !normalizedTrip.plateNumber ||
                !String(
                    normalizedTrip.plateNumber
                ).trim()
            ) {

                alert(
                    "Please enter the motorcycle plate number before continuing."
                );

                return;
            }
        }


        /* =====================================================
           FINAL TRIP DATA
        ===================================================== */

        const finalTrip = {

            ...normalizedTrip,


            origin:
                normalizedTrip.origin || "",


            destination:
                normalizedTrip.destination || "",


            date:
                normalizedTrip.date || "",


            time:
                normalizedTrip.time || "",


            passengerName:
                String(
                    normalizedTrip.passengerName || ""
                ).trim(),


            passengerAge:
                normalizedTrip.passengerAge || "",


            passengerGender:
                normalizedTrip.passengerGender || "",


            passengers:
                Number(
                    normalizedTrip.passengers || 1
                ),


            vehicleType:
                normalizedTrip.vehicleType ||
                "No Motorcycle",


            plateNumber:
                String(
                    normalizedTrip.plateNumber || ""
                )
                    .trim()
                    .toUpperCase(),


            bookingReference:
                bookingReference,
        };


        /* =====================================================
           IMPORTANT:
           EXACT PAYMENT AMOUNT
        ===================================================== */

        const paymentAmount =
            Number(
                totalFare.toFixed(2)
            );


        /* =====================================================
           SAVE COMPLETE TRIP
        ===================================================== */

        sessionStorage.setItem(
            "tripDetails",
            JSON.stringify(finalTrip)
        );


        sessionStorage.setItem(
            "pendingTrip",
            JSON.stringify(finalTrip)
        );


        /* =====================================================
           PAYMENT DETAILS

           Example:

           Passenger Only
           3 passengers

           passengerFare = 120
           motorcycleFare = 0
           ppaFee = 65

           total = 185
        ===================================================== */

        const paymentDetails = {

            bookingReference,


            paymentMethod:
                paymentMethod,


            amount:
                paymentAmount,


            amountFormatted:
                `₱${paymentAmount.toFixed(2)}`,


            currency:
                "PHP",


            status:
                "PENDING",


            trip:
                finalTrip,
        };


        /* =====================================================
           SAVE PAYMENT DETAILS
        ===================================================== */

        sessionStorage.setItem(
            "paymentDetails",
            JSON.stringify(paymentDetails)
        );


        /* =====================================================
           BACKUP LATEST BOOKING
        ===================================================== */

        const pendingBooking = {

            bookingReference,


            ...finalTrip,


            passengerFare,


            /* Store only the applicable motorcycle fare */

            motorcycleFare:
                applicableMotorcycleFare,


            ppaFee,


            totalFare:
                paymentAmount,


            paymentAmount:
                paymentAmount,


            paymentAmountFormatted:
                `₱${paymentAmount.toFixed(2)}`,


            paymentMethod:
                paymentMethod,


            paymentStatus:
                "PENDING",
        };


        sessionStorage.setItem(
            "latestBooking",
            JSON.stringify(pendingBooking)
        );


        /* =====================================================
           SAVE MAYA PAYMENT AMOUNT SEPARATELY
        ===================================================== */

        sessionStorage.setItem(
            "mayaPaymentAmount",
            String(paymentAmount)
        );


        sessionStorage.setItem(
            "mayaPaymentBookingReference",
            bookingReference
        );


        /* =====================================================
           MARK THIS REFERENCE AS USED

           This prevents the next booking in the same tourist
           session from reusing this booking reference.
        ===================================================== */

        try {
            const savedReferences =
                sessionStorage.getItem(
                    "usedBookingReferences"
                );

            let usedReferences = savedReferences
                ? JSON.parse(savedReferences)
                : [];

            if (!Array.isArray(usedReferences)) {
                usedReferences = [];
            }

            if (!usedReferences.includes(bookingReference)) {
                usedReferences.push(bookingReference);
            }

            /* Keep the sessionStorage value reasonably small. */
            if (usedReferences.length > 100) {
                usedReferences =
                    usedReferences.slice(-100);
            }

            sessionStorage.setItem(
                "usedBookingReferences",
                JSON.stringify(usedReferences)
            );
        } catch (error) {
            console.error(
                "Unable to save used booking reference:",
                error
            );
        }


        /* =====================================================
           GO TO MAYA PAYMENT
        ===================================================== */

        navigate(
            "/maya-payment",
            {

                state: {

                    booking:
                        pendingBooking,


                    trip:
                        finalTrip,


                    payment:
                        paymentDetails,


                    amount:
                        paymentAmount,


                    amountFormatted:
                        `₱${paymentAmount.toFixed(2)}`,


                    bookingReference:
                        bookingReference,

                },

            }
        );
    };


    /* =========================================================
       DISPLAY VALUES
    ========================================================= */

    const displayPassengerName =
        normalizedTrip.passengerName ||
        "Passenger";


    const displayPassengerAge =
        normalizedTrip.passengerAge ||
        "N/A";


    const displayPassengerGender =
        normalizedTrip.passengerGender ||
        "N/A";


    const displayPlateNumber =
        normalizedTrip.plateNumber
            ? String(
                normalizedTrip.plateNumber
            )
                .trim()
                .toUpperCase()
            : "N/A";


    const displayVehicleType =
        normalizedTrip.vehicleType ||
        "Motorcycle";


    /* =========================================================
       PAGE
    ========================================================= */

    return (

        <main className="payment-page">

            <div className="payment-container">


                {/* =================================================
                    LOGO
                ================================================= */}

                <div className="payment-logo">

                    <img
                        src={LOGO_URL}
                        alt="GuimarasGo Logo"
                    />

                </div>


                {/* =================================================
                    HEADING
                ================================================= */}

                <div className="payment-heading">

                    <h1>
                        Payment Method
                    </h1>

                    <p>
                        Choose your preferred payment method
                    </p>

                </div>


                {/* =================================================
                    PAYMENT METHODS
                ================================================= */}

                <div className="payment-methods">


                    {/* =================================================
                        MAYA
                    ================================================= */}

                    <button
                        type="button"
                        className={`payment-option ${
                            paymentMethod === "maya"
                                ? "selected"
                                : ""
                        }`}
                        onClick={() =>
                            setPaymentMethod("maya")
                        }
                    >

                        <div className="payment-icon maya-icon">
                            M
                        </div>


                        <div className="payment-info">

                            <strong>
                                Maya
                            </strong>

                            <span>
                                E-wallet payment
                            </span>

                        </div>


                        {paymentMethod === "maya" && (

                            <div className="selected-dot">
                                ●
                            </div>

                        )}

                    </button>


                    {/* =================================================
                        GCASH
                    ================================================= */}

                    <button
                        type="button"
                        className={`payment-option ${
                            paymentMethod === "gcash"
                                ? "selected"
                                : ""
                        }`}
                        onClick={() =>
                            setPaymentMethod("gcash")
                        }
                    >

                        <div className="payment-icon gcash-icon">
                            G
                        </div>


                        <div className="payment-info">

                            <strong>
                                GCash
                            </strong>

                            <span>
                                E-wallet payment
                            </span>

                        </div>


                        {paymentMethod === "gcash" && (

                            <div className="selected-dot">
                                ●
                            </div>

                        )}

                    </button>


                    {/* =================================================
                        CARD
                    ================================================= */}

                    <button
                        type="button"
                        className={`payment-option ${
                            paymentMethod === "card"
                                ? "selected"
                                : ""
                        } disabled-option`}
                        onClick={() => {

                            alert(
                                "Card payment is not yet available in the current student demo."
                            );

                        }}
                    >

                        <div className="payment-icon card-icon">
                            💳
                        </div>


                        <div className="payment-info">

                            <strong>
                                Debit/Credit Card
                            </strong>

                            <span>
                                Visa, Mastercard, etc.
                            </span>

                        </div>


                        <span className="coming-soon">
                            Soon
                        </span>

                    </button>

                </div>


                {/* =================================================
                    SECURE PAYMENT
                ================================================= */}

                <div className="secure-payment">

                    <div className="secure-icon">
                        🔒
                    </div>


                    <div>

                        <strong>
                            Secure Payment
                        </strong>


                        <p>

                            {paymentMethod === "maya"
                                ? "You will continue to the Maya testing payment page."
                                : paymentMethod === "gcash"
                                ? "GCash payment will be available in a future integration."
                                : "Card payment will be available in a future integration."
                            }

                        </p>

                    </div>

                </div>


                <div className="secure-text">

                    🔐 Secure Payment powered by
                    encrypted technology

                </div>


                {/* =================================================
                    TRIP SUMMARY
                ================================================= */}

                <div className="trip-summary">

                    <h2>
                        Trip Details
                    </h2>


                    {/* ROUTE */}

                    <div className="trip-row">

                        <span>
                            Route
                        </span>

                        <strong>

                            {normalizedTrip.origin || "N/A"}

                            {" → "}

                            {normalizedTrip.destination || "N/A"}

                        </strong>

                    </div>


                    {/* FERRY / VESSEL */}

                    <div className="trip-row">

                        <span>
                            Ferry / Vessel
                        </span>

                        <strong>
                            {normalizedTrip.vesselName ||
                                normalizedTrip.ferryName ||
                                "N/A"}
                        </strong>

                    </div>


                    {/* DATE */}

                    <div className="trip-row">

                        <span>
                            Date
                        </span>

                        <strong>
                            {formattedDate}
                        </strong>

                    </div>


                    {/* TIME */}

                    <div className="trip-row">

                        <span>
                            Time
                        </span>

                        <strong>
                            {formatTime(
                                normalizedTrip.time
                            )}
                        </strong>

                    </div>


                    {/* PASSENGER NAME */}

                    <div className="trip-row">

                        <span>
                            Passenger
                        </span>

                        <strong>
                            {displayPassengerName}
                        </strong>

                    </div>


                    {/* AGE */}

                    <div className="trip-row">

                        <span>
                            Age
                        </span>

                        <strong>
                            {displayPassengerAge}
                        </strong>

                    </div>


                    {/* GENDER */}

                    <div className="trip-row">

                        <span>
                            Gender
                        </span>

                        <strong>
                            {displayPassengerGender}
                        </strong>

                    </div>


                    {/* PASSENGER COUNT */}

                    <div className="trip-row">

                        <span>
                            Number of Passengers
                        </span>

                        <strong>
                            {passengers}
                        </strong>

                    </div>


                    {/* VEHICLE */}

                    <div className="trip-row">

                        <span>
                            Vehicle
                        </span>

                        <strong>
                            {displayVehicleType}
                        </strong>

                    </div>


                    {/* PLATE NUMBER */}

                    <div className="trip-row">

                        <span>
                            Plate Number
                        </span>

                        <strong>
                            {isMotorcycle
                                ? displayPlateNumber
                                : "N/A"
                            }
                        </strong>

                    </div>


                    {/* BOOKING REFERENCE */}

                    <div className="trip-row">

                        <span>
                            Booking Reference
                        </span>

                        <strong>
                            {bookingReference}
                        </strong>

                    </div>

                </div>


                {/* =================================================
                    FARE ESTIMATION
                ================================================= */}

                <div className="fare-section">

                    <h2>
                        Fare Estimation
                    </h2>


                    {/* PASSENGER FARE */}

                    <div className="fare-row">

                        <span>
                            Passenger ({passengers}x)
                        </span>

                        <span>
                            ₱{passengerFare.toFixed(2)}
                        </span>

                    </div>


                    {/* =================================================
                        MOTORCYCLE FARE

                        Only display this when the booking actually
                        contains a motorcycle.
                    ================================================= */}

                    {isMotorcycle && (

                        <div className="fare-row">

                            <span>
                                Motorcycle
                            </span>

                            <span>
                                ₱{motorcycleFare.toFixed(2)}
                            </span>

                        </div>

                    )}


                    {/* PPA FEE */}

                    <div className="fare-row">

                        <span>
                            PPA Fee
                        </span>

                        <span>
                            ₱{ppaFee.toFixed(2)}
                        </span>

                    </div>


                    <div className="fare-divider"></div>


                    {/* TOTAL */}

                    <div className="fare-total">

                        <strong>
                            Total Fare
                        </strong>

                        <strong>
                            ₱{totalFare.toFixed(2)}
                        </strong>

                    </div>

                </div>


                {/* =================================================
                    BOOK NOW
                ================================================= */}

                <button
                    type="button"
                    className="book-now-button"
                    onClick={handleBookNow}
                >
                    Book Now
                </button>


                {/* =================================================
                    BACK
                ================================================= */}

                <button
                    type="button"
                    className="back-trip-button"
                    onClick={
                        handleBackToTripDetails
                    }
                >
                    ← Back to Trip Details
                </button>

            </div>


            {/* =====================================================
                CSS
            ===================================================== */}

            <style>{`

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                }

                .payment-page {
                    min-height: 100vh;
                    min-height: 100dvh;
                    background: #f7f8fa;
                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;
                    padding: 30px 20px;
                }

                .payment-container {
                    width: 100%;
                    max-width: 650px;
                    margin: 0 auto;
                    padding: 30px 0 35px;
                    background: #ffffff;
                    border-radius: 24px;
                    box-shadow:
                        0 10px 35px
                        rgba(0, 0, 0, 0.08);
                    overflow: hidden;
                }


                /* =================================================
                   LOGO
                ================================================= */

                .payment-logo {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .payment-logo img {
                    width: 110px;
                    height: auto;
                    max-height: 90px;
                    object-fit: contain;
                    display: block;
                }


                /* =================================================
                   HEADING
                ================================================= */

                .payment-heading {
                    text-align: center;
                    padding: 0 30px;
                    margin-bottom: 28px;
                }

                .payment-heading h1 {
                    margin: 0;
                    color: #111111;
                    font-size: 28px;
                    font-weight: 800;
                }

                .payment-heading p {
                    margin: 10px 0 0;
                    color: #777777;
                    font-size: 15px;
                }


                /* =================================================
                   PAYMENT METHODS
                ================================================= */

                .payment-methods {
                    padding: 0 34px;
                }

                .payment-option {
                    width: 100%;
                    min-height: 74px;
                    margin-bottom: 12px;
                    padding: 12px 16px;

                    display: flex;
                    align-items: center;

                    text-align: left;

                    border: 1px solid #dddddd;
                    border-radius: 14px;

                    background: #ffffff;

                    cursor: pointer;

                    transition: 0.2s ease;
                }

                .payment-option:hover {
                    border-color: #f28c28;
                    transform: translateY(-1px);
                }

                .payment-option.selected {
                    border-color: #f28c28;
                    background: #fffaf5;
                }

                .payment-option.disabled-option {
                    cursor: not-allowed;
                    opacity: 0.7;
                }

                .payment-option.disabled-option:hover {
                    border-color: #dddddd;
                    transform: none;
                }


                /* =================================================
                   PAYMENT ICON
                ================================================= */

                .payment-icon {
                    width: 42px;
                    height: 42px;
                    margin-right: 14px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    border-radius: 9px;

                    font-size: 20px;
                    font-weight: 800;

                    flex-shrink: 0;
                }


                /* MAYA */

                .maya-icon {
                    background: #eaf8ef;
                    color: #16a34a;
                }


                /* GCASH */

                .gcash-icon {
                    background: #eaf3ff;
                    color: #087ee8;
                }


                /* CARD */

                .card-icon {
                    background: #f0f0f0;
                    color: #2185c5;
                    font-size: 18px;
                }


                /* =================================================
                   PAYMENT INFORMATION
                ================================================= */

                .payment-info {
                    flex: 1;

                    display: flex;
                    flex-direction: column;

                    gap: 4px;
                }

                .payment-info strong {
                    color: #111111;
                    font-size: 15px;
                }

                .payment-info span {
                    color: #777777;
                    font-size: 12px;
                }

                .selected-dot {
                    color: #000000;
                    font-size: 14px;
                }

                .coming-soon {
                    color: #999999;
                    font-size: 11px;
                    font-weight: 600;
                }


                /* =================================================
                   SECURE PAYMENT
                ================================================= */

                .secure-payment {
                    margin: 22px 34px 0;
                    padding: 18px;

                    display: flex;
                    align-items: flex-start;

                    gap: 14px;

                    background: #f5f7fa;
                    border-radius: 14px;
                }

                .secure-icon {
                    font-size: 18px;
                }

                .secure-payment strong {
                    display: block;
                    color: #111111;
                    font-size: 14px;
                    margin-bottom: 6px;
                }

                .secure-payment p {
                    margin: 0;
                    color: #666666;
                    font-size: 12px;
                    line-height: 1.5;
                }

                .secure-text {
                    margin: 18px 34px 0;
                    text-align: center;
                    color: #777777;
                    font-size: 11px;
                }


                /* =================================================
                   TRIP SUMMARY
                ================================================= */

                .trip-summary {
                    margin: 28px 34px 0;
                    padding: 20px;

                    border: 1px solid #eeeeee;
                    border-radius: 14px;

                    background: #ffffff;
                }

                .trip-summary h2 {
                    margin: 0 0 18px;
                    color: #111111;
                    font-size: 18px;
                }

                .trip-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    gap: 15px;

                    padding: 10px 0;

                    border-bottom:
                        1px solid #f0f0f0;
                }

                .trip-row:last-child {
                    border-bottom: none;
                }

                .trip-row span {
                    color: #777777;
                    font-size: 13px;
                }

                .trip-row strong {
                    color: #222222;
                    font-size: 13px;
                    text-align: right;
                    max-width: 60%;
                    overflow-wrap: anywhere;
                }


                /* =================================================
                   FARE
                ================================================= */

                .fare-section {
                    margin: 24px 34px 0;
                    padding: 20px;

                    border: 1px solid #eeeeee;
                    border-radius: 14px;

                    background: #ffffff;
                }

                .fare-section h2 {
                    margin: 0 0 16px;
                    color: #111111;
                    font-size: 18px;
                }

                .fare-row {
                    display: flex;
                    justify-content: space-between;

                    padding: 9px 0;

                    color: #555555;
                    font-size: 14px;
                }

                .fare-row span:last-child {
                    color: #333333;
                    font-weight: 600;
                }

                .fare-divider {
                    width: 100%;
                    height: 1px;

                    margin: 10px 0;

                    background: #dddddd;
                }

                .fare-total {
                    display: flex;
                    justify-content: space-between;

                    padding-top: 8px;

                    color: #111111;
                    font-size: 16px;
                }


                /* =================================================
                   BOOK NOW
                ================================================= */

                .book-now-button {
                    width: calc(100% - 68px);
                    height: 54px;

                    margin: 26px 34px 0;

                    border: none;
                    border-radius: 10px;

                    background: #333333;
                    color: #ffffff;

                    font-size: 16px;
                    font-weight: 700;

                    cursor: pointer;

                    transition: 0.2s ease;
                }

                .book-now-button:hover {
                    background: #222222;
                    transform: translateY(-1px);
                }


                /* =================================================
                   BACK
                ================================================= */

                .back-trip-button {
                    display: block;

                    margin: 18px auto 0;

                    padding: 5px 10px;

                    border: none;
                    background: transparent;

                    color: #777777;

                    font-size: 13px;

                    cursor: pointer;
                }

                .back-trip-button:hover {
                    color: #f28c28;
                }


                /* =================================================
                   MOBILE
                ================================================= */

                @media (max-width: 600px) {

                    .payment-page {
                        padding: 15px;
                    }

                    .payment-container {
                        border-radius: 18px;
                        padding-bottom: 30px;
                    }

                    .payment-methods {
                        padding: 0 20px;
                    }

                    .secure-payment {
                        margin-left: 20px;
                        margin-right: 20px;
                    }

                    .secure-text {
                        margin-left: 20px;
                        margin-right: 20px;
                    }

                    .trip-summary {
                        margin-left: 20px;
                        margin-right: 20px;
                    }

                    .fare-section {
                        margin-left: 20px;
                        margin-right: 20px;
                    }

                    .book-now-button {
                        width: calc(100% - 40px);
                        margin-left: 20px;
                        margin-right: 20px;
                    }

                    .payment-heading {
                        padding: 0 20px;
                    }

                    .payment-heading h1 {
                        font-size: 25px;
                    }

                    .trip-row {
                        align-items: flex-start;
                    }

                    .trip-row strong {
                        max-width: 55%;
                    }

                }

            `}</style>

        </main>
    );
};


export default Payment;