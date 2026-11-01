
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

router.get("/", protect, async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user.userId
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error("Load notifications error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load notifications."
        });
    }
});

router.patch("/read-all", protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.userId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );
        return res.json({ success: true, message: "All notifications marked as read." });
    } catch (error) {
        console.error("Mark all notifications read error:", error);
        return res.status(500).json({ success: false, message: "Unable to update notifications." });
    }
});

router.patch("/:id/read", protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.userId
            },
            {
                isRead: true,
                readAt: new Date()
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error("Update notification error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update notification."
        });
    }
});

module.exports = router;
