const express = require("express");

const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    updateNotificationPreference
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const createRateLimiter = require("../middleware/rateLimitMiddleware");
const { createOwnRequest, getOwnRequests } = require("../controllers/discountController");

const router = express.Router();
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many sign-in attempts. Please try again later." });
const registerLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, message: "Too many registration attempts. Please try again later." });
const resetRequestLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, message: "Too many password reset requests. Please try again later." });
const resetConfirmLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many password reset attempts. Please try again later." });
const { clearSession, readCookie, assertCookieMutationOrigin } = require("../utils/authSession");


// =========================================================
// REGISTER
// =========================================================

router.post(
    "/register",
    registerLimiter,
    register
);


// =========================================================
// LOGIN
// =========================================================

router.post(
    "/login",
    loginLimiter,
    login
);

router.post("/password-reset/request", resetRequestLimiter, requestPasswordReset);
router.post("/password-reset/confirm", resetConfirmLimiter, resetPassword);
router.post("/logout", (req, res) => {
    if (readCookie(req, "ggo_user_session") && !assertCookieMutationOrigin(req)) return res.status(403).json({ message: "Request origin could not be verified." });
    clearSession(res, "user");
    return res.status(200).json({ success: true });
});


// =========================================================
// CURRENT USER
// =========================================================

router.get(
    "/me",
    protect,
    getMe
);


// =========================================================
// UPDATE PROFILE
// =========================================================

router.put(
    "/profile",
    protect,
    updateProfile
);


// =========================================================
// CHANGE PASSWORD
// =========================================================

router.put(
    "/password",
    protect,
    changePassword
);

// =========================================================
// UPDATE NOTIFICATION PREFERENCE
// =========================================================

router.put(
    "/notifications",
    protect,
    updateNotificationPreference
);

router.get("/discount-requests", protect, getOwnRequests);
router.post("/discount-requests", protect, createOwnRequest);


module.exports = router;
