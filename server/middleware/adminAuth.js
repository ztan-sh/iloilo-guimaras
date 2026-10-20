const jwt = require("jsonwebtoken");
const { attachMutationAudit } = require("../utils/activityAudit");
const { readCookie, assertCookieMutationOrigin } = require("../utils/authSession");

const adminAuth = (req, res, next) => {

    try {

        const authHeader = req.headers.authorization || "";
        const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        const cookieToken = readCookie(req, "ggo_admin_session");
        if (!bearerToken && !cookieToken) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        let sessionFromCookie = !bearerToken && Boolean(cookieToken);
        let decoded;
        try {
            decoded = jwt.verify(bearerToken || cookieToken, process.env.JWT_SECRET);
        } catch (error) {
            if (!cookieToken || !bearerToken) throw error;
            decoded = jwt.verify(cookieToken, process.env.JWT_SECRET);
            sessionFromCookie = true;
        }

        if (sessionFromCookie && !assertCookieMutationOrigin(req)) {
            return res.status(403).json({ success: false, message: "Request origin could not be verified." });
        }

        if (decoded.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Admin access required."
            });
        }

        req.admin = decoded;
        attachMutationAudit(req, res, "admin", decoded);

        next();

    } catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired admin session."
        });
    }
};

module.exports = adminAuth;
