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
    FaUser
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
            "/trips"
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
                        Inter,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        Arial,
                        Helvetica,
                        sans-serif;

                    background: #f7f8fa;

                    color: #222;

                }


                button {

                    font-family: inherit;

                }


                /* =================================================
                   PAGE
                ================================================= */

                .dashboard-page {
    background:
        linear-gradient(
            180deg,
            #fffdf9 0%,
            #fff7ef 35%,
            #fffaf7 100%
        );

    padding-bottom: 105px;
}


                .dashboard-container {

                    width: 100%;

                    max-width: 1200px;

                    min-height: 100vh;

                    margin: 0 auto;

                    background: #ffffff;

                    box-shadow:
                        0 0 40px
                        rgba(
                            0,
                            0,
                            0,
                            0.04
                        );

                }


                /* =================================================
                   HEADER
                ================================================= */

                .dashboard-header {

                    position: sticky;

                    top: 0;

                    z-index: 50;

                    height: 78px;

                    padding:
                        0
                        34px;

                    display: flex;

                    align-items: center;

                    justify-content:
                        space-between;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.96
                        );

                    border-bottom:
                        1px solid
                        #eeeeee;

                    backdrop-filter:
                        blur(10px);

                }


                .dashboard-logo {

                    display: flex;

                    align-items: center;

                    height: 100%;

                }


                .dashboard-logo img {

                    width: 112px;

                    height: auto;

                    object-fit: contain;

                }


                .menu-button {

                    width: 42px;

                    height: 42px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    border:
                        1px solid
                        #eeeeee;

                    border-radius:
                        12px;

                    background:
                        #ffffff;

                    color:
                        #555555;

                    font-size:
                        20px;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;

                }


                .menu-button:hover {

                    background:
                        #fff3eb;

                    color:
                        #ff7818;

                    border-color:
                        #ffd3bb;

                }


                /* =================================================
                   WELCOME SECTION
                   ONLY THE BACKGROUND WAS UPDATED
                ================================================= */

                .welcome-section {

                    position:
                        relative;

                    overflow:
                        hidden;

                    margin:
                        25px
                        34px
                        30px;

                    min-height:
                        290px;

                    padding:
                        55px
                        45px;

                    display:
                        flex;

                    flex-direction:
                        column;

                    align-items:
                        flex-start;

                    justify-content:
                        center;

                    border:
                        1px solid
                        #ffd8c2;

                    border-radius:
                        22px;


                    /* =========================================
                       YOUR DASHBOARD BACKGROUND URL
                    ========================================= */

                    background-image:

                        linear-gradient(
                            rgba(
                                255,
                                248,
                                241,
                                0.72
                            ),
                            rgba(
                                255,
                                248,
                                241,
                                0.72
                            )
                        ),

                        url(
                            "https://orbitshub.com/wp-content/uploads/2023/10/what-exactly-are-roro-ships-1024x576.jpg"
                        );


                    background-size:
                        cover;

                    background-position:
                        center center;

                    background-repeat:
                        no-repeat;


                    box-shadow:
                        0
                        10px
                        35px
                        rgba(
                            0,
                            0,
                            0,
                            0.06
                        );

                }


                .welcome-section h1 {

                    position:
                        relative;

                    z-index:
                        2;

                    margin:
                        0
                        0
                        8px;

                    color:
                        #111111;

                    font-size:
                        42px;

                    font-weight:
                        800;

                    line-height:
                        1.1;

                }


                .welcome-section p {

                    position:
                        relative;

                    z-index:
                        2;

                    margin:
                        0
                        0
                        25px;

                    color:
                        #666666;

                    font-size:
                        16px;

                }


                .book-button {

                    position:
                        relative;

                    z-index:
                        2;

                    border:
                        none;

                    border-radius:
                        10px;

                    padding:
                        14px
                        28px;

                    background:
                        #ff7818;

                    color:
                        #ffffff;

                    font-size:
                        14px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                    box-shadow:
                        0
                        8px
                        18px
                        rgba(
                            255,
                            120,
                            24,
                            0.22
                        );

                    transition:
                        0.2s ease;

                }


                .book-button:hover {

                    background:
                        #e9680c;

                    transform:
                        translateY(-2px);

                }


                /* =================================================
                   QUICK ACTIONS
                ================================================= */

                .quick-actions {

                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            2,
                            1fr
                        );

                    gap:
                        18px;

                    padding:
                        0
                        34px
                        30px;

                }


                .feature-card {

                    min-height:
                        125px;

                    padding:
                        22px;

                    display:
                        flex;

                    flex-direction:
                        column;

                    align-items:
                        flex-start;

                    justify-content:
                        center;

                    text-align:
                        left;

                    background:
                        #ffffff;

                    border:
                        1px solid
                        #e8e8e8;

                    border-radius:
                        18px;

                    cursor:
                        pointer;

                    box-shadow:
                        0
                        5px
                        20px
                        rgba(
                            0,
                            0,
                            0,
                            0.035
                        );

                    transition:
                        0.2s ease;

                }


                .feature-card:hover {

                    border-color:
                        #ffd3b9;

                    transform:
                        translateY(-2px);

                    box-shadow:
                        0
                        10px
                        25px
                        rgba(
                            255,
                            120,
                            24,
                            0.08
                        );

                }


                .feature-icon {

                    margin-bottom:
                        12px;

                    font-size:
                        21px;

                }


                .feature-card strong {

                    display:
                        block;

                    margin-bottom:
                        5px;

                    color:
                        #111111;

                    font-size:
                        15px;

                }


                .feature-card > span:last-child {

                    color:
                        #999999;

                    font-size:
                        12px;

                }


                /* =================================================
                   SECTION HEADERS
                ================================================= */

                .recent-bookings,
                .popular-section {

                    padding:
                        0
                        34px;

                }


                .section-header,
                .popular-header {

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    margin-bottom:
                        15px;

                }


                .section-header h2,
                .popular-header h2 {

                    margin:
                        0;

                    color:
                        #2c2926;

                    font-size:
                        22px;

                    font-weight:
                        800;

                }


                .section-header button {

                    border:
                        none;

                    background:
                        transparent;

                    color:
                        #ff7818;

                    font-size:
                        12px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                }


                /* =================================================
                   RECENT BOOKING
                ================================================= */

                .recent-list {

                    display:
                        flex;

                    flex-direction:
                        column;

                    gap:
                        12px;

                }


                .recent-empty {

                    min-height:
                        125px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border:
                        1px solid
                        #eeeeee;

                    border-radius:
                        18px;

                    color:
                        #999999;

                    font-size:
                        13px;

                    background:
                        #ffffff;

                }


                .booking-card {

                    padding:
                        18px;

                    background:
                        #ffffff;

                    border:
                        1px solid
                        #e8e8e8;

                    border-radius:
                        16px;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;

                }


                .booking-card:hover {

                    border-color:
                        #ffd3bb;

                }


                .booking-top {

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        12px;

                }


                .booking-route {

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        10px;

                }


                .booking-icon {

                    width:
                        42px;

                    height:
                        42px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        12px;

                    background:
                        #fff1e7;

                    font-size:
                        20px;

                }


                .booking-route strong {

                    display:
                        block;

                    color:
                        #111111;

                    font-size:
                        14px;

                }


                .booking-reference {

                    display:
                        block;

                    margin-top:
                        3px;

                    color:
                        #999999;

                    font-size:
                        10px;

                }


                .booking-status {

                    padding:
                        5px
                        9px;

                    border-radius:
                        20px;

                    background:
                        #fff1e7;

                    color:
                        #ff7818;

                    font-size:
                        9px;

                    font-weight:
                        700;

                }


                .booking-status.rejected {

                    background:
                        #fee2e2;

                    color:
                        #b91c1c;

                }


                .booking-info {

                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            4,
                            1fr
                        );

                    gap:
                        12px;

                    margin-top:
                        15px;

                    padding-top:
                        15px;

                    border-top:
                        1px solid
                        #eeeeee;

                }


                .booking-info small {

                    display:
                        block;

                    margin-bottom:
                        4px;

                    color:
                        #999999;

                    font-size:
                        9px;

                }


                .booking-info strong {

                    color:
                        #222222;

                    font-size:
                        11px;

                    font-weight:
                        500;

                }


                /* =================================================
                   POPULAR ROUTES
                ================================================= */

                .popular-section {

                    margin-top:
                        35px;

                }


                .popular-header span {

                    color:
                        #999999;

                    font-size:
                        12px;

                }


                .popular-routes {

                    max-width:
                        900px;

                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            2,
                            minmax(
                                0,
                                1fr
                            )
                        );

                    gap:
                        30px;

                }


                .popular-route {

                    position:
                        relative;

                    min-height:
                        145px;

                    padding:
                        20px;

                    background:
                        #ffffff;

                    border:
                        1px solid
                        #e8e8e8;

                    border-radius:
                        18px;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;

                }


                .popular-route:hover {

                    border-color:
                        #ffd3bb;

                    transform:
                        translateY(-2px);

                }


                .route-icon {

                    width:
                        44px;

                    height:
                        44px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        13px;

                    background:
                        #fff1e7;

                    font-size:
                        21px;

                    margin-bottom:
                        14px;

                }


                .route-name {

                    color:
                        #111111;

                    font-size:
                        15px;

                    font-weight:
                        700;

                }


                .route-duration {

                    margin-top:
                        6px;

                    color:
                        #999999;

                    font-size:
                        11px;

                }


                .route-fare {

                    position:
                        absolute;

                    top:
                        20px;

                    right:
                        20px;

                    color:
                        #ff7818;

                    font-size:
                        14px;

                    font-weight:
                        800;

                }


               /* =================================================
   FOOTER
================================================= */

