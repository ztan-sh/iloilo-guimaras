import React, {
    useCallback,
    useEffect,
    useState
} from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api";

const Trips = () => {
    const navigate = useNavigate();

    // =========================================================
    // AVAILABLE TRIPS
    //
    // These are the fixed ferry schedules.
    //
    // Capacity values are loaded from MongoDB through the
    // PUBLIC payment capacity endpoint:
    //
    // GET /api/payment/capacity?date=YYYY-MM-DD
    //
    // Passenger capacity:
    // 100 per ferry
    //
    // Motorcycle capacity:
    // 10 per ferry
    // =========================================================

    const [availableTrips, setAvailableTrips] =
    useState([
        {
            id: "MV Felipe III",
            vesselName: "MV Felipe III",
            departureTime: "3:30 AM",
            time: "03:30",

            passengers: 0,
            passengerCapacity: 100,

            vehicles: 0,
            vehicleCapacity: 10,

            passengerRemaining: 100,
            vehicleRemaining: 10,
            manualClosed: false,
            bookingClosed: false
        },
        {
            id: "MV FastCraft",
            vesselName: "MV FastCraft",
            departureTime: "8:00 AM",
            time: "08:00",

            passengers: 0,
            passengerCapacity: 100,

            vehicles: 0,
            vehicleCapacity: 10,

            passengerRemaining: 100,
            vehicleRemaining: 10,
            manualClosed: false,
            bookingClosed: false
        },
        {
            id: "MV Halili",
            vesselName: "MV Halili",
            departureTime: "9:00 AM",
            time: "09:00",

            passengers: 0,
            passengerCapacity: 100,

            vehicles: 0,
            vehicleCapacity: 10,

            passengerRemaining: 100,
            vehicleRemaining: 10,
            manualClosed: false,
            bookingClosed: false
        }
    ]);

    const [capacityLoading, setCapacityLoading] =
        useState(true);

    const [capacityError, setCapacityError] =
        useState("");

    // =========================================================
    // TRIP SEARCH
    // =========================================================
    // Allows passengers to quickly find a ferry by vessel name,
    // departure time, or route.
    // =========================================================

    const [tripSearch, setTripSearch] =
        useState("");

    // =========================================================
    // TODAY
    //
    // IMPORTANT:
    // Use the user's LOCAL date instead of UTC date.
    //
    // This prevents the Philippines timezone from accidentally
    // requesting yesterday/tomorrow around midnight.
    // =========================================================

    const getToday = () => {
        const now = new Date();

        const year = now.getFullYear();

        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            now.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    // =========================================================
    // BOOKING DATE USED FOR CAPACITY
    //
    // Trips must use the date of the trip being booked, not
    // automatically use today's date. The booking date is saved
    // in sessionStorage by BookTrip as tripDetails.date.
    //
    // Priority:
    // 1. URL ?date=YYYY-MM-DD (if supplied)
    // 2. tripDetails.date
    // 3. confirmedBooking.date
    // 4. latestBooking.date
    // 5. tomorrow (earliest normal booking date)
    // =========================================================

    const getCapacityDate = () => {
        const params = new URLSearchParams(
            window.location.search
        );

        const urlDate = params.get("date");

        if (/^\d{4}-\d{2}-\d{2}$/.test(urlDate || "")) {
            return urlDate;
        }

        const getStoredDate = (key) => {
            try {
                const raw = sessionStorage.getItem(key);

                if (!raw) {
                    return "";
                }

                const parsed = JSON.parse(raw);
                const storedDate = parsed?.date;

                return /^\d{4}-\d{2}-\d{2}$/.test(
                    storedDate || ""
                )
                    ? storedDate
                    : "";
            } catch (error) {
                return "";
            }
        };

        return (
            getStoredDate("tripDetails") ||
            getStoredDate("confirmedBooking") ||
            getStoredDate("latestBooking") ||
            (() => {
                const tomorrow = new Date();
                tomorrow.setDate(
                    tomorrow.getDate() + 1
                );

                const year = tomorrow.getFullYear();
                const month = String(
                    tomorrow.getMonth() + 1
                ).padStart(2, "0");
                const day = String(
                    tomorrow.getDate()
                ).padStart(2, "0");

                return `${year}-${month}-${day}`;
            })()
        );
    };


    // =========================================================
    // SAFE JSON RESPONSE
    // =========================================================

    const readResponse = async (response) => {
        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            contentType.includes(
                "application/json"
            )
        ) {
            return await response.json();
        }

        const text =
            await response.text();

        console.error(
            "Server returned non-JSON response:",
            text
        );

        throw new Error(
            `Server returned an invalid response (${response.status}).`
        );
    };

    // =========================================================
    // LOAD REAL-TIME CAPACITY
    //
    // IMPORTANT FIX:
    //
    // OLD:
    // /api/bookings/capacity
    //
    // NEW:
    // /api/payment/capacity
    //
    // The payment capacity route is public and does not require
    // an admin authentication token.
    //
    // This allows normal tourists/users to see live capacity.
    // =========================================================

    const loadCapacities = useCallback(
        async () => {
            try {
                setCapacityLoading(true);

                setCapacityError("");

                const capacityDate =
                    getCapacityDate();

                // =================================================
                // PUBLIC CAPACITY ENDPOINT
                // =================================================
                // IMPORTANT: use the selected/booking date instead
                // of today's date. This makes tomorrow's confirmed
                // booking appear in the correct ferry capacity.
                // =================================================

                const response =
                await fetch(
                    `${API_URL}/bookings/capacity?date=${encodeURIComponent(
                        capacityDate
                    )}`,
                        {
                            method: "GET",

                            headers: {
                                Accept:
                                    "application/json"
                            },

                            cache: "no-store"
                        }
                    );

                const data =
                    await readResponse(
                        response
                    );

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        "Unable to load ferry capacity."
                    );
                }

                // =================================================
                // VALIDATE SERVER RESPONSE
                // =================================================

                if (
                    !Array.isArray(
                        data?.capacities
                    )
                ) {
                    throw new Error(
                        "Invalid capacity response from server."
                    );
                }

                // =================================================
                // UPDATE TRIPS
                // =================================================

                setAvailableTrips(
                    previousTrips =>
                        previousTrips.map(
                            trip => {
                                const latest =
                                    data.capacities.find(
                                        item =>
                                            item.id ===
                                            trip.id
                                    );

                                // If the server did not return
                                // this ferry, keep the existing
                                // information.
                                if (!latest) {
                                    return trip;
                                }

                                const passengers =
                                    Math.max(
                                        0,
                                        Number(
                                            latest.passengers
                                        ) || 0
                                    );

                                const passengerCapacity =
                                    Math.max(
                                        0,
                                        Number(
                                            latest.passengerCapacity
                                        ) || 100
                                    );

                                const vehicles =
                                    Math.max(
                                        0,
                                        Number(
                                            latest.vehicles
                                        ) || 0
                                    );

                                const vehicleCapacity =
                                    Math.max(
                                        0,
                                        Number(
                                            latest.vehicleCapacity
                                        ) || 10
                                    );

                                const passengerRemaining =
                                    Math.max(
                                        0,
                                        passengerCapacity -
                                            passengers
                                    );

                                const vehicleRemaining =
                                    Math.max(
                                        0,
                                        vehicleCapacity -
                                            vehicles
                                    );

                                return {
                                    ...trip,

                                    passengers,

                                    passengerCapacity,

                                    passengerRemaining,

                                    vehicles,

                                    vehicleCapacity,

                                    vehicleRemaining,

                                    manualClosed: Boolean(
                                        latest.manualClosed
                                    ),

                                    bookingClosed: Boolean(
                                        latest.bookingClosed
                                    )
                                };
                            }
                        )
                );

                return data.capacities;

            } catch (error) {

                console.error(
                    "Ferry capacity error:",
                    error
                );

                setCapacityError(
                    error?.message ||
                    "Unable to load latest ferry capacity."
                );

                return null;

            } finally {

                setCapacityLoading(false);
            }
        },
        []
    );

    // =========================================================
    // INITIAL LOAD + REAL-TIME POLLING
    //
    // Capacity refreshes every 5 seconds.
    // =========================================================

    useEffect(() => {

        loadCapacities();

        const interval =
            window.setInterval(
                () => {
                    loadCapacities();
                },
                5000
            );

        return () => {
            window.clearInterval(
                interval
            );
        };

    }, [loadCapacities]);

    // =========================================================
    // SELECT TRIP
    //
    // Before allowing the user to continue:
    //
    // 1. Refresh capacity one last time.
    // 2. Get the latest server value.
    // 3. Check passenger availability.
    // 4. Save the latest capacity information.
    //
    // IMPORTANT:
    // We do NOT block the trip just because motorcycles are full.
    //
    // Why?
    //
    // A passenger-only booking can still use the ferry even when
    // all motorcycle slots have already been used.
    //
    // The motorcycle selection/booking page should handle the
    // motorcycle-specific slot check.
    // =========================================================

    const selectTrip = async (trip) => {

        const latest =
            await loadCapacities();

        // =====================================================
        // CAPACITY COULD NOT BE CHECKED
        // =====================================================

        if (!latest) {

            alert(
                "Unable to check the latest ferry capacity. Please try again."
            );

            return;
        }

        // =====================================================
        // GET LATEST SELECTED FERRY
        // =====================================================

        const latestTrip =
            latest.find(
                item =>
                    item.id ===
                    trip.id
            );

        if (!latestTrip) {

            alert(
                "Unable to find the latest information for this ferry. Please refresh the page and try again."
            );

            return;
        }

        // =====================================================
        // CHECK FERRY ONLINE BOOKING STATUS
        // =====================================================

        if (
            latestTrip.manualClosed ||
            latestTrip.bookingClosed
        ) {
            alert(
                latestTrip.manualClosed
                    ? "Online booking for this ferry is currently closed by the administrator. Please choose another ferry."
                    : "This ferry is already full for passengers. Please choose another ferry."
            );

            return;
        }

        // =====================================================
        // LATEST PASSENGER CAPACITY
        // =====================================================

        const latestPassengers =
            Math.max(
                0,
                Number(
                    latestTrip.passengers
                ) || 0
            );

        const latestPassengerCapacity =
            Math.max(
                0,
                Number(
                    latestTrip.passengerCapacity
                ) || 100
            );

        const latestPassengerRemaining =
            Math.max(
                0,
                latestPassengerCapacity -
                    latestPassengers
            );

        // =====================================================
        // CHECK PASSENGER CAPACITY
        // =====================================================

        if (
            latestPassengerRemaining <= 0
        ) {

            alert(
                "This ferry is already full for passengers. Please choose another ferry."
            );

            return;
        }

        // =====================================================
        // LATEST MOTORCYCLE CAPACITY
        // =====================================================

        const latestVehicles =
            Math.max(
                0,
                Number(
                    latestTrip.vehicles
                ) || 0
            );

        const latestVehicleCapacity =
            Math.max(
                0,
                Number(
                    latestTrip.vehicleCapacity
                ) || 10
            );

        const latestVehicleRemaining =
            Math.max(
                0,
                latestVehicleCapacity -
                    latestVehicles
            );

        // =====================================================
        // PREPARE TRIP
        // =====================================================

        const tripToSave = {

            ...trip,

            // -----------------------------------------------
            // FERRY INFORMATION
            // -----------------------------------------------

            id:
                latestTrip.id ||
                trip.id,

            vesselName:
                latestTrip.vesselName ||
                trip.vesselName,

            departureTime:
                latestTrip.departureTime ||
                trip.departureTime,

            time:
                latestTrip.time ||
                trip.time,

            // -----------------------------------------------
            // PASSENGER CAPACITY
            // -----------------------------------------------

            passengers:
                latestPassengers,

            passengerCapacity:
                latestPassengerCapacity,

            passengerRemaining:
                latestPassengerRemaining,

            // -----------------------------------------------
            // MOTORCYCLE CAPACITY
            // -----------------------------------------------

            vehicles:
                latestVehicles,

            vehicleCapacity:
                latestVehicleCapacity,

            vehicleRemaining:
                latestVehicleRemaining,

            manualClosed:
                Boolean(latestTrip.manualClosed),

            bookingClosed:
                Boolean(latestTrip.bookingClosed)
        };

        // =====================================================
        // SAVE SELECTED TRIP
        // =====================================================

        sessionStorage.setItem(
            "selectedTrip",
            JSON.stringify(
                tripToSave
            )
        );

        // =====================================================
        // KEEP EXISTING selectedFerry COMPATIBILITY
        //
        // This is important because your existing booking flow
        // may still read selectedFerry.
        // =====================================================

        sessionStorage.setItem(
            "selectedFerry",
            JSON.stringify({
                ...tripToSave,

                ferryName:
                    tripToSave.vesselName,

                vesselName:
                    tripToSave.vesselName,

                departureTime:
                    tripToSave.departureTime
            })
        );

        // =====================================================
        // ALSO SAVE THE LATEST CAPACITY
        //
        // This gives the next page access to the latest server
        // capacity immediately.
        // =====================================================

        sessionStorage.setItem(
            "selectedTripCapacity",
            JSON.stringify({
                ferryId:
                    tripToSave.id,

                vesselName:
                    tripToSave.vesselName,

                date:
                    getCapacityDate(),

                passengers:
                    tripToSave.passengers,

                passengerCapacity:
                    tripToSave.passengerCapacity,

                passengerRemaining:
                    tripToSave.passengerRemaining,

                vehicles:
                    tripToSave.vehicles,

                vehicleCapacity:
                    tripToSave.vehicleCapacity,

                vehicleRemaining:
                    tripToSave.vehicleRemaining,

                manualClosed:
                    tripToSave.manualClosed,

                bookingClosed:
                    tripToSave.bookingClosed
            })
        );

        // =====================================================
        // GO TO BOOKING PAGE
        // =====================================================

        navigate(
            "/book-trip"
        );
    };

    // =========================================================
    // FILTERED TRIPS
    // =========================================================
    // Search is intentionally client-side because the available
    // trips are already loaded on this page.
    // =========================================================

    const normalizedTripSearch =
        tripSearch.trim().toLowerCase();

    const filteredTrips =
        availableTrips.filter((trip) => {
            if (!normalizedTripSearch) {
                return true;
            }

            const searchableText = [
                trip.vesselName,
                trip.departureTime,
                trip.time,
                "Iloilo",
                "Guimaras",
                "Iloilo Guimaras"
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(
                normalizedTripSearch
            );
        });


    // =========================================================
    // RETURN
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
                        sans-serif;

                    background: #fffaf7;
                    color: #171717;
                }

                button {
                    font-family: inherit;
                }

                /* =================================================
                   PAGE
                ================================================= */

                .trips-page {
                    min-height: 100vh;
                    min-height: 100dvh;

                    background:
                        linear-gradient(
                            180deg,
                            #fffaf7 0%,
                            #ffffff 45%,
                            #fff8f2 100%
                        );

                    padding:
                        30px
                        30px
                        60px;
                }

                .trips-container {
                    width: 100%;
                    max-width: 1250px;

                    margin: 0 auto;
                }

                /* =================================================
                   HEADER
                ================================================= */

                .trips-header {
                    display: flex;
                    align-items: center;

                    gap: 16px;

                    margin-bottom: 32px;
                }

                .trips-back-button {
                    width: 46px;
                    height: 46px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    border: 1px solid #e8e8e8;

                    border-radius: 13px;

                    background: #ffffff;

                    color: #333;

                    font-size: 20px;

                    cursor: pointer;

                    transition: 0.2s ease;
                }

                .trips-back-button:hover {
                    border-color: #ff7818;

                    color: #ff7818;

                    background: #fff7f1;

                    transform:
                        translateX(-2px);
                }

                .trips-heading h1 {
                    margin: 0;

                    font-size: 30px;

                    font-weight: 700;

                    color: #171717;
                }

                .trips-heading p {
                    margin: 5px 0 0;

                    font-size: 12px;

                    font-weight: 400;

                    color: #858585;
                }

                /* =================================================
                   AVAILABLE TRIPS TITLE
                ================================================= */

                .trips-section-title {
                    margin:
                        0
                        0
                        16px;

                    font-size: 16px;

                    font-weight: 600;

                    color: #242424;
                }

                /* =================================================
                   AVAILABLE TRIPS SEARCH
                ================================================= */

                .trips-section-heading-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 18px;
                    margin-bottom: 16px;
                }

                .trips-section-heading-row .trips-section-title {
                    margin: 0;
                    flex: 0 0 auto;
                }

                .trip-search-box {
                    position: relative;
                    width: min(390px, 100%);
                    height: 46px;
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    padding: 0 12px;
                    border: 1px solid #e4e4e4;
                    border-radius: 12px;
                    background: #ffffff;
                    box-shadow: 0 4px 14px rgba(20, 20, 20, 0.04);
                    transition:
                        border-color 0.2s ease,
                        box-shadow 0.2s ease,
                        background 0.2s ease;
                }

                .trip-search-box:focus-within {
                    border-color: #ff9b58;
                    background: #fffdfa;
                    box-shadow:
                        0 0 0 3px rgba(255, 120, 24, 0.10),
                        0 7px 20px rgba(20, 20, 20, 0.06);
                }

                .trip-search-icon {
                    width: 27px;
                    height: 27px;
                    flex: 0 0 27px;
                    display: grid;
                    place-items: center;
                    border-radius: 8px;
                    background: #fff2e8;
                    color: #ff7818;
                    font-size: 13px;
                }

                .trip-search-box input {
                    width: 100%;
                    min-width: 0;
                    height: 100%;
                    padding: 0;
                    border: none;
                    outline: none;
                    background: transparent;
                    color: #222222;
                    font-family: inherit;
                    font-size: 12px;
                    font-weight: 500;
                }

                .trip-search-box input::placeholder {
                    color: #a1a1a1;
                    font-weight: 400;
                }

                .trip-search-box input::-webkit-search-cancel-button {
                    display: none;
                }

                .trip-search-clear {
                    width: 27px;
                    height: 27px;
                    flex: 0 0 27px;
                    display: grid;
                    place-items: center;
                    border: none;
                    border-radius: 8px;
                    background: #f7f7f7;
                    color: #777777;
                    font-size: 18px;
                    line-height: 1;
                    cursor: pointer;
                    transition:
                        background 0.2s ease,
                        color 0.2s ease;
                }

                .trip-search-clear:hover {
                    background: #fff0e4;
                    color: #ff7818;
                }

                /* =================================================
                   TRIPS LIST
                ================================================= */

                .trips-list {
                    width: 100%;

                    display: grid;

                    grid-template-columns:
                        repeat(
                            2,
                            minmax(0, 1fr)
                        );

                    gap: 22px;
                }

                /* =================================================
                   TRIP CARD
                ================================================= */

                .trip-card {
                    position: relative;

                    min-height: 300px;

                    display: flex;

                    flex-direction: column;

                    padding: 28px;

                    background: #ffffff;

                    border:
                        1px solid
                        #e6e6e6;

                    border-radius: 18px;

                    cursor: pointer;

                    transition:
                        transform 0.2s ease,
                        border-color 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .trip-card:hover {
                    transform:
                        translateY(-3px);

                    border-color:
                        #ffb887;

                    box-shadow:
                        0 15px 35px
                        rgba(
                            255,
                            120,
                            24,
                            0.10
                        );
                }

                /* =================================================
                   CARD HEADER
                ================================================= */

                .trip-card-header {
                    display: flex;

                    align-items: flex-start;

                    justify-content:
                        space-between;

                    gap: 20px;

                    padding-bottom: 22px;

                    border-bottom:
                        1px solid
                        #eeeeee;
                }

                .vessel-info {
                    display: flex;

                    align-items: center;

                    gap: 15px;
                }

                .vessel-icon {
                    width: 58px;
                    height: 58px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    flex-shrink: 0;

                    border-radius: 15px;

                    background:
                        #fff1e7;

                    font-size: 28px;
                }

                .vessel-name {
                    margin: 0;

                    font-size: 18px;

                    font-weight: 600;

                    color: #191919;
                }

                .vessel-route {
                    margin:
                        5px
                        0
                        0;

                    font-size: 11px;

                    color: #999999;
                }

                /* =================================================
                   TIME
                ================================================= */

                .departure-time {
                    padding:
                        11px
                        16px;

                    border-radius: 10px;

                    background:
                        #fff4ec;

                    color:
                        #ff7818;

                    font-size: 14px;

                    font-weight: 700;

                    white-space: nowrap;
                }

                /* =================================================
                   CAPACITY
                ================================================= */

                .trip-capacity {
                    display: grid;

                    grid-template-columns:
                        1fr
                        1fr;

                    gap: 25px;

                    padding:
                        25px
                        0;
                }

                .capacity-item {
                    display: flex;

                    align-items: center;

                    gap: 13px;

                    padding:
                        10px
                        5px;
                }

                .capacity-icon {
                    width: 45px;
                    height: 45px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    flex-shrink: 0;

                    border-radius: 12px;

                    background:
                        #f7f7f7;

                    font-size: 20px;
                }

                .capacity-label {
                    display: block;

                    font-size: 11px;

                    color:
                        #999999;

                    margin-bottom: 3px;
                }

                .capacity-value {
                    display: block;

                    margin-top: 2px;

                    font-size: 14px;

                    font-weight: 600;

                    color:
                        #333333;
                }

                /* =================================================
                   LIVE CAPACITY STATUS
                ================================================= */

                .capacity-live-status {
                    display: flex;

                    align-items: center;

                    gap: 8px;

                    margin:
                        0
                        0
                        18px;

                    padding:
                        10px
                        13px;

                    border:
                        1px solid
                        #dcefe4;

                    border-radius:
                        10px;

                    background:
                        #f6fff9;

                    color:
                        #4f7b61;

                    font-size:
                        10px;
                }

                .capacity-live-status.error {
                    border-color:
                        #ffd3d3;

                    background:
                        #fff7f7;

                    color:
                        #b33b3b;
                }

                .live-dot {
                    color:
                        #15945b;

                    font-size:
                        9px;
                }

                .capacity-live-status.error
                .live-dot {
                    color:
                        #d33b3b;
                }

                .capacity-remaining {
                    display:
                        block;

                    margin-top:
                        3px;

                    color:
                        #999999;

                    font-size:
                        9px;
                }

                /* =================================================
                   SELECT BUTTON
                ================================================= */

                .select-trip-button {
                    width: 100%;

                    height: 50px;

                    margin-top: auto;

                    border: none;

                    border-radius: 10px;

                    background:
                        #ff7818;

                    color:
                        #ffffff;

                    font-size: 12px;

                    font-weight: 600;

                    cursor: pointer;

                    transition:
                        background 0.2s ease,
                        transform 0.15s ease,
                        box-shadow 0.2s ease;
                }

                .select-trip-button:hover {
                    background:
                        #ed690d;

                    transform:
                        translateY(-1px);

                    box-shadow:
                        0 8px 18px
                        rgba(
                            255,
                            120,
                            24,
                            0.20
                        );
                }

                .select-trip-button:active {
                    transform:
                        translateY(0);
                }

                /* =================================================
                   EMPTY SEARCH STATE
                ================================================= */

                .trips-empty-search {
                    width: 100%;
                    min-height: 210px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    margin-top: 2px;
                    padding: 30px 20px;
                    border: 1px dashed #e7d8cc;
                    border-radius: 16px;
                    background: #fffaf6;
                    text-align: center;
                }

                .trips-empty-search-icon {
                    width: 48px;
                    height: 48px;
                    display: grid;
                    place-items: center;
                    margin-bottom: 4px;
                    border-radius: 14px;
                    background: #fff0e4;
                    font-size: 21px;
                }

                .trips-empty-search strong {
                    color: #262626;
                    font-size: 14px;
                    font-weight: 700;
                }

                .trips-empty-search span {
                    color: #999999;
                    font-size: 11px;
                }

                .trips-empty-search button {
                    min-width: 105px;
                    height: 36px;
                    margin-top: 8px;
                    padding: 0 14px;
                    border: 1px solid #ffd0ae;
                    border-radius: 9px;
                    background: #ffffff;
                    color: #ff7818;
                    font-family: inherit;
                    font-size: 11px;
                    font-weight: 650;
                    cursor: pointer;
                    transition:
                        background 0.2s ease,
                        border-color 0.2s ease;
                }

                .trips-empty-search button:hover {
                    background: #fff1e6;
                    border-color: #ff9b58;
                }

                /* =================================================
                   INFO
                ================================================= */

                .trips-info {
                    margin-top: 22px;

                    padding:
                        15px
                        17px;

                    border:
                        1px solid
                        #ffe0cc;

                    border-radius: 11px;

                    background:
                        #fff9f5;

                    color:
                        #777777;

                    font-size: 10px;

                    line-height: 1.6;
                }

                .trips-info strong {
                    color:
                        #ff7818;
                }

                /* =================================================
                   LARGE SCREEN
                ================================================= */

                @media (min-width: 1200px) {

                    .trips-page {
                        padding:
                            35px
                            40px
                            70px;
                    }

                    .trip-card {
                        min-height: 330px;

                        padding: 32px;
                    }

                    .vessel-name {
                        font-size: 19px;
                    }

                    .departure-time {
                        font-size: 15px;

                        padding:
                            12px
                            18px;
                    }

                    .capacity-value {
                        font-size: 15px;
                    }

                    .select-trip-button {
                        height: 52px;

                        font-size: 13px;
                    }
                }

                /* =================================================
                   TABLET
                ================================================= */

                @media (max-width: 800px) {

                    .trips-section-heading-row {
                        align-items: stretch;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .trip-search-box {
                        width: 100%;
                    }

                    .trips-page {
                        padding:
                            28px
                            20px
                            45px;
                    }

                    .trips-list {
                        grid-template-columns:
                            1fr;

                        gap: 18px;
                    }

                    .trip-card {
                        min-height: 290px;
                    }
                }

                /* =================================================
                   MOBILE
                ================================================= */

                @media (max-width: 480px) {

                    .trips-section-heading-row {
                        gap: 10px;
                    }

                    .trip-search-box {
                        height: 44px;
                    }

                    .trip-search-box input {
                        font-size: 11px;
                    }

                    .trips-page {
                        padding:
                            20px
                            15px
                            35px;
                    }

                    .trips-header {
                        margin-bottom:
                            25px;
                    }

                    .trips-back-button {
                        width: 40px;
                        height: 40px;
                    }

                    .trips-heading h1 {
                        font-size: 23px;
                    }

                    .trips-heading p {
                        font-size: 10px;
                    }

                    .trip-card {
                        min-height: 270px;

                        padding: 20px;
                    }

                    .trip-card-header {
                        gap: 10px;
                    }

                    .vessel-icon {
                        width: 45px;
                        height: 45px;

                        font-size: 22px;
                    }

                    .vessel-name {
                        font-size: 14px;
                    }

                    .vessel-route {
                        font-size: 9px;
                    }

                    .departure-time {
                        font-size: 11px;

                        padding:
                            8px
                            10px;
                    }

                    .trip-capacity {
                        gap: 10px;

                        padding:
                            20px
                            0;
                    }

                    .capacity-live-status {
                        font-size:
                            9px;
                    }

                    .capacity-remaining {
                        font-size:
                            8px;
                    }

                    .capacity-icon {
                        width: 38px;
                        height: 38px;

                        font-size: 17px;
                    }

                    .capacity-label {
                        font-size: 9px;
                    }

                    .capacity-value {
                        font-size: 11px;
                    }

                    .select-trip-button {
                        height: 45px;

                        font-size: 11px;
                    }
                }

                /* =================================================
                   VERY SMALL MOBILE
                ================================================= */

                @media (max-width: 360px) {

                    .trip-card {
                        padding: 17px;
                    }

                    .trip-card-header {
                        align-items:
                            flex-start;
                    }

                    .vessel-name {
                        font-size: 13px;
                    }

                    .departure-time {
                        font-size: 10px;

                        padding:
                            7px
                            8px;
                    }

                    .trip-capacity {
                        grid-template-columns:
                            1fr;
                    }
                }

            `}</style>

            <main className="trips-page">

                <div className="trips-container">

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <header className="trips-header">

                        <button
                            type="button"
                            className="trips-back-button"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                            aria-label="Back to dashboard"
                        >
                            ←
                        </button>

                        <div className="trips-heading">

                            <h1>
                                Available Trips
                            </h1>

                            <p>
                                Select a vessel and departure time
                                for your trip.
                            </p>

                        </div>

                    </header>

                    {/* =================================================
                        TITLE
                    ================================================= */}

                    <div className="trips-section-heading-row">
                        <h2 className="trips-section-title">
                            Available Ferries
                        </h2>

                        <div className="trip-search-box">
                            <span
                                className="trip-search-icon"
                                aria-hidden="true"
                            >
                                🔎
                            </span>

                            <input
                                type="search"
                                value={tripSearch}
                                onChange={(event) =>
                                    setTripSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search ferry or departure time..."
                                aria-label="Search available ferries"
                            />

                            {tripSearch && (
                                <button
                                    type="button"
                                    className="trip-search-clear"
                                    onClick={() =>
                                        setTripSearch("")
                                    }
                                    aria-label="Clear ferry search"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>

                    {/* =================================================
                        LIVE CAPACITY STATUS
                    ================================================= */}

                    <div
                        className={
                            `capacity-live-status ${
                                capacityError
                                    ? "error"
                                    : ""
                            }`
                        }
                    >

                        <span className="live-dot">
                            ●
                        </span>

                        <span>

                            {capacityLoading
                                ? "Loading latest ferry capacity..."

                                : capacityError
                                    ? `Capacity update unavailable: ${capacityError}`

                                    : "Live capacity • Updated automatically every 5 seconds"
                            }

                        </span>

                    </div>

                    {/* =================================================
                        TRIPS
                    ================================================= */}

                    <div className="trips-list">

                        {filteredTrips.map(
                            (trip) => {

                                const passengerUsed =
                                    Number(
                                        trip.passengers
                                    ) || 0;

                                const passengerLimit =
                                    Number(
                                        trip.passengerCapacity
                                    ) || 100;

                                const motorcycleUsed =
                                    Number(
                                        trip.vehicles
                                    ) || 0;

                                const motorcycleLimit =
                                    Number(
                                        trip.vehicleCapacity
                                    ) || 10;

                                const passengerRemaining =
                                    Math.max(
                                        0,
                                        passengerLimit -
                                            passengerUsed
                                    );

                                const motorcycleRemaining =
                                    Math.max(
                                        0,
                                        motorcycleLimit -
                                            motorcycleUsed
                                    );

                                const passengerFull =
                                    passengerRemaining <= 0;

                                const manualClosed =
                                    Boolean(trip.manualClosed);

                                const bookingClosed =
                                    manualClosed || passengerFull;

                                const motorcycleFull =
                                    motorcycleRemaining <= 0;

                                return (
                                    <article
                                        className={`trip-card ${bookingClosed ? "trip-card-closed" : ""}`}
                                        key={trip.id}
                                        onClick={() =>
                                            selectTrip(
                                                trip
                                            )
                                        }
                                    >

                                        {/* =================================================
                                            CARD HEADER
                                        ================================================= */}

                                        <div className="trip-card-header">

                                            <div className="vessel-info">

                                                <div className="vessel-icon">
                                                    ⛴️
                                                </div>

                                                <div>

                                                    <h3 className="vessel-name">
                                                        {trip.vesselName}
                                                    </h3>

                                                    <p className="vessel-route">
                                                        Iloilo → Guimaras
                                                    </p>

                                                </div>

                                            </div>

                                            <div className="departure-time">
                                                {trip.departureTime}
                                            </div>

                                        </div>

                                        {/* =================================================
                                            CAPACITY
                                        ================================================= */}

                                        <div className="trip-capacity">

                                            {/* =============================================
                                                PASSENGERS
                                            ============================================= */}

                                            <div className="capacity-item">

                                                <div className="capacity-icon">
                                                    👤
                                                </div>

                                                <div>

                                                    <span className="capacity-label">
                                                        Passengers
                                                    </span>

                                                    <span className="capacity-value">
                                                        {passengerUsed}/
                                                        {passengerLimit}
                                                    </span>

                                                    <span className="capacity-remaining">
                                                        {passengerRemaining}{" "}
                                                        passenger{" "}
                                                        {passengerRemaining === 1
                                                            ? "slot"
                                                            : "slots"}{" "}
                                                        left
                                                    </span>

                                                </div>

                                            </div>

                                            {/* =============================================
                                                MOTORCYCLES
                                            ============================================= */}

                                            <div className="capacity-item">

                                                <div className="capacity-icon">
                                                    🏍️
                                                </div>

                                                <div>

                                                    <span className="capacity-label">
                                                        Motorcycles
                                                    </span>

                                                    <span className="capacity-value">
                                                        {motorcycleUsed}/
                                                        {motorcycleLimit}
                                                    </span>

                                                    <span className="capacity-remaining">
                                                        {motorcycleRemaining}{" "}
                                                        motorcycle{" "}
                                                        {motorcycleRemaining === 1
                                                            ? "slot"
                                                            : "slots"}{" "}
                                                        left
                                                    </span>

                                                </div>

                                            </div>

                                        </div>

                                        {motorcycleFull && !bookingClosed && (
                                            <div className="trip-capacity-notice">
                                                Motorcycle capacity is full. Passenger-only booking is still available.
                                            </div>
                                        )}

                                        {bookingClosed && (
                                            <div className="trip-capacity-notice trip-capacity-notice-closed">
                                                {manualClosed
                                                    ? "Online booking is currently closed by the administrator."
                                                    : "Passenger capacity is full for this ferry."}
                                            </div>
                                        )}

                                        {/* =================================================
                                            SELECT BUTTON
                                        ================================================= */}

                                        <button
                                            type="button"
                                            className="select-trip-button"
                                            disabled={
                                                bookingClosed
                                            }
                                            onClick={(
                                                event
                                            ) => {

                                                event.stopPropagation();

                                                if (
                                                    bookingClosed
                                                ) {
                                                    alert(
                                                        manualClosed
                                                            ? "Online booking for this ferry is currently closed by the administrator. Please choose another ferry."
                                                            : "This ferry is already full for passengers. Please choose another ferry."
                                                    );

                                                    return;
                                                }

                                                selectTrip(
                                                    trip
                                                );
                                            }}
                                            style={
                                                bookingClosed
                                                    ? {
                                                        opacity:
                                                            0.55,
                                                        cursor:
                                                            "not-allowed"
                                                    }
                                                    : undefined
                                            }
                                        >

                                            {manualClosed
                                                ? "Online Booking Closed"
                                                : passengerFull
                                                    ? "Passenger Capacity Full"
                                                    : "Select This Trip"}

                                        </button>

                                    </article>
                                );
                            }
                        )}

                    </div>

                    {filteredTrips.length === 0 && (
                        <div className="trips-empty-search">
                            <div className="trips-empty-search-icon">
                                🔎
                            </div>

                            <strong>
                                No matching ferry found
                            </strong>

                            <span>
                                Try searching for a vessel name or departure time.
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setTripSearch("")
                                }
                            >
                                Clear Search
                            </button>
                        </div>
                    )}

                    {/* =================================================
                        INFORMATION
                    ================================================= */}

                    <div className="trips-info">

                        <strong>
                            Note:
                        </strong>{" "}

                        Select your preferred vessel first.
                        The selected vessel and departure time
                        will automatically be carried into your
                        booking and receipt.

                    </div>

                </div>

            </main>
        </>
    );
};

export default Trips;