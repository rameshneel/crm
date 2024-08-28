import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import Appointment from "../models/appointement.model.js";
import { User } from "../models/user.model.js";

const addAppointment = asyncHandler(async (req, res, next) => {
  const { lead_id } = req.params;
  const user = req.user?._id;
  if (!isValidObjectId(lead_id)) {
    throw new ApiError(400, "Invalid lead_id");
  }
  try {
    const { title, content, time, date } = req.body;

    const d1 = new Date(date);
    const datetimes = new Date(date).toLocaleDateString();
    console.log("date:", datetimes);
    console.log("time", time);

    const timeParts = time.split(":");
    console.log(timeParts);
    const d = `${date}T${time}:00.000+00:00`;
    console.log(d);

    const existingAppointment = await Appointment.findOne({ time, date: d });

    if (existingAppointment) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "An appointment already exists for this date and time"
          )
        );
    }
    const appointment = await Appointment.create({
      title,
      content,
      time,
      date: d,
      lead: lead_id,
      dummydate: d1,
      createdBy: user,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(200, appointment, "Appointment Added Successfully")
      );
  } catch (error) {
    return next(error);
  }
});

const deleteAppointment = asyncHandler(async (req, res, next) => {
  const { appointment_id } = req.params;
  if (!isValidObjectId(appointment_id)) {
    throw new ApiError(400, "Invalid appointment_id");
  }
  try {
    const deletedAppointment = await Appointment.findByIdAndDelete(
      appointment_id
    );

    if (!deletedAppointment) {
      throw new ApiError(404, "Appointment not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Appointment Deleted Successfully"));
  } catch (error) {
    throw error;
  }
});

const updateAppointment = asyncHandler(async (req, res, next) => {
  const { appointment_id } = req.params;
  console.log(appointment_id);
  if (!isValidObjectId(appointment_id)) {
    throw new ApiError(400, "Invalid appointment_id");
  }
  const app = await Appointment.findById(appointment_id);
  if (!app) {
    throw new ApiError(400, "appointment_id not fond");
  }
  try {
    const { title, content, time, date } = req.body;

    const existingAppointment = await Appointment.findOne({
      time,
      dummydate: date,
    });

    if (
      existingAppointment &&
      existingAppointment._id.toString() !== appointment_id
    ) {
      // Another appointment exists at the updated time
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Another appointment already exists at the updated time and date"
          )
        );
    }
    const d = `${date}T${time}:00.000+00:00`;
    console.log("update d value = ", d);
    // No appointment exists at the updated time or it's the same appointment being updated, proceed with updating
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointment_id,
      {
        title,
        content,
        time,
        date: d,
      },
      { new: true }
    );

    if (!updatedAppointment) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Appointment not found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedAppointment,
          "Appointment Updated Successfully"
        )
      );
  } catch (error) {
    return next(error);
  }
});

const getAppointmentsByDate = asyncHandler(async (req, res, next) => {
  const { date } = req.query;
  const userId = req.user?._id;
  const { lead_id } = req.params;
  if (!isValidObjectId(lead_id)) {
    throw new ApiError(400, "Invalid lead_id");
  }

  if (!date) {
    throw new ApiError(400, "Date is required");
  }
  try {
    const searchDate = date + "T00:00:00.000Z";
    console.log("search date =", searchDate);
    let appointments;
    const user = await User.findById(userId);
    console.log(user);
    if (user.role === "admin") {
      appointments = await Appointment.find({
        dummydate: searchDate,
        lead: lead_id,
      });
      console.log(appointments);
    } else if (user.role === "salesman") {
      appointments = await Appointment.find({
        dummydate: { $eq: searchDate },
        lead: lead_id,
      }).populate({ path: "generated_by" });
      console.log(appointments);
    }
    if (appointments.length === 0) {
      throw new ApiError(202, "Appointment not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          appointments,
          "Appointments Retrieved Successfully"
        )
      );
  } catch (error) {
    return next(error);
  }
});

const getAllAppointments = asyncHandler(async (req, res, next) => {
  try {
    const user_id = req.user?._id;
    const user = await User.findById(user_id);
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }
    let appointments;
    if (user.role === "admin") {
      appointments = await Appointment.find().populate("lead").populate({
        path: "createdBy",
        select: "fullName avatar",
      });
    } else {
      return next(new ApiError(403, "Unauthorized access"));
    }

    if (appointments.length === 0) {
      throw new ApiError(202, "Appointment not found");
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          appointments,
          "Appointments all retrieved successfully"
        )
      );
  } catch (error) {
    next(error);
  }
});

const getAppointmentBySingle = asyncHandler(async (req, res, next) => {
  try {
    const user_id = req.user?._id;
    const appointmentId = req.params.id; // Assuming appointment ID is passed as a URL parameter

    // Find the user making the request
    const user = await User.findById(user_id);

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    let appointment;

    // Check user role
    if (user.role === "admin") {
      // Admin can access any appointment
      appointment = await Appointment.findById(appointmentId)
        .populate("lead")
        .populate({
          path: "createdBy",
          select: "fullName avatar",
        });
    } else if (user.role === "salesman") {
      // Salesman can only access appointments they created
      appointment = await Appointment.findOne({
        _id: appointmentId,
        createdBy: user._id,
      })
        .populate("lead")
        .populate({
          path: "createdBy",
          select: "fullName avatar",
        });
    } else {
      // If the user role is neither "admin" nor "salesman"
      return next(new ApiError(403, "Unauthorized access"));
    }

    // Check if the appointment was found
    if (!appointment) {
      return next(new ApiError(404, "Appointment not found"));
    }

    // Send the response with the appointment data
    res.status(200).json(
      new ApiResponse(
        200,
        appointment,
        "Appointment retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
});



export {
  addAppointment,
  deleteAppointment,
  updateAppointment,
  getAppointmentsByDate,
  getAllAppointments,
  getAppointmentBySingle
};
