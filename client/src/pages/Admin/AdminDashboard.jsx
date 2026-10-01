import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api";

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const AdminDashboard = () => {
    const navigate = useNavigate();
    // =========================================================
    // ADMIN
    // =========================================================

    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    // =========================================================
    // VIEW
    // =========================================================

    const [activeView, setActiveView] = useState("dashboard");

    // Mobile navigation drawer
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // =========================================================
    // PAYMENT TAB
    // =========================================================

    const [activePaymentTab, setActivePaymentTab] =
        useState("pending");

    // =========================================================
    // STATISTICS
    // =========================================================

    const [statistics, setStatistics] = useState({
        totalBookings: 0,
        pendingPayments: 0,
        verifiedPayments: 0,
        rejectedPayments: 0
    });

    // =========================================================
    // FERRY CAPACITY
    // =========================================================

    const [ferryCapacities, setFerryCapacities] =
        useState([]);

    const [capacityLoading, setCapacityLoading] =
        useState(true);

    const [capacityError, setCapacityError] =
        useState("");

    // =========================================================
    // LIVE FERRY BOOKINGS
    // =========================================================
    // Loads the actual passenger bookings separately from the
    // public capacity endpoint. This keeps booking details
    // protected by the existing admin authentication.
    // =========================================================

    const [ferryBookings, setFerryBookings] =
        useState([]);

    // =========================================================
    // BOOKING SEARCH + FERRY CONTROL
    // =========================================================

    const [bookingSearchReference, setBookingSearchReference] =
        useState("");

    const [bookingSearchResult, setBookingSearchResult] =
        useState(null);

    const [bookingSearchLoading, setBookingSearchLoading] =
        useState(false);

    const [bookingSearchError, setBookingSearchError] =
        useState("");

    const [ferryActionLoading, setFerryActionLoading] =
        useState(null);

    // =========================================================
    // PAYMENT DATA
    // =========================================================

    const [pendingPayments, setPendingPayments] =
        useState([]);

    const [verifiedPayments, setVerifiedPayments] =
        useState([]);

    const [rejectedPayments, setRejectedPayments] =
        useState([]);

    const [paymentLoading, setPaymentLoading] =
        useState(false);

    // =========================================================
    // ACTION LOADING
    // =========================================================

    const [actionLoading, setActionLoading] =
        useState(null);

    // =========================================================
    // NOTIFICATION
    // =========================================================

    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: ""
    });

    // =========================================================
    // CONFIRMATION MODAL
    // =========================================================

    const [showConfirmModal, setShowConfirmModal] =
        useState(false);

    const [selectedPayment, setSelectedPayment] =
        useState(null);

    const [confirmAction, setConfirmAction] =
        useState(null);

    // =========================================================
    // FERRY BOOKING CONFIRMATION MODAL
    // =========================================================

    const [showFerryConfirmModal, setShowFerryConfirmModal] =
        useState(false);

    const [selectedFerryAction, setSelectedFerryAction] =
        useState(null);

    const [ferryConfirmLoading, setFerryConfirmLoading] =
        useState(false);

    const [showLogoutModal, setShowLogoutModal] =
    useState(false);
    // =========================================================
    // STAFF MANAGEMENT
    // =========================================================

    const [staff, setStaff] = useState([]);
    const [staffLoading, setStaffLoading] = useState(false);
    const [staffActionLoading, setStaffActionLoading] = useState(null);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [staffForm, setStaffForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [staffSearch, setStaffSearch] = useState("");
    const [staffStatusFilter, setStaffStatusFilter] = useState("all");

    // =========================================================
    // SHOW NOTIFICATION
    // =========================================================

    const showNotification = (
        message,
        type = "error"
    ) => {
        setNotification({
            show: true,
            type,
            message
        });

        setTimeout(() => {
            setNotification({
                show: false,
                type: "",
                message: ""
            });
        }, 4000);
    };

    // =========================================================
    // LOAD SAVED REJECTED PAYMENTS
    //
    // UI ONLY
    // This does NOT replace your backend.
    // It simply remembers rejected cards locally so the
    // Rejected tab does not become empty after refresh.
    // =========================================================

    useEffect(() => {
        try {
            const saved =
                localStorage.getItem(
                    "adminRejectedPayments"
                );

            if (saved) {
                const parsed =
                    JSON.parse(saved);

                if (Array.isArray(parsed)) {
                    setRejectedPayments(parsed);
                }
            }
        } catch (error) {
            console.error(
                "Unable to load rejected payment history:",
                error
            );
        }
    }, []);

    // =========================================================
    // SAVE REJECTED PAYMENTS
    // =========================================================

    useEffect(() => {
        try {
            localStorage.setItem(
                "adminRejectedPayments",
                JSON.stringify(rejectedPayments)
            );
        } catch (error) {
            console.error(
                "Unable to save rejected payment history:",
                error
            );
        }
    }, [rejectedPayments]);

    // =========================================================
    // LOAD ADMIN
    // =========================================================

    useEffect(() => {
        const token =
            localStorage.getItem("adminToken");

        if (!token) {
            navigate("/admin-login", {
                replace: true
            });

            return;
        }

        const loadAdmin = async () => {
            try {
                const response =
                    await fetch(
                        `${API_URL}/admin/me`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Unable to load administrator."
                    );
                }

                setAdmin(data.admin);

            } catch (error) {

                console.error(
                    "Load admin error:",
                    error
                );

                localStorage.removeItem(
                    "adminToken"
                );

                localStorage.removeItem(
                    "adminData"
                );

                navigate("/admin-login", {
                    replace: true
                });

            } finally {
                setLoading(false);
            }
        };

        loadAdmin();

    }, [navigate]);

    // =========================================================
    // GET TODAY'S LOCAL DATE
    // =========================================================

    const getToday = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };


    // =========================================================
    // NORMALIZE BOOKING DATE
    // =========================================================
    // Keeps existing bookings visible even if an older booking
    // was saved as MM/DD/YYYY instead of YYYY-MM-DD.
    // =========================================================

    const normalizeBookingDate = (value) => {
        if (value === null || value === undefined || value === "") {
            return "";
        }

        const text = String(value).trim();

        const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (isoMatch) {
            return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2, "0")}-${String(isoMatch[3]).padStart(2, "0")}`;
        }

        const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (slashMatch) {
            return `${slashMatch[3]}-${String(slashMatch[1]).padStart(2, "0")}-${String(slashMatch[2]).padStart(2, "0")}`;
        }

        const dashMatch = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (dashMatch) {
            return `${dashMatch[3]}-${String(dashMatch[1]).padStart(2, "0")}-${String(dashMatch[2]).padStart(2, "0")}`;
        }

        return text;
    };

    // =========================================================
    // GET FERRY / VESSEL DISPLAY NAME
    // =========================================================
    // Some older bookings were saved before ferryName /
    // vesselName was persisted. In that case, use the saved
    // ferry identity first and safely fall back to the
    // scheduled departure time.
    // =========================================================

    const getBookingVesselName = (booking) => {
        const directName =
            booking?._resolvedFerryName ||
            booking?.vesselName ||
            booking?.ferryName ||
            booking?.vessel ||
            booking?.ferry ||
            booking?.ferryId ||
            booking?.selectedFerry?.vesselName ||
            booking?.selectedFerry?.ferryName ||
            booking?.selectedTrip?.vesselName ||
            booking?.selectedTrip?.ferryName;

        if (directName) {
            return directName;
        }

        const rawTime =
            booking?.departureTime ||
            booking?.time ||
            booking?.tripTime ||
            booking?.selectedFerry?.departureTime ||
            booking?.selectedFerry?.time ||
            booking?.selectedTrip?.departureTime ||
            booking?.selectedTrip?.time ||
            "";

        const timeText = String(rawTime).trim().toUpperCase();
        const match = timeText.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);

        let normalizedTime = timeText;

        if (match) {
            let hour = Number(match[1]);
            const minute = match[2];
            const period = match[3];

            if (period === "AM" && hour === 12) {
                hour = 0;
            }

            if (period === "PM" && hour !== 12) {
                hour += 12;
            }

            normalizedTime =
                `${String(hour).padStart(2, "0")}:${minute}`;
        } else if (/^\d{1,2}:\d{2}$/.test(timeText)) {
            const [hour, minute] = timeText.split(":");
            normalizedTime =
                `${String(Number(hour)).padStart(2, "0")}:${minute}`;
        }

        const ferryByTime = {
            "03:30": "MV Felipe III",
            "08:00": "MV FastCraft",
            "09:00": "MV Halili"
        };

        return ferryByTime[normalizedTime] || "—";
    };

    // =========================================================
    // LOAD LIVE FERRY CAPACITY
    // =========================================================

    const loadFerryCapacities = async (options = {}) => {
        const { silent = false } = options;

        try {
            if (!silent) {
                setCapacityLoading(true);
            }

            setCapacityError("");

            const response = await fetch(
                `${API_URL}/bookings/capacity?date=${getToday()}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json"
                    },
                    cache: "no-store"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load ferry capacity."
                );
            }

            setFerryCapacities(
                Array.isArray(data.capacities)
                    ? data.capacities
                    : []
            );

        } catch (error) {
            console.error("Ferry capacity loading error:", error);
            setCapacityError(
                error.message ||
                "Unable to load ferry capacity."
            );
        } finally {
            if (!silent) {
                setCapacityLoading(false);
            }
        }
    };

    // =========================================================
    // LOAD TODAY'S BOOKINGS FOR FERRY CAPACITY
    // =========================================================
    // Uses the existing authenticated Admin bookings endpoint.
    // This makes every booking created from the passenger side
    // appear automatically in the corresponding ferry card.
    // =========================================================

    const loadFerryBookings = async () => {
        const token = localStorage.getItem("adminToken");

        if (!token) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/bookings`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    },
                    cache: "no-store"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Unable to load ferry bookings."
                );
            }

            const today = getToday();

            setFerryBookings(
                (Array.isArray(data.bookings)
                    ? data.bookings
                    : []
                ).filter(
                    booking =>
                        normalizeBookingDate(
                            booking?.date ||
                            booking?.travelDate ||
                            ""
                        ) === today &&
                        String(
                            booking?.status ||
                            ""
                        ).toUpperCase() !== "CANCELLED" &&
                        String(
                            booking?.paymentStatus ||
                            ""
                        ).toUpperCase() !== "REJECTED"
                )
            );
        } catch (error) {
            console.error(
                "Ferry booking loading error:",
                error
            );
        }
    };

    // =========================================================
    // MATCH BOOKINGS TO A FERRY
    // =========================================================

    const getFerryBookings = (ferry) => {
        const normalize = value =>
            String(value || "")
                .trim()
                .replace(/\s+/g, " ")
                .toLowerCase();

        const ferryId = normalize(
            ferry?.id ||
            ferry?.vesselName
        );

        const ferryName = normalize(
            ferry?.vesselName
        );

        const ferryTime = normalize(
            ferry?.time ||
            ferry?.departureTime
        );

        return ferryBookings.filter(
            booking => {
                const bookingId = normalize(
                    booking?.ferryId ||
                    booking?.selectedFerry?.id ||
                    booking?.selectedTrip?.id ||
                    booking?.trip?.id
                );

                const bookingName = normalize(
                    booking?.vesselName ||
                    booking?.ferryName ||
                    booking?.vessel ||
                    booking?.ferry ||
                    booking?.selectedFerry?.vesselName ||
                    booking?.selectedFerry?.ferryName ||
                    booking?.selectedTrip?.vesselName ||
                    booking?.selectedTrip?.ferryName
                );

                const bookingTime = normalize(
                    booking?.time ||
                    booking?.departureTime ||
                    booking?.tripTime ||
                    booking?.selectedFerry?.time ||
                    booking?.selectedFerry?.departureTime ||
                    booking?.selectedTrip?.time ||
                    booking?.selectedTrip?.departureTime
                );

                return (
                    (bookingId !== "" &&
                        bookingId === ferryId) ||
                    (bookingName !== "" &&
                        bookingName === ferryName) ||
                    (
                        bookingId === "" &&
                        bookingName === "" &&
                        bookingTime !== "" &&
                        bookingTime === ferryTime
                    )
                );
            }
        );
    };

    // =========================================================
    // SEARCH BOOKING BY REFERENCE
    // =========================================================

    const handleBookingSearch = async (event) => {
        event?.preventDefault();

        const reference = String(bookingSearchReference || "").trim();

        if (!reference) {
            setBookingSearchResult(null);
            setBookingSearchError("Please enter a booking reference number.");
            return;
        }

        const token = localStorage.getItem("adminToken");
        if (!token) {
            showNotification("Admin session expired.", "error");
            return;
        }

        try {
            setBookingSearchLoading(true);
            setBookingSearchError("");
            setBookingSearchResult(null);

            const response = await fetch(
                `${API_URL}/bookings/search/reference/${encodeURIComponent(reference)}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    },
                    cache: "no-store"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Booking not found.");
            }

            if (!data?.booking) {
                throw new Error("Booking information was not returned by the server.");
            }

            /*
             * Ferry Capacity is the source of truth for the scheduled
             * vessel. Older bookings may not have saved ferryName /
             * vesselName, so resolve the vessel from the capacity
             * schedule using the booking date and departure time.
             */
            let bookingWithFerry = data.booking;

            try {
                const bookingDate = normalizeBookingDate(
                    data.booking?.date ||
                    data.booking?.travelDate ||
                    data.booking?.departureDate ||
                    ""
                );

                const bookingDepartureTime =
                    data.booking?.departureTime ||
                    data.booking?.time ||
                    data.booking?.tripTime ||
                    data.booking?.selectedFerry?.departureTime ||
                    data.booking?.selectedFerry?.time ||
                    data.booking?.selectedTrip?.departureTime ||
                    data.booking?.selectedTrip?.time ||
                    "";

                if (bookingDate && bookingDepartureTime) {
                    const capacityResponse = await fetch(
                        `${API_URL}/bookings/capacity?date=${encodeURIComponent(bookingDate)}`,
                        {
                            method: "GET",
                            headers: {
                                Accept: "application/json"
                            },
                            cache: "no-store"
                        }
                    );

                    if (capacityResponse.ok) {
                        const capacityData =
                            await capacityResponse.json();

                        const capacities = Array.isArray(
                            capacityData?.capacities
                        )
                            ? capacityData.capacities
                            : [];

                        const normalizeValue = (value) =>
                            String(value || "")
                                .trim()
                                .replace(/\s+/g, " ")
                                .toLowerCase();

                        const normalizeTime = (value) => {
                            const valueText =
                                String(value || "")
                                    .trim()
                                    .toUpperCase();

                            const timeMatch =
                                valueText.match(
                                    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
                                );

                            if (timeMatch) {
                                let hour =
                                    Number(timeMatch[1]);
                                const minute =
                                    timeMatch[2];
                                const period =
                                    timeMatch[3];

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

                                return `${String(hour).padStart(2, "0")}:${minute}`;
                            }

                            if (
                                /^\d{1,2}:\d{2}$/.test(
                                    valueText
                                )
                            ) {
                                const [hour, minute] =
                                    valueText.split(":");

                                return `${String(Number(hour)).padStart(2, "0")}:${minute}`;
                            }

                            return valueText;
                        };

                        const targetFerryId = normalizeValue(
                            data.booking?.ferryId ||
                            data.booking?.selectedFerry?.id ||
                            data.booking?.selectedTrip?.id ||
                            ""
                        );

                        const targetFerryName = normalizeValue(
                            data.booking?.vesselName ||
                            data.booking?.ferryName ||
                            data.booking?.vessel ||
                            data.booking?.ferry ||
                            ""
                        );

                        const targetTime =
                            normalizeTime(
                                bookingDepartureTime
                            );

                        const matchedFerry =
                            capacities.find((ferry) => {
                                const ferryId =
                                    normalizeValue(
                                        ferry?.id ||
                                        ferry?.ferryId ||
                                        ferry?.vesselId ||
                                        ""
                                    );

                                const ferryName =
                                    normalizeValue(
                                        ferry?.vesselName ||
                                        ferry?.ferryName ||
                                        ferry?.vessel ||
                                        ferry?.ferry ||
                                        ""
                                    );

                                const ferryTime =
                                    normalizeTime(
                                        ferry?.departureTime ||
                                        ferry?.time ||
                                        ""
                                    );

                                if (
                                    targetFerryId &&
                                    ferryId &&
                                    targetFerryId === ferryId
                                ) {
                                    return true;
                                }

                                if (
                                    targetFerryName &&
                                    ferryName &&
                                    targetFerryName === ferryName
                                ) {
                                    return true;
                                }

                                return (
                                    targetTime &&
                                    ferryTime &&
                                    targetTime === ferryTime
                                );
                            });

                        if (matchedFerry?.vesselName) {
                            bookingWithFerry = {
                                ...data.booking,
                                _resolvedFerryName:
                                    matchedFerry.vesselName
                            };
                        }
                    }
                }
            } catch (capacityLookupError) {
                console.warn(
                    "Unable to resolve ferry from capacity schedule:",
                    capacityLookupError
                );
            }

            setBookingSearchResult(bookingWithFerry);
        } catch (error) {
            console.error("Booking reference search error:", error);
            setBookingSearchError(
                error.message || "Unable to search booking reference."
            );
        } finally {
            setBookingSearchLoading(false);
        }
    };

    // =========================================================
    // CLOSE / REOPEN ONE FERRY FOR ONLINE BOOKING
    // =========================================================

    const handleFerryBookingToggle = (ferry) => {
        const token = localStorage.getItem("adminToken");

        if (!token) {
            showNotification("Admin session expired.", "error");
            return;
        }

        const ferryId = ferry?.id || ferry?.vesselName;

        if (!ferryId) {
            showNotification("Ferry information is missing.", "error");
            return;
        }

        const currentlyClosed = Boolean(ferry.manualClosed);

        // Use the existing Admin modal style instead of the browser confirm().
        setSelectedFerryAction({
            ferry,
            ferryId,
            currentlyClosed
        });

        setShowFerryConfirmModal(true);
    };

    const closeFerryConfirmModal = () => {
        if (ferryConfirmLoading) {
            return;
        }

        setShowFerryConfirmModal(false);
        setSelectedFerryAction(null);
    };

    const executeFerryBookingToggle = async () => {
        const token = localStorage.getItem("adminToken");

        if (!token) {
            closeFerryConfirmModal();
            showNotification("Admin session expired.", "error");
            return;
        }

        if (!selectedFerryAction) {
            return;
        }

        const {
            ferry,
            ferryId,
            currentlyClosed
        } = selectedFerryAction;

        const actionKey = `${ferryId}-${getToday()}`;

        try {
            setFerryConfirmLoading(true);
            setFerryActionLoading(actionKey);

            const response = await fetch(
                `${API_URL}/bookings/ferry-closure`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json"
                    },
                    body: JSON.stringify({
                        ferryId,
                        date: getToday(),
                        closed: !currentlyClosed
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Unable to update ferry online booking status."
                );
            }

            closeFerryConfirmModal();

            showNotification(
                data?.message ||
                (currentlyClosed
                    ? "Online booking reopened."
                    : "Online booking closed."),
                "success"
            );

            await loadFerryCapacities();
        } catch (error) {
            console.error(
                "Ferry booking status error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to update ferry online booking status.",
                "error"
            );
        } finally {
            setFerryConfirmLoading(false);
            setFerryActionLoading(null);
        }
    };

    // =========================================================
    // INITIAL + AUTOMATIC CAPACITY REFRESH
    // =========================================================

    useEffect(() => {
        loadFerryCapacities();
        loadFerryBookings();

        /*
         * Keep Ferry Capacity live without visibly reloading the
         * section every few seconds. Background updates are silent.
         */
        const interval = setInterval(() => {
            loadFerryCapacities({ silent: true });
            loadFerryBookings();
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    // =========================================================
    // LOAD DASHBOARD STATISTICS
    // =========================================================

    const loadStatistics = async () => {

        const token =
            localStorage.getItem("adminToken");

        if (!token) return;

        try {

            const response =
                await fetch(
                    `${API_URL}/bookings/statistics`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load statistics."
                );
            }

            if (data.statistics) {

                setStatistics(
                    data.statistics
                );

            }

        } catch (error) {

            console.error(
                "Statistics error:",
                error
            );

        }
    };

    // =========================================================
    // LOAD PENDING PAYMENTS
    // =========================================================

    const loadPendingPayments = async () => {

        const token =
            localStorage.getItem("adminToken");

        if (!token) return;

        setPaymentLoading(true);

        try {

            const response = await fetch(
    `${API_URL}/bookings/pending-payments`,
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
        }
    }
);

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load payment submissions."
                );
            }

            setPendingPayments(
                (data.bookings || []).filter(
                    booking =>
                        String(
                            booking?.boardingStatus ||
                            ""
                        ).toUpperCase() !==
                        "REJECTED"
                )
            );

        } catch (error) {

            console.error(
                "Payment loading error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to load payment submissions.",
                "error"
            );

        } finally {

            setPaymentLoading(false);

        }
    };

    // =========================================================
    // LOAD VERIFIED PAYMENTS
    // =========================================================

    const loadVerifiedPayments = async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        try {
            const response = await fetch(
                `${API_URL}/bookings/verified-payments`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load verified payments."
                );
            }

            setVerifiedPayments(
                (data.bookings || []).filter(
                    booking =>
                        String(
                            booking?.boardingStatus ||
                            ""
                        ).toUpperCase() !==
                        "REJECTED"
                )
            );
        } catch (error) {
            console.error(
                "Verified payment loading error:",
                error
            );
        }
    };

    // =========================================================
    // LOAD REJECTED PAYMENTS
    // =========================================================

    const loadRejectedPayments = async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        try {
            const response = await fetch(
                `${API_URL}/bookings`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load rejected payments."
                );
            }

            setRejectedPayments(
                (data.bookings || []).filter(
                    booking =>
                        String(
                            booking?.paymentStatus ||
                            ""
                        ).toUpperCase() ===
                            "REJECTED" ||
                        String(
                            booking?.boardingStatus ||
                            ""
                        ).toUpperCase() ===
                            "REJECTED"
                )
            );
        } catch (error) {
            console.error(
                "Rejected payment loading error:",
                error
            );
        }
    };

    // =========================================================
    // LOAD ALL PAYMENT LISTS
    // =========================================================

    const loadAllPaymentLists = async () => {
        setPaymentLoading(true);

        try {
            await Promise.all([
                loadPendingPayments(),
                loadVerifiedPayments(),
                loadRejectedPayments()
            ]);
        } finally {
            setPaymentLoading(false);
        }
    };

    // =========================================================
    // PAYMENT VERIFICATION REFRESH
    // =========================================================
    // Payment verification is loaded when the Admin opens the
    // Payment Verification view and when the existing manual
    // Refresh button is used. It no longer refreshes every 5
    // seconds, so the page does not visibly reload/update while
    // the Admin is reviewing a payment.
    // =========================================================


    // =========================================================
    // INITIAL STATISTICS
    // =========================================================

    useEffect(() => {

        if (!loading) {
            loadStatistics();
        }

    }, [loading]);

    // =========================================================
    // OPEN PAYMENT TAB FROM DASHBOARD
    // =========================================================

    const handlePaymentTab = (tab) => {
        setActiveView("payments");
        setMobileMenuOpen(false);
        setActivePaymentTab(tab);
        loadAllPaymentLists();
    };

    // =========================================================
    // CHANGE VIEW
    // =========================================================

    const handleViewChange = (view) => {

        setActiveView(view);
        setMobileMenuOpen(false);

        if (view === "payments") {

            setActivePaymentTab("pending");

            loadAllPaymentLists();
        }
    };

    // =========================================================
    // BACK TO DASHBOARD
    // =========================================================

    const handleBackToDashboard = () => {

        setActiveView("dashboard");
        setMobileMenuOpen(false);

        setActivePaymentTab("pending");

    };

    // =========================================================
        // OPEN LOGOUT CONFIRMATION
        // =========================================================

        const handleLogout = () => {

            setShowLogoutModal(true);

        };

        // =========================================================
        // CONFIRM LOGOUT
        // =========================================================

        const confirmLogout = () => {

            localStorage.removeItem(
                "adminToken"
            );

            localStorage.removeItem(
                "adminData"
            );

            setShowLogoutModal(false);

            navigate("/", {
                replace: true
            });

        };

    // =========================================================
    // OPEN CONFIRMATION MODAL
    // =========================================================

    const openConfirmModal = (
        payment,
        action
    ) => {

        setSelectedPayment(payment);

        setConfirmAction(action);

        setShowConfirmModal(true);
    };

    // =========================================================
    // CLOSE CONFIRMATION MODAL
    // =========================================================

    const closeConfirmModal = () => {

        if (actionLoading) {
            return;
        }

        setShowConfirmModal(false);

        setSelectedPayment(null);

        setConfirmAction(null);
    };

    // =========================================================
    // VERIFY PAYMENT
    // =========================================================

    const handleVerifyPayment = async (
        bookingId
    ) => {

        const token =
            localStorage.getItem("adminToken");

        if (!token) {
            return;
        }

        setActionLoading(bookingId);

        try {

            const response =
                await fetch(
                    `${API_URL}/bookings/${bookingId}/verify`,
                    {
                        method: "PUT",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to verify payment."
                );

            }

            /*
             * If this payment somehow exists in the
             * rejected UI cache, remove it.
             */
            setRejectedPayments(
                previous =>
                    previous.filter(
                        payment =>
                            payment._id !== bookingId
                    )
            );

            showNotification(
                "Payment verified successfully.",
                "success"
            );

            await loadAllPaymentLists();

            await loadStatistics();

        } catch (error) {

            console.error(
                "Verify payment error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to verify payment.",
                "error"
            );

        } finally {

            setActionLoading(null);

        }
    };

    // =========================================================
    // REJECT PAYMENT
    // =========================================================

    const handleRejectPayment = async (
        bookingId
    ) => {

        const token =
            localStorage.getItem("adminToken");

        if (!token) {
            return;
        }

        setActionLoading(bookingId);

        try {

            const response =
                await fetch(
                    `${API_URL}/bookings/${bookingId}/reject`,
                    {
                        method: "PUT",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to reject payment."
                );

            }

            await loadAllPaymentLists();

            showNotification(
                "Payment rejected successfully.",
                "success"
            );

            await loadStatistics();

            /*
             * Automatically switch to Rejected.
             */
            setActivePaymentTab(
                "rejected"
            );

        } catch (error) {

            console.error(
                "Reject payment error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to reject payment.",
                "error"
            );

        } finally {

            setActionLoading(null);

        }
    };

    // =========================================================
    // CONFIRM ACTION
    // =========================================================

    const executeConfirmAction =
        async () => {

            if (!selectedPayment) {
                return;
            }

            const bookingId =
                selectedPayment._id;

            const action =
                confirmAction;

            setShowConfirmModal(false);

            setSelectedPayment(null);

            setConfirmAction(null);

            if (action === "verify") {

                await handleVerifyPayment(
                    bookingId
                );

            } else if (
                action === "reject"
            ) {

                await handleRejectPayment(
                    bookingId
                );

            }
        };

    // =========================================================
    // LOAD STAFF
    // =========================================================

    const loadStaff = async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setStaffLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/admin/staff`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load staff accounts."
                );
            }

            setStaff(data.staff || []);
        } catch (error) {
            console.error("Load staff error:", error);
            showNotification(
                error.message || "Unable to load staff accounts.",
                "error"
            );
        } finally {
            setStaffLoading(false);
        }
    };

    // =========================================================
    // OPEN ADD STAFF
    // =========================================================

    const openAddStaff = () => {
        setStaffForm({
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
        });
        setShowStaffModal(true);
    };

    // =========================================================
    // CLOSE STAFF MODAL
    // =========================================================

    const closeStaffModal = () => {
        if (staffActionLoading) return;
        setShowStaffModal(false);
        setStaffForm({
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
        });
    };

    // =========================================================
    // STAFF FORM CHANGE
    // =========================================================

    const handleStaffFormChange = (e) => {
        const { name, value } = e.target;
        setStaffForm(previous => ({
            ...previous,
            [name]: value
        }));
    };

    // =========================================================
    // CREATE STAFF
    // =========================================================

    const handleCreateStaff = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("adminToken");
        if (!token) return;

        if (
            !staffForm.name.trim() ||
            !staffForm.email.trim() ||
            !staffForm.password ||
            !staffForm.confirmPassword
        ) {
            showNotification(
                "Please complete all required fields.",
                "error"
            );
            return;
        }

        if (staffForm.password !== staffForm.confirmPassword) {
            showNotification("Passwords do not match.", "error");
            return;
        }

        if (staffForm.password.length < 8) {
            showNotification(
                "Password must be at least 8 characters.",
                "error"
            );
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(staffForm.email.trim())) {
            showNotification(
                "Please enter a valid staff email address.",
                "error"
            );
            return;
        }

        setStaffActionLoading("create");

        try {
            const response = await fetch(
                `${API_URL}/admin/staff`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json"
                    },
                    body: JSON.stringify({
                        name: staffForm.name.trim(),
                        email: staffForm.email.trim(),
                        password: staffForm.password,
                        confirmPassword: staffForm.confirmPassword
                    })
                }
            );

            const contentType = response.headers.get("content-type") || "";
            const data = contentType.includes("application/json")
                ? await response.json()
                : { message: await response.text() };

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    `Unable to create staff account. Server returned ${response.status}.`
                );
            }

            showNotification(
                "Staff account created successfully.",
                "success"
            );

            setShowStaffModal(false);
            setStaffForm({
                name: "",
                email: "",
                password: "",
                confirmPassword: ""
            });

            await loadStaff();
        } catch (error) {
            console.error("Create staff error:", error);
            showNotification(
                error.message || "Unable to create staff account.",
                "error"
            );
        } finally {
            setStaffActionLoading(null);
        }
    };

    // =========================================================
    // ACTIVATE STAFF
    // =========================================================

    const handleActivateStaff = async (staffId) => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setStaffActionLoading(staffId);

        try {
            const response = await fetch(
                `${API_URL}/admin/staff/${staffId}/activate`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to activate staff account."
                );
            }

            showNotification(
                "Staff account activated successfully.",
                "success"
            );

            await loadStaff();
        } catch (error) {
            console.error("Activate staff error:", error);
            showNotification(
                error.message || "Unable to activate staff account.",
                "error"
            );
        } finally {
            setStaffActionLoading(null);
        }
    };

    // =========================================================
    // DEACTIVATE STAFF
    // =========================================================

    const handleDeactivateStaff = async (staffId) => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setStaffActionLoading(staffId);

        try {
            const response = await fetch(
                `${API_URL}/admin/staff/${staffId}/deactivate`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to deactivate staff account."
                );
            }

            showNotification(
                "Staff account deactivated successfully.",
                "success"
            );

            await loadStaff();
        } catch (error) {
            console.error("Deactivate staff error:", error);
            showNotification(
                error.message || "Unable to deactivate staff account.",
                "error"
            );
        } finally {
            setStaffActionLoading(null);
        }
    };

    // =========================================================
    // DELETE STAFF
    // =========================================================

    const handleDeleteStaff = async (staffId) => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete this staff account?"
        );

        if (!confirmed) return;

        setStaffActionLoading(staffId);

        try {
            const response = await fetch(
                `${API_URL}/admin/staff/${staffId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to delete staff account."
                );
            }

            showNotification(
                "Staff account deleted successfully.",
                "success"
            );

            await loadStaff();
        } catch (error) {
            console.error("Delete staff error:", error);
            showNotification(
                error.message || "Unable to delete staff account.",
                "error"
            );
        } finally {
            setStaffActionLoading(null);
        }
    };

    // =========================================================
    // LOAD STAFF WHEN STAFF VIEW OPENS
    // =========================================================

    useEffect(() => {
        if (activeView === "staff") {
            loadStaff();
        }
    }, [activeView]);

    // =========================================================
    // STAFF FILTERING
    // =========================================================

    const filteredStaff = staff.filter((item) => {
        const search = staffSearch.trim().toLowerCase();
        const matchesSearch =
            !search ||
            String(item?.name || "").toLowerCase().includes(search) ||
            String(item?.email || "").toLowerCase().includes(search);

        const matchesStatus =
            staffStatusFilter === "all" ||
            (staffStatusFilter === "active" && item?.isActive) ||
            (staffStatusFilter === "inactive" && !item?.isActive);

        return matchesSearch && matchesStatus;
    });

    // =========================================================
    // DASHBOARD OPERATIONAL METRICS
    // =========================================================

    const todayBookings = ferryBookings.length;

    const todayPassengers = ferryBookings.reduce((total, booking) => {
        return total + (Number(
            booking?.passengers ||
            booking?.numberOfPassengers ||
            booking?.passengerCount ||
            1
        ) || 1);
    }, 0);

    const verifiedRevenueToday = ferryBookings.reduce((total, booking) => {
        const paymentStatus = String(booking?.paymentStatus || "").toUpperCase();
        if (paymentStatus !== "VERIFIED") return total;

        return total + (Number(
            booking?.totalPaid ??
            booking?.totalAmount ??
            booking?.amountPaid ??
            0
        ) || 0);
    }, 0);

    const totalPassengerCapacity = ferryCapacities.reduce((total, ferry) => {
        return total + (Number(ferry?.passengerCapacity) || 100);
    }, 0);

    const occupiedPassengerCapacity = ferryCapacities.reduce((total, ferry) => {
        return total + (Number(ferry?.passengers) || 0);
    }, 0);

    const occupancyPercent = totalPassengerCapacity > 0
        ? Math.min(100, Math.round((occupiedPassengerCapacity / totalPassengerCapacity) * 100))
        : 0;

    const nextDepartures = [...ferryCapacities]
        .sort((a, b) => String(a?.departureTime || a?.time || "").localeCompare(String(b?.departureTime || b?.time || "")))
        .slice(0, 4);

    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (date) => {

        if (!date) {
            return "—";
        }

        try {

            return new Date(
                date
            ).toLocaleDateString(
                "en-US",
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            );

        } catch {

            return date;

        }
    };

    // =========================================================
    // FORMAT AMOUNT
    // =========================================================

    const formatAmount = (amount) => {

        if (
            amount === null ||
            amount === undefined ||
            amount === ""
        ) {
            return "₱0.00";
        }

        return `₱${Number(
            amount
        ).toLocaleString(
            "en-PH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )}`;
    };

    // =========================================================
    // PAYMENT PROOF URL
    // =========================================================

    const getPaymentProofUrl = (
        payment
    ) => {

        const proof =
            payment?.paymentProof;

        if (!proof) {
            return null;
        }

        /*
         * Some older booking records may store the
         * payment proof directly as a string.
         */
        if (typeof proof === "string") {

            const proofValue =
                proof.trim();

            if (!proofValue) {
                return null;
            }

            if (
                proofValue.startsWith("http://") ||
                proofValue.startsWith("https://") ||
                proofValue.startsWith("data:") ||
                proofValue.startsWith("blob:")
            ) {
                return proofValue;
            }

            return `${API_ORIGIN}/${proofValue.replace(/^\/+/, "")}`;
        }

        /*
         * Current Booking schema stores paymentProof
         * as an object. Prefer the saved URL, but also
         * support older records that only have fileName.
         */
        const storedUrl =
            proof.url ||
            proof.image ||
            proof.path ||
            "";

        if (storedUrl) {

            const proofValue =
                String(storedUrl).trim();

            if (
                proofValue.startsWith("http://") ||
                proofValue.startsWith("https://") ||
                proofValue.startsWith("data:") ||
                proofValue.startsWith("blob:")
            ) {
                return proofValue;
            }

            return `${API_ORIGIN}/${proofValue.replace(/^\/+/, "")}`;
        }

        /*
         * Fallback for records that contain only the
         * uploaded filename.
         */
        if (proof.fileName) {

            return `${API_ORIGIN}/uploads/payment-proofs/${encodeURIComponent(
                proof.fileName
            )}`;
        }

        return null;
    };

    // =========================================================
    // PAYMENT PROOF FILE NAME
    // =========================================================

    const getPaymentProofName = (
        payment
    ) => {

        const proof =
            payment?.paymentProof;

        if (!proof) {
            return "";
        }

        if (typeof proof === "string") {
            return "";
        }

        return (
            proof.originalName ||
            proof.fileName ||
            ""
        );
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="dashboard-loading">

                <div className="loading-spinner"></div>

                <p>
                    Loading Admin Dashboard...
                </p>

            </div>
        );
    }

    // =========================================================
    // CURRENT PAYMENT LIST
    // =========================================================

    const displayedPayments =
        activePaymentTab === "pending"
            ? pendingPayments
            : activePaymentTab === "verified"
                ? verifiedPayments
                : rejectedPayments;

    // =========================================================
    // MAIN UI
    // =========================================================

    
   return(

   <main className="admin-dashboard">

        {showLogoutModal && (

    <div className="logout-modal-overlay">

        <div className="logout-modal">

            <div className="logout-modal-icon">
                !
            </div>

            <div className="logout-modal-content">

                <h2>
                    Confirm Logout
                </h2>

                <p>
                    Are you sure you want to log out
                    of the Administrator Dashboard?
                </p>

            </div>

            <div className="logout-modal-actions">

                <button
                    type="button"
                    className="logout-cancel-button"
                    onClick={() =>
                        setShowLogoutModal(false)
                    }
                >
                    Cancel
                </button>

                <button
                    type="button"
                    className="logout-confirm-button"
                    onClick={confirmLogout}
                >
                    Log Out
                </button>

            </div>

        </div>

    </div>

)}
            {/* =====================================================
                MOBILE NAVIGATION
            ===================================================== */}

            <div className="mobile-admin-topbar">
                <button
                    type="button"
                    className={`mobile-menu-button ${mobileMenuOpen ? "open" : ""}`}
                    onClick={() => setMobileMenuOpen((open) => !open)}
                    aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={mobileMenuOpen}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className="mobile-admin-brand">
                    <strong>GuimarasGo</strong>
                    <span>ADMINISTRATOR</span>
                </div>

                <div className="mobile-admin-role">ADMIN</div>
            </div>

            {mobileMenuOpen && (
                <button
                    type="button"
                    className="mobile-sidebar-overlay"
                    aria-label="Close navigation menu"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* =====================================================
                SIDEBAR
            ===================================================== */}

            <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>

                <div className="brand-section">

                    <div className="sidebar-title">
                        GuimarasGo
                    </div>

                    <div className="admin-label">
                        ADMINISTRATOR
                    </div>

                </div>


                <nav className="sidebar-navigation">

                    <button
                        className={
                            `side-item ${
                                activeView ===
                                "dashboard"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() =>
                            handleViewChange(
                                "dashboard"
                            )
                        }
                    >
                        <span>
                            Dashboard
                        </span>
                    </button>


                    <button
                        className={
                            `side-item ${
                                activeView ===
                                "payments"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() =>
                            handleViewChange(
                                "payments"
                            )
                        }
                    >

                        <span>
                            Payment Verification
                        </span>

                        {statistics.pendingPayments >
                            0 && (

                            <span className="pending-badge">

                                {
                                    statistics.pendingPayments
                                }

                            </span>

                        )}

                    </button>


                    <button
                        className={
                            `side-item ${
                                activeView === "staff"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() => handleViewChange("staff")}
                    >
                        <span>Staff Management</span>
                    </button>
                </nav>


                <div className="sidebar-spacer"></div>


                <button
                    className="logout-button"
                    onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                    }}
                >
                    Logout
                </button>

            </aside>


            {/* =====================================================
                CONTENT
            ===================================================== */}

            <section className="dashboard-content">

                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="dashboard-header">

                    <div>

                        <h1>
                            Administrator Dashboard
                        </h1>

                        <p>
                            Welcome back,{" "}

                            <strong>
                                {admin?.fullName ||
                                    "Admin"}
                            </strong>
                        </p>

                    </div>


                    <div className="admin-badge">
                        ADMIN
                    </div>

                </header>


                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <div className="dashboard-main">


                    {/* =================================================
                        DASHBOARD VIEW
                    ================================================= */}

                    {activeView ===
                        "dashboard" && (

                        <div className="dashboard-page">

                            <div className="page-heading">

                                <div>

                                    <h2>
                                        Dashboard Overview
                                    </h2>

                                    <p>
                                        Here's what's
                                        happening with
                                        your GuimarasGo
                                        system.
                                    </p>

                                </div>

                            </div>


                            {/* =================================================
                                STATISTICS
                            ================================================= */}

                            <div className="cards">

                                <div className="stat-card">

                                    <div className="stat-icon orange">
                                        #
                                    </div>

                                    <div className="stat-content">

                                        <span>
                                            Total Bookings
                                        </span>

                                        <strong>
                                            {
                                                statistics.totalBookings
                                            }
                                        </strong>

                                        <small>
                                            Current records
                                        </small>

                                    </div>

                                </div>


                                <button
                                    type="button"
                                    className="stat-card stat-card-button"
                                    onClick={() =>
                                        handlePaymentTab("pending")
                                    }
                                >
                                    <div className="stat-icon yellow">
                                        ₱
                                    </div>

                                    <div className="stat-content">

                                        <span>
                                            Pending Payments
                                        </span>

                                        <strong>
                                            {
                                                statistics.pendingPayments
                                            }
                                        </strong>

                                        <small>
                                            Awaiting verification
                                        </small>

                                    </div>

                                </button>


                                <button
                                    type="button"
                                    className="stat-card stat-card-button"
                                    onClick={() =>
                                        handlePaymentTab("verified")
                                    }
                                >
                                    <div className="stat-icon green">
                                        ✓
                                    </div>

                                    <div className="stat-content">

                                        <span>
                                            Verified Payments
                                        </span>

                                        <strong>
                                            {
                                                statistics.verifiedPayments
                                            }
                                        </strong>

                                        <small>
                                            Verified transactions
                                        </small>

                                    </div>

                                </button>


                                <button
                                    type="button"
                                    className="stat-card stat-card-button"
                                    onClick={() =>
                                        handlePaymentTab("rejected")
                                    }
                                >
                                    <div className="stat-icon red">
                                        !
                                    </div>

                                    <div className="stat-content">

                                        <span>
                                            Rejected Payments
                                        </span>

                                        <strong>
                                            {
                                                statistics.rejectedPayments ||
                                                rejectedPayments.length
                                            }
                                        </strong>

                                        <small>
                                            Rejected submissions
                                        </small>

                                    </div>

                                </button>

                            </div>


                            {/* =================================================
                                OPERATIONS SNAPSHOT
                            ================================================= */}

                            <div className="admin-operations-grid">
                                <div className="admin-operation-card">
                                    <div className="admin-operation-icon teal">●</div>
                                    <div>
                                        <span>Today's Bookings</span>
                                        <strong>{todayBookings}</strong>
                                        <small>Active bookings on today's departures</small>
                                    </div>
                                </div>

                                <div className="admin-operation-card">
                                    <div className="admin-operation-icon orange">👤</div>
                                    <div>
                                        <span>Passengers Today</span>
                                        <strong>{todayPassengers}</strong>
                                        <small>Passenger seats currently reserved</small>
                                    </div>
                                </div>

                                <div className="admin-operation-card">
                                    <div className="admin-operation-icon green">₱</div>
                                    <div>
                                        <span>Verified Revenue</span>
                                        <strong>{formatAmount(verifiedRevenueToday)}</strong>
                                        <small>Based on verified today's bookings</small>
                                    </div>
                                </div>

                                <div className="admin-operation-card">
                                    <div className="admin-operation-icon purple">↗</div>
                                    <div>
                                        <span>Passenger Occupancy</span>
                                        <strong>{occupancyPercent}%</strong>
                                        <small>{occupiedPassengerCapacity} of {totalPassengerCapacity || 0} seats occupied</small>
                                    </div>
                                </div>
                            </div>


                            <div className="admin-departure-panel">
                                <div className="admin-departure-header">
                                    <div>
                                        <span className="eyebrow">TODAY'S OPERATIONS</span>
                                        <h3>Departure Board</h3>
                                        <p>Quick view of ferry schedules and remaining passenger capacity.</p>
                                    </div>
                                    <button type="button" className="refresh-button" onClick={() => { loadFerryCapacities(); loadFerryBookings(); }}>↻ Refresh</button>
                                </div>

                                <div className="admin-departure-list">
                                    {nextDepartures.length === 0 ? (
                                        <div className="admin-departure-empty">No ferry schedule is available right now.</div>
                                    ) : (
                                        nextDepartures.map((ferry) => {
                                            const used = Number(ferry?.passengers) || 0;
                                            const limit = Number(ferry?.passengerCapacity) || 100;
                                            const remaining = Math.max(0, limit - used);
                                            const closed = Boolean(ferry?.manualClosed) || remaining <= 0;
                                            return (
                                                <div className="admin-departure-row" key={`departure-${ferry?.id || ferry?.vesselName}`}>
                                                    <div className="admin-departure-time">{ferry?.departureTime || ferry?.time || "—"}</div>
                                                    <div className="admin-departure-vessel">
                                                        <strong>{ferry?.vesselName || "Unknown Ferry"}</strong>
                                                        <span>{used}/{limit} passengers occupied</span>
                                                    </div>
                                                    <div className={`admin-departure-status ${closed ? "closed" : "open"}`}>
                                                        {closed ? "Closed" : `${remaining} seats left`}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>


                            {/* =================================================
                                BOOKING REFERENCE SEARCH
                            ================================================= */}

                            <div className="admin-booking-search-card">
                                <div className="admin-booking-search-header">
                                    <div>
                                        <span className="eyebrow">BOOKING LOOKUP</span>
                                        <h3>Search Booking Reference</h3>
                                        <p>Find the complete booking information for any passenger.</p>
                                    </div>
                                </div>

                                <form className="admin-booking-search-form" onSubmit={handleBookingSearch}>
                                    <input
                                        type="text"
                                        value={bookingSearchReference}
                                        onChange={(event) => {
                                            setBookingSearchReference(event.target.value);
                                            if (bookingSearchError) setBookingSearchError("");
                                        }}
                                        placeholder="Enter booking reference number..."
                                        aria-label="Booking reference number"
                                    />
                                    <button type="submit" disabled={bookingSearchLoading}>
                                        {bookingSearchLoading ? "Searching..." : "Search"}
                                    </button>
                                </form>

                                {bookingSearchError && (
                                    <div className="admin-booking-search-error">
                                        {bookingSearchError}
                                    </div>
                                )}

                                {bookingSearchResult && (
                                    <div className="admin-booking-result">
                                        <div className="admin-booking-result-heading">
                                            <div>
                                                <span className="eyebrow">BOOKING INFORMATION</span>
                                                <h4>{bookingSearchResult.bookingReference || "—"}</h4>
                                            </div>
                                            <div className={`admin-booking-status-pill ${String(bookingSearchResult.status || "").toLowerCase().includes("confirm") ? "confirmed" : ""}`}>
                                                {bookingSearchResult.status || "—"}
                                            </div>
                                        </div>

                                        <div className="admin-booking-info-grid">
                                            <div><span>Passenger Name</span><strong>{bookingSearchResult.passengerName || "—"}</strong></div>
                                            <div><span>Passenger Age</span><strong>{bookingSearchResult.passengerAge ?? "—"}</strong></div>
                                            <div><span>Passenger Gender</span><strong>{bookingSearchResult.passengerGender || "—"}</strong></div>
                                            <div><span>Passengers</span><strong>{bookingSearchResult.passengers ?? "—"}</strong></div>
                                            <div><span>Origin</span><strong>{bookingSearchResult.origin || "—"}</strong></div>
                                            <div><span>Destination</span><strong>{bookingSearchResult.destination || "—"}</strong></div>
                                            <div><span>Ferry / Vessel</span><strong>{getBookingVesselName(bookingSearchResult)}</strong></div>
                                            <div><span>Departure Time</span><strong>{bookingSearchResult.departureTime || bookingSearchResult.time || "—"}</strong></div>
                                            <div><span>Date</span><strong>{bookingSearchResult.date || "—"}</strong></div>
                                            <div><span>Vehicle</span><strong>{bookingSearchResult.vehicleType || "—"}</strong></div>
                                            <div><span>Plate Number</span><strong>{bookingSearchResult.plateNumber || "—"}</strong></div>
                                            <div><span>Payment Method</span><strong>{bookingSearchResult.paymentMethod || "—"}</strong></div>
                                            <div><span>Payment Status</span><strong>{bookingSearchResult.paymentStatus || "—"}</strong></div>
                                            <div><span>Required Amount</span><strong>₱{Number(bookingSearchResult.requiredAmount || 0).toLocaleString()}</strong></div>
                                            <div><span>Total Paid</span><strong>{bookingSearchResult.totalPaid == null ? "—" : `₱${Number(bookingSearchResult.totalPaid).toLocaleString()}`}</strong></div>
                                            <div><span>Boarding Status</span><strong>{bookingSearchResult.boardingStatus || "—"}</strong></div>
                                        </div>

                                        {bookingSearchResult.paymentProof?.url && (
                                            <a className="admin-booking-proof-link" href={bookingSearchResult.paymentProof.url} target="_blank" rel="noreferrer">
                                                View Payment Proof
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>



                            {/* =================================================
                                LIVE FERRY CAPACITY
                            ================================================= */}

                            <div className="admin-capacity-card">
                                <div className="admin-capacity-header">
                                    <div>
                                        <span className="eyebrow">
                                            LIVE MONITORING
                                        </span>
                                        <h3>Ferry Capacity</h3>
                                        <p>
                                            Monitor passenger and motorcycle capacity for each ferry.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="refresh-button"
                                        onClick={loadFerryCapacities}
                                        disabled={capacityLoading}
                                    >
                                        {capacityLoading ? "Refreshing..." : "↻ Refresh"}
                                    </button>
                                </div>

                                {capacityError && (
                                    <div className="admin-capacity-error">
                                        {capacityError}
                                    </div>
                                )}

                                {!capacityError && ferryCapacities.length === 0 && capacityLoading && (
                                    <div className="admin-capacity-empty">
                                        Loading ferry capacity...
                                    </div>
                                )}

                                {!capacityError && ferryCapacities.length > 0 && (
                                    <div className="admin-capacity-grid">
                                        {ferryCapacities.map((ferry) => {
                                            const passengers = Number(ferry.passengers) || 0;
                                            const passengerLimit = Number(ferry.passengerCapacity) || 100;
                                            const passengerRemaining = Math.max(0, passengerLimit - passengers);
                                            const motorcycles = Number(ferry.vehicles) || 0;
                                            const motorcycleLimit = Number(ferry.vehicleCapacity) || 10;
                                            const motorcycleRemaining = Math.max(0, motorcycleLimit - motorcycles);
                                            const passengerFull = passengerRemaining <= 0;
                                            const motorcycleFull = motorcycleRemaining <= 0;
                                            const manualClosed = Boolean(ferry.manualClosed);
                                            const bookingClosed = manualClosed || passengerFull;
                                            const ferryActionKey = `${ferry.id || ferry.vesselName}-${getToday()}`;
                                            const ferryActionBusy = ferryActionLoading === ferryActionKey;
                                            const bookingsForFerry = getFerryBookings(ferry);

                                            return (
                                                <div
                                                    className={`admin-ferry-capacity-card ${bookingClosed ? "capacity-closed" : ""}`}
                                                    key={ferry.id || ferry.vesselName}
                                                >
                                                    <div className="admin-ferry-capacity-top">
                                                        <div>
                                                            <strong>{ferry.vesselName || "Unknown Ferry"}</strong>
                                                            <span>{ferry.departureTime || ferry.time || ""}</span>
                                                        </div>

                                                        <span className={`admin-capacity-status ${bookingClosed ? "closed" : "open"}`}>
                                                            {bookingClosed ? "BOOKING CLOSED" : "BOOKING OPEN"}
                                                        </span>
                                                    </div>

                                                    <div className="admin-capacity-metrics">
                                                        <div className="admin-capacity-metric">
                                                            <span>👤 Passengers</span>
                                                            <strong>{passengers}/{passengerLimit}</strong>
                                                            <small>
                                                                {passengerRemaining} passenger {passengerRemaining === 1 ? "slot" : "slots"} left
                                                            </small>
                                                        </div>

                                                        <div className="admin-capacity-metric">
                                                            <span>🏍️ Motorcycles</span>
                                                            <strong>{motorcycles}/{motorcycleLimit}</strong>
                                                            <small>
                                                                {motorcycleRemaining} motorcycle {motorcycleRemaining === 1 ? "slot" : "slots"} left
                                                            </small>
                                                        </div>
                                                    </div>

                                                    {/* =================================================
                                                        PASSENGER BOOKINGS
                                                    ================================================= */}
                                                    <div className="admin-ferry-bookings-section">
                                                        <div className="admin-ferry-bookings-heading">
                                                            <span>Bookings Today</span>
                                                            <strong>{bookingsForFerry.length}</strong>
                                                        </div>

                                                        {bookingsForFerry.length === 0 ? (
                                                            <div className="admin-ferry-bookings-empty">
                                                                No bookings for this ferry yet.
                                                            </div>
                                                        ) : (
                                                            <div className="admin-ferry-bookings-list">
                                                                {bookingsForFerry.map((booking) => {
                                                                    const passengerCount =
                                                                        Number(
                                                                            booking?.passengers ||
                                                                            booking?.numberOfPassengers ||
                                                                            booking?.passengerCount ||
                                                                            1
                                                                        ) || 1;

                                                                    const vehicle =
                                                                        booking?.vehicleType ||
                                                                        booking?.vehicle ||
                                                                        "Passenger only";

                                                                    const bookingStatus =
                                                                        String(
                                                                            booking?.paymentStatus ||
                                                                            booking?.status ||
                                                                            "PENDING"
                                                                        ).toUpperCase();

                                                                    return (
                                                                        <div
                                                                            className="admin-ferry-booking-row"
                                                                            key={booking?._id || booking?.bookingReference}
                                                                        >
                                                                            <div className="admin-ferry-booking-main">
                                                                                <strong>
                                                                                    {booking?.bookingReference ||
                                                                                        booking?.referenceNumber ||
                                                                                        booking?._id ||
                                                                                        "—"}
                                                                                </strong>
                                                                                <span>
                                                                                    {booking?.passengerName ||
                                                                                        booking?.fullName ||
                                                                                        "Passenger"}
                                                                                </span>
                                                                            </div>

                                                                            <div className="admin-ferry-booking-meta">
                                                                                <span>
                                                                                    {passengerCount}{" "}
                                                                                    {passengerCount === 1
                                                                                        ? "passenger"
                                                                                        : "passengers"}
                                                                                </span>
                                                                                <span>
                                                                                    {vehicle}
                                                                                </span>
                                                                                <span
                                                                                    className={`admin-ferry-booking-status ${
                                                                                        bookingStatus === "VERIFIED" ||
                                                                                        bookingStatus === "CONFIRMED"
                                                                                            ? "verified"
                                                                                            : bookingStatus === "PENDING VERIFICATION"
                                                                                                ? "pending"
                                                                                                : "other"
                                                                                    }`}
                                                                                >
                                                                                    {bookingStatus}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {bookingClosed && (
                                                         <div className="admin-capacity-closed-message">
                                                             {manualClosed
                                                                 ? "Online booking manually closed by Admin."
                                                                 : "Passenger capacity reached."}
                                                         </div>
                                                     )}

                                                     {!bookingClosed && motorcycleFull && (
                                                         <div className="admin-capacity-closed-message">
                                                             Motorcycle capacity reached. Passenger-only booking remains available.
                                                         </div>
                                                     )}

                                                    <button
                                                        type="button"
                                                        className={`admin-ferry-toggle-button ${manualClosed ? "reopen" : "close"}`}
                                                        onClick={() => handleFerryBookingToggle(ferry)}
                                                        disabled={ferryActionBusy}
                                                    >
                                                        {ferryActionBusy
                                                            ? "Updating..."
                                                            : manualClosed
                                                                ? "↻ Reopen Online Booking"
                                                                : "✕ Close Online Booking"}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>


                            {/* =================================================
                                PAYMENT SHORTCUT
                            ================================================= */}

                            <div className="welcome-card">

                                <div className="welcome-left">

                                    <div className="section-icon">
                                        ₱
                                    </div>

                                    <div>

                                        <h3>
                                            Payment Verification
                                        </h3>

                                        <p>
                                            Review customer
                                            payment receipts
                                            and verify or
                                            reject pending
                                            bookings.
                                        </p>

                                    </div>

                                </div>


                                <button
                                    className="primary-button"
                                    onClick={() =>
                                        handleViewChange(
                                            "payments"
                                        )
                                    }
                                >
                                    View Payments
                                </button>

                            </div>


                            {/* =================================================
                                ADMIN ACCOUNT
                            ================================================= */}

                            <div className="system-card">

                                <div className="system-card-heading">

                                    <div>

                                        <span className="eyebrow">
                                            ACCOUNT
                                        </span>

                                        <h3>
                                            Administrator Account
                                        </h3>

                                    </div>

                                    <div className="account-status">
                                        ACTIVE
                                    </div>

                                </div>


                                <div className="account-row">

                                    <span>
                                        Name
                                    </span>

                                    <strong>
                                        {
                                            admin?.fullName ||
                                            "Admin"
                                        }
                                    </strong>

                                </div>


                                <div className="account-row">

                                    <span>
                                        Email
                                    </span>

                                    <strong>
                                        {
                                            admin?.email ||
                                            "—"
                                        }
                                    </strong>

                                </div>


                                <div className="account-row">

                                    <span>
                                        Role
                                    </span>

                                    <strong>
                                        {
                                            admin?.role ||
                                            "ADMIN"
                                        }
                                    </strong>

                                </div>

                            </div>

                        </div>

                    )}


                    {/* =================================================
                        PAYMENT VERIFICATION VIEW
                    ================================================= */}

                    {activeView ===
                        "payments" && (

                        <div className="payments-page">

                            {/* =================================================
                                PAGE HEADER
                            ================================================= */}

                            <div className="payments-header">

                                <div>

                                    <span className="eyebrow">
                                        ADMINISTRATION
                                    </span>

                                    <h2>
                                        Payment Verification
                                    </h2>

                                    <p>
                                        Review and process
                                        customer payment
                                        submissions.
                                    </p>

                                </div>


                                <div className="payment-summary">

                                    <div className="summary-number">
                                        {
                                            activePaymentTab ===
                                            "pending"
                                                ? pendingPayments.length
                                                : activePaymentTab === "verified"
                                                    ? verifiedPayments.length
                                                    : rejectedPayments.length
                                        }
                                    </div>

                                    <div className="summary-label">
                                        {
                                            activePaymentTab ===
                                            "pending"
                                                ? "Pending"
                                                : activePaymentTab === "verified"
                                                    ? "Verified"
                                                    : "Rejected"
                                        }
                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                TOOLBAR
                            ================================================= */}

                            <div className="payment-toolbar">
                                
                                <button
                                    type="button"
                                    className="refresh-button"
                                    onClick={
                                        loadAllPaymentLists
                                    }
                                    disabled={
                                        paymentLoading
                                    }
                                >
                                    {paymentLoading
                                        ? "Refreshing..."
                                        : "↻ Refresh"}
                                </button>

                            </div>


                            {/* =================================================
                                PAYMENT TABS
                            ================================================= */}

                            <div className="payment-tabs">

                                <button
                                    type="button"
                                    className={
                                        `payment-tab ${
                                            activePaymentTab ===
                                            "pending"
                                                ? "active"
                                                : ""
                                        }`
                                    }
                                    onClick={() =>
                                        setActivePaymentTab(
                                            "pending"
                                        )
                                    }
                                >

                                    <span>
                                        Pending
                                    </span>

                                    <span className="tab-count pending-count">
                                        {
                                            pendingPayments.length
                                        }
                                    </span>

                                </button>


                                <button
                                    type="button"
                                    className={
                                        `payment-tab ${
                                            activePaymentTab ===
                                            "verified"
                                                ? "active verified-active"
                                                : ""
                                        }`
                                    }
                                    onClick={() =>
                                        setActivePaymentTab(
                                            "verified"
                                        )
                                    }
                                >
                                    <span>
                                        Verified
                                    </span>
                                    <span className="tab-count verified-count">
                                        {verifiedPayments.length}
                                    </span>
                                </button>


                                <button
                                    type="button"
                                    className={
                                        `payment-tab ${
                                            activePaymentTab ===
                                            "rejected"
                                                ? "active rejected-active"
                                                : ""
                                        }`
                                    }
                                    onClick={() =>
                                        setActivePaymentTab(
                                            "rejected"
                                        )
                                    }
                                >

                                    <span>
                                        Rejected
                                    </span>

                                    <span className="tab-count rejected-count">
                                        {
                                            rejectedPayments.length
                                        }
                                    </span>

                                </button>

                            </div>


                            {/* =================================================
                                LOADING
                            ================================================= */}

                            {paymentLoading && (

                                <div className="payment-loading">

                                    <div className="loading-spinner"></div>

                                    <p>
                                        Loading payment
                                        submissions...
                                    </p>

                                </div>

                            )}


                            {/* =================================================
                                EMPTY PENDING
                            ================================================= */}

                            {!paymentLoading &&
                                activePaymentTab ===
                                    "pending" &&
                                pendingPayments.length ===
                                    0 && (

                                <div className="empty-payment-card">

                                    <div className="empty-icon">
                                        ✓
                                    </div>

                                    <h3>
                                        No Pending Payments
                                    </h3>

                                    <p>
                                        There are currently
                                        no payment submissions
                                        waiting for verification.
                                    </p>

                                    <button
                                        className="secondary-button"
                                        onClick={
                                            loadAllPaymentLists
                                        }
                                    >
                                        ↻ Refresh
                                    </button>

                                </div>

                            )}


                            {/* =================================================
                                EMPTY VERIFIED
                            ================================================= */}

                            {!paymentLoading &&
                                activePaymentTab ===
                                    "verified" &&
                                verifiedPayments.length ===
                                    0 && (
                                <div className="empty-payment-card verified-empty">
                                    <div className="empty-icon verified-empty-icon">
                                        ✓
                                    </div>
                                    <h3>
                                        No Verified Payments
                                    </h3>
                                    <p>
                                        Payments that you verify will appear here.
                                    </p>
                                    <button
                                        className="secondary-button"
                                        onClick={loadAllPaymentLists}
                                    >
                                        ↻ Refresh
                                    </button>
                                </div>
                            )}


                            {/* =================================================
                                EMPTY REJECTED
                            ================================================= */}

                            {!paymentLoading &&
                                activePaymentTab ===
                                    "rejected" &&
                                rejectedPayments.length ===
                                    0 && (

                                <div className="empty-payment-card rejected-empty">

                                    <div className="empty-icon rejected-empty-icon">
                                        !
                                    </div>

                                    <h3>
                                        No Rejected Payments
                                    </h3>

                                    <p>
                                        Payments that you
                                        reject will appear
                                        here.
                                    </p>

                                    <button
                                        className="secondary-button"
                                        onClick={() =>
                                            setActivePaymentTab(
                                                "pending"
                                            )
                                        }
                                    >
                                        View Pending Payments
                                    </button>

                                </div>

                            )}


                            {/* =================================================
                                PAYMENT LIST
                            ================================================= */}

                            {!paymentLoading &&
                                displayedPayments.length >
                                    0 && (

                                <div className="payment-list">

                                    {displayedPayments.map(
                                        (payment) => {

                                            const isRejected =
                                                activePaymentTab ===
                                                "rejected";

                                            const isVerified =
                                                activePaymentTab ===
                                                "verified";

                                            const proofUrl =
                                                getPaymentProofUrl(
                                                    payment
                                                );

                                            const proofName =
                                                getPaymentProofName(
                                                    payment
                                                );

                                            return (

                                                <div
                                                    className={
                                                        `payment-card ${
                                                            isRejected
                                                                ? "rejected-card"
                                                                : ""
                                                        }`
                                                    }
                                                    key={
                                                        payment._id
                                                    }
                                                >

                                                    {/* =========================================
                                                        CARD HEADER
                                                    ========================================= */}

                                                    <div className="payment-card-header">

                                                        <div>

                                                            <span className="booking-label">
                                                                BOOKING REFERENCE
                                                            </span>

                                                            <h3>
                                                                {
                                                                    payment.bookingReference ||
                                                                    payment.referenceNumber ||
                                                                    payment._id
                                                                }
                                                            </h3>

                                                        </div>


                                                        <span
                                                            className={
                                                                `status-badge ${
                                                                    isRejected
                                                                        ? "rejected-status"
                                                                        : isVerified
                                                                            ? "verified-status"
                                                                            : "pending-status"
                                                                }`
                                                            }
                                                        >
                                                            {isRejected
                                                                ? "REJECTED"
                                                                : isVerified
                                                                    ? "VERIFIED"
                                                                    : "PENDING VERIFICATION"}
                                                        </span>

                                                    </div>


                                                    {/* =========================================
                                                        DETAILS
                                                    ========================================= */}

                                                    <div className="payment-details">

                                                        <div className="payment-detail">

                                                            <span>
                                                                Passenger
                                                            </span>

                                                            <strong>
                                                                {
                                                                    payment.passengerName ||
                                                                    payment.fullName ||
                                                                    "—"
                                                                }
                                                            </strong>

                                                        </div>


                                                        <div className="payment-detail">

                                                            <span>
                                                                Route
                                                            </span>

                                                            <strong>

                                                                {payment.origin &&
                                                                payment.destination
                                                                    ? `${payment.origin} → ${payment.destination}`
                                                                    : payment.route ||
                                                                      "Iloilo → Guimaras"}

                                                            </strong>

                                                        </div>


                                                        <div className="payment-detail">

                                                            <span>
                                                                Ferry / Vessel
                                                            </span>

                                                            <strong>
                                                                {getBookingVesselName(payment)}
                                                            </strong>

                                                        </div>


                                                        <div className="payment-detail">

                                                            <span>
                                                                Date
                                                            </span>

                                                            <strong>
                                                                {
                                                                    formatDate(
                                                                        payment.travelDate ||
                                                                        payment.date
                                                                    )
                                                                }
                                                            </strong>

                                                        </div>


                                                        <div className="payment-detail">

                                                            <span>
                                                                Time
                                                            </span>

                                                            <strong>
                                                                {
                                                                    payment.travelTime ||
                                                                    payment.time ||
                                                                    "—"
                                                                }
                                                            </strong>

                                                        </div>


                                                        <div className="payment-detail">

                                                            <span>
                                                                Required Amount
                                                            </span>

                                                            <strong className="amount-text">
                                                                {
                                                                    formatAmount(
                                                                        payment.requiredAmount
                                                                    )
                                                                }
                                                            </strong>

                                                        </div>


                                                        <div className="payment-detail">

                                                            <span>
                                                                Payment Method
                                                            </span>

                                                            <strong>
                                                                {
                                                                    payment.paymentMethod ||
                                                                    "Maya / QRPh"
                                                                }
                                                            </strong>

                                                        </div>

                                                    </div>


                                                    {/* =========================================
                                                        PAYMENT PROOF
                                                    ========================================= */}

                                                    <div className="payment-proof-section">

                                                        <div className="proof-heading">

                                                            <div>

                                                                <span className="eyebrow">
                                                                    RECEIPT
                                                                </span>

                                                                <h4>
                                                                    Payment Proof
                                                                </h4>

                                                            </div>

                                                            {proofName && (

                                                                <span className="proof-file-name">
                                                                    {proofName}
                                                                </span>

                                                            )}

                                                        </div>


                                                        {proofUrl ? (

                                                            <a
                                                                href={
                                                                    proofUrl
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="payment-proof"
                                                            >

                                                                <img
                                                                    src={
                                                                        proofUrl
                                                                    }
                                                                    alt="Payment Proof"
                                                                    loading="lazy"
                                                                    onError={(event) => {
                                                                        const fileName =
                                                                            payment?.paymentProof &&
                                                                            typeof payment.paymentProof !== "string"
                                                                                ? payment.paymentProof.fileName
                                                                                : "";

                                                                        if (
                                                                            fileName &&
                                                                            !event.currentTarget.dataset.fallback
                                                                        ) {
                                                                            event.currentTarget.dataset.fallback = "true";
                                                                            event.currentTarget.src =
                                                                                `${API_ORIGIN}/uploads/payment-proofs/${encodeURIComponent(fileName)}`;
                                                                            return;
                                                                        }

                                                                        event.currentTarget.style.display = "none";
                                                                    }}
                                                                />

                                                                <div className="proof-overlay">
                                                                    <span>
                                                                        View Receipt
                                                                    </span>
                                                                </div>

                                                            </a>

                                                        ) : (

                                                            <div className="no-proof">

                                                                <span className="no-proof-icon">
                                                                    !
                                                                </span>

                                                                <span>
                                                                    No payment
                                                                    proof uploaded.
                                                                </span>

                                                            </div>

                                                        )}

                                                    </div>


                                                    {/* =========================================
                                                        REJECTED MESSAGE
                                                    ========================================= */}

                                                    {isRejected && (

                                                        <div className="rejected-message">

                                                            <div className="rejected-message-icon">
                                                                !
                                                            </div>

                                                            <div>

                                                                <strong>
                                                                    Payment Rejected
                                                                </strong>

                                                                <p>
                                                                    This payment
                                                                    submission
                                                                    was rejected
                                                                    by the
                                                                    administrator.
                                                                    The booking
                                                                    has been
                                                                    cancelled.
                                                                </p>

                                                            </div>

                                                        </div>

                                                    )}


                                                    {/* =========================================
                                                        ACTIONS
                                                    ========================================= */}

                                                    {!isRejected &&
                                                        !isVerified && (

                                                        <div className="payment-actions">

                                                            <button
                                                                type="button"
                                                                className="reject-button"
                                                                disabled={
                                                                    actionLoading ===
                                                                    payment._id
                                                                }
                                                                onClick={() =>
                                                                    openConfirmModal(
                                                                        payment,
                                                                        "reject"
                                                                    )
                                                                }
                                                            >

                                                                {actionLoading ===
                                                                payment._id
                                                                    ? "Processing..."
                                                                    : "Reject Payment"}

                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="verify-button"
                                                                disabled={
                                                                    actionLoading ===
                                                                    payment._id
                                                                }
                                                                onClick={() =>
                                                                    openConfirmModal(
                                                                        payment,
                                                                        "verify"
                                                                    )
                                                                }
                                                            >

                                                                ✓ Verify Payment

                                                            </button>

                                                        </div>

                                                    )}

                                                </div>

                                            );

                                        }
                                    )}

                                </div>

                            )}

                        </div>

                    )}

                </div>


                {/* =================================================
                    STAFF MANAGEMENT VIEW
                ================================================= */}

                {activeView === "staff" && (
                    <div className="staff-page">

                        <div className="staff-header">
                            <div>
                                <span className="eyebrow">ADMINISTRATION</span>
                                <h2>Staff Management</h2>
                                <p>
                                    Manage staff accounts that can access the
                                    staff ticket scanner.
                                </p>
                            </div>

                            <div className="staff-header-actions">
                                <button
                                    type="button"
                                    className="refresh-button"
                                    onClick={loadStaff}
                                    disabled={staffLoading}
                                >
                                    {staffLoading ? "Refreshing..." : "↻ Refresh"}
                                </button>

                                <button
                                    type="button"
                                    className="staff-add-button"
                                    onClick={openAddStaff}
                                >
                                    + Add Staff
                                </button>
                            </div>
                        </div>

                        <div className="staff-summary-card">
                            <div>
                                <span>Total Staff</span>
                                <strong>{staff.length}</strong>
                            </div>
                            <div>
                                <span>Active</span>
                                <strong>
                                    {staff.filter(item => item.isActive).length}
                                </strong>
                            </div>
                            <div>
                                <span>Inactive</span>
                                <strong>
                                    {staff.filter(item => !item.isActive).length}
                                </strong>
                            </div>
                        </div>

                        <div className="staff-toolbar">
                            <div className="staff-search-wrap">
                                <span>⌕</span>
                                <input
                                    type="search"
                                    value={staffSearch}
                                    onChange={(event) => setStaffSearch(event.target.value)}
                                    placeholder="Search staff by name or email"
                                    aria-label="Search staff"
                                />
                            </div>
                            <select
                                className="staff-filter-select"
                                value={staffStatusFilter}
                                onChange={(event) => setStaffStatusFilter(event.target.value)}
                                aria-label="Filter staff status"
                            >
                                <option value="all">All Staff</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                            <span className="staff-result-count">{filteredStaff.length} shown</span>
                        </div>

                        {staffLoading ? (
                            <div className="staff-loading">
                                <div className="loading-spinner"></div>
                                <p>Loading staff accounts...</p>
                            </div>
                        ) : staff.length === 0 ? (
                            <div className="empty-staff-card">
                                <div className="empty-staff-icon">+</div>
                                <h3>No Staff Accounts</h3>
                                <p>
                                    Add a staff account to allow personnel to
                                    log in and scan ferry tickets.
                                </p>
                                <button
                                    type="button"
                                    className="staff-add-button"
                                    onClick={openAddStaff}
                                >
                                    + Add First Staff
                                </button>
                            </div>
                        ) : (
                            <div className="staff-table-card">
                                <div className="staff-table-wrap">
                                    <table className="staff-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Created</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStaff.map(item => {
                                                const id = item._id || item.id;
                                                const busy = staffActionLoading === id;

                                                return (
                                                    <tr key={id}>
                                                        <td>
                                                            <strong>{item.name || "—"}</strong>
                                                        </td>
                                                        <td>{item.email || "—"}</td>
                                                        <td>
                                                            <span className="staff-role">
                                                                {item.role || "staff"}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`staff-status ${
                                                                    item.isActive
                                                                        ? "active"
                                                                        : "inactive"
                                                                }`}
                                                            >
                                                                {item.isActive ? "ACTIVE" : "INACTIVE"}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {item.createdAt
                                                                ? formatDate(item.createdAt)
                                                                : "—"}
                                                        </td>
                                                        <td>
                                                            <div className="staff-actions">
                                                                {item.isActive ? (
                                                                    <button
                                                                        type="button"
                                                                        className="staff-action deactivate"
                                                                        disabled={busy}
                                                                        onClick={() => handleDeactivateStaff(id)}
                                                                    >
                                                                        {busy ? "..." : "Deactivate"}
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        className="staff-action activate"
                                                                        disabled={busy}
                                                                        onClick={() => handleActivateStaff(id)}
                                                                    >
                                                                        {busy ? "..." : "Activate"}
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    className="staff-action delete"
                                                                    disabled={busy}
                                                                    onClick={() => handleDeleteStaff(id)}
                                                                >
                                                                    {busy ? "..." : "Delete"}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="dashboard-footer">

                    <span>
                        © 2026 GuimarasGo
                    </span>

                    <span>
                        Administrator System
                    </span>

                </footer>

            </section>


            {/* =====================================================
                ADD STAFF MODAL
            ===================================================== */}

            {showStaffModal && (
                <div className="modal-overlay" onClick={closeStaffModal}>
                    <div
                        className="staff-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="staff-modal-header">
                            <div>
                                <span className="modal-eyebrow">STAFF ACCOUNT</span>
                                <h3>Add Staff</h3>
                                <p>
                                    Create an account for staff ticket verification.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="staff-modal-close"
                                onClick={closeStaffModal}
                                disabled={!!staffActionLoading}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreateStaff}>
                            <div className="staff-form-group">
                                <label htmlFor="staff-name">Full Name</label>
                                <input
                                    id="staff-name"
                                    name="name"
                                    type="text"
                                    value={staffForm.name}
                                    onChange={handleStaffFormChange}
                                    placeholder="Enter staff name"
                                    autoComplete="name"
                                    disabled={!!staffActionLoading}
                                />
                            </div>

                            <div className="staff-form-group">
                                <label htmlFor="staff-email">Email Address</label>
                                <input
                                    id="staff-email"
                                    name="email"
                                    type="email"
                                    value={staffForm.email}
                                    onChange={handleStaffFormChange}
                                    placeholder="Enter staff email"
                                    autoComplete="email"
                                    disabled={!!staffActionLoading}
                                />
                            </div>

                            <div className="staff-form-grid">
                                <div className="staff-form-group">
                                    <label htmlFor="staff-password">Password</label>
                                    <input
                                        id="staff-password"
                                        name="password"
                                        type="password"
                                        value={staffForm.password}
                                        onChange={handleStaffFormChange}
                                        placeholder="Minimum 8 characters"
                                        autoComplete="new-password"
                                        disabled={!!staffActionLoading}
                                    />
                                </div>

                                <div className="staff-form-group">
                                    <label htmlFor="staff-confirm-password">Confirm Password</label>
                                    <input
                                        id="staff-confirm-password"
                                        name="confirmPassword"
                                        type="password"
                                        value={staffForm.confirmPassword}
                                        onChange={handleStaffFormChange}
                                        placeholder="Repeat password"
                                        autoComplete="new-password"
                                        disabled={!!staffActionLoading}
                                    />
                                </div>
                            </div>

                            <div className="staff-modal-actions">
                                <button
                                    type="button"
                                    className="modal-cancel"
                                    onClick={closeStaffModal}
                                    disabled={!!staffActionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="modal-confirm success"
                                    disabled={!!staffActionLoading}
                                >
                                    {staffActionLoading === "create"
                                        ? "Creating..."
                                        : "Create Staff"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =====================================================
                NOTIFICATION
            ===================================================== */}

            {notification.show && (

                <div
                    className={
                        `notification ${
                            notification.type
                        }`
                    }
                >

                    <span className="notification-icon">

                        {notification.type ===
                        "success"
                            ? "✓"
                            : "!"}

                    </span>


                    <span>
                        {
                            notification.message
                        }
                    </span>


                    <button
                        type="button"
                        onClick={() =>
                            setNotification({
                                show: false,
                                type: "",
                                message: ""
                            })
                        }
                    >
                        ×
                    </button>

                </div>

            )}


            {/* =====================================================
                CONFIRMATION MODAL
            ===================================================== */}

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
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div
                            className={
                                `modal-icon ${
                                    confirmAction ===
                                    "reject"
                                        ? "modal-danger"
                                        : "modal-success"
                                }`
                            }
                        >

                            {confirmAction ===
                            "reject"
                                ? "!"
                                : "✓"}

                        </div>


                        <span className="modal-eyebrow">
                            CONFIRM ACTION
                        </span>


                        <h3>

                            {confirmAction ===
                            "reject"
                                ? "Reject Payment?"
                                : "Verify Payment?"}

                        </h3>


                        <div className="modal-booking">

                            <span>
                                Booking Reference
                            </span>

                            <strong>
                                {
                                    selectedPayment.bookingReference ||
                                    selectedPayment.referenceNumber ||
                                    selectedPayment._id
                                }
                            </strong>

                        </div>


                        <p>

                            {confirmAction ===
                            "reject"

                                ? "Are you sure you want to reject this payment? This will cancel the customer's booking."

                                : "Are you sure you want to verify this payment? This will confirm the customer's booking."}

                        </p>


                        <div className="confirm-modal-actions">

                            <button
                                type="button"
                                className="modal-cancel"
                                onClick={
                                    closeConfirmModal
                                }
                                disabled={
                                    actionLoading
                                }
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className={
                                    `modal-confirm ${
                                        confirmAction ===
                                        "reject"
                                            ? "danger"
                                            : "success"
                                    }`
                                }
                                onClick={
                                    executeConfirmAction
                                }
                                disabled={
                                    actionLoading
                                }
                            >

                                {confirmAction ===
                                "reject"
                                    ? "Reject Payment"
                                    : "Verify Payment"}

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =====================================================
                CSS
            ===================================================== */}

            <style>{`

                * {
                    box-sizing: border-box;
                }


                body {
                    margin: 0;
                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    background:
                        #f5f7fa;
                }


                button {
                    font-family: inherit;
                }


                /* =================================================
                   MAIN LAYOUT
                ================================================= */

                .admin-dashboard {
                    min-height: 100vh;

                    display: flex;

                    background:
                        #f5f7fa;

                    color:
                        #222;
                }


                /* =================================================
                   SIDEBAR
                ================================================= */

                .sidebar {
                    width: 220px;

                    min-height: 100vh;

                    display: flex;

                    flex-direction: column;

                    flex-shrink: 0;

                    padding:
                        27px 12px;

                    background:
                        #ffffff;

                    border-right:
                        1px solid #e5e5e5;
                }


                .brand-section {
                    padding:
                        0 11px;

                    margin-bottom:
                        34px;
                }


                .sidebar-title {
                    color:
                        #f28c28;

                    font-size:
                        21px;

                    font-weight:
                        900;

                    letter-spacing:
                        -0.5px;

                    margin-bottom:
                        4px;
                }


                .admin-label {
                    color:
                        #999;

                    font-size:
                        8px;

                    font-weight:
                        800;

                    letter-spacing:
                        1.5px;
                }


                .sidebar-navigation {
                    display:
                        flex;

                    flex-direction:
                        column;

                    gap:
                        6px;
                }


                .side-item {
                    width:
                        100%;

                    min-height:
                        43px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        8px;

                    padding:
                        0 13px;

                    border:
                        none;

                    border-radius:
                        9px;

                    background:
                        transparent;

                    color:
                        #555;

                    text-align:
                        left;

                    font-size:
                        12px;

                    cursor:
                        pointer;

                    transition:
                        all 0.2s ease;
                }


                .side-item:hover {
                    background:
                        #fafafa;
                }


                .side-item.active {
                    background:
                        #fff0df;

                    color:
                        #f28c28;

                    font-weight:
                        700;
                }


                .pending-badge {
                    min-width:
                        21px;

                    height:
                        21px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    padding:
                        0 6px;

                    border-radius:
                        50px;

                    background:
                        #f28c28;

                    color:
                        #ffffff;

                    font-size:
                        9px;

                    font-weight:
                        800;
                }


                .sidebar-spacer {
                    flex:
                        1;
                }


                .logout-button {
                    width:
                        100%;

                    height:
                        39px;

                    border:
                        none;

                    border-radius:
                        8px;

                    background:
                        #fff0f0;

                    color:
                        #d32f2f;

                    font-size:
                        11px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;
                }


                .logout-button:hover {
                    background:
                        #ffe3e3;
                }


                /* =========================================================
   DASHBOARD CONTENT
========================================================= */

.dashboard-content {
    width: 100%;

    min-width: 0;
    min-height: 100vh;

    display: flex;
    flex-direction: column;

    background: #f5f7fa;

    box-sizing: border-box;
}


/* =========================================================
   DASHBOARD HEADER
========================================================= */

.dashboard-header {
    width: 100%;

    min-height: 70px;

    padding: 0 32px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    background: #ffffff;

    border-bottom: 1px solid #e5e7eb;

    flex-shrink: 0;

    box-sizing: border-box;
}


/* =========================================================
   MAIN CONTENT
========================================================= */

.dashboard-main {
    width: 100%;

    padding: 28px 35px 20px;

    flex: 0 0 auto;

    box-sizing: border-box;
}


/* =========================================================
   STAFF MANAGEMENT
========================================================= */

.dashboard-content > .staff-management {
    width: 100%;

    max-width: 1100px;

    margin: 0 auto;

    padding: 0 35px 35px;

    box-sizing: border-box;
}


/* =========================================================
   FOOTER
========================================================= */

.dashboard-footer {
    width: 100%;

    min-height: 55px;

    margin-top: auto;

    padding: 0 32px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    background: #ffffff;

    border-top: 1px solid #e5e7eb;

    color: #999999;

    font-size: 9px;

    flex-shrink: 0;

    box-sizing: border-box;
}


                /* =================================================
                   PAGE HEADING
                ================================================= */

                .page-heading {
                    margin-bottom:
                        25px;
                }


                .page-heading h2,
                .payments-header h2 {
                    margin:
                        0 0 6px;

                    color:
                        #222;

                    font-size:
                        25px;

                    font-weight:
                        800;

                    letter-spacing:
                        -0.6px;
                }


                .page-heading p,
                .payments-header p {
                    margin:
                        0;

                    color:
                        #888;

                    font-size:
                        11px;
                }


                .eyebrow {
                    display:
                        block;

                    margin-bottom:
                        5px;

                    color:
                        #a1a1a1;

                    font-size:
                        8px;

                    font-weight:
                        800;

                    letter-spacing:
                        1.2px;
                }


                /* =================================================
                   STATISTICS
                ================================================= */

                .cards {
                    display:
                        grid;

                    grid-template-columns:
                        repeat(4, 1fr);

                    gap:
                        15px;

                    margin-bottom:
                        22px;
                }


                .stat-card {
                    min-height:
                        145px;

                    padding:
                        19px;

                    display:
                        flex;

                    align-items:
                        flex-start;

                    gap:
                        13px;

                    background:
                        #ffffff;

                    border:
                        1px solid #e8e8e8;

                    border-radius:
                        12px;

                    box-shadow:
                        0 3px 12px
                        rgba(0,0,0,0.025);
                }


                .stat-card-button {
                    font-family: inherit;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .stat-card-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 18px rgba(0,0,0,0.06);
                }

                .stat-icon {
                    width:
                        37px;

                    height:
                        37px;

                    flex-shrink:
                        0;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        9px;

                    font-size:
                        15px;

                    font-weight:
                        900;
                }


                .stat-icon.orange {
                    background:
                        #fff0df;

                    color:
                        #f28c28;
                }


                .stat-icon.yellow {
                    background:
                        #fff7df;

                    color:
                        #d89a00;
                }


                .stat-icon.green {
                    background:
                        #e9f8ef;

                    color:
                        #16804a;
                }


                .stat-icon.red {
                    background:
                        #fff0f0;

                    color:
                        #d32f2f;
                }


                .stat-content {
                    min-width:
                        0;
                }


                .stat-content span {
                    display:
                        block;

                    margin-bottom:
                        8px;

                    color:
                        #777;

                    font-size:
                        10px;
                }


                .stat-content strong {
                    display:
                        block;

                    margin-bottom:
                        5px;

                    color:
                        #222;

                    font-size:
                        27px;

                    line-height:
                        1;
                }


                .stat-content small {
                    color:
                        #999;

                    font-size:
                        9px;
                }


                /* =================================================
                   WELCOME CARD
                ================================================= */

                .welcome-card {
                    min-height:
                        105px;

                    margin-bottom:
                        20px;

                    padding:
                        22px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        20px;

                    background:
                        #ffffff;

                    border:
                        1px solid #e8e8e8;

                    border-radius:
                        12px;
                }


                .welcome-left {
                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        15px;
                }


                .section-icon {
                    width:
                        45px;

                    height:
                        45px;

                    flex-shrink:
                        0;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        11px;

                    background:
                        #fff0df;

                    color:
                        #f28c28;

                    font-size:
                        18px;

                    font-weight:
                        800;
                }


                .welcome-card h3 {
                    margin:
                        0 0 6px;

                    font-size:
                        15px;
                }


                .welcome-card p {
                    max-width:
                        600px;

                    margin:
                        0;

                    color:
                        #777;

                    font-size:
                        10px;

                    line-height:
                        1.5;
                }


                .primary-button {
                    min-width:
                        120px;

                    padding:
                        11px 18px;

                    border:
                        none;

                    border-radius:
                        8px;

                    background:
                        #333;

                    color:
                        #ffffff;

                    font-size:
                        10px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;
                }


                .primary-button:hover {
                    background:
                        #222;
                }


                /* =================================================
                   ADMIN ACCOUNT
                ================================================= */

                .system-card {
                    padding:
                        22px;

                    background:
                        #ffffff;

                    border:
                        1px solid #e8e8e8;

                    border-radius:
                        12px;
                }


                .system-card-heading {
                    display:
                        flex;

                    align-items:
                        flex-start;

                    justify-content:
                        space-between;

                    margin-bottom:
                        8px;
                }


                .system-card h3 {
                    margin:
                        0;

                    font-size:
                        15px;
                }


                .account-status {
                    padding:
                        6px 9px;

                    border-radius:
                        20px;

                    background:
                        #e9f8ef;

                    color:
                        #16804a;

                    font-size:
                        8px;

                    font-weight:
                        800;
                }


                .account-row {
                    min-height:
                        43px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        20px;

                    border-bottom:
                        1px solid #f0f0f0;
                }


                .account-row:last-child {
                    border-bottom:
                        none;
                }


                .account-row span {
                    color:
                        #888;

                    font-size:
                        10px;
                }


                .account-row strong {
                    color:
                        #333;

                    font-size:
                        10px;

                    text-align:
                        right;

                    word-break:
                        break-word;
                }


                /* =================================================
                   PAYMENTS HEADER
                ================================================= */

                .payments-header {
                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        20px;

                    margin-bottom:
                        18px;
                }


                .payment-summary {
                    min-width:
                        82px;

                    padding:
                        11px 16px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    gap:
                        5px;

                    border-radius:
                        11px;

                    background:
                        #fff0df;

                    color:
                        #f28c28;
                }


                .summary-number {
                    font-size:
                        17px;

                    font-weight:
                        900;
                }


                .summary-label {
                    font-size:
                        9px;

                    font-weight:
                        700;
                }


                /* =================================================
                   PAYMENT TOOLBAR
                ================================================= */

                .payment-toolbar {
                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        12px;

                    margin-bottom:
                        15px;
                }


                .back-button,
                .refresh-button {
                    min-height:
                        37px;

                    display:
                        inline-flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    gap:
                        7px;

                    padding:
                        0 14px;

                    border-radius:
                        8px;

                    font-size:
                        10px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                    transition:
                        all 0.2s ease;
                }


                .back-button {
                    border:
                        1px solid #e0e0e0;

                    background:
                        #ffffff;

                    color:
                        #444;
                }


                .back-button:hover {
                    background:
                        #f8f8f8;

                    border-color:
                        #d5d5d5;
                }


                .back-arrow {
                    font-size:
                        14px;
                }


                .refresh-button {
                    border:
                        none;

                    background:
                        #333;

                    color:
                        #ffffff;
                }


                .refresh-button:hover {
                    background:
                        #222;
                }


                .refresh-button:disabled {
                    opacity:
                        0.6;

                    cursor:
                        not-allowed;
                }


                /* =================================================
                   PAYMENT TABS
                ================================================= */

                .payment-tabs {
                    width:
                        100%;

                    display:
                        grid;

                    grid-template-columns:
                        repeat(3, 1fr);

                    gap:
                        6px;

                    margin-bottom:
                        20px;

                    padding:
                        5px;

                    background:
                        #eeeeee;

                    border-radius:
                        10px;
                }


                .payment-tab {
                    min-height:
                        41px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    gap:
                        8px;

                    border:
                        none;

                    border-radius:
                        7px;

                    background:
                        transparent;

                    color:
                        #777;

                    font-size:
                        10px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                    transition:
                        all 0.2s ease;
                }


                .payment-tab:hover {
                    background:
                        rgba(255,255,255,0.6);

                    color:
                        #444;
                }


                .payment-tab.active {
                    background:
                        #ffffff;

                    color:
                        #f28c28;

                    box-shadow:
                        0 2px 7px
                        rgba(0,0,0,0.07);
                }


                .payment-tab.verified-active {
                    color:
                        #16804a;
                }

                .verified-count {
                    background:
                        #e9f8ef;
                    color:
                        #16804a;
                }

                .payment-tab.rejected-active {
                    color:
                        #d32f2f;
                }


                .tab-count {
                    min-width:
                        21px;

                    height:
                        21px;

                    display:
                        inline-flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    padding:
                        0 6px;

                    border-radius:
                        50px;

                    font-size:
                        8px;

                    font-weight:
                        800;
                }


                .pending-count {
                    background:
                        #fff0df;

                    color:
                        #f28c28;
                }


                .rejected-count {
                    background:
                        #fff0f0;

                    color:
                        #d32f2f;
                }


                /* =================================================
                   PAYMENT LIST
                ================================================= */

                .payment-list {
                    display:
                        flex;

                    flex-direction:
                        column;

                    gap:
                        16px;
                }


                .payment-card {
                    padding:
                        21px;

                    background:
                        #ffffff;

                    border:
                        1px solid #e5e5e5;

                    border-radius:
                        13px;

                    box-shadow:
                        0 3px 12px
                        rgba(0,0,0,0.025);
                }


                .payment-card.rejected-card {
                    border-left:
                        4px solid #d32f2f;
                }


                .payment-card-header {
                    display:
                        flex;

                    align-items:
                        flex-start;

                    justify-content:
                        space-between;

                    gap:
                        15px;

                    padding-bottom:
                        16px;

                    border-bottom:
                        1px solid #eeeeee;
                }


                .booking-label {
                    display:
                        block;

                    margin-bottom:
                        5px;

                    color:
                        #999;

                    font-size:
                        8px;

                    font-weight:
                        800;

                    letter-spacing:
                        1px;
                }


                .payment-card-header h3 {
                    margin:
                        0;

                    color:
                        #222;

                    font-size:
                        17px;
                }


                .status-badge {
                    flex-shrink:
                        0;

                    padding:
                        7px 10px;

                    border-radius:
                        20px;

                    font-size:
                        8px;

                    font-weight:
                        800;
                }


                .pending-status {
                    background:
                        #fff4e6;

                    color:
                        #f28c28;
                }


                .verified-status {
                    background:
                        #e9f8ef;
                    color:
                        #16804a;
                }

                .rejected-status {
                    background:
                        #fff0f0;

                    color:
                        #d32f2f;
                }


                /* =================================================
                   PAYMENT DETAILS
                ================================================= */

                .payment-details {
                    display:
                        grid;

                    grid-template-columns:
                        repeat(3, 1fr);

                    gap:
                        17px;

                    padding:
                        19px 0;

                    border-bottom:
                        1px solid #eeeeee;
                }


                .payment-detail span {
                    display:
                        block;

                    margin-bottom:
                        5px;

                    color:
                        #999;

                    font-size:
                        9px;
                }


                .payment-detail strong {
                    color:
                        #333;

                    font-size:
                        10px;

                    line-height:
                        1.4;
                }


                .amount-text {
                    color:
                        #16804a !important;
                }


                /* =================================================
                   PAYMENT PROOF
                ================================================= */

                .payment-proof-section {
                    padding-top:
                        18px;
                }


                .proof-heading {
                    display:
                        flex;

                    align-items:
                        flex-end;

                    justify-content:
                        space-between;

                    gap:
                        15px;

                    margin-bottom:
                        11px;
                }


                .proof-heading h4 {
                    margin:
                        0;

                    font-size:
                        13px;
                }


                .proof-file-name {
                    max-width:
                        300px;

                    color:
                        #999;

                    font-size:
                        8px;

                    text-overflow:
                        ellipsis;

                    overflow:
                        hidden;

                    white-space:
                        nowrap;
                }


                .payment-proof {
                    position:
                        relative;

                    display:
                        inline-block;

                    width:
                        150px;

                    height:
                        190px;

                    overflow:
                        hidden;

                    border:
                        1px solid #ddd;

                    border-radius:
                        8px;

                    background:
                        #f5f5f5;
                }


                .payment-proof img {
                    width:
                        100%;

                    height:
                        100%;

                    display:
                        block;

                    object-fit:
                        cover;
                }


                .proof-overlay {
                    position:
                        absolute;

                    inset:
                        auto 0 0 0;

                    padding:
                        10px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    background:
                        rgba(0,0,0,0.72);

                    color:
                        #ffffff;

                    font-size:
                        9px;

                    font-weight:
                        700;

                    opacity:
                        0;

                    transition:
                        opacity 0.2s ease;
                }


                .payment-proof:hover
                .proof-overlay {
                    opacity:
                        1;
                }


                .no-proof {
                    width:
                        150px;

                    min-height:
                        90px;

                    display:
                        flex;

                    flex-direction:
                        column;

                    align-items:
                        center;

                    justify-content:
                        center;

                    gap:
                        7px;

                    padding:
                        12px;

                    border:
                        1px dashed #ccc;

                    border-radius:
                        8px;

                    color:
                        #999;

                    font-size:
                        9px;

                    text-align:
                        center;
                }


                .no-proof-icon {
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
                        #f5f5f5;

                    color:
                        #999;

                    font-weight:
                        800;
                }


                /* =================================================
                   REJECTED MESSAGE
                ================================================= */

                .rejected-message {
                    margin-top:
                        18px;

                    padding:
                        13px;

                    display:
                        flex;

                    align-items:
                        flex-start;

                    gap:
                        10px;

                    border:
                        1px solid #ffd7d7;

                    border-radius:
                        8px;

                    background:
                        #fff7f7;
                }


                .rejected-message-icon {
                    width:
                        25px;

                    height:
                        25px;

                    flex-shrink:
                        0;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        50%;

                    background:
                        #fff0f0;

                    color:
                        #d32f2f;

                    font-size:
                        11px;

                    font-weight:
                        800;
                }


                .rejected-message strong {
                    display:
                        block;

                    margin-bottom:
                        3px;

                    color:
                        #c62828;

                    font-size:
                        10px;
                }


                .rejected-message p {
                    margin:
                        0;

                    color:
                        #888;

                    font-size:
                        9px;

                    line-height:
                        1.5;
                }


                /* =================================================
                   PAYMENT ACTIONS
                ================================================= */

                .payment-actions {
                    display:
                        flex;

                    justify-content:
                        flex-end;

                    gap:
                        9px;

                    margin-top:
                        19px;
                }


                .reject-button,
                .verify-button {
                    min-height:
                        38px;

                    padding:
                        0 16px;

                    border:
                        none;

                    border-radius:
                        8px;

                    font-size:
                        9px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                    transition:
                        all 0.2s ease;
                }


                .reject-button {
                    background:
                        #fff0f0;

                    color:
                        #d32f2f;
                }


                .reject-button:hover {
                    background:
                        #ffe1e1;
                }


                .verify-button {
                    background:
                        #e9f8ef;

                    color:
                        #16804a;
                }


                .verify-button:hover {
                    background:
                        #d8f2e4;
                }


                .reject-button:disabled,
                .verify-button:disabled {
                    opacity:
                        0.55;

                    cursor:
                        not-allowed;
                }


                /* =================================================
                   EMPTY STATE
                ================================================= */

                .empty-payment-card {
                    width:
                        100%;

                    min-height:
                        330px;

                    padding:
                        50px 30px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    flex-direction:
                        column;

                    background:
                        #ffffff;

                    border:
                        1px solid #e5e5e5;

                    border-radius:
                        13px;

                    text-align:
                        center;
                }


                .empty-icon {
                    width:
                        54px;

                    height:
                        54px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    margin-bottom:
                        14px;

                    border-radius:
                        50%;

                    background:
                        #e9f8ef;

                    color:
                        #16804a;

                    font-size:
                        24px;

                    font-weight:
                        800;
                }


                .verified-empty-icon {
                    background:
                        #e9f8ef;
                    color:
                        #16804a;
                }

                .rejected-empty-icon {
                    background:
                        #fff0f0;

                    color:
                        #d32f2f;
                }


                .empty-payment-card h3 {
                    margin:
                        0 0 7px;

                    color:
                        #222;

                    font-size:
                        16px;
                }


                .empty-payment-card p {
                    max-width:
                        450px;

                    margin:
                        0 0 18px;

                    color:
                        #888;

                    font-size:
                        10px;

                    line-height:
                        1.5;
                }


                .secondary-button {
                    min-height:
                        37px;

                    padding:
                        0 15px;

                    border:
                        1px solid #ddd;

                    border-radius:
                        7px;

                    background:
                        #ffffff;

                    color:
                        #555;

                    font-size:
                        9px;

                    font-weight:
                        700;

                    cursor:
                        pointer;
                }


                .secondary-button:hover {
                    background:
                        #f8f8f8;
                }


                /* =================================================
                   LOADING
                ================================================= */

                .payment-loading {
                    min-height:
                        300px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    flex-direction:
                        column;

                    background:
                        #ffffff;

                    border:
                        1px solid #e5e5e5;

                    border-radius:
                        13px;
                }


                .payment-loading p {
                    margin:
                        12px 0 0;

                    color:
                        #888;

                    font-size:
                        10px;
                }


                .loading-spinner {
                    width:
                        30px;

                    height:
                        30px;

                    border:
                        3px solid #eeeeee;

                    border-top-color:
                        #f28c28;

                    border-radius:
                        50%;

                    animation:
                        spin 0.8s linear infinite;
                }


                @keyframes spin {

                    to {
                        transform:
                            rotate(360deg);
                    }

                }


                /* =================================================
                   NOTIFICATION
                ================================================= */

                .notification {
                    position:
                        fixed;

                    top:
                        20px;

                    right:
                        20px;

                    z-index:
                        2000;

                    min-width:
                        300px;

                    max-width:
                        420px;

                    padding:
                        13px 14px;

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        10px;

                    background:
                        #ffffff;

                    border-radius:
                        9px;

                    box-shadow:
                        0 10px 30px
                        rgba(0,0,0,0.12);

                    font-size:
                        10px;

                    font-weight:
                        700;

                    animation:
                        notificationIn
                        0.25s ease;
                }


                .notification.error {
                    border-left:
                        4px solid #e53935;

                    color:
                        #d32f2f;
                }


                .notification.success {
                    border-left:
                        4px solid #16804a;

                    color:
                        #16804a;
                }


                .notification-icon {
                    width:
                        20px;

                    height:
                        20px;

                    flex-shrink:
                        0;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        50%;

                    background:
                        #f5f5f5;

                    font-size:
                        10px;
                }


                .notification button {
                    margin-left:
                        auto;

                    border:
                        none;

                    background:
                        transparent;

                    color:
                        #999;

                    font-size:
                        17px;

                    cursor:
                        pointer;
                }


                @keyframes notificationIn {

                    from {
                        opacity:
                            0;

                        transform:
                            translateY(-10px);
                    }

                    to {
                        opacity:
                            1;

                        transform:
                            translateY(0);
                    }

                }


                /* =================================================
                   CONFIRMATION MODAL
                ================================================= */

                .modal-overlay {
                    position:
                        fixed;

                    inset:
                        0;

                    z-index:
                        3000;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    padding:
                        20px;

                    background:
                        rgba(0,0,0,0.45);

                    backdrop-filter:
                        blur(3px);
                }


                .confirm-modal {
                    width:
                        100%;

                    max-width:
                        410px;

                    padding:
                        28px;

                    background:
                        #ffffff;

                    border-radius:
                        15px;

                    box-shadow:
                        0 20px 60px
                        rgba(0,0,0,0.2);

                    text-align:
                        center;
                }


                .modal-icon {
                    width:
                        50px;

                    height:
                        50px;

                    margin:
                        0 auto 13px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        50%;

                    font-size:
                        20px;

                    font-weight:
                        800;
                }


                .modal-danger {
                    background:
                        #fff0f0;

                    color:
                        #d32f2f;
                }


                .modal-success {
                    background:
                        #e9f8ef;

                    color:
                        #16804a;
                }


                .modal-eyebrow {
                    display:
                        block;

                    margin-bottom:
                        6px;

                    color:
                        #999;

                    font-size:
                        8px;

                    font-weight:
                        800;

                    letter-spacing:
                        1px;
                }


                .confirm-modal h3 {
                    margin:
                        0 0 15px;

                    color:
                        #222;

                    font-size:
                        19px;
                }


                .modal-booking {
                    padding:
                        11px;

                    margin-bottom:
                        14px;

                    border-radius:
                        8px;

                    background:
                        #f7f7f7;
                }


                .modal-booking span {
                    display:
                        block;

                    margin-bottom:
                        4px;

                    color:
                        #999;

                    font-size:
                        8px;

                    text-transform:
                        uppercase;
                }


                .modal-booking strong {
                    color:
                        #333;

                    font-size:
                        11px;
                }


                .confirm-modal p {
                    margin:
                        0;

                    color:
                        #777;

                    font-size:
                        10px;

                    line-height:
                        1.6;
                }


                .confirm-modal-actions {
                    display:
                        flex;

                    justify-content:
                        center;

                    gap:
                        9px;

                    margin-top:
                        23px;
                }


                .modal-cancel,
                .modal-confirm {
                    min-height:
                        38px;

                    padding:
                        0 17px;

                    border-radius:
                        8px;

                    font-size:
                        9px;

                    font-weight:
                        700;

                    cursor:
                        pointer;
                }


                .modal-cancel {
                    border:
                        1px solid #ddd;

                    background:
                        #ffffff;

                    color:
                        #555;
                }


                .modal-cancel:hover {
                    background:
                        #f8f8f8;
                }


                .modal-confirm {
                    border:
                        none;

                    color:
                        #ffffff;
                }


                .modal-confirm.danger {
                    background:
                        #d32f2f;
                }


                .modal-confirm.danger:hover {
                    background:
                        #b92525;
                }


                .modal-confirm.success {
                    background:
                        #16804a;
                }


                .modal-confirm.success:hover {
                    background:
                        #126b3e;
                }


                .modal-cancel:disabled,
                .modal-confirm:disabled {
                    opacity:
                        0.55;

                    cursor:
                        not-allowed;
                }


                /* =================================================
                   FOOTER
                ================================================= */

                .dashboard-footer {
                    min-height:
                        55px;

                    padding:
                        0 32px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    background:
                        #ffffff;

                    border-top:
                        1px solid #e5e5e5;

                    color:
                        #999;

                    font-size:
                        9px;
                }


                /* =================================================
                   LOADING SCREEN
                ================================================= */

                .dashboard-loading {
                    min-height:
                        100vh;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    flex-direction:
                        column;

                    background:
                        #f5f7fa;

                    color:
                        #777;

                    font-size:
                        11px;
                }


                /* =================================================
                   STAFF MANAGEMENT
                ================================================= */

                .staff-page {
                    width: 100%;
                    max-width: 1100px;
                    margin: 0 auto;
                }

                .staff-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 22px;
                }

                .staff-header h2 {
                    margin: 0 0 6px;
                    color: #222;
                    font-size: 25px;
                    font-weight: 800;
                    letter-spacing: -0.6px;
                }

                .staff-header p {
                    margin: 0;
                    color: #888;
                    font-size: 11px;
                    line-height: 1.5;
                }

                .staff-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    flex-shrink: 0;
                }

                .staff-add-button {
                    min-height: 37px;
                    padding: 0 16px;
                    border: none;
                    border-radius: 8px;
                    background: #f28c28;
                    color: #ffffff;
                    font-size: 10px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .staff-add-button:hover {
                    background: #df7818;
                    transform: translateY(-1px);
                }

                .staff-summary-card {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1px;
                    margin-bottom: 18px;
                    overflow: hidden;
                    background: #e8e8e8;
                    border: 1px solid #e8e8e8;
                    border-radius: 12px;
                }

                .staff-summary-card > div {
                    min-height: 85px;
                    padding: 17px 20px;
                    background: #ffffff;
                }

                .staff-summary-card span {
                    display: block;
                    margin-bottom: 7px;
                    color: #888;
                    font-size: 9px;
                }

                .staff-summary-card strong {
                    color: #222;
                    font-size: 23px;
                }

                .staff-loading,
                .empty-staff-card {
                    min-height: 280px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    padding: 40px 25px;
                    background: #ffffff;
                    border: 1px solid #e5e5e5;
                    border-radius: 13px;
                    text-align: center;
                }

                .staff-loading p,
                .empty-staff-card p {
                    margin: 12px 0 18px;
                    color: #888;
                    font-size: 10px;
                    line-height: 1.5;
                }

                .empty-staff-icon {
                    width: 54px;
                    height: 54px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 13px;
                    border-radius: 50%;
                    background: #fff0df;
                    color: #f28c28;
                    font-size: 25px;
                    font-weight: 800;
                }

                .empty-staff-card h3 {
                    margin: 0;
                    color: #222;
                    font-size: 16px;
                }

                .staff-table-card {
                    overflow: hidden;
                    background: #ffffff;
                    border: 1px solid #e5e5e5;
                    border-radius: 13px;
                }

                .staff-table-wrap {
                    width: 100%;
                    overflow-x: auto;
                }

                .staff-table {
                    width: 100%;
                    min-width: 760px;
                    border-collapse: collapse;
                }

                .staff-table th {
                    padding: 14px 16px;
                    background: #fafafa;
                    color: #777;
                    border-bottom: 1px solid #e5e5e5;
                    text-align: left;
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                }

                .staff-table td {
                    padding: 14px 16px;
                    color: #333;
                    border-bottom: 1px solid #f1f1f1;
                    font-size: 10px;
                    vertical-align: middle;
                }

                .staff-table tbody tr:last-child td {
                    border-bottom: none;
                }

                .staff-table td strong {
                    color: #222;
                    font-size: 10px;
                }

                .staff-role {
                    display: inline-flex;
                    padding: 5px 8px;
                    border-radius: 20px;
                    background: #f5f5f5;
                    color: #555;
                    font-size: 8px;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .staff-status {
                    display: inline-flex;
                    padding: 5px 8px;
                    border-radius: 20px;
                    font-size: 8px;
                    font-weight: 800;
                }

                .staff-status.active {
                    background: #e9f8ef;
                    color: #16804a;
                }

                .staff-status.inactive {
                    background: #fff0f0;
                    color: #d32f2f;
                }

                .staff-actions {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .staff-action {
                    min-height: 30px;
                    padding: 0 9px;
                    border: none;
                    border-radius: 6px;
                    font-size: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .staff-action.activate {
                    background: #e9f8ef;
                    color: #16804a;
                }

                .staff-action.deactivate {
                    background: #fff7df;
                    color: #a46f00;
                }

                .staff-action.delete {
                    background: #fff0f0;
                    color: #d32f2f;
                }

                .staff-action:hover:not(:disabled) {
                    transform: translateY(-1px);
                }

                .staff-action:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                }

                .staff-modal {
                    width: 100%;
                    max-width: 560px;
                    padding: 25px;
                    background: #ffffff;
                    border-radius: 15px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                }

                .staff-modal-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .staff-modal-header h3 {
                    margin: 0 0 5px;
                    color: #222;
                    font-size: 20px;
                }

                .staff-modal-header p {
                    margin: 0;
                    color: #888;
                    font-size: 10px;
                    line-height: 1.5;
                }

                .staff-modal-close {
                    width: 30px;
                    height: 30px;
                    flex-shrink: 0;
                    border: none;
                    border-radius: 7px;
                    background: #f5f5f5;
                    color: #777;
                    font-size: 20px;
                    cursor: pointer;
                }

                .staff-modal-close:hover {
                    background: #eeeeee;
                }

                .staff-form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }

                .staff-form-group {
                    margin-bottom: 14px;
                }

                .staff-form-group label {
                    display: block;
                    margin-bottom: 6px;
                    color: #555;
                    font-size: 9px;
                    font-weight: 700;
                }

                .staff-form-group input {
                    width: 100%;
                    height: 40px;
                    padding: 0 11px;
                    border: 1px solid #dddddd;
                    border-radius: 8px;
                    outline: none;
                    background: #ffffff;
                    color: #222;
                    font-family: inherit;
                    font-size: 10px;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }

                .staff-form-group input:focus {
                    border-color: #f28c28;
                    box-shadow: 0 0 0 3px rgba(242,140,40,0.1);
                }

                .staff-form-group input:disabled {
                    background: #f7f7f7;
                    cursor: not-allowed;
                }

                .staff-modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 9px;
                    margin-top: 7px;
                }

                /* =================================================
                   TABLET
                ================================================= */


                @media (max-width: 1000px) {

                    .cards {
                        grid-template-columns:
                            repeat(2, 1fr);
                    }


                    .payment-details {
                        grid-template-columns:
                            repeat(2, 1fr);
                    }

                }


                /* =================================================
                   SMALL TABLET
                ================================================= */

                @media (max-width: 800px) {

                    .sidebar {
                        width:
                            190px;
                    }


                    .dashboard-main {
                        padding:
                            25px 20px;
                    }


                    .dashboard-header {
                        padding:
                            0 20px;
                    }

                }


                /* =================================================
                   MOBILE
                ================================================= */

                @media (max-width: 650px) {

                    .admin-dashboard {
                        flex-direction:
                            column;
                    }


                    .sidebar {
                        width:
                            100%;

                        min-height:
                            auto;

                        padding:
                            10px;

                        flex-direction:
                            row;

                        align-items:
                            center;

                        gap:
                            5px;

                        overflow-x:
                            auto;

                        border-right:
                            none;

                        border-bottom:
                            1px solid #e5e5e5;
                    }


                    .brand-section {
                        display:
                            none;
                    }


                    .sidebar-navigation {
                        flex-direction:
                            row;
                    }


                    .side-item {
                        width:
                            auto;

                        min-width:
                            max-content;

                        padding:
                            0 12px;
                    }


                    .sidebar-spacer {
                        display:
                            none;
                    }


                    .logout-button {
                        width:
                            auto;

                        min-width:
                            75px;

                        margin-left:
                            auto;
                    }


                    .staff-header {
                        flex-direction: column;
                    }

                    .staff-header-actions {
                        width: 100%;
                    }

                    .staff-header-actions .refresh-button,
                    .staff-header-actions .staff-add-button {
                        flex: 1;
                    }

                    .staff-summary-card {
                        grid-template-columns: 1fr;
                    }

                    .staff-form-grid {
                        grid-template-columns: 1fr;
                        gap: 0;
                    }

                    .staff-modal {
                        padding: 20px;
                    }

                    .staff-modal-actions {
                        flex-direction: column;
                    }

                    .staff-modal-actions .modal-cancel,
                    .staff-modal-actions .modal-confirm {
                        width: 100%;
                    }

                    .dashboard-header {
                        min-height:
                            64px;

                        padding:
                            0 16px;
                    }


                    .dashboard-header h1 {
                        font-size:
                            17px;
                    }


                    .dashboard-header p {
                        font-size:
                            9px;
                    }


                    .admin-badge {
                        display:
                            none;
                    }


                    .dashboard-main {
                        padding:
                            20px 14px;
                    }


                    .cards {
                        grid-template-columns:
                            1fr;
                    }


                    .page-heading h2,
                    .payments-header h2 {
                        font-size:
                            21px;
                    }


                    .welcome-card {
                        flex-direction:
                            column;

                        align-items:
                            stretch;
                    }


                    .welcome-left {
                        align-items:
                            flex-start;
                    }


                    .primary-button {
                        width:
                            100%;
                    }


                    .payments-header {
                        align-items:
                            flex-start;
                    }


                    .payment-summary {
                        display:
                            none;
                    }


                    .payment-toolbar {
                        flex-direction:
                            column;

                        align-items:
                            stretch;
                    }


                    .back-button,
                    .refresh-button {
                        width:
                            100%;
                    }


                    .payment-details {
                        grid-template-columns:
                            1fr;

                        gap:
                            13px;
                    }


                    .payment-card-header {
                        flex-direction:
                            column;
                    }


                    .status-badge {
                        align-self:
                            flex-start;
                    }


                    .payment-actions {
                        flex-direction:
                            column;
                    }


                    .reject-button,
                    .verify-button {
                        width:
                            100%;
                    }


                    .proof-heading {
                        align-items:
                            flex-start;

                        flex-direction:
                            column;
                    }


                    .proof-file-name {
                        max-width:
                            100%;
                    }


                    .dashboard-footer {
                        padding:
                            14px;

                        flex-direction:
                            column;

                        gap:
                            5px;
                    }


                    .notification {
                        left:
                            14px;

                        right:
                            14px;

                        min-width:
                            0;
                    }


                    .confirm-modal {
                        padding:
                            22px;
                    }


                    .confirm-modal-actions {
                        flex-direction:
                            column;
                    }


                    .modal-cancel,
                    .modal-confirm {
                        width:
                            100%;
                    }

                }
                    /* =========================================================
   STAFF MANAGEMENT - COMPACT PROFESSIONAL LAYOUT
   UI ONLY - DOES NOT CHANGE FUNCTIONALITY
========================================================= */

/* Keep Staff Management close to the dashboard header */
.staff-page {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0;
}

/* Staff heading */
.staff-header {
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin: 0 0 18px;
}

/* Heading */
.staff-header h2 {
    margin: 0 0 5px;
    color: #222222;
    font-size: 25px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -0.5px;
}

/* Description */
.staff-header p {
    margin: 0;
    color: #888888;
    font-size: 11px;
    line-height: 1.5;
}

/* Administration label */
.staff-header .eyebrow {
    display: block;
    margin-bottom: 5px;
}

/* Buttons beside Staff Management title */
.staff-header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-shrink: 0;
}

/* Refresh button */
.staff-header-actions .refresh-button {
    min-height: 37px;
    padding: 0 14px;
    border: 1px solid #dddddd;
    border-radius: 8px;
    background: #ffffff;
    color: #555555;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    transition:
        background 0.2s ease,
        border-color 0.2s ease,
        transform 0.2s ease;
}

.staff-header-actions .refresh-button:hover {
    background: #fafafa;
    border-color: #cccccc;
    transform: translateY(-1px);
}

/* Add Staff */
.staff-header-actions .staff-add-button {
    min-height: 37px;
    padding: 0 15px;
    border: none;
    border-radius: 8px;
    background: #f28c28;
    color: #ffffff;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    transition:
        background 0.2s ease,
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.staff-header-actions .staff-add-button:hover {
    background: #df7818;
    transform: translateY(-1px);
    box-shadow:
        0 5px 14px rgba(242, 140, 40, 0.18);
}


/* =========================================================
   SUMMARY
========================================================= */

.staff-summary-card {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;

    margin: 0 0 16px;

    overflow: hidden;

    background: #e8e8e8;
    border: 1px solid #e8e8e8;
    border-radius: 12px;
}

/* Individual summary section */
.staff-summary-card > div {
    min-height: 78px;
    padding: 15px 18px;

    background: #ffffff;

    display: flex;
    flex-direction: column;
    justify-content: center;
}

/* Summary labels */
.staff-summary-card span {
    display: block;
    margin-bottom: 6px;

    color: #888888;
    font-size: 9px;
    font-weight: 500;
}

/* Summary numbers */
.staff-summary-card strong {
    display: block;

    color: #222222;
    font-size: 22px;
    line-height: 1;
}


/* =========================================================
   STAFF TABLE
========================================================= */

.staff-table-card {
    width: 100%;
    overflow: hidden;

    background: #ffffff;

    border: 1px solid #e5e5e5;
    border-radius: 12px;

    box-shadow:
        0 3px 14px rgba(0, 0, 0, 0.025);
}

.staff-table-wrap {
    width: 100%;
    overflow-x: auto;
}

.staff-table {
    width: 100%;
    min-width: 760px;

    border-collapse: collapse;
}

/* Table heading */
.staff-table th {
    padding: 12px 15px;

    background: #fafafa;
    color: #777777;

    border-bottom: 1px solid #e5e5e5;

    text-align: left;

    font-size: 8px;
    font-weight: 800;

    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Table cells */
.staff-table td {
    padding: 13px 15px;

    color: #333333;

    border-bottom: 1px solid #f1f1f1;

    font-size: 10px;
    vertical-align: middle;
}

/* Last row */
.staff-table tbody tr:last-child td {
    border-bottom: none;
}

/* Hover */
.staff-table tbody tr {
    transition: background 0.15s ease;
}

.staff-table tbody tr:hover {
    background: #fffaf5;
}

/* Staff name */
.staff-table td strong {
    color: #222222;
    font-size: 10px;
}


/* =========================================================
   ROLE BADGE
========================================================= */

.staff-role {
    display: inline-flex;
    align-items: center;

    padding: 4px 8px;

    border-radius: 20px;

    background: #f5f5f5;
    color: #555555;

    font-size: 8px;
    font-weight: 700;

    text-transform: uppercase;
}


/* =========================================================
   STATUS BADGE
========================================================= */

.staff-status {
    display: inline-flex;
    align-items: center;

    padding: 4px 8px;

    border-radius: 20px;

    font-size: 8px;
    font-weight: 800;
}

.staff-status.active {
    background: #e9f8ef;
    color: #16804a;
}

.staff-status.inactive {
    background: #fff0f0;
    color: #d32f2f;
}


/* =========================================================
   ACTION BUTTONS
========================================================= */

.staff-actions {
    display: flex;
    align-items: center;
    gap: 6px;
}

.staff-action {
    min-height: 29px;

    padding: 0 9px;

    border: none;
    border-radius: 6px;

    font-size: 8px;
    font-weight: 700;

    cursor: pointer;

    transition:
        background 0.2s ease,
        transform 0.2s ease;
}

.staff-action:hover:not(:disabled) {
    transform: translateY(-1px);
}

.staff-action.activate {
    background: #e9f8ef;
    color: #16804a;
}

.staff-action.activate:hover {
    background: #d9f2e3;
}

.staff-action.deactivate {
    background: #fff7df;
    color: #a46f00;
}

.staff-action.deactivate:hover {
    background: #ffefc4;
}

.staff-action.delete {
    background: #fff0f0;
    color: #d32f2f;
}

.staff-action.delete:hover {
    background: #ffe2e2;
}

.staff-action:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}


/* =========================================================
   LOADING / EMPTY STATE
========================================================= */

.staff-loading,
.empty-staff-card {
    width: 100%;
    min-height: 230px;

    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    padding: 30px 20px;

    background: #ffffff;

    border: 1px solid #e5e5e5;
    border-radius: 12px;

    text-align: center;
}

.staff-loading p,
.empty-staff-card p {
    margin: 10px 0 16px;

    color: #888888;

    font-size: 10px;
    line-height: 1.5;
}

.empty-staff-icon {
    width: 48px;
    height: 48px;

    display: flex;
    align-items: center;
    justify-content: center;

    margin-bottom: 11px;

    border-radius: 50%;

    background: #fff0df;
    color: #f28c28;

    font-size: 22px;
    font-weight: 800;
}

.empty-staff-card h3 {
    margin: 0;

    color: #222222;
    font-size: 15px;
}


/* =========================================================
   IMPORTANT:
   PREVENT STAFF PAGE FROM BEING VERTICALLY PUSHED
========================================================= */

.dashboard-main {
    align-items: flex-start !important;
    justify-content: flex-start !important;
}

.staff-page {
    align-self: flex-start;
}


/* =========================================================
   STAFF MODAL
   KEEP EXISTING FUNCTIONALITY
========================================================= */

.staff-modal {
    width: 100%;
    max-width: 540px;

    padding: 24px;

    background: #ffffff;

    border-radius: 14px;

    box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.20);
}

.staff-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    gap: 15px;

    margin-bottom: 18px;
}

.staff-modal-header h3 {
    margin: 0 0 5px;

    color: #222222;
    font-size: 19px;
}

.staff-modal-header p {
    margin: 0;

    color: #888888;

    font-size: 10px;
    line-height: 1.5;
}

.staff-modal-close {
    width: 30px;
    height: 30px;

    flex-shrink: 0;

    border: none;
    border-radius: 7px;

    background: #f7f7f7;
    color: #777777;

    font-size: 18px;

    cursor: pointer;
}

.staff-modal-close:hover {
    background: #eeeeee;
}


/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 900px) {

    .staff-page {
        max-width: 100%;
    }

    .staff-header {
        align-items: flex-start;
    }

    .staff-summary-card {
        grid-template-columns: repeat(3, 1fr);
    }

}


