const FerrySchedule = require("../models/FerrySchedule");
const Booking = require("../models/Booking");
const FerryClosure = require("../models/FerryClosure");
const ScheduleDayControl = FerryClosure.ScheduleDayControl;
const { belongsToTrip, hasMotorcycle } = require("../utils/staffTrip");

const PASSENGER_CAPACITY = 100;
const MOTORCYCLE_CAPACITY = 10;

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

const isAllowedDepartureTime = (value) => {
    const normalized = normalizeTime(value);

    if (!normalized) {
        return false;
    }

    const [hourText, minuteText] = normalized.split(":");

    const totalMinutes =
        Number(hourText) * 60 +
        Number(minuteText);

    return (
        totalMinutes >= 3 * 60 + 30 &&
        totalMinutes <= 19 * 60 + 30 &&
        totalMinutes % 30 === 0
    );
};

const isAllowedArrivalTime = (value) => {
    if (!value) {
        return true;
    }

    const normalized = normalizeTime(value);

    if (!normalized) {
        return false;
    }

    const [hourText, minuteText] = normalized.split(":");

    const totalMinutes =
        Number(hourText) * 60 +
        Number(minuteText);

    return (
        totalMinutes >= 4 * 60 &&
        totalMinutes <= 20 * 60 &&
        totalMinutes % 30 === 0
    );
};

const formatTime = (value) => {
    const normalized = normalizeTime(value);

    if (!normalized) {
        return "";
    }

    const [hourText, minuteText] = normalized.split(":");

    let hour = Number(hourText);

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    hour %= 12;

    if (hour === 0) {
        hour = 12;
    }

    return `${hour}:${minuteText} ${period}`;
};

const resetSchedulesForDate = async (req, res) => {
    try {
        const date = normalizeDate(req.query.date || req.body?.date);
        if (!date) {
            return res.status(400).json({ success: false, message: "Choose a valid travel date to reset." });
        }

        const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
        const todayParts = Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, part.value]));
        const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;

        if (date >= today) {
            const activeBookings = await Booking.countDocuments({
                date,
                status: { $nin: ["CANCELLED"] },
                paymentStatus: { $nin: ["REJECTED", "CANCELLED"] }
            });
            if (activeBookings > 0) {
                return res.status(409).json({
                    success: false,
                    message: `This date has ${activeBookings} active booking${activeBookings === 1 ? "" : "s"}. Resolve those bookings before resetting trips so passengers are not left without their scheduled crossing.`
                });
            }
        }

        await ScheduleDayControl.findOneAndUpdate(
            { date }, { $set: { suppressDefaults: true } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const [schedules, closures] = await Promise.all([
            FerrySchedule.deleteMany({ date }),
            FerryClosure.deleteMany({ date })
        ]);

        return res.status(200).json({
            success: true, date,
            removedTrips: schedules.deletedCount || 0,
            removedClosures: closures.deletedCount || 0,
            message: "The selected day's schedules were reset. Booking and payment records were kept."
        });
    } catch (error) {
        console.error("Reset ferry schedules error:", error);
        return res.status(500).json({ success: false, message: "Unable to reset schedules for this date." });
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

    const passengers =
        matchingBookings.reduce(
            (total, booking) => {
                const count =
                    Number(
                        booking.passengers ||
                        booking.numberOfPassengers ||
                        booking.passengerCount ||
                        1
                    );

                return (
                    total +
                    (
                        Number.isFinite(count)
                            ? Math.max(1, count)
                            : 1
                    )
                );
            },
            0
        );

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

    const manualClosure =
        await FerryClosure.findOne({
            date: schedule.date,

            $or: [
                {
                    ferryId:
                        schedule._id.toString()
                },
                {
                    ferryId:
                        schedule.vesselName
                },
                {
                    ferryName:
                        schedule.vesselName
                }
            ],

            isClosed: true
        }).lean();

    const passengerFull =
        passengers >= passengerCapacity;

    const bookingClosed =
        Boolean(manualClosure) ||
        passengerFull;

    return {
        id:
            schedule._id.toString(),

        ferryId:
            schedule._id.toString(),

        vesselName:
            schedule.vesselName,

        ferryName:
            schedule.vesselName,

        route:
            schedule.route,

        origin:
            schedule.route.startsWith(
                "Guimaras"
            )
                ? "Guimaras"
                : "Iloilo",

        destination:
            schedule.route.startsWith(
                "Guimaras"
            )
                ? "Iloilo"
                : "Guimaras",

        date:
            schedule.date,

        departureTime:
            formatTime(
                schedule.departureTime
            ),

        time:
            schedule.time ||
            schedule.departureTime,

        arrivalTime:
            formatTime(
                schedule.arrivalTime
            ),

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

        isDefault:
            Boolean(
                schedule.isDefault
            )
    };
};

const getSchedulesForDate = async (
    req,
    res
) => {
    try {
        const requestedDate =
            normalizeDate(
                req.query.date ||
                new Date()
                    .toISOString()
                    .slice(0, 10)
            );

        if (!requestedDate) {
            return res.status(400).json({
                success: false,
                message:
                    "A valid date is required (YYYY-MM-DD)."
            });
        }
        /*
         * IMPORTANT:
         * Both Admin and Passenger use this
         * controller.
         *
         * Only schedules belonging to the
         * requested date are returned.
         */
        const schedules =
            await FerrySchedule.find({
                date: requestedDate,
                // Exclude legacy placeholder trips created by older versions.
                isDefault: { $ne: true },

                /*
                 * Existing schedules remain visible
                 * unless explicitly disabled.
                 */
                active: {
                    $ne: false
                }
            }).sort({
                departureTime: 1
            });

        /*
         * Get bookings so we can calculate the
         * current passenger/motorcycle capacity.
         */
        const bookings =
            await Booking.find({
                status: {
                    $ne: "CANCELLED"
                },

                paymentStatus: {
                    $ne: "REJECTED"
                }
            }).lean();

        /*
         * Only bookings for the selected travel
         * date affect that day's capacity.
         */
        const dateBookings =
            bookings.filter(
                (booking) =>
                    normalizeDate(
                        booking.date
                    ) === requestedDate
            );

        const capacities = [];

        for (
            const schedule of schedules
        ) {
            capacities.push(
                await calculateScheduleCapacity(
                    schedule,
                    dateBookings
                )
            );
        }

        return res.status(200).json({
            success: true,

            date:
                requestedDate,

            schedules:
                capacities,

            /*
             * Keep capacities as well because
             * existing frontend code may use it.
             */
            capacities
        });

    } catch (error) {
        console.error(
            "Get ferry schedules error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve ferry schedules."
        });
    }
};

