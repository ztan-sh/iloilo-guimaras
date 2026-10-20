const mongoose = require("mongoose");

const discountRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    passengerId: { type: String, required: true, trim: true, maxlength: 128 },
    passengerName: { type: String, required: true, trim: true, maxlength: 150 },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ["Student", "PWD", "Senior"] },
    photo: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "requested"], default: "pending" },
    reason: { type: String, default: "", trim: true, maxlength: 500 },
    source: { type: String, default: "Passenger account", trim: true, maxlength: 200 },
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: Date, default: null }
}, { timestamps: true });

discountRequestSchema.index({ userId: 1, passengerId: 1 }, { unique: true });
discountRequestSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model("DiscountRequest", discountRequestSchema);
