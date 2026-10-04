const FerrySchedule = require("../models/FerrySchedule");
const Booking = require("../models/Booking");
const FerryClosure = require("../models/FerryClosure");

const PASSENGER_CAPACITY = 100;
const MOTORCYCLE_CAPACITY = 10;

const DEFAULT_SCHEDULES = [
    {
        vesselName: "MV Felipe III",
        route: "Iloilo → Guimaras",
        departureTime: "03:30",
        time: "03:30",
        arrivalTime: "04:00"
    },
    {
        vesselName: "MV FastCraft",
        route: "Guimaras → Iloilo",
        departureTime: "08:00",
        time: "08:00",
        arrivalTime: "08:30"
    },
    {
        vesselName: "MV Halili",
        route: "Iloilo → Guimaras",
        departureTime: "09:00",
        time: "09:00",
        arrivalTime: "09:30"
    }
];

const normalizeText = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

const normalizeDate = (value) => {
    const text = String(value || "").trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
    }

    const slashMatch = text.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

    if (slashMatch) {
        return `${slashMatch[3]}-${String(slashMatch[1]).padStart(2, "0")}-${String(slashMatch[2]).padStart(2, "0")}`;
    }

    return "";
};

const normalizeTime = (value) => {
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

    if (hour > 23 || minute > 59) {
        return "";
    }

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const formatTime = (value) => {
    const normalized = normalizeTime(value);

    if (!normalized) {
        return "";
    }

    const [hourText, minuteText] = normalized.split(":");
    let hour = Number(hourText);
    const period = hour >= 12 ? "PM" : "AM";

    hour %= 12;

    if (hour === 0) {
        hour = 12;
    }

    return `${hour}:${minuteText} ${period}`;
};

const ensureDefaultSchedules = async (date) => {
    const normalizedDate = normalizeDate(date);

    for (const item of DEFAULT_SCHEDULES) {
        await FerrySchedule.findOneAndUpdate(
            {
                date: normalizedDate,
                vesselName: item.vesselName,
                departureTime: item.departureTime
            },
            {
                $setOnInsert: {
                    ...item,
                    date: normalizedDate,
                    passengerCapacity: PASSENGER_CAPACITY,
                    motorcycleCapacity: MOTORCYCLE_CAPACITY,
                    isDefault: true,
                    active: true
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );
    }
};

const calculateScheduleCapacity = async (schedule, bookings) => {
    const targetVessel = normalizeText(schedule.vesselName);
    const targetTime = normalizeTime(schedule.departureTime || schedule.time);

    const matchingBookings = bookings.filter((booking) => {
        const bookingVessel = normalizeText(
            booking.vesselName ||
            booking.ferryName ||
            booking.vessel ||
            booking.ferry ||
            booking.selectedFerry?.vesselName ||
            booking.selectedFerry?.ferryName ||
            booking.selectedTrip?.vesselName ||
            booking.selectedTrip?.ferryName ||
            ""
        );

        const bookingTime = normalizeTime(
            booking.time ||
            booking.departureTime ||
            booking.tripTime ||
            booking.selectedFerry?.time ||
            booking.selectedFerry?.departureTime ||
            booking.selectedTrip?.time ||
            booking.selectedTrip?.departureTime ||
            ""
        );

        if (bookingVessel) {
            return bookingVessel === targetVessel;
        }

        return Boolean(bookingTime && targetTime && bookingTime === targetTime);
    });

    const passengers = matchingBookings.reduce((total, booking) => {
        const count = Number(
            booking.passengers ||
            booking.numberOfPassengers ||
            booking.passengerCount ||
            1
        );

        return total + (Number.isFinite(count) ? Math.max(1, count) : 1);
    }, 0);

    const motorcycles = matchingBookings.reduce((total, booking) => {
        const vehicle = normalizeText(
            booking.vehicleType ||
            booking.vehicle ||
            booking.vehicleDetails?.type ||
            ""
        );

        return vehicle.includes("motorcycle")
            ? total + 1
            : total;
    }, 0);

    const passengerCapacity =
        Number(schedule.passengerCapacity) || PASSENGER_CAPACITY;

    const motorcycleCapacity =
        Number(schedule.motorcycleCapacity) || MOTORCYCLE_CAPACITY;

    const manualClosure = await FerryClosure.findOne({
        date: schedule.date,
        $or: [
            { ferryId: schedule._id.toString() },
            { ferryId: schedule.vesselName },
            { ferryName: schedule.vesselName }
        ],
        isClosed: true
    }).lean();

    const passengerFull = passengers >= passengerCapacity;
    const bookingClosed = Boolean(manualClosure) || passengerFull;

    return {
        id: schedule._id.toString(),
        ferryId: schedule._id.toString(),
        vesselName: schedule.vesselName,
        ferryName: schedule.vesselName,
        route: schedule.route,
        origin: schedule.route.startsWith("Guimaras") ? "Guimaras" : "Iloilo",
        destination: schedule.route.startsWith("Guimaras") ? "Iloilo" : "Guimaras",
        date: schedule.date,
        departureTime: formatTime(schedule.departureTime),
        time: schedule.time || schedule.departureTime,
        arrivalTime: formatTime(schedule.arrivalTime),
        passengers,
        passengerCapacity,
        passengerRemaining: Math.max(0, passengerCapacity - passengers),
        vehicles: motorcycles,
        motorcycles,
        vehicleCapacity: motorcycleCapacity,
        motorcycleCapacity,
        vehicleRemaining: Math.max(0, motorcycleCapacity - motorcycles),
        motorcycleRemaining: Math.max(0, motorcycleCapacity - motorcycles),
        manualClosed: Boolean(manualClosure),
        passengerFull,
        motorcycleFull: motorcycles >= motorcycleCapacity,
        automaticallyFull: passengerFull,
        bookingClosed,
        isDefault: Boolean(schedule.isDefault)
    };
};

const getSchedulesForDate = async (req, res) => {
    try {
        const requestedDate = normalizeDate(
            req.query.date || new Date().toISOString().slice(0, 10)
        );

        if (!requestedDate) {
            return res.status(400).json({
                success: false,
                message: "A valid date is required (YYYY-MM-DD)."
            });
        }

        await ensureDefaultSchedules(requestedDate);

        const schedules = await FerrySchedule.find({
            date: requestedDate,
            active: true
        }).sort({ departureTime: 1 });

        const bookings = await Booking.find({
            status: { $ne: "CANCELLED" },
            paymentStatus: { $ne: "REJECTED" }
        }).lean();

        const dateBookings = bookings.filter(
            (booking) => normalizeDate(booking.date) === requestedDate
        );

        const capacities = [];

        for (const schedule of schedules) {
            capacities.push(
                await calculateScheduleCapacity(
                    schedule,
                    dateBookings
                )
            );
        }

        return res.status(200).json({
            success: true,
            date: requestedDate,
            schedules: capacities,
            capacities
        });
    } catch (error) {
        console.error("Get ferry schedules error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve ferry schedules."
        });
    }
};

const createSchedule = async (req, res) => {
    try {
        const {
            vesselName,
            route,
            date,
            departureTime,
            arrivalTime,
            passengerCapacity,
            motorcycleCapacity
        } = req.body || {};

        const normalizedDate = normalizeDate(date);
        const normalizedDeparture = normalizeTime(departureTime);
        const normalizedArrival = arrivalTime
            ? normalizeTime(arrivalTime)
            : "";

        if (!String(vesselName || "").trim()) {
            return res.status(400).json({
                success: false,
                message: "Ferry/vessel name is required."
            });
        }

        if (!normalizedDate || !normalizedDeparture) {
            return res.status(400).json({
                success: false,
                message: "Travel date and departure time are required."
            });
        }

        if (![
            "Iloilo → Guimaras",
            "Guimaras → Iloilo"
        ].includes(route)) {
            return res.status(400).json({
                success: false,
                message: "A valid ferry route is required."
            });
        }

        const existing = await FerrySchedule.findOne({
            date: normalizedDate,
            vesselName: String(vesselName).trim(),
            departureTime: normalizedDeparture
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "A ferry schedule with the same vessel, date, and departure time already exists."
            });
        }

        const schedule = await FerrySchedule.create({
            vesselName: String(vesselName).trim(),
            route,
            date: normalizedDate,
            departureTime: normalizedDeparture,
            time: normalizedDeparture,
            arrivalTime: normalizedArrival,
            passengerCapacity:
                Math.max(1, Number(passengerCapacity) || PASSENGER_CAPACITY),
            motorcycleCapacity:
                Math.max(0, Number.isFinite(Number(motorcycleCapacity))
                    ? Number(motorcycleCapacity)
                    : MOTORCYCLE_CAPACITY),
            isDefault: false,
            active: true
        });

        return res.status(201).json({
            success: true,
            message: "Ferry trip added successfully.",
            schedule
        });
    } catch (error) {
        console.error("Create ferry schedule error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create ferry schedule."
        });
    }
};

