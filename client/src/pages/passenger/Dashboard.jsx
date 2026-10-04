import React, {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    FaHome,
    FaSearch,
    FaTicketAlt,
    FaUser,
    FaShip,
    FaReceipt,
    FaArrowRight,
    FaCalendarAlt,
    FaClock,
    FaUsers,
    FaMapMarkerAlt,
    FaShieldAlt,
    FaSignOutAlt
} from "react-icons/fa";


// =========================================================
// API
// =========================================================
const API_URL =
    (import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:5000/api").replace(
            /\/api\/?$/,
            ""
        );


const Dashboard = () => {

    const navigate = useNavigate();


    // =========================================================
    // STATES
    // =========================================================

    const [
        recentBookings,
        setRecentBookings
    ] = useState([]);

    const [
        showLogoutModal,
        setShowLogoutModal
    ] = useState(false);


    // =========================================================
    // LOGO
    // =========================================================

    const logoUrl =
    "/images/guimarasgo-logo.png";

    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogoutClick = () => {

        setShowLogoutModal(true);

    };


    const handleCancelLogout = () => {

        setShowLogoutModal(false);

    };


    // =========================================================
    // ACCOUNT-SPECIFIC BOOKING STORAGE
    // =========================================================
    // Keep booking history tied to the logged-in account instead of
    // the current browser session. This lets bookings survive logout
    // while preventing one account from seeing another account's history.
    const getAccountBookingKey = () => {

        const storedUser =
            localStorage.getItem("username") ||
            sessionStorage.getItem("username") ||
            localStorage.getItem("email") ||
            sessionStorage.getItem("email");

        if (storedUser) {
            return `guimarasgo_bookings_${String(storedUser).trim().toLowerCase()}`;
        }

        const rawUser =
            sessionStorage.getItem("user") ||
            localStorage.getItem("user") ||
            sessionStorage.getItem("student") ||
            localStorage.getItem("student");

        if (rawUser) {
            try {
                const user = JSON.parse(rawUser);
                const identifier =
                    user?.email ||
                    user?.username ||
                    user?.userId ||
                    user?._id ||
                    user?.id;

                if (identifier) {
                    return `guimarasgo_bookings_${String(identifier).trim().toLowerCase()}`;
                }
            } catch (error) {
                // Keep existing behavior if stored user data is not JSON.
            }
        }

        return "guimarasgo_bookings_guest";
    };


    const handleConfirmLogout = () => {

        // The account-specific booking history is intentionally stored
        // in localStorage and is NOT removed during logout.
        // Only the active login/session data is cleared below.

        // Clear the old session-only history so it cannot be
        // accidentally shown to another account on this browser.
        // The permanent account-specific history remains in localStorage.
        sessionStorage.removeItem(
            "allBookings"
        );

        sessionStorage.removeItem(
            "username"
        );

        sessionStorage.removeItem(
            "student"
        );

        sessionStorage.removeItem(
            "user"
        );

        sessionStorage.removeItem(
            "loggedIn"
        );

        sessionStorage.removeItem(
            "isLoggedIn"
        );

        setShowLogoutModal(false);

        navigate("/");

    };


    // =========================================================
    // LOAD BOOKINGS
    // =========================================================

    useEffect(() => {

        loadBookings();

        const handleStorageChange = () => {

            loadBookings();

        };

        window.addEventListener(
            "storage",
            handleStorageChange
        );

        return () => {

            window.removeEventListener(
                "storage",
                handleStorageChange
            );

        };

    }, []);


    // =========================================================
    // LOAD ALL BOOKINGS
    // =========================================================

    const loadBookings = async () => {

        try {

            let allBookings = [];


            // =================================================
            // MAIN BOOKING HISTORY
            // =================================================

            const accountBookingKey =
                getAccountBookingKey();

            let savedAllBookings =
                localStorage.getItem(
                    accountBookingKey
                );

            // Migrate the current account's older session-only history
            // once, so existing bookings are not lost.
            if (!savedAllBookings) {
                savedAllBookings =
                    sessionStorage.getItem(
                        "allBookings"
                    );

                if (savedAllBookings) {
                    localStorage.setItem(
                        accountBookingKey,
                        savedAllBookings
                    );
                }
            }


            if (savedAllBookings) {

                const parsed =
                    JSON.parse(
                        savedAllBookings
                    );


                if (
                    Array.isArray(parsed)
                ) {

                    allBookings = parsed;

                }

            }


            // =================================================
            // RECENT BOOKINGS COMPATIBILITY
            // =================================================

            const savedRecentBookings =
                sessionStorage.getItem(
                    "recentBookings"
                );


            if (savedRecentBookings) {

                const parsedRecent =
                    JSON.parse(
                        savedRecentBookings
                    );


                if (
                    Array.isArray(
                        parsedRecent
                    )
                ) {

                    parsedRecent.forEach(
                        (booking) => {

                            const exists =
                                allBookings.some(
                                    (item) =>
                                        item.bookingReference ===
                                        booking.bookingReference
                                );


                            if (!exists) {

                                allBookings.push(
                                    booking
                                );

                            }

                        }
                    );

                }

            }


            // =================================================
            // CONFIRMED BOOKING COMPATIBILITY
            // =================================================

            const confirmedBooking =
                sessionStorage.getItem(
                    "confirmedBooking"
                );


            if (confirmedBooking) {

                const booking =
                    JSON.parse(
                        confirmedBooking
                    );


                const exists =
                    allBookings.some(
                        (item) =>
                            item.bookingReference ===
                            booking.bookingReference
                    );


                if (!exists) {

                    allBookings.push(
                        booking
                    );

                }

            }


            // =================================================
            // REFRESH BOOKINGS FROM MONGODB
            // =================================================
            // Staff boarding decisions are made on a different
            // device, so the dashboard must not rely only on
            // sessionStorage for the latest booking status.
            // Existing local data is kept if the API is unavailable.

            const refreshedBookings =
                await Promise.all(
                    allBookings.map(
                        async (localBooking) => {
                            const bookingReference =
                                localBooking?.bookingReference;

                            if (!bookingReference) {
                                return localBooking;
                            }

                            try {
                                const response =
                                    await fetch(
                                        `${API_URL}/api/payment/booking/${encodeURIComponent(
                                            bookingReference
                                        )}`,
                                        {
                                            headers: {
                                                Authorization: `Bearer ${
                                                    localStorage.getItem("token") ||
                                                    sessionStorage.getItem("token") ||
                                                    ""
                                                }`,
                                                Accept: "application/json"
                                            }
                                        }
                                    );

                                if (!response.ok) {
                                    return localBooking;
                                }

                                const data =
                                    await response.json();

                                if (
                                    data?.success &&
                                    data?.booking
                                ) {
                                    return {
                                        ...localBooking,
                                        ...data.booking
                                    };
                                }

                            } catch (refreshError) {
                                console.warn(
                                    `Unable to refresh dashboard booking ${bookingReference}:`,
                                    refreshError
                                );
                            }

                            return localBooking;
                        }
                    )
                );

            allBookings =
                refreshedBookings;


            // =================================================
            // SAVE COMPLETE HISTORY
            // =================================================

            localStorage.setItem(
                accountBookingKey,
                JSON.stringify(
                    allBookings
                )
            );

            // Keep the existing sessionStorage copy for compatibility
            // with the current dashboard flow.
            sessionStorage.setItem(
                "allBookings",
                JSON.stringify(
                    allBookings
                )
            );


            // =================================================
            // SHOW NEWEST 3 BOOKINGS
            // =================================================

            const recent =
                [
                    ...allBookings
                ]
                    .reverse()
                    .slice(
                        0,
                        3
                    );


            setRecentBookings(
                recent
            );


            // =================================================
            // KEEP COMPATIBILITY
            // =================================================

            localStorage.setItem(
                `${accountBookingKey}_recent`,
                JSON.stringify(
                    recent
                )
            );

            sessionStorage.setItem(
                "recentBookings",
                JSON.stringify(
                    recent
                )
            );


        } catch (error) {

            console.error(
                "Error loading bookings:",
                error
            );

            setRecentBookings([]);

        }

    };


    // =========================================================
    // NAVIGATION
    // =========================================================

    const goToBooking = () => {

        navigate(
            "/book-trip"
        );

    };


    const viewBooking = (
        booking
    ) => {

        sessionStorage.setItem(
            "confirmedBooking",
            JSON.stringify(
                booking
            )
        );

        navigate(
            "/confirmation"
        );

    };


    const viewAllBookings = () => {

        navigate(
            "/bookings"
        );

    };


    // =========================================================
    // POPULAR ROUTES
    // =========================================================

    const popularRoutes = [

        {
            origin:
                "Iloilo",

            destination:
                "Guimaras",

            duration:
                "35 min",

            fare:
                "₱150",

            icon:
                "⛴️"
        },

        {
            origin:
                "Guimaras",

            destination:
                "Iloilo",

            duration:
                "35 min",

            fare:
                "₱150",

            icon:
                "⛴️"
        }

    ];


    return (

        <>

                <style>{`

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
                        Inter,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        Arial,
                        Helvetica,
                        sans-serif;
                    background: #f4f7fb;
                    color: #142033;
                }

                button {
                    font-family: inherit;
                }

                .dashboard-page {
                    min-height: 100vh;
                    padding-bottom: 118px;
                    background:
                        radial-gradient(circle at 10% 0%, rgba(255, 145, 76, 0.12), transparent 30%),
                        radial-gradient(circle at 92% 18%, rgba(20, 52, 93, 0.08), transparent 28%),
                        linear-gradient(180deg, #f8fafc 0%, #f3f6fa 100%);
                }

                .dashboard-container {
                    width: 100%;
                    max-width: 1280px;
                    min-height: 100vh;
                    margin: 0 auto;
                    background: rgba(255, 255, 255, 0.72);
                    box-shadow: 0 0 60px rgba(15, 23, 42, 0.04);
                }

                /* ================================
                   HEADER
                ================================ */

                .dashboard-header {
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    min-height: 78px;
                    padding: 0 42px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    background: rgba(255, 255, 255, 0.92);
                    border-bottom: 1px solid rgba(226, 232, 240, 0.9);
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                }

                .dashboard-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 0;
                }

                .dashboard-logo img {
                    width: 116px;
                    height: auto;
                    object-fit: contain;
                    display: block;
                }

                .header-divider {
                    width: 1px;
                    height: 28px;
                    background: #e2e8f0;
                }

                .header-context {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .header-context strong {
                    color: #172033;
                    font-size: 13px;
                    font-weight: 800;
                }

                .header-context span {
                    color: #94a3b8;
                    font-size: 10px;
                    font-weight: 600;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .header-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    padding: 9px 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 999px;
                    background: #ffffff;
                    color: #64748b;
                    font-size: 10px;
                    font-weight: 700;
                }

                .header-status-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #16a34a;
                    box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.10);
                }

                .logout-header-button {
                    width: 40px;
                    height: 40px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    background: #ffffff;
                    color: #64748b;
                    font-size: 15px;
                    cursor: pointer;
                    transition: 0.2s ease;
                }

                .logout-header-button:hover {
                    color: #dc2626;
                    background: #fef2f2;
                    border-color: #fecaca;
                    transform: translateY(-1px);
                }

                /* ================================
                   MAIN CONTENT
                ================================ */

                .dashboard-content {
                    padding: 30px 42px 0;
                }

                .welcome-section {
                    position: relative;
                    overflow: hidden;
                    min-height: 320px;
                    padding: 48px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    justify-content: center;
                    border: 1px solid rgba(255, 184, 140, 0.75);
                    border-radius: 28px;
                    background:
                        linear-gradient(105deg, rgba(255, 248, 242, 0.94) 0%, rgba(255, 249, 245, 0.78) 46%, rgba(246, 249, 252, 0.82) 100%),
                        url("https://orbitshub.com/wp-content/uploads/2023/10/what-exactly-are-roro-ships-1024x576.jpg");
                    background-size: cover;
                    background-position: center;
                    box-shadow:
                        0 20px 50px rgba(15, 23, 42, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 0.8);
                }

                .welcome-section::before {
                    content: "";
                    position: absolute;
                    width: 300px;
                    height: 300px;
                    right: -95px;
                    top: -110px;
                    border-radius: 50%;
                    background: rgba(255, 120, 24, 0.10);
                    pointer-events: none;
                }

                .welcome-section::after {
                    content: "";
                    position: absolute;
                    width: 170px;
                    height: 170px;
                    right: 100px;
                    bottom: -100px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.55);
                    pointer-events: none;
                }

                .welcome-content {
                    position: relative;
                    z-index: 2;
                    max-width: 610px;
                }

                .welcome-eyebrow {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 14px;
                    padding: 7px 11px;
                    border: 1px solid rgba(255, 120, 24, 0.18);
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.74);
                    color: #c85b0a;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }

                .welcome-eyebrow-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #ff7818;
                }

                .welcome-section h1 {
                    margin: 0 0 10px;
                    color: #101828;
                    font-size: clamp(32px, 4vw, 48px);
                    font-weight: 850;
                    line-height: 1.06;
                    letter-spacing: -0.04em;
                }

                .welcome-section p {
                    max-width: 530px;
                    margin: 0 0 25px;
                    color: #596579;
                    font-size: 15px;
                    line-height: 1.65;
                }

                .book-button {
                    position: relative;
                    z-index: 2;
                    min-height: 48px;
                    padding: 0 20px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    border: none;
                    border-radius: 13px;
                    background: linear-gradient(135deg, #ff7818 0%, #ed650d 100%);
                    color: #ffffff;
                    font-size: 13px;
                    font-weight: 800;
                    cursor: pointer;
                    box-shadow: 0 10px 24px rgba(255, 120, 24, 0.24);
                    transition: 0.22s ease;
                }

                .book-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 14px 28px rgba(255, 120, 24, 0.30);
                }

                .book-button-arrow {
                    font-size: 12px;
                    transition: transform 0.2s ease;
                }

                .book-button:hover .book-button-arrow {
                    transform: translateX(3px);
                }

                .welcome-trust-row {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 16px;
                    margin-top: 20px;
                    color: #718096;
                    font-size: 10px;
                    font-weight: 700;
                }

                .welcome-trust-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .welcome-trust-item svg {
                    color: #16a34a;
                    font-size: 11px;
                }

                /* ================================
                   QUICK ACTIONS
                ================================ */

                .quick-actions {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 16px;
                    margin-top: 20px;
                }

                .feature-card {
                    min-height: 126px;
                    padding: 22px 23px;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    justify-content: center;
                    text-align: left;
                    border: 1px solid #e5eaf0;
                    border-radius: 20px;
                    background: #ffffff;
                    cursor: pointer;
                    box-shadow: 0 7px 24px rgba(15, 23, 42, 0.04);
                    transition: 0.22s ease;
                }

                .feature-card:hover {
                    transform: translateY(-3px);
                    border-color: #ffd2b5;
                    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
                }

                .feature-card-icon {
                    width: 40px;
                    height: 40px;
                    margin-bottom: 13px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    background: #fff3ea;
                    color: #f36d14;
                    font-size: 16px;
                }

                .feature-card:nth-child(2) .feature-card-icon {
                    background: #eef4ff;
                    color: #315ea8;
                }

                .feature-card strong {
                    display: block;
                    margin-bottom: 4px;
                    color: #172033;
                    font-size: 14px;
                    font-weight: 800;
                }

                .feature-card > span:last-child {
                    color: #8a96a8;
                    font-size: 11px;
                    font-weight: 600;
                }

                .feature-card-arrow {
                    position: absolute;
                    right: 20px;
                    top: 20px;
                    color: #c3ccd7;
                    font-size: 12px;
                    transition: 0.2s ease;
                }

                .feature-card:hover .feature-card-arrow {
                    color: #ff7818;
                    transform: translateX(3px);
                }

                /* ================================
                   SECTION HEADERS
                ================================ */

                .recent-bookings,
                .popular-section {
                    margin-top: 34px;
                }

                .section-header,
                .popular-header {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 16px;
                    margin-bottom: 15px;
                }

                .section-heading-wrap {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .section-accent {
                    width: 4px;
                    height: 26px;
                    flex: 0 0 auto;
                    border-radius: 999px;
                    background: #ff7818;
                }

                .section-header h2,
                .popular-header h2 {
                    margin: 0;
                    color: #172033;
                    font-size: 20px;
                    font-weight: 850;
                    letter-spacing: -0.02em;
                }

                .section-subtitle {
                    margin: 4px 0 0;
                    color: #94a3b8;
                    font-size: 10px;
                    font-weight: 600;
                }

                .section-header button {
                    border: none;
                    background: transparent;
                    color: #e9680c;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    white-space: nowrap;
                }

                .section-header button:hover {
                    text-decoration: underline;
                }

                /* ================================
                   RECENT BOOKINGS
                ================================ */

                .recent-list {
                    display: flex;
                    flex-direction: column;
                    gap: 11px;
                }

                .recent-empty {
                    min-height: 150px;
                    padding: 25px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    border: 1px dashed #dbe2ea;
                    border-radius: 18px;
                    background: rgba(255, 255, 255, 0.76);
                    color: #94a3b8;
                    font-size: 12px;
                }

                .recent-empty-icon {
                    width: 42px;
                    height: 42px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 13px;
                    background: #f1f5f9;
                    color: #94a3b8;
                    font-size: 16px;
                }

                .booking-card {
                    width: 100%;
                    padding: 18px;
                    text-align: left;
                    border: 1px solid #e5eaf0;
                    border-radius: 18px;
                    background: #ffffff;
                    cursor: pointer;
                    transition: 0.22s ease;
                    box-shadow: 0 5px 18px rgba(15, 23, 42, 0.03);
                }

                .booking-card:hover {
                    transform: translateY(-2px);
                    border-color: #ffd1b3;
                    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
                }

                .booking-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }

                .booking-route {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    min-width: 0;
                }

                .booking-icon {
                    width: 42px;
                    height: 42px;
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 13px;
                    background: #fff2e9;
                    color: #f36d14;
                    font-size: 17px;
                }

                .booking-route strong {
                    display: block;
                    color: #172033;
                    font-size: 13px;
                    font-weight: 800;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .booking-reference {
                    display: block;
                    margin-top: 4px;
                    color: #9aa5b4;
                    font-size: 9px;
                    font-weight: 600;
                }

                .booking-status {
                    flex: 0 0 auto;
                    padding: 6px 9px;
                    border: 1px solid #fed7aa;
                    border-radius: 999px;
                    background: #fff7ed;
                    color: #c85b0a;
                    font-size: 8px;
                    font-weight: 800;
                    letter-spacing: 0.03em;
                }

                .booking-status.rejected {
                    border-color: #fecaca;
                    background: #fef2f2;
                    color: #b91c1c;
                }

                .booking-info {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 10px;
                    margin-top: 15px;
                    padding-top: 14px;
                    border-top: 1px solid #edf1f5;
                }

                .booking-info-item {
                    min-width: 0;
                }

                .booking-info small {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    margin-bottom: 5px;
                    color: #9aa5b4;
                    font-size: 8px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }

                .booking-info small svg {
                    font-size: 8px;
                }

                .booking-info strong {
                    display: block;
                    color: #2b3545;
                    font-size: 11px;
                    font-weight: 750;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                /* ================================
                   POPULAR ROUTES
                ================================ */

                .popular-header > span {
                    color: #94a3b8;
                    font-size: 10px;
                    font-weight: 600;
                }

                .popular-routes {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 16px;
                }

                .popular-route {
                    position: relative;
                    min-height: 145px;
                    padding: 20px;
                    text-align: left;
                    border: 1px solid #e5eaf0;
                    border-radius: 19px;
                    background: #ffffff;
                    cursor: pointer;
                    transition: 0.22s ease;
                    overflow: hidden;
                }

                .popular-route::after {
                    content: "";
                    position: absolute;
                    width: 130px;
                    height: 130px;
                    right: -65px;
                    bottom: -75px;
                    border-radius: 50%;
                    background: #fff3ea;
                }

                .popular-route:hover {
                    transform: translateY(-3px);
                    border-color: #ffd1b3;
                    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
                }

                .route-icon {
                    width: 42px;
                    height: 42px;
                    margin-bottom: 15px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 13px;
                    background: #fff2e9;
                    color: #f36d14;
                    font-size: 17px;
                }

                .route-name {
                    color: #172033;
                    font-size: 14px;
                    font-weight: 800;
                }

                .route-duration {
                    margin-top: 6px;
                    color: #94a3b8;
                    font-size: 10px;
                    font-weight: 600;
                }

                .route-fare {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    z-index: 2;
                    color: #e9680c;
                    font-size: 14px;
                    font-weight: 850;
                }

                .route-arrow {
                    position: absolute;
                    right: 20px;
                    bottom: 20px;
                    z-index: 2;
                    color: #c2ccd8;
                    font-size: 12px;
                }

                /* ================================
                   FOOTER
                ================================ */

                .dashboard-footer {
                    width: 100%;
                    margin-top: 40px;
                    padding: 21px 0 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                    border-top: 1px solid #e6ebf0;
                    color: #94a3b8;
                    font-size: 10px;
                    font-weight: 600;
                }

                .dashboard-footer span:first-child {
                    color: #64748b;
                    font-weight: 800;
                }

                .dashboard-footer span:last-child {
                    text-align: right;
                }

                /* ================================
                   BOTTOM NAVIGATION
                ================================ */

                .bottom-navigation {
                    position: fixed;
                    left: 50%;
                    bottom: 14px;
                    transform: translateX(-50%);
                    z-index: 100;
                    width: min(700px, calc(100% - 32px));
                    height: 72px;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    align-items: center;
                    padding: 5px;
                    border: 1px solid rgba(226, 232, 240, 0.95);
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.94);
                    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.14);
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                }

                .nav-item {
                    height: 60px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    border: none;
                    border-radius: 15px;
                    background: transparent;
                    color: #9aa5b4;
                    cursor: pointer;
                    transition: 0.2s ease;
                }

                .nav-item span {
                    width: 32px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    border-radius: 10px;
                    transition: 0.2s ease;
                }

                .nav-item small {
                    font-size: 9px;
                    font-weight: 750;
                }

                .nav-item.active {
                    color: #e9680c;
                }

                .nav-item.active span {
                    background: #fff1e7;
                }

                .nav-item:hover {
                    color: #e9680c;
                    background: #fff8f3;
                }

                /* ================================
                   LOGOUT MODAL
                ================================ */

                .logout-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(15, 23, 42, 0.48);
                    backdrop-filter: blur(7px);
                    -webkit-backdrop-filter: blur(7px);
                    animation: logoutFadeIn 0.2s ease;
                }

                @keyframes logoutFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .logout-modal {
                    width: 100%;
                    max-width: 390px;
                    padding: 30px;
                    text-align: center;
                    border: 1px solid rgba(226, 232, 240, 0.9);
                    border-radius: 23px;
                    background: #ffffff;
                    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.24);
                    animation: logoutModalIn 0.22s ease;
                }

                @keyframes logoutModalIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .logout-icon {
                    width: 58px;
                    height: 58px;
                    margin: 0 auto 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 17px;
                    background: #fff2f2;
                    color: #dc2626;
                    font-size: 22px;
                }

                .logout-modal h2 {
                    margin: 0 0 8px;
                    color: #172033;
                    font-size: 20px;
                    font-weight: 850;
                }

                .logout-modal p {
                    margin: 0 0 23px;
                    color: #7c8798;
                    font-size: 12px;
                    line-height: 1.6;
                }

                .logout-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                .logout-cancel-button,
                .logout-confirm-button {
                    min-height: 44px;
                    border: none;
                    border-radius: 11px;
                    font-size: 12px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: 0.2s ease;
                }

                .logout-cancel-button {
                    background: #f1f5f9;
                    color: #475569;
                }

                .logout-cancel-button:hover {
                    background: #e2e8f0;
                }

                .logout-confirm-button {
                    background: #dc2626;
                    color: #ffffff;
                }

                .logout-confirm-button:hover {
                    background: #b91c1c;
                    transform: translateY(-1px);
                }

                /* ================================
                   TABLET
                ================================ */

                @media (max-width: 900px) {
                    .dashboard-header {
                        padding: 0 24px;
                    }

                    .dashboard-content {
                        padding-left: 24px;
                        padding-right: 24px;
                    }

                    .welcome-section {
                        padding: 38px;
                    }
                }

                /* ================================
                   MOBILE
                ================================ */

                @media (max-width: 600px) {
                    .dashboard-page {
                        padding-bottom: 102px;
                    }

                    .dashboard-header {
                        min-height: 64px;
                        padding: 0 16px;
                    }

                    .dashboard-logo img {
                        width: 94px;
                    }

                    .header-divider,
                    .header-context,
                    .header-status {
                        display: none;
                    }

                    .logout-header-button {
                        width: 37px;
                        height: 37px;
                        border-radius: 11px;
                    }

                    .dashboard-content {
                        padding: 18px 16px 0;
                    }

                    .welcome-section {
                        min-height: 300px;
                        padding: 30px 22px;
                        border-radius: 21px;
                        background-position: 62% center;
                    }

                    .welcome-section h1 {
                        font-size: 31px;
                    }

                    .welcome-section p {
                        font-size: 13px;
                        line-height: 1.55;
                    }

                    .book-button {
                        width: 100%;
                        max-width: 245px;
                    }

                    .welcome-trust-row {
                        gap: 9px 13px;
                        font-size: 9px;
                    }

                    .quick-actions {
                        grid-template-columns: 1fr;
                        gap: 12px;
                        margin-top: 14px;
                    }

                    .feature-card {
                        min-height: 112px;
                        padding: 18px;
                    }

                    .recent-bookings,
                    .popular-section {
                        margin-top: 28px;
                    }

                    .section-header,
                    .popular-header {
                        align-items: center;
                    }

                    .section-header h2,
                    .popular-header h2 {
                        font-size: 18px;
                    }

                    .section-subtitle {
                        display: none;
                    }

                    .recent-empty {
                        min-height: 130px;
                    }

                    .booking-card {
                        padding: 15px;
                    }

                    .booking-top {
                        align-items: flex-start;
                    }

                    .booking-route strong {
                        max-width: 190px;
                    }

                    .booking-status {
                        font-size: 7px;
                        padding: 5px 7px;
                    }

                    .booking-info {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 12px 10px;
                    }

                    .popular-routes {
                        grid-template-columns: 1fr;
                        gap: 11px;
                    }

                    .popular-route {
                        min-height: 128px;
                        padding: 18px;
                    }

                    .route-fare {
                        top: 18px;
                        right: 18px;
                    }

                    .route-arrow {
                        right: 18px;
                        bottom: 18px;
                    }

                    .dashboard-footer {
                        flex-direction: column;
                        justify-content: center;
                        text-align: center;
                        padding: 20px 0 28px;
                    }

                    .dashboard-footer span:last-child {
                        text-align: center;
                    }

                    .bottom-navigation {
                        bottom: 9px;
                        width: calc(100% - 20px);
                        height: 68px;
                        border-radius: 18px;
                    }

                    .nav-item {
                        height: 58px;
                    }

                    .nav-item span {
                        font-size: 17px;
                    }
                }

                @media (max-width: 380px) {
                    .dashboard-content {
                        padding-left: 12px;
                        padding-right: 12px;
                    }

                    .welcome-section {
                        padding-left: 18px;
                        padding-right: 18px;
                    }

                    .welcome-section h1 {
                        font-size: 28px;
                    }

                    .bottom-navigation {
                        width: calc(100% - 14px);
                        bottom: 7px;
                    }
                }

                `}</style>



            <main className="dashboard-page">

                <div className="dashboard-container">


                    {/* =================================================
                       HEADER
                    ================================================= */}

                    <header
                        className="dashboard-header"
                    >

                        <div className="dashboard-logo">

                            <img
                                src={logoUrl}
                                alt="GuimarasGo Logo"
                            />

                            <span className="header-divider" aria-hidden="true"></span>

                            <div className="header-context">
                                <strong>Traveler Dashboard</strong>
                                <span>Manage your ferry journey</span>
                            </div>

                        </div>

                        <div className="header-actions">

                            <div className="header-status">
                                <span className="header-status-dot" aria-hidden="true"></span>
                                Booking access active
                            </div>

                            <button
                                type="button"
                                className="logout-header-button"
                                onClick={handleLogoutClick}
                                aria-label="Logout"
                                title="Logout"
                            >
                                <FaSignOutAlt />
                            </button>

                        </div>

                    </header>


                    <div className="dashboard-content">

                    {/* =================================================
                       WELCOME
                    ================================================= */}

                    <section
                        className="welcome-section"
                    >

                        <div className="welcome-content">

                            <div className="welcome-eyebrow">
                                <span className="welcome-eyebrow-dot" aria-hidden="true"></span>
                                Iloilo ↔ Guimaras Ferry Travel
                            </div>

                            <h1>
                                Welcome to GuimarasGo
                            </h1>

                            <p>
                                Your gateway to convenient island travel.
                                Find your ferry, reserve your seats, and keep
                                your booking details in one place.
                            </p>

                            <button
                                type="button"
                                className="book-button"
                                onClick={goToBooking}
                            >
                                <FaShip />
                                Book a Trip
                                <span className="book-button-arrow" aria-hidden="true">
                                    <FaArrowRight />
                                </span>
                            </button>

                            <div className="welcome-trust-row">
                                <span className="welcome-trust-item">
                                    <FaShieldAlt />
                                    Secure booking
                                </span>
                                <span className="welcome-trust-item">
                                    <FaTicketAlt />
                                    Digital ticket records
                                </span>
                                <span className="welcome-trust-item">
                                    <FaMapMarkerAlt />
                                    Iloilo ↔ Guimaras
                                </span>
                            </div>

                        </div>

                    </section>


                    {/* =================================================
                       QUICK ACTIONS
                    ================================================= */}

                    <section
                        className="quick-actions"
                    >

                        <button
                            type="button"
                            className="feature-card"
                            onClick={
                                goToBooking
                            }
                        >

                            <span className="feature-card-icon" aria-hidden="true">
                                <FaShip />
                            </span>

                            <strong>
                                Book a Trip
                            </strong>

                            <span>
                                Choose your route
                            </span>

                            <span className="feature-card-arrow" aria-hidden="true">
                                <FaArrowRight />
                            </span>

                        </button>


                        <button
                            type="button"
                            className="feature-card"
                            onClick={
                                viewAllBookings
                            }
                        >

                            <span className="feature-card-icon" aria-hidden="true">
                                <FaReceipt />
                            </span>

                            <strong>
                                My Bookings
                            </strong>

                            <span>
                                View your tickets
                            </span>

                            <span className="feature-card-arrow" aria-hidden="true">
                                <FaArrowRight />
                            </span>

                        </button>

                    </section>


                    {/* =================================================
                       RECENT BOOKINGS
                    ================================================= */}

                    <section
                        className="recent-bookings"
                    >

                        <div
                            className="section-header"
                        >

                            <div className="section-heading-wrap">
                                <span className="section-accent" aria-hidden="true"></span>
                                <div>
                                    <h2>Recent Bookings</h2>
                                    <p className="section-subtitle">Your latest ferry reservations</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    viewAllBookings
                                }
                            >
                                See All
                            </button>

                        </div>


                        {recentBookings.length === 0 ? (

                            <div className="recent-empty">
                                <span className="recent-empty-icon" aria-hidden="true">
                                    <FaTicketAlt />
                                </span>
                                <strong>No bookings yet</strong>
                                <span>Book your first ferry trip to see it here.</span>
                            </div>

                        ) : (

                            <div
                                className="recent-list"
                            >

                                {recentBookings.map(
                                    (
                                        booking,
                                        index
                                    ) => {

                                        const status =
                                            String(
                                                booking?.boardingStatus ||
                                                ""
                                            ).toUpperCase() ===
                                            "REJECTED"
                                                ? "REJECTED"
                                                : (
                                                    booking.status ||
                                                    "PENDING"
                                                ).toUpperCase();

                                        return (

                                            <button
                                                type="button"
                                                className="booking-card"
                                                key={
                                                    booking.bookingReference ||
                                                    index
                                                }
                                                onClick={() =>
                                                    viewBooking(
                                                        booking
                                                    )
                                                }
                                            >

                                                <div
                                                    className="booking-top"
                                                >

                                                    <div
                                                        className="booking-route"
                                                    >

                                                        <span
                                                            className="booking-icon"
                                                        >
                                                            <FaShip />
                                                        </span>

                                                        <div>

                                                            <strong>
                                                                {
                                                                    booking.origin ||
                                                                    "Iloilo"
                                                                }

                                                                {" → "}

                                                                {
                                                                    booking.destination ||
                                                                    "Guimaras"
                                                                }
                                                            </strong>

                                                            <span
                                                                className="booking-reference"
                                                            >
                                                                {
                                                                    booking.bookingReference ||
                                                                    "Booking Reference"
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>


                                                    <span
                                                        className={`booking-status ${status === "REJECTED" ? "rejected" : ""}`}
                                                    >
                                                        {status}
                                                    </span>

                                                </div>

                                                {status ===
                                                    "REJECTED" &&
                                                    booking.rejectionReason && (
                                                    <div
                                                        style={{
                                                            marginTop: "8px",
                                                            padding: "8px 10px",
                                                            background: "#fef2f2",
                                                            borderRadius: "8px",
                                                            color: "#991b1b",
                                                            fontSize: "11px",
                                                            lineHeight: "1.4"
                                                        }}
                                                    >
                                                        <strong>Rejected:</strong>{" "}
                                                        {booking.rejectionReason}
                                                    </div>
                                                )}


                                                <div
                                                    className="booking-info"
                                                >

                                                    <div>

                                                        <small>
                                                            <FaCalendarAlt />
                                                            Date
                                                        </small>

                                                        <strong>
                                                            {
                                                                booking.date ||
                                                                "N/A"
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <small>
                                                            <FaClock />
                                                            Departure
                                                        </small>

                                                        <strong>
                                                            {
                                                                booking.time ||
                                                                "N/A"
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <small>
                                                            <FaUsers />
                                                            Passengers
                                                        </small>

                                                        <strong>
                                                            {
                                                                booking.passengers ||
                                                                booking.numberOfPassengers ||
                                                                1
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <small>
                                                            Total
                                                        </small>

                                                        <strong>
                                                            ₱
                                                            {Number(
                                                                booking.totalFare ||
                                                                0
                                                            ).toFixed(
                                                                2
                                                            )}
                                                        </strong>

                                                    </div>

                                                </div>

                                            </button>

                                        );

                                    }
                                )}

                            </div>

                        )}

                    </section>


                    {/* =================================================
                       POPULAR ROUTES
                    ================================================= */}

                    <section
                        className="popular-section"
                    >

                        <div
                            className="popular-header"
                        >

                            <div className="section-heading-wrap">
                                <span className="section-accent" aria-hidden="true"></span>
                                <div>
                                    <h2>Popular Ferry Routes</h2>
                                    <p className="section-subtitle">Quick routes to start a booking</p>
                                </div>
                            </div>

                            <span>Fast access to available trips</span>

                        </div>


                        <div
                            className="popular-routes"
                        >

                            {popularRoutes.map(
                                (
                                    route,
                                    index
                                ) => (

                                    <button
                                        type="button"
                                        className="popular-route"
                                        key={
                                            `${route.origin}-${route.destination}-${index}`
                                        }
                                        onClick={
                                            goToBooking
                                        }
                                    >

                                        <div
                                            className="route-icon"
                                        >
                                            <FaShip />
                                        </div>


                                        <div
                                            className="route-name"
                                        >
                                            {route.origin}
                                            {" → "}
                                            {route.destination}
                                        </div>


                                        <div
                                            className="route-duration"
                                        >
                                            {route.duration}
                                        </div>


                                        <div
                                            className="route-fare"
                                        >
                                            {route.fare}
                                        </div>

                                        <span className="route-arrow" aria-hidden="true">
                                            <FaArrowRight />
                                        </span>

                                    </button>

                                )
                            )}

                        </div>

                    </section>


                    {/* =================================================
                       FOOTER
                    ================================================= */}

                    <footer
                        className="dashboard-footer"
                    >

                        <span>
                            GuimarasGo
                        </span>

                        <span>
                            Travel Smarter Across Guimaras
                        </span>

                    </footer>

                    </div>


                    {/* =================================================
                       BOTTOM NAVIGATION
                    ================================================= */}

                    <nav
                        className="bottom-navigation"
                        aria-label="Main navigation"
                    >

                        {/* HOME */}

                        <button
                            type="button"
                            className="nav-item active"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >

                            <span>
                                <FaHome />
                            </span>

                            <small>
                                Home
                            </small>

                        </button>


                        {/* SEARCH */}

                        <button
                            type="button"
                            className="nav-item"
                            onClick={() =>
                                navigate(
                                    "/trips"
                                )
                            }
                        >

                            <span>
                                <FaSearch />
                            </span>

                            <small>
                                Search
                            </small>

                        </button>


                        {/* TICKETS */}

                        <button
                            type="button"
                            className="nav-item"
                            onClick={() =>
                                navigate(
                                    "/bookings"
                                )
                            }
                        >

                            <span>
                                <FaTicketAlt />
                            </span>

                            <small>
                                Tickets
                            </small>

                        </button>


                        {/* PROFILE */}

                        <button
                            type="button"
                            className="nav-item"
                            onClick={() =>
                                navigate(
                                    "/profile"
                                )
                            }
                        >

                            <span>
                                <FaUser />
                            </span>

                            <small>
                                Profile
                            </small>

                        </button>

                    </nav>

                </div>

            </main>


            {/* =========================================================
               LOGOUT CONFIRMATION MODAL
            ========================================================= */}

            {showLogoutModal && (

                <div
                    className="logout-overlay"
                    onClick={
                        handleCancelLogout
                    }
                >

                    <div
                        className="logout-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div
                            className="logout-icon"
                        >
                            ⇥
                        </div>


                        <h2>
                            Logout?
                        </h2>


                        <p>
                            Are you sure you want to
                            logout from GuimarasGo?
                        </p>


                        <div
                            className="logout-actions"
                        >

                            <button
                                type="button"
                                className="logout-cancel-button"
                                onClick={
                                    handleCancelLogout
                                }
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="logout-confirm-button"
                                onClick={
                                    handleConfirmLogout
                                }
                            >
                                Yes, Logout
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </>
    );
};


export default Dashboard;