import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    title: {
        type: String,
        // required: true
    },
    content: {
        type: String,
    },
    time: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
    },
    dummydate: {
        type: Date,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // required: true,
      },
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
