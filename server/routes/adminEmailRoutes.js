const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const gmailOAuthService = require("../services/gmailOAuthService");

const router = express.Router();

router.get("/gmail/status", adminAuth, async (req, res) => {
    try {
        res.json(await gmailOAuthService.getStatus());
    } catch (error) {
        console.error("Gmail status error:", error.message);
        res.status(503).json({ message: "Gmail OAuth settings are incomplete on the server." });
    }
});

router.post("/gmail/connect", adminAuth, (req, res) => {
    try {
        res.json({ authorizationUrl: gmailOAuthService.createAuthorizationUrl(req.admin.adminId || req.admin.userId || req.admin.id) });
    } catch (error) {
        console.error("Gmail OAuth setup error:", error.message);
        res.status(503).json({ message: "Gmail OAuth settings are incomplete on the server." });
    }
});

// Google redirects here after the admin starts the connection from the
// authenticated endpoint. The signed, short-lived state protects this callback.
router.get("/gmail/callback", async (req, res) => {
    if (req.query.error) {
        return res.status(400).send("<h2>Gmail connection was not completed.</h2><p>You can close this page and try again from the admin account.</p>");
    }
    if (typeof req.query.code !== "string" || typeof req.query.state !== "string") {
        return res.status(400).send("<h2>Invalid Gmail authorization callback.</h2>");
    }
    try {
        const email = await gmailOAuthService.exchangeCodeAndConnect(req.query.code, req.query.state);
        return res.type("html").send(`<h2>Gmail connected</h2><p>Password reset messages can now be sent from ${escapeHtml(email)}.</p><p>You can close this page.</p>`);
    } catch (error) {
        console.error("Gmail OAuth callback failed:", error.message);
        return res.status(400).type("html").send(`<h2>Could not connect Gmail</h2><p>${escapeHtml(error.message)}</p><p>Check the server settings and authorized redirect address, then try again.</p>`);
    }
});

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[character]);
}

module.exports = router;