@media (max-width: 700px) {

    .staff-header {
        flex-direction: column;
        align-items: stretch;
    }

    .staff-header-actions {
        width: 100%;
        justify-content: flex-start;
    }

    .staff-summary-card {
        grid-template-columns: 1fr;
    }

    .staff-summary-card > div {
        min-height: 65px;
    }

}


@media (max-width: 500px) {

    .staff-header-actions {
        flex-direction: column;
        align-items: stretch;
    }

    .staff-header-actions .refresh-button,
    .staff-header-actions .staff-add-button {
        width: 100%;
    }

    .staff-header h2 {
        font-size: 21px;
    }

    .staff-header p {
        font-size: 10px;
    }

    .staff-table th,
    .staff-table td {
        padding: 11px 12px;
    }

}
    /* =========================================================
   LOGOUT CONFIRMATION MODAL
   ========================================================= */

/*
 * IMPORTANT:
 * The JSX uses .logout-modal-overlay.
 * Do NOT change the JSX.
 */

.logout-modal-overlay {
    position: fixed !important;

    top: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    left: 0 !important;

    width: 100vw !important;
    height: 100vh !important;

    display: flex !important;

    align-items: center !important;
    justify-content: center !important;

    padding: 20px;

    background: rgba(15, 23, 42, 0.48);

    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);

    z-index: 99999 !important;

    animation:
        logoutOverlayIn
        0.2s ease-out;
}


