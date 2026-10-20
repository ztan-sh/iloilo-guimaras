const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");
const { attachMutationAudit } = require("../utils/activityAudit");
const { readCookie, assertCookieMutationOrigin } = require("../utils/authSession");


// =========================================================
// STAFF AUTHENTICATION MIDDLEWARE
// =========================================================
//
// This middleware protects staff-only routes.
//
// The staff must send:
//
// Authorization: Bearer <staff_jwt_token>
//
// The token is created when the staff successfully logs in.
// =========================================================


const staffAuth = async (req, res, next) => {

    try {

        // =================================================
        // GET AUTHORIZATION HEADER
        // =================================================

        const authHeader = req.headers.authorization || "";
        const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        const cookieToken = readCookie(req, "ggo_staff_session");


        // =================================================
        // CHECK IF TOKEN EXISTS
        // =================================================

        if (!bearerToken && !cookieToken) {

            return res.status(401).json({
                success: false,
                message:
                    "Staff authentication required."
            });
        }


        // =================================================
        // EXTRACT TOKEN
        // =================================================

        // =================================================
        // VERIFY JWT
        // =================================================

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


        // =================================================
        // CHECK STAFF ROLE
        // =================================================
        //
        // Our Staff model uses:
        //
        // role: "staff"
        //
        // Therefore the JWT should contain:
        //
        // role: "staff"
        //
        // =================================================

        if (
            !decoded.role ||
            decoded.role.toLowerCase() !== "staff"
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Staff access required."
            });
        }

        const staff = decoded.staffId
            ? await Staff.findById(decoded.staffId).select("isActive")
            : null;
        if (!staff) {
            return res.status(401).json({
                success: false,
                message: "This staff account is no longer available. Please sign in again."
            });
        }
        if (!staff.isActive) {
            return res.status(403).json({
                success: false,
                message: "This staff account has been deactivated."
            });
        }


        // =================================================
        // STORE STAFF INFORMATION
        // =================================================
        //
        // The controller can access:
        //
        // req.staff
        //
        // =================================================

        req.staff = decoded;
        attachMutationAudit(req, res, "staff", decoded);


        // =================================================
        // CONTINUE TO CONTROLLER
        // =================================================

        next();

    } catch (error) {

        console.error(
            "Staff authentication error:",
            error
        );


        // =================================================
        // INVALID / EXPIRED TOKEN
        // =================================================

        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired staff session."
        });
    }
};


module.exports = staffAuth;