const createSchedule = async (
    req,
    res
) => {
    try {
        const {
            vesselName,
            route,
            date,
            departureTime,
            arrivalTime,
            passengerCapacity,
            motorcycleCapacity,
            walkInMotorcycleCapacity
        } = req.body || {};

        const normalizedDate =
            normalizeDate(date);

        const normalizedDeparture =
            normalizeTime(
                departureTime
            );

        const normalizedArrival =
            arrivalTime
                ? normalizeTime(
                    arrivalTime
                )
                : "";

        if (
            !isAllowedDepartureTime(
                normalizedDeparture
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Departure time must be between 3:30 AM and 7:30 PM in 30-minute increments."
            });
        }

        if (
            !isAllowedArrivalTime(
                normalizedArrival
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Arrival time must be between 4:00 AM and 8:00 PM in 30-minute increments."
            });
        }

        if (normalizedArrival) {
            const [
                departureHour,
                departureMinute
            ] =
                normalizedDeparture
                    .split(":")
                    .map(Number);

            const [
                arrivalHour,
                arrivalMinute
            ] =
                normalizedArrival
                    .split(":")
                    .map(Number);

            const departureTotal =
                departureHour * 60 +
                departureMinute;

            const arrivalTotal =
                arrivalHour * 60 +
                arrivalMinute;

            if (
                arrivalTotal <=
                departureTotal
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Arrival time must be later than departure time."
                });
            }
        }

        if (
            !String(
                vesselName || ""
            ).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Ferry/vessel name is required."
            });
        }

        if (
            !normalizedDate ||
            !normalizedDeparture
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Travel date and departure time are required."
            });
        }

        if (
            ![
                "Iloilo → Guimaras",
                "Guimaras → Iloilo"
            ].includes(route)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "A valid ferry route is required."
            });
        }

        const existing =
            await FerrySchedule.findOne({
                date:
                    normalizedDate,

                vesselName:
                    String(
                        vesselName
                    ).trim(),

                departureTime:
                    normalizedDeparture
            });

        if (existing) {
            return res.status(409).json({
                success: false,
                message:
                    "A ferry schedule with the same vessel, date, and departure time already exists."
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
           motorcycleCapacity: Math.max(
    0,
    Number.isFinite(Number(motorcycleCapacity))
        ? Number(motorcycleCapacity)
        : MOTORCYCLE_CAPACITY
),

walkInMotorcycleCapacity: Math.min(
    Math.max(
        0,
        Number.isFinite(Number(walkInMotorcycleCapacity))
            ? Number(walkInMotorcycleCapacity)
            : (
                Number(motorcycleCapacity) ||
                MOTORCYCLE_CAPACITY
            )
    ),
    Math.max(
        0,
        Number.isFinite(Number(motorcycleCapacity))
            ? Number(motorcycleCapacity)
            : MOTORCYCLE_CAPACITY
    )
),
            // Explicitly mark admin-created schedules as active so they are
            // always returned by the schedule query after a refresh.
            active: true
        });

        return res.status(201).json({
            success: true,

            message:
                "Ferry trip added successfully.",

            schedule
        });

    } catch (error) {
        console.error(
            "Create ferry schedule error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create ferry schedule."
        });
    }
};