/* =========================================================
   LOGOUT MODAL CARD
========================================================= */

.logout-modal {
    position: relative;

    width: 100%;
    max-width: 420px;

    padding: 30px 30px 26px;

    background: #ffffff;

    border: 1px solid #e5e7eb;

    border-radius: 16px;

    box-shadow:
        0 25px 60px rgba(0, 0, 0, 0.18),
        0 8px 20px rgba(0, 0, 0, 0.08);

    text-align: center;

    animation:
        logoutModalIn
        0.25s ease-out;
}


/* =========================================================
   LOGOUT ICON
========================================================= */

.logout-modal-icon {
    width: 52px;
    height: 52px;

    margin: 0 auto 17px;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background: #fff0f0;

    color: #d32f2f;

    font-size: 21px;

    font-weight: 800;

    border: 1px solid #ffe0e0;
}


/* =========================================================
   LOGOUT CONTENT
========================================================= */

.logout-modal-content {
    width: 100%;
}

.logout-modal-content h2 {
    margin: 0 0 9px;

    color: #1f2937;

    font-size: 20px;

    font-weight: 800;

    line-height: 1.25;
}

.logout-modal-content p {
    max-width: 330px;

    margin: 0 auto;

    color: #6b7280;

    font-size: 11px;

    line-height: 1.6;
}


