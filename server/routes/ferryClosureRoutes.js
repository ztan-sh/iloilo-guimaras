const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const {
    getFerryClosures,
    getFerryClosure,
    closeFerry,
    openFerry
} = require("../controllers/ferryClosureController");

const router = express.Router();

router.get("/", adminAuth, getFerryClosures);
router.get("/:date/:ferryId", getFerryClosure);
router.put("/close", adminAuth, closeFerry);
router.put("/open", adminAuth, openFerry);

module.exports = router;