const createSchedulesBulk = async (req, res) => {
    try {
        const trips = Array.isArray(req.body?.trips) ? req.body.trips : [];
        if (!trips.length || trips.length > 2500) {
            return res.status(400).json({ success: false, message: "Provide between 1 and 2,500 trips to generate." });
        }

        const validRoutes = ["Iloilo → Guimaras", "Guimaras → Iloilo"];
        const docs = [];
        for (const trip of trips) {
            const vesselName = String(trip?.vesselName || "").trim();
            const date = normalizeDate(trip?.date);
            const departureTime = normalizeTime(trip?.departureTime);
            const arrivalTime = normalizeTime(trip?.arrivalTime);
            if (!vesselName || !date || !departureTime || !isAllowedDepartureTime(departureTime) || !arrivalTime || !isAllowedArrivalTime(arrivalTime) || !validRoutes.includes(trip?.route)) {
                return res.status(400).json({ success: false, message: "One or more generated trips have invalid vessel, date, route, or time details." });
            }
            const [departureHour, departureMinute] = departureTime.split(":").map(Number);
            const [arrivalHour, arrivalMinute] = arrivalTime.split(":").map(Number);
            if (arrivalHour * 60 + arrivalMinute <= departureHour * 60 + departureMinute) {
                return res.status(400).json({ success: false, message: "Each trip arrival must be later than its departure." });
            }
            const motorcycleCapacity = Math.max(0, Number.isFinite(Number(trip.motorcycleCapacity)) ? Number(trip.motorcycleCapacity) : MOTORCYCLE_CAPACITY);
            docs.push({
                vesselName,
                route: trip.route,
                date,
                departureTime,
                time: departureTime,
                arrivalTime,
                passengerCapacity: Math.max(1, Number(trip.passengerCapacity) || PASSENGER_CAPACITY),
                motorcycleCapacity,
                walkInMotorcycleCapacity: Math.min(Math.max(0, Number.isFinite(Number(trip.walkInMotorcycleCapacity)) ? Number(trip.walkInMotorcycleCapacity) : motorcycleCapacity), motorcycleCapacity),
                active: true
            });
        }

        const dates = [...new Set(docs.map(trip => trip.date))];
        const vesselNames = [...new Set(docs.map(trip => trip.vesselName))];
        const existing = await FerrySchedule.find({ date: { $in: dates }, vesselName: { $in: vesselNames } }).select("date vesselName departureTime").lean();
        const keyFor = trip => `${trip.date}\u0000${trip.vesselName}\u0000${trip.departureTime}`;
        const known = new Set(existing.map(keyFor));
        const fresh = docs.filter(trip => {
            const key = keyFor(trip);
            if (known.has(key)) return false;
            known.add(key);
            return true;
        });
        const skipped = docs.length - fresh.length;
        if (!fresh.length) return res.status(200).json({ success: true, created: 0, skipped });

        const created = await FerrySchedule.insertMany(fresh, { ordered: false });
        return res.status(201).json({ success: true, created: created.length, skipped });
    } catch (error) {
        if (error.code === 11000) {
            const inserted = Array.isArray(error.insertedDocs) ? error.insertedDocs.length : Number(error.result?.insertedCount) || 0;
            const duplicates = Array.isArray(error.writeErrors) ? error.writeErrors.filter(item => item.code === 11000).length : 0;
            if (!error.writeErrors?.some(item => item.code !== 11000)) {
                return res.status(200).json({ success: true, created: inserted, skipped: duplicates, message: "Some duplicate departures were skipped." });
            }
        }
        console.error("Bulk ferry schedule generation error:", error);
        return res.status(500).json({ success: false, message: "Unable to generate ferry schedules." });
    }
};

