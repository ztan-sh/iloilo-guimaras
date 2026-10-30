const mongoose = require("mongoose");

const emailProviderConfigSchema = new mongoose.Schema(
    {
        provider: { type: String, enum: ["gmail-oauth"], required: true, unique: true },
        senderEmail: { type: String, required: true, lowercase: true, trim: true },
        encryptedRefreshToken: { type: String, required: true, select: false },
        connectedAt: { type: Date, required: true },
        connectedBy: { type: String, default: "" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("EmailProviderConfig", emailProviderConfigSchema);
