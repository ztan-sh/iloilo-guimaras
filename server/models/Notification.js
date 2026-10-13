
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        bookingReference: {
            type: String,
            default: ""
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        cancellationReason: {
            type: String,
            default: ""
        },
        isRead: {
            type: Boolean,
            default: false
        },
        readAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);
