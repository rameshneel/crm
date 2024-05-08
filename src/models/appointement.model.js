import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    appointmentType: {
        type: String,
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    durationInMinutes: {
        type: Number,
        required: true
    },
    location: {
        type: String
    },
    reminderEnabled: {
        type: Boolean,
        default: false
    },
    cancellationPolicy: {
        type: String,
        default: "24 hours prior notice required for cancellation"
    }
});

// Create appointment model
const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
