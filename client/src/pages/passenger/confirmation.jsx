import React, {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import jsPDF from "jspdf";


const Confirmation = () => {

    const navigate =
        useNavigate();


    const [booking, setBooking] =
        useState(null);


    /*
     * =========================================================
     * LOAD BOOKING
     * =========================================================
     */

    useEffect(() => {

        loadBooking();

    }, []);


    /*
     * =========================================================
     * LOAD AND NORMALIZE BOOKING
     * =========================================================
     */

    const loadBooking = () => {

        try {

            const savedBooking =
                sessionStorage.getItem(
                    "confirmedBooking"
                );


            if (!savedBooking) {

                setBooking(null);

                return;
            }


            const savedBookingData =
                JSON.parse(
                    savedBooking
                );


            // =================================================
            // RECOVER SELECTED FERRY / VESSEL
            // =================================================
            // Older booking records may not contain the vessel
            // fields even though the selected ferry was saved
            // during the booking process. Use the saved ferry
            // session data only as a safe fallback.
            // =================================================

            let savedSelectedFerry = null;

            try {
                const selectedFerry =
                    sessionStorage.getItem(
                        "selectedFerry"
                    );

                if (selectedFerry) {
                    savedSelectedFerry =
                        JSON.parse(selectedFerry);
                }
            } catch (ferryError) {
                console.error(
                    "Unable to recover selected ferry:",
                    ferryError
                );
            }


            let savedTripDetails = null;

            try {
                const tripDetails =
                    sessionStorage.getItem(
                        "tripDetails"
                    );

                if (tripDetails) {
                    savedTripDetails =
                        JSON.parse(tripDetails);
                }
            } catch (tripError) {
                console.error(
                    "Unable to recover trip details:",
                    tripError
                );
            }


            /*
             * =================================================
             * NORMALIZED BOOKING
             * =================================================
             */

            const normalizedBooking = {

                ...savedBookingData,


                /*
                 * BOOKING REFERENCE
                 */

                bookingReference:
                    savedBookingData.bookingReference ||
                    savedBookingData.reference ||
                    "GG-BOOKING",


                /*
                 * ROUTE
                 */

                origin:
                    savedBookingData.origin ||
                    savedBookingData.from ||
                    "Iloilo",


                destination:
                    savedBookingData.destination ||
                    savedBookingData.to ||
                    "Guimaras",

                /*
                 * =================================================
                 * FERRY / VESSEL
                 * =================================================
                 */

                ferryId:
                    savedBookingData.ferryId ||
                    savedBookingData.selectedFerry?.id ||
                    savedBookingData.selectedTrip?.id ||
                    savedSelectedFerry?.ferryId ||
                    savedSelectedFerry?.id ||
                    savedTripDetails?.ferryId ||
                    "",

                ferryName:
                    savedBookingData.ferryName ||
                    savedBookingData.vesselName ||
                    savedBookingData.vessel ||
                    savedBookingData.ferry ||
                    savedBookingData.selectedFerry?.ferryName ||
                    savedBookingData.selectedFerry?.vesselName ||
                    savedBookingData.selectedTrip?.ferryName ||
                    savedBookingData.selectedTrip?.vesselName ||
                    savedSelectedFerry?.ferryName ||
                    savedSelectedFerry?.vesselName ||
                    savedTripDetails?.ferryName ||
                    savedTripDetails?.vesselName ||
                    "",

                vesselName:
                    savedBookingData.vesselName ||
                    savedBookingData.ferryName ||
                    savedBookingData.vessel ||
                    savedBookingData.ferry ||
                    savedBookingData.selectedFerry?.vesselName ||
                    savedBookingData.selectedFerry?.ferryName ||
                    savedBookingData.selectedTrip?.vesselName ||
                    savedBookingData.selectedTrip?.ferryName ||
                    savedSelectedFerry?.vesselName ||
                    savedSelectedFerry?.ferryName ||
                    savedTripDetails?.vesselName ||
                    savedTripDetails?.ferryName ||
                    "",


                /*
                 * DATE / TIME
                 */

                date:
                    savedBookingData.date ||
                    "N/A",


                time:
                    savedBookingData.time ||
                    savedBookingData.departureTime ||
                    "N/A",

                departureTime:
                    savedBookingData.departureTime ||
                    savedBookingData.time ||
                    "N/A",


                /*
                 * =================================================
                 * PASSENGER INFORMATION
                 * =================================================
                 */

                passengerName:
                    savedBookingData.passengerName ||
                    savedBookingData.name ||
                    "Guest Passenger",


                passengerAge:
                    savedBookingData.passengerAge ||
                    savedBookingData.age ||
                    "",


                passengerGender:
                    savedBookingData.passengerGender ||
                    savedBookingData.gender ||
                    "",


                passengers:
                    Number(
                        savedBookingData.passengers ||
                        savedBookingData.numberOfPassengers ||
                        1
                    ),


                /*
                 * =================================================
                 * VEHICLE
                 * =================================================
                 */

                vehicleType:
                    savedBookingData.vehicleType ||
                    savedBookingData.vehicle ||
                    savedBookingData.vehicleDetails?.type ||
                    "Motorcycle",


                /*
                 * =================================================
                 * PLATE NUMBER
                 * =================================================
                 */

                plateNumber:
                    savedBookingData.plateNumber ||
                    savedBookingData.plate_number ||
                    savedBookingData.plate ||
                    savedBookingData.motorcyclePlateNumber ||
                    savedBookingData.vehiclePlateNumber ||
                    savedBookingData.vehicleDetails?.plateNumber ||
                    savedBookingData.vehicleDetails?.plate ||
                    savedBookingData.motorcycle?.plateNumber ||
                    "N/A",


                /*
                 * STATUS
                 */

                status:
                    savedBookingData.status ||
                    "CONFIRMED",


                /*
                 * FARES
                 */

                passengerFare:
                    savedBookingData.passengerFare,

                motorcycleFare:
                    savedBookingData.motorcycleFare,

                ppaFee:
                    savedBookingData.ppaFee,

                totalFare:
                    savedBookingData.totalFare ||
                    savedBookingData.totalPaid ||
                    0

            };


            /*
             * SAVE TO STATE
             */

            setBooking(
                normalizedBooking
            );


            /*
             * =================================================
             * IMPORTANT
             * =================================================
             *
             * Make sure the booking exists in history.
             */

            saveBookingToHistory(
                normalizedBooking
            );


            /*
             * Save the normalized booking.
             */

            sessionStorage.setItem(
                "confirmedBooking",
                JSON.stringify(
                    normalizedBooking
                )
            );

        } catch (error) {

            console.error(
                "Error loading confirmation:",
                error
            );

            setBooking(null);
        }
    };


    /*
     * =========================================================
     * SAVE BOOKING TO HISTORY
     * =========================================================
     */

    const saveBookingToHistory = (
        currentBooking
    ) => {

        try {

            if (!currentBooking) {
                return;
            }


            let allBookings = [];


            const savedAllBookings =
                sessionStorage.getItem(
                    "allBookings"
                );


            if (savedAllBookings) {

                try {

                    const parsed =
                        JSON.parse(
                            savedAllBookings
                        );


                    if (Array.isArray(parsed)) {

                        allBookings =
                            parsed;
                    }

                } catch (error) {

                    console.error(
                        "Unable to parse booking history:",
                        error
                    );

                    allBookings = [];
                }
            }


            /*
             * =================================================
             * FIND BOOKING
             * =================================================
             */

            const existingIndex =
                allBookings.findIndex(
                    (item) =>
                        item.bookingReference ===
                        currentBooking.bookingReference
                );


            /*
             * =================================================
             * ADD OR UPDATE
             * =================================================
             */

            if (existingIndex === -1) {

                /*
                 * NEW BOOKING
                 */

                allBookings.push(
                    currentBooking
                );

            } else {

                /*
                 * UPDATE EXISTING BOOKING
                 */

                allBookings[
                    existingIndex
                ] = {

                    ...allBookings[
                        existingIndex
                    ],

                    ...currentBooking
                };
            }


            /*
             * =================================================
             * SAVE ALL BOOKINGS
             * =================================================
             */

            sessionStorage.setItem(
                "allBookings",
                JSON.stringify(
                    allBookings
                )
            );


            /*
             * =================================================
             * RECENT BOOKINGS
             * =================================================
             *
             * Newest booking appears first.
             *
             * Dashboard uses the newest 3.
             */

            const recentBookings =
                [...allBookings]
                    .reverse()
                    .slice(0, 3);


            sessionStorage.setItem(
                "recentBookings",
                JSON.stringify(
                    recentBookings
                )
            );


            /*
             * Keep confirmedBooking updated.
             */

            sessionStorage.setItem(
                "confirmedBooking",
                JSON.stringify(
                    currentBooking
                )
            );

        } catch (error) {

            console.error(
                "Error saving booking history:",
                error
            );
        }
    };


    /*
     * =========================================================
     * FORMAT TIME
     * =========================================================
     */

    const formatTime = (
        time
    ) => {

        if (!time) {
            return "N/A";
        }


        const stringTime =
            String(time);


        if (
            stringTime
                .toUpperCase()
                .includes("AM") ||
            stringTime
                .toUpperCase()
                .includes("PM")
        ) {

            return stringTime;
        }


        const parts =
            stringTime.split(":");


        if (parts.length < 2) {

            return stringTime;
        }


        const hours =
            Number(parts[0]);


        const minutes =
            parts[1];


        if (
            Number.isNaN(
                hours
            )
        ) {

            return stringTime;
        }


        const suffix =
            hours >= 12
                ? "PM"
                : "AM";


        const displayHour =
            hours % 12 || 12;


        return `${displayHour}:${minutes} ${suffix}`;
    };


    /*
     * =========================================================
     * FORMAT DATE
     * =========================================================
     */

    const formatDate = (
        date
    ) => {

        if (
            !date ||
            date === "N/A"
        ) {

            return "N/A";
        }


        try {

            return new Date(
                `${date}T00:00:00`
            ).toLocaleDateString(
                "en-US",
                {
                    year:
                        "numeric",

                    month:
                        "long",

                    day:
                        "numeric"
                }
            );

        } catch (error) {

            return date;
        }
    };


    /*
     * =========================================================
     * CALCULATE FARES
     * =========================================================
     */

    const passengers =
        Number(
            booking?.passengers ||
            1
        );


    const passengerRate =
        40;


    const vehicleTypeForFare =
        booking?.vehicleType ||
        booking?.vehicle ||
        booking?.vehicleDetails?.type ||
        "No Motorcycle";

    const vehicleTypeForFareValue =
        String(
            vehicleTypeForFare
        )
            .trim()
            .toLowerCase();

    const isNoMotorcycleForFare =
        vehicleTypeForFareValue === "no motorcycle" ||
        vehicleTypeForFareValue === "nomotorcycle" ||
        vehicleTypeForFareValue === "no vehicle" ||
        vehicleTypeForFareValue === "none" ||
        vehicleTypeForFareValue === "passenger only" ||
        vehicleTypeForFareValue === "passenger-only" ||
        vehicleTypeForFareValue === "passenger" ||
        vehicleTypeForFareValue === "";

    const isMotorcycleForFare =
        !isNoMotorcycleForFare &&
        (
            vehicleTypeForFareValue === "motorcycle" ||
            vehicleTypeForFareValue.includes("motorcycle")
        );

    const motorcycleFare =
        Number(
            booking?.motorcycleFare ??
            (isMotorcycleForFare ? 150 : 0)
        );


    const ppaFee =
        Number(
            booking?.ppaFee ||
            65
        );


    const passengerFare =
        Number(
            booking?.passengerFare ??
            passengers *
            passengerRate
        );


    const savedTotalFare =
        Number(
            booking?.totalFare ??
            booking?.totalPaid ??
            0
        );

    const totalPaid =
        savedTotalFare > 0
            ? savedTotalFare
            : (
                passengerFare +
                motorcycleFare +
                ppaFee
            );


    /*
     * =========================================================
     * VEHICLE / PLATE
     * =========================================================
     */

    const vehicleType =
        booking?.vehicleType ||
        booking?.vehicle ||
        booking?.vehicleDetails?.type ||
        "Motorcycle";


    const plateNumber =
        booking?.plateNumber ||
        booking?.plate_number ||
        booking?.plate ||
        booking?.motorcyclePlateNumber ||
        booking?.vehiclePlateNumber ||
        booking?.vehicleDetails?.plateNumber ||
        booking?.vehicleDetails?.plate ||
        booking?.motorcycle?.plateNumber ||
        "N/A";


    /*
     * =========================================================
     * QR CODE DATA
     * =========================================================
     *
     * IMPORTANT:
     *
     * This now uses the REAL passenger name instead of
     * "Guest Passenger".
     */

    const qrData = booking
        ? `
GUIMARASGO BOARDING PASS

Booking Reference:
${booking.bookingReference}

Passenger:
${booking.passengerName || "N/A"}

Age:
${booking.passengerAge || "N/A"}

Gender:
${booking.passengerGender || "N/A"}

Passengers:
${passengers}

Route:
${booking.origin} Port to ${booking.destination} Port

Date:
${formatDate(booking.date)}

Departure:
${formatTime(booking.time)}

Vehicle:
${vehicleType}

Plate Number:
${plateNumber}

Status:
${booking.status || "CONFIRMED"}
        `.trim()
        : "";


    /*
     * =========================================================
     * QR CODE URL
     * =========================================================
     */

    const qrCodeUrl =
        booking
            ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                qrData
            )}`
            : "";


    /*
     * =========================================================
     * BACK TO DASHBOARD
     * =========================================================
     */

    const handleDashboard = () => {

        if (booking) {

            /*
             * Save before navigating.
             */

            saveBookingToHistory(
                booking
            );
        }


        /*
         * replace prevents the confirmation page
         * from appearing again unnecessarily.
         */

        navigate(
            "/dashboard",
            {
                replace: true
            }
        );
    };


    /*
     * =========================================================
     * VIEW BOOKING
     * =========================================================
     */

    const handleViewBooking = () => {

        if (booking) {

            saveBookingToHistory(
                booking
            );


            sessionStorage.setItem(
                "confirmedBooking",
                JSON.stringify(
                    booking
                )
            );
        }


        navigate(
            "/bookings"
        );
    };


    /*
     * =========================================================
     * LOAD IMAGE FOR PDF
     * =========================================================
     */

    const loadImage = (
        url
    ) => {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const image =
                    new Image();


                image.crossOrigin =
                    "Anonymous";


                image.onload =
                    () => resolve(
                        image
                    );


                image.onerror =
                    () => reject(
                        new Error(
                            "Unable to load image"
                        )
                    );


                image.src =
                    url;
            }
        );
    };


    /*
     * =========================================================
     * DOWNLOAD TICKET AS PDF
     * =========================================================
     */

    const handleDownloadTicket =
        async () => {

        if (!booking) {

            alert(
                "Booking information is not available."
            );

            return;
        }


        /*
         * Save booking first.
         */

        saveBookingToHistory(
            booking
        );


        try {

            const pdf =
                new jsPDF({
                    orientation:
                        "portrait",

                    unit:
                        "mm",

                    format:
                        "a4"
                });


            const pageWidth =
                pdf.internal.pageSize
                    .getWidth();


            const margin =
                15;


            /*
             * =================================================
             * HEADER
             * =================================================
             */

            pdf.setFillColor(
                255,
                120,
                24
            );


            pdf.rect(
                0,
                0,
                pageWidth,
                30,
                "F"
            );


            pdf.setTextColor(
                255,
                255,
                255
            );


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.setFontSize(
                22
            );


            pdf.text(
                "GuimarasGo",
                margin,
                14
            );


            pdf.setFontSize(
                9
            );


            pdf.setFont(
                "helvetica",
                "normal"
            );


            pdf.text(
                "Travel Smarter Across Guimaras",
                margin,
                22
            );


            /*
             * =================================================
             * TITLE
             * =================================================
             */

            pdf.setTextColor(
                25,
                25,
                25
            );


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.setFontSize(
                18
            );


            pdf.text(
                "BOOKING CONFIRMATION",
                margin,
                43
            );


            /*
             * =================================================
             * STATUS
             * =================================================
             */

            pdf.setFillColor(
                233,
                248,
                239
            );


            pdf.roundedRect(
                pageWidth - 58,
                35,
                43,
                12,
                3,
                3,
                "F"
            );


            pdf.setTextColor(
                22,
                139,
                69
            );


            pdf.setFontSize(
                8
            );


            pdf.text(
                "CONFIRMED",
                pageWidth - 51,
                42.5
            );


            /*
             * =================================================
             * BOOKING REFERENCE
             * =================================================
             */

            pdf.setTextColor(
                120,
                120,
                120
            );


            pdf.setFontSize(
                8
            );


            pdf.text(
                "BOOKING REFERENCE",
                margin,
                55
            );


            pdf.setTextColor(
                25,
                25,
                25
            );


            pdf.setFontSize(
                14
            );


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.text(
                String(
                    booking.bookingReference
                ),
                margin,
                64
            );


            /*
             * =================================================
             * ROUTE
             * =================================================
             */

            pdf.setFontSize(
                12
            );


            pdf.text(
                `${booking.origin} → ${booking.destination}`,
                margin,
                78
            );


            pdf.setFont(
                "helvetica",
                "normal"
            );


            pdf.setFontSize(
                9
            );


            pdf.setTextColor(
                100,
                100,
                100
            );


            pdf.text(
                "Port",
                margin,
                84
            );


            pdf.text(
                "Port",
                pageWidth - margin - 20,
                84
            );


            /*
             * =================================================
             * PASSENGER DETAILS
             * =================================================
             */

            let detailsY =
                100;


            pdf.setTextColor(
                25,
                25,
                25
            );


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.setFontSize(
                12
            );


            pdf.text(
                "Passenger Details",
                margin,
                detailsY
            );


            detailsY += 10;


            pdf.setFont(
                "helvetica",
                "normal"
            );


            pdf.setFontSize(
                10
            );


            pdf.text(
                `Full Name: ${
                    booking.passengerName ||
                    "N/A"
                }`,
                margin,
                detailsY
            );


            detailsY += 8;


            pdf.text(
                `Age: ${
                    booking.passengerAge ||
                    "N/A"
                }`,
                margin,
                detailsY
            );


            detailsY += 8;


            pdf.text(
                `Gender: ${
                    booking.passengerGender ||
                    "N/A"
                }`,
                margin,
                detailsY
            );


            detailsY += 8;


            pdf.text(
                `Number of Passengers: ${
                    passengers
                }`,
                margin,
                detailsY
            );


            /*
             * =================================================
             * TRIP DETAILS
             * =================================================
             */

            detailsY += 15;


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.setFontSize(
                12
            );


            pdf.text(
                "Trip Details",
                margin,
                detailsY
            );


            detailsY += 10;


            pdf.setFont(
                "helvetica",
                "normal"
            );


            pdf.setFontSize(
                10
            );


            pdf.text(
                `Travel Date: ${
                    formatDate(
                        booking.date
                    )
                }`,
                margin,
                detailsY
            );


            detailsY += 8;


            pdf.text(
                `Departure: ${
                    formatTime(
                        booking.time
                    )
                }`,
                margin,
                detailsY
            );


            detailsY += 8;


            pdf.text(
                `Ferry / Vessel: ${
                    booking.vesselName ||
                    booking.ferryName ||
                    booking.vessel ||
                    booking.ferry ||
                    booking.selectedFerry?.vesselName ||
                    booking.selectedFerry?.ferryName ||
                    booking.selectedTrip?.vesselName ||
                    booking.selectedTrip?.ferryName ||
                    "N/A"
                }`,
                margin,
                detailsY
            );


            detailsY += 8;


            pdf.text(
                `Vehicle: ${
                    vehicleType
                }`,
                margin,
                detailsY
            );


            detailsY += 8;


            pdf.text(
                `Plate Number: ${
                    plateNumber
                }`,
                margin,
                detailsY
            );


            /*
             * =================================================
             * FARE SUMMARY
             * =================================================
             */

            const fareY =
                195;


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.setFontSize(
                12
            );


            pdf.setTextColor(
                25,
                25,
                25
            );


            pdf.text(
                "Fare Summary",
                margin,
                fareY
            );


            pdf.setFont(
                "helvetica",
                "normal"
            );


            pdf.setFontSize(
                10
            );


            pdf.setTextColor(
                90,
                90,
                90
            );


            pdf.text(
                "Passenger Fare",
                margin,
                fareY + 12
            );


            pdf.text(
                `PHP ${
                    passengerFare.toFixed(
                        2
                    )
                }`,
                pageWidth - margin,
                fareY + 12,
                {
                    align:
                        "right"
                }
            );


            pdf.text(
                "Motorcycle",
                margin,
                fareY + 20
            );


            pdf.text(
                `PHP ${
                    motorcycleFare.toFixed(
                        2
                    )
                }`,
                pageWidth - margin,
                fareY + 20,
                {
                    align:
                        "right"
                }
            );


            pdf.text(
                "PPA Fee",
                margin,
                fareY + 28
            );


            pdf.text(
                `PHP ${
                    ppaFee.toFixed(
                        2
                    )
                }`,
                pageWidth - margin,
                fareY + 28,
                {
                    align:
                        "right"
                }
            );


            pdf.setDrawColor(
                220,
                220,
                220
            );


            pdf.line(
                margin,
                fareY + 37,
                pageWidth - margin,
                fareY + 37
            );


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.setFontSize(
                13
            );


            pdf.setTextColor(
                25,
                25,
                25
            );


            pdf.text(
                "TOTAL PAID",
                margin,
                fareY + 48
            );


            pdf.setTextColor(
                255,
                120,
                24
            );


            pdf.text(
                `PHP ${
                    totalPaid.toFixed(
                        2
                    )
                }`,
                pageWidth - margin,
                fareY + 48,
                {
                    align:
                        "right"
                }
            );


            /*
             * =================================================
             * QR CODE
             * =================================================
             */

            let qrImageLoaded =
                false;


            if (qrCodeUrl) {

                try {

                    const qrImage =
                        await loadImage(
                            qrCodeUrl
                        );


                    pdf.addImage(
                        qrImage,
                        "PNG",
                        margin,
                        260,
                        55,
                        55
                    );


                    qrImageLoaded =
                        true;

                } catch (qrError) {

                    console.error(
                        "QR image could not be loaded:",
                        qrError
                    );
                }
            }


            /*
             * =================================================
             * BOARDING INFORMATION
             * =================================================
             */

            const instructionsX =
                qrImageLoaded
                    ? margin + 70
                    : margin;


            const instructionsY =
                270;


            pdf.setFont(
                "helvetica",
                "bold"
            );


            pdf.setFontSize(
                12
            );


            pdf.setTextColor(
                25,
                25,
                25
            );


            pdf.text(
                "Boarding Information",
                instructionsX,
                instructionsY
            );


            pdf.setFont(
                "helvetica",
                "normal"
            );


            pdf.setFontSize(
                9
            );


            pdf.setTextColor(
                90,
                90,
                90
            );


            const instructions =
                pdf.splitTextToSize(
                    "Present this QR code at boarding. " +
                    "Please arrive at the port at least " +
                    "30 minutes before your scheduled departure.",
                    105
                );


            pdf.text(
                instructions,
                instructionsX,
                instructionsY + 10
            );


            /*
             * =================================================
             * FOOTER
             * =================================================
             */

            pdf.setDrawColor(
                230,
                230,
                230
            );


            pdf.line(
                margin,
                325,
                pageWidth - margin,
                325
            );


            pdf.setTextColor(
                140,
                140,
                140
            );


            pdf.setFont(
                "helvetica",
                "normal"
            );


            pdf.setFontSize(
                8
            );


            pdf.text(
                "GuimarasGo • Safe travels and enjoy Guimaras!",
                pageWidth / 2,
                334,
                {
                    align:
                        "center"
                }
            );


            /*
             * =================================================
             * SAVE PDF
             * =================================================
             */

            const reference =
                String(
                    booking.bookingReference ||
                    "booking"
                )
                    .replace(
                        /[^a-zA-Z0-9-_]/g,
                        "-"
                    );


            pdf.save(
                `GuimarasGo-Ticket-${reference}.pdf`
            );

        } catch (error) {

            console.error(
                "PDF download error:",
                error
            );


            alert(
                "Unable to generate the PDF ticket. Please try again."
            );
        }
    };


    /*
     * =========================================================
     * BOOKING NOT FOUND
     * =========================================================
     */

    if (!booking) {

        return (

            <>

                <style>{`

                    * {
                        box-sizing: border-box;
                    }


                    .booking-not-found-page {

                        min-height:
                            100vh;

                        min-height:
                            100dvh;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        padding:
                            20px;

                        background:
                            linear-gradient(
                                180deg,
                                #fff8f2 0%,
                                #f5f6f8 100%
                            );

                        font-family:
                            Inter,
                            -apple-system,
                            BlinkMacSystemFont,
                            "Segoe UI",
                            Arial,
                            sans-serif;
                    }


                    .booking-not-found-card {

                        width:
                            100%;

                        max-width:
                            430px;

                        padding:
                            35px
                            25px;

                        text-align:
                            center;

                        background:
                            #ffffff;

                        border:
                            1px solid
                            #eeeeee;

                        border-radius:
                            20px;

                        box-shadow:
                            0 15px 45px
                            rgba(
                                0,
                                0,
                                0,
                                0.08
                            );
                    }


                    .not-found-icon {

                        width:
                            64px;

                        height:
                            64px;

                        margin:
                            0
                            auto
                            18px;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        border-radius:
                            50%;

                        background:
                            #fff1e6;

                        color:
                            #ff7818;

                        font-size:
                            28px;

                        font-weight:
                            800;
                    }


                    .booking-not-found-card h2 {

                        margin:
                            0
                            0
                            10px;

                        color:
                            #222222;
                    }


                    .booking-not-found-card p {

                        margin:
                            0
                            0
                            20px;

                        color:
                            #777777;

                        font-size:
                            13px;
                    }


                    .not-found-button {

                        width:
                            100%;

                        height:
                            48px;

                        border:
                            none;

                        border-radius:
                            10px;

                        background:
                            #ff8c1a;

                        color:
                            white;

                        font-weight:
                            700;

                        cursor:
                            pointer;
                    }

                `}</style>


                <main className="booking-not-found-page">

                    <div className="booking-not-found-card">

                        <div className="not-found-icon">
                            !
                        </div>


                        <h2>
                            Booking Not Found
                        </h2>


                        <p>
                            We could not find the
                            booking confirmation.
                        </p>


                        <button
                            type="button"
                            className="not-found-button"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >
                            Back to Dashboard
                        </button>

                    </div>

                </main>

            </>
        );
    }


    return (

        <main className="confirmation-page">

            <div className="confirmation-container">


                {/* =================================================
                    HEADER
                ================================================= */}

                <header
                    className="confirmation-header"
                >

                    <button
                        type="button"
                        className="confirmation-back"
                        onClick={
                            handleDashboard
                        }
                        aria-label="Back to dashboard"
                    >
                        ←
                    </button>


                    <strong>
                        Booking Confirmation
                    </strong>


                    <div
                        className="confirmation-menu"
                    >
                        ⋮
                    </div>

                </header>


                {/* =================================================
                    SUCCESS
                ================================================= */}

                <section
                    className="confirmation-success"
                >

                    <div className="success-icon">
                        ✓
                    </div>


                    <h1>
                        Booking Submitted!
                    </h1>


                    <p>
                        Your GuimarasGo trip has been
                        successfully submitted please wait for confirmation!
                    </p>

                </section>


                {/* =================================================
                    MAIN BOOKING CARD
                ================================================= */}

                <section
                    className="booking-card"
                >


                    {/* CARD HEADER */}

                    <div
                        className="booking-card-header"
                    >

                        <div>

                            <span
                                className="company-name"
                            >
                                GuimarasGo
                            </span>


                            <small>
                                GuimarasGo Ferry Trip
                            </small>

                        </div>


                        <div
                            className="confirmed-badge"
                        >
                            CONFIRMED
                        </div>

                    </div>


                    {/* BOOKING REFERENCE */}

                    <div
                        className="booking-reference"
                    >

                        <small>
                            BOOKING REFERENCE
                        </small>


                        <strong>
                            {
                                booking.bookingReference
                            }
                        </strong>

                    </div>


                    {/* ROUTE */}

                    <div
                        className="route-box"
                    >

                        <div
                            className="route-from"
                        >

                            <strong>
                                {booking.origin}
                            </strong>

                            <small>
                                Port
                            </small>

                        </div>


                        <div
                            className="route-icon"
                        >
                            →
                        </div>


                        <div
                            className="route-to"
                        >

                            <strong>
                                {booking.destination}
                            </strong>

                            <small>
                                Port
                            </small>

                        </div>

                    </div>


                    {/* PASSENGER DETAILS */}

                    <div
                        className="details-grid"
                    >

                        <div
                            className="info-box"
                        >

                            <small>
                                Passenger
                            </small>

                            <strong>
                                {
                                    booking.passengerName ||
                                    "Guest Passenger"
                                }
                            </strong>

                        </div>


                        <div
                            className="info-box"
                        >

                            <small>
                                Passengers
                            </small>

                            <strong>
                                {passengers}
                            </strong>

                        </div>


                        <div
                            className="info-box"
                        >

                            <small>
                                Age
                            </small>

                            <strong>
                                {
                                    booking.passengerAge ||
                                    "N/A"
                                }
                            </strong>

                        </div>


                        <div
                            className="info-box"
                        >

                            <small>
                                Gender
                            </small>

                            <strong>
                                {
                                    booking.passengerGender ||
                                    "N/A"
                                }
                            </strong>

                        </div>


                        <div
                            className="info-box"
                        >

                            <small>
                                Ferry / Vessel
                            </small>

                            <strong>
                                {booking.vesselName ||
                                    booking.ferryName ||
                                    booking.vessel ||
                                    booking.ferry ||
                                    booking.selectedFerry?.vesselName ||
                                    booking.selectedFerry?.ferryName ||
                                    booking.selectedTrip?.vesselName ||
                                    booking.selectedTrip?.ferryName ||
                                    "N/A"}
                            </strong>

                        </div>


                        <div
                            className="info-box"
                        >

                            <small>
                                Travel Date
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
                            className="info-box"
                        >

                            <small>
                                Departure
                            </small>

                            <strong>
                                {
                                    formatTime(
                                        booking.time
                                    )
                                }
                            </strong>

                        </div>

                    </div>


                    {/* VEHICLE */}

                    <div
                        className="vehicle-box"
                    >

                        <div>

                            <small>
                                Vehicle Details
                            </small>

                            <strong>
                                {
                                    vehicleType
                                }
                            </strong>

                        </div>


                        <div>

                            <small>
                                Plate Number
                            </small>

                            <strong>
                                {
                                    plateNumber
                                }
                            </strong>

                        </div>

                    </div>


                    {/* QR */}

                    <div
                        className="boarding-pass"
                    >

                        <div>

                            <h2>
                                Boarding Pass
                            </h2>


                            <p
                                className="boarding-pass-subtitle"
                            >
                                Present this QR code
                                at boarding
                            </p>

                        </div>


                        <div
                            className="boarding-qr"
                        >

                            <img
                                src={qrCodeUrl}
                                alt="GuimarasGo Boarding Pass QR Code"
                            />

                        </div>


                        <p>
                            Show this QR code
                            at boarding
                        </p>


                        <div
                            className="boarding-reminder"
                        >

                            <strong>
                                🕐 Boarding Reminder
                            </strong>


                            <p>
                                Please arrive at
                                the port at least
                                30 minutes before
                                departure.
                            </p>

                        </div>


                        <div
                            className="confirmation-message"
                        >

                            <span
                                className="email-icon"
                            >
                                ✉
                            </span>


                            <span>
                                A confirmation has
                                been sent to your
                                email.
                            </span>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    FARE SUMMARY
                ================================================= */}

                <section
                    className="confirmation-fare"
                >

                    <h2>
                        Fare Summary
                    </h2>


                    <div
                        className="fare-row"
                    >

                        <span>
                            Passenger Fare (
                            {passengers}
                            {" passenger"}
                            {passengers > 1
                                ? "s"
                                : ""}
                            )
                        </span>


                        <strong>
                            ₱
                            {
                                passengerFare.toFixed(
                                    2
                                )
                            }
                        </strong>

                    </div>


                    <div
                        className="fare-row"
                    >

                        <span>
                            Motorcycle
                        </span>


                        <strong>
                            ₱
                            {
                                motorcycleFare.toFixed(
                                    2
                                )
                            }
                        </strong>

                    </div>


                    <div
                        className="fare-row"
                    >

                        <span>
                            PPA Fee
                        </span>


                        <strong>
                            ₱
                            {
                                ppaFee.toFixed(
                                    2
                                )
                            }
                        </strong>

                    </div>


                    <div
                        className="fare-divider"
                    />


                    <div
                        className="fare-total"
                    >

                        <strong>
                            Total Paid
                        </strong>


                        <strong>
                            ₱
                            {
                                totalPaid.toFixed(
                                    2
                                )
                            }
                        </strong>

                    </div>

                </section>


                {/* =================================================
                    ACTION BUTTONS
                ================================================= */}

                <div
                    className="confirmation-actions"
                >

                    <button
                        type="button"
                        className="action-button download-ticket"
                        onClick={
                            handleDownloadTicket
                        }
                    >
                        ↓ Download Ticket
                    </button>


                    <button
                        type="button"
                        className="action-button view-booking"
                        onClick={
                            handleViewBooking
                        }
                    >
                        ◉ View Booking
                    </button>

                </div>


                {/* =================================================
                    BACK TO DASHBOARD
                ================================================= */}

                <button
                    type="button"
                    className="back-dashboard"
                    onClick={
                        handleDashboard
                    }
                >
                    Back to Dashboard
                </button>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <div
                    className="confirmation-footer"
                >

                    <strong>
                        GuimarasGo
                    </strong>

                    {" • "}

                    Safe travels and enjoy Guimaras!

                </div>


            </div>


            <style>{`

                * {
                    box-sizing:
                        border-box;
                }


                .confirmation-page {

                    min-height:
                        100vh;

                    background:
                        #f5f6f8;

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    padding:
                        25px
                        15px;
                }


                .confirmation-container {

                    width:
                        100%;

                    max-width:
                        560px;

                    margin:
                        0 auto;

                    background:
                        #ffffff;

                    border-radius:
                        18px;

                    overflow:
                        hidden;

                    box-shadow:
                        0 10px 35px
                        rgba(
                            0,
                            0,
                            0,
                            0.08
                        );
                }


                .confirmation-header {

                    height:
                        55px;

                    display:
                        grid;

                    grid-template-columns:
                        45px
                        1fr
                        45px;

                    align-items:
                        center;

                    text-align:
                        center;

                    padding:
                        0
                        10px;

                    border-bottom:
                        1px solid
                        #eeeeee;
                }


                .confirmation-header strong {

                    font-size:
                        13px;
                }


                .confirmation-back {

                    width:
                        40px;

                    height:
                        40px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border:
                        1px solid
                        #e6e6e6;

                    border-radius:
                        50%;

                    background:
                        #ffffff;

                    color:
                        #222222;

                    font-size:
                        22px;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;
                }


                .confirmation-back:hover {

                    background:
                        #fff3eb;

                    border-color:
                        #ffcfb0;

                    color:
                        #ff7818;

                    transform:
                        translateX(-2px);
                }


                .confirmation-menu {

                    color:
                        #555555;

                    font-size:
                        22px;
                }


                .confirmation-success {

                    text-align:
                        center;

                    padding:
                        30px
                        20px
                        24px;
                }


                .success-icon {

                    width:
                        62px;

                    height:
                        62px;

                    margin:
                        0
                        auto
                        12px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        50%;

                    background:
                        linear-gradient(
                            135deg,
                            #ff7818,
                            #ff9b29
                        );

                    color:
                        #ffffff;

                    font-size:
                        32px;

                    font-weight:
                        800;

                    box-shadow:
                        0 8px 20px
                        rgba(
                            255,
                            120,
                            24,
                            0.22
                        );
                }


                .confirmation-success h1 {

                    margin:
                        0;

                    color:
                        #111111;

                    font-size:
                        24px;

                    font-weight:
                        800;
                }


                .confirmation-success p {

                    margin:
                        8px
                        0
                        0;

                    color:
                        #777777;

                    font-size:
                        12px;
                }


                .booking-card {

                    margin:
                        0
                        20px;

                    overflow:
                        hidden;

                    border:
                        1px solid
                        #e7e7e7;

                    border-radius:
                        16px;

                    background:
                        #ffffff;

                    box-shadow:
                        0 8px 22px
                        rgba(
                            0,
                            0,
                            0,
                            0.05
                        );
                }


                .booking-card-header {

                    min-height:
                        64px;

                    padding:
                        13px
                        17px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        10px;

                    background:
                        #202020;

                    color:
                        #ffffff;
                }


                .company-name {

                    display:
                        block;

                    font-size:
                        14px;

                    font-weight:
                        800;
                }


                .booking-card-header small {

                    display:
                        block;

                    margin-top:
                        4px;

                    font-size:
                        9px;

                    color:
                        #cccccc;
                }


                .confirmed-badge {

                    padding:
                        7px
                        11px;

                    border-radius:
                        20px;

                    background:
                        #e8f7ef;

                    color:
                        #168a45;

                    font-size:
                        11px;

                    font-weight:
                        800;
                }


                .booking-reference {

                    margin:
                        20px;

                    padding:
                        15px;

                    border:
                        1px solid
                        #eeeeee;

                    border-radius:
                        12px;

                    background:
                        #fafafa;
                }


                .booking-reference small {

                    display:
                        block;

                    color:
                        #999999;

                    font-size:
                        9px;

                    margin-bottom:
                        8px;
                }


                .booking-reference strong {

                    font-size:
                        17px;

                    color:
                        #222222;
                }


                .route-box {

                    margin:
                        0
                        20px
                        16px;

                    padding:
                        15px;

                    display:
                        grid;

                    grid-template-columns:
                        1fr
                        40px
                        1fr;

                    align-items:
                        center;

                    border:
                        1px solid
                        #e7e7e7;

                    border-radius:
                        12px;

                    background:
                        #fffaf6;
                }


                .route-from strong,
                .route-to strong {

                    display:
                        block;

                    color:
                        #111111;

                    font-size:
                        14px;
                }


                .route-from small,
                .route-to small {

                    display:
                        block;

                    margin-top:
                        4px;

                    color:
                        #999999;

                    font-size:
                        9px;
                }


                .route-to {

                    text-align:
                        right;
                }


                .route-icon {

                    text-align:
                        center;

                    color:
                        #ff7818;

                    font-size:
                        20px;
                }


                .details-grid {

                    display:
                        grid;

                    grid-template-columns:
                        1fr
                        1fr;

                    gap:
                        12px;

                    margin:
                        0
                        20px
                        16px;
                }


                .info-box {

                    min-height:
                        70px;

                    padding:
                        13px;

                    border:
                        1px solid
                        #eeeeee;

                    border-radius:
                        11px;

                    background:
                        #ffffff;
                }


                .info-box small {

                    display:
                        block;

                    margin-bottom:
                        7px;

                    color:
                        #999999;

                    font-size:
                        9px;
                }


                .info-box strong {

                    display:
                        block;

                    color:
                        #222222;

                    font-size:
                        12px;

                    word-break:
                        break-word;
                }


                .vehicle-box {

                    margin:
                        0
                        20px;

                    padding:
                        14px;

                    display:
                        grid;

                    grid-template-columns:
                        1fr
                        1fr;

                    gap:
                        15px;

                    border-radius:
                        11px;

                    background:
                        #f6f6f6;
                }


                .vehicle-box small {

                    display:
                        block;

                    margin-bottom:
                        7px;

                    color:
                        #999999;

                    font-size:
                        9px;
                }


                .vehicle-box strong {

                    display:
                        block;

                    color:
                        #222222;

                    font-size:
                        12px;

                    word-break:
                        break-word;
                }


                .boarding-pass {

                    margin:
                        18px
                        20px
                        20px;

                    padding:
                        18px;

                    text-align:
                        center;

                    border:
                        1px dashed
                        #dddddd;

                    border-radius:
                        13px;

                    background:
                        #ffffff;
                }


                .boarding-pass h2 {

                    margin:
                        0;

                    color:
                        #222222;

                    font-size:
                        16px;
                }


                .boarding-pass-subtitle {

                    margin:
                        6px
                        0
                        15px;

                    color:
                        #888888;

                    font-size:
                        10px;
                }


                .boarding-qr img {

                    width:
                        190px;

                    height:
                        190px;

                    display:
                        block;

                    margin:
                        0
                        auto
                        10px;
                }


                .boarding-pass > p {

                    color:
                        #777777;

                    font-size:
                        10px;
                }


                .boarding-reminder {

                    margin-top:
                        15px;

                    padding:
                        12px;

                    border-radius:
                        9px;

                    background:
                        #fff8ed;

                    text-align:
                        left;
                }


                .boarding-reminder strong {

                    color:
                        #df7412;

                    font-size:
                        11px;
                }


                .boarding-reminder p {

                    margin:
                        5px
                        0
                        0;

                    color:
                        #777777;

                    font-size:
                        10px;

                    line-height:
                        1.5;
                }


                .confirmation-message {

                    margin-top:
                        15px;

                    display:
                        flex;

                    justify-content:
                        center;

                    align-items:
                        center;

                    gap:
                        7px;

                    color:
                        #888888;

                    font-size:
                        9px;
                }


                .email-icon {

                    font-size:
                        13px;
                }


                .confirmation-fare {

                    margin:
                        18px
                        20px;

                    padding:
                        17px;

                    border:
                        1px solid
                        #dddddd;

                    border-radius:
                        13px;
                }


                .confirmation-fare h2 {

                    margin:
                        0
                        0
                        13px;

                    font-size:
                        15px;

                    color:
                        #111111;
                }


                .fare-row {

                    display:
                        flex;

                    justify-content:
                        space-between;

                    gap:
                        10px;

                    padding:
                        6px
                        0;

                    color:
                        #666666;

                    font-size:
                        10px;
                }


                .fare-row strong {

                    color:
                        #222222;
                }


                .fare-divider {

                    height:
                        1px;

                    margin:
                        8px
                        0;

                    background:
                        #dddddd;
                }


                .fare-total {

                    display:
                        flex;

                    justify-content:
                        space-between;

                    font-size:
                        13px;
                }


                .confirmation-actions {

                    display:
                        grid;

                    grid-template-columns:
                        1fr
                        1fr;

                    gap:
                        10px;

                    margin:
                        0
                        20px
                        12px;
                }


                .action-button {

                    height:
                        48px;

                    border:
                        none;

                    border-radius:
                        9px;

                    font-size:
                        12px;

                    font-weight:
                        700;

                    cursor:
                        pointer;
                }


                .download-ticket {

                    background:
                        #ff8c1a;

                    color:
                        #ffffff;
                }


                .download-ticket:hover {

                    background:
                        #ed7d0d;
                }


                .view-booking {

                    background:
                        #202020;

                    color:
                        #ffffff;
                }


                .view-booking:hover {

                    background:
                        #111111;
                }


                .back-dashboard {

                    width:
                        calc(
                            100% - 40px
                        );

                    height:
                        50px;

                    margin:
                        0
                        20px
                        18px;

                    border:
                        none;

                    border-radius:
                        9px;

                    background:
                        #f1f1f1;

                    color:
                        #333333;

                    font-size:
                        13px;

                    font-weight:
                        700;

                    cursor:
                        pointer;
                }


                .back-dashboard:hover {

                    background:
                        #e7e7e7;
                }


                .confirmation-footer {

                    padding:
                        0
                        20px
                        25px;

                    text-align:
                        center;

                    color:
                        #999999;

                    font-size:
                        9px;
                }


                .confirmation-footer strong {

                    color:
                        #666666;
                }


                @media (max-width: 600px) {

                    .confirmation-page {

                        padding:
                            0;
                    }


                    .confirmation-container {

                        min-height:
                            100vh;

                        min-height:
                            100dvh;

                        border-radius:
                            0;
                    }


                    .details-grid {

                        grid-template-columns:
                            1fr;
                    }


                    .vehicle-box {

                        grid-template-columns:
                            1fr;
                    }


                    .confirmation-actions {

                        grid-template-columns:
                            1fr;
                    }

                }


                @media print {

                    .confirmation-page {

                        padding:
                            0;

                        background:
                            #ffffff;
                    }


                    .confirmation-container {

                        max-width:
                            100%;

                        border-radius:
                            0;

                        box-shadow:
                            none;
                    }


                    .confirmation-header,
                    .confirmation-actions,
                    .back-dashboard {

                        display:
                            none !important;
                    }


                    .confirmation-success {

                        padding-top:
                            15px;
                    }

                }

            `}</style>

        </main>
    );
};


export default Confirmation;