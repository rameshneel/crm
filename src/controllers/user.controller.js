import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../utils/userforEmail.js";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import { isValidObjectId } from "mongoose";
import config from "../config/index.js";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  const {
    fullName,
    email,
    password,
    role,
    mobileNo,
    address,
    jobtitle,
    timeZone,
  } = req.body;

  try {
    if (
      [fullName, email, password, role, mobileNo].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
      $or: [{ email }],
    });

    if (existedUser) {
      throw new ApiError(409, "Email already exists");
    }
    let avatarUrl = "";
    if (req.file && req.file.path) {
      // avatarUrl = `/public/images/${req.file.filename}`;
      // avatarUrl = `${req.baseUrl}/public/images/${req.file.filename}`;
      avatarUrl = `https://${req.get("host")}/images/${req.file.filename}`;
      // avatarUrl = `${config.baseUrl}/images/${req.file.filename}`;
    }

    const user = await User.create({
      fullName,
      avatar: avatarUrl || "",
      email,
      role,
      password,
      mobileNo,
      address,
      jobtitle,
      timeZone,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken -resettoken "
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    // const sentemail = await sendWelcomeEmail(email, password);
    // if(!sentemail){
    //   throw new ApiError(500, "sending email error");
    // }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  } catch (error) {
    return next(error);
  }
});

const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    throw new ApiError(400, "All input is required");
  }

  try {
    // const user = await User.findOne({
    //   $or: [{ email }],
    // });
    const user = await User.findOne({ email }); // Simplified lookup
    if (!user) {
      throw new ApiError(404, "User does not exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user Password credentials");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
      // secure: false,
      sameSite: "none",
      // SameSite:"Lax",
      // maxAge: 900000
    };
    return res
      .status(200)
      .cookie("accessTokenCrm", accessToken, options)
      .cookie("refreshTokenCrm", refreshToken, { ...options, maxAge: 7 * 24 * 60 * 60 * 1000 })
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged In Successfully"
        )
      );
  } catch (error) {
    return next(error);
  }
});

// const logoutUser = asyncHandler(async (req, res) => {
//   await User.findByIdAndUpdate(
//     req.user._id,
//     {
//       $unset: {
//         refreshToken: 1, // this removes the field from document
//       },
//     },
//     {
//       new: true,
//     }
//   );

//   const options = {
//     httpOnly: true,
//     secure: true,
//   };

//   return res
//     .status(200)
//     .clearCookie("accessToken", options)
//     .clearCookie("refreshToken", options)
//     .json(new ApiResponse(200, {}, "User logged Out"));
// });

const logoutUser = asyncHandler(async (req, res) => {
  try {
    // Remove the refresh token from the user document
    await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { refreshToken: "" } }, // Use empty string to unset
      { new: true } // Return the modified document
    );

    // Clear cookies for access and refresh tokens
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/',
  };

    return res
      .status(200)
      .clearCookie("accessTokenCrm", options) // Use the correct cookie name
      .clearCookie("refreshTokenCrm", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    console.error("Logout error:", error); // Log the error for debugging
    throw new ApiError(500, "Failed to log out. Please try again.");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  } catch (error) {
    return next(error);
  }
});

const updateAccountDetails = asyncHandler(async (req, res, next) => {
  try {
    const { fullName, mobileNo, address, jobtitle } = req.body;

    // // Check if all fields are empty
    // if (![fullName, mobileNo, address].some(field => field !== undefined && field.trim() !== '')) {
    //   throw new ApiError(400, "At least one field is required for update");
    // }

    if (
      ![fullName, mobileNo, address, req.file].some((field) => {
        if (field === undefined) return false;
        if (typeof field === "string") return field.trim() !== "";
        if (typeof field === "object") return field !== null;
      })
    ) {
      throw new ApiError(400, "At least one field is required for update");
    }

    let avatarUrl;
    if (req.file && req.file.path) {
      // avatarurl = `${req.protocol}:${req.get('host')}///public/images/${req.file.filename}`;
      avatarUrl = `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`;
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          avatar: avatarUrl,
          mobileNo,
          address,
          jobtitle,
        },
      },
      { new: true }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully"));
  } catch (error) {
    // Pass the error to the next middleware (errorHandler)
    return next(error);
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const userone = await User.findById(req.user?._id);
  try {
    fs.unlinkSync(userone.avatar);
    console.log(`upadtaing old image file: ${userone.avatar}`);
  } catch (unlinkError) {
    console.error("Error upadating old image file:", unlinkError);
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatarLocalPath,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const forgetPassword = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );
    user.refreshToken = refreshToken;
    const resetToken = accessToken;
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 2 * 60 * 60 * 1000;
    await user.save();
    await sendPasswordResetEmail(user.email, resetToken);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user.email,
          "Reset-Password email sent successfully"
        )
      );
  } catch (error) {
    return next(error);
  }
});

