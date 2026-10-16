const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");
const { attachMutationAudit } = require("../utils/activityAudit");


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

        const authHeader =
            req.headers.authorization;


        // =================================================
        // CHECK IF TOKEN EXISTS
        // =================================================

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Staff authentication required."
            });
        }


        // =================================================
        // EXTRACT TOKEN
        // =================================================

        const token =
            authHeader.split(" ")[1];


        if (!token) {

            return res.status(401).json({
                success: false,
                message:
                    "Staff authentication token is missing."
            });
        }


        // =================================================
        // VERIFY JWT
        // =================================================

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


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
