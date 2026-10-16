const mongoose = require("mongoose");


// =========================================================
// FERRY CLOSURE SCHEMA
// =========================================================
//
// Stores the online booking availability of a specific ferry
// for a specific date.
//
// This is separate from the Booking model so your existing
// booking records and working booking logic remain untouched.
//
// Example:
//
// date: "2026-08-31"
// ferryId: "MV-HALILI"
// ferryName: "MV Halili"
// isClosed: true
//
// =========================================================

const ferryClosureSchema = new mongoose.Schema(
    {

        // =====================================================
        // DATE
        // =====================================================
        //
        // The date for which online booking is being controlled.
        //

        date: {
            type: String,
            required: true,
            trim: true
        },


        // =====================================================
        // FERRY ID
        // =====================================================
        //
        // Unique identifier of the ferry.
        //

        ferryId: {
            type: String,
            required: true,
            trim: true
        },


        // =====================================================
        // FERRY NAME
        // =====================================================

        ferryName: {
            type: String,
            required: true,
            trim: true
        },


        // =====================================================
        // ONLINE BOOKING STATUS
        // =====================================================
        //
        // false = Online booking is OPEN
        // true  = Online booking is CLOSED
        //

        isClosed: {
            type: Boolean,
            default: false
        },


        // =====================================================
        // CLOSED AT
        // =====================================================
        //
        // Stores when the administrator closed the ferry.
        //

        closedAt: {
            type: Date,
            default: null
        },


        // =====================================================
        // UPDATED AT
        // =====================================================
        //
        // MongoDB timestamps below will automatically maintain
        // createdAt and updatedAt.
        //

    },
    {
        timestamps: true
    }
);


// =========================================================
// UNIQUE FERRY + DATE
// =========================================================
//
// A ferry should have only one online-booking status for
// each specific date.
//
// Example:
//
// MV Halili + 2026-08-31
//
// cannot have duplicate closure records.
//

ferryClosureSchema.index(
    {
        date: 1,
        ferryId: 1
    },
    {
        unique: true
    }
);


// =========================================================
// EXPORT
// =========================================================

const FerryClosure = mongoose.models.FerryClosure || mongoose.model("FerryClosure", ferryClosureSchema);
const scheduleDayControlSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true, trim: true },
    suppressDefaults: { type: Boolean, default: true }
}, { timestamps: true });
const ScheduleDayControl = mongoose.models.ScheduleDayControl || mongoose.model("ScheduleDayControl", scheduleDayControlSchema);
FerryClosure.ScheduleDayControl = ScheduleDayControl;
module.exports = FerryClosure;