/* =========================================================
   LOGOUT ACTION BUTTONS
========================================================= */

.logout-modal-actions {
    display: flex;

    align-items: center;
    justify-content: center;

    gap: 10px;

    margin-top: 25px;
}


/* =========================================================
   CANCEL BUTTON
========================================================= */

.logout-cancel-button {
    min-width: 115px;

    height: 40px;

    padding: 0 18px;

    border: 1px solid #dfe3e8;

    border-radius: 8px;

    background: #ffffff;

    color: #4b5563;

    font-family: inherit;

    font-size: 10px;

    font-weight: 700;

    cursor: pointer;

    transition:
        background 0.2s ease,
        border-color 0.2s ease,
        transform 0.15s ease;
}

.logout-cancel-button:hover {
    background: #f8fafc;

    border-color: #cfd5dc;
}

.logout-cancel-button:active {
    transform: scale(0.98);
}


/* =========================================================
   CONFIRM LOGOUT BUTTON
========================================================= */

.logout-confirm-button {
    min-width: 115px;

    height: 40px;

    padding: 0 18px;

    border: none;

    border-radius: 8px;

    background: #d32f2f;

    color: #ffffff;

    font-family: inherit;

    font-size: 10px;

    font-weight: 700;

    cursor: pointer;

    transition:
        background 0.2s ease,
        transform 0.15s ease,
        box-shadow 0.2s ease;
}

