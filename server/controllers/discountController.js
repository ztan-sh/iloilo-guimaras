const DiscountRequest = require("../models/DiscountRequest");

const validPhoto = value => {
    if (typeof value !== "string") return false;
    const match = value.trim().match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\r\n]+)$/i);
    if (!match) return false;
    return Math.floor(match[2].replace(/\s/g, "").length * 3 / 4) <= 5 * 1024 * 1024;
};

const createOwnRequest = async (req, res) => {
    try {
        const body = req.body || {};
        const passengerId = String(body.passengerId || "").trim();
        const passengerName = String(body.passengerName || "").trim();
        const age = Number(body.age);
        const gender = String(body.gender || "").trim();
        const category = Number(age) >= 60 ? "Senior" : String(body.category || "");
        if (!passengerId || passengerId.length > 128 || !passengerName || passengerName.length > 150 || !Number.isInteger(age) || age < 0 || age > 120 || !gender || !["Student", "PWD", "Senior"].includes(category)) {
            return res.status(400).json({ success: false, message: "Enter the passenger's complete details and an eligible discount category." });
        }
        if (!validPhoto(body.photo)) {
            return res.status(400).json({ success: false, message: "Upload a valid JPG, PNG or WebP ID photo smaller than 5 MB." });
        }
        const request = await DiscountRequest.findOneAndUpdate(
            { userId: req.user.userId, passengerId },
            { $set: { passengerName, age, gender, category, photo: body.photo, source: String(body.source || "Passenger booking").slice(0, 200), status: "pending", reason: "", reviewedBy: "", reviewedAt: null } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
        return res.status(201).json({ success: true, request });
    } catch (error) {
        console.error("Create discount request error:", error);
        return res.status(500).json({ success: false, message: "Unable to save the passenger ID photo." });
    }
};

const getOwnRequests = async (req, res) => {
    try {
        const requests = await DiscountRequest.find({ userId: req.user.userId }).sort({ createdAt: -1 }).lean();
        return res.json({ success: true, requests });
    } catch (error) {
        console.error("Get passenger discount requests error:", error);
        return res.status(500).json({ success: false, message: "Unable to retrieve your ID review status." });
    }
};

const getAllRequests = async (_req, res) => {
    try {
        const requests = await DiscountRequest.find().sort({ status: 1, createdAt: 1 }).lean();
        return res.json({ success: true, requests });
    } catch (error) {
        console.error("Get discount requests error:", error);
        return res.status(500).json({ success: false, message: "Unable to retrieve ID review requests." });
    }
};

const decideRequest = async (req, res) => {
    try {
        const decision = String(req.body?.decision || "");
        const reason = String(req.body?.reason || "").trim();
        if (!["approved", "requested"].includes(decision) || (decision === "requested" && !reason)) {
            return res.status(400).json({ success: false, message: "Choose an ID decision and provide a reason when requesting a new photo." });
        }
        const request = await DiscountRequest.findOneAndUpdate(
            { _id: req.params.id, status: "pending" },
            { $set: { status: decision, reason: decision === "requested" ? reason.slice(0, 500) : "", reviewedBy: req.admin?.fullName || req.admin?.name || req.staff?.name || "Administrator", reviewedAt: new Date() } },
            { new: true, runValidators: true }
        );
        if (!request) return res.status(404).json({ success: false, message: "This ID request is unavailable or has already been reviewed." });
        return res.json({ success: true, request });
    } catch (error) {
        console.error("Review discount request error:", error);
        return res.status(500).json({ success: false, message: "Unable to save the ID review decision." });
    }
};

module.exports = { createOwnRequest, getOwnRequests, getAllRequests, decideRequest };
