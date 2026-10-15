const mongoose = require("mongoose");

const vesselPricingSchema = new mongoose.Schema(
    {
        vesselName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 120
        },
        solo: { type: Number, required: true, min: 0.01 },
        motorcycle: { type: Number, required: true, min: 0.01, default: 285 },
        smallBikeStamp: { type: Number, required: true, min: 0, default: 5 },
        bigBike: { type: Number, required: true, min: 0.01, default: 353 },
        bigBikeStamp: { type: Number, required: true, min: 0, default: 7 },
        companion: { type: Number, required: true, min: 0.01 },
        student: { type: Number, required: true, min: 0, max: 100 },
        pwd: { type: Number, required: true, min: 0, max: 100 },
        senior: { type: Number, required: true, min: 0, max: 100 },
        ppa: { type: Number, required: true, min: 0 }
    },
    { timestamps: true }
);

module.exports = mongoose.model("VesselPricing", vesselPricingSchema);