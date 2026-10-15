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

const router = express.Router();


// =========================================================
// REGISTER
// =========================================================

router.post(
    "/register",
    register
);


// =========================================================
// LOGIN
// =========================================================

router.post(
    "/login",
    login
);

router.post("/password-reset/request", requestPasswordReset);
router.post("/password-reset/confirm", resetPassword);


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


module.exports = router;
