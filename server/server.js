const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);
const pricingRoutes = require("./routes/pricingRoutes");



const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB =
    require("./config/database");

const staffAuthRoutes =
    require("./routes/staffAuthRoutes");

const adminStaffRoutes =
    require("./routes/adminStaffRoutes");


dotenv.config();

const app = express();
app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    if (process.env.NODE_ENV === "production" && req.secure) {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
});


// ===============================
// CORS
// ===============================
//
// Allow:
// 1. Local Vite development
// 2. Production Vercel website
// 3. Android Capacitor application
// 4. Requests without an Origin header
//

const allowedOrigins = [

    // Local development
    "http://localhost:5173",
    "http://localhost:5174",

    // Capacitor Android
    "http://localhost",
    "https://localhost",
    "capacitor://localhost",

    // Production website
    "https://iloilo-guimaras.vercel.app",
    ...(process.env.WEB_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean)
];


app.use(
    cors({

        origin: (
            origin,
            callback
        ) => {

            // Native Android requests may not
            // always provide an Origin header.
            if (!origin) {

                return callback(
                    null,
                    true
                );

            }


            if (
                allowedOrigins.includes(
                    origin
                )
            ) {

                return callback(
                    null,
                    true
                );

            }


            console.log(
                "Blocked CORS origin:",
                origin
            );


            return callback(
                new Error(
                    "Not allowed by CORS"
                )
            );

        },

        credentials: true

    })
);


app.use(
    // Profile and discount ID photos can both be included in a profile update.
    express.json({ limit: "16mb" })
);


// ===============================
// MONGODB
// ===============================

connectDB();


// ===============================
// TEST
// ===============================

app.get(
    "/",
    (req, res) => {

        res.json({

            message:
                "Iloilo-Guimaras Ferry Ticketing API is running!",

            database:
                "MongoDB"

        });

    }
);


// ===============================
// AUTH
// ===============================

const authRoutes =
    require("./routes/authRoutes");


app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/staff-auth",
    staffAuthRoutes
);


// ===============================
// ADMIN
// ===============================

const adminRoutes =
    require("./routes/adminRoutes");


app.use(
    "/api/admin",
    adminRoutes
);

app.use(
    "/api/admin/email",
    require("./routes/adminEmailRoutes")
);


app.use(
    "/api/admin/staff",
    adminStaffRoutes
);


// ===============================
// PASSENGER NOTIFICATIONS
// ===============================
// Passenger-authenticated routes. Each account can only read/update
// notifications whose userId matches the verified JWT user.
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

// ===============================
// PAYMENT
// ===============================

const paymentRoutes =
    require("./routes/paymentRoutes");


app.use(
    "/api/payment",
    paymentRoutes
);


// ===============================
// BOOKING
// ===============================
//
// Passenger booking operations and
// admin payment verification.
//

const bookingRoutes =
    require("./routes/bookingRoutes");


app.use(
    "/api/bookings",
    bookingRoutes
);


// ===============================
// FERRY CLOSURE
// ===============================
//
// Ferry online booking availability
// and Admin ferry closure control.
//

const ferryClosureRoutes =
    require("./routes/ferryClosureRoutes");


app.use(
    "/api/ferry-closures",
    ferryClosureRoutes
);

app.use("/api/pricing", pricingRoutes);

// ===============================
// STAFF
// ===============================
//
// Staff QR scanning and boarding
// verification.
//

const staffRoutes =
    require("./routes/staffRoutes");


app.use(
    "/api/staff",
    staffRoutes
);


// Return a readable response for unknown API and website routes.
app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        code: "API_ROUTE_NOT_FOUND",
        message: `This API route was not found (404): ${req.method} ${req.originalUrl}. Check the address and try again.`
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        code: "ROUTE_NOT_FOUND",
        message: `This route was not found (404): ${req.method} ${req.originalUrl}. Check the address and try again.`
    });
});

// Handle malformed requests, upload limits, CORS rejections and unexpected
// server errors in one place without exposing stack traces to clients.
app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    const status = Number(error.status || error.statusCode) ||
        (error.message === "Not allowed by CORS" ? 403 : 500);
    const safeStatus = status >= 400 && status <= 599 ? status : 500;
    const messages = {
        400: "The request could not be understood (400). Check the information and try again.",
        401: "Please sign in again to continue (401).",
        403: "This request is not allowed (403). Check your access and try again.",
        404: "The requested page or record was not found (404). Check the address and try again.",
        413: "The uploaded file is too large (413). Choose a smaller file and try again.",
        429: "There have been too many requests (429). Wait a moment and try again."
    };
    const message = safeStatus >= 500
        ? `The server encountered an error (${safeStatus}). Check your internet connection and try again later.`
        : messages[safeStatus] || error.message || `The request failed (${safeStatus}).`;

    if (safeStatus >= 500) {
        console.error("Unhandled server error:", error);
    }

    res.status(safeStatus).json({
        success: false,
        code: error.code || `HTTP_${safeStatus}`,
        message
    });
});

// ===============================
// SERVER
// ===============================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

    }
);
