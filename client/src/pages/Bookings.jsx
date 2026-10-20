import React, {
    useCallback,
    useEffect,
    useState
} from "react";

import { useNavigate } from "react-router-dom";

const API_URL =
    (import.meta.env.VITE_API_BASE_URL ||
        "https://iloilo-guimaras.onrender.com/api").replace(
            /\/api\/?$/,
            ""
        );

const Bookings = () => {

    const navigate =
        useNavigate();


    // =========================================================
    // STATE
    // =========================================================

    const [bookings, setBookings] =
        useState([]);

    const [cancelTarget, setCancelTarget] =
        useState(null);

    const [clearCancelledModal, setClearCancelledModal] =
        useState(false);

    const [activeFilter, setActiveFilter] =
        useState("ALL");

    const [loading, setLoading] =
        useState(false);

    // =========================================================
    // ARRIVAL / TIME OUT NOTIFICATION
    // =========================================================
    const [arrivalNotice, setArrivalNotice] =
        useState(null);


    // =========================================================
    // GET BOOKING STATUS
    // =========================================================

    const getBookingStatus = (booking) => {

        const status =
            String(
                booking?.status ||
                ""
            ).toUpperCase();

        const paymentStatus =
            String(
                booking?.paymentStatus ||
                ""
            ).toUpperCase();


        /*
         * Staff rejection must take priority over payment status.
         * A booking can have a VERIFIED payment and still be rejected
         * for boarding after the passenger is checked at the terminal.
         */

        const boardingStatus =
            String(
                booking?.boardingStatus ||
                ""
            ).toUpperCase();

        if (
            boardingStatus ===
            "REJECTED"
        ) {
            return "REJECTED";
        }

        // Arrival/time out is the final passenger-facing state.
        if (booking?.timedOutAt) {
            return "TIMED OUT";
        }

        /*
         * Staff boarding confirmation must also take priority
         * over the general booking/payment status.
         *
         * A booking can have VERIFIED payment and still be
         * explicitly marked ON BOARD by staff.
         */
        if (
            boardingStatus ===
            "ON BOARD"
        ) {
            return "ON BOARD";
        }


        /*
         * A passenger cancellation must remain cancelled
         * even if the payment was previously verified.
         */
        if (
            status ===
            "CANCELLED" ||
            status ===
            "CANCELED"
        ) {
            return "CANCELLED";
        }


        if (
            paymentStatus ===
            "REJECTED"
        ) {
            return "CANCELLED";
        }


        /*
         * VERIFIED payment means the booking
         * has been successfully confirmed.
         */

        if (
            paymentStatus ===
            "VERIFIED"
        ) {
            return "CONFIRMED";
        }


        if (
            status ===
            "CONFIRMED"
        ) {
            return "CONFIRMED";
        }


        if (
            status ===
            "COMPLETED"
        ) {
            return "COMPLETED";
        }


        return (
            status ||
            "PENDING"
        );
    };


    // =========================================================
    // GET STATUS LABEL
    // =========================================================

    const getStatusLabel = (booking) => {

        const status =
            getBookingStatus(
                booking
            );

        const paymentStatus =
            String(
                booking?.paymentStatus ||
                ""
            ).toUpperCase();


        if (
            status ===
            "REJECTED"
        ) {
            return "Rejected";
        }

        if (
            status ===
            "TIMED OUT"
        ) {
            return "Timed Out";
        }

        if (
            status ===
            "ON BOARD"
        ) {
            return "On Board";
        }


        if (
            paymentStatus ===
            "VERIFIED" ||
            status ===
            "CONFIRMED" ||
            status ===
            "COMPLETED"
        ) {
            return "Verified";
        }


        if (
            paymentStatus ===
            "REJECTED"
        ) {
            return "Payment Rejected";
        }


        if (
            status ===
            "CANCELLED"
        ) {
            return "Cancelled";
        }


        return "Pending";
    };


    // =========================================================
    // GET STATUS CSS CLASS
    // =========================================================

    const getStatusClass = (booking) => {

        const status =
            getBookingStatus(
                booking
            );

        const paymentStatus =
            String(
                booking?.paymentStatus ||
                ""
            ).toUpperCase();


        if (
            status ===
            "REJECTED"
        ) {
            return "status-rejected";
        }

        if (
            status ===
            "TIMED OUT"
        ) {
            return "status-paid";
        }

        if (
            status ===
            "ON BOARD"
        ) {
            return "status-paid";
        }


        if (
            paymentStatus ===
            "VERIFIED" ||
            status ===
            "CONFIRMED" ||
            status ===
            "COMPLETED"
        ) {
            return "status-paid";
        }


        if (
            paymentStatus ===
            "REJECTED" ||
            status ===
            "CANCELLED"
        ) {
            return "status-cancelled";
        }


        return "status-pending";
    };


    // =========================================================
    // ACCOUNT-SPECIFIC BOOKING STORAGE
    // =========================================================

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
                // Preserve the existing flow when user data is not JSON.
            }
        }

        return "guimarasgo_bookings_guest";
    };


    // =========================================================
    // SAVE BOOKING DATA TO SESSION STORAGE
    // =========================================================

    const saveBookingData =
        useCallback(
            (
                updatedBookings
            ) => {

                if (
                    !Array.isArray(
                        updatedBookings
                    )
                ) {
                    return;
                }


                /*
                 * SAVE ALL BOOKINGS
                 */

                const accountBookingKey =
                    getAccountBookingKey();

                localStorage.setItem(
                    accountBookingKey,
                    JSON.stringify(
                        updatedBookings
                    )
                );

                sessionStorage.setItem(
                    "allBookings",
                    JSON.stringify(
                        updatedBookings
                    )
                );


                /*
                 * SAVE RECENT BOOKINGS
                 */

                const recentBookings =
                    [
                        ...updatedBookings
                    ]
                        .reverse()
                        .slice(
                            0,
                            3
                        );

                sessionStorage.setItem(
                    "recentBookings",
                    JSON.stringify(
                        recentBookings
                    )
                );


                /*
                 * UPDATE CURRENT CONFIRMED BOOKING
                 */

                const confirmed =
                    sessionStorage.getItem(
                        "confirmedBooking"
                    );


                if (confirmed) {

                    try {

                        const currentBooking =
                            JSON.parse(
                                confirmed
                            );


                        const latest =
                            updatedBookings.find(
                                (
                                    booking
                                ) =>
                                    booking.bookingReference ===
                                    currentBooking.bookingReference
                            );


                        if (latest) {

                            sessionStorage.setItem(
                                "confirmedBooking",
                                JSON.stringify(
                                    latest
                                )
                            );

                        }

                    } catch (error) {

                        console.error(
                            "Unable to update confirmed booking:",
                            error
                        );

                    }
                }

            },
            []
        );


    // =========================================================
    // LOAD BOOKINGS
    // =========================================================

    const loadBookings =
        useCallback(
            async () => {

                setLoading(true);


                try {

                    /*
                     * =================================================
                     * GET LOCAL BOOKINGS FIRST
                     * =================================================
                     *
                     * Local storage is kept as a cache/fallback so
                     * existing booking, cancellation, and Time Out
                     * behavior continues to work.
                     */
                    const accountBookingKey =
                        getAccountBookingKey();

                    let saved =
                        localStorage.getItem(
                            accountBookingKey
                        );

                    // Migrate older session-only bookings for the
                    // currently logged-in account once.
                    if (!saved) {
                        saved =
                            sessionStorage.getItem(
                                "allBookings"
                            );

                        if (saved) {
                            localStorage.setItem(
                                accountBookingKey,
                                saved
                            );
                        }
                    }


                    let localBookings =
                        [];


                    if (saved) {

                        try {

                            const parsed =
                                JSON.parse(
                                    saved
                                );


                            if (
                                Array.isArray(
                                    parsed
                                )
                            ) {

                                localBookings =
                                    parsed;

                            }

                        } catch (error) {

                            console.error(
                                "Error parsing local bookings:",
                                error
                            );

                        }
                    }


                    /*
                     * =================================================
                     * GET THE LOGGED-IN USER'S BOOKINGS FROM MONGODB
                     * =================================================
                     *
                     * This is the important cross-device fix.
                     *
                     * Bookings are owned by the authenticated user's
                     * userId in MongoDB. Therefore the current device
                     * does not need to have the booking in its local
                     * storage.
                     *
                     * The existing /api/bookings/my endpoint only
                     * returns bookings belonging to the current
                     * authenticated passenger.
                     */
                    const token =
                        localStorage.getItem("token") ||
                        sessionStorage.getItem("token") ||
                        "";

                    let serverBookings =
                        [];

                    if (token) {

                        try {

                            const response =
                                await fetch(
                                    `${API_URL}/api/bookings/my`,
                                    {
                                        headers: {
                                            Authorization:
                                                `Bearer ${token}`,
                                            Accept:
                                                "application/json"
                                        }
                                    }
                                );


                            if (response.ok) {

                                const data =
                                    await response.json();


                                if (
                                    data.success &&
                                    Array.isArray(
                                        data.bookings
                                    )
                                ) {

                                    serverBookings =
                                        data.bookings;

                                }

                            } else {

                                console.warn(
                                    `Unable to load account bookings. HTTP ${response.status}`
                                );

                            }

                        } catch (error) {

                            console.warn(
                                "Unable to load account bookings from MongoDB:",
                                error
                            );

                        }

                    }


                    /*
                     * =================================================
                     * MERGE MONGODB + LOCAL BOOKINGS
                     * =================================================
                     *
                     * MongoDB is the source of truth for bookings that
                     * exist on the account. Local-only bookings are
                     * retained so older/cancelled local records do not
                     * disappear unexpectedly.
                     *
                     * MongoDB records replace their matching local
                     * records, which also keeps the latest:
                     * - payment status
                     * - boarding status
                     * - timedOutAt
                     * - vessel information
                     * - payment information
                     */
                    const localByReference =
                        new Map(
                            localBookings
                                .filter(
                                    (booking) =>
                                        booking?.bookingReference
                                )
                                .map(
                                    (booking) => [
                                        String(
                                            booking.bookingReference
                                        ).trim().toLowerCase(),
                                        booking
                                    ]
                                )
                        );


                    const serverReferences =
                        new Set(
                            serverBookings
                                .filter(
                                    (booking) =>
                                        booking?.bookingReference
                                )
                                .map(
                                    (booking) =>
                                        String(
                                            booking.bookingReference
                                        ).trim().toLowerCase()
                                )
                        );


                    const mergedBookings =
                        serverBookings.map(
                            (serverBooking) => {

                                const reference =
                                    String(
                                        serverBooking?.bookingReference ||
                                        ""
                                    ).trim().toLowerCase();

                                const localBooking =
                                    localByReference.get(
                                        reference
                                    );

                                return {
                                    ...(localBooking || {}),
                                    ...serverBooking
                                };

                            }
                        );


                    /*
                     * Keep local-only bookings as a fallback.
                     * This is especially important for existing
                     * records that were created before account
                     * ownership was stored in MongoDB.
                     */
                    localBookings.forEach(
                        (localBooking) => {

                            const reference =
                                String(
                                    localBooking?.bookingReference ||
                                    ""
                                ).trim().toLowerCase();

                            if (
                                reference &&
                                !serverReferences.has(
                                    reference
                                )
                            ) {

                                mergedBookings.push(
                                    localBooking
                                );

                            }

                        }
                    );


                    /*
                     * =================================================
                     * IF THERE ARE NO BOOKINGS
                     * =================================================
                     */
                    if (
                        mergedBookings.length ===
                        0
                    ) {

                        setBookings([]);

                        setLoading(false);

                        return;

                    }


                    /*
                     * =================================================
                     * REFRESH EACH BOOKING FROM MONGODB
                     * =================================================
                     *
                     * Keep the existing reference lookup because it
                     * provides the latest status for the Time Out
                     * notification and preserves the existing flow.
                     *
                     * Only refresh bookings that came from the local
                     * cache. Server bookings are already fresh, but
                     * refreshing them is harmless and preserves the
                     * existing behavior.
                     */
                    const updatedBookings =
                        await Promise.all(

                            mergedBookings.map(
                                async (
                                    localBooking
                                ) => {

                                    const bookingReference =
                                        localBooking?.bookingReference;

                                    if (
                                        !bookingReference
                                    ) {
                                        return localBooking;
                                    }

                                    try {

                                        const response =
                                            await fetch(
                                                `${API_URL}/api/bookings/reference/${encodeURIComponent(
                                                    bookingReference
                                                )}`,
                                                {
                                                    headers: {
                                                        Authorization:
                                                            `Bearer ${token}`,
                                                        Accept:
                                                            "application/json"
                                                    }
                                                }
                                            );


                                        if (
                                            !response.ok
                                        ) {

                                            return localBooking;

                                        }


                                        const data =
                                            await response.json();


                                        if (
                                            data.success &&
                                            data.booking
                                        ) {

                                            return {
                                                ...localBooking,
                                                ...data.booking
                                            };

                                        }


                                        return localBooking;

                                    } catch (error) {

                                        /*
                                         * Do not remove a booking just
                                         * because the individual refresh
                                         * failed. The already-loaded
                                         * MongoDB/local record remains
                                         * available.
                                         */
                                        return localBooking;

                                    }

                                }
                            )

                        );


                    /*
                     * =================================================
                     * ARRIVAL / TIME OUT NOTIFICATION
                     * =================================================
                     * Show a one-time passenger notification after staff
                     * confirms arrival/time out.
                     */
                    const newlyTimedOutBooking =
                        updatedBookings.find((updatedBooking) => {

                            if (
                                !updatedBooking?.timedOutAt ||
                                !updatedBooking?.bookingReference
                            ) {
                                return false;
                            }


                            /*
                             * Compare against the locally known version.
                             *
                             * If the passenger is opening the same account
                             * on a different device for the first time, an
                             * already-completed Time Out should not suddenly
                             * trigger an old popup. The popup is intended for
                             * a newly detected Time Out.
                             */
                            const previousBooking =
                                localBookings.find(
                                    (localBooking) =>
                                        localBooking?.bookingReference ===
                                        updatedBooking.bookingReference
                                );


                            const noticeKey =
                                `guimarasgo_arrival_notice_${String(
                                    updatedBooking.bookingReference
                                ).trim().toLowerCase()}`;


                            return (
                                previousBooking &&
                                !previousBooking?.timedOutAt &&
                                !sessionStorage.getItem(
                                    noticeKey
                                )
                            );

                        });


                    if (
                        newlyTimedOutBooking
                    ) {

                        const noticeKey =
                            `guimarasgo_arrival_notice_${String(
                                newlyTimedOutBooking.bookingReference
                            ).trim().toLowerCase()}`;


                        sessionStorage.setItem(
                            noticeKey,
                            "shown"
                        );


                        setArrivalNotice({

                            bookingReference:
                                newlyTimedOutBooking.bookingReference,

                            timedOutAt:
                                newlyTimedOutBooking.timedOutAt

                        });

                    }


                    /*
                     * =================================================
                     * SAVE UPDATED BOOKINGS
                     * =================================================
                     */
                    saveBookingData(
                        updatedBookings
                    );


                    /*
                     * =================================================
                     * UPDATE REACT STATE
                     * =================================================
                     */
                    setBookings(
                        [
                            ...updatedBookings
                        ].reverse()
                    );


                } catch (error) {

                    console.error(
                        "Error loading bookings:",
                        error
                    );


                    /*
                     * Fall back to the existing local/session
                     * storage behavior if the server is unavailable.
                     */
                    try {

                        const accountBookingKey =
                            getAccountBookingKey();

                        const saved =
                            localStorage.getItem(
                                accountBookingKey
                            ) ||
                            sessionStorage.getItem(
                                "allBookings"
                            );


                        if (saved) {

                            const parsed =
                                JSON.parse(
                                    saved
                                );


                            if (
                                Array.isArray(
                                    parsed
                                )
                            ) {

                                setBookings(
                                    [
                                        ...parsed
                                    ].reverse()
                                );

                            } else {

                                setBookings([]);

                            }

                        } else {

                            setBookings([]);

                        }

                    } catch (fallbackError) {

                        console.error(
                            "Booking fallback error:",
                            fallbackError
                        );

                        setBookings([]);

                    }

                } finally {

                    setLoading(false);

                }

            },
            [
                saveBookingData
            ]
        );


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        // Load bookings once when the page is opened.
        // No automatic polling or visibility refresh is used.
        // The user can refresh the website whenever they want.
        loadBookings();

        const refreshBookings = () => {
            loadBookings();
        };

        window.addEventListener(
            "bookingUpdated",
            refreshBookings
        );

        return () => {
            window.removeEventListener(
                "bookingUpdated",
                refreshBookings
            );
        };

    }, [loadBookings]);

    // =========================================================
    // VIEW BOOKING
    // =========================================================

    const viewBooking =
        (booking) => {

            /*
             * Always save the newest booking
             * before navigating.
             */

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


    // =========================================================
    // OPEN CANCEL MODAL
    // =========================================================

    const askCancel =
        (booking) => {

            setCancelTarget(
                booking
            );

        };


    // =========================================================
    // CLOSE CANCEL MODAL
    // =========================================================

    const closeCancelModal =
        () => {

            setCancelTarget(
                null
            );

        };


    // =========================================================
    // CANCEL BOOKING
    // =========================================================

    const confirmCancellation =
        () => {

            if (
                !cancelTarget
            ) {
                return;
            }


            const bookingReference =
                cancelTarget.bookingReference;


            try {

                /*
                 * Get existing bookings
                 */

                const accountBookingKey =
                    getAccountBookingKey();

                let saved =
                    localStorage.getItem(
                        accountBookingKey
                    );

                if (!saved) {
                    saved =
                        sessionStorage.getItem(
                            "allBookings"
                        );
                }


                let allBookings =
                    [];


                if (saved) {

                    const parsed =
                        JSON.parse(
                            saved
                        );


                    if (
                        Array.isArray(
                            parsed
                        )
                    ) {

                        allBookings =
                            parsed;

                    }

                }


                /*
                 * Change booking status.
                 *
                 * We do NOT delete it.
                 */

                const updatedBookings =
                    allBookings.map(
                        (
                            booking
                        ) => {

                            if (
                                booking.bookingReference ===
                                bookingReference
                            ) {

                                return {

                                    ...booking,

                                    status:
                                        "CANCELLED",

                                    paymentStatus:
                                        "REJECTED",

                                    totalPaid:
                                        null

                                };

                            }


                            return booking;

                        }
                    );


                /*
                 * Save all bookings
                 */

                localStorage.setItem(
                    getAccountBookingKey(),
                    JSON.stringify(
                        updatedBookings
                    )
                );

                sessionStorage.setItem(
                    "allBookings",
                    JSON.stringify(
                        updatedBookings
                    )
                );


                /*
                 * Update recent bookings
                 */

                const savedRecent =
                    sessionStorage.getItem(
                        "recentBookings"
                    );


                if (savedRecent) {

                    try {

                        const recentBookings =
                            JSON.parse(
                                savedRecent
                            );


                        if (
                            Array.isArray(
                                recentBookings
                            )
                        ) {

                            const updatedRecent =
                                recentBookings.map(
                                    (
                                        booking
                                    ) => {

                                        if (
                                            booking.bookingReference ===
                                            bookingReference
                                        ) {

                                            return {

                                                ...booking,

                                                status:
                                                    "CANCELLED",

                                                paymentStatus:
                                                    "REJECTED",

                                                totalPaid:
                                                    null

                                            };

                                        }


                                        return booking;

                                    }
                                );


                            sessionStorage.setItem(
                                "recentBookings",
                                JSON.stringify(
                                    updatedRecent
                                )
                            );

                        }

                    } catch (
                        recentError
                    ) {

                        console.error(
                            "Error updating recent bookings:",
                            recentError
                        );

                    }

                }


                /*
                 * Update confirmed booking
                 */

                const confirmed =
                    sessionStorage.getItem(
                        "confirmedBooking"
                    );


                if (confirmed) {

                    try {

                        const currentBooking =
                            JSON.parse(
                                confirmed
                            );


                        if (
                            currentBooking.bookingReference ===
                            bookingReference
                        ) {

                            sessionStorage.setItem(
                                "confirmedBooking",
                                JSON.stringify({

                                    ...currentBooking,

                                    status:
                                        "CANCELLED",

                                    paymentStatus:
                                        "REJECTED",

                                    totalPaid:
                                        null

                                })
                            );

                        }

                    } catch (
                        confirmedError
                    ) {

                        console.error(
                            "Error updating confirmed booking:",
                            confirmedError
                        );

                    }

                }


                /*
                 * Update UI
                 */

                setBookings(
                    [
                        ...updatedBookings
                    ].reverse()
                );


                setCancelTarget(
                    null
                );


            } catch (error) {

                console.error(
                    "Error cancelling booking:",
                    error
                );

            }

        };


    // =========================================================
    // OPEN DELETE ALL CANCELLED MODAL
    // =========================================================

    const askClearCancelled =
        () => {

            const cancelledCount =
                bookings.filter(
                    (
                        booking
                    ) => {

                        return (
                            getBookingStatus(
                                booking
                            ) ===
                            "CANCELLED" ||
                            getBookingStatus(
                                booking
                            ) ===
                            "REJECTED"
                        );

                    }
                ).length;


            if (
                cancelledCount ===
                0
            ) {

                return;

            }


            setClearCancelledModal(
                true
            );

        };


    // =========================================================
    // CLOSE DELETE ALL CANCELLED MODAL
    // =========================================================

    const closeClearCancelledModal =
        () => {

            setClearCancelledModal(
                false
            );

        };


    // =========================================================
    // DELETE ALL CANCELLED
    // =========================================================

    const confirmClearCancelled =
        () => {

            try {

                const accountBookingKey =
                    getAccountBookingKey();

                let saved =
                    localStorage.getItem(
                        accountBookingKey
                    );

                if (!saved) {
                    saved =
                        sessionStorage.getItem(
                            "allBookings"
                        );
                }


                let allBookings =
                    [];


                if (saved) {

                    try {

                        const parsed =
                            JSON.parse(
                                saved
                            );


                        if (
                            Array.isArray(
                                parsed
                            )
                        ) {

                            allBookings =
                                parsed;

                        }

                    } catch (
                        error
                    ) {

                        console.error(
                            "Error parsing allBookings:",
                            error
                        );

                    }

                }


                /*
                 * Keep only non-cancelled bookings
                 */

                const remainingBookings =
                    allBookings.filter(
                        (
                            booking
                        ) => {

                            return (
                                getBookingStatus(
                                    booking
                                ) !==
                                "CANCELLED" &&
                                getBookingStatus(
                                    booking
                                ) !==
                                "REJECTED"
                            );

                        }
                    );


                /*
                 * Save all bookings
                 */

                localStorage.setItem(
                    getAccountBookingKey(),
                    JSON.stringify(
                        remainingBookings
                    )
                );

                sessionStorage.setItem(
                    "allBookings",
                    JSON.stringify(
                        remainingBookings
                    )
                );


                /*
                 * Remove cancelled from recent
                 */

                const savedRecent =
                    sessionStorage.getItem(
                        "recentBookings"
                    );


                if (savedRecent) {

                    try {

                        const recentBookings =
                            JSON.parse(
                                savedRecent
                            );


                        if (
                            Array.isArray(
                                recentBookings
                            )
                        ) {

                            const remainingRecent =
                                recentBookings.filter(
                                    (
                                        booking
                                    ) => {

                                        return (
                                            getBookingStatus(
                                                booking
                                            ) !==
                                            "CANCELLED" &&
                                            getBookingStatus(
                                                booking
                                            ) !==
                                            "REJECTED"
                                        );

                                    }
                                );


                            sessionStorage.setItem(
                                "recentBookings",
                                JSON.stringify(
                                    remainingRecent
                                )
                            );

                        }

                    } catch (
                        recentError
                    ) {

                        console.error(
                            "Error clearing recent bookings:",
                            recentError
                        );

                    }

                }


                /*
                 * Check confirmed booking
                 */

                const confirmed =
                    sessionStorage.getItem(
                        "confirmedBooking"
                    );


                if (confirmed) {

                    try {

                        const currentBooking =
                            JSON.parse(
                                confirmed
                            );


                        const currentStatus =
                            getBookingStatus(
                                currentBooking
                            );

                        if (
                            currentStatus ===
                                "CANCELLED" ||
                            currentStatus ===
                                "REJECTED"
                        ) {

                            sessionStorage.removeItem(
                                "confirmedBooking"
                            );

                        }

                    } catch (
                        confirmedError
                    ) {

                        console.error(
                            "Error clearing confirmed booking:",
                            confirmedError
                        );

                    }

                }


                /*
                 * Update UI
                 */

                setBookings(
                    [
                        ...remainingBookings
                    ].reverse()
                );


                setClearCancelledModal(
                    false
                );


                setActiveFilter(
                    "CANCELLED"
                );


            } catch (error) {

                console.error(
                    "Error clearing cancelled bookings:",
                    error
                );

            }

        };


    // =========================================================
    // FILTER BOOKINGS
    // =========================================================

    const filteredBookings =
        bookings.filter(
            (
                booking
            ) => {

                const status =
                    getBookingStatus(
                        booking
                    );


                /*
                 * ALL
                 */

                if (
                    activeFilter ===
                    "ALL"
                ) {

                    return true;

                }


                /*
                 * PAID
                 *
                 * VERIFIED / CONFIRMED /
                 * COMPLETED bookings.
                 */

                if (
                    activeFilter ===
                    "PAID"
                ) {

                    return (
                        status ===
                        "CONFIRMED" ||
                        status ===
                        "COMPLETED" ||
                        status ===
                        "TIMED OUT"
                    );

                }


                /*
                 * PENDING
                 */

                if (
                    activeFilter ===
                    "PENDING"
                ) {

                    return (
                        status ===
                        "PENDING" ||
                        status ===
                        "PENDING PAYMENT VERIFICATION"
                    );

                }


                /*
                 * CANCELLED
                 */

                if (
                    activeFilter ===
                    "CANCELLED"
                ) {

                    return (
                        status ===
                        "CANCELLED" ||
                        status ===
                        "REJECTED"
                    );

                }


                return true;

            }
        );


    // =========================================================
    // SECTION TITLE
    // =========================================================

    const getSectionTitle =
        () => {

            if (
                activeFilter ===
                "PAID"
            ) {

                return "Paid Bookings";

            }


            if (
                activeFilter ===
                "PENDING"
            ) {

                return "Pending Bookings";

            }


            if (
                activeFilter ===
                "CANCELLED"
            ) {

                return "Cancelled Bookings";

            }


            return "All Bookings";

        };


    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate =
        (date) => {

            if (!date) {
                return "N/A";
            }


            try {

                const parsedDate =
                    new Date(
                        date
                    );


                if (
                    Number.isNaN(
                        parsedDate.getTime()
                    )
                ) {

                    return date;

                }


                return parsedDate.toLocaleDateString(
                    "en-US",
                    {
                        year:
                            "numeric",

                        month:
                            "2-digit",

                        day:
                            "2-digit"
                    }
                );

            } catch (
                error
            ) {

                return date;

            }

        };


    // =========================================================
    // FORMAT MONEY
    // =========================================================

    const formatMoney =
        (amount) => {

            const value =
                Number(
                    amount
                );


            if (
                !Number.isFinite(
                    value
                )
            ) {

                return "₱0.00";

            }


            return (
                "₱" +
                value.toLocaleString(
                    "en-PH",
                    {
                        minimumFractionDigits:
                            2,

                        maximumFractionDigits:
                            2
                    }
                )
            );

        };


    // =========================================================
    // PAGE
    // =========================================================

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
                        "Poppins",
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        Arial,
                        sans-serif;

                    background:
                        #f7f8fa;

                    color:
                        #222;

                }


                button {

                    font-family:
                        inherit;

                }


                /* =================================================
                   PAGE
                ================================================= */

                .bookings-page {

                    min-height:
                        100vh;

                    min-height:
                        100dvh;

                    background:
                        linear-gradient(
                            180deg,
                            #fffaf7,
                            #f7f8fa
                        );

                    padding-bottom:
                        40px;

                }


                .bookings-container {

                    width:
                        100%;

                    max-width:
                        900px;

                    margin:
                        0 auto;

                    min-height:
                        100vh;

                    background:
                        #ffffff;

                    padding:
                        25px
                        30px
                        50px;

                }


                /* =================================================
                   HEADER
                ================================================= */

                .bookings-header {

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        15px;

                    margin-bottom:
                        28px;

                }


                .back-button {

                    width:
                        42px;

                    height:
                        42px;

                    border:
                        1px solid
                        #eeeeee;

                    border-radius:
                        12px;

                    background:
                        #ffffff;

                    font-size:
                        20px;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;

                }


                .back-button:hover {

                    background:
                        #fff3eb;

                    color:
                        #ff7818;

                    border-color:
                        #ffd5bd;

                }


                .bookings-title h1 {

                    margin:
                        0;

                    color:
                        #111111;

                    font-size:
                        27px;

                    font-weight:
                        800;

                }


                .bookings-title p {

                    margin:
                        4px 0 0;

                    color:
                        #888888;

                    font-size:
                        12px;

                }


                /* =================================================
                   FILTERS
                ================================================= */

                .booking-filters {

                    width:
                        100%;

                    max-width:
                        430px;

                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            4,
                            1fr
                        );

                    gap:
                        4px;

                    padding:
                        4px;

                    margin-bottom:
                        30px;

                    background:
                        #f5f5f5;

                    border:
                        1px solid
                        #e7e7e7;

                    border-radius:
                        12px;

                }


                .filter-button {

                    border:
                        none;

                    background:
                        transparent;

                    padding:
                        11px
                        8px;

                    border-radius:
                        9px;

                    color:
                        #555555;

                    font-size:
                        11px;

                    font-weight:
                        500;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;

                }


                .filter-button:hover {

                    color:
                        #ff7818;

                }


                .filter-button.active {

                    background:
                        #ff7818;

                    color:
                        #ffffff;

                    font-weight:
                        700;

                    box-shadow:
                        0
                        3px
                        10px
                        rgba(
                            255,
                            120,
                            24,
                            0.18
                        );

                }


                /* =================================================
                   SECTION TITLE
                ================================================= */

                .booking-section-title {

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        15px;

                    margin-bottom:
                        18px;

                }


                .booking-section-left {

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        10px;

                }


                .booking-section-title h2 {

                    margin:
                        0;

                    font-size:
                        16px;

                    color:
                        #111111;

                }


                .booking-count {

                    display:
                        inline-flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    min-width:
                        28px;

                    height:
                        28px;

                    padding:
                        0 8px;

                    border-radius:
                        50%;

                    background:
                        #fff1e7;

                    color:
                        #ff7818;

                    font-size:
                        10px;

                    font-weight:
                        700;

                }


                .clear-cancelled-button {

                    border:
                        none;

                    background:
                        #fff1f1;

                    color:
                        #d9534f;

                    border-radius:
                        8px;

                    padding:
                        9px
                        12px;

                    font-size:
                        10px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;

                }


                .clear-cancelled-button:hover {

                    background:
                        #ffe0e0;

                }


                /* =================================================
                   LOADING
                ================================================= */

                .loading-bookings {

                    min-height:
                        220px;

                    display:
                        flex;

                    flex-direction:
                        column;

                    align-items:
                        center;

                    justify-content:
                        center;

                    text-align:
                        center;

                    color:
                        #888888;

                }


                .loading-spinner {

                    width:
                        32px;

                    height:
                        32px;

                    margin-bottom:
                        12px;

                    border:
                        3px solid
                        #eeeeee;

                    border-top-color:
                        #ff7818;

                    border-radius:
                        50%;

                    animation:
                        spin
                        0.8s
                        linear
                        infinite;

                }


                @keyframes spin {

                    to {

                        transform:
                            rotate(
                                360deg
                            );

                    }

                }


                /* =================================================
                   HISTORY LIST
                ================================================= */

                .history-list {

                    display:
                        flex;

                    flex-direction:
                        column;

                    gap:
                        15px;

                }


                .history-card {

                    width:
                        100%;

                    background:
                        #ffffff;

                    border:
                        1px solid
                        #e6e6e6;

                    border-radius:
                        15px;

                    padding:
                        24px;

                    box-shadow:
                        0
                        5px
                        18px
                        rgba(
                            0,
                            0,
                            0,
                            0.04
                        );

                }


                /* =================================================
                   HISTORY TOP
                ================================================= */

                .history-top {

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        15px;

                    padding-bottom:
                        15px;

                    border-bottom:
                        1px solid
                        #eeeeee;

                }


                .history-route {

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        12px;

                    min-width:
                        0;

                }


                .route-icon-large {

                    width:
                        45px;

                    height:
                        45px;

                    flex:
                        0 0 45px;

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

                }


                .history-route strong {

                    display:
                        block;

                    color:
                        #111111;

                    font-size:
                        15px;

                    font-weight:
                        700;

                }


                .history-reference {

                    display:
                        block;

                    margin-top:
                        5px;

                    color:
                        #999999;

                    font-size:
                        10px;

                }


                /* =================================================
                   STATUS
                ================================================= */

                .status {

                    flex:
                        0 0 auto;

                    padding:
                        6px
                        10px;

                    border-radius:
                        20px;

                    font-size:
                        9px;

                    font-weight:
                        700;

                    white-space:
                        nowrap;

                }


                .status-paid {

                    background:
                        #e9f8ef;

                    color:
                        #168b45;

                }


                .status-pending {

                    background:
                        #fff1e5;

                    color:
                        #f07b18;

                }


                .status-cancelled {

                    background:
                        #fff0f0;

                    color:
                        #d9534f;

                }

                .status-rejected {

                    background:
                        #fee2e2;

                    color:
                        #b91c1c;

                }


                /* =================================================
                   DETAILS
                ================================================= */

                .history-details {

                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            4,
                            1fr
                        );

                    gap:
                        15px;

                    padding:
                        17px 0;

                }


                .history-detail {

                    min-width:
                        0;

                }


                .history-detail small {

                    display:
                        block;

                    margin-bottom:
                        5px;

                    color:
                        #999999;

                    font-size:
                        9px;

                }


                .history-detail strong {

                    display:
                        block;

                    color:
                        #222222;

                    font-size:
                        12px;

                    overflow:
                        hidden;

                    text-overflow:
                        ellipsis;

                    white-space:
                        nowrap;

                }


                /* =================================================
                   BOTTOM
                ================================================= */

                .history-bottom {

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        15px;

                    padding-top:
                        15px;

                    border-top:
                        1px solid
                        #eeeeee;

                }


                .history-total small {

                    display:
                        block;

                    margin-bottom:
                        4px;

                    color:
                        #999999;

                    font-size:
                        9px;

                }


                .history-total strong {

                    display:
                        block;

                    color:
                        #111111;

                    font-size:
                        16px;

                    font-weight:
                        800;

                }


                .history-actions {

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        8px;

                }


                .view-button {

                    border:
                        none;

                    background:
                        #ff7818;

                    color:
                        #ffffff;

                    border-radius:
                        8px;

                    padding:
                        10px
                        15px;

                    font-size:
                        10px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;

                }


                .view-button:hover {

                    background:
                        #e9660b;

                }


                .cancel-button {

                    border:
                        1px solid
                        #ffd0d0;

                    background:
                        #fff7f7;

                    color:
                        #d9534f;

                    border-radius:
                        8px;

                    padding:
                        9px
                        13px;

                    font-size:
                        10px;

                    font-weight:
                        600;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;

                }


                .cancel-button:hover {

                    background:
                        #fff0f0;

                }


                /* =================================================
                   EMPTY
                ================================================= */

                .empty-history {

                    min-height:
                        300px;

                    display:
                        flex;

                    flex-direction:
                        column;

                    align-items:
                        center;

                    justify-content:
                        center;

                    text-align:
                        center;

                    border:
                        1px dashed
                        #dddddd;

                    border-radius:
                        16px;

                    padding:
                        30px;

                }


                .empty-history-icon {

                    width:
                        58px;

                    height:
                        58px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    margin-bottom:
                        12px;

                    border-radius:
                        17px;

                    background:
                        #fff1e7;

                    font-size:
                        25px;

                }


                .empty-history h2 {

                    margin:
                        0 0 7px;

                    color:
                        #222222;

                    font-size:
                        17px;

                }


                .empty-history p {

                    margin:
                        0 0 18px;

                    color:
                        #999999;

                    font-size:
                        11px;

                }


                .book-now-button {

                    border:
                        none;

                    background:
                        #ff7818;

                    color:
                        #ffffff;

                    border-radius:
                        8px;

                    padding:
                        10px
                        18px;

                    font-size:
                        10px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                }


                /* =================================================
                   MODAL
                ================================================= */

                .modal-overlay {

                    position:
                        fixed;

                    inset:
                        0;

                    z-index:
                        1000;

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
                        blur(
                            3px
                        );

                }


                .cancel-modal,
                .clear-modal {

                    width:
                        100%;

                    max-width:
                        440px;

                    background:
                        #ffffff;

                    border-radius:
                        20px;

                    padding:
                        30px;

                    text-align:
                        center;

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

                    animation:
                        modalIn
                        0.2s
                        ease;

                }


                @keyframes modalIn {

                    from {

                        opacity:
                            0;

                        transform:
                            translateY(
                                10px
                            )
                            scale(
                                0.98
                            );

                    }

                    to {

                        opacity:
                            1;

                        transform:
                            translateY(
                                0
                            )
                            scale(
                                1
                            );

                    }

                }


                .cancel-icon,
                .clear-icon {

                    width:
                        64px;

                    height:
                        64px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    margin:
                        0 auto 16px;

                    border-radius:
                        18px;

                    background:
                        #fff0f0;

                    color:
                        #d9534f;

                    font-size:
                        28px;

                    font-weight:
                        800;

                }


                .cancel-modal h2,
                .clear-modal h2 {

                    margin:
                        0 0 9px;

                    font-size:
                        21px;

                    font-weight:
                        700;

                    color:
                        #222222;

                }


                .cancel-modal p,
                .clear-modal p {

                    margin:
                        0 auto 15px;

                    max-width:
                        340px;

                    color:
                        #777777;

                    font-size:
                        13px;

                    line-height:
                        1.6;

                }


                .cancel-reference {

                    display:
                        inline-block;

                    margin:
                        5px 0 20px;

                    padding:
                        8px 12px;

                    background:
                        #f7f7f7;

                    border-radius:
                        8px;

                    color:
                        #333333;

                    font-size:
                        12px;

                    font-weight:
                        700;

                }


                .clear-count {

                    color:
                        #d9534f;

                    font-weight:
                        700;

                }


                .modal-actions {

                    display:
                        flex;

                    justify-content:
                        center;

                    gap:
                        10px;

                }


                .close-cancel {

                    border:
                        1px solid
                        #dddddd;

                    background:
                        #ffffff;

                    color:
                        #555555;

                    padding:
                        11px
                        16px;

                    border-radius:
                        9px;

                    font-size:
                        10px;

                    font-weight:
                        600;

                    cursor:
                        pointer;

                }


                .confirm-cancel,
                .delete-all-button {

                    border:
                        none;

                    padding:
                        11px
                        16px;

                    border-radius:
                        9px;

                    background:
                        #d9534f;

                    color:
                        #ffffff;

                    font-size:
                        10px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                }


                .confirm-cancel:hover,
                .delete-all-button:hover {

                    background:
                        #c43f3b;

                }


                /* =================================================
                   MOBILE
                ================================================= */

                @media (
                    max-width:
                    650px
                ) {

                    .bookings-container {

                        padding:
                            18px
                            16px
                            40px;

                    }


                    .bookings-title h1 {

                        font-size:
                            23px;

                    }


                    .booking-filters {

                        max-width:
                            100%;

                    }


                    .filter-button {

                        font-size:
                            10px;

                    }


                    .history-card {

                        padding:
                            18px;

                    }


                    .history-details {

                        grid-template-columns:
                            repeat(
                                2,
                                1fr
                            );

                        gap:
                            14px;

                    }


                    .history-bottom {

                        align-items:
                            flex-start;

                        gap:
                            15px;

                        flex-direction:
                            column;

                    }


                    .history-actions {

                        width:
                            100%;

                    }


                    .view-button,
                    .cancel-button {

                        flex:
                            1;

                    }


                    .booking-section-title {

                        align-items:
                            flex-start;

                        gap:
                            10px;

                    }


                    .booking-section-left {

                        flex-wrap:
                            wrap;

                    }


                    .clear-cancelled-button {

                        padding:
                            8px
                            10px;

                        font-size:
                            9px;

                    }

                }


                @media (
                    max-width:
                    420px
                ) {

                    .booking-filters {

                        grid-template-columns:
                            repeat(
                                2,
                                1fr
                            );

                    }


                    .history-top {

                        gap:
                            10px;

                    }


                    .history-route strong {

                        font-size:
                            14px;

                    }


                    .status {

                        font-size:
                            8px;

                        padding:
                            5px
                            8px;

                    }


                    .booking-section-title {

                        flex-direction:
                            column;

                        align-items:
                            stretch;

                    }


                    .clear-cancelled-button {

                        width:
                            100%;

                    }

                }

            `}</style>


            <main
                className="bookings-page"
            >

                <div
                    className="bookings-container"
                >

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <header
                        className="bookings-header"
                    >

                        <button
                            type="button"
                            className="back-button"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                            aria-label="Back to dashboard"
                        >
                            ←
                        </button>


                        <div
                            className="bookings-title"
                        >

                            <h1>
                                My Bookings
                            </h1>

                            <p>
                                View and manage all your trips
                            </p>

                        </div>

                    </header>


                    {/* =================================================
                        FILTERS
                    ================================================= */}

                    <div
                        className="booking-filters"
                    >

                        <button
                            type="button"
                            className={`filter-button ${
                                activeFilter ===
                                "ALL"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setActiveFilter(
                                    "ALL"
                                )
                            }
                        >
                            All
                        </button>


                        <button
                            type="button"
                            className={`filter-button ${
                                activeFilter ===
                                "PAID"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setActiveFilter(
                                    "PAID"
                                )
                            }
                        >
                            Paid
                        </button>


                        <button
                            type="button"
                            className={`filter-button ${
                                activeFilter ===
                                "PENDING"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setActiveFilter(
                                    "PENDING"
                                )
                            }
                        >
                            Pending
                        </button>


                        <button
                            type="button"
                            className={`filter-button ${
                                activeFilter ===
                                "CANCELLED"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setActiveFilter(
                                    "CANCELLED"
                                )
                            }
                        >
                            Cancelled
                        </button>

                    </div>


                    {/* =================================================
                        SECTION TITLE
                    ================================================= */}

                    <div
                        className="booking-section-title"
                    >

                        <div
                            className="booking-section-left"
                        >

                            <h2>
                                {getSectionTitle()}
                            </h2>

                            <span
                                className="booking-count"
                            >
                                {
                                    filteredBookings.length
                                }
                            </span>

                        </div>


                        {activeFilter ===
                            "CANCELLED" &&
                            filteredBookings.length >
                                0 && (

                            <button
                                type="button"
                                className="clear-cancelled-button"
                                onClick={
                                    askClearCancelled
                                }
                            >
                                🗑 Delete All
                            </button>

                        )}

                    </div>


                    {/* =================================================
                        LOADING
                    ================================================= */}

                    {loading && (

                        <div
                            className="loading-bookings"
                        >

                            <div
                                className="loading-spinner"
                            />

                            <p>
                                Checking latest booking status...
                            </p>

                        </div>

                    )}


                    {/* =================================================
                        BOOKINGS
                    ================================================= */}

                    {!loading &&
                        filteredBookings.length ===
                            0 && (

                        <div
                            className="empty-history"
                        >

                            <div
                                className="empty-history-icon"
                            >
                                🎫
                            </div>


                            <h2>
                                No{" "}
                                {
                                    activeFilter
                                        .toLowerCase()
                                }{" "}
                                bookings
                            </h2>


                            <p>
                                There are no bookings in this category.
                            </p>


                            {activeFilter ===
                                "ALL" && (

                                <button
                                    type="button"
                                    className="book-now-button"
                                    onClick={() =>
                                        navigate(
                                            "/trips"
                                        )
                                    }
                                >
                                    Book a Trip
                                </button>

                            )}

                        </div>

                    )}


                    {!loading &&
                        filteredBookings.length >
                            0 && (

                        <div
                            className="history-list"
                        >

                            {filteredBookings.map(
                                (
                                    booking,
                                    index
                                ) => {

                                    const status =
                                        getBookingStatus(
                                            booking
                                        );


                                    const statusLabel =
                                        getStatusLabel(
                                            booking
                                        );


                                    const statusClass =
                                        getStatusClass(
                                            booking
                                        );


                                    const amount =
                                        booking.totalPaid !==
                                            null &&
                                        booking.totalPaid !==
                                            undefined
                                            ? booking.totalPaid
                                            : booking.requiredAmount;


                                    return (

                                        <div
                                            className="history-card"
                                            key={
                                                booking._id ||
                                                booking.bookingReference ||
                                                index
                                            }
                                        >

                                            {/* =================================================
                                                TOP
                                            ================================================= */}

                                            <div
                                                className="history-top"
                                            >

                                                <div
                                                    className="history-route"
                                                >

                                                    <div
                                                        className="route-icon-large"
                                                    >
                                                        ⛴️
                                                    </div>


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
                                                            className="history-reference"
                                                        >
                                                            {
                                                                booking.bookingReference ||
                                                                "Booking Reference"
                                                            }
                                                        </span>

                                                    </div>

                                                </div>


                                                <span
                                                    className={`status ${statusClass}`}
                                                >
                                                    {
                                                        statusLabel
                                                    }
                                                </span>

                                            </div>


                                            {/* =================================================
                                                DETAILS
                                            ================================================= */}

                                            <div
                                                className="history-details"
                                            >

                                                <div
                                                    className="history-detail"
                                                >

                                                    <small>
                                                        Date
                                                    </small>

                                                    <strong>
                                                        {
                                                            formatDate(
                                                                booking.date
                                                            )
                                                        }
                                                    </strong>

                                                </div>


                                                <div
                                                    className="history-detail"
                                                >

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


                                                <div
                                                    className="history-detail"
                                                >

                                                    <small>
                                                        Passengers
                                                    </small>

                                                    <strong>
                                                        {
                                                            booking.passengers ||
                                                            1
                                                        }
                                                    </strong>

                                                </div>


                                                <div
                                                    className="history-detail"
                                                >

                                                    <small>
                                                        Payment
                                                    </small>

                                                    <strong>
                                                        {
                                                            booking.paymentMethod ||
                                                            "Maya / QRPh"
                                                        }
                                                    </strong>

                                                </div>

                                            </div>


                                            {/* =================================================
                                                LIVE BOOKING STATUS DETAILS
                                            ================================================= */}

                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                                    gap: "10px",
                                                    marginTop: "15px"
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        padding: "10px 12px",
                                                        border: "1px solid #e5e7eb",
                                                        borderRadius: "10px",
                                                        background: "#fafafa"
                                                    }}
                                                >
                                                    <small
                                                        style={{
                                                            display: "block",
                                                            color: "#777",
                                                            marginBottom: "4px"
                                                        }}
                                                    >
                                                        Payment Status
                                                    </small>
                                                    <strong>
                                                        {String(
                                                            booking.paymentStatus ||
                                                            "PENDING VERIFICATION"
                                                        ) === "VERIFIED"
                                                            ? "Verified"
                                                            : String(
                                                                booking.paymentStatus ||
                                                                "PENDING VERIFICATION"
                                                            ) === "REJECTED"
                                                                ? "Rejected"
                                                                : "Pending Verification"}
                                                    </strong>
                                                </div>

                                                <div
                                                    style={{
                                                        padding: "10px 12px",
                                                        border: "1px solid #e5e7eb",
                                                        borderRadius: "10px",
                                                        background: "#fafafa"
                                                    }}
                                                >
                                                    <small
                                                        style={{
                                                            display: "block",
                                                            color: "#777",
                                                            marginBottom: "4px"
                                                        }}
                                                    >
                                                        Boarding Status
                                                    </small>
                                                    <strong>
                                                        {booking.timedOutAt
                                                            ? "Timed Out"
                                                            : String(
                                                                booking.boardingStatus ||
                                                                "NOT BOARDED"
                                                            ) === "ON BOARD"
                                                                ? "On Board"
                                                                : String(
                                                                    booking.boardingStatus ||
                                                                    "NOT BOARDED"
                                                                ) === "REJECTED"
                                                                    ? "Rejected"
                                                                    : "Not Boarded"}
                                                    </strong>
                                                </div>
                                            </div>


                                            {/* =================================================
                                                ARRIVAL / TIME OUT
                                            ================================================= */}

                                            {booking.timedOutAt && (
                                                <div
                                                    style={{
                                                        marginTop: "15px",
                                                        padding: "12px 14px",
                                                        background: "#f0fdf4",
                                                        border: "1px solid #bbf7d0",
                                                        borderRadius: "10px",
                                                        color: "#166534",
                                                        fontSize: "12px",
                                                        lineHeight: "1.5"
                                                    }}
                                                >
                                                    <strong>Arrival / Time Out Confirmed</strong>
                                                    <div style={{ marginTop: "4px" }}>
                                                        Arrival time: {new Date(booking.timedOutAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            )}


                                            {/* =================================================
                                                STAFF REJECTION NOTICE
                                            ================================================= */}

                                            {status ===
                                                "REJECTED" &&
                                                booking.rejectionReason && (
                                                <div
                                                    style={{
                                                        marginTop: "15px",
                                                        padding: "12px 14px",
                                                        background: "#fef2f2",
                                                        border: "1px solid #fecaca",
                                                        borderRadius: "10px",
                                                        color: "#991b1b",
                                                        fontSize: "12px",
                                                        lineHeight: "1.5"
                                                    }}
                                                >
                                                    <strong>Boarding Rejected</strong>
                                                    <div
                                                        style={{
                                                            marginTop: "4px"
                                                        }}
                                                    >
                                                        Reason: {booking.rejectionReason}
                                                    </div>
                                                </div>
                                            )}


                                            {/* =================================================
                                                BOTTOM
                                            ================================================= */}

                                            <div
                                                className="history-bottom"
                                            >

                                                <div
                                                    className="history-total"
                                                >

                                                    <small>
                                                        Total Paid
                                                    </small>

                                                    <strong>
                                                        {
                                                            formatMoney(
                                                                amount
                                                            )
                                                        }
                                                    </strong>

                                                </div>


                                                <div
                                                    className="history-actions"
                                                >

                                                    <button
                                                        type="button"
                                                        className="view-button"
                                                        onClick={() =>
                                                            viewBooking(
                                                                booking
                                                            )
                                                        }
                                                    >
                                                        View Booking
                                                    </button>


                                                    {status !==
                                                        "CANCELLED" &&
                                                        status !==
                                                            "REJECTED" &&
                                                        status !==
                                                            "ON BOARD" &&
                                                        status !==
                                                            "TIMED OUT" &&
                                                        status !==
                                                            "CONFIRMED" &&
                                                        status !==
                                                            "COMPLETED" && (

                                                        <button
                                                            type="button"
                                                            className="cancel-button"
                                                            onClick={() =>
                                                                askCancel(
                                                                    booking
                                                                )
                                                            }
                                                        >
                                                            Cancel
                                                        </button>

                                                    )}

                                                </div>

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>

            </main>


            {/* =========================================================
                ARRIVAL / TIME OUT SUCCESS MODAL
            ========================================================= */}

            {arrivalNotice && (
                <div
                    className="modal-overlay"
                    onClick={() => setArrivalNotice(null)}
                >
                    <div
                        className="cancel-modal"
                        onClick={(event) => event.stopPropagation()}
                        style={{ textAlign: "center" }}
                    >
                        <div
                            className="cancel-icon"
                            style={{
                                background: "#dcfce7",
                                color: "#166534"
                            }}
                        >
                            ✓
                        </div>

                        <h2>Arrival Confirmed</h2>

                        <p>
                            Thank you for Boarding, Hope you Enjoy!
                            <br />
                            Book again. Thanks!
                        </p>

                        <span className="cancel-reference">
                            {arrivalNotice.bookingReference || "Booking"}
                        </span>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="confirm-cancel"
                                style={{ background: "#16a34a" }}
                                onClick={() => setArrivalNotice(null)}
                            >
                                Thank You
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* =========================================================
                CANCEL MODAL
            ========================================================= */}

            {cancelTarget && (

                <div
                    className="modal-overlay"
                    onClick={
                        closeCancelModal
                    }
                >

                    <div
                        className="cancel-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div
                            className="cancel-icon"
                        >
                            !
                        </div>


                        <h2>
                            Cancel Booking?
                        </h2>


                        <p>
                            Are you sure you want to
                            cancel this booking?
                        </p>


                        <span
                            className="cancel-reference"
                        >
                            {
                                cancelTarget.bookingReference ||
                                "Booking"
                            }
                        </span>


                        <div
                            className="modal-actions"
                        >

                            <button
                                type="button"
                                className="close-cancel"
                                onClick={
                                    closeCancelModal
                                }
                            >
                                Keep Booking
                            </button>


                            <button
                                type="button"
                                className="confirm-cancel"
                                onClick={
                                    confirmCancellation
                                }
                            >
                                Yes, Cancel
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =========================================================
                DELETE ALL CANCELLED MODAL
            ========================================================= */}

            {clearCancelledModal && (

                <div
                    className="modal-overlay"
                    onClick={
                        closeClearCancelledModal
                    }
                >

                    <div
                        className="clear-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div
                            className="clear-icon"
                        >
                            🗑
                        </div>


                        <h2>
                            Delete All Cancelled?
                        </h2>


                        <p>
                            Are you sure you want to
                            remove
                            <span
                                className="clear-count"
                            >
                                {" "}
                                all cancelled bookings
                            </span>
                            ? This action will permanently
                            remove them from your booking
                            history.
                        </p>


                        <div
                            className="modal-actions"
                        >

                            <button
                                type="button"
                                className="close-cancel"
                                onClick={
                                    closeClearCancelledModal
                                }
                            >
                                Keep Bookings
                            </button>


                            <button
                                type="button"
                                className="delete-all-button"
                                onClick={
                                    confirmClearCancelled
                                }
                            >
                                Yes, Delete All
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </>

    );

};


export default Bookings;