.logout-confirm-button:hover {
    background: #b92525;

    box-shadow:
        0 5px 12px rgba(211, 47, 47, 0.22);
}

.logout-confirm-button:active {
    transform: scale(0.98);
}


/* =========================================================
   MODAL ANIMATIONS
========================================================= */

@keyframes logoutOverlayIn {

    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }

}


@keyframes logoutModalIn {

    from {
        opacity: 0;

        transform:
            translateY(12px)
            scale(0.97);
    }

    to {
        opacity: 1;

        transform:
            translateY(0)
            scale(1);
    }

}


/* =========================================================
   MOBILE LOGOUT MODAL
========================================================= */

@media (max-width: 650px) {

    .logout-modal-overlay {
        padding: 16px;
    }

    .logout-modal {
        max-width: 100%;

        padding:
            25px 20px 21px;

        border-radius: 14px;
    }

    .logout-modal-icon {
        width: 48px;
        height: 48px;

        margin-bottom: 14px;

        font-size: 19px;
    }

    .logout-modal-content h2 {
        font-size: 18px;
    }

    .logout-modal-content p {
        font-size: 10px;
    }

    .logout-modal-actions {
        gap: 8px;

        margin-top: 21px;
    }

    .logout-cancel-button,
    .logout-confirm-button {
        min-width: 0;

        width: 50%;

        height: 39px;
    }

}


