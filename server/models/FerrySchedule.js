const mongoose = require("mongoose");

const FerryScheduleSchema = new mongoose.Schema(
    {
        vesselName: {
            type: String,
            required: true,
            trim: true
        },

        route: {
            type: String,
            required: true,
            enum: [
                "Iloilo → Guimaras",
                "Guimaras → Iloilo"
            ]
        },

        date: {
            type: String,
            required: true,
            match: /^\d{4}-\d{2}-\d{2}$/
        },

        departureTime: {
            type: String,
            required: true,
            match: /^\d{2}:\d{2}$/
        },

        time: {
            type: String,
            required: true,
            match: /^\d{2}:\d{2}$/
        },

        arrivalTime: {
            type: String,
            default: ""
        },

        passengerCapacity: {
            type: Number,
            default: 100,
            min: 1
        },

        motorcycleCapacity: {
            type: Number,
            default: 10,
            min: 0
        },

        isDefault: {
            type: Boolean,
            default: false
        },

        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

FerryScheduleSchema.index(
    {
        date: 1,
        vesselName: 1,
        departureTime: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "FerrySchedule",
    FerryScheduleSchema
);
