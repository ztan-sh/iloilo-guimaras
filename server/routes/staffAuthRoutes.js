const express = require("express");

const router = express.Router();

const {
    loginStaff,
    getCurrentStaff
} = require("../controllers/staffAuthController");

const staffAuth =
    require("../middleware/staffAuth");
const { getStaffActivity } = require("../controllers/activityAuditController");


// =========================================================
// STAFF LOGIN
// =========================================================

router.post(
    "/login",
    loginStaff
);


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