const updateSchedule = async (req, res) => {
    try {
        const schedule = await FerrySchedule.findById(req.params.id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Ferry schedule not found."
            });
        }

        const {
            vesselName,
            route,
            date,
            departureTime,
            arrivalTime,
            passengerCapacity,
            motorcycleCapacity
        } = req.body || {};

        const normalizedDate = normalizeDate(date);
        const normalizedDeparture = normalizeTime(departureTime);
        const normalizedArrival = arrivalTime
            ? normalizeTime(arrivalTime)
            : "";

        if (!String(vesselName || "").trim() || !normalizedDate || !normalizedDeparture) {
            return res.status(400).json({
                success: false,
                message: "Vessel, date, and departure time are required."
            });
        }

        if (![
            "Iloilo → Guimaras",
            "Guimaras → Iloilo"
        ].includes(route)) {
            return res.status(400).json({
                success: false,
                message: "A valid ferry route is required."
            });
        }

        const duplicate = await FerrySchedule.findOne({
            _id: { $ne: schedule._id },
            date: normalizedDate,
            vesselName: String(vesselName).trim(),
            departureTime: normalizedDeparture,
            active: true
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: "Another ferry schedule already uses this vessel, date, and departure time."
            });
        }

        schedule.vesselName = String(vesselName).trim();
        schedule.route = route;
        schedule.date = normalizedDate;
        schedule.departureTime = normalizedDeparture;
        schedule.time = normalizedDeparture;
        schedule.arrivalTime = normalizedArrival;
        schedule.passengerCapacity =
            Math.max(1, Number(passengerCapacity) || PASSENGER_CAPACITY);
        schedule.motorcycleCapacity =
            Math.max(0, Number.isFinite(Number(motorcycleCapacity))
                ? Number(motorcycleCapacity)
                : MOTORCYCLE_CAPACITY);

        await schedule.save();

        return res.status(200).json({
            success: true,
            message: "Ferry schedule updated successfully.",
            schedule
        });
    } catch (error) {
        console.error("Update ferry schedule error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update ferry schedule."
        });
    }
};

const deleteSchedule = async (req, res) => {
    try {
        const schedule = await FerrySchedule.findById(req.params.id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Ferry schedule not found."
            });
        }

        if (schedule.isDefault) {
            return res.status(400).json({
                success: false,
                message: "Default ferry schedules cannot be removed."
            });
        }

        await FerrySchedule.deleteOne({ _id: schedule._id });

        return res.status(200).json({
            success: true,
            message: "Ferry schedule removed successfully."
        });
    } catch (error) {
        console.error("Delete ferry schedule error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to remove ferry schedule."
        });
    }
};

module.exports = {
    getSchedulesForDate,
    createSchedule,
    updateSchedule,
    deleteSchedule
};
