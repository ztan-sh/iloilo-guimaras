import React, { useState } from "react";
import {
    useLocation,
    useNavigate
} from "react-router-dom";


// =========================================================
// LOGO
// =========================================================

const LOGO_URL =
    "/images/guimarasgo-logo.png";


// =========================================================
// PASSENGER LIMITS
// =========================================================
//
// MOTORCYCLE:
// 1 account owner + maximum 2 additional passengers
// = 3 passengers maximum.
//
// NO MOTORCYCLE:
// 1 account owner + maximum 9 friends
// = 10 passengers maximum.
// =========================================================

const MOTORCYCLE_MAX_PASSENGERS = 3;
const NO_MOTORCYCLE_MAX_PASSENGERS = 10;

const MIN_PASSENGERS = 1;


// =========================================================
// BOOK TRIP
// =========================================================

const BookTrip = () => {

    const navigate = useNavigate();

    const location = useLocation();


    // =====================================================
    // RECOVER SAVED TRIP
    // =====================================================

    const savedTrip =
        sessionStorage.getItem(
            "tripDetails"
        );


    let previousTrip = {};


    try {

        previousTrip =
            savedTrip
                ? JSON.parse(savedTrip)
                : {};

    } catch (error) {

        console.error(
            "Unable to recover saved trip:",
            error
        );

        previousTrip = {};
    }


    // =====================================================
    // GET SELECTED FERRY
    // =====================================================
    //
    // The Trips page can pass the selected ferry through:
    //
    // navigate("/book-trip", {
    //     state: {
    //         trip: selectedTrip
    //     }
    // })
    //
    // We also check sessionStorage so the selection can
    // survive page refresh/navigation.
    // =====================================================

    const getStoredObject = (key) => {

        try {

            const value =
                sessionStorage.getItem(key);

            return value
                ? JSON.parse(value)
                : null;

        } catch (error) {

            console.warn(
                `Unable to read ${key}:`,
                error
            );

            return null;
        }
    };


    const selectedFerryFromState =
        location.state?.trip ||
        location.state?.selectedTrip ||
        location.state?.ferry ||
        location.state?.selectedFerry ||
        null;


    const selectedFerryFromStorage =
        getStoredObject("selectedFerry") ||
        getStoredObject("selectedTrip") ||
        getStoredObject("selectedVessel") ||
        getStoredObject("tripSelection") ||
        null;


    const selectedFerry =
        selectedFerryFromState ||
        selectedFerryFromStorage ||
        {};


    // =====================================================
    // LOGGED-IN PASSENGER
    // =====================================================
    // Login stores the authenticated passenger in
    // localStorage/sessionStorage under "user".
    // =====================================================

    const loggedInUser =
        getStoredObject("user") ||
        {};

    const accountOwnerName =
        loggedInUser.fullName ||
        loggedInUser.name ||
        "";


    // =====================================================
    // FERRY INFORMATION
    // =====================================================

    const ferryName =
        selectedFerry.ferryName ||
        selectedFerry.vesselName ||
        selectedFerry.vessel ||
        selectedFerry.name ||
        previousTrip.ferryName ||
        previousTrip.vesselName ||
        previousTrip.vessel ||
        "Ferry Vessel";


    const ferryDepartureTime =
        selectedFerry.departureTime ||
        selectedFerry.departure ||
        selectedFerry.time ||
        previousTrip.departureTime ||
        previousTrip.ferryTime ||
        "";


    const ferryOrigin =
        selectedFerry.origin ||
        selectedFerry.from ||
        previousTrip.origin ||
        "";


    const ferryDestination =
        selectedFerry.destination ||
        selectedFerry.to ||
        previousTrip.destination ||
        "";


    // =====================================================
    // CONVERT TIME TO HTML TIME FORMAT
    // =====================================================

    const normalizeTime = (value) => {

        if (!value) {
            return "";
        }


        // Already in HH:mm
        if (
            /^\d{2}:\d{2}$/.test(
                String(value)
            )
        ) {
            return String(value);
        }


        // Example: "6:00 AM"
        const match =
            String(value)
                .trim()
                .match(
                    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
                );


        if (!match) {
            return "";
        }


        let hour =
            Number(match[1]);

        const minute =
            match[2];

        const period =
            match[3].toUpperCase();


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


        return (
            String(hour).padStart(2, "0") +
            ":" +
            minute
        );
    };


    const selectedFerryTime =
        normalizeTime(
            ferryDepartureTime
        );


    // =====================================================
    // TRIP INFORMATION
    // =====================================================

    const [origin, setOrigin] =
        useState(
            ferryOrigin ||
            previousTrip.origin ||
            ""
        );


    const [destination, setDestination] =
        useState(
            ferryDestination ||
            previousTrip.destination ||
            ""
        );


    const [date, setDate] =
        useState(
            previousTrip.date ||
            ""
        );


    const [time, setTime] =
        useState(
            selectedFerryTime ||
            previousTrip.time ||
            ""
        );


    // =====================================================
    // CUSTOM DATE / TIME PICKERS
    // =====================================================

    const [datePickerOpen, setDatePickerOpen] =
        useState(false);

    const [timePickerOpen, setTimePickerOpen] =
        useState(false);

    // Custom route dropdowns prevent the browser's native
    // select popup from appearing.
    const [originPickerOpen, setOriginPickerOpen] =
        useState(false);

    const [destinationPickerOpen, setDestinationPickerOpen] =
        useState(false);

    const [calendarMonth, setCalendarMonth] =
        useState(() => {
            const initialDate =
                previousTrip.date || new Date().toISOString().split("T")[0];

            const parts =
                initialDate.split("-");

            return new Date(
                Number(parts[0]),
                Number(parts[1]) - 1,
                1
            );
        });


    // =====================================================
    // VEHICLE TYPE
    // =====================================================
    //
    // Default remains Motorcycle so existing bookings
    // continue to work.
    // =====================================================

    const [vehicleChoice, setVehicleChoice] =
        useState(
            previousTrip.vehicleType ===
                "No Motorcycle"
                ? "noMotorcycle"
                : previousTrip.vehicleType ===
                    "Motorcycle"
                    ? "motorcycle"
                    : ""
        );


    const vehicleType =
        vehicleChoice ===
            "noMotorcycle"
            ? "No Motorcycle"
            : "Motorcycle";


    const [plateNumber, setPlateNumber] =
        useState(
            previousTrip.plateNumber ||
            ""
        );


    // =====================================================
    // BOOKING WARNING POPUP
    // =====================================================

    const [bookingWarning, setBookingWarning] =
        useState({
            show: false,
            title: "",
            message: ""
        });


    const showBookingWarning = (title, message) => {
        setBookingWarning({
            show: true,
            title,
            message
        });
    };


    const closeBookingWarning = () => {
        setBookingWarning({
            show: false,
            title: "",
            message: ""
        });
    };


    // =====================================================
    // PASSENGER LIMIT
    // =====================================================

    const MAX_PASSENGERS =
        vehicleChoice ===
            "noMotorcycle"
            ? NO_MOTORCYCLE_MAX_PASSENGERS
            : MOTORCYCLE_MAX_PASSENGERS;


    // =====================================================
    // PASSENGER MODE
    // =====================================================

    const [passengerMode, setPassengerMode] =
        useState(
            previousTrip.passengerMode ||
            (
                Number(
                    previousTrip.passengers ||
                    1
                ) > 1
                    ? "withPassenger"
                    : "solo"
            )
        );


    // =====================================================
    // PASSENGER CREATOR
    // =====================================================

    const createPassenger = (
        existing = {}
    ) => ({

        name:
            existing.name ||
            "",

        age:
            existing.age ||
            "",

        gender:
            existing.gender ||
            "",

    });


    // =====================================================
    // PREVIOUS PASSENGERS
    // =====================================================

    const existingPassengerDetails =
        Array.isArray(
            previousTrip.passengerDetails
        )
            ? previousTrip.passengerDetails
            : [];


    // =====================================================
    // INITIAL PASSENGER COUNT
    // =====================================================

    const savedPassengerCount =
        Number(
            previousTrip.passengers ||
            (
                previousTrip.passengerMode ===
                "solo"
                    ? 1
                    : 2
            )
        );


    const initialPassengerCount =
        Math.min(
            Math.max(
                savedPassengerCount,
                MIN_PASSENGERS
            ),
            MAX_PASSENGERS
        );


    // =====================================================
    // BUILD INITIAL PASSENGERS
    // =====================================================

    const buildInitialPassengers = () => {

        const result = [];


        for (
            let index = 0;
            index < initialPassengerCount;
            index++
        ) {

            if (
                existingPassengerDetails[index]
            ) {

                result.push(
                    createPassenger({
                        ...existingPassengerDetails[index],
                        ...(index === 0 && accountOwnerName
                            ? { name: accountOwnerName }
                            : {})
                    })
                );

            }

            else if (
                index === 0 &&
                (
                    previousTrip.passengerName ||
                    previousTrip.passengerAge ||
                    previousTrip.passengerGender
                )
            ) {

                // Backward compatibility

                result.push({

                    name:
                        accountOwnerName ||
                        previousTrip.passengerName ||
                        "",

                    age:
                        previousTrip.passengerAge ||
                        "",

                    gender:
                        previousTrip.passengerGender ||
                        "",

                });

            }

            else {

                result.push(
                    createPassenger(
                        index === 0
                            ? {
                                name:
                                    accountOwnerName
                            }
                            : {}
                    )
                );
            }
        }


        return result;
    };


    const [
        passengerDetails,
        setPassengerDetails
    ] = useState(
        buildInitialPassengers()
    );


    // =====================================================
    // PASSENGER COUNT
    // =====================================================

    const passengers =
        passengerDetails.length;


    // =====================================================
    // UPDATE PASSENGER
    // =====================================================

    const updatePassenger = (
        index,
        field,
        value
    ) => {

        setPassengerDetails(
            (previous) => {

                const updated =
                    [...previous];


                updated[index] = {

                    ...updated[index],

                    [field]:
                        value,

                };


                return updated;
            }
        );
    };


    // =====================================================
    // INCREASE PASSENGERS
    // =====================================================

    const handlePassengerIncrease = () => {

        if (
            passengers >=
            MAX_PASSENGERS
        ) {

            return;
        }


        setPassengerDetails(
            (previous) => [

                ...previous,

                createPassenger()

            ]
        );


        if (
            passengerMode !==
            "withPassenger"
        ) {

            setPassengerMode(
                "withPassenger"
            );
        }
    };


    // =====================================================
    // SET MAXIMUM PASSENGERS
    // =====================================================

    const handlePassengerMax = () => {

        if (
            passengers >=
            MAX_PASSENGERS
        ) {
            return;
        }

        setPassengerDetails(
            (previous) => {

                const updated = [
                    ...previous
                ];

                while (
                    updated.length <
                    MAX_PASSENGERS
                ) {
                    updated.push(
                        createPassenger()
                    );
                }

                return updated;
            }
        );

        setPassengerMode(
            "withPassenger"
        );
    };


    // =====================================================
    // DECREASE PASSENGERS
    // =====================================================

    const handlePassengerDecrease = () => {

        if (
            passengers <=
            MIN_PASSENGERS
        ) {

            return;
        }


        setPassengerDetails(
            (previous) =>
                previous.slice(
                    0,
                    previous.length - 1
                )
        );


        if (
            passengers - 1 === 1
        ) {

            setPassengerMode(
                "solo"
            );
        }
    };


    // =====================================================
    // PASSENGER MODE
    // =====================================================

    const handlePassengerModeChange = (
        mode
    ) => {

        setPassengerMode(
            mode
        );


        // =================================================
        // SOLO
        // =================================================

        if (
            mode === "solo"
        ) {

            setPassengerDetails(
                (previous) => {

                    const owner =
                        previous[0] ||
                        createPassenger({
                            name:
                                accountOwnerName
                        });

                    return [
                        {
                            ...owner,
                            // Always use the registered account name
                            // when Solo is selected.
                            name:
                                accountOwnerName ||
                                owner.name ||
                                ""
                        }
                    ];
                }
            );

            return;
        }


        // =================================================
        // WITH PASSENGER
        // =================================================

        setPassengerDetails(
            (previous) => {

                if (
                    previous.length >= 2
                ) {

                    return previous;
                }


                return [

                    ...previous,

                    createPassenger()

                ];
            }
        );
    };


    // =====================================================
    // CHANGE VEHICLE
    // =====================================================

    const handleVehicleChange = (
        choice
    ) => {

        setVehicleChoice(
            choice
        );


        // =================================================
        // MOTORCYCLE
        // =================================================

        if (
            choice === "motorcycle"
        ) {

            // Motorcycle allows maximum 3 passengers.

            setPassengerDetails(
                (previous) =>
                    previous.slice(
                        0,
                        MOTORCYCLE_MAX_PASSENGERS
                    )
            );


            if (
                passengerDetails.length >
                MOTORCYCLE_MAX_PASSENGERS
            ) {

                setPassengerMode(
                    "withPassenger"
                );
            }


            return;
        }


        // =================================================
        // NO MOTORCYCLE
        // =================================================

        if (
            choice ===
            "noMotorcycle"
        ) {

            // No motorcycle allows up to 10.

            // We do not automatically add
            // 10 passengers. The user adds
            // friends using the + button.

            return;
        }
    };


    // =====================================================
    // ROUTE PICKER
    // =====================================================

    const routeOptions = [
        "Iloilo",
        "Guimaras"
    ];

    const getOppositePort = (value) =>
        value === "Iloilo"
            ? "Guimaras"
            : "Iloilo";


    const selectOrigin = (value) => {
        // The ferry route is always between Iloilo and Guimaras.
        // Selecting the origin automatically sets the opposite
        // port as the destination.
        setOrigin(value);
        setDestination(getOppositePort(value));
        setOriginPickerOpen(false);
    };

    const selectDestination = (value) => {
        // Keep the route consistent in the opposite direction too.
        setDestination(value);
        setOrigin(getOppositePort(value));
        setDestinationPickerOpen(false);
    };


    // =====================================================
    // PHILIPPINES LOCAL DATE + MINIMUM BOOKING DATE
    // =====================================================
    // Booking rules:
    // - Motorcycle: at least 1 day before travel.
    // - No motorcycle: same-day booking is allowed
    //   when at least 3 hours remain before departure.
    // Use Manila time for all comparisons.
    // =====================================================

    const getManilaDate = (dateObject = new Date()) => {
        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(dateObject);

        const values = {};
        parts.forEach((part) => {
            if (part.type !== "literal") {
                values[part.type] = part.value;
            }
        });

        return `${values.year}-${values.month}-${values.day}`;
    };

    const today = getManilaDate();

    const tomorrowDate = new Date(
        `${today}T00:00:00+08:00`
    );

    tomorrowDate.setDate(
        tomorrowDate.getDate() + 1
    );

    const tomorrow = getManilaDate(
        tomorrowDate
    );


    // FORMAT FERRY TIME FOR DISPLAY
    // =====================================================

    const formatDisplayTime = (
        value
    ) => {

        if (!value) {
            return "Departure time";
        }


        const normalized =
            normalizeTime(value);


        if (!normalized) {
            return value;
        }


        const [
            hours,
            minutes
        ] =
            normalized.split(":");


        const hourNumber =
            Number(hours);


        const period =
            hourNumber >= 12
                ? "PM"
                : "AM";


        const displayHour =
            hourNumber % 12 || 12;


        return (
            `${displayHour}:${minutes} ${period}`
        );
    };


    // =====================================================
    // CUSTOM DATE PICKER HELPERS
    // =====================================================

    const formatDisplayDate = (value) => {

        if (!value) {
            return "mm/dd/yyyy";
        }

        const parts = String(value).split("-");

        if (parts.length !== 3) {
            return value;
        }

        return `${parts[1]}/${parts[2]}/${parts[0]}`;
    };


    const selectDate = (year, month, day) => {

        const selected = new Date(
            year,
            month,
            day
        );

        const selectedString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        // Vehicle selection controls the earliest
        // allowed travel date:
        // - Motorcycle: book at least 1 day before.
        // - No motorcycle: same-day booking is allowed,
        //   but only when the departure is at least
        //   3 hours away.
        if (!vehicleChoice) {
            alert(
                "Please select whether you are bringing a motorcycle before choosing your travel date."
            );

            return;
        }

        const earliestDate =
            vehicleChoice ===
                "motorcycle"
                ? tomorrow
                : today;

        if (selectedString < earliestDate) {
            return;
        }

        setDate(selectedString);
        setDatePickerOpen(false);
    };


    const changeCalendarMonth = (amount) => {

        setCalendarMonth((current) =>
            new Date(
                current.getFullYear(),
                current.getMonth() + amount,
                1
            )
        );
    };


    const getCalendarDays = () => {

        const year =
            calendarMonth.getFullYear();

        const month =
            calendarMonth.getMonth();

        const firstDay =
            new Date(year, month, 1).getDay();

        const daysInMonth =
            new Date(year, month + 1, 0).getDate();

        const daysInPreviousMonth =
            new Date(year, month, 0).getDate();

        const cells = [];

        for (let i = firstDay - 1; i >= 0; i -= 1) {
            cells.push({
                day: daysInPreviousMonth - i,
                monthOffset: -1
            });
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            cells.push({
                day,
                monthOffset: 0
            });
        }

        let nextDay = 1;

        while (cells.length % 7 !== 0) {
            cells.push({
                day: nextDay,
                monthOffset: 1
            });
            nextDay += 1;
        }

        return cells;
    };


    const isDateToday = (year, month, day) =>
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` === today;


    const isDateSelected = (year, month, day) =>
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` === date;


    const isDatePast = (year, month, day) => {

        const value =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const earliestDate =
            vehicleChoice ===
                "motorcycle"
                ? tomorrow
                : today;

        return value < earliestDate;
    };


    // =====================================================
    // CUSTOM TIME PICKER HELPERS
    // =====================================================

    const allTimeOptions = [];

    for (
        let totalMinutes = 3 * 60 + 30;
        totalMinutes <= 19 * 60 + 30;
        totalMinutes += 30
    ) {
        const hour24 = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        const hour12 = hour24 % 12 || 12;
        const period = hour24 >= 12 ? "PM" : "AM";

        allTimeOptions.push({
            value: `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
            label: `${hour12}:${String(minute).padStart(2, "0")} ${period}`
        });
    }


    const getManilaCurrentMinutes = () => {
        const currentParts = new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone: "Asia/Manila",
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23"
            }
        ).formatToParts(new Date());

        const currentHour = Number(
            currentParts.find((part) => part.type === "hour")?.value || 0
        );

        const currentMinute = Number(
            currentParts.find((part) => part.type === "minute")?.value || 0
        );

        return currentHour * 60 + currentMinute;
    };


    // Only show departures that are still available today.
    // For future travel dates, show the complete schedule.
    // All comparisons use Philippine time (Asia/Manila / UTC+8).
    const currentManilaMinutes = getManilaCurrentMinutes();

    const timeOptions =
        date === today
            ? allTimeOptions.filter((option) => {
                const [hours, minutes] = option.value
                    .split(":")
                    .map(Number);

                return (hours * 60 + minutes) >= currentManilaMinutes;
            })
            : allTimeOptions;


    const getTimeMinutes = (value) => {
        const normalized = normalizeTime(value);

        if (!normalized) {
            return null;
        }

        const [hours, minutes] = normalized.split(":").map(Number);

        return hours * 60 + minutes;
    };


    const isSameDayPassengerTimeTooSoon = (value) => {
        if (vehicleChoice !== "noMotorcycle" || date !== today) {
            return false;
        }

        const departureMinutes = getTimeMinutes(value);

        if (departureMinutes === null) {
            return false;
        }

        return departureMinutes - getManilaCurrentMinutes() < 180;
    };


    const selectTime = (value) => {
        if (isSameDayPassengerTimeTooSoon(value)) {
            showBookingWarning(
                "Departure Too Soon",
                "Same-day passenger-only bookings must be made at least 3 hours before the ferry departure time. Please choose a later departure."
            );

            return;
        }

        setTime(value);
        setTimePickerOpen(false);
    };


    const currentTimeLabel =
        timeOptions.find(
            (option) => option.value === time
        )?.label ||
        formatDisplayTime(time);


    // =====================================================
    // SUBMIT BOOKING
    // =====================================================

    const handleSubmit = (
        event
    ) => {

        event.preventDefault();


        // =================================================
        // BASIC TRIP VALIDATION
        // =================================================

        if (
            !origin ||
            !destination ||
            !date ||
            !time
        ) {

            alert(
                "Please complete all trip details."
            );

            return;
        }

        // =================================================
        // VEHICLE SELECTION
        // =================================================

        if (!vehicleChoice) {
            alert(
                "Please select whether you are bringing a motorcycle before continuing."
            );

            return;
        }


        // =================================================
        // ADVANCE BOOKING RULES
        // =================================================
        //
        // MOTORCYCLE:
        // Must be booked at least 1 day before the
        // selected travel date.
        //
        // NO MOTORCYCLE:
        // Same-day booking is allowed, but the booking
        // must be made at least 3 hours before departure.
        // =================================================

        if (
            vehicleChoice ===
            "motorcycle"
        ) {

            if (date < tomorrow) {
                alert(
                    "Motorcycle bookings must be made at least 1 day before the selected trip. Please choose tomorrow or a later date."
                );

                return;
            }

        } else {

            if (date < today) {
                alert(
                    "The selected travel date has already passed. Please choose today or a future date."
                );

                return;
            }

            if (date === today) {

                if (isSameDayPassengerTimeTooSoon(time)) {
                    showBookingWarning(
                        "Departure Too Soon",
                        "Same-day passenger-only bookings must be made at least 3 hours before the ferry departure time. Please choose a later departure."
                    );

                    return;
                }
            }
        }


        // =================================================
        // SAME PORT
        // =================================================

        if (
            origin === destination
        ) {

            alert(
                "Origin and Destination cannot be the same."
            );

            return;
        }


        // =================================================
        // VEHICLE VALIDATION
        // =================================================

        if (
            vehicleChoice ===
            "motorcycle" &&
            !plateNumber.trim()
        ) {

            alert(
                "Please enter the motorcycle plate number."
            );

            return;
        }


        // =================================================
        // PASSENGER COUNT
        // =================================================

        if (
            passengers <
                MIN_PASSENGERS ||
            passengers >
                MAX_PASSENGERS
        ) {

            alert(
                vehicleChoice ===
                    "motorcycle"
                    ? "A motorcycle booking can have a maximum of 3 passengers."
                    : "A no-motorcycle booking can have a maximum of 10 passengers."
            );

            return;
        }


        // =================================================
        // PASSENGER INFORMATION
        // =================================================

        for (
            let index = 0;
            index <
            passengerDetails.length;
            index++
        ) {

            const passenger =
                passengerDetails[index];


            // ---------------------------------------------
            // NAME
            // ---------------------------------------------

            if (
                !passenger.name ||
                !passenger.name.trim()
            ) {

                alert(
                    `Please enter the full name of Passenger ${
                        index + 1
                    }.`
                );

                return;
            }


            // ---------------------------------------------
            // AGE
            // ---------------------------------------------

            if (
                passenger.age ===
                undefined ||
                passenger.age ===
                ""
            ) {

                alert(
                    `Please enter the age of Passenger ${
                        index + 1
                    }.`
                );

                return;
            }


            const ageNumber =
                Number(
                    passenger.age
                );


            if (
                Number.isNaN(
                    ageNumber
                ) ||
                ageNumber < 1 ||
                ageNumber > 120
            ) {

                alert(
                    `Please enter a valid age for Passenger ${
                        index + 1
                    }.`
                );

                return;
            }


            // ---------------------------------------------
            // GENDER
            // ---------------------------------------------

            if (
                !passenger.gender
            ) {

                alert(
                    `Please select the gender of Passenger ${
                        index + 1
                    }.`
                );

                return;
            }
        }


        // =================================================
        // CLEAN PASSENGER DATA
        // =================================================

        const cleanedPassengerDetails =
            passengerDetails.map(
                (passenger) => ({

                    name:
                        passenger.name
                            .trim(),

                    age:
                        Number(
                            passenger.age
                        ),

                    gender:
                        passenger.gender,

                })
            );


        // =================================================
        // FIRST PASSENGER
        // =================================================

        const firstPassenger =
            cleanedPassengerDetails[0];


        // =================================================
        // COMPLETE TRIP DETAILS
        // =================================================

        const tripDetails = {
            

            // ---------------------------------------------
            // ROUTE
            // ---------------------------------------------

            origin,

            destination,


            // ---------------------------------------------
            // SCHEDULE
            // ---------------------------------------------

            date,

            time,


            // ---------------------------------------------
            // SELECTED FERRY
            // ---------------------------------------------

            ferryId:
                selectedFerry.id ||
                selectedFerry.ferryId ||
                selectedFerry.vesselId ||
                previousTrip.ferryId ||
                "",

            ferryName,

            vesselName:
                ferryName,

            ferry:
                ferryName,

            departureTime:
                formatDisplayTime(
                    ferryDepartureTime ||
                    time
                ),


            // ---------------------------------------------
            // PASSENGER MODE
            // ---------------------------------------------

            passengerMode,


            // ---------------------------------------------
            // PASSENGER COUNT
            // ---------------------------------------------

            passengers,


            // ---------------------------------------------
            // COMPLETE PASSENGER LIST
            // ---------------------------------------------

            passengerDetails:
                cleanedPassengerDetails,


            // ---------------------------------------------
            // COMPATIBILITY FIELDS
            // ---------------------------------------------

            passengerName:
                firstPassenger.name,

            passengerAge:
                firstPassenger.age,

            passengerGender:
                firstPassenger.gender,


            // ---------------------------------------------
            // VEHICLE
            // ---------------------------------------------

            vehicleType,


            plateNumber:
                vehicleChoice ===
                    "motorcycle"
                    ? plateNumber
                        .trim()
                        .toUpperCase()
                    : "",

        };


        // =================================================
        // SAVE SELECTED FERRY
        // =================================================

        sessionStorage.setItem(
            "selectedFerry",
            JSON.stringify({

                ...selectedFerry,

                ferryName,

                vesselName:
                    ferryName,

                departureTime:
                    formatDisplayTime(
                        ferryDepartureTime ||
                        time
                    ),

                origin,

                destination,

            })
        );


        // =================================================
        // SAVE TRIP DETAILS
        // =================================================

        sessionStorage.setItem(
            "tripDetails",
            JSON.stringify(
                tripDetails
            )
        );


        // =================================================
        // SAVE PENDING TRIP
        // =================================================

        sessionStorage.setItem(
            "pendingTrip",
            JSON.stringify(
                tripDetails
            )
        );


        // =================================================
        // SAVE LATEST BOOKING
        // =================================================

        sessionStorage.setItem(
            "latestBooking",
            JSON.stringify(
                tripDetails
            )
        );


        // =================================================
        // CONSOLE CHECK
        // =================================================

        console.log(
            "Complete Trip Details:",
            tripDetails
        );


        // =================================================
        // GO TO PAYMENT
        // =================================================

        navigate(
            "/payment",
            {
                state: {

                    trip:
                        tripDetails

                }
            }
        );
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <>

            {bookingWarning.show && (
                <div
                    className="booking-warning-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="booking-warning-title"
                >
                    <div className="booking-warning-card">
                        <div className="booking-warning-icon" aria-hidden="true">!</div>
                        <h3 id="booking-warning-title">
                            {bookingWarning.title}
                        </h3>
                        <p>
                            {bookingWarning.message}
                        </p>
                        <button
                            type="button"
                            className="booking-warning-button"
                            onClick={closeBookingWarning}
                        >
                            Okay
                        </button>
                    </div>
                </div>
            )}


            <style>{`

                * {
                    box-sizing: border-box;
                }


                html,
                body,
                #root {
                    margin: 0;
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

                    color:
                        #222222;
                }


                /* =================================================
                   BOOKING WARNING POPUP
                ================================================= */

                .booking-warning-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 200;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(17, 24, 39, .48);
                    backdrop-filter: blur(3px);
                }

                .booking-warning-card {
                    width: min(100%, 440px);
                    padding: 28px 26px 24px;
                    border: 1px solid #f3d2b7;
                    border-radius: 18px;
                    background: #ffffff;
                    box-shadow: 0 24px 70px rgba(17, 24, 39, .22);
                    text-align: center;
                    animation: bookingWarningAppear .18s ease-out;
                }

                .booking-warning-icon {
                    width: 52px;
                    height: 52px;
                    margin: 0 auto 14px;
                    display: grid;
                    place-items: center;
                    border-radius: 50%;
                    background: #fff1e5;
                    color: #f28c28;
                    font-size: 24px;
                    font-weight: 800;
                }

                .booking-warning-card h3 {
                    margin: 0;
                    color: #222222;
                    font-size: 20px;
                    font-weight: 800;
                }

                .booking-warning-card p {
                    margin: 10px 0 20px;
                    color: #6b7280;
                    font-size: 13px;
                    line-height: 1.6;
                }

                .booking-warning-button {
                    width: 100%;
                    min-height: 44px;
                    border: 0;
                    border-radius: 10px;
                    background: #f28c28;
                    color: #ffffff;
                    font: inherit;
                    font-size: 13px;
                    font-weight: 800;
                    cursor: pointer;
                }

                .booking-warning-button:hover {
                    background: #ea7612;
                }

                @keyframes bookingWarningAppear {
                    from { opacity: 0; transform: translateY(8px) scale(.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }


                /* =================================================
                   PAGE
                ================================================= */

                .book-trip-page {

                    min-height:
                        100vh;

                    padding:
                        30px
                        20px
                        60px;

                    background:
                        #f7f8fa;

                    display:
                        flex;

                    justify-content:
                        center;
                }


                .book-trip-container {

                    width:
                        100%;

                    max-width:
                        850px;

                    background:
                        #ffffff;

                    border:
                        1px solid #e5e5e5;

                    border-radius:
                        18px;

                    box-shadow:
                        0 10px 35px
                        rgba(
                            0,
                            0,
                            0,
                            0.06
                        );

                    overflow:
                        hidden;
                }


                /* =================================================
                   HEADER
                ================================================= */

                .book-trip-header {

                    height:
                        82px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    padding:
                        0 28px;

                    border-bottom:
                        1px solid #eeeeee;

                    background:
                        #ffffff;
                }


                .back-button {

                    width:
                        42px;

                    height:
                        42px;

                    border:
                        1px solid #dddddd;

                    border-radius:
                        10px;

                    background:
                        #ffffff;

                    color:
                        #333333;

                    font-size:
                        20px;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;
                }


                .back-button:hover {

                    background:
                        #fff7f0;

                    border-color:
                        #f28c28;

                    color:
                        #f28c28;
                }


                .book-trip-logo {

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    flex:
                        1;
                }


                .book-trip-logo img {

                    width:
                        125px;

                    height:
                        65px;

                    object-fit:
                        contain;
                }


                .header-spacer {

                    width:
                        42px;
                }


                /* =================================================
                   HEADING
                ================================================= */

                .book-trip-heading {

                    padding:
                        32px
                        42px
                        20px;
                }


                .book-trip-heading h1 {

                    margin:
                        0;

                    color:
                        #222222;

                    font-size:
                        28px;

                    font-weight:
                        750;
                }


                .book-trip-heading p {

                    margin:
                        7px
                        0
                        0;

                    color:
                        #999999;

                    font-size:
                        13px;
                }


                /* =================================================
                   SELECTED FERRY
                ================================================= */

                .selected-ferry-card {

                    margin:
                        0 42px 10px;

                    padding:
                        18px;

                    border:
                        1px solid #f5d7bf;

                    border-radius:
                        14px;

                    background:
                        linear-gradient(
                            135deg,
                            #fffaf6,
                            #fff4eb
                        );

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        18px;
                }


                .selected-ferry-left {

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        14px;

                    min-width:
                        0;
                }


                .ferry-icon {

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
                        12px;

                    background:
                        #fff0e3;

                    font-size:
                        25px;
                }


                .selected-ferry-label {

                    color:
                        #f28c28;

                    font-size:
                        10px;

                    font-weight:
                        800;

                    text-transform:
                        uppercase;

                    letter-spacing:
                        0.6px;

                    margin-bottom:
                        4px;
                }


                .selected-ferry-name {

                    color:
                        #222222;

                    font-size:
                        17px;

                    font-weight:
                        750;
                }


                .selected-ferry-route {

                    color:
                        #999999;

                    font-size:
                        11px;

                    margin-top:
                        4px;
                }


                .selected-ferry-time {

                    flex:
                        0 0 auto;

                    padding:
                        10px
                        14px;

                    border-radius:
                        10px;

                    background:
                        #ffffff;

                    color:
                        #f28c28;

                    font-size:
                        13px;

                    font-weight:
                        800;

                    border:
                        1px solid #f2dccb;
                }


                /* =================================================
                   FORM
                ================================================= */

                .trip-form {

                    padding:
                        0
                        42px
                        42px;
                }


                .form-section {

                    padding:
                        28px
                        0;

                    border-top:
                        1px solid #eeeeee;
                }


                .section-title {

                    display:
                        flex;

                    align-items:
                        flex-start;

                    gap:
                        13px;

                    margin-bottom:
                        24px;
                }


                .section-number {

                    width:
                        38px;

                    height:
                        38px;

                    flex:
                        0 0 38px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        12px;

                    background:
                        #fff1e5;

                    color:
                        #f28c28;

                    font-size:
                        11px;

                    font-weight:
                        800;
                }


                .section-title h2 {

                    margin:
                        0;

                    color:
                        #222222;

                    font-size:
                        19px;

                    font-weight:
                        750;
                }


                .section-title p {

                    margin:
                        5px
                        0
                        0;

                    color:
                        #999999;

                    font-size:
                        12px;

                    line-height:
                        1.4;
                }


                /* =================================================
                   ROUTE
                ================================================= */

                .route-row {

                    width:
                        100%;

                    display:
                        grid;

                    grid-template-columns:
                        minmax(0, 1fr)
                        50px
                        minmax(0, 1fr);

                    align-items:
                        end;

                    gap:
                        15px;
                }


                .route-field {

                    min-width:
                        0;
                }


                /* =================================================
                   CUSTOM ROUTE PICKERS
                ================================================= */

                .custom-route-field {
                    position: relative;
                }

                .route-picker-trigger {
                    width: 100%;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 0 14px;
                    border: 1px solid #dddddd;
                    border-radius: 10px;
                    outline: none;
                    background: #ffffff;
                    color: #222222;
                    font: inherit;
                    font-size: 13px;
                    font-weight: 500;
                    text-align: left;
                    cursor: pointer;
                    transition:
                        border-color .2s ease,
                        box-shadow .2s ease,
                        background .2s ease;
                }

                .route-picker-trigger:hover {
                    border-color: #f2b47f;
                    background: #fffdfa;
                }

                .route-picker-trigger.active {
                    border-color: #f28c28;
                    background: #fffaf6;
                    box-shadow: 0 0 0 3px rgba(242, 140, 40, .10);
                }

                .route-picker-value {
                    color: #111827;
                    font-weight: 650;
                }

                .route-picker-placeholder {
                    color: #6b7280;
                    font-weight: 500;
                }

                .route-chevron {
                    width: 28px;
                    height: 28px;
                    flex: 0 0 28px;
                    display: grid;
                    place-items: center;
                    border-radius: 8px;
                    background: #fff3e8;
                    color: #f28c28;
                    font-size: 16px;
                    line-height: 1;
                    transition: transform .2s ease;
                }

                .route-chevron.open {
                    transform: rotate(180deg);
                }

                .route-options {
                    position: absolute;
                    z-index: 70;
                    top: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    padding: 7px;
                    border: 1px solid #e5e7eb;
                    border-radius: 14px;
                    background: #ffffff;
                    box-shadow:
                        0 18px 45px rgba(17, 24, 39, .14),
                        0 4px 12px rgba(17, 24, 39, .05);
                    overflow: hidden;
                    animation: routePickerAppear .15s ease-out;
                }

                @keyframes routePickerAppear {
                    from {
                        opacity: 0;
                        transform: translateY(-5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .route-options-heading {
                    padding: 8px 9px 9px;
                    border-bottom: 1px solid #f1f2f4;
                }

                .route-options-heading span {
                    display: block;
                    color: #111827;
                    font-size: 11px;
                    font-weight: 800;
                }

                .route-options-heading small {
                    display: block;
                    margin-top: 3px;
                    color: #9ca3af;
                    font-size: 9px;
                }

                .route-option {
                    width: 100%;
                    min-height: 42px;
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    margin-top: 4px;
                    padding: 0 9px;
                    border: 1px solid transparent;
                    border-radius: 9px;
                    background: #ffffff;
                    color: #374151;
                    font: inherit;
                    font-size: 12px;
                    font-weight: 600;
                    text-align: left;
                    cursor: pointer;
                    transition:
                        background .15s ease,
                        border-color .15s ease,
                        color .15s ease;
                }

                .route-option:hover {
                    background: #fff7f0;
                    border-color: #f5d0b1;
                    color: #ea6f0b;
                }

                .route-option.selected {
                    background: #fff1e5;
                    border-color: #f8c59f;
                    color: #ea6f0b;
                }

                .route-option-icon {
                    width: 24px;
                    height: 24px;
                    flex: 0 0 24px;
                    display: grid;
                    place-items: center;
                    border-radius: 7px;
                    background: #fff3e8;
                    color: #f28c28;
                    font-size: 12px;
                    font-weight: 800;
                }

                .route-option-check {
                    margin-left: auto;
                    color: #ea6f0b;
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: .3px;
                }


                .route-field label,
                .form-group label {

                    display:
                        block;

                    margin-bottom:
                        8px;

                    color:
                        #444444;

                    font-size:
                        12px;

                    font-weight:
                        700;
                }


                .route-field input,
                .route-field select,
                .form-group input,
                .form-group select {

                    width:
                        100%;

                    height:
                        50px;

                    padding:
                        0
                        14px;

                    border:
                        1px solid #dddddd;

                    border-radius:
                        10px;

                    outline:
                        none;

                    background:
                        #ffffff;

                    color:
                        #222222;

                    font-size:
                        13px;

                    transition:
                        0.2s ease;
                }


                .route-field input:focus,
                .route-field select:focus,
                .form-group input:focus,
                .form-group select:focus {

                    border-color:
                        #f28c28;

                    box-shadow:
                        0 0 0 3px
                        rgba(
                            242,
                            140,
                            40,
                            0.12
                        );
                }


                .route-arrow {

                    width:
                        50px;

                    height:
                        50px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    color:
                        #f28c28;

                    font-size:
                        22px;
                }


                /* =================================================
                   FORM GROUP
                ================================================= */

                .form-group {

                    margin-bottom:
                        20px;
                }


                .form-group:last-child {

                    margin-bottom:
                        0;
                }


                /* =================================================
                   DATE TIME
                ================================================= */

                .date-time-row {

                    width:
                        100%;

                    display:
                        grid;

                    grid-template-columns:
                        minmax(0, 1fr)
                        minmax(0, 1fr);

                    gap:
                        18px;

                    align-items:
                        stretch;
                }


                /* =================================================
                   TRAVEL SCHEDULE UI
                ================================================= */

                .schedule-field {

                    position:
                        relative;

                    min-width:
                        0;

                    padding:
                        18px;

                    border:
                        1px solid #e5e7eb;

                    border-radius:
                        16px;

                    background:
                        linear-gradient(
                            180deg,
                            #ffffff 0%,
                            #fffdfb 100%
                        );

                    box-shadow:
                        0 2px 8px rgba(17, 24, 39, 0.03);

                    transition:
                        border-color 0.2s ease,
                        box-shadow 0.2s ease,
                        transform 0.2s ease;
                }


                .schedule-field:hover {

                    border-color:
                        #f3c39c;

                    box-shadow:
                        0 5px 18px rgba(17, 24, 39, 0.06);
                }


                .schedule-field:focus-within {

                    border-color:
                        #f28c28;

                    box-shadow:
                        0 0 0 4px
                        rgba(242, 140, 40, 0.09),
                        0 6px 20px rgba(17, 24, 39, 0.06);
                }


                .schedule-field .form-group {

                    margin-bottom:
                        0;
                }


                .schedule-field label {

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        9px;

                    margin-bottom:
                        10px;

                    color:
                        #111827;

                    font-size:
                        13px;

                    font-weight:
                        750;

                    letter-spacing:
                        0.1px;
                }


                .schedule-label-icon {

                    width:
                        28px;

                    height:
                        28px;

                    flex:
                        0 0 28px;

                    display:
                        inline-flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border:
                        1px solid #f7dfca;

                    border-radius:
                        8px;

                    background:
                        #fff3e8;

                    color:
                        #f28c28;

                    font-size:
                        13px;

                    box-shadow:
                        0 1px 2px rgba(242, 140, 40, 0.08);
                }


                .schedule-field input[type="date"],
                .schedule-field input[type="time"] {

                    width:
                        100%;

                    height:
                        52px;

                    box-sizing:
                        border-box;

                    padding:
                        0 14px;

                    border:
                        1px solid #dfe3e8;

                    border-radius:
                        12px;

                    outline:
                        none;

                    background:
                        #ffffff;

                    color:
                        #1f2937;

                    font-size:
                        14px;

                    font-weight:
                        650;

                    transition:
                        border-color 0.2s ease,
                        background 0.2s ease,
                        box-shadow 0.2s ease;

                    color-scheme:
                        light;
                }


                .schedule-field input[type="date"]::-webkit-datetime-edit,
                .schedule-field input[type="time"]::-webkit-datetime-edit {

                    color:
                        #1f2937;
                }


                .schedule-field input[type="date"]::-webkit-calendar-picker-indicator,
                .schedule-field input[type="time"]::-webkit-calendar-picker-indicator {

                    cursor:
                        pointer;

                    opacity:
                        0.75;

                    transition:
                        opacity 0.2s ease;
                }


                .schedule-field input[type="date"]::-webkit-calendar-picker-indicator:hover,
                .schedule-field input[type="time"]::-webkit-calendar-picker-indicator:hover {

                    opacity:
                        1;
                }


                .schedule-field input[type="date"]:hover,
                .schedule-field input[type="time"]:hover {

                    border-color:
                        #f2b47f;

                    background:
                        #fffdfa;
                }


                .schedule-field input[type="date"]:focus,
                .schedule-field input[type="time"]:focus {

                    border-color:
                        #f28c28;

                    background:
                        #ffffff;

                    box-shadow:
                        0 0 0 3px
                        rgba(242, 140, 40, 0.10);
                }


                .schedule-range-note {

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        7px;

                    min-height:
                        18px;

                    margin-top:
                        8px;

                    color:
                        #7b8491;

                    font-size:
                        10px;

                    line-height:
                        1.45;
                }


                .schedule-range-note > span:first-child {

                    width:
                        17px;

                    height:
                        17px;

                    flex:
                        0 0 17px;

                    display:
                        inline-flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        50%;

                    background:
                        #fff3e8;

                    color:
                        #f28c28;

                    font-size:
                        9px;
                }


                .schedule-range-note strong {

                    color:
                        #374151;

                    font-weight:
                        700;
                }


                .schedule-field .field-help {

                    display:
                        block;

                    width:
                        100%;

                    box-sizing:
                        border-box;

                    margin-top:
                        10px;

                    padding:
                        10px 12px;

                    border:
                        1px solid #f5d8c0;

                    border-radius:
                        10px;

                    background:
                        #fff8f2;

                    color:
                        #7b6250;

                    font-size:
                        10.5px;

                    line-height:
                        1.45;

                    overflow:
                        hidden;

                    text-overflow:
                        ellipsis;
                }


                .schedule-field .field-help strong {

                    color:
                        #e87517;

                    font-weight:
                        750;
                }


                /* =================================================
                   VEHICLE CHOICE
                ================================================= */
                /* =================================================
                   VEHICLE CHOICE
                ================================================= */

                .vehicle-choice {

                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            2,
                            minmax(0, 1fr)
                        );

                    gap:
                        16px;

                    margin-bottom:
                        20px;
                }


                .vehicle-choice-card {

                    position:
                        relative;

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        13px;

                    min-height:
                        82px;

                    padding:
                        16px 18px;

                    border:
                        1px solid #dddddd;

                    border-radius:
                        12px;

                    background:
                        #ffffff;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;
                }


                .vehicle-choice-card:hover {

                    border-color:
                        #f28c28;

                    background:
                        #fffaf6;
                }


                .vehicle-choice-card.active {

                    border:
                        2px solid #f28c28;

                    background:
                        #fff8f1;
                }


                .vehicle-radio {

                    width:
                        18px;

                    height:
                        18px;

                    flex:
                        0 0 18px;

                    border:
                        2px solid #cccccc;

                    border-radius:
                        50%;

                    position:
                        relative;
                }


                .vehicle-choice-card.active
                .vehicle-radio {

                    border-color:
                        #f28c28;
                }


                .vehicle-choice-card.active
                .vehicle-radio::after {

                    content:
                        "";

                    position:
                        absolute;

                    width:
                        8px;

                    height:
                        8px;

                    left:
                        3px;

                    top:
                        3px;

                    border-radius:
                        50%;

                    background:
                        #f28c28;
                }


                .vehicle-icon {

                    width:
                        38px;

                    height:
                        38px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        10px;

                    background:
                        #fff0e3;

                    font-size:
                        20px;
                }


                .vehicle-content {

                    display:
                        flex;

                    flex-direction:
                        column;

                    gap:
                        4px;
                }


                .vehicle-content strong {

                    color:
                        #222222;

                    font-size:
                        13px;
                }


                .vehicle-content span {

                    color:
                        #999999;

                    font-size:
                        11px;

                    line-height:
                        1.4;
                }


                .vehicle-limit-badge {

                    margin-left:
                        auto;

                    padding:
                        6px 9px;

                    border-radius:
                        8px;

                    background:
                        #fff0e3;

                    color:
                        #f28c28;

                    font-size:
                        10px;

                    font-weight:
                        800;

                    white-space:
                        nowrap;
                }


                /* =================================================
                   PASSENGER CHOICE
                ================================================= */

                .passenger-choice {

                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            2,
                            minmax(0, 1fr)
                        );

                    gap:
                        16px;

                    margin-bottom:
                        25px;
                }


                .passenger-choice-card {

                    position:
                        relative;

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        13px;

                    min-height:
                        72px;

                    padding:
                        15px 18px;

                    border:
                        1px solid #dddddd;

                    border-radius:
                        12px;

                    background:
                        #ffffff;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;
                }


                .passenger-choice-card:hover {

                    border-color:
                        #f28c28;

                    background:
                        #fffaf6;
                }


                .passenger-choice-card.active {

                    border:
                        2px solid #f28c28;

                    background:
                        #fff8f1;
                }


                .choice-radio {

                    width:
                        18px;

                    height:
                        18px;

                    flex:
                        0 0 18px;

                    border:
                        2px solid #cccccc;

                    border-radius:
                        50%;

                    position:
                        relative;
                }


                .passenger-choice-card.active
                .choice-radio {

                    border-color:
                        #f28c28;
                }


                .passenger-choice-card.active
                .choice-radio::after {

                    content:
                        "";

                    position:
                        absolute;

                    width:
                        8px;

                    height:
                        8px;

                    left:
                        3px;

                    top:
                        3px;

                    border-radius:
                        50%;

                    background:
                        #f28c28;
                }


                .choice-icon {

                    width:
                        34px;

                    height:
                        34px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        10px;

                    background:
                        #fff0e3;

                    font-size:
                        17px;
                }


                .choice-content {

                    display:
                        flex;

                    flex-direction:
                        column;

                    gap:
                        3px;
                }


                .choice-content strong {

                    color:
                        #222222;

                    font-size:
                        13px;
                }


                .choice-content span {

                    color:
                        #999999;

                    font-size:
                        11px;
                }


                /* =================================================
                   PASSENGER CARDS
                ================================================= */

                .passenger-list {

                    display:
                        flex;

                    flex-direction:
                        column;

                    gap:
                        18px;

                    margin-bottom:
                        24px;
                }


                .passenger-card {

                    padding:
                        20px;

                    border:
                        1px solid #e5e5e5;

                    border-radius:
                        13px;

                    background:
                        #fcfcfc;

                    transition:
                        0.2s ease;
                }


                .passenger-card:hover {

                    border-color:
                        #f0c7a5;

                    box-shadow:
                        0 5px 18px
                        rgba(
                            0,
                            0,
                            0,
                            0.04
                        );
                }


                .passenger-card-header {

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    margin-bottom:
                        18px;
                }


                .passenger-card-title {

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        9px;
                }


                .passenger-card-number {

                    width:
                        30px;

                    height:
                        30px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        9px;

                    background:
                        #fff0e3;

                    color:
                        #f28c28;

                    font-size:
                        11px;

                    font-weight:
                        800;
                }


                .passenger-card-title strong {

                    color:
                        #222222;

                    font-size:
                        14px;
                }


                .passenger-card-title span {

                    color:
                        #999999;

                    font-size:
                        11px;
                }


                .passenger-fields {

                    display:
                        grid;

                    grid-template-columns:
                        minmax(0, 1.5fr)
                        minmax(100px, 0.6fr)
                        minmax(0, 0.9fr);

                    gap:
                        15px;
                }


                .passenger-fields
                .form-group {

                    margin-bottom:
                        0;
                }


                .passenger-input {

                    width:
                        100%;

                    height:
                        50px;

                    padding:
                        0
                        14px;

                    border:
                        1px solid #dddddd;

                    border-radius:
                        10px;

                    outline:
                        none;

                    background:
                        #ffffff;

                    color:
                        #222222;

                    font-size:
                        13px;

                    transition:
                        0.2s ease;
                }


                .passenger-input:focus {

                    border-color:
                        #f28c28;

                    box-shadow:
                        0 0 0 3px
                        rgba(
                            242,
                            140,
                            40,
                            0.12
                        );
                }


                /* =================================================
                   PASSENGER COUNTER
                ================================================= */

                .passenger-counter {

                    width:
                        100%;

                    height:
                        52px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    border:
                        1px solid #dddddd;

                    border-radius:
                        10px;

                    overflow:
                        hidden;

                    background:
                        #ffffff;
                }


                .passenger-counter button {

                    width:
                        60px;

                    height:
                        100%;

                    flex:
                        0 0 60px;

                    border:
                        none;

                    background:
                        #fff7f0;

                    color:
                        #f28c28;

                    font-size:
                        25px;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;
                }


                .passenger-counter button:hover:not(:disabled) {

                    background:
                        #ffeddf;
                }


                .passenger-counter button:disabled {

                    background:
                        #f7f7f7;

                    color:
                        #cccccc;

                    cursor:
                        not-allowed;
                }


                .passenger-value {

                    flex:
                        1;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    gap:
                        8px;
                }


                .passenger-value strong {

                    color:
                        #222222;

                    font-size:
                        18px;
                }


                .passenger-value span {

                    color:
                        #999999;

                    font-size:
                        12px;
                }


                .passenger-max-row {
                    display:
                        flex;

                    justify-content:
                        flex-end;

                    margin-top:
                        8px;
                }


                .passenger-max-button {
                    min-width:
                        92px;

                    height:
                        34px;

                    padding:
                        0 14px;

                    border:
                        1px solid #f2c6a3;

                    border-radius:
                        9px;

                    background:
                        #fff7f0;

                    color:
                        #f28c28;

                    font-size:
                        11px;

                    font-weight:
                        750;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;
                }


                .passenger-max-button:hover:not(:disabled) {
                    background:
                        #ffeddf;

                    border-color:
                        #f28c28;
                }


                .passenger-max-button:disabled {
                    background:
                        #f7f7f7;

                    border-color:
                        #e5e5e5;

                    color:
                        #c8c8c8;

                    cursor:
                        not-allowed;
                }


                .passenger-limit {

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        15px;

                    margin-top:
                        8px;
                }


                .passenger-help {

                    color:
                        #999999;

                    font-size:
                        11px;
                }


                .passenger-limit-text {

                    color:
                        #f28c28;

                    font-size:
                        11px;

                    font-weight:
                        700;

                    text-align:
                        right;
                }


                .field-help {

                    display:
                        block;

                    margin-top:
                        7px;

                    color:
                        #999999;

                    font-size:
                        11px;

                    line-height:
                        1.4;
                }


                /* =================================================
                   NO MOTORCYCLE NOTICE
                ================================================= */

                .no-motorcycle-notice {

                    margin-bottom:
                        20px;

                    padding:
                        14px;

                    border:
                        1px solid #f4dfcf;

                    border-radius:
                        11px;

                    background:
                        #fffaf6;

                    color:
                        #8a5a32;

                    font-size:
                        12px;

                    line-height:
                        1.5;
                }


                .no-motorcycle-notice strong {

                    color:
                        #f28c28;
                }


                /* =================================================
                   BOOKING NOTE
                ================================================= */

                .booking-note {

                    width:
                        100%;

                    display:
                        flex;

                    align-items:
                        flex-start;

                    gap:
                        12px;

                    padding:
                        15px;

                    border:
                        1px solid #f4dfcf;

                    border-radius:
                        11px;

                    background:
                        #fffaf6;
                }


                .note-icon {

                    width:
                        28px;

                    height:
                        28px;

                    flex:
                        0 0 28px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        50%;

                    background:
                        #f28c28;

                    color:
                        #ffffff;

                    font-size:
                        13px;

                    font-weight:
                        700;
                }


                .booking-note strong {

                    display:
                        block;

                    margin-bottom:
                        3px;

                    color:
                        #333333;

                    font-size:
                        12px;
                }


                .booking-note p {

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
                   CONTINUE
                ================================================= */

                .continue-button {

                    width:
                        100%;

                    height:
                        54px;

                    margin-top:
                        18px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    gap:
                        12px;

                    border:
                        none;

                    border-radius:
                        10px;

                    background:
                        linear-gradient(
                            135deg,
                            #f28c28,
                            #ff9d3f
                        );

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

                    box-shadow:
                        0 8px 20px
                        rgba(
                            242,
                            140,
                            40,
                            0.20
                        );
                }


                .continue-button:hover {

                    background:
                        linear-gradient(
                            135deg,
                            #e97f1d,
                            #f28c28
                        );

                    transform:
                        translateY(-2px);

                    box-shadow:
                        0 12px 25px
                        rgba(
                            242,
                            140,
                            40,
                            0.28
                        );
                }


                .button-arrow {

                    font-size:
                        18px;
                }


                /* =================================================
                   CUSTOM DATE / TIME PICKERS
                ================================================= */

                .schedule-picker-trigger {
                    width: 100%;
                    min-height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 0 15px;
                    border: 1px solid #dfe3e8;
                    border-radius: 12px;
                    background: #ffffff;
                    color: #111827;
                    font: inherit;
                    text-align: left;
                    cursor: pointer;
                    transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
                }

                .schedule-picker-trigger:hover {
                    border-color: #f2a15c;
                    background: #fffdfb;
                }

                .schedule-picker-trigger.active {
                    border-color: #ff7a18;
                    box-shadow: 0 0 0 3px rgba(255, 122, 24, .10);
                    background: #fffdfb;
                }

                .picker-value {
                    font-weight: 600;
                    color: #111827;
                    letter-spacing: .1px;
                }

                .picker-placeholder {
                    color: #6b7280;
                    font-weight: 500;
                }

                .picker-trigger-icon {
                    width: 30px;
                    height: 30px;
                    flex: 0 0 30px;
                    display: grid;
                    place-items: center;
                    border-radius: 8px;
                    background: #fff2e7;
                    color: #f28c28;
                    font-size: 17px;
                }

                .custom-date-picker,
                .custom-time-picker {
                    position: absolute;
                    z-index: 50;
                    left: 18px;
                    right: 18px;
                    top: 118px;
                    border: 1px solid #e5e7eb;
                    border-radius: 16px;
                    background: #ffffff;
                    box-shadow: 0 18px 45px rgba(17, 24, 39, .15);
                    overflow: hidden;
                    animation: pickerAppear .16s ease-out;
                }

                .custom-time-picker {
                    top: 118px;
                }

                @keyframes pickerAppear {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .picker-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 16px 13px;
                    border-bottom: 1px solid #f1f2f4;
                }

                .picker-month {
                    display: block;
                    color: #111827;
                    font-size: 15px;
                    font-weight: 700;
                }

                .picker-year {
                    display: block;
                    margin-top: 2px;
                    color: #9ca3af;
                    font-size: 12px;
                    font-weight: 500;
                }

                .picker-nav {
                    display: flex;
                    gap: 6px;
                }

                .picker-nav button {
                    width: 32px;
                    height: 32px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #374151;
                    font-size: 21px;
                    line-height: 1;
                    cursor: pointer;
                }

                .picker-nav button:hover {
                    border-color: #f28c28;
                    color: #f28c28;
                    background: #fff8f1;
                }

                .calendar-weekdays,
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 4px;
                    padding: 0 12px;
                }

                .calendar-weekdays {
                    padding-top: 12px;
                    padding-bottom: 6px;
                }

                .calendar-weekdays span {
                    text-align: center;
                    color: #9ca3af;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .calendar-grid {
                    padding-bottom: 12px;
                }

                .calendar-day {
                    width: 100%;
                    aspect-ratio: 1;
                    min-height: 32px;
                    border: 0;
                    border-radius: 9px;
                    background: transparent;
                    color: #374151;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                }

                .calendar-day:hover:not(:disabled) {
                    background: #fff1e5;
                    color: #ea6f0b;
                }

                .calendar-day.outside {
                    color: #cbd0d7;
                }

                .calendar-day.past {
                    color: #d6d9de;
                    cursor: not-allowed;
                }

                .calendar-day.today {
                    box-shadow: inset 0 0 0 1px #f6b27a;
                }

                .calendar-day.selected {
                    background: #ff7a18;
                    color: #ffffff;
                    font-weight: 700;
                    box-shadow: 0 4px 10px rgba(255, 122, 24, .24);
                }

                .picker-footer {
                    padding: 10px 12px;
                    border-top: 1px solid #f1f2f4;
                    background: #fffdfb;
                    text-align: right;
                }

                .picker-footer button {
                    border: 0;
                    background: transparent;
                    color: #ea6f0b;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .time-picker-heading {
                    padding: 15px 16px;
                    border-bottom: 1px solid #f1f2f4;
                    background: #fffdfb;
                }

                .time-picker-heading strong,
                .time-picker-heading span {
                    display: block;
                }

                .time-picker-heading strong {
                    color: #111827;
                    font-size: 13px;
                }

                .time-picker-heading span {
                    margin-top: 3px;
                    color: #9ca3af;
                    font-size: 11px;
                }

                .same-day-time-note {
                    display: block;
                    margin-top: 5px;
                    color: #ea6f0b;
                    font-size: 10px;
                    line-height: 1.4;
                }


                .time-options-grid {
                    max-height: 280px;
                    overflow-y: auto;
                    padding: 10px;
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 7px;
                }

                .time-option-disabled {
                    opacity: .45;
                    cursor: not-allowed;
                    background: #f7f7f7;
                }

                .time-option-disabled:hover {
                    border-color: #e5e7eb;
                    background: #f7f7f7;
                    color: inherit;
                }


                .time-option {
                    min-height: 42px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 6px;
                    padding: 0 10px;
                    border: 1px solid #e5e7eb;
                    border-radius: 9px;
                    background: #ffffff;
                    color: #374151;
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: .15s ease;
                }

                .time-option:hover {
                    border-color: #f3b47d;
                    background: #fff8f1;
                    color: #ea6f0b;
                }

                .time-option.selected {
                    border-color: #ff7a18;
                    background: #fff1e5;
                    color: #ea6f0b;
                }

                .selected-ferry-note {
                    min-height: 38px;
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 4px;
                    margin-top: 9px;
                    padding: 8px 11px;
                    border: 1px solid #ffd8bc;
                    border-radius: 10px;
                    background: #fffaf6;
                    color: #6b7280;
                    font-size: 11px;
                }

                .selected-ferry-note strong {
                    color: #ea6f0b;
                }

                .schedule-field {
                    position: relative;
                }

                /* =================================================
                   TABLET
                ================================================= */

                @media (max-width: 800px) {

                    .book-trip-page {

                        padding:
                            20px
                            16px
                            50px;
                    }


                    .book-trip-container {

                        max-width:
                            720px;
                    }


                    .trip-form {

                        padding:
                            0
                            35px
                            40px;
                    }


                    .selected-ferry-card {

                        margin-left:
                            35px;

                        margin-right:
                            35px;
                    }


                    .passenger-fields {

                        grid-template-columns:
                            1fr
                            1fr;
                    }


                    .passenger-fields
                    .form-group:first-child {

                        grid-column:
                            1 / -1;
                    }

                }


                /* =================================================
                   MOBILE
                ================================================= */

                @media (max-width: 600px) {

                    .book-trip-page {

                        padding:
                            0;

                        background:
                            #ffffff;
                    }


                    .book-trip-container {

                        min-height:
                            100vh;

                        max-width:
                            none;

                        border:
                            none;

                        border-radius:
                            0;

                        box-shadow:
                            none;
                    }


                    .book-trip-header {

                        height:
                            82px;

                        padding:
                            0
                            18px;
                    }


                    .book-trip-logo img {

                        width:
                            105px;

                        height:
                            55px;
                    }


                    .date-time-row {
                        grid-template-columns: 1fr;
                        gap: 14px;
                    }


                    .schedule-field {
                        padding: 14px;
                    }


                    .header-spacer {

                        width:
                            40px;
                    }


                    .book-trip-heading {

                        padding:
                            30px
                            20px
                            20px;
                    }


                    .book-trip-heading h1 {

                        font-size:
                            28px;
                    }


                    .trip-form {

                        padding:
                            0
                            20px
                            35px;
                    }


                    .selected-ferry-card {

                        margin:
                            0
                            20px
                            10px;

                        align-items:
                            flex-start;

                        flex-direction:
                            column;
                    }


                    .selected-ferry-time {

                        width:
                            100%;

                        text-align:
                            center;
                    }


                    .form-section {

                        padding:
                            23px
                            0;
                    }


                    .route-row {

                        grid-template-columns:
                            1fr;

                        gap:
                            0;
                    }


                    .route-arrow {

                        display:
                            none;
                    }


                    .date-time-row {

                        grid-template-columns:
                            1fr;

                        gap:
                            0;
                    }


                    .vehicle-choice {

                        grid-template-columns:
                            1fr;
                    }


                    .passenger-choice {

                        grid-template-columns:
                            1fr;
                    }


                    .passenger-fields {

                        grid-template-columns:
                            1fr;
                    }


                    .passenger-fields
                    .form-group:first-child {

                        grid-column:
                            auto;
                    }


                    .section-title {

                        margin-bottom:
                            20px;
                    }


                    .section-title h2 {

                        font-size:
                            16px;
                    }


                    .section-title p {

                        font-size:
                            11px;
                    }


                    .form-group input,
                    .form-group select,
                    .route-field input,
                    .route-field select,
                    .passenger-input {

                        height:
                            48px;
                    }


                    .passenger-counter button {

                        width:
                            55px;

                        flex-basis:
                            55px;
                    }


                    .passenger-limit {

                        align-items:
                            flex-start;

                        flex-direction:
                            column;

                        gap:
                            4px;
                    }


                    .passenger-limit-text {

                        text-align:
                            left;
                    }


                    .continue-button {

                        height:
                            52px;
                    }

                }


                @media (max-width: 600px) {

                    .custom-date-picker,
                    .custom-time-picker {
                        left: 0;
                        right: 0;
                        top: 116px;
                    }

                    .time-options-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        max-height: 300px;
                    }

                    .calendar-day {
                        min-height: 36px;
                    }

                }


                /* =================================================
                   SMALL PHONES
                ================================================= */

                @media (max-width: 380px) {

                    .trip-form {

                        padding-left:
                            16px;

                        padding-right:
                            16px;
                    }


                    .book-trip-heading {

                        padding-left:
                            16px;

                        padding-right:
                            16px;
                    }


                    .selected-ferry-card {

                        margin-left:
                            16px;

                        margin-right:
                            16px;
                    }


                    .book-trip-heading h1 {

                        font-size:
                            25px;
                    }


                    .section-title {

                        gap:
                            10px;
                    }


                    .section-number {

                        width:
                            32px;

                        height:
                            32px;

                        flex-basis:
                            32px;
                    }


                    .passenger-counter button {

                        width:
                            52px;

                        flex-basis:
                            52px;
                    }

                }

            `}</style>


            <main className="book-trip-page">

                <div className="book-trip-container">


                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <header
                        className="book-trip-header"
                    >

                        <button
                            type="button"
                            className="back-button"
                            onClick={() =>
                                navigate(
                                    "/trips"
                                )
                            }
                            aria-label="Back to available trips"
                        >
                            ←
                        </button>


                        <div
                            className="book-trip-logo"
                        >

                            <img
                                src={LOGO_URL}
                                alt="GuimarasGo Logo"
                            />

                        </div>


                        <div
                            className="header-spacer"
                            aria-hidden="true"
                        />

                    </header>


                    {/* =================================================
                        PAGE HEADING
                    ================================================= */}

                    <section
                        className="book-trip-heading"
                    >

                        <h1>
                            Book Your Trip
                        </h1>

                        <p>
                            Complete your travel,
                            passenger, and vehicle details.
                        </p>

                    </section>


                    {/* =================================================
                        SELECTED FERRY
                    ================================================= */}

                    <div
                        className="selected-ferry-card"
                    >

                        <div
                            className="selected-ferry-left"
                        >

                            <div
                                className="ferry-icon"
                            >
                                ⛴️
                            </div>


                            <div>

                                <div
                                    className="selected-ferry-label"
                                >
                                    Selected Ferry
                                </div>


                                <div
                                    className="selected-ferry-name"
                                >
                                    {ferryName}
                                </div>


                                <div
                                    className="selected-ferry-route"
                                >
                                    {origin || "Origin"}
                                    {" → "}
                                    {destination || "Destination"}
                                </div>

                            </div>

                        </div>


                        <div
                            className="selected-ferry-time"
                        >
                            {formatDisplayTime(
                                ferryDepartureTime ||
                                time
                            )}
                        </div>

                    </div>


                    {/* =================================================
                        FORM
                    ================================================= */}

                    <form
                        className="trip-form"
                        onSubmit={
                            handleSubmit
                        }
                    >


                        {/* =================================================
                            01 - ROUTE
                        ================================================= */}

                        <section
                            className="form-section"
                        >

                            <div
                                className="section-title"
                            >

                                <span
                                    className="section-number"
                                >
                                    01
                                </span>


                                <div>

                                    <h2>
                                        Trip Route
                                    </h2>

                                    <p>
                                        Confirm your departure
                                        and destination ports.
                                    </p>

                                </div>

                            </div>


                            <div
                                className="route-row"
                            >

                                {/* ORIGIN */}

                                <div
                                    className={`route-field custom-route-field ${originPickerOpen ? "route-open" : ""}`}
                                >

                                    <label>
                                        Origin Port
                                    </label>

                                    <button
                                        type="button"
                                        className={`route-picker-trigger ${originPickerOpen ? "active" : ""}`}
                                        onClick={() => {
                                            setOriginPickerOpen((open) => !open);
                                            setDestinationPickerOpen(false);
                                        }}
                                        aria-expanded={originPickerOpen}
                                        aria-haspopup="listbox"
                                    >
                                        <span className={origin ? "route-picker-value" : "route-picker-placeholder"}>
                                            {origin || "Select origin"}
                                        </span>

                                        <span
                                            className={`route-chevron ${originPickerOpen ? "open" : ""}`}
                                            aria-hidden="true"
                                        >
                                            ▾
                                        </span>
                                    </button>

                                    {originPickerOpen && (
                                        <div
                                            className="route-options"
                                            role="listbox"
                                            aria-label="Origin port"
                                        >
                                            <div className="route-options-heading">
                                                <span>Departure Port</span>
                                                <small>Select your starting port</small>
                                            </div>

                                            {routeOptions.map((option) => (
                                                <button
                                                    key={`origin-${option}`}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={origin === option}
                                                    aria-disabled={false}
                                                    className={`route-option ${origin === option ? "selected" : ""}`}
                                                    onClick={() => selectOrigin(option)}
                                                >
                                                    <span className="route-option-icon">
                                                        {origin === option ? "✓" : "•"}
                                                    </span>

                                                    <span>{option}</span>

                                                    {origin === option && (
                                                        <span className="route-option-check">
                                                            Selected
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                </div>


                                {/* ARROW */}

                                <div
                                    className="route-arrow"
                                    aria-hidden="true"
                                >
                                    <span>→</span>
                                </div>


                                {/* DESTINATION */}

                                <div
                                    className={`route-field custom-route-field ${destinationPickerOpen ? "route-open" : ""}`}
                                >

                                    <label>
                                        Destination Port
                                    </label>

                                    <button
                                        type="button"
                                        className={`route-picker-trigger ${destinationPickerOpen ? "active" : ""}`}
                                        onClick={() => {
                                            setDestinationPickerOpen((open) => !open);
                                            setOriginPickerOpen(false);
                                        }}
                                        aria-expanded={destinationPickerOpen}
                                        aria-haspopup="listbox"
                                    >
                                        <span className={destination ? "route-picker-value" : "route-picker-placeholder"}>
                                            {destination || "Select destination"}
                                        </span>

                                        <span
                                            className={`route-chevron ${destinationPickerOpen ? "open" : ""}`}
                                            aria-hidden="true"
                                        >
                                            ▾
                                        </span>
                                    </button>

                                    {destinationPickerOpen && (
                                        <div
                                            className="route-options"
                                            role="listbox"
                                            aria-label="Destination port"
                                        >
                                            <div className="route-options-heading">
                                                <span>Arrival Port</span>
                                                <small>Select your destination port</small>
                                            </div>

                                            {routeOptions.map((option) => (
                                                <button
                                                    key={`destination-${option}`}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={destination === option}
                                                    aria-disabled={false}
                                                    className={`route-option ${destination === option ? "selected" : ""}`}
                                                    onClick={() => selectDestination(option)}
                                                >
                                                    <span className="route-option-icon">
                                                        {destination === option ? "✓" : "•"}
                                                    </span>

                                                    <span>{option}</span>

                                                    {destination === option && (
                                                        <span className="route-option-check">
                                                            Selected
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                </div>

                            </div>

                        </section>


                        {/* =================================================
                            02 - VEHICLE
                        ================================================= */}

                        <section
                            className="form-section"
                        >

                            <div
                                className="section-title"
                            >

                                <span
                                    className="section-number"
                                >
                                    02
                                </span>


                                <div>

                                    <h2>
                                        Vehicle
                                    </h2>

                                    <p>
                                        Select whether you are
                                        bringing a motorcycle.
                                    </p>

                                </div>

                            </div>


                            <div
                                className="vehicle-choice"
                            >


                                {/* MOTORCYCLE */}

                                <div
                                    className={
                                        `vehicle-choice-card ${
                                            vehicleChoice ===
                                            "motorcycle"
                                                ? "active"
                                                : ""
                                        }`
                                    }
                                    onClick={() =>
                                        handleVehicleChange(
                                            "motorcycle"
                                        )
                                    }
                                >

                                    <div
                                        className="vehicle-radio"
                                    />


                                    <div
                                        className="vehicle-icon"
                                    >
                                        🏍️
                                    </div>


                                    <div
                                        className="vehicle-content"
                                    >

                                        <strong>
                                            Motorcycle
                                        </strong>

                                        <span>
                                            Bringing a motorcycle
                                            on the ferry.
                                        </span>

                                    </div>


                                    <div
                                        className="vehicle-limit-badge"
                                    >
                                        Max 3
                                    </div>

                                </div>


                                {/* NO MOTORCYCLE */}

                                <div
                                    className={
                                        `vehicle-choice-card ${
                                            vehicleChoice ===
                                            "noMotorcycle"
                                                ? "active"
                                                : ""
                                        }`
                                    }
                                    onClick={() =>
                                        handleVehicleChange(
                                            "noMotorcycle"
                                        )
                                    }
                                >

                                    <div
                                        className="vehicle-radio"
                                    />


                                    <div
                                        className="vehicle-icon"
                                    >
                                        👥
                                    </div>


                                    <div
                                        className="vehicle-content"
                                    >

                                        <strong>
                                            No Motorcycle
                                        </strong>

                                        <span>
                                            Travel with friends
                                            without a vehicle.
                                        </span>

                                    </div>


                                    <div
                                        className="vehicle-limit-badge"
                                    >
                                        Max 10
                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                MOTORCYCLE DETAILS
                            ================================================= */}

                            {vehicleChoice ===
                                "motorcycle" && (

                                <>

                                    <div
                                        className="form-group"
                                    >

                                        <label>
                                            Vehicle Type
                                        </label>


                                        <input
                                            type="text"
                                            value="Motorcycle"
                                            disabled
                                        />

                                    </div>


                                    <div
                                        className="form-group"
                                    >

                                        <label
                                            htmlFor="plateNumber"
                                        >
                                            Plate Number
                                        </label>


                                        <input
                                            id="plateNumber"
                                            type="text"
                                            placeholder="Enter plate number"
                                            value={
                                                plateNumber
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setPlateNumber(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            maxLength={20}
                                        />


                                        <small
                                            className="field-help"
                                        >
                                            Example:
                                            ABC-1234
                                        </small>

                                    </div>

                                </>

                            )}


                            {/* =================================================
                                NO MOTORCYCLE MESSAGE
                            ================================================= */}

                            {vehicleChoice ===
                                "noMotorcycle" && (

                                <div
                                    className="no-motorcycle-notice"
                                >

                                    <strong>
                                        No Motorcycle selected.
                                    </strong>
                                    {" "}
                                    You can add yourself and up
                                    to 9 friends, for a maximum
                                    of 10 passengers on this booking.

                                </div>

                            )}

                        </section>


                        {/* =================================================
                            03 - SCHEDULE
                        ================================================= */}

                        <section
                            className="form-section"
                        >

                            <div
                                className="section-title"
                            >

                                <span
                                    className="section-number"
                                >
                                    03
                                </span>


                                <div>

                                    <h2>
                                        Travel Schedule
                                    </h2>

                                    <p>
                                        Confirm your travel
                                        date and ferry departure.
                                    </p>

                                </div>

                            </div>


                            <div
                                className="date-time-row"
                            >


                                {/* DATE */}

                                <div
                                    className="schedule-field schedule-field-date"
                                >

                                    <div className="form-group">

                                        <label>
                                            <span
                                                className="schedule-label-icon"
                                                aria-hidden="true"
                                            >
                                                📅
                                            </span>
                                            Travel Date
                                        </label>

                                        <button
                                            type="button"
                                            className={`schedule-picker-trigger ${datePickerOpen ? "active" : ""}`}
                                            onClick={() => {
                                                setDatePickerOpen((open) => !open);
                                                setTimePickerOpen(false);
                                            }}
                                            aria-expanded={datePickerOpen}
                                            aria-haspopup="dialog"
                                        >
                                            <span
                                                className={date ? "picker-value" : "picker-placeholder"}
                                            >
                                                {formatDisplayDate(date)}
                                            </span>
                                            <span className="picker-trigger-icon" aria-hidden="true">▦</span>
                                        </button>

                                        {datePickerOpen && (

                                            <div
                                                className="custom-date-picker"
                                                role="dialog"
                                                aria-label="Travel date picker"
                                            >
                                                <div className="picker-header">
                                                    <div>
                                                        <span className="picker-month">
                                                            {calendarMonth.toLocaleString("en-US", { month: "long" })}
                                                        </span>
                                                        <span className="picker-year">
                                                            {calendarMonth.getFullYear()}
                                                        </span>
                                                    </div>

                                                    <div className="picker-nav">
                                                        <button
                                                            type="button"
                                                            onClick={() => changeCalendarMonth(-1)}
                                                            aria-label="Previous month"
                                                        >
                                                            ‹
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => changeCalendarMonth(1)}
                                                            aria-label="Next month"
                                                        >
                                                            ›
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="calendar-weekdays">
                                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                                        <span key={day}>{day}</span>
                                                    ))}
                                                </div>

                                                <div className="calendar-grid">
                                                    {getCalendarDays().map((cell, index) => {
                                                        const cellDate = new Date(
                                                            calendarMonth.getFullYear(),
                                                            calendarMonth.getMonth() + cell.monthOffset,
                                                            cell.day
                                                        );
                                                        const year = cellDate.getFullYear();
                                                        const month = cellDate.getMonth();
                                                        const day = cellDate.getDate();
                                                        const past = isDatePast(year, month, day);
                                                        const selected = isDateSelected(year, month, day);
                                                        const todayCell = isDateToday(year, month, day);
                                                        const outside = cell.monthOffset !== 0;

                                                        return (
                                                            <button
                                                                key={`${year}-${month}-${day}-${index}`}
                                                                type="button"
                                                                className={`calendar-day ${outside ? "outside" : ""} ${past ? "past" : ""} ${selected ? "selected" : ""} ${todayCell ? "today" : ""}`}
                                                                disabled={past}
                                                                onClick={() => selectDate(year, month, day)}
                                                            >
                                                                {day}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <div className="picker-footer">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const parts = today.split("-");
                                                            setCalendarMonth(new Date(Number(parts[0]), Number(parts[1]) - 1, 1));
                                                            setDate(today);
                                                            setDatePickerOpen(false);
                                                        }}
                                                    >
                                                        Today
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="schedule-range-note">
                                            <span aria-hidden="true">✓</span>
                                            <span>Select today or a future travel date.</span>
                                        </div>

                                    </div>

                                </div>


                                {/* TIME */}

                                <div
                                    className="schedule-field schedule-field-time"
                                >

                                    <div className="form-group">

                                        <label>
                                            <span
                                                className="schedule-label-icon"
                                                aria-hidden="true"
                                            >
                                                🕐
                                            </span>
                                            Departure Time
                                        </label>

                                        <button
                                            type="button"
                                            className={`schedule-picker-trigger ${timePickerOpen ? "active" : ""}`}
                                            onClick={() => {
                                                setTimePickerOpen((open) => !open);
                                                setDatePickerOpen(false);
                                            }}
                                            aria-expanded={timePickerOpen}
                                            aria-haspopup="listbox"
                                        >
                                            <span
                                                className={time ? "picker-value" : "picker-placeholder"}
                                            >
                                                {time ? currentTimeLabel : "--:-- --"}
                                            </span>
                                            <span className="picker-trigger-icon" aria-hidden="true">◷</span>
                                        </button>

                                        {timePickerOpen && (
                                            <div
                                                className="custom-time-picker"
                                                role="listbox"
                                                aria-label="Departure time picker"
                                            >
                                                <div className="time-picker-heading">
                                                    <div>
                                                        <strong>Select departure time</strong>
                                                        <span>Available from 3:30 AM to 7:30 PM</span>
                                                        {vehicleChoice === "noMotorcycle" && date === today && (
                                                            <small className="same-day-time-note">Same-day passenger bookings require at least 3 hours before departure.</small>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="time-options-grid">
                                                    {timeOptions.map((option) => (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            role="option"
                                                            aria-selected={option.value === time}
                                                            className={`time-option ${option.value === time ? "selected" : ""} ${isSameDayPassengerTimeTooSoon(option.value) ? "time-option-disabled" : ""}`}
                                                            aria-disabled={isSameDayPassengerTimeTooSoon(option.value)}
                                                            onClick={() => selectTime(option.value)}
                                                        >
                                                            <span>{option.label}</span>
                                                            {option.value === time && <span aria-hidden="true">✓</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="schedule-range-note">
                                            <span aria-hidden="true">⏱</span>
                                            <span>Ferry departure window: <strong>3:30 AM – 7:30 PM</strong></span>
                                        </div>

                                        <div className="selected-ferry-note">
                                            <span>Selected ferry:</span>
                                            <strong>{ferryName}</strong>
                                            <span>—</span>
                                            <span>{formatDisplayTime(time || ferryDepartureTime)}</span>
                                        </div>

                                    </div>

                                </div>
                            </div>

                        </section>


                        {/* =================================================
                            04 - PASSENGER DETAILS
                        ================================================= */}

                        <section
                            className="form-section"
                        >

                            <div
                                className="section-title"
                            >

                                <span
                                    className="section-number"
                                >
                                    04
                                </span>


                                <div>

                                    <h2>
                                        Passenger Details
                                    </h2>

                                    <p>
                                        Tell us who will be
                                        traveling.
                                    </p>

                                </div>

                            </div>


                            {/* =================================================
                                SOLO / WITH PASSENGER
                            ================================================= */}

                            <div
                                className="passenger-choice"
                            >


                                {/* SOLO */}

                                <div
                                    className={
                                        `passenger-choice-card ${
                                            passengerMode ===
                                            "solo"
                                                ? "active"
                                                : ""
                                        }`
                                    }
                                    onClick={() =>
                                        handlePassengerModeChange(
                                            "solo"
                                        )
                                    }
                                >

                                    <div
                                        className="choice-radio"
                                    />


                                    <div
                                        className="choice-icon"
                                    >
                                        👤
                                    </div>


                                    <div
                                        className="choice-content"
                                    >

                                        <strong>
                                            Solo
                                        </strong>

                                        <span>
                                            I am travelling alone.
                                        </span>

                                    </div>

                                </div>


                                {/* WITH PASSENGER */}

                                <div
                                    className={
                                        `passenger-choice-card ${
                                            passengerMode ===
                                            "withPassenger"
                                                ? "active"
                                                : ""
                                        }`
                                    }
                                    onClick={() =>
                                        handlePassengerModeChange(
                                            "withPassenger"
                                        )
                                    }
                                >

                                    <div
                                        className="choice-radio"
                                    />


                                    <div
                                        className="choice-icon"
                                    >
                                        👥
                                    </div>


                                    <div
                                        className="choice-content"
                                    >

                                        <strong>
                                            With Passenger
                                        </strong>

                                        <span>
                                            I am travelling
                                            with someone.
                                        </span>

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                NO MOTORCYCLE FRIEND MESSAGE
                            ================================================= */}

                            {vehicleChoice ===
                                "noMotorcycle" && (

                                <div
                                    className="no-motorcycle-notice"
                                >

                                    <strong>
                                        Account Owner + Friends
                                    </strong>
                                    <br />

                                    Passenger 1 is the account
                                    owner. Add up to 9 friends
                                    using the + button below.

                                </div>

                            )}


                            {/* =================================================
                                PASSENGER LIST
                            ================================================= */}

                            <div
                                className="passenger-list"
                            >

                                {
                                    passengerDetails.map(
                                        (
                                            passenger,
                                            index
                                        ) => (

                                            <div
                                                className="passenger-card"
                                                key={
                                                    index
                                                }
                                            >

                                                <div
                                                    className="passenger-card-header"
                                                >

                                                    <div
                                                        className="passenger-card-title"
                                                    >

                                                        <div
                                                            className="passenger-card-number"
                                                        >
                                                            {
                                                                String(
                                                                    index +
                                                                    1
                                                                ).padStart(
                                                                    2,
                                                                    "0"
                                                                )
                                                            }
                                                        </div>


                                                        <div>

                                                            <strong>
                                                                Passenger
                                                                {" "}
                                                                {
                                                                    index +
                                                                    1
                                                                }
                                                            </strong>


                                                            <span>
                                                                {" "}
                                                                —{" "}
                                                                {
                                                                    index ===
                                                                    0
                                                                        ? "Account Owner"
                                                                        : "Friend"
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>

                                                </div>


                                                {/* PASSENGER FIELDS */}

                                                <div
                                                    className="passenger-fields"
                                                >


                                                    {/* FULL NAME */}

                                                    <div
                                                        className="form-group"
                                                    >

                                                        <label
                                                            htmlFor={
                                                                `passenger-name-${index}`
                                                            }
                                                        >
                                                            Full Name
                                                        </label>


                                                        <input
                                                            id={
                                                                `passenger-name-${index}`
                                                            }
                                                            type="text"
                                                            className="passenger-input"
                                                            placeholder={
                                                                index === 0 && accountOwnerName
                                                                    ? "Registered account name"
                                                                    : "Enter passenger full name"
                                                            }
                                                            value={
                                                                passenger.name
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updatePassenger(
                                                                    index,
                                                                    "name",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            readOnly={
                                                                index === 0 && !!accountOwnerName
                                                            }
                                                            title={
                                                                index === 0 && accountOwnerName
                                                                    ? "Passenger 1 uses the name from your registered account."
                                                                    : undefined
                                                            }
                                                            autoComplete="name"
                                                        />

                                                    </div>


                                                    {/* AGE */}

                                                    <div
                                                        className="form-group"
                                                    >

                                                        <label
                                                            htmlFor={
                                                                `passenger-age-${index}`
                                                            }
                                                        >
                                                            Age
                                                        </label>


                                                        <input
                                                            id={
                                                                `passenger-age-${index}`
                                                            }
                                                            type="number"
                                                            className="passenger-input"
                                                            placeholder="Age"
                                                            min="1"
                                                            max="120"
                                                            value={
                                                                passenger.age
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updatePassenger(
                                                                    index,
                                                                    "age",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />

                                                    </div>


                                                    {/* GENDER */}

                                                    <div
                                                        className="form-group"
                                                    >

                                                        <label
                                                            htmlFor={
                                                                `passenger-gender-${index}`
                                                            }
                                                        >
                                                            Gender
                                                        </label>


                                                        <select
                                                            id={
                                                                `passenger-gender-${index}`
                                                            }
                                                            className="passenger-input"
                                                            value={
                                                                passenger.gender
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updatePassenger(
                                                                    index,
                                                                    "gender",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        >

                                                            <option
                                                                value=""
                                                            >
                                                                Select gender
                                                            </option>


                                                            <option
                                                                value="Male"
                                                            >
                                                                Male
                                                            </option>


                                                            <option
                                                                value="Female"
                                                            >
                                                                Female
                                                            </option>


                                                            <option
                                                                value="Prefer not to say"
                                                            >
                                                                Prefer not to say
                                                            </option>

                                                        </select>

                                                    </div>

                                                </div>

                                            </div>

                                        )
                                    )
                                }

                            </div>


                            {/* =================================================
                                NUMBER OF PASSENGERS
                            ================================================= */}

                            <div
                                className="form-group"
                            >

                                <label>
                                    Number of Passengers
                                </label>


                                <div
                                    className="passenger-counter"
                                >

                                    {/* MINUS */}

                                    <button
                                        type="button"
                                        onClick={
                                            handlePassengerDecrease
                                        }
                                        disabled={
                                            passengers <=
                                            MIN_PASSENGERS
                                        }
                                        aria-label="Decrease passengers"
                                    >
                                        −
                                    </button>


                                    {/* VALUE */}

                                    <div
                                        className="passenger-value"
                                    >

                                        <strong>
                                            {
                                                passengers
                                            }
                                        </strong>


                                        <span>
                                            {
                                                passengers ===
                                                1
                                                    ? "Passenger"
                                                    : "Passengers"
                                            }
                                        </span>

                                    </div>


                                    {/* PLUS */}

                                    <button
                                        type="button"
                                        onClick={
                                            handlePassengerIncrease
                                        }
                                        disabled={
                                            passengers >=
                                            MAX_PASSENGERS
                                        }
                                        aria-label="Increase passengers"
                                    >
                                        +
                                    </button>

                                </div>


                                <div className="passenger-max-row">
                                    <button
                                        type="button"
                                        className="passenger-max-button"
                                        onClick={
                                            handlePassengerMax
                                        }
                                        disabled={
                                            passengers >=
                                            MAX_PASSENGERS
                                        }
                                    >
                                        Max {MAX_PASSENGERS}
                                    </button>
                                </div>


                                <div
                                    className="passenger-limit"
                                >

                                    <span
                                        className="passenger-help"
                                    >

                                        {vehicleChoice ===
                                            "noMotorcycle"
                                            ? "Add personal details for yourself and every friend."
                                            : "Add personal details for every passenger."}

                                    </span>


                                    <span
                                        className="passenger-limit-text"
                                    >

                                        {vehicleChoice ===
                                            "noMotorcycle"
                                            ? "Maximum 10 passengers • Owner + 9 friends"
                                            : "Maximum 3 passengers with motorcycle"}

                                    </span>

                                </div>

                            </div>

                        </section>


                        {/* =================================================
                            BOOKING NOTE
                        ================================================= */}

                        <div
                            className="booking-note"
                        >

                            <div
                                className="note-icon"
                            >
                                !
                            </div>


                            <div>

                                <strong>
                                    Before continuing
                                </strong>


                                <p>

                                    Please make sure that
                                    your selected ferry,
                                    passenger information,
                                    travel schedule, and
                                    vehicle details are correct.

                                </p>

                            </div>

                        </div>


                        {/* =================================================
                            CONTINUE
                        ================================================= */}

                        <button
                            type="submit"
                            className="continue-button"
                        >

                            Continue to Payment


                            <span
                                className="button-arrow"
                            >
                                →
                            </span>

                        </button>

                    </form>

                </div>

            </main>

        </>
    );
};


export default BookTrip;