const updateSchedule = async (
    req,
    res
) => {
    try {
        const schedule =
            await FerrySchedule.findById(
                req.params.id
            );

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message:
                    "Ferry schedule not found."
            });
        }

        const {
            vesselName,
            route,
            date,
            departureTime,
            arrivalTime,
            passengerCapacity,
            motorcycleCapacity,
            walkInMotorcycleCapacity
        } = req.body || {};

        const normalizedDate =
            normalizeDate(date);

        const normalizedDeparture =
            normalizeTime(
                departureTime
            );

        const normalizedArrival =
            arrivalTime
                ? normalizeTime(
                    arrivalTime
                )
                : "";

        if (
            !isAllowedDepartureTime(
                normalizedDeparture
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Departure time must be between 3:30 AM and 7:30 PM in 30-minute increments."
            });
        }

        if (
            !isAllowedArrivalTime(
                normalizedArrival
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Arrival time must be between 4:00 AM and 8:00 PM in 30-minute increments."
            });
        }

        if (normalizedArrival) {
            const [
                departureHour,
                departureMinute
            ] =
                normalizedDeparture
                    .split(":")
                    .map(Number);

            const [
                arrivalHour,
                arrivalMinute
            ] =
                normalizedArrival
                    .split(":")
                    .map(Number);

            const departureTotal =
                departureHour * 60 +
                departureMinute;

            const arrivalTotal =
                arrivalHour * 60 +
                arrivalMinute;

            if (
                arrivalTotal <=
                departureTotal
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Arrival time must be later than departure time."
                });
            }
        }

        if (
            !String(
                vesselName || ""
            ).trim() ||
            !normalizedDate ||
            !normalizedDeparture
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Vessel, date, and departure time are required."
            });
        }

        if (
            ![
                "Iloilo → Guimaras",
                "Guimaras → Iloilo"
            ].includes(route)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "A valid ferry route is required."
            });
        }

        const duplicate =
            await FerrySchedule.findOne({
                _id: {
                    $ne:
                        schedule._id
                },

                date:
                    normalizedDate,

                vesselName:
                    String(
                        vesselName
                    ).trim(),

                departureTime:
                    normalizedDeparture,

                active: {
                    $ne: false
                }
            });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message:
                    "Another ferry schedule already uses this vessel, date, and departure time."
            });
        }

        schedule.vesselName =
            String(
                vesselName
            ).trim();

        schedule.route =
            route;

        schedule.date =
            normalizedDate;

        schedule.departureTime =
            normalizedDeparture;

        schedule.time =
            normalizedDeparture;

        schedule.arrivalTime =
            normalizedArrival;

        schedule.passengerCapacity =
            Math.max(
                1,
                Number(
                    passengerCapacity
                ) ||
                PASSENGER_CAPACITY
            );
schedule.motorcycleCapacity = Math.max(
    0,
    Number.isFinite(Number(motorcycleCapacity))
        ? Number(motorcycleCapacity)
        : MOTORCYCLE_CAPACITY
);

schedule.walkInMotorcycleCapacity = Math.min(
    schedule.motorcycleCapacity,
    Math.max(
        0,
        Number.isFinite(Number(walkInMotorcycleCapacity))
            ? Number(walkInMotorcycleCapacity)
            : Number(
                schedule.walkInMotorcycleCapacity ??
                schedule.motorcycleCapacity
            )
    )
);

schedule.active = true;

        await schedule.save();

        return res.status(200).json({
            success: true,

            message:
                "Ferry schedule updated successfully.",

            schedule
        });

    } catch (error) {
        console.error(
            "Update ferry schedule error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update ferry schedule."
        });
    }
};

const deleteSchedule = async (
    req,
    res
) => {
    try {
        const schedule =
            await FerrySchedule.findOneAndUpdate(
                { _id: req.params.id },
                { $set: { active: false } },
                { new: true }
            );

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message:
                    "Ferry schedule not found."
            });
        }

        // Deactivate defaults and admin-created trips alike. Keep the record
        // for existing bookings, but remove it from schedule availability.

        return res.status(200).json({
            success: true,
            message:
                "Ferry schedule deleted successfully."
        });

    } catch (error) {
        console.error(
            "Delete ferry schedule error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to remove ferry schedule."
        });
    }
};

module.exports = {
    getSchedulesForDate,
    createSchedule,
    createSchedulesBulk,
    updateSchedule,
    deleteSchedule,
    resetSchedulesForDate
};
