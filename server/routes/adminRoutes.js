const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const createRateLimiter = require("../middleware/rateLimitMiddleware");
const { issueSession, clearSession, readCookie, assertCookieMutationOrigin } = require("../utils/authSession");

const Admin = require("../models/Admin");
const adminAuth = require("../middleware/adminAuth");
const { recordActivity } = require("../utils/activityAudit");
const { getAllRequests, decideRequest } = require("../controllers/discountController");
const { getAdminActivity } = require("../controllers/activityAuditController");
const Notification = require("../models/Notification");
const User = require("../models/User");
const {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    deactivateStaff,
    activateStaff,
    deleteStaff
} = require("../controllers/adminController");

const router = express.Router();
const adminRegisterLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, message: "Too many admin registration attempts. Please try again later." });
const adminLoginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 8, message: "Too many admin sign-in attempts. Please try again later." });
router.post("/logout", (req, res) => {
    if (readCookie(req, "ggo_admin_session") && !assertCookieMutationOrigin(req)) return res.status(403).json({ message: "Request origin could not be verified." });
    clearSession(res, "admin");
    return res.status(200).json({ success: true });
});
const safeSecretMatches = (provided, configured) => {
    if (typeof configured !== "string" || !configured || typeof provided !== "string") return false;
    const providedBytes = Buffer.from(provided);
    const configuredBytes = Buffer.from(configured);
    return providedBytes.length === configuredBytes.length && crypto.timingSafeEqual(providedBytes, configuredBytes);
};
router.get("/discount-requests", adminAuth, getAllRequests);
router.put("/discount-requests/:id", adminAuth, decideRequest);
router.post("/notifications/announcements", adminAuth, async (req, res) => {
    const title = String(req.body?.title || "").trim();
    const message = String(req.body?.message || "").trim();
    if (!title || title.length > 160 || !message || message.length > 1200) {
        return res.status(400).json({ success: false, message: "Enter a title (up to 160 characters) and message (up to 1,200 characters)." });
    }
    try {
        const users = await User.find({}).select("_id").lean();
        if (users.length) await Notification.insertMany(users.map(user => ({ userId: user._id, type: "announcement", title, message })));
        return res.status(201).json({ success: true, delivered: users.length, message: `Announcement sent to ${users.length} passenger account${users.length === 1 ? "" : "s"}.` });
    } catch (error) {
        console.error("Create passenger announcement error:", error);
        return res.status(500).json({ success: false, message: "Unable to send this announcement." });
    }
});


// =========================================================
// ADMIN REGISTRATION
// =========================================================

router.post("/register", adminRegisterLimiter, async (req, res) => {

    try {

        const {
            fullName,
            email,
            password,
            confirmPassword,
            registrationCode
        } = req.body;


        // =====================================================
        // REQUIRED FIELDS
        // =====================================================

        if (
            !fullName ||
            !email ||
            !password ||
            !confirmPassword ||
            !registrationCode
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please complete all required fields."
            });
        }


        // =====================================================
        // CHECK PASSWORD
        // =====================================================

        if (password !== confirmPassword) {

            return res.status(400).json({
                success: false,
                message:
                    "Passwords do not match."
            });
        }


        // =====================================================
        // PASSWORD LENGTH
        // =====================================================

        if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must have at least 12 characters and include uppercase, lowercase, number, and symbol characters."
            });
        }


        // =====================================================
        // ADMIN REGISTRATION CODE
        // =====================================================

        if (!safeSecretMatches(registrationCode, process.env.ADMIN_REGISTRATION_CODE)) {

            return res.status(403).json({
                success: false,
                message:
                    "Invalid admin registration code."
            });
        }


        // =====================================================
        // CHECK EXISTING ADMIN
        // =====================================================

        const normalizedEmail =
            email.trim().toLowerCase();

        const existingAdmin =
            await Admin.findOne({
                email: normalizedEmail
            });

        if (existingAdmin) {

            return res.status(409).json({
                success: false,
                message:
                    "An administrator with this email already exists."
            });
        }


        // =====================================================
        // HASH PASSWORD
        // =====================================================

        const hashedPassword =
            await bcrypt.hash(password, 12);


        // =====================================================
        // CREATE ADMIN
        // =====================================================

        const admin =
            await Admin.create({

                fullName:
                    fullName.trim(),

                email:
                    normalizedEmail,

                password:
                    hashedPassword,

                role:
                    "ADMIN"
            });


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(201).json({

            success: true,

            message:
                "Administrator account created successfully.",

            admin: {

                id:
                    admin._id,

                fullName:
                    admin.fullName,

                email:
                    admin.email,

                role:
                    admin.role
            }
        });

    } catch (error) {

        console.error(
            "Admin registration error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create administrator account."
        });
    }
});


