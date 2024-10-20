import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import Appointment from "../models/appointement.model.js";
import { User } from "../models/user.model.js";
import { createNotifications } from "./notification.controllers.js";

const addAppointment = asyncHandler(async (req, res, next) => {
  const { lead_id } = req.params;
  const user = req.user?._id;
  if (!isValidObjectId(lead_id)) {
    throw new ApiError(400, "Invalid lead_id");
  }
  try {
    const { title, content, time, date } = req.body;
    const d1 = new Date(date);
    const datetimes = d1.toLocaleDateString();
    console.log("date:", datetimes);
    console.log("time", time);

    const timeParts = time.split(":");
    console.log(timeParts);

    // Create a combined date-time string in ISO format
    const d = `${date}T${time}:00.000+00:00`;
    console.log(d);

    // Convert the provided date and time to a Date object
    const appointmentDateTime = new Date(d);

    // Check if the provided date and time are in the past
    if (appointmentDateTime < new Date()) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Cannot book an appointment for a past date and time"
          )
        );
    }

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
    // Notification Logic
    const notificationData = {
      title: `New Appointment Scheduled for Lead: ${lead_id}`,
      message: `A new appointment has been scheduled for the lead with ID: ${lead_id} on ${date} at ${time}. Please check the details!`,
      category: "assigned_to_me",
      assignedTo: user, // Assuming the creator of the appointment should receive the notification
      assignedBy: user,
      mentionedUsers: [],
      item: appointment._id, // Use the created appointment ID
      itemType: "Appointment", // Correct item type
      linkUrl: `https://high-oaks-media-crm.vercel.app/appointments/${appointment._id}`,
      createdBy: user,
    };

    await createNotifications(notificationData);
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

// const updateAppointment = asyncHandler(async (req, res, next) => {
//   const { appointment_id } = req.params;
//   console.log(appointment_id);
//   if (!isValidObjectId(appointment_id)) {
//     throw new ApiError(400, "Invalid appointment_id");
//   }

//   const app = await Appointment.findById(appointment_id);
//   if (!app) {
//     throw new ApiError(400, "appointment_id not fond");
//   }
//   try {
//     const { title, content, time, date } = req.body;

//     const existingAppointment = await Appointment.findOne({
//       time,
//       dummydate: date,
//     });

//     if (
//       existingAppointment &&
//       existingAppointment._id.toString() !== appointment_id
//     ) {
//       // Another appointment exists at the updated time
//       return res
//         .status(400)
//         .json(
//           new ApiResponse(
//             400,
//             null,
//             "Another appointment already exists at the updated time and date"
//           )
//         );
//     }
//     const d = `${date}T${time}:00.000+00:00`;
//     console.log("update d value = ", d);
//     // No appointment exists at the updated time or it's the same appointment being updated, proceed with updating
//     const updatedAppointment = await Appointment.findByIdAndUpdate(
//       appointment_id,
//       {
//         title,
//         content,
//         time,
//         date: d,
//       },
//       { new: true }
//     );

//     if (!updatedAppointment) {
//       return res
//         .status(404)
//         .json(new ApiResponse(404, null, "Appointment not found"));
//     }

//     return res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           updatedAppointment,
//           "Appointment Updated Successfully"
//         )
//       );
//   } catch (error) {
//     return next(error);
//   }
// });

const updateAppointment = asyncHandler(async (req, res, next) => {
  const { appointment_id } = req.params;

  // Validate appointment ID
  if (!isValidObjectId(appointment_id)) {
    return next(new ApiError(400, "Invalid appointment_id"));
  }

  // Find the appointment by ID
  const appointment = await Appointment.findById(appointment_id);
  if (!appointment) {
    return next(new ApiError(404, "Appointment not found"));
  }

  const { title, content, time, date } = req.body;

  // Validate input fields
  if (!title || !content || !time || !date) {
    return next(
      new ApiError(400, "All fields (title, content, time, date) are required")
    );
  }

  // Create a combined date-time object
  const newDateTime = new Date(`${date}T${time}:00.000+00:00`);

  // Check if the provided date and time are in the past
  if (newDateTime < new Date()) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "Cannot update the appointment to a past date and time"
        )
      );
  }

  // Check if an appointment exists with the same date and time, excluding the current one
  const existingAppointment = await Appointment.findOne({
    time,
    dummydate: date,
    _id: { $ne: appointment_id }, // Exclude the current appointment from the search
  });

  if (existingAppointment) {
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

  // Prepare the updated appointment data
  const updatedData = {
    title,
    content,
    time,
    date: newDateTime.toISOString(), // Use a consistent date-time format
  };

  // Update the appointment
  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointment_id,
    updatedData,
    { new: true }
  );

  if (!updatedAppointment) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Appointment not found after update"));
  }
    // Notification Logic
    const notificationData = {
      title: `Appointment Updated: ${appointment.title}`,
      message: `The appointment titled "${appointment.title}" has been updated successfully. Please check the new details!`,
      category: "assigned_to_me",
      assignedTo: appointment.createdBy, // Assuming the creator of the appointment should receive the notification
      assignedBy: req.user._id,
      mentionedUsers: [],
      item: updatedAppointment._id, // Use the updated appointment ID
      itemType: "Appointment", // Correct item type
      linkUrl: `https://high-oaks-media-crm.vercel.app/appointments/${updatedAppointment._id}`,
      createdBy: req.user._id,
    };
  
    await createNotifications(notificationData);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedAppointment,
        "Appointment updated successfully"
      )
    );
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
    res
      .status(200)
      .json(
        new ApiResponse(200, appointment, "Appointment retrieved successfully")
      );
  } catch (error) {
    next(error);
  }
});

const getAllAppointmentsForLeadId = asyncHandler(async (req, res, next) => {
  try {
    console.log("for query lead appointment");

    const user_id = req.user?._id;
    const user = await User.findById(user_id);

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    const { lead_id } = req.query;
    console.log("lead id", lead_id);

    // Prepare the query object
    let query = {};

    // If lead_id is provided, validate and add to query
    if (lead_id) {
      if (!isValidObjectId(lead_id)) {
        return next(new ApiError(400, "Invalid lead_id"));
      }
      query.lead = lead_id;
    }

    let appointments;

    // Admins can see all or filtered appointments
    if (user.role === "admin") {
      appointments = await Appointment.find(query).populate("lead").populate({
        path: "createdBy",
        select: "fullName avatar",
      });
    } else {
      return next(new ApiError(403, "Unauthorized access"));
    }

    // if (appointments.length === 0) {
    //   throw new ApiError(204, "No appointments found");
    // }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          appointments,
          "Appointments retrieved successfully"
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
  getAppointmentBySingle,
  getAllAppointmentsForLeadId,
};
