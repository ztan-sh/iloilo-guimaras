const jwt = require("jsonwebtoken");
const { readCookie, assertCookieMutationOrigin } = require("../utils/authSession");

const protect = async (req, res, next) => {

    try {

        const authHeader = req.headers.authorization || "";
        const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        const cookieToken = readCookie(req, "ggo_user_session");
        const token = bearerToken || cookieToken;
        if (!token) {
            return res.status(401).json({
                message:
                    "Authentication required."
            });
        }

        let sessionFromCookie = !bearerToken && Boolean(cookieToken);
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (!cookieToken || !bearerToken) throw error;
            decoded = jwt.verify(cookieToken, process.env.JWT_SECRET);
            sessionFromCookie = true;
        }

        if (sessionFromCookie && !assertCookieMutationOrigin(req)) {
            return res.status(403).json({ message: "Request origin could not be verified." });
        }

        req.user = decoded;

        next();

    } catch (error) {

        console.error(
            "Authentication Error:",
            error
        );

        return res.status(401).json({
            message:
                "Invalid or expired authentication token."
        });
    }
};

module.exports = protect;
