const FerryClosure = require("../models/FerryClosure");

// =========================================================
// FERRY DEFINITIONS
// =========================================================
//
// Keep these synchronized with the ferry definitions already
// being used by the booking capacity system.
//
// =========================================================

const FERRIES = [
    {
        id: "MV-FELIPE-III",
        ferryId: "MV-FELIPE-III",
        ferryName: "MV Felipe",
        vesselName: "MV Felipe",
        departureTime: "3:30 AM",
        time: "03:30"
    },
    {
        id: "MV-FASTCRAFT",
        ferryId: "MV-FASTCRAFT",
        ferryName: "MV FastCraft",
        vesselName: "MV FastCraft",
        departureTime: "8:00 AM",
        time: "08:00"
    },
    {
        id: "MV-HALILI",
        ferryId: "MV-HALILI",
        ferryName: "MV Halili",
        vesselName: "MV Halili",
        departureTime: "9:00 AM",
        time: "09:00"
    }
];


// =========================================================
// NORMALIZE FERRY
// =========================================================

const normalizeFerry = (value) => {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
};


// =========================================================
// FIND FERRY
// =========================================================

const findFerry = ({
    ferryId,
    ferryName,
    vesselName,
    time
}) => {

    const normalizedId =
        normalizeFerry(ferryId);

    const normalizedName =
        normalizeFerry(
            ferryName ||
            vesselName
        );

    const normalizedTime =
        String(time || "")
            .trim()
            .toLowerCase();


    const knownFerry = FERRIES.find((ferry) => {

        const ferryIdMatch =
            normalizedId &&
            normalizeFerry(ferry.ferryId) ===
            normalizedId;

        const ferryNameMatch =
            normalizedName &&
            (
                normalizeFerry(ferry.ferryName) ===
                    normalizedName ||
                normalizeFerry(ferry.vesselName) ===
                    normalizedName
            );

        const ferryTimeMatch =
            normalizedTime &&
            (
                String(ferry.time)
                    .trim()
                    .toLowerCase() ===
                    normalizedTime ||

                String(ferry.departureTime)
                    .trim()
                    .toLowerCase() ===
                    normalizedTime
            );

        return (
            ferryIdMatch ||
            ferryNameMatch ||
            ferryTimeMatch
        );
    });
    if (knownFerry) return knownFerry;

    // Admin-created vessels are not necessarily part of the legacy list above.
    // Use the supplied vessel name as a stable date-level closure key so every
    // schedule for that vessel is affected together.
    const suppliedName = String(ferryName || vesselName || "").trim();
    if (!suppliedName || !normalizeFerry(suppliedName)) return null;
    return {
        ferryId: normalizeFerry(suppliedName),
        ferryName: suppliedName,
        vesselName: suppliedName
    };
};


// =========================================================
// GET FERRY CLOSURES
// =========================================================
//
// GET /api/ferry-closures?date=YYYY-MM-DD
//
// Admin dashboard uses this to determine which ferries
// are manually closed for the selected date.
// =========================================================

const getFerryClosures = async (req, res) => {

    try {

        const requestedDate =
            req.query.date ||
            new Date()
                .toISOString()
                .split("T")[0];


        const closures =
            await FerryClosure.find({
                date: requestedDate
            })
            .sort({
                ferryName: 1
            });


        return res.status(200).json({

            success: true,

            date:
                requestedDate,

            closures

        });

    } catch (error) {

        console.error(
            "Get ferry closures error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve ferry closures."

        });
    }
};


// =========================================================
// GET SINGLE FERRY CLOSURE
// =========================================================
//
// GET /api/ferry-closures/:date/:ferryId
//
// Public endpoint so the booking system can check whether
// a specific ferry is closed.
// =========================================================

const getFerryClosure = async (req, res) => {

    try {

        const {
            date,
            ferryId
        } = req.params;


        const closure =
            await FerryClosure.findOne({

                date,

                ferryId

            });


        return res.status(200).json({

            success: true,

            date,

            ferryId,

            isClosed:
                Boolean(
                    closure?.isClosed
                ),

            closure:
                closure || null

        });

    } catch (error) {

        console.error(
            "Get ferry closure error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve ferry booking status."

        });
    }
};


// =========================================================
// CLOSE FERRY
// =========================================================
//
// PUT /api/ferry-closures/close
//
// ADMIN ONLY
//
// Body:
//
// {
//     "date": "2026-08-31",
//     "ferryId": "MV-HALILI",
//     "ferryName": "MV Halili"
// }
// =========================================================

const closeFerry = async (req, res) => {

    try {

        const {
            date,
            ferryId,
            ferryName,
            vesselName,
            time
        } = req.body;


        if (!date) {

            return res.status(400).json({

                success: false,

                message:
                    "Date is required."

            });
        }


        const ferry =
            findFerry({
                ferryId,
                ferryName,
                vesselName,
                time
            });


        if (!ferry) {

            return res.status(400).json({

                success: false,

                message:
                    "Ferry could not be identified."

            });
        }


        const closure =
            await FerryClosure.findOneAndUpdate(

                {
                    date,

                    ferryId:
                        ferry.ferryId
                },

                {
                    $set: {

                        date,

                        ferryId:
                            ferry.ferryId,

                        ferryName:
                            ferry.ferryName,

                        isClosed:
                            true,

                        closedAt:
                            new Date()

                    }
                },

                {
                    new: true,

                    upsert: true,

                    setDefaultsOnInsert:
                        true
                }
            );


        return res.status(200).json({

            success: true,

            message:
                `${ferry.ferryName} online booking has been closed for ${date}.`,

            closure

        });

    } catch (error) {

        console.error(
            "Close ferry error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to close ferry booking."

        });
    }
};


// =========================================================
// OPEN FERRY
// =========================================================
//
// PUT /api/ferry-closures/open
//
// ADMIN ONLY
// =========================================================

const openFerry = async (req, res) => {

    try {

        const {
            date,
            ferryId,
            ferryName,
            vesselName,
            time
        } = req.body;


        if (!date) {

            return res.status(400).json({

                success: false,

                message:
                    "Date is required."

            });
        }


        const ferry =
            findFerry({
                ferryId,
                ferryName,
                vesselName,
                time
            });


        if (!ferry) {

            return res.status(400).json({

                success: false,

                message:
                    "Ferry could not be identified."

            });
        }


        const closure =
            await FerryClosure.findOneAndUpdate(

                {
                    date,

                    ferryId:
                        ferry.ferryId
                },

                {
                    $set: {

                        date,

                        ferryId:
                            ferry.ferryId,

                        ferryName:
                            ferry.ferryName,

                        isClosed:
                            false,

                        closedAt:
                            null

                    }
                },

                {
                    new: true,

                    upsert: true,

                    setDefaultsOnInsert:
                        true
                }
            );


        return res.status(200).json({

            success: true,

            message:
                `${ferry.ferryName} online booking has been opened for ${date}.`,

            closure

        });

    } catch (error) {

        console.error(
            "Open ferry error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to open ferry booking."

        });
    }
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {

    getFerryClosures,

    getFerryClosure,

    closeFerry,

    openFerry

};
