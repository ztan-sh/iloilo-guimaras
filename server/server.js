const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);
const pricingRoutes = require("./routes/pricingRoutes");



const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const connectDB =
    require("./config/database");

const staffAuthRoutes =
    require("./routes/staffAuthRoutes");

const adminStaffRoutes =
    require("./routes/adminStaffRoutes");


dotenv.config();

const app = express();


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
    "https://iloilo-guimaras.vercel.app"
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
    // A validated profile photo may be sent as a base64 data URL (up to 5 MB).
    express.json({ limit: "8mb" })
);


// ===============================
// UPLOADS
// ===============================

// =====================================================
// PAYMENT PROOF FILE SERVING
// Existing local uploads remain available as a fallback.
// New uploads are stored in MongoDB GridFS so they persist
// across Render restarts and redeployments.
// =====================================================

const LOCAL_UPLOAD_DIR = path.join(__dirname, "uploads");

app.use(
    "/uploads",
    express.static(LOCAL_UPLOAD_DIR, {
        fallthrough: true,
        index: false
    })
);

// Keep the existing /uploads/payment-proofs/<filename> URL
// so the current admin receipt links can continue to work.
// If the file is not on disk, look it up in MongoDB GridFS.
app.get("/uploads/payment-proofs/:filename", async (req, res, next) => {
    try {
        const filename = path.basename(req.params.filename || "");

        if (!filename || filename !== req.params.filename) {
            return res.status(400).send("Invalid payment proof filename.");
        }

        if (!mongoose.connection.db) {
            return res.status(503).send("Payment proof storage is not ready.");
        }

        const { GridFSBucket } = require("mongodb");
        const bucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: "paymentProofs"
        });

        const files = await bucket.find({ filename }).toArray();
        if (!files.length) {
            return res.status(404).send("Payment proof not found.");
        }

        const file = files[files.length - 1];
        res.set("Content-Type", file.metadata?.contentType || "application/octet-stream");
        res.set("Content-Disposition", `inline; filename="${filename}"`);
        res.set("Cache-Control", "private, max-age=300");

        const downloadStream = bucket.openDownloadStream(file._id);
        downloadStream.on("error", (error) => {
            if (!res.headersSent) {
                next(error);
            } else {
                res.destroy(error);
            }
        });
        downloadStream.pipe(res);
    } catch (error) {
        console.error("Payment proof retrieval error:", error);
        if (!res.headersSent) {
            res.status(500).send("Unable to retrieve payment proof.");
        }
    }
});


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