const forgetPasswordToken = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id);
    if (!user || Date.now() > user.resetTokenExpiry) {
      throw new ApiError(404, "Invalid or expired token");
    }
    // return res.redirect(302,  `https://high-oaks-media-crm.vercel.app/resetpassword?token=${token}`);
    return res
      .status(200)
      .json(new ApiResponse(200, [], "Email Token Verified successfully"));
  } catch (error) {
    return next(error);
  }
});

const resetPasswordForForget = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;
  const { token } = req.query;

  if (
    !password ||
    !confirmPassword ||
    password.trim() !== confirmPassword.trim()
  ) {
    throw new ApiError(400, "Passwords do not match");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log(decoded);

    const updatedUser = await User.findOneAndUpdate(
      { _id: decoded._id, resetTokenExpiry: { $gt: Date.now() } },
      {
        refreshToken: null,
        resetToken: null,
        resetTokenExpiry: null,
      },
      { new: true }
    );
    updatedUser.password = password;
    await updatedUser.save({ validateBeforeSave: false });

    if (!updatedUser) {
      throw new ApiError(404, "Invalid or expired token");
    }
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset successfully"));
  } catch (error) {
    throw error;
  }
});

const deleteUser = asyncHandler(async (req, res, next) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user._id);
    if (!deletedUser) {
      throw new ApiError(404, "User not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, null, "User deleted successfully"));
  } catch (error) {
    return next(error);
  }
});

// const getAllUsers = asyncHandler(async (req, res, next) => {
//   try {
//     // Check if user is admin
//     if (req.user.role === "admin") {
//       // Fetch all users
//       const users = await User.find();
//       return res
//         .status(200)
//         .json(new ApiResponse(200, users, "All users retrieved successfully"));
//     } else if (req.user.role === "salesman") {
//       // Fetch only admin users
//       const admins = await User.find({ role: "admin" });
//       return res
//         .status(200)
//         .json(new ApiResponse(200, admins, "Admins retrieved successfully"));
//     } else {
//       throw new ApiError(403, "Access denied");
//     }
//   } catch (error) {
//     // Pass the error to the next middleware (errorHandler)
//     return next(error);
//   }
// });
const getAllUsers = asyncHandler(async (req, res, next) => {
  try {
    // Fetch all users without role checks
    const users = await User.find();
    return res.status(200).json(new ApiResponse(200, users, "All users retrieved successfully"));
  } catch (error) {
    // Pass the error to the next middleware (errorHandler)
    return next(error);
  }
});

const userDetails = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  console.log(userId);
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User Not Found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User fetched successfully"));
  } catch (error) {
    return next(error);
  }
});

const deleteUsers = asyncHandler(async (req, res, next) => {
  try {
    const { userId } = req.params;
    const isAdmin = req.user.role === "admin";

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(203, "User not found");
    }

    if (!isAdmin) {
      throw new ApiError(403, "Only admin users can delete users");
    }

    await User.findByIdAndDelete(userId);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "User deleted successfully"));
  } catch (error) {
    return next(error);
  }
});

const updateUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const activeUserId = req.user._id;
  const { fullName, mobileNo, address, jobtitle, role, email, timeZone } =
    req.body;
  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check if active user is admin
    const activeUser = await User.findById(activeUserId);
    if (!activeUser || activeUser.role !== "admin") {
      throw new ApiError(403, "Unauthorized access");
    }

    let avatarUrl;
    if (req.file && req.file.path) {
      // const avatarLocalPath = req.file.path;
      avatarUrl = `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`;
    }
    const updatedUserdata = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        mobileNo,
        address,
        jobtitle,
        email,
        role,
        timeZone,
        avatar: avatarUrl,
      },
      { new: true }
    );

    if (!updatedUserdata) {
      throw new ApiError(404, "User not found after update");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUserdata, "User updated successfully"));
  } catch (error) {
    next(error);
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  forgetPassword,
  forgetPasswordToken,
  resetPasswordForForget,
  deleteUser,
  getAllUsers,
  userDetails,
  deleteUsers,
  updateUser,
};



// const getAllUsers = asyncHandler(async (req, res, next) => {
//   try {
//     const { search } = req.query; // Use query parameters
//     const { page = 1, limit = 10 } = req.query;

//     const query = {};
//     if (search) {
//       const regex = new RegExp(search, "i"); // Case-insensitive search
//       query.$or = [
//         { fullName: { $regex: regex } },
//         { email: { $regex: regex } },
//         { jobtitle: { $regex: regex } }
//       ];
//     }

//     const pageNumber = parseInt(page, 10);
//     const pageLimit = parseInt(limit, 10);

//     const users = await User.find(query)
//       .skip((pageNumber - 1) * pageLimit)
//       .limit(pageLimit);

//     const totalUsers = await User.countDocuments(query);
//     const totalPages = Math.ceil(totalUsers / pageLimit);

//     return res.status(200).json({
//       status: 200,
//       data: users,
//       pagination: {
//         totalUsers,
//         totalPages,
//         currentPage: pageNumber,
//         pageLimit
//       },
//       message: "Users retrieved successfully"
//     });
//   } catch (error) {
//     return next(error); // Handle errors appropriately
//   }
// });
// GET /api/users?search=Technical&page=2&limit=5
