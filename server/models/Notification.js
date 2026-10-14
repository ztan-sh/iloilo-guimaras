const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, default: "booking_update", trim: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 1200 },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    bookingReference: { type: String, default: "", trim: true },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null }
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
