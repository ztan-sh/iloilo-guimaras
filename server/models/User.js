const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        phoneNumber: {
            type: String,
            required: true,
            trim: true
        },

        age: { type: Number, min: 0, max: 120, default: undefined },
        gender: { type: String, trim: true, default: "" },
        category: { type: String, enum: ["Regular", "Student", "PWD"], default: "Regular" },
        discountIdPhoto: { type: String, default: "" },

        password: {
            type: String,
            required: true
        },

        passwordResetTokenHash: {
            type: String,
            default: undefined,
            select: false
        },

        passwordResetExpiresAt: {
            type: Date,
            default: undefined,
            select: false
        },

        profilePicture: {
            type: String,
            default: ""
        },

        notificationsEnabled: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "User",
    userSchema
);
