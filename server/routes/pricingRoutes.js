const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const VesselPricing = require("../models/VesselPricing");

const VESSELS = ["MV Halili", "MV FastCraft", "MV Felipe", "Felipe III", "Lite Ferry 22"];

// Normalize common schedule/admin label variants to one saved pricing record.
function normalizeVesselName(value) {
    const name = String(value || "").trim().replace(/\s+/g, " ");
    const key = name.toLowerCase();
    const aliases = {
        "mv halili": "MV Halili",
        "halili": "MV Halili",
        "mv fastcraft": "MV FastCraft",
        "fastcraft": "MV FastCraft",
        "mv felipe": "MV Felipe",
        "felipe": "MV Felipe",
        "felipe iii": "Felipe III",
        "mv felipe iii": "Felipe III",
        "lite ferry 22": "Lite Ferry 22"
    };
    return aliases[key] || name;
}

const DEFAULT_PRICES = {
    solo: 35,
    motorcycle: 285,
    smallBikeStamp: 5,
    bigBike: 353,
    bigBikeStamp: 7,
    companion: 70,
    student: 20,
    pwd: 20,
    senior: 20,
    ppa: 65
};

function validatePrices(prices) {
    const keys = Object.keys(DEFAULT_PRICES);

    if (
        !prices ||
        typeof prices !== "object" ||
        Array.isArray(prices) ||
        keys.some(key =>
            prices[key] === undefined ||
            prices[key] === null ||
            prices[key] === "" ||
            !Number.isFinite(Number(prices[key]))
        )
    ) {
        return "Enter valid fares and discount percentages.";
    }

    const values = Object.fromEntries(
        keys.map(key => [key, Number(prices[key])])
    );

    if (
        keys.some(key =>
            Math.round(values[key] * 100) !== values[key] * 100
        )
    ) {
        return "Use at most two decimal places.";
    }

    if (
        values.solo <= 0 ||
        values.motorcycle < values.solo ||
        values.bigBike < 0 ||
        values.companion !== values.solo * 2 ||
        values.ppa < 0
    ) {
        return "Invalid fare amounts. Companion fare must equal two solo fares, and big-bike fare cannot be negative.";
    }

    if (
        ["student", "pwd", "senior"].some(
            key => values[key] < 0 || values[key] > 100
        )
    ) {
        return "Discounts must be between 0 and 100 percent.";
    }

    return "";
}

async function getAllPrices() {
    const saved = await VesselPricing.find().lean();

    const savedByVessel = Object.fromEntries(
        saved.map(item => [
            item.vesselName,
            Object.fromEntries(
                Object.keys(DEFAULT_PRICES).map(key => [
                    key,
                    Number(item[key] ?? DEFAULT_PRICES[key])
                ])
            )
        ])
    );

    const allVessels = [...new Set([
        ...VESSELS,
        ...saved.map(item => normalizeVesselName(item.vesselName)).filter(Boolean)
    ])];

    return Object.fromEntries(
        allVessels.map(vessel => {
            const matchingSaved = savedByVessel[vessel] ||
                savedByVessel[saved.find(item => normalizeVesselName(item.vesselName) === vessel)?.vesselName];
            return [vessel, matchingSaved || { ...DEFAULT_PRICES }];
        })
    );
}

// Read-only endpoint for passenger checkout. No admin credentials required.
router.get("/public", async (req, res) => {
    try {
        const requestedName = String(req.query.vesselName || "").trim();
        if (!requestedName || requestedName.length > 120) {
            return res.status(400).json({ success: false, message: "A valid vessel name is required." });
        }

        const vesselName = normalizeVesselName(requestedName);
        let saved = await VesselPricing.findOne({ vesselName }).lean();

        // Schedule vessels may be added without a code change. Seed their
        // pricing with agreed defaults so passenger checkout can proceed.
        if (!saved) {
            saved = await VesselPricing.findOneAndUpdate(
                { vesselName },
                { $setOnInsert: { vesselName, ...DEFAULT_PRICES } },
                { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
            ).lean();
        }

        const prices = { ...DEFAULT_PRICES, ...(saved || {}) };
        return res.json({
            success: true,
            vesselName,
            prices: Object.fromEntries(Object.keys(DEFAULT_PRICES).map(key => [key, Number(prices[key] ?? DEFAULT_PRICES[key])]))
        });
    } catch (error) {
        console.error("Public pricing lookup error:", error);
        return res.status(500).json({ success: false, message: "Unable to load current fares." });
    }
});

router.get("/", adminAuth, async (req, res) => {
    try {
        const prices = await getAllPrices();

        return res.json({
            success: true,
            prices
        });
    } catch (error) {
        console.error("Load vessel pricing error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load vessel pricing."
        });
    }
});

router.put("/:vesselName", adminAuth, async (req, res) => {
    try {
        const requestedName = decodeURIComponent(req.params.vesselName || "").trim();
        if (!requestedName || requestedName.length > 120) {
            return res.status(400).json({
                success: false,
                message: "A valid vessel name is required."
            });
        }
        const vesselName = normalizeVesselName(requestedName);

        const issue = validatePrices(req.body);

        if (issue) {
            return res.status(400).json({
                success: false,
                message: issue
            });
        }

        const prices = Object.fromEntries(
            Object.keys(DEFAULT_PRICES).map(key => [
                key,
                Number(req.body[key])
            ])
        );

        // Vessel-specific fields stay attached to the selected vessel.
        const vesselPrices = { ...prices };
        delete vesselPrices.bigBike;
        await VesselPricing.findOneAndUpdate(
            { vesselName },
            { $set: { vesselName, ...vesselPrices, bigBike: prices.bigBike } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        // Big-bike fare is one shared rate across all vessels.
        await VesselPricing.updateMany({}, { $set: { bigBike: prices.bigBike } });
        const saved = await VesselPricing.findOne({ vesselName }).lean();

        return res.json({
            success: true,
            message: `${vesselName} pricing saved successfully.`,
            vesselName,
            prices: Object.fromEntries(
                Object.keys(DEFAULT_PRICES).map(key => [
                    key,
                    Number(saved[key] ?? DEFAULT_PRICES[key])
                ])
            )
        });
    } catch (error) {
        console.error("Save vessel pricing error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to save vessel pricing."
        });
    }
});

module.exports = router;