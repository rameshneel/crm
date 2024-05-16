import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import Appointment from "../models/appointement.model.js";

const addAppointment = asyncHandler(async (req, res) => {
  const { lead_id } = req.params;
  if (!isValidObjectId(lead_id)) {
    throw new ApiError(400, "Invalid lead_id");
  }
  try {
    const { title, content, time, date } = req.body;
    const datetime = new Date(date);
    console.log(req.body);

    const existingAppointment = await Appointment.findOne({ date});

    if (existingAppointment) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "An appointment already exists for this date"
          )
        );
    }
    const appointment = await Appointment.create({
      title,
      content,
      time,
      date:datetime,
      lead: lead_id,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(200, appointment, "Appointment Added Successfully")
      );
  } catch (error) {
  throw error
  }
});



// const addAppointment = asyncHandler(async (req, res) => {
//   const { lead_id } = req.params;
//   if (!isValidObjectId(lead_id)) {
//     throw new ApiError(400, "Invalid lead_id");
//   }
//   try {
//     const { title, content, time, date } = req.body;


//     const datetimes = new Date(date).toLocaleDateString();
//     console.log("date:",datetimes);
//     console.log("time",time);

//     const timeParts = time.split(':');
//     console.log(timeParts);
//     const d=`${date}T${time}.000+00:00`
//     console.log(d);

//     // const d = datetime.toISOString().substring(0,11)+timeParts[0]+":"+timeParts[1]+datetime.toISOString().substring(16);
//     // console.log("date = ",d);

//     // datetime.setUTCHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), parseInt(timeParts[2], 10), 0);
//     // console.log("date time changed" ,datetime);

//     const existingAppointment = await Appointment.findOne({ date:d});

//     if (existingAppointment) {
//       return res
//         .status(400)
//         .json(
//           new ApiResponse(
//             400,
//             null,
//             "An appointment already exists for this date"
//           )
//         );
//     }
//     const appointment = await Appointment.create({
//       title,
//       content,
//       time,
//       date:d,
//       lead: lead_id,
//     });

//     return res
//       .status(201)
//       .json(
//         new ApiResponse(200, appointment, "Appointment Added Successfully")
//       );
//   } catch (error) {
//   throw error
//   }
// });

const deleteAppointment = asyncHandler(async (req, res) => {
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
   throw error
  }
});

const updateAppointment = asyncHandler(async (req, res) => {
  const { appointment_id } = req.params;
  console.log(appointment_id);
  if (!isValidObjectId(appointment_id)) {
    throw new ApiError(400, "Invalid appointment_id");
  }
  const app=await Appointment.findById(appointment_id)
   if(!app){
    throw new ApiError(400, "appointment_id not fond");
   }
  try {
    const { title, content, time, date } = req.body;

    const existingAppointment = await Appointment.findOne({ time });

    if (existingAppointment && existingAppointment._id.toString() !== appointment_id) {
      // Another appointment exists at the updated time
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "Another appointment already exists at the updated time"
        )
      );
    }

    // No appointment exists at the updated time or it's the same appointment being updated, proceed with updating
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointment_id,
      {
        title,
        content,
        time,
        date,
      },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json(new ApiResponse(404, null, "Appointment not found"));
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        updatedAppointment,
        "Appointment Updated Successfully"
      )
    );
  } catch (error) {
    throw error
  }
});

const getAppointmentsByDate = asyncHandler(async (req, res) => {
  console.log("gbfgfgfgfg");
  const { date } = req.query;

  if (!date) {
    throw new ApiError(400, "Date is required");
  }

  try {
    const searchDate = new Date(date);
    const appointments = await Appointment.find({
      date: { $eq: searchDate },
    });
    console.log(appointments);
    if (appointments.length === 0) {
      throw new ApiError(200,"An appointment already exists for this date")

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
   throw error
  }
});

export {
  addAppointment,
  deleteAppointment,
  updateAppointment,
  getAppointmentsByDate,
};
