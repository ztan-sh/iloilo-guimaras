const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);


const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

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
    "https://iloilo-guimaras-ticketing-system-gules.vercel.app"
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
    express.json()
);


// ===============================
// UPLOADS
// ===============================

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
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
    "/api/admin/staff",
    adminStaffRoutes
);


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