import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

import api from "../../services/api";

import {
    getBookingReferenceFromQR
} from "../../utils/qrUtils";


// =========================================================
// BOOKING REFERENCE PARSER
// =========================================================
// Supports the QR formats currently used by the ticketing system.
// The QR can contain the reference as plain text, labeled text,
// or JSON. We keep this local so the scanner can read older QR
// tickets without changing the booking data.

function extractBookingReference(qrText) {
    const decodedQR = String(qrText || "").trim();

    if (!decodedQR) {
        return null;
    }

    // Use the existing utility first.
    try {
        const existingReference =
            getBookingReferenceFromQR(decodedQR);

        if (existingReference) {
            return String(existingReference).trim();
        }
    } catch (error) {
        console.warn("QR utility parser warning:", error);
    }

    // Booking Reference: GG-123456
    const bookingReferenceMatch =
        decodedQR.match(
            /Booking\s*Reference\s*:\s*([A-Za-z0-9-]+)/i
        );

    if (bookingReferenceMatch?.[1]) {
        return bookingReferenceMatch[1].trim();
    }

    // Reference: GG-123456
    const referenceMatch =
        decodedQR.match(
            /Reference\s*:\s*([A-Za-z0-9-]+)/i
        );

    if (referenceMatch?.[1]) {
        return referenceMatch[1].trim();
    }

    // JSON QR data.
    try {
        const parsedQR = JSON.parse(decodedQR);
        const jsonReference =
            parsedQR?.bookingReference ||
            parsedQR?.booking_reference ||
            parsedQR?.reference ||
            parsedQR?.bookingRef ||
            parsedQR?.bookingCode ||
            null;

        if (jsonReference) {
            return String(jsonReference).trim();
        }
    } catch (error) {
        // QR is not JSON. Continue with raw reference matching.
    }

    // Raw booking reference.
    const rawReferenceMatch =
        decodedQR.match(/\bGG-[A-Za-z0-9-]+\b/i);

    if (rawReferenceMatch?.[0]) {
        return rawReferenceMatch[0].trim();
    }

    return null;
}


// =========================================================
// BOARDING STATUS LABEL
// =========================================================

function getBoardingStatusLabel(status, timedOutAt) {
    const normalizedStatus =
        String(status || "")
            .trim()
            .toUpperCase();

    if (timedOutAt) {
        return "Timed Out";
    }

    if (normalizedStatus === "ON BOARD") {
        return "Onboard";
    }

    if (normalizedStatus === "REJECTED") {
        return "Rejected";
    }

    if (normalizedStatus === "NOT BOARDED") {
        return "Not Boarded";
    }

    return status || "N/A";
}


// =========================================================
// STAFF SCANNER
// =========================================================

