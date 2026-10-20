const express = require("express");

const router = express.Router();

const {
    loginStaff,
    getCurrentStaff
} = require("../controllers/staffAuthController");

const staffAuth =
    require("../middleware/staffAuth");
const { getStaffActivity } = require("../controllers/activityAuditController");
const createRateLimiter = require("../middleware/rateLimitMiddleware");
const staffLoginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 8, message: "Too many staff sign-in attempts. Please try again later." });
const { clearSession, readCookie, assertCookieMutationOrigin } = require("../utils/authSession");


// =========================================================
// STAFF LOGIN
// =========================================================

router.post(
    "/login",
    staffLoginLimiter,
    loginStaff
);

router.post("/logout", (req, res) => {
    if (readCookie(req, "ggo_staff_session") && !assertCookieMutationOrigin(req)) return res.status(403).json({ message: "Request origin could not be verified." });
    clearSession(res, "staff");
    return res.status(200).json({ success: true });
});


// =========================================================
// CURRENT STAFF
// =========================================================

router.get(
    "/me",
    staffAuth,
    getCurrentStaff
);

router.get("/activity", staffAuth, getStaffActivity);


module.exports = router;
