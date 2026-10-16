const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
    actorRole: { type: String, enum: ["admin", "staff"], required: true, index: true },
    actorId: { type: String, default: "", index: true },
    actorName: { type: String, required: true, trim: true },
    actorEmail: { type: String, default: "", trim: true, lowercase: true },
    action: { type: String, required: true, trim: true, maxlength: 100 },
    summary: { type: String, required: true, trim: true, maxlength: 500 },
    entityType: { type: String, default: "system", maxlength: 80 },
    entityId: { type: String, default: "", maxlength: 160 },
    subject: { type: String, default: "", maxlength: 240 },
    ipAddress: { type: String, default: "", maxlength: 100 },
    userAgent: { type: String, default: "", maxlength: 500 },
    details: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: true, updatedAt: false } });

AuditLogSchema.index({ actorRole: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
