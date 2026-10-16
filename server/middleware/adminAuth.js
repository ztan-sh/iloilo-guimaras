const jwt = require("jsonwebtoken");
const { attachMutationAudit } = require("../utils/activityAudit");

const adminAuth = (req, res, next) => {

    try {

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const token =
            authHeader.split(" ")[1];

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

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
