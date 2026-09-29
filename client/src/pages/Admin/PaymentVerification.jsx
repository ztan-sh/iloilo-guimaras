import React, { useCallback, useEffect, useState } from "react";
import "./PaymentVerification.css";

const API_URL = import.meta.env.VITE_API_URL;

const PaymentVerification = ({ onPendingCountChange }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [processing, setProcessing] = useState(false);

    const token = localStorage.getItem("adminToken");

    /* =========================================================
       HELPER: GET PAYMENT / BOOKING ID
    ========================================================= */

    const getPaymentId = (payment) => {
        return (
            payment?._id ||
            payment?.id ||
            payment?.paymentId ||
            payment?.bookingId ||
            payment?.booking?._id ||
            payment?.booking?.id ||
            null
        );
    };

    /* =========================================================
       HELPER: CONVERT IMAGE PATH TO VALID URL
    ========================================================= */

    const getProofUrl = (payment) => {

    let proof =
        payment?.paymentProof;

    if (
        proof &&
        typeof proof === "object"
    ) {

        proof =
            proof.url ||
            proof.fileUrl ||
            proof.path ||
            proof.image ||
            proof.filePath ||
            proof.location ||
            proof.filename ||
            proof.fileName ||
            proof.originalName ||
            null;
    }

    if (
        !proof ||
        typeof proof !== "string"
    ) {

        return null;
    }

    let url =
        proof.trim();

    if (!url) {
        return null;
    }

    // Complete URL
    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:image/")
    ) {

        return url;
    }

    // Convert Windows path
    url =
        url.replace(
            /\\/g,
            "/"
        );

    // Remove Vite address if accidentally stored
    url =
        url.replace(
            /^https?:\/\/localhost:5173/i,
            ""
        );

    // Remove server/uploads prefix
    url =
        url.replace(
            /^\/?server\/uploads\//i,
            "/uploads/"
        );

    // uploads/payment-proofs/...
    if (
        url.startsWith(
            "uploads/"
        )
    ) {

        url =
            "/" + url;
    }

    // payment-proofs/...
    else if (
        url.startsWith(
            "payment-proofs/"
        )
    ) {

        url =
            "/uploads/" + url;
    }

    // Just filename
    else if (
        !url.startsWith("/")
    ) {

        url =
            "/uploads/payment-proofs/" +
            url;
    }

    return `${API_BASE_URL}${url}`;
};

    /* =========================================================
       HELPER: SAFE JSON RESPONSE
    ========================================================= */

    const parseResponse = async (response) => {
        const contentType =
            response.headers.get("content-type") || "";

        const text = await response.text();

        if (!text) {
            return {};
        }

        if (!contentType.includes("application/json")) {
            console.error(
                "Server returned non-JSON:",
                text
            );

            throw new Error(
                `Server returned an invalid response (HTTP ${response.status}).`
            );
        }

        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.error(
                "JSON parsing error:",
                parseError
            );

            throw new Error(
                "The server returned invalid JSON."
            );
        }
    };

    /* =========================================================
       GET PAYMENT LIST FROM RESPONSE
    ========================================================= */

    const extractPayments = (data) => {
        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.payments)) {
            return data.payments;
        }

        if (Array.isArray(data?.bookings)) {
            return data.bookings;
        }

        if (Array.isArray(data?.submissions)) {
            return data.submissions;
        }

        if (Array.isArray(data?.data)) {
            return data.data;
        }

        return [];
    };

    /* =========================================================
       LOAD PENDING PAYMENTS
    ========================================================= */

    const loadPayments = useCallback(async () => {

    if (!token) {

        setLoading(false);

        setError(
            "Admin session expired. Please login again."
        );

        return;
    }

    try {

        setError("");
        setRefreshing(true);

        const response = await fetch(
            `${API_BASE_URL}/api/bookings/pending-payments`,
            {
                method: "GET",

                headers: {
                    Authorization:
                        `Bearer ${token}`,

                    Accept:
                        "application/json"
                }
            }
        );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        const text =
            await response.text();

        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            console.error(
                "Server returned non-JSON:",
                text
            );

            throw new Error(
                `Payment API returned HTTP ${response.status}.`
            );
        }

        let data = {};

        try {

            data =
                text
                    ? JSON.parse(text)
                    : {};

        } catch (error) {

            throw new Error(
                "The server returned invalid JSON."
            );
        }

        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Unable to load payment submissions."
            );
        }

        const paymentList =
            Array.isArray(
                data.bookings
            )
                ? data.bookings
                : [];

        setPayments(
            paymentList
        );

        if (onPendingCountChange) {

            onPendingCountChange(
                paymentList.length
            );

        }

    } catch (err) {

        console.error(
            "Payment loading error:",
            err
        );

        setPayments([]);

        setError(
            err.message ||
            "Unable to load payment submissions."
        );

        if (onPendingCountChange) {

            onPendingCountChange(0);

        }

    } finally {

        setLoading(false);
        setRefreshing(false);

    }

}, [
    token,
    onPendingCountChange
]);
    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    useEffect(() => {
        loadPayments();
    }, [loadPayments]);

    /* =========================================================
       OPEN MODAL
    ========================================================= */

    const openConfirmModal = (
        payment,
        action
    ) => {
        setSelectedPayment(payment);
        setConfirmAction(action);
        setShowConfirmModal(true);
        setError("");
    };

    /* =========================================================
       CLOSE MODAL
    ========================================================= */

    const closeConfirmModal = () => {
        if (processing) {
            return;
        }

        setShowConfirmModal(false);
        setSelectedPayment(null);
        setConfirmAction(null);
    };

    /* =========================================================
       PROCESS PAYMENT
    ========================================================= */

    const processPayment = async (
        payment,
        action
    ) => {
        const paymentId =
            getPaymentId(payment);

        if (!paymentId) {
            setError(
                "Payment ID is missing. The backend response must include the payment or booking ID."
            );
            return;
        }

        const currentToken =
            localStorage.getItem("adminToken");

        if (!currentToken) {
            setError(
                "Admin session expired. Please login again."
            );
            return;
        }

        try {
            setProcessing(true);
            setError("");

            const endpoint =
                action === "verify"
                    ? `${API_BASE_URL}/api/admin/payments/${paymentId}/verify`
                    : `${API_BASE_URL}/api/admin/payments/${paymentId}/reject`;

            const response = await fetch(
                endpoint,
                {
                    method: "PUT",
                    headers: {
                        Authorization:
                            `Bearer ${currentToken}`,
                        Accept: "application/json",
                        "Content-Type":
                            "application/json",
                    },
                }
            );

            const data =
                await parseResponse(response);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    `Unable to ${action} payment.`
                );
            }

            /*
             * Close modal immediately after the backend
             * successfully responds.
             */
            setShowConfirmModal(false);
            setSelectedPayment(null);
            setConfirmAction(null);

            /*
             * Reload from backend instead of only changing
             * the React array.
             *
             * This makes the admin page reflect the actual
             * database state.
             */
            await loadPayments();

        } catch (err) {
            console.error(
                `${action} payment error:`,
                err
            );

            setError(
                err.message ||
                `Unable to ${action} payment.`
            );

        } finally {
            setProcessing(false);
        }
    };

    /* =========================================================
       VERIFY
    ========================================================= */

    const handleVerifyPayment = (
        payment
    ) => {
        processPayment(
            payment,
            "verify"
        );
    };

    /* =========================================================
       REJECT
    ========================================================= */

    const handleRejectPayment = (
        payment
    ) => {
        processPayment(
            payment,
            "reject"
        );
    };

    /* =========================================================
       FORMAT DATE
    ========================================================= */

    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return String(date);
        }

        return parsedDate.toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric",
            }
        );
    };

    /* =========================================================
       FORMAT AMOUNT
    ========================================================= */

    const formatAmount = (amount) => {
        if (
            amount === undefined ||
            amount === null ||
            amount === ""
        ) {
            return "—";
        }

        const number =
            Number(amount);

        if (
            Number.isNaN(number)
        ) {
            return String(amount);
        }

        return `₱${number.toLocaleString(
            "en-PH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        )}`;
    };

    /* =========================================================
       BOOKING REFERENCE
    ========================================================= */

    const getBookingReference = (
        payment
    ) => {
        return (
            payment?.bookingReference ||
            payment?.referenceNumber ||
            payment?.reference ||
            payment?.booking?.bookingReference ||
            payment?.booking?.referenceNumber ||
            "—"
        );
    };

    /* =========================================================
       PASSENGER
    ========================================================= */

    const getPassenger = (
        payment
    ) => {
        return (
            payment?.passengerName ||
            payment?.passenger ||
            payment?.fullName ||
            payment?.customerName ||
            payment?.booking?.passengerName ||
            payment?.booking?.fullName ||
            "—"
        );
    };

    /* =========================================================
       ROUTE
    ========================================================= */

    const getRoute = (
        payment
    ) => {
        if (payment?.route) {
            return payment.route;
        }

        if (payment?.booking?.route) {
            return payment.booking.route;
        }

        const origin =
            payment?.origin ||
            payment?.from ||
            payment?.booking?.origin ||
            payment?.booking?.from;

        const destination =
            payment?.destination ||
            payment?.to ||
            payment?.booking?.destination ||
            payment?.booking?.to;

        if (
            origin &&
            destination
        ) {
            return `${origin} → ${destination}`;
        }

        return "—";
    };

    /* =========================================================
       DATE
    ========================================================= */

    const getDate = (
        payment
    ) => {
        return (
            payment?.date ||
            payment?.bookingDate ||
            payment?.travelDate ||
            payment?.departureDate ||
            payment?.booking?.date ||
            payment?.booking?.travelDate ||
            payment?.createdAt ||
            null
        );
    };

    /* =========================================================
       TIME
    ========================================================= */

    const getTime = (
        payment
    ) => {
        return (
            payment?.time ||
            payment?.departureTime ||
            payment?.booking?.time ||
            payment?.booking?.departureTime ||
            "—"
        );
    };

    /* =========================================================
       AMOUNT
    ========================================================= */

    const getAmount = (
        payment
    ) => {
        return (
            payment?.requiredAmount ??
            payment?.amount ??
            payment?.totalAmount ??
            payment?.booking?.requiredAmount ??
            payment?.booking?.amount ??
            payment?.booking?.totalAmount ??
            null
        );
    };

    /* =========================================================
       PAYMENT METHOD
    ========================================================= */

    const getPaymentMethod = (
        payment
    ) => {
        return (
            payment?.paymentMethod ||
            payment?.method ||
            payment?.payment?.method ||
            payment?.payment?.paymentMethod ||
            payment?.booking?.paymentMethod ||
            "—"
        );
    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <section className="payment-page">

                <div className="payment-page-header">
                    <div>
                        <span className="page-eyebrow">
                            ADMINISTRATION
                        </span>

                        <h1>
                            Payment Verification
                        </h1>

                        <p>
                            Review and process customer
                            payment submissions.
                        </p>
                    </div>
                </div>

                <div className="payment-loading-card">
                    <div className="loading-spinner"></div>

                    <h3>
                        Loading Payments
                    </h3>

                    <p>
                        Please wait while we retrieve
                        payment submissions.
                    </p>
                </div>

            </section>
        );
    }

    return (
        <section className="payment-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="payment-page-header">

                <div>
                    <span className="page-eyebrow">
                        ADMINISTRATION
                    </span>

                    <h1>
                        Payment Verification
                    </h1>

                    <p>
                        Review and process customer
                        payment submissions.
                    </p>
                </div>

                <div className="pending-summary">
                    <strong>
                        {payments.length}
                    </strong>

                    <span>
                        Pending
                    </span>
                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="payment-error">

                    <div className="error-icon">
                        !
                    </div>

                    <div className="error-content">
                        <strong>
                            Unable to process request
                        </strong>

                        <p>
                            {error}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="error-refresh"
                        onClick={loadPayments}
                    >
                        Try Again
                    </button>

                </div>
            )}


            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="payment-toolbar">

                <div className="toolbar-info">

                    <div className="toolbar-icon">
                        ₱
                    </div>

                    <div>
                        <strong>
                            Pending Submissions
                        </strong>

                        <span>
                            {payments.length}{" "}
                            payment
                            {payments.length !== 1
                                ? "s"
                                : ""}{" "}
                            awaiting review
                        </span>
                    </div>

                </div>

                <button
                    type="button"
                    className="refresh-button"
                    onClick={loadPayments}
                    disabled={refreshing}
                >
                    <span
                        className={
                            refreshing
                                ? "spin"
                                : ""
                        }
                    >
                        ↻
                    </span>

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}
                </button>

            </div>


            {/* =================================================
                EMPTY
            ================================================= */}

            {!error &&
                payments.length === 0 && (
                    <div className="empty-payment-card">

                        <div className="empty-icon">
                            ✓
                        </div>

                        <h2>
                            No Pending Payments
                        </h2>

                        <p>
                            There are currently no payment
                            submissions waiting for verification.
                        </p>

                        <button
                            type="button"
                            className="empty-refresh-button"
                            onClick={loadPayments}
                        >
                            ↻ Refresh Payments
                        </button>

                    </div>
                )}


            {/* =================================================
                PAYMENT CARDS
            ================================================= */}

            {payments.length > 0 && (
                <div className="payment-list">

                    {payments.map(
                        (payment, index) => {

                            const paymentId =
                                getPaymentId(
                                    payment
                                ) ||
                                `payment-${index}`;

                            const proofUrl =
                                getProofUrl(
                                    payment
                                );

                            const bookingReference =
                                getBookingReference(
                                    payment
                                );

                            const passenger =
                                getPassenger(
                                    payment
                                );

                            const route =
                                getRoute(
                                    payment
                                );

                            const date =
                                getDate(
                                    payment
                                );

                            const time =
                                getTime(
                                    payment
                                );

                            const amount =
                                getAmount(
                                    payment
                                );

                            const paymentMethod =
                                getPaymentMethod(
                                    payment
                                );

                            return (
                                <article
                                    className="payment-card"
                                    key={paymentId}
                                >

                                    {/* CARD HEADER */}

                                    <div className="payment-card-header">

                                        <div>
                                            <span className="reference-label">
                                                BOOKING REFERENCE
                                            </span>

                                            <h2>
                                                {bookingReference}
                                            </h2>
                                        </div>

                                        <span className="status-badge">
                                            <span className="status-dot"></span>
                                            Pending Verification
                                        </span>

                                    </div>


                                    {/* BOOKING INFORMATION */}

                                    <div className="payment-info-grid">

                                        <div className="payment-info">
                                            <span>
                                                Passenger
                                            </span>

                                            <strong>
                                                {passenger}
                                            </strong>
                                        </div>

                                        <div className="payment-info">
                                            <span>
                                                Route
                                            </span>

                                            <strong>
                                                {route}
                                            </strong>
                                        </div>

                                        <div className="payment-info">
                                            <span>
                                                Date
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    date
                                                )}
                                            </strong>
                                        </div>

                                        <div className="payment-info">
                                            <span>
                                                Time
                                            </span>

                                            <strong>
                                                {time}
                                            </strong>
                                        </div>

                                        <div className="payment-info">
                                            <span>
                                                Required Amount
                                            </span>

                                            <strong className="amount">
                                                {formatAmount(
                                                    amount
                                                )}
                                            </strong>
                                        </div>

                                        <div className="payment-info">
                                            <span>
                                                Payment Method
                                            </span>

                                            <strong>
                                                {paymentMethod}
                                            </strong>
                                        </div>

                                    </div>


                                    {/* PAYMENT PROOF */}

                                    <div className="payment-proof-section">

                                        <div className="proof-heading">
                                            <div>
                                                <h3>
                                                    Payment Proof
                                                </h3>

                                                <p>
                                                    Customer submitted payment receipt
                                                </p>
                                            </div>
                                        </div>

                                        {proofUrl ? (
                                            <div className="proof-wrapper">

                                                <a
                                                    href={proofUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="proof-image-link"
                                                    title="Open payment receipt"
                                                >

                                                    <img
                                                        src={proofUrl}
                                                        alt="Customer payment receipt"
                                                        className="proof-image"
                                                        onError={(
                                                            event
                                                        ) => {
                                                            event.currentTarget.style.display =
                                                                "none";

                                                            const wrapper =
                                                                event.currentTarget.closest(
                                                                    ".proof-image-link"
                                                                );

                                                            if (
                                                                wrapper &&
                                                                !wrapper.querySelector(
                                                                    ".proof-error"
                                                                )
                                                            ) {
                                                                const errorBox =
                                                                    document.createElement(
                                                                        "div"
                                                                    );

                                                                errorBox.className =
                                                                    "proof-error";

                                                                errorBox.innerHTML =
                                                                    `
                                                                    <strong>
                                                                        Receipt image unavailable
                                                                    </strong>
                                                                    <span>
                                                                        Check that the backend serves the /uploads folder.
                                                                    </span>
                                                                    `;

                                                                wrapper.appendChild(
                                                                    errorBox
                                                                );
                                                            }
                                                        }}
                                                    />

                                                    <div className="proof-overlay">
                                                        <span>
                                                            View Receipt
                                                        </span>
                                                    </div>

                                                </a>

                                                <a
                                                    href={proofUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="receipt-link"
                                                >
                                                    Open full receipt →
                                                </a>

                                            </div>
                                        ) : (
                                            <div className="no-proof">

                                                <span>
                                                    !
                                                </span>

                                                <div>
                                                    <strong>
                                                        No payment proof
                                                    </strong>

                                                    <small>
                                                        The customer did not upload a receipt.
                                                    </small>
                                                </div>

                                            </div>
                                        )}

                                    </div>


                                    {/* ACTIONS */}

                                    <div className="payment-actions">

                                        <button
                                            type="button"
                                            className="reject-button"
                                            onClick={() =>
                                                openConfirmModal(
                                                    payment,
                                                    "reject"
                                                )
                                            }
                                            disabled={processing}
                                        >
                                            <span>
                                                ×
                                            </span>

                                            Reject Payment
                                        </button>

                                        <button
                                            type="button"
                                            className="verify-button"
                                            onClick={() =>
                                                openConfirmModal(
                                                    payment,
                                                    "verify"
                                                )
                                            }
                                            disabled={processing}
                                        >
                                            <span>
                                                ✓
                                            </span>

                                            Verify Payment
                                        </button>

                                    </div>

                                </article>
                            );
                        }
                    )}

                </div>
            )}


            {/* =================================================
                CONFIRMATION MODAL
            ================================================= */}

            {showConfirmModal &&
                selectedPayment && (
                    <div
                        className="modal-overlay"
                        onClick={
                            closeConfirmModal
                        }
                    >

                        <div
                            className="confirm-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div
                                className={
                                    confirmAction ===
                                    "reject"
                                        ? "modal-icon danger"
                                        : "modal-icon success"
                                }
                            >
                                {confirmAction ===
                                "reject"
                                    ? "!"
                                    : "✓"}
                            </div>

                            <h2>
                                {confirmAction ===
                                "reject"
                                    ? "Reject Payment?"
                                    : "Verify Payment?"}
                            </h2>

                            <p>
                                {confirmAction ===
                                "reject"
                                    ? "Are you sure you want to reject this payment?"
                                    : "Are you sure you want to verify this payment?"}
                            </p>

                            <div className="selected-reference">

                                <span>
                                    Booking Reference
                                </span>

                                <strong>
                                    {getBookingReference(
                                        selectedPayment
                                    )}
                                </strong>

                            </div>

                            <div className="confirm-modal-actions">

                                <button
                                    type="button"
                                    className="modal-cancel"
                                    onClick={
                                        closeConfirmModal
                                    }
                                    disabled={
                                        processing
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className={
                                        confirmAction ===
                                        "reject"
                                            ? "modal-confirm danger"
                                            : "modal-confirm success"
                                    }
                                    disabled={
                                        processing
                                    }
                                    onClick={() => {

                                        if (
                                            confirmAction ===
                                            "reject"
                                        ) {
                                            handleRejectPayment(
                                                selectedPayment
                                            );
                                        } else {
                                            handleVerifyPayment(
                                                selectedPayment
                                            );
                                        }

                                    }}
                                >
                                    {processing
                                        ? "Processing..."
                                        : confirmAction ===
                                          "reject"
                                            ? "Reject Payment"
                                            : "Verify Payment"}
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </section>
    );
};

export default PaymentVerification;