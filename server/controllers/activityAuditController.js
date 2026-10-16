const AuditLog = require("../models/AuditLog");

const getStaffActivity = async (req, res) => {
    try {
        const logs = await AuditLog.find({ actorRole: "staff", actorId: String(req.staff.staffId) })
            .sort({ createdAt: -1 }).limit(250).lean();
        res.json({ success: true, logs });
    } catch (error) {
        console.error("Staff activity read error:", error);
        res.status(500).json({ success: false, message: "Unable to load staff activity." });
    }
};

const getAdminActivity = async (req, res) => {
    const actorRole = ["staff", "admin"].includes(req.query.actorRole) ? req.query.actorRole : "staff";
    const limit = Math.min(500, Math.max(1, Number.parseInt(req.query.limit, 10) || 250));
    try {
        const logs = await AuditLog.find({ actorRole }).sort({ createdAt: -1 }).limit(limit).lean();
        res.json({ success: true, actorRole, logs });
    } catch (error) {
        console.error("Admin activity read error:", error);
        res.status(500).json({ success: false, message: "Unable to load activity records." });
    }
};

module.exports = { getStaffActivity, getAdminActivity };