.dashboard-footer {
    width: 100%;

    display: flex;

    justify-content: space-between;

    align-items: center;

    margin-top: 40px;

    padding: 20px 35px;

    border-top: 1px solid #e8e8e8;

    background: #ffffff;

    font-size: 11px;

    color: #8a8a8a;
}

.dashboard-footer span:first-child {
    font-weight: 600;

    color: #777777;
}

.dashboard-footer span:last-child {
    text-align: right;

    color: #999999;
}


/* =================================================
   FOOTER RESPONSIVE
================================================= */

@media (max-width: 600px) {

    .dashboard-footer {

        flex-direction: column;

        justify-content: center;

        gap: 6px;

        padding:
            18px
            20px;

        text-align: center;

    }

    .dashboard-footer span:last-child {

        text-align: center;

    }

}


                /* =================================================
                   BOTTOM NAVIGATION
                ================================================= */

                .bottom-navigation {

                    position:
                        fixed;

                    left:
                        50%;

                    bottom:
                        12px;

                    transform:
                        translateX(-50%);

                    z-index:
                        100;

                    width:
                        min(
                            850px,
                            calc(
                                100% - 30px
                            )
                        );

                    height:
                        76px;

                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            4,
                            1fr
                        );

                    align-items:
                        center;

                    padding:
                        5px;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.96
                        );

                    border:
                        1px solid
                        #eeeeee;

                    border-radius:
                        18px;

                    box-shadow:
                        0
                        12px
                        35px
                        rgba(
                            0,
                            0,
                            0,
                            0.12
                        );

                    backdrop-filter:
                        blur(12px);

                }


                .nav-item {

                    height:
                        66px;

                    display:
                        flex;

                    flex-direction:
                        column;

                    align-items:
                        center;

                    justify-content:
                        center;

                    gap:
                        5px;

                    border:
                        none;

                    background:
                        transparent;

                    color:
                        #aaaaaa;

                    cursor:
                        pointer;

                    border-radius:
                        14px;

                    transition:
                        0.2s ease;

                }


                .nav-item span {

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    font-size:
                        23px;

                }


                .nav-item small {

                    font-size:
                        11px;

                    font-weight:
                        600;

                }


                .nav-item.active {

                    color:
                        #ff7818;

                }


                .nav-item:hover {

                    color:
                        #ff7818;

                    background:
                        #fff6f0;

                }


                /* =================================================
                   LOGOUT MODAL
                ================================================= */

                .logout-overlay {

                    position:
                        fixed;

                    inset:
                        0;

                    z-index:
                        9999;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    padding:
                        20px;

                    background:
                        rgba(
                            0,
                            0,
                            0,
                            0.45
                        );

                    backdrop-filter:
                        blur(5px);

                    animation:
                        logoutFadeIn
                        0.2s ease;

                }


                @keyframes logoutFadeIn {

                    from {
                        opacity:
                            0;
                    }

                    to {
                        opacity:
                            1;
                    }

                }


                .logout-modal {

                    width:
                        100%;

                    max-width:
                        390px;

                    padding:
                        28px;

                    text-align:
                        center;

                    background:
                        #ffffff;

                    border-radius:
                        20px;

                    box-shadow:
                        0
                        25px
                        70px
                        rgba(
                            0,
                            0,
                            0,
                            0.20
                        );

                }


                .logout-icon {

                    width:
                        60px;

                    height:
                        60px;

                    margin:
                        0
                        auto
                        16px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        18px;

                    background:
                        #fff3eb;

                    color:
                        #ff7818;

                    font-size:
                        28px;

                }


                .logout-modal h2 {

                    margin:
                        0
                        0
                        8px;

                    font-size:
                        20px;

                }


                .logout-modal p {

                    margin:
                        0
                        0
                        22px;

                    color:
                        #777777;

                    font-size:
                        13px;

                    line-height:
                        1.5;

                }


                .logout-actions {

                    display:
                        grid;

                    grid-template-columns:
                        1fr
                        1fr;

                    gap:
                        10px;

                }


                .logout-cancel-button,
                .logout-confirm-button {

                    border:
                        none;

                    padding:
                        12px;

                    border-radius:
                        9px;

                    font-size:
                        12px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                }


                .logout-cancel-button {

                    background:
                        #f1f1f1;

                    color:
                        #555555;

                }


                .logout-cancel-button:hover {

                    background:
                        #e6e6e6;

                }


                .logout-confirm-button {

                    background:
                        #d9534f;

                    color:
                        #ffffff;

                }


                .logout-confirm-button:hover {

                    background:
                        #c43f3b;

                }


                /* =================================================
                   TABLET
                ================================================= */

                @media (
                    max-width: 800px
                ) {

                    .welcome-section {

                        margin:
                            22px
                            22px
                            25px;

                    }


                    .quick-actions {

                        grid-template-columns:
                            repeat(
                                2,
                                1fr
                            );

                        padding-left:
                            22px;

                        padding-right:
                            22px;

                    }


                    .recent-bookings,
                    .popular-section {

                        padding-left:
                            22px;

                        padding-right:
                            22px;

                    }

                }


                /* =================================================
                   MOBILE
                ================================================= */

                @media (
                    max-width: 600px
                ) {

                    .dashboard-page {

                        padding-bottom:
                            95px;

                    }


                    .dashboard-header {

                        height:
                            64px;

                        padding:
                            0
                            16px;

                    }


                    .dashboard-logo img {

                        width:
                            92px;

                        height:
                            48px;

                    }


                    .menu-button {

                        width:
                            38px;

                        height:
                            38px;

                    }


                    .welcome-section {

                        margin:
                            18px
                            16px
                            25px;

                        min-height:
                            260px;

                        padding:
                            42px
                            17px
                            44px;

                        border-radius:
                            18px;

                        background-position:
                            center center;

                    }


                    .welcome-section h1 {

                        font-size:
                            30px;

                    }


                    .welcome-section p {

                        font-size:
                            14px;

                    }


                    .book-button {

                        width:
                            100%;

                        max-width:
                            230px;

                    }


                    .quick-actions {

                        grid-template-columns:
                            1fr;

                        padding:
                            0
                            16px
                            30px;

                    }


                    .feature-card {

                        min-height:
                            125px;

                    }


                    .recent-bookings,
                    .popular-section {

                        padding-left:
                            16px;

                        padding-right:
                            16px;

                    }


                    .section-header h2,
                    .popular-header h2 {

                        font-size:
                            19px;

                    }


                    .popular-header {

                        margin-bottom:
                            14px;

                    }


                    .popular-header span {

                        font-size:
                            10px;

                    }


                    .popular-routes {

                        max-width:
                            100%;

                        grid-template-columns:
                            1fr;

                        gap:
                            13px;

                    }


                    .popular-route {

                        min-height:
                            125px;

                        padding:
                            18px;

                    }


                    .route-name {

                        font-size:
                            14px;

                    }


                    .route-duration {

                        font-size:
                            10px;

                    }


                    .route-fare {

                        top:
                            18px;

                        right:
                            18px;

                    }


                    .booking-info {

                        grid-template-columns:
                            repeat(
                                2,
                                1fr
                            );

                    }


                    .bottom-navigation {

                        bottom:
                            10px;

                        width:
                            calc(
                                100% - 20px
                            );

                        height:
                            72px;

                        padding:
                            4px
                            7px;

                        border-radius:
                            17px;

                    }


                    .nav-item {

                        height:
                            62px;

                    }


                    .nav-item span {

                        font-size:
                            23px;

                    }


                    .nav-item small {

                        font-size:
                            10px;

                    }

                }


                /* =================================================
                   VERY SMALL PHONES
                ================================================= */

                @media (
                    max-width: 380px
                ) {

                    .bottom-navigation {

                        width:
                            calc(
                                100% - 14px
                            );

                        bottom:
                            7px;

                    }


                    .nav-item span {

                        font-size:
                            21px;

                    }


                    .nav-item small {

                        font-size:
                            9px;

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

                        <div
                            className="dashboard-logo"
                        >

                            <img
                                src={logoUrl}
                                alt="GuimarasGo Logo"
                            />

                        </div>

                    </header>


                    {/* =================================================
                       WELCOME
                    ================================================= */}

                    <section
                        className="welcome-section"
                    >

                        <h1>
                            Welcome to GuimarasGo
                        </h1>

                        <p>
                            Your Gateway to Island Adventures
                        </p>

                        <button
                            type="button"
                            className="book-button"
                            onClick={
                                goToBooking
                            }
                        >
                            Book a Trip
                        </button>

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

                            <span
                                className="feature-icon"
                            >
                                ⛴️
                            </span>

                            <strong>
                                Book a Trip
                            </strong>

                            <span>
                                Choose your route
                            </span>

                        </button>


                        <button
                            type="button"
                            className="feature-card"
                            onClick={
                                viewAllBookings
                            }
                        >

                            <span
                                className="feature-icon"
                            >
                                🎫
                            </span>

                            <strong>
                                My Bookings
                            </strong>

                            <span>
                                View your tickets
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

                            <h2>
                                Recent Bookings
                            </h2>

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

                            <div
                                className="recent-empty"
                            >
                                No bookings yet
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
                                                            ⛴️
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

                            <h2>
                                Popular Ferry Routes
                            </h2>

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
                                            {route.icon}
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