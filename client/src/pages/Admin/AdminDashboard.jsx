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
    // FERRY SCHEDULE MANAGEMENT
    // =========================================================
    // The existing backend currently exposes the fixed ferry
    // schedule through the capacity endpoint. These Admin-side
    // controls add the Schedule Management UI without changing
    // the existing booking/payment flow.
    // =========================================================

    const [scheduleDate, setScheduleDate] = useState(() => {
        const now = new Date();
        return [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0")
        ].join("-");
    });

    const [scheduleRouteFilter, setScheduleRouteFilter] =
        useState("all");

    const [selectedScheduleId, setSelectedScheduleId] =
        useState(null);

    const [showScheduleModal, setShowScheduleModal] =
        useState(false);

    const [scheduleModalMode, setScheduleModalMode] =
        useState("add");

    const [scheduleForm, setScheduleForm] = useState({
        vesselName: "",
        route: "Iloilo → Guimaras",
        date: "",
        departureTime: "",
        arrivalTime: "",
        passengerCapacity: 100,
        motorcycleCapacity: 10
    });

    const [scheduleActionLoading, setScheduleActionLoading] =
        useState(false);

    const [scheduleNotice, setScheduleNotice] = useState("");

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
    // LOAD SCHEDULES FOR A SELECTED DATE
    // =========================================================

    const loadScheduleCapacity = async (dateValue) => {
        const requestedDate =
            String(dateValue || "").trim() || getToday();

        const token =
            localStorage.getItem("adminToken");

        if (!token) {
            setCapacityError("Administrator authentication is required.");
            return;
        }

        try {
            setCapacityLoading(true);
            setCapacityError("");

            const response = await fetch(
                `${API_URL}/bookings/schedules?date=${encodeURIComponent(requestedDate)}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    cache: "no-store"
                }
            );

            const contentType =
                response.headers.get("content-type") || "";

            const data =
                contentType.includes("application/json")
                    ? await response.json()
                    : null;

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Unable to load ferry schedules."
                );
            }

            const schedules =
                Array.isArray(data?.schedules)
                    ? data.schedules
                    : Array.isArray(data?.capacities)
                        ? data.capacities
                        : [];

            setFerryCapacities(schedules);
        } catch (error) {
            console.error(
                "Schedule loading error:",
                error
            );

            setFerryCapacities([]);
            setCapacityError(
                error.message ||
                "Unable to load ferry schedules."
            );
        } finally {
            setCapacityLoading(false);
        }
    };

    useEffect(() => {
        if (activeView === "schedules") {
            loadScheduleCapacity(scheduleDate);
        }
    }, [activeView, scheduleDate]);

    // =========================================================
    // SCHEDULE HELPERS
    // =========================================================

    const formatScheduleDate = (value) => {
        if (!value) return "—";

        const parsed = new Date(`${value}T00:00:00`);

        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        return parsed.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "2-digit"
        });
    };

    const getScheduleRoute = (item, index = 0) => {
        return (
            item?.route ||
            item?.routeName ||
            item?.originDestination ||
            (index % 2 === 0
                ? "Iloilo → Guimaras"
                : "Guimaras → Iloilo")
        );
    };

    const getScheduleArrival = (item) => {
        if (item?.arrivalTime || item?.arrival) {
            return item.arrivalTime || item.arrival;
        }

        const departure = String(
            item?.departureTime ||
            item?.time ||
            ""
        ).trim().toUpperCase();

        const match = departure.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
        );

        if (!match) return "—";

        let hour = Number(match[1]);
        const minute = Number(match[2]);
        const period = match[3];

        if (period === "AM" && hour === 12) {
            hour = 0;
        }

        if (period === "PM" && hour !== 12) {
            hour += 12;
        }

        const arrivalTotal =
            (hour * 60 + minute + 30) % (24 * 60);

        let arrivalHour = Math.floor(
            arrivalTotal / 60
        );

        const arrivalMinute = arrivalTotal % 60;

        const arrivalPeriod =
            arrivalHour >= 12 ? "PM" : "AM";

        if (arrivalHour === 0) {
            arrivalHour = 12;
        } else if (arrivalHour > 12) {
            arrivalHour -= 12;
        }

        return (
            `${arrivalHour}:${String(arrivalMinute).padStart(2, "0")} ` +
            arrivalPeriod
        );
    };

    const scheduleRows = ferryCapacities.map((ferry, index) => ({
        ...ferry,
        _scheduleSource:
            ferry?.isDefault ? "system" : "admin",
        _scheduleId:
            ferry?.id ||
            ferry?._id ||
            `schedule-${index}`,
        date:
            ferry?.date ||
            scheduleDate,
        route:
            getScheduleRoute(ferry, index),
        arrivalTime:
            ferry?.arrivalTime ||
            getScheduleArrival(ferry),
        passengerCapacity:
            Number(ferry?.passengerCapacity) || 100,
        motorcycleCapacity:
            Number(ferry?.motorcycleCapacity) ||
            Number(ferry?.vehicleCapacity) ||
            10,
        passengers:
            Number(ferry?.passengers) || 0,
        motorcycles:
            Number(ferry?.motorcycles) ||
            Number(ferry?.vehicles) ||
            0,
        manualClosed:
            Boolean(ferry?.manualClosed)
    }));

    const filteredScheduleRows =
        scheduleRows
            .filter(item => {
                if (scheduleRouteFilter === "all") {
                    return true;
                }

                return (
                    String(item?.route || "")
                        .trim()
                        .toLowerCase() ===
                    scheduleRouteFilter
                        .trim()
                        .toLowerCase()
                );
            })
            .sort((a, b) => {
                const timeA = String(
                    a?.time ||
                    a?.departureTime ||
                    ""
                );

                const timeB = String(
                    b?.time ||
                    b?.departureTime ||
                    ""
                );

                return timeA.localeCompare(timeB);
            });

    const selectedSchedule =
        filteredScheduleRows.find(
            item =>
                item._scheduleId === selectedScheduleId
        ) ||
        filteredScheduleRows[0] ||
        null;

    const openAddScheduleModal = () => {
        setScheduleModalMode("add");
        setScheduleForm({
            vesselName: "",
            route: "Iloilo → Guimaras",
            date: scheduleDate,
            departureTime: "",
            arrivalTime: "",
            passengerCapacity: 100,
            motorcycleCapacity: 10
        });
        setScheduleNotice("");
        setShowScheduleModal(true);
    };

    const openEditScheduleModal = () => {
        if (!selectedSchedule) {
            showNotification(
                "Please select a trip to edit.",
                "error"
            );
            return;
        }

        setScheduleModalMode("edit");

        setScheduleForm({
            vesselName:
                selectedSchedule?.vesselName || "",
            route:
                selectedSchedule?.route ||
                "Iloilo → Guimaras",
            date:
                selectedSchedule?.date ||
                scheduleDate,
            departureTime:
                normalizeScheduleTime(
                    selectedSchedule?.time ||
                    selectedSchedule?.departureTime ||
                    ""
                ),
            arrivalTime:
                normalizeScheduleTime(
                    selectedSchedule?.arrivalTime ||
                    selectedSchedule?.arrival ||
                    ""
                ),
            passengerCapacity:
                Number(
                    selectedSchedule?.passengerCapacity
                ) || 100,
            motorcycleCapacity:
                Number(
                    selectedSchedule?.motorcycleCapacity
                ) ||
                Number(
                    selectedSchedule?.vehicleCapacity
                ) ||
                10
        });

        setScheduleNotice("");
        setShowScheduleModal(true);
    };

    const normalizeScheduleTime = (value) => {
        const text = String(value || "").trim();

        if (/^\d{2}:\d{2}$/.test(text)) {
            return text;
        }

        const match = text.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
        );

        if (!match) {
            return "";
        }

        let hour = Number(match[1]);
        const minute = Number(match[2]);
        const period = match[3].toUpperCase();

        if (period === "AM" && hour === 12) {
            hour = 0;
        }

        if (period === "PM" && hour !== 12) {
            hour += 12;
        }

        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    };

    const getScheduleTimeOptions = () => {
        const options = [];

        for (
            let minutes = 3 * 60 + 30;
            minutes <= 19 * 60 + 30;
            minutes += 30
        ) {
            const hour24 = Math.floor(minutes / 60);
            const minute = minutes % 60;
            const hour12 = hour24 % 12 || 12;
            const period = hour24 >= 12 ? "PM" : "AM";

            options.push({
                value:
                    `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
                label:
                    `${hour12}:${String(minute).padStart(2, "0")} ${period}`
            });
        }

        return options;
    };

    const scheduleTimeOptions = getScheduleTimeOptions();

    const scheduleArrivalTimeOptions = [
        ...scheduleTimeOptions,
        {
            value: "20:00",
            label: "8:00 PM"
        }
    ];

    const getArrivalFromDeparture = (value) => {
        const normalized = normalizeScheduleTime(value);

        if (!normalized) {
            return "";
        }

        const [hoursText, minutesText] = normalized.split(":");
        const total =
            Number(hoursText) * 60 +
            Number(minutesText) +
            30;

        if (total > 24 * 60 - 1) {
            return "";
        }

        const hour = Math.floor(total / 60);
        const minute = total % 60;

        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    };

    const closeScheduleModal = () => {
        if (scheduleActionLoading) return;

        setShowScheduleModal(false);
        setScheduleNotice("");
    };

    const handleScheduleFormChange = (event) => {
        const { name, value } = event.target;

        setScheduleForm(previous => {
            const next = {
                ...previous,
                [name]:
                    name === "passengerCapacity" ||
                    name === "motorcycleCapacity"
                        ? Number(value)
                        : value
            };

            if (
                name === "departureTime" &&
                !previous.arrivalTime
            ) {
                next.arrivalTime =
                    getArrivalFromDeparture(value);
            }

            return next;
        });
    };

    const saveSchedule = async (event) => {
        event.preventDefault();

        const vesselName =
            scheduleForm.vesselName.trim();

        const token =
            localStorage.getItem("adminToken");

        if (!token) {
            setScheduleNotice(
                "Administrator authentication is required."
            );
            return;
        }

        if (!vesselName) {
            setScheduleNotice(
                "Ferry/vessel name is required."
            );
            return;
        }

        if (!scheduleForm.date) {
            setScheduleNotice(
                "Travel date is required."
            );
            return;
        }

        if (!scheduleForm.departureTime) {
            setScheduleNotice(
                "Departure time is required."
            );
            return;
        }

        setScheduleActionLoading(true);

        try {
            const payload = {
                vesselName,
                route: scheduleForm.route,
                date: scheduleForm.date,
                departureTime:
                    normalizeScheduleTime(
                        scheduleForm.departureTime
                    ),
                arrivalTime:
                    normalizeScheduleTime(
                        scheduleForm.arrivalTime
                    ),
                passengerCapacity:
                    Number.isFinite(Number(scheduleForm.passengerCapacity))
                        ? Number(scheduleForm.passengerCapacity)
                        : 100,
                motorcycleCapacity:
                    Number.isFinite(Number(scheduleForm.motorcycleCapacity))
                        ? Number(scheduleForm.motorcycleCapacity)
                        : 10
            };

            const isEdit =
                scheduleModalMode === "edit" &&
                Boolean(selectedSchedule?._scheduleId);

            const url = isEdit
                ? `${API_URL}/bookings/schedules/${encodeURIComponent(selectedSchedule._scheduleId)}`
                : `${API_URL}/bookings/schedules`;

            const response = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const contentType =
                response.headers.get("content-type") || "";

            const data =
                contentType.includes("application/json")
                    ? await response.json()
                    : null;

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Unable to save the ferry schedule."
                );
            }

            setScheduleDate(payload.date);
            setScheduleRouteFilter("all");
            setShowScheduleModal(false);
            setScheduleNotice("");

            await loadScheduleCapacity(payload.date);

            showNotification(
                isEdit
                    ? "Schedule updated successfully."
                    : "Trip added successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "Schedule save error:",
                error
            );

            setScheduleNotice(
                error.message ||
                "Unable to save the schedule."
            );
        } finally {
            setScheduleActionLoading(false);
        }
    };

    const deleteSelectedSchedule = async () => {
        if (!selectedSchedule) {
            showNotification(
                "Please select a trip to remove.",
                "error"
            );
            return;
        }

        if (selectedSchedule._scheduleSource !== "admin") {
            showNotification(
                "Default ferry schedules cannot be removed. You can edit them instead.",
                "error"
            );
            return;
        }

        const token =
            localStorage.getItem("adminToken");

        if (!token) {
            showNotification(
                "Administrator authentication is required.",
                "error"
            );
            return;
        }

        try {
            setScheduleActionLoading(true);

            const response = await fetch(
                `${API_URL}/bookings/schedules/${encodeURIComponent(selectedSchedule._scheduleId)}`,
                {
                    method: "DELETE",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const contentType =
                response.headers.get("content-type") || "";

            const data =
                contentType.includes("application/json")
                    ? await response.json()
                    : null;

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Unable to remove the ferry schedule."
                );
            }

            setSelectedScheduleId(null);
            await loadScheduleCapacity(scheduleDate);

            showNotification(
                "Schedule removed successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "Schedule delete error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to remove the ferry schedule.",
                "error"
            );
        } finally {
            setScheduleActionLoading(false);
        }
    };

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

    const selectedTrip = nextDepartures[0] || ferryCapacities[0] || null;
    const selectedTripPassengers = Number(selectedTrip?.passengers) || 0;
    const selectedTripPassengerCapacity = Number(selectedTrip?.passengerCapacity) || 0;
    const selectedTripMotorcycles = Number(selectedTrip?.motorcycles) || Number(selectedTrip?.motorcycleCount) || 0;
    const selectedTripMotorcycleCapacity = Number(selectedTrip?.motorcycleCapacity) || Number(selectedTrip?.motorcycleLimit) || 0;
    const selectedTripPassengerRemaining = Math.max(0, selectedTripPassengerCapacity - selectedTripPassengers);
    const selectedTripMotorcycleRemaining = Math.max(0, selectedTripMotorcycleCapacity - selectedTripMotorcycles);
    const selectedTripClosed = Boolean(selectedTrip?.manualClosed) ||
        (selectedTripPassengerCapacity > 0 && selectedTripPassengerRemaining <= 0);
    const selectedTripRoute = selectedTrip?.route || selectedTrip?.routeName || selectedTrip?.direction || "Iloilo → Guimaras";
    const selectedTripArrival = selectedTrip?.arrivalTime || selectedTrip?.arrival || selectedTrip?.estimatedArrival || "—";

    const formatLongDate = (date = new Date()) =>
        date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

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
         * Some versions of the booking data
         * may return the proof directly as a string.
         */
        if (typeof proof === "string") {

            if (
                proof.startsWith("http://") ||
                proof.startsWith("https://")
            ) {
                return proof;
            }

            return `${API_ORIGIN}${proof}`;
        }

        /*
         * Current Booking schema stores paymentProof
         * as an object containing url.
         */
        if (proof.url) {

            if (
                proof.url.startsWith("http://") ||
                proof.url.startsWith("https://")
            ) {
                return proof.url;
            }

            return `${API_ORIGIN}${proof.url}`;
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
                OPERATIONS SIDEBAR
            ===================================================== */}

            <button
                type="button"
                className="mobile-menu-toggle"
                aria-label={mobileMenuOpen ? "Close admin menu" : "Open admin menu"}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((open) => !open)}
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {mobileMenuOpen && (
                <button
                    type="button"
                    className="mobile-sidebar-overlay"
                    aria-label="Close admin menu"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <aside className={`sidebar ${mobileMenuOpen ? "mobile-menu-open" : ""}`}>
                <div className="operations-brand">
                    <div className="operations-brand-mark" aria-hidden="true">
                        <span>G</span><span>G</span>
                    </div>
                    <strong>GuimarasGo</strong>
                </div>

                <div className="operations-workspace">
                    <span>ADMIN WORKSPACE</span>
                    <strong>Iloilo–Guimaras</strong>
                </div>

                <nav className="sidebar-navigation operations-navigation" aria-label="Admin operations">
                    <button
                        type="button"
                        className={`side-item ${activeView === "dashboard" ? "active" : ""}`}
                        onClick={() => handleViewChange("dashboard")}
                    >
                        <span className="operations-nav-icon" aria-hidden="true">⌂</span>
                        <span>Overview</span>
                    </button>

                    <button
                        type="button"
                        className={`side-item ${activeView === "schedules" ? "active" : ""}`}
                        onClick={() => handleViewChange("schedules")}
                    >
                        <span className="operations-nav-icon" aria-hidden="true">↝</span>
                        <span>Schedules</span>
                    </button>

                    <button type="button" className="side-item" onClick={() => showNotification("Ticket records will be available here.", "success")}>
                        <span className="operations-nav-icon" aria-hidden="true">▤</span>
                        <span>Ticket records</span>
                    </button>

                    <button type="button" className="side-item" onClick={() => showNotification("Passenger records will be available here.", "success")}>
                        <span className="operations-nav-icon" aria-hidden="true">♙</span>
                        <span>Passengers</span>
                    </button>

                    <button
                        type="button"
                        className={`side-item ${activeView === "payments" ? "active" : ""}`}
                        onClick={() => handleViewChange("payments")}
                    >
                        <span className="operations-nav-icon" aria-hidden="true">▤</span>
                        <span>Payments</span>
                        {statistics.pendingPayments > 0 && (
                            <span className="pending-badge">{statistics.pendingPayments}</span>
                        )}
                    </button>

                    <button type="button" className="side-item" onClick={() => showNotification("Boarding records will be available here.", "success")}>
                        <span className="operations-nav-icon" aria-hidden="true">✓</span>
                        <span>Boarding records</span>
                    </button>

                    <button
                        type="button"
                        className={`side-item ${activeView === "staff" ? "active" : ""}`}
                        onClick={() => handleViewChange("staff")}
                    >
                        <span className="operations-nav-icon" aria-hidden="true">♙</span>
                        <span>System records</span>
                    </button>
                </nav>

                <div className="sidebar-spacer"></div>

                <div className="operations-terminal-card">
                    <strong>Iloilo terminal</strong>
                    <span>{formatLongDate()}</span>
                    <small><i></i> Connected</small>
                </div>

                <button type="button" className="operations-admin-account" onClick={() => handleViewChange("staff")}>
                    <span className="operations-admin-avatar" aria-hidden="true">♙</span>
                    <span>
                        <strong>Administrator</strong>
                        <small>Management access</small>
                    </span>
                </button>

                    <div className="operations-sidebar-footer">
                        <button
                            type="button"
                            className="operations-logout-button"
                            onClick={handleLogout}
                        >
                            <span className="operations-logout-icon" aria-hidden="true">↪</span>
                            <span>
                                <strong>Logout</strong>
                                <small>Sign out of administrator</small>
                            </span>
                        </button>
                    </div>
</aside>

            {/* =====================================================
                OPERATIONS CONTENT
            ===================================================== */}

            <section className="dashboard-content operations-content">

                <div className="dashboard-main">


                    {/* =================================================
                        OPERATIONS OVERVIEW
                    ================================================= */}

                    {activeView === "dashboard" && (
                        <div className="operations-overview-page">
                            <div className="operations-page-heading">
                                <div>
                                    <span className="operations-eyebrow">MANAGEMENT</span>
                                    <h2>Operations overview</h2>
                                    <p>Monitor paid tickets, capacity and boarding for the selected trip.</p>
                                </div>
                                <div className="operations-date">
                                    <strong>{formatScheduleDate(scheduleDate)}</strong>
                                    <span>Iloilo ⇄ Guimaras</span>
                                </div>
                            </div>

                            <section className="selected-trip-card">
                                <div className="selected-trip-route">
                                    <strong>{selectedTripRoute}</strong>
                                    <span>
                                        {selectedTrip?.vesselName || "Ferry schedule"}
                                        {selectedTrip?.id ? ` · Trip ${selectedTrip.id}` : ""}
                                        {selectedTrip?.date ? ` · ${formatDate(selectedTrip.date)}` : ""}
                                    </span>
                                </div>
                                <div className="selected-trip-time">
                                    <span>Departure</span>
                                    <strong>{selectedTrip?.departureTime || selectedTrip?.time || "—"}</strong>
                                </div>
                                <div className="selected-trip-time">
                                    <span>Arrival</span>
                                    <strong>{selectedTripArrival}</strong>
                                </div>
                                <button type="button" onClick={() => {
                                    if (selectedTrip) {
                                        document.getElementById("today-departures")?.scrollIntoView({ behavior: "smooth", block: "center" });
                                    } else {
                                        showNotification("No ferry trip is available to view yet.", "error");
                                    }
                                }}>View trip</button>
                            </section>

                            <div className="operations-kpi-grid">
                                <div className="operations-kpi-card">
                                    <span>Paid passengers</span>
                                    <strong>{selectedTripPassengerCapacity ? `${selectedTripPassengers} / ${selectedTripPassengerCapacity}` : `${todayPassengers}`}</strong>
                                    <small>{Math.max(0, selectedTripPassengerCapacity - selectedTripPassengers)} passenger seats remaining</small>
                                </div>

                                <div className="operations-kpi-card">
                                    <span>Motorcycle capacity</span>
                                    <strong>{selectedTripMotorcycleCapacity ? `${selectedTripMotorcycles} / ${selectedTripMotorcycleCapacity}` : "—"}</strong>
                                    <small>{selectedTripMotorcycleCapacity ? `${selectedTripMotorcycleRemaining} motorcycle slots remaining` : "Capacity data unavailable"}</small>
                                </div>

                                <div className="operations-kpi-card">
                                    <span>Passengers boarded</span>
                                    <strong>{selectedTrip?.passengersBoarded ?? selectedTrip?.boardedPassengers ?? "—"}</strong>
                                    <small>{selectedTripPassengers ? `${selectedTripPassengers} paid passengers on this trip` : "Boarding data unavailable"}</small>
                                </div>

                                <div className="operations-kpi-card">
                                    <span>Selected trip revenue</span>
                                    <strong>{formatAmount(verifiedRevenueToday)}</strong>
                                    <small>Successful payments only</small>
                                </div>
                            </div>

                            <div className="operations-main-grid">
                                <section className="operations-panel departures-panel" id="today-departures">
                                    <div className="operations-panel-heading">
                                        <div>
                                            <h3>Today's departures</h3>
                                            <p>Paid occupancy by trip</p>
                                        </div>
                                        <button type="button" onClick={() => { loadFerryCapacities(); loadFerryBookings(); }}>Manage schedules</button>
                                    </div>

                                    <div className="departures-table">
                                        <div className="departures-table-head">
                                            <span>Trip &amp; route</span>
                                            <span>Time</span>
                                            <span>Passengers</span>
                                            <span>Status</span>
                                        </div>

                                        {nextDepartures.length === 0 ? (
                                            <div className="operations-empty">No ferry schedule is available right now.</div>
                                        ) : (
                                            nextDepartures.map((ferry, index) => {
                                                const used = Number(ferry?.passengers) || 0;
                                                const limit = Number(ferry?.passengerCapacity) || 0;
                                                const remaining = Math.max(0, limit - used);
                                                const closed = Boolean(ferry?.manualClosed) || (limit > 0 && remaining <= 0);
                                                const route = ferry?.route || ferry?.routeName || (index % 2 === 0 ? "Iloilo → Guimaras" : "Guimaras → Iloilo");
                                                return (
                                                    <div className="departure-row" key={`overview-departure-${ferry?.id || ferry?.vesselName || index}`}>
                                                        <div>
                                                            <strong>{ferry?.id || ferry?.vesselName || "Scheduled trip"} · {ferry?.vesselName || "Ferry"}</strong>
                                                            <span>{route}</span>
                                                        </div>
                                                        <div>
                                                            <strong>{ferry?.departureTime || ferry?.time || "—"}</strong>
                                                            <span>{ferry?.arrivalTime || ferry?.arrival || "—"} arrival</span>
                                                        </div>
                                                        <div>
                                                            <strong>{limit ? `${used} / ${limit}` : used}</strong>
                                                        </div>
                                                        <div>
                                                            <span className={`operations-status ${closed ? "sold" : "ready"}`}>{closed ? "Sold out" : "Ready"}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    <p className="operations-table-note">Select a trip to review its boarding records.</p>
                                </section>

                                <section className="operations-panel capacity-panel">
                                    <div className="operations-panel-heading simple">
                                        <div>
                                            <h3>Capacity allocation</h3>
                                            <p>Paid tickets · {selectedTrip?.id || selectedTrip?.vesselName || "Selected trip"}</p>
                                        </div>
                                    </div>

                                    <div className="capacity-line">
                                        <div><span>Passengers</span><strong>{selectedTripPassengerCapacity ? `${selectedTripPassengers} / ${selectedTripPassengerCapacity}` : "—"}</strong></div>
                                        <div className="capacity-track"><i style={{ width: `${selectedTripPassengerCapacity ? Math.min(100, (selectedTripPassengers / selectedTripPassengerCapacity) * 100) : 0}%` }}></i></div>
                                    </div>

                                    <div className="capacity-line">
                                        <div><span>Motorcycles · online</span><strong>{selectedTripMotorcycleCapacity ? `${Math.min(selectedTripMotorcycles, selectedTripMotorcycleCapacity)} / ${selectedTripMotorcycleCapacity}` : "—"}</strong></div>
                                        <div className="capacity-track"><i style={{ width: `${selectedTripMotorcycleCapacity ? Math.min(100, (selectedTripMotorcycles / selectedTripMotorcycleCapacity) * 100) : 0}%` }}></i></div>
                                    </div>

                                    <div className="capacity-line">
                                        <div><span>Motorcycles · walk-in</span><strong>—</strong></div>
                                        <div className="capacity-track"><i style={{ width: "0%" }}></i></div>
                                    </div>

                                    <p className="capacity-note">
                                        {selectedTripClosed
                                            ? "Passenger booking is closed for this selected trip."
                                            : `${selectedTripPassengerRemaining} passenger slots remain.`}
                                        {selectedTripMotorcycleCapacity ? ` ${selectedTripMotorcycleRemaining} motorcycle slots remain.` : ""}
                                    </p>
                                </section>
                            </div>
                        </div>
                    )}



                    {/* =================================================
                        FERRY SCHEDULES VIEW
                    ================================================= */}

                    {activeView === "schedules" && (
                        <div className="schedules-page">
                            <div className="schedules-page-heading">
                                <div>
                                    <span className="operations-eyebrow">
                                        MANAGEMENT
                                    </span>
                                    <h2>Ferry schedules</h2>
                                    <p>
                                        Manage departure times and review paid capacity before each crossing.
                                    </p>
                                </div>

                                <div className="schedules-date-summary">
                                    <strong>{formatLongDate()}</strong>
                                    <span>Iloilo ⇄ Guimaras</span>
                                </div>
                            </div>

                            <div className="schedules-toolbar">
                                <label className="schedule-filter-field">
                                    <span>Travel date</span>
                                    <div className="schedule-input-shell">
                                        <span aria-hidden="true">✈</span>
                                        <input
                                            type="date"
                                            value={scheduleDate}
                                            onChange={(event) => {
                                                setScheduleDate(
                                                    event.target.value
                                                );
                                                setSelectedScheduleId(null);
                                            }}
                                        />
                                    </div>
                                </label>

                                <label className="schedule-filter-field">
                                    <span>Route</span>
                                    <div className="schedule-input-shell">
                                        <span aria-hidden="true">⇄</span>
                                        <select
                                            value={scheduleRouteFilter}
                                            onChange={(event) => {
                                                setScheduleRouteFilter(
                                                    event.target.value
                                                );
                                                setSelectedScheduleId(null);
                                            }}
                                        >
                                            <option value="all">
                                                All routes
                                            </option>
                                            <option value="Iloilo → Guimaras">
                                                Iloilo → Guimaras
                                            </option>
                                            <option value="Guimaras → Iloilo">
                                                Guimaras → Iloilo
                                            </option>
                                        </select>
                                    </div>
                                </label>

                                <button
                                    type="button"
                                    className="schedule-add-button"
                                    onClick={openAddScheduleModal}
                                >
                                    <span aria-hidden="true">+</span>
                                    Add trip
                                </button>
                            </div>

                            <section className="schedule-list-card">
                                <div className="schedule-list-heading">
                                    <div>
                                        <h3>
                                            {formatScheduleDate(scheduleDate)}
                                        </h3>
                                        <p>
                                            {filteredScheduleRows.length} trip
                                            {filteredScheduleRows.length === 1 ? "" : "s"} · {
                                                scheduleRouteFilter === "all"
                                                    ? "both directions"
                                                    : scheduleRouteFilter
                                            }
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="schedule-refresh-button"
                                        onClick={() =>
                                            loadScheduleCapacity(scheduleDate)
                                        }
                                    >
                                        ↻ Refresh
                                    </button>
                                </div>

                                {capacityError && (
                                    <div className="schedule-inline-error">
                                        {capacityError}
                                    </div>
                                )}

                                {capacityLoading ? (
                                    <div className="schedule-empty-state">
                                        <strong>Loading schedules...</strong>
                                        <span>
                                            Checking ferry capacity for the selected travel date.
                                        </span>
                                    </div>
                                ) : filteredScheduleRows.length === 0 ? (
                                    <div className="schedule-empty-state">
                                        <strong>No trips found</strong>
                                        <span>
                                            Try another date or route, or add a new trip.
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="schedule-table-wrap">
                                            <div className="schedule-table">
                                                <div className="schedule-table-head">
                                                    <span>Trip / vessel</span>
                                                    <span>Route</span>
                                                    <span>Departure</span>
                                                    <span>Passengers</span>
                                                    <span>Motorcycles</span>
                                                    <span>Status</span>
                                                </div>

                                                {filteredScheduleRows.map(
                                                    (trip, index) => {
                                                        const passengerLimit =
                                                            Number(
                                                                trip?.passengerCapacity
                                                            ) || 100;

                                                        const motorcycleLimit =
                                                            Number(
                                                                trip?.motorcycleCapacity
                                                            ) || 10;

                                                        const passengers =
                                                            Number(
                                                                trip?.passengers
                                                            ) || 0;

                                                        const motorcycles =
                                                            Number(
                                                                trip?.motorcycles
                                                            ) || 0;

                                                        const passengerFull =
                                                            passengers >=
                                                            passengerLimit;

                                                        const closed =
                                                            Boolean(
                                                                trip?.manualClosed
                                                            ) ||
                                                            passengerFull;

                                                        const isSelected =
                                                            selectedSchedule?._scheduleId ===
                                                            trip._scheduleId;

                                                        return (
                                                            <button
                                                                type="button"
                                                                className={`schedule-table-row ${
                                                                    isSelected
                                                                        ? "selected"
                                                                        : ""
                                                                }`}
                                                                key={
                                                                    trip._scheduleId ||
                                                                    `${trip?.vesselName}-${index}`
                                                                }
                                                                onClick={() =>
                                                                    setSelectedScheduleId(
                                                                        trip._scheduleId
                                                                    )
                                                                }
                                                            >
                                                                <span className="schedule-trip-cell">
                                                                    <strong>
                                                                        {trip?.id ||
                                                                            trip?.vesselName ||
                                                                            "Scheduled trip"}
                                                                    </strong>
                                                                    <small>
                                                                        {trip?.vesselName ||
                                                                            "Ferry"}
                                                                    </small>
                                                                </span>

                                                                <span className="schedule-route-cell">
                                                                    <strong>
                                                                        {getScheduleRoute(
                                                                            trip,
                                                                            index
                                                                        )}
                                                                    </strong>
                                                                    <small>
                                                                        Arrival{" "}
                                                                        {getScheduleArrival(
                                                                            trip
                                                                        )}
                                                                    </small>
                                                                </span>

                                                                <span className="schedule-time-cell">
                                                                    {trip?.departureTime ||
                                                                        trip?.time ||
                                                                        "—"}
                                                                </span>

                                                                <span className="schedule-capacity-cell">
                                                                    <strong>
                                                                        {passengers} /{" "}
                                                                        {passengerLimit}
                                                                    </strong>
                                                                    <small>
                                                                        {Math.max(
                                                                            0,
                                                                            passengerLimit -
                                                                                passengers
                                                                        )}{" "}
                                                                        remaining
                                                                    </small>
                                                                </span>

                                                                <span className="schedule-capacity-cell">
                                                                    <strong>
                                                                        {motorcycles} /{" "}
                                                                        {motorcycleLimit}
                                                                    </strong>
                                                                    <small>
                                                                        {Math.max(
                                                                            0,
                                                                            motorcycleLimit -
                                                                                motorcycles
                                                                        )}{" "}
                                                                        remaining
                                                                    </small>
                                                                </span>

                                                                <span>
                                                                    <em
                                                                        className={`schedule-status ${
                                                                            closed
                                                                                ? "sold"
                                                                                : "ready"
                                                                        }`}
                                                                    >
                                                                        {closed
                                                                            ? "Sold out"
                                                                            : "Ready"}
                                                                    </em>
                                                                </span>
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>

                                        <div className="schedule-list-footer">
                                            <span>
                                                Showing {filteredScheduleRows.length} trip
                                                {filteredScheduleRows.length === 1 ? "" : "s"}
                                            </span>

                                            <div className="schedule-footer-actions">
                                                <button
                                                    type="button"
                                                    className="schedule-edit-button"
                                                    onClick={openEditScheduleModal}
                                                    disabled={!selectedSchedule}
                                                >
                                                    Edit selected trip
                                                </button>

                                                {selectedSchedule?._scheduleSource ===
                                                    "admin" && (
                                                    <button
                                                        type="button"
                                                        className="schedule-delete-button"
                                                        onClick={
                                                            deleteSelectedSchedule
                                                        }
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </section>

                            <div className="schedule-capacity-note">
                                Each trip accommodates 100 passengers and 10 motorcycles.
                                Motorcycle capacity is tracked separately from passenger capacity.
                            </div>

                            {showScheduleModal && (
                                <div className="schedule-modal-overlay">
                                    <div
                                        className="schedule-modal"
                                        role="dialog"
                                        aria-modal="true"
                                        aria-labelledby="schedule-modal-title"
                                    >
                                        <div className="schedule-modal-header">
                                            <div>
                                                <span className="operations-eyebrow">
                                                    SCHEDULE MANAGEMENT
                                                </span>
                                                <h3 id="schedule-modal-title">
                                                    {scheduleModalMode === "edit"
                                                        ? "Edit selected trip"
                                                        : "Add trip"}
                                                </h3>
                                            </div>

                                            <button
                                                type="button"
                                                className="schedule-modal-close"
                                                onClick={
                                                    closeScheduleModal
                                                }
                                                disabled={
                                                    scheduleActionLoading
                                                }
                                                aria-label="Close"
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <form
                                            className="schedule-form"
                                            onSubmit={saveSchedule}
                                        >
                                            <label>
                                                <span>Trip / vessel</span>
                                                <input
                                                    name="vesselName"
                                                    value={
                                                        scheduleForm.vesselName
                                                    }
                                                    onChange={
                                                        handleScheduleFormChange
                                                    }
                                                    placeholder="e.g. MV Halili"
                                                    required
                                                />
                                            </label>

                                            <label>
                                                <span>Route</span>
                                                <select
                                                    name="route"
                                                    value={
                                                        scheduleForm.route
                                                    }
                                                    onChange={
                                                        handleScheduleFormChange
                                                    }
                                                >
                                                    <option>
                                                        Iloilo → Guimaras
                                                    </option>
                                                    <option>
                                                        Guimaras → Iloilo
                                                    </option>
                                                </select>
                                            </label>

                                            <div className="schedule-form-grid">
                                                <label>
                                                    <span>Travel date</span>
                                                    <input
                                                        type="date"
                                                        name="date"
                                                        value={
                                                            scheduleForm.date
                                                        }
                                                        onChange={
                                                            handleScheduleFormChange
                                                        }
                                                        required
                                                    />
                                                </label>

                                                <label>
                                                    <span>Departure</span>
                                                    <select
                                                        className="schedule-time-select"
                                                        name="departureTime"
                                                        value={
                                                            scheduleForm.departureTime
                                                        }
                                                        onChange={
                                                            handleScheduleFormChange
                                                        }
                                                        required
                                                    >
                                                        <option value="">Select departure time</option>
                                                        {scheduleTimeOptions.map((option) => (
                                                            <option
                                                                key={`departure-${option.value}`}
                                                                value={option.value}
                                                            >
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>

                                                <label>
                                                    <span>Arrival</span>
                                                    <select
                                                        className="schedule-time-select"
                                                        name="arrivalTime"
                                                        value={
                                                            scheduleForm.arrivalTime
                                                        }
                                                        onChange={
                                                            handleScheduleFormChange
                                                        }
                                                    >
                                                        <option value="">Select arrival time</option>
                                                        {scheduleArrivalTimeOptions.map((option) => (
                                                            <option
                                                                key={`arrival-${option.value}`}
                                                                value={option.value}
                                                            >
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>

                                                <label>
                                                    <span>Passenger capacity</span>
                                                    <input
                                                        type="number"
                                                        name="passengerCapacity"
                                                        min="1"
                                                        value={
                                                            scheduleForm.passengerCapacity
                                                        }
                                                        onChange={
                                                            handleScheduleFormChange
                                                        }
                                                    />
                                                </label>

                                                <label>
                                                    <span>Motorcycle capacity</span>
                                                    <input
                                                        type="number"
                                                        name="motorcycleCapacity"
                                                        min="0"
                                                        value={
                                                            scheduleForm.motorcycleCapacity
                                                        }
                                                        onChange={
                                                            handleScheduleFormChange
                                                        }
                                                    />
                                                </label>
                                            </div>

                                            {scheduleNotice && (
                                                <div className="schedule-form-error">
                                                    {scheduleNotice}
                                                </div>
                                            )}

                                            <div className="schedule-modal-actions">
                                                <button
                                                    type="button"
                                                    className="schedule-cancel-button"
                                                    onClick={
                                                        closeScheduleModal
                                                    }
                                                    disabled={
                                                        scheduleActionLoading
                                                    }
                                                >
                                                    Cancel
                                                </button>

                                                <button
                                                    type="submit"
                                                    className="schedule-save-button"
                                                    disabled={
                                                        scheduleActionLoading
                                                    }
                                                >
                                                    {scheduleActionLoading
                                                        ? "Saving..."
                                                        : scheduleModalMode ===
                                                            "edit"
                                                        ? "Save changes"
                                                        : "Add trip"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
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
   OPERATIONS OVERVIEW — REFERENCE UI
   Presentation layer for the first Admin view.
========================================================= */

.admin-dashboard {
    min-height: 100vh;
    background: #f5f2ec;
    color: #222222;
}

.operations-content {
    background: #f8f5ef;
}

.operations-content .dashboard-main {
    padding: 0;
}

.sidebar {
    width: 210px;
    min-width: 210px;
    padding: 22px 12px 18px;
    background: #ffffff;
    border-right: 0;
    border-radius: 0 22px 22px 0;
    box-shadow: 0 8px 28px rgba(30, 36, 44, .04);
}

.operations-brand {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 12px 28px;
}

.operations-brand strong {
    font-size: 15px;
    letter-spacing: -.2px;
}

.operations-brand-mark {
    width: 25px;
    height: 25px;
    display: grid;
    place-items: center;
    position: relative;
    border-radius: 8px;
    background: #f5efe6;
    color: #ff8b1e;
    font-weight: 900;
    font-size: 8px;
    box-shadow: inset 0 0 0 1px rgba(255, 139, 30, .12);
}

.operations-brand-mark span:first-child { transform: translate(-2px, -2px); }
.operations-brand-mark span:last-child { transform: translate(2px, 2px); color: #0c8d80; }

.operations-workspace {
    margin: 0 10px 20px;
    padding: 0 0 22px;
    border-bottom: 1px solid #e7e2da;
}

.operations-workspace span {
    display: block;
    margin-bottom: 7px;
    color: #77726a;
    font-size: 8px;
    letter-spacing: .9px;
}

.operations-workspace strong {
    font-size: 9px;
    font-weight: 600;
}

.operations-navigation { gap: 4px; }

.operations-navigation .side-item {
    min-height: 37px;
    padding: 0 10px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 9px;
    color: #222;
    font-size: 10px;
    background: transparent;
    box-shadow: none;
}

.operations-navigation .side-item:hover {
    background: #f7f5f0;
    color: #222;
}

.operations-navigation .side-item.active {
    background: #0b9e94;
    color: #ffffff;
    box-shadow: none;
}

.operations-nav-icon {
    width: 15px;
    display: inline-flex;
    justify-content: center;
    font-size: 13px;
    opacity: .9;
}

.operations-navigation .pending-badge {
    margin-left: auto;
    min-width: 18px;
    height: 18px;
    border-radius: 99px;
    display: grid;
    place-items: center;
    background: #e96d48;
    color: #fff;
    font-size: 8px;
}

.operations-terminal-card {
    margin: 0 10px 17px;
    padding: 12px 10px;
    border-radius: 12px;
    background: #f7f3ed;
}

.operations-terminal-card strong,
.operations-terminal-card span,
.operations-terminal-card small { display: block; }
.operations-terminal-card strong { font-size: 9px; margin-bottom: 7px; }
.operations-terminal-card span { color: #77726a; font-size: 8px; margin-bottom: 6px; }
.operations-terminal-card small { color: #087d75; font-size: 8px; }
.operations-terminal-card small i {
    display: inline-block; width: 5px; height: 5px; margin-right: 5px; border-radius: 50%; background: #168f83;
}

.operations-admin-account {
    display: flex;
    align-items: center;
    gap: 9px;
    width: calc(100% - 20px);
    margin: 0 10px;
    padding: 7px 4px;
    text-align: left;
    border: 0;
    background: transparent;
    cursor: pointer;
}

.operations-admin-account strong, .operations-admin-account small { display: block; }
.operations-admin-account strong { font-size: 9px; }
.operations-admin-account small { margin-top: 3px; color: #888; font-size: 7px; }
.operations-admin-avatar { font-size: 17px; color: #333; }
.operations-logout { display: none !important; }

.operations-overview-page {
    width: 100%;
    min-height: 100vh;
    padding: 28px 28px 38px;
}

.operations-page-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 22px;
}

.operations-eyebrow {
    display: block;
    margin-bottom: 7px;
    color: #77726a;
    font-size: 8px;
    letter-spacing: 1px;
}

.operations-page-heading h2 {
    margin: 0;
    font-size: 24px;
    line-height: 1.1;
    letter-spacing: -.8px;
}

.operations-page-heading p {
    margin: 7px 0 0;
    color: #7c7972;
    font-size: 9px;
}

.operations-date {
    padding-top: 7px;
    text-align: right;
}

.operations-date strong, .operations-date span { display: block; }
.operations-date strong { font-size: 9px; }
.operations-date span { margin-top: 6px; color: #88837b; font-size: 7px; }

.selected-trip-card {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) 100px 100px 135px;
    align-items: center;
    gap: 20px;
    padding: 15px 18px;
    margin-bottom: 17px;
    border: 1px solid rgba(231, 224, 213, .9);
    border-radius: 19px;
    background: #dff1ef;
    box-shadow: 0 4px 0 rgba(255,255,255,.55);
}

.selected-trip-route strong { display: block; font-size: 15px; }
.selected-trip-route span { display: block; margin-top: 5px; color: #747d79; font-size: 8px; }
.selected-trip-time span { display: block; color: #777; font-size: 7px; }
.selected-trip-time strong { display: block; margin-top: 5px; font-size: 10px; }
.selected-trip-card > button,
.operations-panel-heading button {
    height: 34px;
    border: 0;
    border-radius: 99px;
    background: #f7f0e8;
    color: #222;
    font-size: 9px;
    cursor: pointer;
}

.operations-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 13px;
    margin-bottom: 18px;
}

.operations-kpi-card {
    min-height: 91px;
    padding: 15px 17px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid #eee9e2;
}

.operations-kpi-card span, .operations-kpi-card small { display: block; }
.operations-kpi-card span { color: #77736d; font-size: 8px; }
.operations-kpi-card strong { display: block; margin: 6px 0 4px; font-size: 23px; line-height: 1; letter-spacing: -.7px; }
.operations-kpi-card small { color: #85817a; font-size: 7px; line-height: 1.4; }

.operations-main-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) minmax(250px, .95fr);
    gap: 17px;
}

.operations-panel {
    border: 1px solid #eee8df;
    border-radius: 19px;
    background: #ffffff;
    box-shadow: 0 4px 0 rgba(233, 226, 216, .55);
    overflow: hidden;
}

.operations-panel-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
    padding: 18px 17px 12px;
}

.operations-panel-heading.simple { display: block; }
.operations-panel-heading h3 { margin: 0; font-size: 14px; letter-spacing: -.25px; }
.operations-panel-heading p { margin: 5px 0 0; color: #88827a; font-size: 8px; }
.operations-panel-heading button { padding: 0 18px; white-space: nowrap; }

.departures-table { padding: 0 17px; }
.departures-table-head, .departure-row {
    display: grid;
    grid-template-columns: minmax(180px, 1.7fr) 85px 85px 70px;
    gap: 10px;
    align-items: center;
}

.departures-table-head {
    padding: 8px 0;
    color: #77736d;
    font-size: 7px;
    border-bottom: 1px solid #e9e4dd;
}

.departure-row {
    min-height: 55px;
    padding: 8px 0;
    border-bottom: 1px solid #ece7df;
}

.departure-row:first-of-type { background: #faf8f4; }
.departure-row > div:first-child strong, .departure-row > div:first-child span, .departure-row > div:nth-child(2) strong, .departure-row > div:nth-child(2) span { display: block; }
.departure-row strong { font-size: 9px; }
.departure-row span { margin-top: 4px; color: #88837b; font-size: 7px; }
.operations-status {
    display: inline-flex !important;
    justify-content: center;
    min-width: 64px;
    margin-top: 0 !important;
    padding: 6px 10px;
    border-radius: 99px;
    font-size: 7px !important;
}
.operations-status.ready { background: #dff1ef; color: #087c74; }
.operations-status.sold { background: #f2ede7; color: #7b7369; }
.operations-table-note { margin: 12px 17px 16px; color: #8b857d; font-size: 7px; }
.operations-empty { padding: 25px 0; color: #888; font-size: 8px; }

.capacity-panel { padding-bottom: 17px; }
.capacity-line { padding: 9px 17px 3px; }
.capacity-line > div:first-child { display: flex; justify-content: space-between; gap: 10px; }
.capacity-line span { color: #77736d; font-size: 8px; }
.capacity-line strong { font-size: 8px; }
.capacity-track { height: 6px; margin-top: 7px; overflow: hidden; border-radius: 99px; background: #eee9e3; }
.capacity-track i { display: block; height: 100%; border-radius: inherit; background: #087b73; }
.capacity-note { margin: 11px 17px 0; color: #88827a; font-size: 7px; line-height: 1.5; }

@media (max-width: 1050px) {
    .sidebar { width: 190px; min-width: 190px; }
    .operations-overview-page { padding: 24px 20px 32px; }
    .selected-trip-card { grid-template-columns: 1.4fr 90px 90px 110px; gap: 12px; }
    .operations-kpi-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
}

@media (max-width: 800px) {
    .sidebar { width: 100%; min-width: 0; border-radius: 0; }
    .operations-main-grid { grid-template-columns: 1fr; }
    .selected-trip-card { grid-template-columns: 1fr 1fr; }
    .selected-trip-card > button { grid-column: 1 / -1; }
}

@media (max-width: 600px) {
    .operations-overview-page { padding: 18px 14px 28px; }
    .operations-page-heading { display: block; }
    .operations-date { margin-top: 12px; text-align: left; }
    .selected-trip-card { grid-template-columns: 1fr; }
    .operations-kpi-grid { grid-template-columns: 1fr; }
    .departures-table { overflow-x: auto; }
    .departures-table-head, .departure-row { min-width: 570px; }
}


/* =========================================================
   RESPONSIVE ADMIN OPERATIONS UI + MOBILE HAMBURGER
========================================================= */

.admin-dashboard {
    width: 100%;
    min-height: 100dvh;
    overflow-x: hidden;
}

.operations-content {
    min-width: 0;
    width: 100%;
}

.operations-overview-page {
    min-width: 0;
}

@media (min-width: 651px) {
    .mobile-menu-toggle,
    .mobile-sidebar-overlay {
        display: none !important;
    }

    .sidebar {
        position: sticky;
        top: 0;
        height: 100dvh;
        max-height: 100dvh;
        overflow-y: auto;
        overflow-x: hidden;
        z-index: 20;
    }
}

@media (max-width: 1050px) and (min-width: 651px) {
    .sidebar {
        width: 190px;
        min-width: 190px;
    }

    .operations-overview-page {
        padding: 24px 20px 32px;
    }

    .operations-page-heading h2 {
        font-size: 22px;
    }

    .selected-trip-card {
        grid-template-columns: minmax(0, 1.35fr) 88px 88px 110px;
        gap: 12px;
    }

    .operations-kpi-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .operations-main-grid {
        grid-template-columns: minmax(0, 1.55fr) minmax(220px, .9fr);
    }

    .departures-table-head,
    .departure-row {
        grid-template-columns: minmax(150px, 1.5fr) 75px 75px 65px;
    }
}

@media (max-width: 650px) {
    .admin-dashboard {
        display: block;
        min-height: 100dvh;
        background: #f8f5ef;
    }

    .dashboard-content.operations-content {
        width: 100%;
        min-height: 100dvh;
    }

    .mobile-menu-toggle {
        position: fixed;
        top: 14px;
        left: 14px;
        z-index: 1002;
        width: 46px;
        height: 46px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 0;
        border: 1px solid rgba(226, 232, 240, .95);
        border-radius: 13px;
        background: rgba(255, 255, 255, .97);
        box-shadow: 0 8px 24px rgba(15, 23, 42, .12);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
    }

    .mobile-menu-toggle span {
        display: block;
        width: 21px;
        height: 2px;
        border-radius: 99px;
        background: #172033;
        transition: transform .2s ease, opacity .2s ease;
    }

    .mobile-menu-toggle[aria-expanded="true"] span:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
    }

    .mobile-menu-toggle[aria-expanded="true"] span:nth-child(2) {
        opacity: 0;
    }

    .mobile-menu-toggle[aria-expanded="true"] span:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
    }

    .mobile-sidebar-overlay {
        position: fixed;
        inset: 0;
        z-index: 999;
        width: 100%;
        height: 100%;
        border: 0;
        padding: 0;
        background: rgba(15, 23, 42, .42);
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        cursor: pointer;
    }

    .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: 1001;
        width: min(292px, 84vw);
        min-width: 0;
        height: 100dvh;
        max-height: 100dvh;
        margin: 0;
        padding: 24px 14px 18px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: hidden;
        border: 0;
        border-radius: 0 22px 22px 0;
        background: #ffffff;
        box-shadow: 14px 0 40px rgba(15, 23, 42, .16);
        transform: translateX(-105%);
        transition: transform .24s ease;
        overscroll-behavior: contain;
    }

    .sidebar.mobile-menu-open {
        transform: translateX(0);
    }

    .operations-brand {
        padding: 8px 12px 25px;
    }

    .operations-workspace {
        margin-bottom: 18px;
        padding-bottom: 18px;
    }

    .operations-navigation {
        width: 100%;
    }

    .operations-navigation .side-item {
        min-height: 46px;
        padding: 0 12px;
        font-size: 12px;
    }

    .operations-nav-icon {
        width: 20px;
        font-size: 15px;
    }

    .operations-terminal-card {
        margin-top: auto;
    }

    .operations-overview-page {
        width: 100%;
        min-height: 100dvh;
        padding: 82px 14px 28px;
    }

    .operations-page-heading {
        display: block;
        margin-bottom: 18px;
    }

    .operations-page-heading h2 {
        font-size: clamp(23px, 7vw, 30px);
        line-height: 1.08;
    }

    .operations-page-heading p {
        max-width: 95%;
        font-size: 10px;
        line-height: 1.5;
    }

    .operations-date {
        margin-top: 14px;
        padding-top: 0;
        text-align: left;
    }

    .operations-date strong {
        font-size: 10px;
    }

    .operations-date span {
        margin-top: 5px;
        font-size: 8px;
    }

    .selected-trip-card {
        grid-template-columns: 1fr;
        gap: 13px;
        padding: 20px;
        margin-bottom: 14px;
        border-radius: 20px;
    }

    .selected-trip-route strong {
        font-size: 19px;
    }

    .selected-trip-route span {
        font-size: 9px;
    }

    .selected-trip-time strong {
        font-size: 12px;
    }

    .selected-trip-time span {
        font-size: 8px;
    }

    .selected-trip-card > button {
        grid-column: auto;
        width: 100%;
        height: 42px;
    }

    .operations-kpi-grid {
        grid-template-columns: 1fr;
        gap: 10px;
        margin-bottom: 14px;
    }

    .operations-kpi-card {
        min-height: 104px;
        padding: 17px;
        border-radius: 18px;
    }

    .operations-kpi-card span {
        font-size: 9px;
    }

    .operations-kpi-card strong {
        font-size: 27px;
    }

    .operations-kpi-card small {
        font-size: 8px;
    }

    .operations-main-grid {
        grid-template-columns: 1fr;
        gap: 14px;
    }

    .operations-panel {
        border-radius: 18px;
    }

    .operations-panel-heading {
        padding: 17px 15px 11px;
    }

    .operations-panel-heading h3 {
        font-size: 15px;
    }

    .operations-panel-heading p {
        font-size: 8px;
        line-height: 1.45;
    }

    .operations-panel-heading button {
        padding: 0 13px;
        height: 34px;
    }

    .departures-table {
        width: 100%;
        padding: 0 15px;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
    }

    .departures-table-head,
    .departure-row {
        min-width: 555px;
        grid-template-columns: minmax(175px, 1.6fr) 82px 82px 72px;
    }

    .departure-row {
        min-height: 60px;
    }

    .operations-table-note {
        margin: 11px 15px 15px;
        font-size: 8px;
    }

    .capacity-line {
        padding-left: 15px;
        padding-right: 15px;
    }

    .capacity-note {
        margin-left: 15px;
        margin-right: 15px;
        font-size: 8px;
    }
}

@media (max-width: 380px) {
    .mobile-menu-toggle {
        top: 11px;
        left: 11px;
        width: 43px;
        height: 43px;
    }

    .operations-overview-page {
        padding-left: 11px;
        padding-right: 11px;
    }

    .selected-trip-card {
        padding: 17px;
    }

    .operations-kpi-card {
        padding: 15px;
    }


}

/* =========================================================
   MOBILE ADMIN DRAWER — FULL NAVIGATION + LOGOUT
========================================================= */

.operations-navigation {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
}

.operations-navigation .side-item {
    width: 100%;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    border-radius: 11px;
    background: transparent;
    color: #20242b;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
}

.operations-navigation .side-item > span:last-child {
    display: inline-block !important;
    visibility: visible !important;
    opacity: 1 !important;
}

.operations-navigation .operations-nav-icon {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    flex: 0 0 20px;
    width: 20px;
    min-width: 20px;
    font-size: 15px;
}

.operations-sidebar-footer {
    margin-top: auto;
    padding: 18px 8px 4px;
}

.operations-logout-button {
    width: 100%;
    min-height: 54px;
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 9px 11px;
    border: 1px solid #ece7df;
    border-radius: 13px;
    background: #faf8f4;
    color: #20242b;
    text-align: left;
    cursor: pointer;
    transition: background .2s ease, border-color .2s ease, transform .2s ease;
}

.operations-logout-button:hover {
    background: #fff2ef;
    border-color: #f1cfc8;
    transform: translateY(-1px);
}

.operations-logout-icon {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 34px;
    border-radius: 10px;
    background: #fff;
    font-size: 17px;
}

.operations-logout-button span:last-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.operations-logout-button strong {
    font-size: 11px;
    line-height: 1.2;
}

.operations-logout-button small {
    color: #8b8d91;
    font-size: 8px;
    line-height: 1.2;
}

/* Desktop: keep the sidebar compact like the reference. */
@media (min-width: 651px) {
    .operations-navigation .side-item > span:last-child {
        display: inline-block !important;
    }
}

/* Mobile drawer: never inherit desktop collapsed/sidebar rules. */
@media (max-width: 650px) {
    .sidebar.mobile-menu-open {
        width: min(292px, 84vw) !important;
        min-width: 0 !important;
        padding: 20px 14px 16px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        justify-content: flex-start !important;
        overflow-y: auto !important;
    }

    .sidebar.mobile-menu-open .operations-brand {
        width: 100%;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 10px !important;
        margin-bottom: 20px;
        padding: 8px 10px 12px !important;
    }

    .sidebar.mobile-menu-open .operations-brand strong {
        display: inline-block !important;
        visibility: visible !important;
        opacity: 1 !important;
        font-size: 18px;
    }

    .sidebar.mobile-menu-open .operations-workspace {
        width: 100%;
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        margin: 0 0 20px !important;
        padding: 0 10px 18px !important;
        border-bottom: 1px solid #ebe6de;
    }

    .sidebar.mobile-menu-open .operations-workspace span,
    .sidebar.mobile-menu-open .operations-workspace strong {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
    }

    .sidebar.mobile-menu-open .operations-navigation {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 5px !important;
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
    }

    .sidebar.mobile-menu-open .operations-navigation .side-item {
        display: flex !important;
        width: 100% !important;
        min-height: 48px !important;
        flex: 0 0 auto !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 12px !important;
        padding: 0 12px !important;
        border-radius: 11px !important;
        transform: none !important;
    }

    .sidebar.mobile-menu-open .operations-navigation .side-item > span {
        display: inline-flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: static !important;
        width: auto !important;
        height: auto !important;
        margin: 0 !important;
        clip: auto !important;
        overflow: visible !important;
        transform: none !important;
    }

    .sidebar.mobile-menu-open .operations-navigation .side-item > span:last-child {
        font-size: 12px !important;
        line-height: 1.2 !important;
    }

    .sidebar.mobile-menu-open .operations-sidebar-footer {
        width: 100%;
        margin-top: auto !important;
        padding: 20px 8px 4px !important;
    }

    .sidebar.mobile-menu-open .operations-logout-button {
        display: flex !important;
    }

} /* close mobile drawer media query before global schedule styles */

/* =========================================================
   FERRY SCHEDULES — REFERENCE UI
========================================================= */

.schedules-page {
    width: 100%;
    max-width: 1080px;
    margin: 0 auto;
    padding: 4px 0 42px;
}

.schedules-page-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 22px;
}

.schedules-page-heading h2 {
    margin: 5px 0 6px;
    color: #202020;
    font-size: 29px;
    line-height: 1.05;
    font-weight: 800;
    letter-spacing: -0.8px;
}

.schedules-page-heading p {
    margin: 0;
    color: #737373;
    font-size: 10px;
    line-height: 1.5;
}

.schedules-date-summary {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
    padding-bottom: 3px;
}

.schedules-date-summary strong {
    color: #242424;
    font-size: 10px;
}

.schedules-date-summary span {
    color: #888;
    font-size: 8px;
}

.schedules-toolbar {
    display: grid;
    grid-template-columns: minmax(180px, 220px) minmax(180px, 220px) 1fr auto;
    align-items: end;
    gap: 12px;
    margin-bottom: 17px;
}

.schedule-filter-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.schedule-filter-field > span {
    color: #353535;
    font-size: 9px;
    font-weight: 700;
}

.schedule-input-shell {
    height: 38px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 13px;
    border: 1px solid #e4ded5;
    border-radius: 22px;
    background: #fff;
    box-shadow: 0 2px 5px rgba(30, 30, 30, .02);
}

.schedule-input-shell > span {
    color: #555;
    font-size: 13px;
}

.schedule-input-shell input,
.schedule-input-shell select {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #343434;
    font-size: 10px;
    font-family: inherit;
}

.schedule-input-shell input::-webkit-calendar-picker-indicator {
    opacity: .65;
}

.schedule-add-button {
    min-width: 121px;
    height: 34px;
    border: 0;
    border-radius: 19px;
    background: #ff7418;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 7px 16px rgba(255, 116, 24, .16);
}

.schedule-add-button:hover {
    background: #ed6810;
    transform: translateY(-1px);
}

.schedule-add-button span {
    margin-right: 7px;
    font-size: 15px;
    vertical-align: -1px;
}

.schedule-list-card {
    overflow: hidden;
    border: 1px solid #ece7df;
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 5px 18px rgba(32, 32, 32, .045);
}

.schedule-list-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 19px 19px 13px;
}

.schedule-list-heading h3 {
    margin: 0 0 5px;
    color: #272727;
    font-size: 14px;
    font-weight: 800;
}

.schedule-list-heading p {
    margin: 0;
    color: #8a8a8a;
    font-size: 9px;
}

.schedule-refresh-button {
    height: 32px;
    padding: 0 16px;
    border: 0;
    border-radius: 17px;
    background: #f4f0ea;
    color: #303030;
    font-size: 9px;
    font-weight: 700;
    cursor: pointer;
}

.schedule-table-wrap {
    width: 100%;
    overflow-x: auto;
}

.schedule-table {
    min-width: 760px;
    padding: 0 19px;
}

.schedule-table-head,
.schedule-table-row {
    display: grid;
    grid-template-columns: 1.25fr 1.2fr .7fr .75fr .78fr .65fr;
    align-items: center;
    column-gap: 14px;
}

.schedule-table-head {
    min-height: 31px;
    border-bottom: 1px solid #e8e2da;
    color: #777;
    font-size: 8px;
    font-weight: 600;
}

.schedule-table-row {
    width: 100%;
    min-height: 60px;
    padding: 0;
    border: 0;
    border-bottom: 1px solid #eee8e0;
    background: #fff;
    color: #333;
    text-align: left;
    font-family: inherit;
    cursor: pointer;
}

.schedule-table-row:hover,
.schedule-table-row.selected {
    background: #fbf8f3;
}

.schedule-table-row:last-child {
    border-bottom: 0;
}

.schedule-trip-cell,
.schedule-route-cell,
.schedule-capacity-cell {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.schedule-trip-cell strong,
.schedule-route-cell strong,
.schedule-capacity-cell strong {
    overflow: hidden;
    color: #303030;
    font-size: 9px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.schedule-trip-cell small,
.schedule-route-cell small,
.schedule-capacity-cell small {
    color: #8b8b8b;
    font-size: 7px;
}

.schedule-time-cell {
    color: #303030;
    font-size: 9px;
    font-weight: 700;
}

.schedule-status {
    width: fit-content;
    min-width: 63px;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 7px;
    font-style: normal;
    font-weight: 700;
    text-align: center;
}

.schedule-status.ready {
    background: #dff4f1;
    color: #08766d;
}

.schedule-status.sold {
    background: #f1eee9;
    color: #746f67;
}

.schedule-list-footer {
    min-height: 53px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 10px 19px;
    color: #777;
    font-size: 8px;
}

.schedule-footer-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.schedule-edit-button,
.schedule-delete-button {
    height: 32px;
    padding: 0 15px;
    border: 0;
    border-radius: 17px;
    font-size: 8px;
    font-weight: 700;
    cursor: pointer;
}

.schedule-edit-button {
    background: #f4f0ea;
    color: #303030;
}

.schedule-edit-button:hover:not(:disabled) {
    background: #ece6dd;
}

.schedule-edit-button:disabled {
    cursor: not-allowed;
    opacity: .45;
}

.schedule-delete-button {
    background: #fff1ef;
    color: #c24136;
}

.schedule-delete-button:hover {
    background: #ffe5e1;
}

.schedule-capacity-note {
    margin-top: 17px;
    padding: 14px 17px;
    border: 1px solid rgba(18, 185, 191, .10);
    border-radius: 18px;
    background: #e7f6f4;
    color: #536b6b;
    font-size: 8px;
    line-height: 1.5;
}

.schedule-inline-error,
.schedule-form-error {
    margin: 0 19px 12px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #fff1ef;
    color: #b33c32;
    font-size: 8px;
}

.schedule-empty-state {
    min-height: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 24px;
    color: #8b8b8b;
    text-align: center;
}

.schedule-empty-state strong {
    color: #383838;
    font-size: 12px;
}

.schedule-empty-state span {
    font-size: 9px;
}

.schedule-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(18, 25, 32, .42);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
}

.schedule-modal {
    width: min(560px, 100%);
    max-height: calc(100dvh - 40px);
    overflow-y: auto;
    border: 1px solid #e9e3da;
    border-radius: 22px;
    background: #fff;
    box-shadow: 0 28px 70px rgba(15, 23, 42, .18);
}

.schedule-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 22px 17px;
    border-bottom: 1px solid #eee9e2;
}

.schedule-modal-header h3 {
    margin: 5px 0 0;
    color: #242424;
    font-size: 19px;
    font-weight: 800;
}

.schedule-modal-close {
    width: 34px;
    height: 34px;
    border: 1px solid #e7e2da;
    border-radius: 10px;
    background: #fff;
    color: #555;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
}

.schedule-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px 22px 22px;
}

.schedule-form label {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.schedule-form label > span {
    color: #4b4b4b;
    font-size: 9px;
    font-weight: 700;
}

.schedule-form input,
.schedule-form select {
    width: 100%;
    height: 41px;
    padding: 0 12px;
    border: 1px solid #ded9d1;
    border-radius: 11px;
    outline: 0;
    background: #fff;
    color: #333;
    font-family: inherit;
    font-size: 10px;
}

.schedule-form input:focus,
.schedule-form select:focus {
    border-color: #12a9a7;
    box-shadow: 0 0 0 3px rgba(18, 169, 167, .10);
}
.schedule-time-select {
    appearance: none;
    -webkit-appearance: none;
    background-image: linear-gradient(45deg, transparent 50%, #777 50%), linear-gradient(135deg, #777 50%, transparent 50%);
    background-position: calc(100% - 17px) 17px, calc(100% - 12px) 17px;
    background-size: 5px 5px, 5px 5px;
    background-repeat: no-repeat;
    padding-right: 38px !important;
    cursor: pointer;
}

.schedule-time-select option {
    font-size: 12px;
}


.schedule-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 13px;
}

.schedule-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
    padding-top: 4px;
}

.schedule-cancel-button,
.schedule-save-button {
    min-width: 105px;
    height: 40px;
    padding: 0 16px;
    border-radius: 11px;
    font-size: 9px;
    font-weight: 700;
    cursor: pointer;
}

.schedule-cancel-button {
    border: 1px solid #e2ddd5;
    background: #fff;
    color: #444;
}

.schedule-save-button {
    border: 0;
    background: #ff7418;
    color: #fff;
}

.schedule-save-button:hover:not(:disabled) {
    background: #ed6810;
}

.schedule-cancel-button:disabled,
.schedule-save-button:disabled {
    cursor: not-allowed;
    opacity: .55;
}

@media (max-width: 850px) {
    .schedules-toolbar {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .schedule-add-button {
        width: 100%;
        grid-column: 1 / -1;
    }
}

@media (max-width: 650px) {
    .schedules-page {
        padding: 0 0 30px;
    }

    .schedules-page-heading {
        display: block;
        margin-bottom: 17px;
    }

    .schedules-page-heading h2 {
        font-size: 25px;
    }

    .schedules-date-summary {
        align-items: flex-start;
        margin-top: 12px;
    }

    .schedules-toolbar {
        grid-template-columns: 1fr;
        gap: 10px;
    }

    .schedule-add-button {
        grid-column: auto;
        height: 40px;
    }

    .schedule-list-card {
        border-radius: 17px;
    }

    .schedule-list-heading {
        padding: 16px 14px 12px;
    }

    .schedule-table {
        min-width: 760px;
        padding: 0 14px;
    }

    .schedule-list-footer {
        align-items: flex-start;
        flex-direction: column;
        padding: 12px 14px;
    }

    .schedule-footer-actions {
        width: 100%;
    }

    .schedule-edit-button,
    .schedule-delete-button {
        flex: 1;
    }

    .schedule-capacity-note {
        margin-top: 12px;
    }

    .schedule-modal-overlay {
        align-items: flex-end;
        padding: 0;
    }

    .schedule-modal {
        width: 100%;
        max-height: 92dvh;
        border-radius: 22px 22px 0 0;
    }

    .schedule-form-grid {
        grid-template-columns: 1fr;
    }
}

`}
</style>

        </main>
    );
};

export default AdminDashboard;