/* =========================================================
   VERY SMALL MOBILE
========================================================= */

@media (max-width: 400px) {

    .logout-modal-overlay {
        padding: 12px;
    }

    .logout-modal {
        padding: 23px 17px 19px;
    }

    .logout-modal-actions {
        flex-direction: column;
    }

    .logout-cancel-button,
    .logout-confirm-button {
        width: 100%;
    }

}

/* =========================================================
   LIVE FERRY CAPACITY - ADMIN
   ========================================================= */

.admin-capacity-card {
    width: 100%;
    margin-bottom: 22px;
    padding: 20px;
    background: #ffffff;
    border: 1px solid #e8e8e8;
    border-radius: 12px;
    box-shadow: 0 3px 12px rgba(0,0,0,0.025);
    box-sizing: border-box;
}
.admin-capacity-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
}
.admin-capacity-header h3 { margin: 0 0 5px; color: #222222; font-size: 19px; font-weight: 800; }
.admin-capacity-header p { margin: 0; color: #888888; font-size: 10px; }
.admin-capacity-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.admin-ferry-capacity-card { padding: 15px; background: #fafafa; border: 1px solid #e8e8e8; border-radius: 10px; }
.admin-ferry-capacity-card.capacity-closed { background: #fff7f7; border-color: #f0caca; }
.admin-ferry-capacity-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 15px; }
.admin-ferry-capacity-top strong { display: block; color: #222222; font-size: 13px; line-height: 1.3; }
.admin-ferry-capacity-top span { display: block; margin-top: 3px; color: #888888; font-size: 9px; }
.admin-capacity-status { flex-shrink: 0; padding: 5px 7px; border-radius: 20px; font-size: 7px !important; font-weight: 800; }
.admin-capacity-status.open { background: #e9f8ef; color: #16804a; }
.admin-capacity-status.closed { background: #fff0f0; color: #d32f2f; }
.admin-capacity-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.admin-capacity-metric { padding: 11px; background: #ffffff; border: 1px solid #eeeeee; border-radius: 8px; }
.admin-capacity-metric span { display: block; margin-bottom: 5px; color: #777777; font-size: 8px; font-weight: 700; }
.admin-capacity-metric strong { display: block; color: #222222; font-size: 18px; line-height: 1; }
.admin-capacity-metric small { display: block; margin-top: 5px; color: #999999; font-size: 8px; line-height: 1.3; }

.admin-ferry-bookings-section {
    margin-top: 12px;
    padding-top: 11px;
    border-top: 1px solid #e8e8e8;
}

.admin-ferry-bookings-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
    color: #777777;
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.6px;
}

.admin-ferry-bookings-heading strong {
    min-width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
    border-radius: 50%;
    background: #fff0df;
    color: #f28c28;
    font-size: 8px;
}

.admin-ferry-bookings-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 260px;
    overflow-y: auto;
    padding-right: 2px;
}

.admin-ferry-booking-row {
    padding: 8px;
    background: #ffffff;
    border: 1px solid #eeeeee;
    border-radius: 7px;
}

.admin-ferry-booking-main {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
}

.admin-ferry-booking-main strong {
    color: #333333;
    font-size: 8px;
}

.admin-ferry-booking-main span {
    color: #666666;
    font-size: 8px;
    text-align: right;
    overflow-wrap: anywhere;
}

.admin-ferry-booking-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 5px;
}

.admin-ferry-booking-meta > span {
    padding: 3px 5px;
    border-radius: 5px;
    background: #f5f5f5;
    color: #888888;
    font-size: 7px;
}

.admin-ferry-booking-status.verified {
    background: #e9f8ef;
    color: #16804a;
}

.admin-ferry-booking-status.pending {
    background: #fff4e6;
    color: #f28c28;
}

.admin-ferry-booking-status.other {
    background: #f2f2f2;
    color: #666666;
}

.admin-ferry-bookings-empty {
    padding: 9px;
    border: 1px dashed #dddddd;
    border-radius: 7px;
    color: #999999;
    font-size: 8px;
    text-align: center;
}

.admin-capacity-closed-message { margin-top: 10px; padding: 8px 10px; border-radius: 7px; background: #fff0f0; color: #d32f2f; font-size: 8px; font-weight: 700; }
.admin-capacity-error, .admin-capacity-empty { padding: 18px; border-radius: 9px; background: #fafafa; color: #888888; font-size: 10px; text-align: center; }
.admin-capacity-error { background: #fff7f7; color: #d32f2f; }
@media (max-width: 1000px) { .admin-capacity-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .admin-capacity-header { flex-direction: column; align-items: stretch; } .admin-capacity-header .refresh-button { width: 100%; } .admin-capacity-metrics { grid-template-columns: 1fr; } }



.admin-ferry-toggle-button { width: 100%; margin-top: 10px; padding: 9px 11px; border: 1px solid transparent; border-radius: 8px; font-size: 9px; font-weight: 800; cursor: pointer; transition: 0.2s ease; }
.admin-ferry-toggle-button.close { background: #fff0f0; color: #c62828; border-color: #f1caca; }
.admin-ferry-toggle-button.reopen { background: #e9f8ef; color: #16804a; border-color: #c9ecd9; }
.admin-ferry-toggle-button:disabled { opacity: 0.6; cursor: not-allowed; }
.ferry-confirm-modal { max-width: 460px; }
.ferry-confirm-modal .modal-booking {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 14px;
}
.ferry-confirm-modal .modal-booking span {
    color: #888888;
    font-size: 9px;
    font-weight: 700;
}
.ferry-confirm-modal .modal-booking strong {
    color: #222222;
    font-size: 11px;
    text-align: right;
}
.admin-booking-search-card { margin-top: 18px; padding: 18px; background: #ffffff; border: 1px solid #e8e8e8; border-radius: 12px; }
.admin-booking-search-header h3 { margin: 5px 0; color: #222222; font-size: 19px; font-weight: 800; }
.admin-booking-search-header p { margin: 0; color: #888888; font-size: 10px; }
.admin-booking-search-form { display: grid; grid-template-columns: 1fr 120px; gap: 10px; margin-top: 15px; }
.admin-booking-search-form input { min-width: 0; padding: 12px 13px; border: 1px solid #dddddd; border-radius: 8px; outline: none; font-size: 11px; }
.admin-booking-search-form input:focus { border-color: #f2a65a; }
.admin-booking-search-form button { border: 0; border-radius: 8px; background: #2f2f2f; color: #ffffff; font-size: 10px; font-weight: 800; cursor: pointer; }
.admin-booking-search-form button:disabled { opacity: 0.6; cursor: not-allowed; }
.admin-booking-search-error { margin-top: 10px; padding: 10px 12px; border-radius: 8px; background: #fff0f0; color: #c62828; font-size: 10px; font-weight: 700; }
.admin-booking-result { margin-top: 15px; padding: 15px; background: #fafafa; border: 1px solid #eeeeee; border-radius: 10px; }
.admin-booking-result-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.admin-booking-result-heading h4 { margin: 5px 0 0; color: #222222; font-size: 15px; }
.admin-booking-status-pill { padding: 6px 9px; border-radius: 20px; background: #fff4dc; color: #9a6500; font-size: 8px; font-weight: 800; text-align: center; }
.admin-booking-status-pill.confirmed { background: #e9f8ef; color: #16804a; }
.admin-booking-info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.admin-booking-info-grid > div { padding: 10px; background: #ffffff; border: 1px solid #eeeeee; border-radius: 7px; }
.admin-booking-info-grid span { display: block; margin-bottom: 4px; color: #888888; font-size: 8px; }
.admin-booking-info-grid strong { display: block; color: #222222; font-size: 10px; word-break: break-word; }
.admin-booking-proof-link { display: inline-block; margin-top: 12px; padding: 8px 11px; border-radius: 7px; background: #2f2f2f; color: #ffffff; text-decoration: none; font-size: 9px; font-weight: 800; }
@media (max-width: 900px) { .admin-booking-info-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .admin-booking-search-form { grid-template-columns: 1fr; } .admin-booking-search-form button { min-height: 40px; } .admin-booking-info-grid { grid-template-columns: 1fr; } }

/* =========================================================
   GUIMARASGO ADMIN REDESIGN OVERRIDES
   UI + PRESENTATION ONLY
========================================================= */

.admin-dashboard,
.admin-dashboard button,
.admin-dashboard input,
.admin-dashboard select,
.admin-dashboard textarea {
    font-family: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
}

.admin-dashboard {
    background: #f7f8fa;
    color: #171717;
}

.sidebar {
    width: 240px;
    padding: 24px 14px;
    background: #ffffff;
    border-right: 1px solid rgba(17, 24, 39, .08);
    box-shadow: 8px 0 30px rgba(17, 24, 39, .025);
}

.sidebar-title {
    color: #ff861c;
    font-size: 22px;
    letter-spacing: -.7px;
}

.side-item {
    min-height: 46px;
    border-radius: 12px;
    font-size: 12px;
    color: #59616d;
}

.side-item:hover {
    background: #fff8f1;
    color: #e97812;
}

.side-item.active {
    background: linear-gradient(135deg, #fff1df, #fff8f2);
    color: #e97812;
    box-shadow: inset 3px 0 0 #ff861c;
}

.dashboard-content {
    background: #f7f8fa;
}

.dashboard-header {
    min-height: 78px;
    padding: 0 36px;
    background: rgba(255,255,255,.96);
    border-bottom: 1px solid #e9ebef;
}

.dashboard-main {
    padding: 30px 36px 28px;
}

.page-heading h2,
.payments-header h2,
.staff-header h2 {
    font-size: 27px;
    letter-spacing: -.8px;
}

.cards {
    gap: 18px;
    margin-bottom: 20px;
}

.stat-card {
    min-height: 132px;
    padding: 20px;
    border-radius: 16px;
    border-color: #e9ebef;
    box-shadow: 0 8px 26px rgba(17,24,39,.045);
}

.stat-card-button:hover {
    border-color: #ffd5ad;
}

.admin-operations-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 16px;
    margin: 0 0 18px;
}

.admin-operation-card {
    min-height: 112px;
    display: flex;
    align-items: flex-start;
    gap: 13px;
    padding: 18px;
    background: #fff;
    border: 1px solid #e9ebef;
    border-radius: 15px;
    box-shadow: 0 7px 22px rgba(17,24,39,.035);
}

.admin-operation-icon {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    font-size: 14px;
    font-weight: 800;
}

.admin-operation-icon.teal { background:#e8f8f6; color:#13877e; }
.admin-operation-icon.orange { background:#fff0e1; color:#ef7d16; }
.admin-operation-icon.green { background:#eaf8ef; color:#16804a; }
.admin-operation-icon.purple { background:#f1edff; color:#6952b8; }

.admin-operation-card span,
.admin-operation-card small {
    display:block;
}

.admin-operation-card span {
    color:#707783;
    font-size:10px;
    font-weight:600;
    margin-bottom:5px;
}

.admin-operation-card strong {
    display:block;
    color:#171717;
    font-size:21px;
    line-height:1.15;
    margin-bottom:5px;
}

.admin-operation-card small {
    color:#a0a6af;
    font-size:9px;
    line-height:1.35;
}

.admin-departure-panel {
    margin: 0 0 20px;
    padding: 20px;
    background:#fff;
    border:1px solid #e9ebef;
    border-radius:16px;
    box-shadow:0 8px 26px rgba(17,24,39,.035);
}

.admin-departure-header {
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:16px;
    margin-bottom:14px;
}

.admin-departure-header h3 {
    margin:0 0 4px;
    font-size:17px;
    letter-spacing:-.3px;
}

.admin-departure-header p {
    margin:0;
    color:#8b929d;
    font-size:10px;
}

.admin-departure-list {
    display:flex;
    flex-direction:column;
    gap:8px;
}

.admin-departure-row {
    min-height:58px;
    display:grid;
    grid-template-columns:90px minmax(0,1fr) auto;
    align-items:center;
    gap:15px;
    padding:10px 12px;
    border:1px solid #eef0f2;
    border-radius:11px;
    background:#fcfcfd;
}

.admin-departure-time {
    color:#e97812;
    font-size:12px;
    font-weight:800;
}

.admin-departure-vessel strong,
.admin-departure-vessel span { display:block; }
.admin-departure-vessel strong { font-size:11px; color:#222; }
.admin-departure-vessel span { margin-top:2px; color:#9299a4; font-size:9px; }

.admin-departure-status {
    padding:6px 9px;
    border-radius:999px;
    font-size:9px;
    font-weight:700;
    white-space:nowrap;
}

.admin-departure-status.open { background:#eaf8ef; color:#16804a; }
.admin-departure-status.closed { background:#fff0f0; color:#d32f2f; }
.admin-departure-empty { padding:18px; text-align:center; color:#969ca6; font-size:11px; }

.admin-booking-search-card,
.admin-capacity-card,
.payments-container,
.staff-page {
    border-radius:16px;
}

.admin-booking-search-card,
.admin-capacity-card {
    border-color:#e9ebef;
    box-shadow:0 8px 26px rgba(17,24,39,.035);
}

.staff-page {
    width:100%;
}

.staff-header {
    display:flex;
    align-items:flex-end;
    justify-content:space-between;
    gap:20px;
    margin-bottom:18px;
}

.staff-header-actions {
    display:flex;
    align-items:center;
    gap:8px;
}

.staff-add-button,
.refresh-button {
    border-radius:10px;
}

.staff-add-button {
    background:linear-gradient(135deg,#ff861c,#ff9b3d);
    box-shadow:0 7px 18px rgba(255,134,28,.18);
}

.staff-summary-card {
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:1px;
    margin-bottom:14px;
    overflow:hidden;
    background:#e9ebef;
    border:1px solid #e9ebef;
    border-radius:15px;
}

.staff-summary-card > div {
    min-height:92px;
    padding:17px 20px;
    background:#fff;
}

.staff-summary-card span { display:block; color:#7e858f; font-size:10px; margin-bottom:8px; }
.staff-summary-card strong { color:#171717; font-size:24px; }

.staff-toolbar {
    display:flex;
    align-items:center;
    gap:10px;
    margin-bottom:12px;
}

.staff-search-wrap {
    min-height:42px;
    flex:1;
    display:flex;
    align-items:center;
    gap:8px;
    padding:0 12px;
    background:#fff;
    border:1px solid #e2e5e9;
    border-radius:10px;
}

.staff-search-wrap span { color:#8d949e; font-size:17px; }
.staff-search-wrap input { width:100%; border:0; outline:0; color:#222; font-size:11px; background:transparent; }
.staff-search-wrap input::placeholder { color:#a8adb5; }

.staff-filter-select {
    min-height:42px;
    padding:0 12px;
    border:1px solid #e2e5e9;
    border-radius:10px;
    background:#fff;
    color:#444;
    font-size:11px;
    outline:none;
}

.staff-result-count {
    color:#8e949d;
    font-size:10px;
    white-space:nowrap;
}

.staff-table-card {
    border:1px solid #e9ebef;
    border-radius:15px;
    background:#fff;
    box-shadow:0 8px 26px rgba(17,24,39,.035);
    overflow:hidden;
}

.staff-table th {
    background:#fafbfc;
    color:#737b86;
    font-size:9px;
    letter-spacing:.5px;
    text-transform:uppercase;
}

.staff-table td { font-size:10px; border-top-color:#f0f1f3; }
.staff-table tbody tr:hover { background:#fffaf5; }

.staff-status.active { background:#eaf8ef; color:#16804a; }
.staff-status.inactive { background:#f2f3f5; color:#737982; }

.staff-modal {
    width:min(500px, calc(100% - 30px));
    border-radius:18px;
    border:1px solid rgba(255,134,28,.12);
    box-shadow:0 25px 70px rgba(18,25,38,.18);
}

.staff-modal input:focus,
.staff-modal select:focus {
    border-color:#ff861c;
    box-shadow:0 0 0 3px rgba(255,134,28,.10);
}

.notification {
    border-radius:12px;
    box-shadow:0 14px 40px rgba(17,24,39,.15);
}

@media (max-width: 1050px) {
    .admin-operations-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
    .cards { grid-template-columns:repeat(2,minmax(0,1fr)); }
}

@media (max-width: 760px) {
    .sidebar { width:76px; padding:18px 8px; }
    .brand-section { padding:0 7px; }
    .sidebar-title { font-size:0; }
    .sidebar-title::after { content:"GG"; font-size:18px; }
    .admin-label { display:none; }
    .side-item { justify-content:center; padding:0 6px; font-size:0; }
    .side-item::before { content:"•"; font-size:18px; }
    .side-item span { display:none; }
    .pending-badge { display:none; }
    .dashboard-header { padding:0 18px; }
    .dashboard-main { padding:22px 16px; }
    .admin-operations-grid { grid-template-columns:1fr 1fr; }
    .staff-header { align-items:stretch; flex-direction:column; }
    .staff-toolbar { flex-wrap:wrap; }
    .staff-search-wrap { min-width:100%; }
}

@media (max-width: 520px) {
    .cards,
    .admin-operations-grid,
    .staff-summary-card { grid-template-columns:1fr; }
    .admin-departure-row { grid-template-columns:72px minmax(0,1fr); }
    .admin-departure-status { grid-column:2; justify-self:start; }
    .staff-header-actions { width:100%; }
    .staff-header-actions > * { flex:1; }
}


/* =========================================================
   GUIMARASGO ADMIN DASHBOARD - FULL RESPONSIVE OVERRIDES
   Layout/presentation only. Existing functionality is unchanged.
========================================================= */

.admin-dashboard {
    width: 100% !important;
    min-height: 100vh !important;
    display: flex !important;
    position: relative !important;
    overflow-x: hidden !important;
}

.admin-dashboard > .sidebar {
    position: fixed !important;
    inset: 0 auto 0 0 !important;
    width: 240px !important;
    min-width: 240px !important;
    max-width: 240px !important;
    height: 100vh !important;
    min-height: 100vh !important;
    flex: 0 0 240px !important;
    display: flex !important;
    flex-direction: column !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    z-index: 1000 !important;
}

.admin-dashboard > .dashboard-content {
    width: calc(100% - 240px) !important;
    max-width: none !important;
    min-width: 0 !important;
    margin-left: 240px !important;
    min-height: 100vh !important;
    box-sizing: border-box !important;
}

.dashboard-main {
    width: 100% !important;
    max-width: none !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
}

.cards,
.admin-operations-grid,
.admin-capacity-grid,
.staff-summary-card {
    width: 100%;
    min-width: 0;
}

.admin-booking-search-form,
.admin-booking-info-grid,
.payment-details,
.staff-form-grid {
    min-width: 0;
}

.admin-booking-search-form input,
.admin-booking-search-form button,
.staff-form-group input,
.staff-form-group select,
.staff-form-group textarea {
    min-width: 0;
    max-width: 100%;
}

.staff-table-wrap {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.staff-table-wrap table {
    min-width: 680px;
}

.payment-card,
.rejected-card,
.empty-payment-card,
.empty-staff-card,
.admin-capacity-card,
.admin-ferry-capacity-card,
.admin-departure-panel,
.admin-booking-search-card,
.staff-table-card,
.system-card,
.welcome-card {
    min-width: 0;
    max-width: 100%;
}

/* =========================
   LARGE TABLET / LAPTOP
========================= */
@media (max-width: 1100px) {
    .admin-dashboard > .sidebar {
        width: 210px !important;
        min-width: 210px !important;
        max-width: 210px !important;
        flex-basis: 210px !important;
    }

    .admin-dashboard > .dashboard-content {
        width: calc(100% - 210px) !important;
        margin-left: 210px !important;
    }

    .dashboard-header {
        padding-left: 24px !important;
        padding-right: 24px !important;
    }

    .dashboard-main {
        padding-left: 24px !important;
        padding-right: 24px !important;
    }

    .cards {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .admin-operations-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .admin-booking-info-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
}

/* =========================
   TABLET
========================= */
@media (max-width: 850px) {
    .admin-dashboard > .sidebar {
        width: 190px !important;
        min-width: 190px !important;
        max-width: 190px !important;
        flex-basis: 190px !important;
        padding-left: 10px !important;
        padding-right: 10px !important;
    }

    .admin-dashboard > .dashboard-content {
        width: calc(100% - 190px) !important;
        margin-left: 190px !important;
    }

    .sidebar-title {
        font-size: 19px !important;
    }

    .side-item {
        font-size: 11px !important;
    }

    .dashboard-header {
        min-height: 68px !important;
        padding: 0 18px !important;
    }

    .dashboard-main {
        padding: 22px 18px 20px !important;
    }

    .page-heading h2 {
        font-size: 22px !important;
    }

    .cards {
        gap: 10px !important;
    }

    .stat-card {
        min-width: 0 !important;
    }

    .payment-details {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
}

/* =========================
   MOBILE - TOP NAVIGATION
========================= */
@media (max-width: 700px) {
    .admin-dashboard {
        display: block !important;
        min-height: 100vh !important;
    }

    .admin-dashboard > .sidebar {
        position: fixed !important;
        inset: 0 0 auto 0 !important;
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
        height: 64px !important;
        min-height: 64px !important;
        flex: none !important;
        padding: 8px 10px !important;
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 8px !important;
        overflow: hidden !important;
        border-right: none !important;
        border-bottom: 1px solid #e5e7eb !important;
        box-shadow: 0 3px 16px rgba(15, 23, 42, 0.08) !important;
    }

    .brand-section {
        display: none !important;
    }

    .sidebar-navigation {
        flex: 1 1 auto !important;
        width: auto !important;
        min-width: 0 !important;
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 6px !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        scrollbar-width: none !important;
        -webkit-overflow-scrolling: touch !important;
    }

    .sidebar-navigation::-webkit-scrollbar {
        display: none !important;
    }

    .side-item {
        width: auto !important;
        min-width: max-content !important;
        max-width: none !important;
        min-height: 40px !important;
        height: 40px !important;
        padding: 0 12px !important;
        flex: 0 0 auto !important;
        white-space: nowrap !important;
        font-size: 10px !important;
    }

    .side-item span {
        width: auto !important;
        white-space: nowrap !important;
    }

    .pending-badge {
        flex: 0 0 auto !important;
    }

    .sidebar-spacer {
        display: none !important;
    }

    .logout-button {
        width: auto !important;
        min-width: 68px !important;
        height: 40px !important;
        min-height: 40px !important;
        margin: 0 !important;
        padding: 0 12px !important;
        flex: 0 0 auto !important;
    }

    .admin-dashboard > .dashboard-content {
        width: 100% !important;
        min-width: 0 !important;
        margin-left: 0 !important;
        padding-top: 64px !important;
    }

    .dashboard-header {
        min-height: 68px !important;
        padding: 10px 15px !important;
    }

    .dashboard-header h1 {
        font-size: 17px !important;
    }

    .dashboard-header p {
        font-size: 9px !important;
    }

    .admin-badge {
        min-width: 50px !important;
        height: 26px !important;
        padding: 0 9px !important;
        font-size: 8px !important;
    }

    .dashboard-main {
        padding: 18px 12px 24px !important;
    }

    .page-heading h2 {
        font-size: 20px !important;
    }

    .page-heading p {
        font-size: 9px !important;
    }

    .cards,
    .admin-operations-grid,
    .payment-details,
    .admin-booking-info-grid,
    .staff-summary-card {
        grid-template-columns: 1fr !important;
    }

    .cards {
        gap: 10px !important;
    }

    .stat-card,
    .admin-operation-card {
        min-height: 92px !important;
    }

    .admin-departure-header,
    .admin-booking-search-header,
    .staff-header {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 12px !important;
    }

    .admin-departure-header .refresh-button,
    .staff-header-actions,
    .admin-booking-search-form {
        width: 100% !important;
    }

    .admin-booking-search-form {
        grid-template-columns: 1fr !important;
    }

    .admin-booking-search-form button {
        width: 100% !important;
        min-height: 40px !important;
    }

    .admin-departure-row {
        grid-template-columns: 1fr !important;
        gap: 8px !important;
        align-items: flex-start !important;
    }

    .admin-departure-status {
        justify-self: flex-start !important;
    }

    .staff-header-actions {
        display: flex !important;
        flex-wrap: wrap !important;
    }

    .staff-header-actions .refresh-button,
    .staff-header-actions .staff-add-button {
        flex: 1 1 140px !important;
    }

    .payment-card-header {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 10px !important;
    }

    .payment-card {
        overflow: hidden !important;
    }

    .modal-overlay,
    .logout-modal-overlay {
        padding: 12px !important;
    }

    .confirm-modal,
    .logout-modal,
    .staff-modal,
    .ferry-confirm-modal {
        width: min(100%, 520px) !important;
        max-width: 100% !important;
        max-height: calc(100vh - 24px) !important;
        overflow-y: auto !important;
    }
}

/* =========================
   SMALL PHONES
========================= */
@media (max-width: 480px) {
    .admin-dashboard > .sidebar {
        height: 58px !important;
        min-height: 58px !important;
        padding: 6px 7px !important;
    }

    .admin-dashboard > .dashboard-content {
        padding-top: 58px !important;
    }

    .side-item {
        min-height: 36px !important;
        height: 36px !important;
        padding: 0 10px !important;
        font-size: 9px !important;
        border-radius: 9px !important;
    }

    .logout-button {
        min-width: 60px !important;
        height: 36px !important;
        min-height: 36px !important;
        padding: 0 9px !important;
        font-size: 9px !important;
    }

    .dashboard-header {
        min-height: 62px !important;
        padding: 8px 12px !important;
    }

    .dashboard-header h1 {
        font-size: 15px !important;
    }

    .dashboard-header p {
        font-size: 8px !important;
    }

    .admin-badge {
        min-width: 45px !important;
        height: 23px !important;
        padding: 0 7px !important;
        font-size: 7px !important;
    }

    .dashboard-main {
        padding: 15px 10px 22px !important;
    }

    .page-heading h2 {
        font-size: 18px !important;
    }

    .stat-card {
        padding: 13px !important;
    }

    .stat-card strong {
        font-size: 21px !important;
    }

    .admin-operation-card {
        padding: 13px !important;
    }

    .admin-departure-panel,
    .admin-booking-search-card {
        padding: 13px !important;
    }

    .admin-booking-info-grid > div {
        min-width: 0 !important;
    }
}

/* =========================
   VERY SMALL PHONES
========================= */
@media (max-width: 360px) {
    .sidebar-navigation {
        gap: 4px !important;
    }

    .side-item {
        padding: 0 8px !important;
        font-size: 8px !important;
    }

    .logout-button {
        min-width: 54px !important;
        padding: 0 7px !important;
        font-size: 8px !important;
    }

    .dashboard-header h1 {
        font-size: 14px !important;
    }

    .admin-badge {
        display: none !important;
    }
}



/* =========================================================
   GUIMARASGO - MOBILE HAMBURGER NAVIGATION
   Mobile-only presentation. Desktop/tablet layout is unchanged.
========================================================= */
.mobile-admin-topbar,
.mobile-sidebar-overlay {
    display: none;
}

@media (max-width: 700px) {
    .mobile-admin-topbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.98);
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 3px 16px rgba(15, 23, 42, 0.08);
        z-index: 1200;
    }

    .mobile-menu-button {
        width: 42px;
        height: 42px;
        min-width: 42px;
        padding: 0;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        cursor: pointer;
    }

    .mobile-menu-button span {
        display: block;
        width: 19px;
        height: 2px;
        border-radius: 999px;
        background: #273142;
        transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .mobile-menu-button.open span:nth-child(1) {
        transform: translateY(6px) rotate(45deg);
    }

    .mobile-menu-button.open span:nth-child(2) {
        opacity: 0;
    }

    .mobile-menu-button.open span:nth-child(3) {
        transform: translateY(-6px) rotate(-45deg);
    }

    .mobile-admin-brand {
        min-width: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        line-height: 1.05;
    }

    .mobile-admin-brand strong {
        color: #f28c28;
        font-size: 16px;
        font-weight: 900;
        white-space: nowrap;
    }

    .mobile-admin-brand span {
        margin-top: 3px;
        color: #8a8f98;
        font-size: 7px;
        font-weight: 800;
        letter-spacing: 1.2px;
        white-space: nowrap;
    }

    .mobile-admin-role {
        min-width: 46px;
        height: 25px;
        padding: 0 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #fff0df;
        color: #f28c28;
        font-size: 7px;
        font-weight: 800;
        letter-spacing: 0.5px;
    }

    .admin-dashboard > .sidebar {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        bottom: 0 !important;
        right: auto !important;
        width: 280px !important;
        min-width: 280px !important;
        max-width: 280px !important;
        height: 100vh !important;
        min-height: 100vh !important;
        padding: 76px 14px 18px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        background: #ffffff !important;
        border-right: 1px solid #e5e7eb !important;
        border-bottom: none !important;
        box-shadow: 12px 0 35px rgba(15, 23, 42, 0.13) !important;
        transform: translateX(-105%) !important;
        transition: transform 0.24s ease !important;
        z-index: 1250 !important;
    }

    .admin-dashboard > .sidebar.mobile-open {
        transform: translateX(0) !important;
    }

    .admin-dashboard > .sidebar .brand-section {
        display: block !important;
        flex: 0 0 auto !important;
        padding: 0 10px !important;
        margin-bottom: 26px !important;
    }

    .admin-dashboard > .sidebar .sidebar-navigation {
        width: 100% !important;
        min-width: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        justify-content: flex-start !important;
        gap: 6px !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
    }

    .admin-dashboard > .sidebar .side-item {
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
        min-height: 46px !important;
        height: 46px !important;
        padding: 0 13px !important;
        flex: 0 0 auto !important;
        justify-content: flex-start !important;
        white-space: normal !important;
        font-size: 12px !important;
    }

    .admin-dashboard > .sidebar .side-item span {
        width: 100% !important;
        white-space: normal !important;
    }

    .admin-dashboard > .sidebar .sidebar-spacer {
        display: block !important;
        flex: 1 1 auto !important;
    }

    .admin-dashboard > .sidebar .logout-button {
        width: 100% !important;
        min-width: 0 !important;
        height: 42px !important;
        min-height: 42px !important;
        margin: 0 !important;
        padding: 0 12px !important;
        flex: 0 0 auto !important;
    }

    .mobile-sidebar-overlay {
        position: fixed;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        padding: 0;
        border: 0;
        background: rgba(15, 23, 42, 0.38);
        cursor: pointer;
        z-index: 1240;
    }

    .admin-dashboard > .dashboard-content {
        width: 100% !important;
        margin-left: 0 !important;
        padding-top: 60px !important;
    }

    .dashboard-header {
        min-height: 66px !important;
    }
}

@media (max-width: 400px) {
    .mobile-admin-topbar {
        height: 56px;
        padding: 7px 9px;
    }

    .mobile-menu-button {
        width: 39px;
        height: 39px;
        min-width: 39px;
    }

    .mobile-admin-brand strong {
        font-size: 14px;
    }

    .mobile-admin-brand span {
        font-size: 6px;
    }

    .mobile-admin-role {
        min-width: 42px;
        height: 23px;
        font-size: 6px;
    }

    .admin-dashboard > .dashboard-content {
        padding-top: 56px !important;
    }
}



/* =========================================================
   MOBILE DRAWER TEXT FIX
   Keeps hamburger drawer clean and readable.
========================================================= */
@media (max-width: 700px) {
    .admin-dashboard > .sidebar .sidebar-title {
        display: block !important;
        font-size: 22px !important;
        line-height: 1.1 !important;
        color: #ff861c !important;
        white-space: nowrap !important;
    }

    .admin-dashboard > .sidebar .sidebar-title::after {
        content: none !important;
        display: none !important;
    }

    .admin-dashboard > .sidebar .admin-label {
        display: block !important;
        margin-top: 5px !important;
        color: #999999 !important;
        font-size: 8px !important;
        font-weight: 800 !important;
        letter-spacing: 1.5px !important;
    }

    .admin-dashboard > .sidebar .side-item {
        font-size: 12px !important;
        justify-content: flex-start !important;
        text-align: left !important;
    }

    .admin-dashboard > .sidebar .side-item::before {
        content: none !important;
        display: none !important;
    }

    .admin-dashboard > .sidebar .side-item span {
        display: block !important;
        width: auto !important;
        flex: 1 1 auto !important;
        text-align: left !important;
        white-space: normal !important;
    }

    .admin-dashboard > .sidebar .pending-badge {
        display: flex !important;
        flex: 0 0 auto !important;
    }
}

`}</style>

        </main>
    );
};

export default AdminDashboard;