function StaffScanner() {

    const navigate = useNavigate();

    // =====================================================
    // REFERENCES
    // =====================================================

    const scannerRef = useRef(null);

    const scannerRunningRef =
        useRef(false);

    const processingQRRef =
        useRef(false);


    // =====================================================
    // STATE
    // =====================================================

    const [scanning, setScanning] =
        useState(false);

    const [booking, setBooking] =
        useState(null);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [loadingBooking, setLoadingBooking] =
        useState(false);

    // =====================================================
    // REJECTION REASON
    // =====================================================
    const [showRejectModal, setShowRejectModal] =
        useState(false);

    // =====================================================
    // LOGOUT CONFIRMATION
    // =====================================================
    const [showLogoutModal, setShowLogoutModal] =
        useState(false);

    const [rejectReason, setRejectReason] =
        useState(
            "Payment has not been verified by admin."
        );

    const [customRejectReason, setCustomRejectReason] =
        useState("");


    // =========================================================
    // START SCANNER
    // =========================================================

    const startScanner = async () => {

        // Prevent multiple scanner instances
        if (scannerRunningRef.current) {
            return;
        }

        setError("");
        setMessage("");

        try {

            // ---------------------------------------------
            // Request camera permission first
            // ---------------------------------------------
            // This is intentionally triggered by the user's
            // "Start Camera" click so supported browsers can show
            // their native camera permission prompt.
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error(
                    "Camera access is not supported by this browser."
                );
            }

            const permissionStream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: {
                            ideal: "environment"
                        }
                    },
                    audio: false
                });

            // Release the temporary permission stream immediately.
            // html5-qrcode will open the camera it needs afterward.
            permissionStream.getTracks().forEach((track) => {
                track.stop();
            });

            // ---------------------------------------------
            // Create scanner
            // ---------------------------------------------

            const scanner =
                new Html5Qrcode(
                    "staff-qr-reader"
                );

            scannerRef.current =
                scanner;


            // ---------------------------------------------
            // Start camera
            // ---------------------------------------------

            await scanner.start(

                {
                    facingMode: "environment"
                },

                {
                    // Faster frame checking helps detect QR codes shown from
                    // a passenger's phone gallery more quickly.
                    fps: 20,

                    // Slightly larger detection area so the passenger does
                    // not need to align the QR code as precisely.
                    qrbox: {
                        width: 350,
                        height: 350
                    },

                    aspectRatio: 1.0,

                    // Prefer the browser's native BarcodeDetector
                    // when supported. The normal html5-qrcode
                    // decoder remains the fallback.
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                },

                async (decodedText) => {

                    // Prevent multiple QR callbacks
                    // from sending multiple requests.
                    if (processingQRRef.current) {
                        return;
                    }

                    processingQRRef.current =
                        true;

                    await handleQRCode(
                        decodedText
                    );

                },

                () => {
                    // Normal QR scanning failures
                    // are ignored.
                }

            );


            // =====================================================
            // CAMERA FOCUS / QUALITY TUNING
            // =====================================================
            // Optional camera improvements. If the device/browser does
            // not support a setting, the normal scanner still continues.
            try {
                const capabilities =
                    scanner.getRunningTrackCapabilities();

                const cameraConstraints = {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30, max: 30 }
                };

                if (
                    Array.isArray(capabilities?.focusMode) &&
                    capabilities.focusMode.includes("continuous")
                ) {
                    cameraConstraints.focusMode = "continuous";
                }

                await scanner.applyVideoConstraints(
                    cameraConstraints
                );
            } catch (cameraTuneError) {
                console.warn(
                    "Camera focus/quality tuning warning:",
                    cameraTuneError
                );
            }

            scannerRunningRef.current =
                true;

            setScanning(true);

        } catch (err) {

            console.error(
                "Unable to start QR scanner:",
                err
            );

            scannerRunningRef.current =
                false;

            scannerRef.current =
                null;

            setScanning(false);

            const cameraErrorName =
                err?.name || "";

            if (
                cameraErrorName === "NotAllowedError" ||
                cameraErrorName === "PermissionDeniedError"
            ) {
                setError(
                    "Camera permission was denied. Please allow camera access in your browser/device settings, then tap Start Camera again."
                );
            } else if (
                cameraErrorName === "NotFoundError" ||
                cameraErrorName === "DevicesNotFoundError"
            ) {
                setError(
                    "No camera was found on this device. Please connect or enable a camera and try again."
                );
            } else {
                setError(
                    "Unable to access the camera. Please allow camera permission and try again."
                );
            }

            processingQRRef.current =
                false;
        }
    };


    // =========================================================
    // STOP SCANNER
    // =========================================================

    const stopScanner = async () => {

        const scanner =
            scannerRef.current;


        try {

            if (
                scanner &&
                scannerRunningRef.current
            ) {

                await scanner.stop();

                try {

                    await scanner.clear();

                } catch (clearError) {

                    console.warn(
                        "Scanner clear warning:",
                        clearError
                    );

                }

            }

        } catch (err) {

            console.error(
                "Scanner stop error:",
                err
            );

        } finally {

            scannerRunningRef.current =
                false;

            scannerRef.current =
                null;

            setScanning(false);
        }
    };


    // =========================================================
    // HANDLE QR CODE
    // =========================================================

    const handleQRCode = async (qrText) => {

        setError("");
        setMessage("");


        // =====================================================
        // GET BOOKING REFERENCE
        // =====================================================
        //
        // Your current passenger QR contains the booking reference
        // as text in this format:
        //
        // Booking Reference:
        // GG-xxxxxx
        //
        // We first use your existing QR utility. If that utility
        // does not recognize this older/current QR format, we use
        // a safe fallback parser so the existing QR code does not
        // need to be regenerated.
        //
        // =====================================================

        const bookingReference =
            extractBookingReference(qrText);

        // The scanner must have a booking reference before it
        // attempts the staff booking lookup.
        if (!bookingReference) {
            console.warn("QR decoded text:", qrText);
            setError(
                "QR was detected, but no booking reference could be read. Please move the QR closer and try again."
            );
            processingQRRef.current = false;
            return;
        }

        // =====================================================
        // QR DETECTED
        // =====================================================

        setMessage(
            `QR detected. Loading booking ${bookingReference}...`
        );


        // =====================================================
        // STOP CAMERA
        // =====================================================

        await stopScanner();


        // =====================================================
        // GET BOOKING
        // =========================================================
        //
        // Backend route:
        //
        // GET /api/staff/bookings/reference/:bookingReference
        //
        // IMPORTANT:
        // "bookings" is plural.
        //
        // =========================================================

        try {

            setLoadingBooking(true);


            const response =
                await api.get(
                    `/staff/bookings/reference/${encodeURIComponent(
                        bookingReference
                    )}`
                );


            // =================================================
            // VALIDATE RESPONSE
            // =================================================

            if (
                !response.data ||
                !response.data.booking
            ) {

                setError(
                    "Booking information could not be retrieved."
                );

                return;
            }


            // =================================================
            // STORE BOOKING
            // =================================================

            setBooking(
                response.data.booking
            );


            setMessage(
                "Ticket scanned successfully."
            );

        } catch (err) {

            console.error(
                "Booking lookup error:",
                err
            );


            // ===============================================
            // NOT FOUND
            // ===============================================

            if (
                err.response?.status === 404
            ) {

                setError(
                    "Booking not found. Please check the QR code."
                );

            }

            // ===============================================
            // UNAUTHORIZED
            // ===============================================

            else if (
                err.response?.status === 401
            ) {

                setError(
                    "Your staff session has expired. Please log in again."
                );

            }

            // ===============================================
            // OTHER ERROR
            // ===============================================

            else {

                setError(
                    err.response?.data?.message ||
                    "Unable to retrieve booking information."
                );
            }

        } finally {

            setLoadingBooking(false);

            processingQRRef.current =
                false;
        }
    };


    // =========================================================
    // SCAN ANOTHER TICKET
    // =========================================================

    const scanAnother = async () => {

        setBooking(null);

        setMessage("");

        setError("");

        processingQRRef.current =
            false;

        await startScanner();
    };


    // =========================================================
    // MARK PASSENGER AS BOARDED
    // =========================================================

    const markAsBoarded = async () => {

        if (!booking?._id) {

            setError(
                "Booking information is missing."
            );

            return;
        }


        try {

            setLoadingBooking(true);

            setError("");

            setMessage("");


            // =================================================
            // BACKEND ROUTE
            // =================================================
            //
            // PUT /api/staff/bookings/:id/board
            //
            // IMPORTANT:
            // "bookings" is plural.
            //
            // =================================================

            const response =
                await api.put(
                    `/staff/bookings/${booking._id}/board`
                );


            // =================================================
            // UPDATE BOOKING
            // =================================================

            if (
                response.data?.booking
            ) {

                setBooking(
                    response.data.booking
                );
            }


            // =================================================
            // SUCCESS MESSAGE
            // =================================================

            setMessage(
                response.data?.message ||
                "Passenger marked as boarded successfully."
            );

        } catch (err) {

            console.error(
                "Boarding error:",
                err
            );


            // ===============================================
            // ERROR MESSAGE
            // ===============================================

            setError(
                err.response?.data?.message ||
                "Unable to update boarding status."
            );

        } finally {

            setLoadingBooking(false);
        }
    };


    // =========================================================
    // CONFIRM ARRIVAL / TIME OUT
    // =========================================================
    // The same QR ticket is scanned again after the passenger
    // reaches the destination. The staff then confirms the
    // actual arrival time.

    const confirmArrivalTimeOut = async () => {
        if (!booking?._id) {
            setError(
                "Booking information is missing."
            );
            return;
        }

        if (booking.boardingStatus !== "ON BOARD") {
            setError(
                "Passenger must be marked as onboard before confirming arrival."
            );
            return;
        }

        if (booking.timedOutAt) {
            setError(
                "Passenger arrival has already been confirmed."
            );
            return;
        }

        try {
            setLoadingBooking(true);
            setError("");
            setMessage("");

            const response = await api.put(
                `/staff/bookings/${booking._id}/timeout`
            );

            if (response.data?.booking) {
                setBooking(response.data.booking);
            }

            setMessage(
                response.data?.message ||
                "Passenger arrival and time out confirmed successfully."
            );
        } catch (err) {
            console.error(
                "Arrival time out error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to confirm passenger arrival."
            );
        } finally {
            setLoadingBooking(false);
        }
    };


    // =========================================================
    // REJECT PASSENGER BOARDING
    // =========================================================

    const openRejectModal = () => {

        if (!booking?._id) {
            setError(
                "Booking information is missing."
            );

            return;
        }

        if (booking.boardingStatus === "ON BOARD") {
            setError(
                "This passenger has already boarded and cannot be rejected."
            );

            return;
        }

        setError("");
        setMessage("");

        // If admin has not verified the payment yet,
        // make that the default rejection reason.
        if (booking.paymentStatus !== "VERIFIED") {
            setRejectReason(
                "Payment has not been verified by admin."
            );
        } else {
            setRejectReason(
                "Passenger identity could not be verified."
            );
        }

        setCustomRejectReason("");
        setShowRejectModal(true);
    };


    const closeRejectModal = () => {
        if (loadingBooking) {
            return;
        }

        setShowRejectModal(false);
        setCustomRejectReason("");
    };


    const confirmRejectBoarding = async () => {

        if (!booking?._id) {
            setError(
                "Booking information is missing."
            );

            return;
        }

        if (booking.boardingStatus === "ON BOARD") {
            setError(
                "This passenger has already boarded and cannot be rejected."
            );

            setShowRejectModal(false);
            return;
        }

        const finalReason =
            rejectReason === "Other"
                ? customRejectReason.trim()
                : rejectReason.trim();

        if (!finalReason) {
            setError(
                "Please select or enter a reason for rejecting this passenger."
            );

            return;
        }

        try {
            setLoadingBooking(true);
            setError("");
            setMessage("");

            const response =
                await api.put(
                    `/staff/bookings/${booking._id}/reject`,
                    {
                        reason: finalReason
                    }
                );

            if (response.data?.booking) {
                setBooking(
                    response.data.booking
                );
            }

            setShowRejectModal(false);
            setCustomRejectReason("");

            setMessage(
                response.data?.message ||
                "Passenger boarding has been rejected."
            );

        } catch (err) {

            console.error(
                "Reject boarding error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to reject passenger boarding."
            );

        } finally {
            setLoadingBooking(false);
        }
    };

    // =========================================================
    // CLEANUP CAMERA
    // =========================================================

    useEffect(() => {

        return () => {

            const scanner =
                scannerRef.current;


            if (
                scanner &&
                scannerRunningRef.current
            ) {

                scanner
                    .stop()
                    .then(() => {

                        try {

                            scanner.clear();

                        } catch (error) {

                            console.warn(
                                "Scanner cleanup warning:",
                                error
                            );

                        }

                    })
                    .catch(() => {});

            }

        };

    }, []);


    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    const confirmLogout = async () => {
        setShowLogoutModal(false);

        await stopScanner();

        localStorage.removeItem(
            "staffToken"
        );

        localStorage.removeItem(
            "staff"
        );

        // Your App.jsx uses:
        //
        // /staff/login
        //
        navigate("/staff/login");
    };


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div
            className="staff-scanner-page"
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
                padding: "25px",
                boxSizing: "border-box"
            }}
        >

            {/* =================================================
                HEADER
            ================================================= */}

            <div
                className="staff-scanner-header"
                style={{
                    maxWidth: "1100px",
                    margin: "0 auto 25px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap"
                }}
            >

                <div>

                    <h1
                        style={{
                            margin: 0,
                            color: "#111827",
                            fontSize: "28px"
                        }}
                    >
                        Staff QR Scanner
                    </h1>


                    <p
                        style={{
                            marginTop: "6px",
                            marginBottom: 0,
                            color: "#6b7280"
                        }}
                    >
                        Scan a passenger ferry ticket
                    </p>

                </div>


                {/* LOGOUT */}

                <button
                    onClick={handleLogoutClick}
                    style={{
                        padding: "10px 18px",
                        border: "none",
                        borderRadius: "8px",
                        background: "#dc2626",
                        color: "#ffffff",
                        fontWeight: "600",
                        cursor: "pointer"
                    }}
                >
                    Logout
                </button>

            </div>


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <div
                className="staff-scanner-grid"
                style={{
                    maxWidth: "1100px",
                    margin: "0 auto",
                    display: "grid",
                    gridTemplateColumns:
                        "minmax(300px, 1fr) minmax(300px, 1fr)",
                    gap: "25px"
                }}
            >


                {/* =================================================
                    SCANNER CARD
                ================================================= */}

                <div
                    className="staff-scanner-card"
                    style={{
                        background: "#ffffff",
                        borderRadius: "16px",
                        padding: "25px",
                        boxShadow:
                            "0 5px 20px rgba(0,0,0,0.08)"
                    }}
                >

                    <h2
                        style={{
                            marginTop: 0,
                            color: "#1f2937"
                        }}
                    >
                        Scan Ticket
                    </h2>


                    <p
                        style={{
                            color: "#6b7280",
                            fontSize: "14px",
                            lineHeight: "1.6"
                        }}
                    >
                        Ask the passenger to present
                        their QR ticket to the scanner.
                    </p>


                    {/* =================================================
                        QR CAMERA
                    ================================================= */}

                    <div
                        id="staff-qr-reader"
                        style={{
                            width: "100%",
                            minHeight: "300px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            marginTop: "20px"
                        }}
                    />


                    {/* =================================================
                        START CAMERA
                    ================================================= */}

                    {!scanning && !booking && (

                        <button
                            onClick={startScanner}
                            style={{
                                width: "100%",
                                marginTop: "20px",
                                padding: "13px",
                                border: "none",
                                borderRadius: "8px",
                                background: "#2563eb",
                                color: "#ffffff",
                                fontSize: "16px",
                                fontWeight: "600",
                                cursor: "pointer"
                            }}
                        >
                            Start Camera
                        </button>

                    )}


                    {/* =================================================
                        STOP CAMERA
                    ================================================= */}

                    {scanning && (

                        <button
                            onClick={stopScanner}
                            style={{
                                width: "100%",
                                marginTop: "20px",
                                padding: "13px",
                                border: "none",
                                borderRadius: "8px",
                                background: "#6b7280",
                                color: "#ffffff",
                                fontSize: "16px",
                                fontWeight: "600",
                                cursor: "pointer"
                            }}
                        >
                            Stop Camera
                        </button>

                    )}

                </div>


                {/* =================================================
                    BOOKING INFORMATION CARD
                ================================================= */}

                <div
                    className="staff-scanner-card"
                    style={{
                        background: "#ffffff",
                        borderRadius: "16px",
                        padding: "25px",
                        boxShadow:
                            "0 5px 20px rgba(0,0,0,0.08)"
                    }}
                >

                    <h2
                        style={{
                            marginTop: 0,
                            color: "#1f2937"
                        }}
                    >
                        Ticket Information
                    </h2>


                    {/* =================================================
                        SUCCESS MESSAGE
                    ================================================= */}

                    {message && (

                        <div
                            style={{
                                background: "#dcfce7",
                                color: "#166534",
                                padding: "12px",
                                borderRadius: "8px",
                                marginBottom: "15px",
                                fontSize: "14px"
                            }}
                        >
                            ✓ {message}
                        </div>

                    )}


                    {/* =================================================
                        ERROR MESSAGE
                    ================================================= */}

                    {error && (

                        <div
                            style={{
                                background: "#fee2e2",
                                color: "#b91c1c",
                                padding: "12px",
                                borderRadius: "8px",
                                marginBottom: "15px",
                                fontSize: "14px"
                            }}
                        >
                            {error}
                        </div>

                    )}


                    {/* =================================================
                        LOADING
                    ================================================= */}

                    {loadingBooking && (

                        <div
                            style={{
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                padding: "12px",
                                borderRadius: "8px",
                                marginBottom: "15px",
                                fontSize: "14px"
                            }}
                        >
                            Processing ticket...
                        </div>

                    )}


                    {/* =================================================
                        NO BOOKING
                    ================================================= */}

                    {!booking &&
                        !loadingBooking && (

                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "50px 20px",
                                    color: "#9ca3af"
                                }}
                            >

                                <div
                                    style={{
                                        fontSize: "45px",
                                        marginBottom: "10px"
                                    }}
                                >
                                    📱
                                </div>


                                <p>
                                    Scan a QR ticket to
                                    view booking information.
                                </p>

                            </div>

                        )}


                    {/* =================================================
                        BOOKING DETAILS
                    ================================================= */}

                    {booking && (

                        <div>

                            {/* =================================================
                                BOOKING REFERENCE
                            ================================================= */}

                            <div
                                style={{
                                    background: "#eff6ff",
                                    padding: "15px",
                                    borderRadius: "10px",
                                    marginBottom: "18px"
                                }}
                            >

                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#6b7280",
                                        marginBottom: "4px"
                                    }}
                                >
                                    BOOKING REFERENCE
                                </div>


                                <strong
                                    style={{
                                        fontSize: "20px",
                                        color: "#1d4ed8"
                                    }}
                                >
                                    {booking.bookingReference}
                                </strong>

                            </div>


                            {/* =================================================
                                PASSENGER
                            ================================================= */}

                            <InfoRow
                                label="Passenger"
                                value={
                                    booking.passengerName
                                }
                            />


                            <InfoRow
                                label="Age"
                                value={
                                    booking.passengerAge
                                }
                            />


                            <InfoRow
                                label="Gender"
                                value={
                                    booking.passengerGender
                                }
                            />


                            <InfoRow
                                label="Passengers"
                                value={
                                    booking.passengers
                                }
                            />


                            {/* =================================================
                                PASSENGER / COMPANIONS
                            ================================================= */}

                            {Array.isArray(booking.passengerDetails) &&
                                booking.passengerDetails.length > 0 && (

                                    <div
                                        style={{
                                            marginTop: "18px",
                                            padding: "15px",
                                            background: "#f9fafb",
                                            borderRadius: "10px",
                                            border: "1px solid #e5e7eb"
                                        }}
                                    >

                                        <div
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: "700",
                                                color: "#374151",
                                                marginBottom: "10px"
                                            }}
                                        >
                                            ALL PASSENGERS IN THIS BOOKING
                                        </div>

                                        {booking.passengerDetails.map(
                                            (passenger, index) => (

                                                <div
                                                    key={`${booking._id || booking.bookingReference}-passenger-${index}`}
                                                    style={{
                                                        padding: "10px 0",
                                                        borderBottom:
                                                            index < booking.passengerDetails.length - 1
                                                                ? "1px solid #e5e7eb"
                                                                : "none"
                                                    }}
                                                >

                                                    <div
                                                        style={{
                                                            fontWeight: "600",
                                                            color: "#111827",
                                                            marginBottom: "3px"
                                                        }}
                                                    >
                                                        {index + 1}. {passenger?.name || "N/A"}
                                                    </div>

                                                    <div
                                                        style={{
                                                            fontSize: "13px",
                                                            color: "#6b7280"
                                                        }}
                                                    >
                                                        Age: {passenger?.age ?? "N/A"}
                                                        {" • "}
                                                        Gender: {passenger?.gender || "N/A"}
                                                    </div>

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}


                            {/* =================================================
                                ROUTE
                            ================================================= */}

                            <div
                                style={{
                                    marginTop: "20px",
                                    marginBottom: "20px",
                                    padding: "15px",
                                    background: "#f9fafb",
                                    borderRadius: "10px"
                                }}
                            >

                                <InfoRow
                                    label="Origin"
                                    value={
                                        booking.origin
                                    }
                                />


                                <InfoRow
                                    label="Destination"
                                    value={
                                        booking.destination
                                    }
                                />


                                <InfoRow
                                    label="Date"
                                    value={
                                        booking.date
                                    }
                                />


                                <InfoRow
                                    label="Time"
                                    value={
                                        booking.time
                                    }
                                />

                            </div>


                            {/* =================================================
                                VEHICLE
                            ================================================= */}

                            <InfoRow
                                label="Vehicle"
                                value={
                                    booking.vehicleType
                                }
                            />


                            <InfoRow
                                label="Plate Number"
                                value={
                                    booking.plateNumber ||
                                    "N/A"
                                }
                            />


                            {/* =================================================
                                PAYMENT
                            ================================================= */}

                            <InfoRow
                                label="Payment"
                                value={
                                    booking.paymentStatus
                                }
                            />


                            {/* =================================================
                                BOOKING STATUS
                            ================================================= */}

                            <div
                                style={{
                                    marginTop: "15px"
                                }}
                            >

                                <InfoRow
                                    label="Booking Status"
                                    value={
                                        booking.status
                                    }
                                />


                                <InfoRow
                                    label="Boarding Status"
                                    value={
                                        getBoardingStatusLabel(
                                            booking.boardingStatus,
                                            booking.timedOutAt
                                        )
                                    }
                                />

                            </div>


                            {/* =================================================
                                STAFF REJECTION REASON
                            ================================================= */}

                            {booking.boardingStatus ===
                                "REJECTED" &&
                                booking.rejectionReason && (
                                    <div
                                        style={{
                                            marginTop: "15px",
                                            background: "#fef2f2",
                                            color: "#991b1b",
                                            padding: "12px",
                                            borderRadius: "8px",
                                            fontSize: "14px",
                                            lineHeight: "1.5"
                                        }}
                                    >
                                        <strong>Rejection Reason:</strong>{" "}
                                        {booking.rejectionReason}
                                    </div>
                                )}


                            {/* =================================================
                                ACTIONS
                            ================================================= */}

                            <div
                                style={{
                                    marginTop: "25px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px"
                                }}
                            >

                                {/* =================================================
                                    CAN BOARD
                                ================================================= */}

                                {booking.paymentStatus ===
                                    "VERIFIED" &&

                                    booking.status ===
                                    "CONFIRMED" &&

                                    booking.boardingStatus ===
                                    "NOT BOARDED" && (

                                        <button
                                            onClick={
                                                markAsBoarded
                                            }
                                            disabled={
                                                loadingBooking
                                            }
                                            style={{
                                                padding: "13px",
                                                border: "none",
                                                borderRadius: "8px",
                                                background:
                                                    loadingBooking
                                                        ? "#86efac"
                                                        : "#16a34a",
                                                color:
                                                    "#ffffff",
                                                fontWeight: "600",
                                                cursor:
                                                    loadingBooking
                                                        ? "not-allowed"
                                                        : "pointer"
                                            }}
                                        >
                                            {loadingBooking
                                                ? "Processing..."
                                                : "✓ Mark as Boarded"}
                                        </button>

                                    )}


                                {/* =================================================
                                    REJECT BOARDING
                                ================================================= */}

                                {booking.boardingStatus ===
                                    "NOT BOARDED" &&
                                    booking.boardingStatus !== "ON BOARD" && (

                                        <button
                                            onClick={
                                                openRejectModal
                                            }
                                            disabled={
                                                loadingBooking
                                            }
                                            style={{
                                                padding: "13px",
                                                border: "1px solid #fecaca",
                                                borderRadius: "8px",
                                                background:
                                                    loadingBooking
                                                        ? "#fee2e2"
                                                        : "#fef2f2",
                                                color: "#b91c1c",
                                                fontWeight: "600",
                                                cursor:
                                                    loadingBooking
                                                        ? "not-allowed"
                                                        : "pointer"
                                            }}
                                        >
                                            {loadingBooking
                                                ? "Processing..."
                                                : "✕ Reject Boarding"}
                                        </button>

                                    )}


                                {/* =================================================
                                    PAYMENT NOT VERIFIED
                                ================================================= */}

                                {booking.paymentStatus !==
                                    "VERIFIED" && (

                                        <div
                                            style={{
                                                background:
                                                    "#fff7ed",
                                                color:
                                                    "#c2410c",
                                                padding:
                                                    "12px",
                                                borderRadius:
                                                    "8px",
                                                fontSize:
                                                    "14px",
                                                lineHeight:
                                                    "1.5"
                                            }}
                                        >
                                            ⚠ Payment has not
                                            been verified.
                                            Passenger should
                                            not board yet.
                                        </div>

                                    )}


                                {/* =================================================
                                    BOOKING NOT CONFIRMED
                                ================================================= */}

                                {booking.paymentStatus ===
                                    "VERIFIED" &&

                                    booking.status !==
                                    "CONFIRMED" && (

                                        <div
                                            style={{
                                                background:
                                                    "#fff7ed",
                                                color:
                                                    "#c2410c",
                                                padding:
                                                    "12px",
                                                borderRadius:
                                                    "8px",
                                                fontSize:
                                                    "14px"
                                            }}
                                        >
                                            ⚠ This booking is
                                            not confirmed and
                                            cannot be boarded.
                                        </div>

                                    )}


                                {/* =================================================
                                    ALREADY BOARDED
                                ================================================= */}

                                {booking.boardingStatus ===
                                    "ON BOARD" && (

                                        <div
                                            style={{
                                                background:
                                                    "#dcfce7",
                                                color:
                                                    "#166534",
                                                padding:
                                                    "12px",
                                                borderRadius:
                                                    "8px",
                                                fontSize:
                                                    "14px",
                                                fontWeight:
                                                    "600"
                                            }}
                                        >
                                            ✓ Passenger is
                                            already marked
                                            as boarded.
                                        </div>

                                    )}


                                {/* =================================================
                                    TIME OUT / ARRIVAL
                                ================================================= */}

                                {booking.boardingStatus ===
                                    "ON BOARD" &&
                                    !booking.timedOutAt && (
                                        <div
                                            style={{
                                                background: "#eff6ff",
                                                color: "#1d4ed8",
                                                padding: "12px",
                                                borderRadius: "8px",
                                                fontSize: "14px",
                                                lineHeight: "1.5"
                                            }}
                                        >
                                            ✓ Passenger is onboard. Scan the same ticket again when the passenger arrives at the destination, then confirm the arrival time below.
                                        </div>
                                    )}

                                {booking.boardingStatus ===
                                    "ON BOARD" &&
                                    !booking.timedOutAt && (
                                        <button
                                            onClick={confirmArrivalTimeOut}
                                            disabled={loadingBooking}
                                            style={{
                                                padding: "13px",
                                                border: "none",
                                                borderRadius: "8px",
                                                background: loadingBooking
                                                    ? "#93c5fd"
                                                    : "#2563eb",
                                                color: "#ffffff",
                                                fontWeight: "600",
                                                cursor: loadingBooking
                                                    ? "not-allowed"
                                                    : "pointer"
                                            }}
                                        >
                                            {loadingBooking
                                                ? "Confirming Arrival..."
                                                : "✓ Confirm Arrival / Time Out"}
                                        </button>
                                    )}

                                {booking.timedOutAt && (
                                    <div
                                        style={{
                                            background: "#dcfce7",
                                            color: "#166534",
                                            padding: "12px",
                                            borderRadius: "8px",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            lineHeight: "1.5"
                                        }}
                                    >
                                        ✓ Arrival confirmed. Time out: {new Date(booking.timedOutAt).toLocaleString()}
                                    </div>
                                )}


                                {/* =================================================
                                    REJECTED
                                ================================================= */}

                                {booking.boardingStatus ===
                                    "REJECTED" && (

                                        <div
                                            style={{
                                                background:
                                                    "#fee2e2",
                                                color:
                                                    "#b91c1c",
                                                padding:
                                                    "12px",
                                                borderRadius:
                                                    "8px",
                                                fontSize:
                                                    "14px",
                                                fontWeight:
                                                    "600"
                                            }}
                                        >
                                            ✕ Passenger boarding
                                            has been rejected.
                                        </div>

                                    )}


                                {/* =================================================
                                    SCAN ANOTHER
                                ================================================= */}

                                <button
                                    onClick={
                                        scanAnother
                                    }
                                    disabled={
                                        loadingBooking
                                    }
                                    style={{
                                        padding: "13px",
                                        border:
                                            "1px solid #d1d5db",
                                        borderRadius:
                                            "8px",
                                        background:
                                            "#ffffff",
                                        color:
                                            "#374151",
                                        fontWeight:
                                            "600",
                                        cursor:
                                            loadingBooking
                                                ? "not-allowed"
                                                : "pointer"
                                    }}
                                >
                                    Scan Another Ticket
                                </button>

                            </div>

                        </div>

                    )}

                </div>

            </div>


            {/* =========================================================
                LOGOUT CONFIRMATION MODAL
            ========================================================= */}

            {showLogoutModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="logout-confirmation-title"
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.50)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        zIndex: 10000,
                        backdropFilter: "blur(2px)"
                    }}
                    onClick={cancelLogout}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: "420px",
                            background: "#ffffff",
                            borderRadius: "16px",
                            padding: "26px",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.22)"
                        }}
                    >
                        <div
                            style={{
                                width: "46px",
                                height: "46px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "14px",
                                borderRadius: "50%",
                                background: "#fee2e2",
                                color: "#dc2626",
                                fontSize: "22px",
                                fontWeight: "700"
                            }}
                        >
                            !
                        </div>

                        <h2
                            id="logout-confirmation-title"
                            style={{
                                margin: "0 0 8px",
                                color: "#111827",
                                fontSize: "21px"
                            }}
                        >
                            Confirm Logout
                        </h2>

                        <p
                            style={{
                                margin: "0 0 22px",
                                color: "#6b7280",
                                fontSize: "14px",
                                lineHeight: "1.6"
                            }}
                        >
                            Are you sure you want to log out of your staff
                            account?
                        </p>

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                justifyContent: "flex-end"
                            }}
                        >
                            <button
                                type="button"
                                onClick={cancelLogout}
                                style={{
                                    flex: 1,
                                    padding: "12px 16px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    background: "#ffffff",
                                    color: "#374151",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmLogout}
                                style={{
                                    flex: 1,
                                    padding: "12px 16px",
                                    border: "none",
                                    borderRadius: "8px",
                                    background: "#dc2626",
                                    color: "#ffffff",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                }}
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* =========================================================
                REJECTION REASON MODAL
            ========================================================= */}

            {showRejectModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        zIndex: 9999
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "500px",
                            background: "#ffffff",
                            borderRadius: "16px",
                            padding: "24px",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.20)"
                        }}
                    >
                        <h2
                            style={{
                                marginTop: 0,
                                marginBottom: "8px",
                                color: "#111827"
                            }}
                        >
                            Reject Boarding
                        </h2>

                        <p
                            style={{
                                marginTop: 0,
                                color: "#6b7280",
                                fontSize: "14px",
                                lineHeight: "1.5"
                            }}
                        >
                            Select a reason before rejecting this passenger. The reason will be saved with booking reference{" "}
                            <strong>{booking?.bookingReference || "N/A"}</strong> and shown to the passenger.
                        </p>

                        <label
                            style={{
                                display: "block",
                                marginBottom: "7px",
                                color: "#374151",
                                fontWeight: "600",
                                fontSize: "14px"
                            }}
                        >
                            Reason for rejection
                        </label>

                        <select
                            value={rejectReason}
                            onChange={(event) =>
                                setRejectReason(event.target.value)
                            }
                            disabled={loadingBooking}
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "8px",
                                background: "#ffffff",
                                color: "#111827",
                                fontSize: "14px",
                                marginBottom: "12px"
                            }}
                        >
                            <option value="Payment has not been verified by admin.">
                                Payment has not been verified by admin
                            </option>
                            <option value="Passenger identity could not be verified.">
                                Passenger identity could not be verified
                            </option>
                            <option value="Booking information does not match the passenger.">
                                Booking information does not match the passenger
                            </option>
                            <option value="Invalid or unreadable boarding ticket.">
                                Invalid or unreadable boarding ticket
                            </option>
                            <option value="Booking is not confirmed.">
                                Booking is not confirmed
                            </option>
                            <option value="Other">
                                Other
                            </option>
                        </select>

                        {rejectReason === "Other" && (
                            <textarea
                                value={customRejectReason}
                                onChange={(event) =>
                                    setCustomRejectReason(event.target.value)
                                }
                                disabled={loadingBooking}
                                placeholder="Enter the reason..."
                                rows={4}
                                maxLength={500}
                                style={{
                                    width: "100%",
                                    resize: "vertical",
                                    padding: "12px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    fontFamily: "inherit",
                                    fontSize: "14px",
                                    marginBottom: "15px",
                                    boxSizing: "border-box"
                                }}
                            />
                        )}

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                justifyContent: "flex-end"
                            }}
                        >
                            <button
                                type="button"
                                onClick={closeRejectModal}
                                disabled={loadingBooking}
                                style={{
                                    padding: "11px 16px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    background: "#ffffff",
                                    color: "#374151",
                                    fontWeight: "600",
                                    cursor: loadingBooking
                                        ? "not-allowed"
                                        : "pointer"
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmRejectBoarding}
                                disabled={loadingBooking}
                                style={{
                                    padding: "11px 16px",
                                    border: "none",
                                    borderRadius: "8px",
                                    background: loadingBooking
                                        ? "#fca5a5"
                                        : "#dc2626",
                                    color: "#ffffff",
                                    fontWeight: "600",
                                    cursor: loadingBooking
                                        ? "not-allowed"
                                        : "pointer"
                                }}
                            >
                                {loadingBooking
                                    ? "Rejecting..."
                                    : "Confirm Rejection"}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* =================================================
                RESPONSIVE CSS
            ================================================= */}

            <style>
                {`

                    /* =================================================
                       RESPONSIVE STAFF SCANNER
                    ================================================= */

                    * {
                        box-sizing: border-box;
                    }

                    .staff-scanner-grid {
                        width: 100%;
                    }

                    #staff-qr-reader {
                        width: 100% !important;
                        min-height: 300px;
                    }

                    #staff-qr-reader video {
                        width: 100% !important;
                        height: auto !important;
                        max-height: 55vh !important;
                        object-fit: cover !important;
                        border-radius: 12px !important;
                    }

                    @media (max-width: 900px) {

                        .staff-scanner-grid {
                            grid-template-columns: 1fr !important;
                            max-width: 760px !important;
                        }

                    }

                    @media (max-width: 768px) {

                        .staff-scanner-page {
                            padding: 16px !important;
                        }

                        .staff-scanner-header {
                            align-items: flex-start !important;
                        }

                        .staff-scanner-header h1 {
                            font-size: 24px !important;
                        }

                        .staff-scanner-card {
                            padding: 18px !important;
                        }

                        .staff-scanner-grid {
                            grid-template-columns: 1fr !important;
                            gap: 16px !important;
                        }

                        #staff-qr-reader {
                            min-height: 260px !important;
                        }

                        #staff-qr-reader video {
                            max-height: 48vh !important;
                        }

                    }

                    @media (max-width: 520px) {

                        .staff-scanner-page {
                            padding: 12px !important;
                        }

                        .staff-scanner-header {
                            flex-direction: column !important;
                            align-items: stretch !important;
                            gap: 12px !important;
                            margin-bottom: 16px !important;
                        }

                        .staff-scanner-header h1 {
                            font-size: 22px !important;
                        }

                        .staff-scanner-header p {
                            font-size: 13px !important;
                        }

                        .staff-scanner-header button {
                            width: 100% !important;
                        }

                        .staff-scanner-card {
                            padding: 16px !important;
                            border-radius: 14px !important;
                        }

                        .staff-scanner-card h2 {
                            font-size: 20px !important;
                        }

                        #staff-qr-reader {
                            min-height: 220px !important;
                            margin-top: 14px !important;
                        }

                        #staff-qr-reader video {
                            max-height: 42vh !important;
                        }

                        .staff-scanner-card button {
                            min-height: 46px !important;
                            font-size: 15px !important;
                        }

                    }

                    @media (max-width: 380px) {

                        .staff-scanner-page {
                            padding: 8px !important;
                        }

                        .staff-scanner-card {
                            padding: 13px !important;
                        }

                        .staff-scanner-card h2 {
                            font-size: 18px !important;
                        }

                        #staff-qr-reader {
                            min-height: 190px !important;
                        }

                    }

                    @media (orientation: landscape) and (max-width: 900px) {

                        #staff-qr-reader video {
                            max-height: 65vh !important;
                        }

                    }

                `}
            </style>

        </div>
    );
}


// =========================================================
// INFO ROW
// =========================================================

function InfoRow({ label, value }) {

    return (

        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                padding: "9px 0",
                borderBottom:
                    "1px solid #f3f4f6"
            }}
        >

            <span
                style={{
                    color: "#6b7280",
                    fontSize: "14px"
                }}
            >
                {label}
            </span>


            <strong
                style={{
                    color: "#111827",
                    fontSize: "14px",
                    textAlign: "right",
                    wordBreak: "break-word"
                }}
            >
                {value ?? "N/A"}
            </strong>

        </div>
    );
}


export default StaffScanner;