// =========================================================
// ADMIN LOGIN
// =========================================================

router.post("/login", adminLoginLimiter, async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required."
            });
        }


        const normalizedEmail =
            email.trim().toLowerCase();


        // =====================================================
        // FIND ADMIN
        // =====================================================

        const admin =
            await Admin.findOne({
                email: normalizedEmail
            }).select("+password");


        if (!admin) {

            await recordActivity({ req, actorRole: "admin", actorName: "Unverified administrator login", actorEmail: normalizedEmail,
                action: "Failed admin sign-in", summary: `Failed administrator sign-in attempt for ${normalizedEmail}`, entityType: "admin account", subject: normalizedEmail });

            return res.status(401).json({
                success: false,
                message:
                    "Invalid administrator email or password."
            });
        }


        // =====================================================
        // CHECK PASSWORD
        // =====================================================

        const passwordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );


        if (!passwordMatch) {

            await recordActivity({ req, actorRole: "admin", actorId: admin._id, actorName: admin.fullName, actorEmail: admin.email,
                action: "Failed admin sign-in", summary: `Failed administrator sign-in for ${admin.email}`, entityType: "admin account", entityId: admin._id, subject: admin.email });

            return res.status(401).json({
                success: false,
                message:
                    "Invalid administrator email or password."
            });
        }


        // =====================================================
        // CREATE JWT
        // =====================================================

        const token =
            jwt.sign(
                {
                    id:
                        admin._id.toString(),

                    email:
                        admin.email,

                    fullName:
                        admin.fullName,

                    role:
                        "ADMIN"
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "8h"
                }
            );

        await recordActivity({ req, actorRole: "admin", actorId: admin._id, actorName: admin.fullName, actorEmail: admin.email,
            action: "Admin signed in", summary: `${admin.fullName} signed in`, entityType: "admin account", entityId: admin._id, subject: admin.email });


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success: true,

            message:
                "Administrator login successful.",

            ...issueSession(req, res, token, "admin"),

            admin: {

                id:
                    admin._id,

                fullName:
                    admin.fullName,

                email:
                    admin.email,

                role:
                    admin.role
            }
        });

    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to login administrator."
        });
    }
});


// =========================================================
// PROTECTED ADMIN PROFILE
// =========================================================

router.get(
    "/me",
    adminAuth,
    async (req, res) => {

        try {

            const admin =
                await Admin.findById(
                    req.admin.id
                ).select("-password");


            if (!admin) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Administrator account not found."
                });
            }


            return res.status(200).json({

                success: true,

                admin
            });

        } catch (error) {

            console.error(
                "Admin profile error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to retrieve administrator."
            });
        }
    }
);

router.get("/audit-logs", adminAuth, getAdminActivity);
// =========================================================
// STAFF MANAGEMENT
// =========================================================
// Only authenticated administrators can manage staff.
// =========================================================


// =========================================================
// CREATE STAFF ACCOUNT
// =========================================================

router.post(
    "/staff",
    adminAuth,
    createStaff
);


// =========================================================
// GET ALL STAFF
// =========================================================

router.get(
    "/staff",
    adminAuth,
    getAllStaff
);


// =========================================================
// GET STAFF BY ID
// =========================================================

router.get(
    "/staff/:id",
    adminAuth,
    getStaffById
);


// =========================================================
// UPDATE STAFF
// =========================================================

router.put(
    "/staff/:id",
    adminAuth,
    updateStaff
);


// =========================================================
// DEACTIVATE STAFF
// =========================================================

router.put(
    "/staff/:id/deactivate",
    adminAuth,
    deactivateStaff
);


// =========================================================
// ACTIVATE STAFF
// =========================================================

router.put(
    "/staff/:id/activate",
    adminAuth,
    activateStaff
);


// =========================================================
// DELETE STAFF
// =========================================================

router.delete(
    "/staff/:id",
    adminAuth,
    deleteStaff
);

module.exports = router;
