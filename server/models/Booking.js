const mongoose = require("mongoose");

const paymentProofSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            required: true
        },

        originalName: {
            type: String,
            required: true
        },

        fileType: {
            type: String,
            required: true
        },

        fileSize: {
            type: Number,
            required: true
        },

        url: {
            type: String,
            required: true
        },

        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: false
    }
);


// =========================================================
// PASSENGER DETAILS
// =========================================================
// Stores the complete list of passengers included in one
// booking. This allows the Admin to see the names, ages,
// and genders of the passenger's companions.
//
// Example:
//
// passengerDetails: [
//     {
//         name: "Katarina",
//         age: 22,
//         gender: "Female"
//     },
//     {
//         name: "Maria Santos",
//         age: 21,
//         gender: "Female"
//     }
// ]
//
// =========================================================

const passengerDetailsSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        age: {
            type: Number,
            required: true,
            min: 0
        },

        gender: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        _id: false
    }
);


const bookingSchema = new mongoose.Schema(
    {
        // Links each booking to the authenticated passenger account.
        // Optional so existing bookings without this field remain compatible.
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        bookingReference: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },


        // =========================
        // ROUTE
        // =========================

        origin: {
            type: String,
            required: true,
            trim: true
        },

        destination: {
            type: String,
            required: true,
            trim: true
        },


        // =========================
        // SCHEDULE
        // =========================

        // Ferry identity is stored with the booking so capacity
        // can always be assigned to the exact selected vessel.

        ferryId: {
            type: String,
            default: ""
        },

        ferryName: {
            type: String,
            default: ""
        },

        vesselName: {
            type: String,
            default: ""
        },

        departureTime: {
            type: String,
            default: ""
        },

        date: {
            type: String,
            required: true
        },

        time: {
            type: String,
            required: true
        },


        // =========================
        // PRIMARY PASSENGER
        // =========================

        passengerName: {
            type: String,
            required: true,
            trim: true
        },

        passengerAge: {
            type: Number,
            required: function () { return this.ticketSource !== "WALK_IN"; }
        },

        passengerGender: {
            type: String,
            required: function () { return this.ticketSource !== "WALK_IN"; }
        },

        passengers: {
            type: Number,
            required: true,
            min: 1
        },


        // =====================================================
        // COMPLETE PASSENGER LIST
        // =====================================================
        // This stores ALL passengers included in this booking.
        //
        // The first passenger normally corresponds to:
        // passengerName
        // passengerAge
        // passengerGender
        //
        // The remaining entries are the passenger's friends/
        // companions.
        //
        // default: [] is intentional so existing bookings
        // without this field will continue to work.
        // =====================================================

        passengerDetails: {
            type: [passengerDetailsSchema],
            default: []
        },


        // =========================
        // VEHICLE
        // =========================

        vehicleType: {
            type: String,
            required: true
        },

        motorcycleType: {
            type: String,
            enum: ["", "standard", "big-bike"],
            default: ""
        },

        plateNumber: {
            type: String,
            default: ""
        },


        // =========================
        // FARE
        // =========================

        passengerFare: {
            type: Number,
            required: true
        },

        motorcycleFare: {
            type: Number,
            required: true
        },

        ppaFee: {
            type: Number,
            required: true
        },

        requiredAmount: {
            type: Number,
            required: true
        },

        totalPaid: {
            type: Number,
            default: null
        },


        // =========================
        // PAYMENT
        // =========================

        paymentMethod: {
            type: String,
            required: true,
            default: "Maya / QRPh"
        },

        paymentStatus: {
            type: String,
            enum: [
                "PENDING VERIFICATION",
                "VERIFIED",
                "REJECTED"
            ],
            default: "PENDING VERIFICATION"
        },


        // =========================
        // BOARDING
        // =========================

        boardingStatus: {
            type: String,
            enum: [
                "NOT BOARDED",
                "ON BOARD",
                "REJECTED"
            ],
            default: "NOT BOARDED"
        },

        boardedAt: {
            type: Date,
            default: null
        },

        // =========================================================
        // ARRIVAL / TIME OUT
        // =========================================================
        // Set by staff when the passenger reaches the destination
        // and the ticket is scanned for the second time.
        // Existing bookings remain compatible because this is optional.

        timedOutAt: {
            type: Date,
            default: null
        },

        // =========================
        // STAFF REJECTION
        // =========================
        // Stores the reason provided by staff when boarding is rejected.
        // Existing bookings remain compatible because these fields are optional.

        rejectionReason: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500
        },

        rejectedAt: {
            type: Date,
            default: null
        },


        // =========================
        // BOOKING STATUS
        // =========================

        status: {
            type: String,
            enum: [
                "PENDING PAYMENT VERIFICATION",
                "CONFIRMED",
                "CANCELLED"
            ],
            default: "PENDING PAYMENT VERIFICATION"
        },


        // =========================
        // PAYMENT PROOF
        // =========================

        paymentProof: {
            type: paymentProofSchema,
            required: function () { return this.ticketSource !== "WALK_IN"; }
        },
        ticketSource: { type: String, enum: ["ONLINE", "WALK_IN"], default: "ONLINE" },
        contactNumber: { type: String, default: "" },
        motorcycleModel: { type: String, default: "" },
        accompanyingPassengers: { type: [String], default: [] },
        paidAt: { type: Date, default: null },
        recordedBy: { type: String, default: "" },
        recordedByName: { type: String, default: "" },
        boardedByName: { type: String, default: "" }
    },


    // =========================
    // TIMESTAMPS
    // =========================

    {
        timestamps: true
    }
);


module.exports = mongoose.model(
    "Booking",
    bookingSchema
);
