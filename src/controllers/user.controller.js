import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendWelcomeEmail } from "../utils/email.js";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../utils/sendPasswordResetEmail.js";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

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

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;

  if ([fullName, email, password, role].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }],
  });

  if (existedUser) {
    throw new ApiError(409, " email  already exists");
  }
  let avatarurl;
  try {
    const avatarLocalPath = req.file.path;
    const formData = new FormData();
    formData.append("file", fs.createReadStream(avatarLocalPath));
    const apiURL = "https://crm.neelnetworks.org/public/file_upload/api.php";
    const apiResponse = await axios.post(apiURL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    console.log(apiResponse.data);
    avatarurl = apiResponse.data?.img_upload_path;
    if (!avatarurl) {
      throw new Error("img_upload_path not found in API response");
    }
  } catch (error) {
    throw new ApiError(401, error?.message || "avatar invalid ");
  }

  const user = await User.create({
    fullName,
    avatar: avatarurl || "",
    email,
    role,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -resettoken "
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  await sendWelcomeEmail(email, password);

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!(email &&password)) {
    throw new ApiError(400, "All input is required");
  }

  const user = await User.findOne({
    $or: [{ email }],
  });

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
      secure:true,
      maxAge: 900000
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
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
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

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
});

const getCurrentUser = asyncHandler(async (req, res) => {
  console.log(req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName } = req.body;

  if (!fullName) {
    throw new ApiError(400, "All fields are required");
  }
  let avatarurl;
  try {
    const avatarLocalPath = req.file.path;
    const formData = new FormData();
    formData.append("file", fs.createReadStream(avatarLocalPath));
    const apiURL = "https://crm.neelnetworks.org/public/file_upload/api.php";
    const apiResponse = await axios.post(apiURL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    console.log(apiResponse.data);
    avatarurl = apiResponse.data?.img_upload_path;
    if (!avatarurl) {
      throw new Error("img_upload_path not found in API response");
    }
  } catch (error) {
    throw new ApiError(401, error?.message || "avatar invalid ");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        avatar: avatarurl,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
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

const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404,"User not found");
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
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user.email,
          "Password reset email sent successfully"
        )
      );
  } catch (error) {
    throw error;
  }
});

const forgetPasswordToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id);
    if (!user || Date.now() > user.resetTokenExpiry) {
      throw new ApiError(404, "Invalid or expired token");
    }
    res
      .status(200)
      .json(new ApiResponse(200, "Email Token Verified successfully"));
  } catch (error) {
   throw error;
  }
});

const resetPasswordForForget = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;
  const { token } = req.params;
  if (
    [password, confirmPassword].some((field) => !field || field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id);
    if (!user || Date.now() > user.resetTokenExpiry) {
      throw new ApiError(404, "Invalid or expired token");
    }
    user.password = password;
    user.refreshToken = null;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset successfully"));
  } catch (error) {
    throw error;
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const isAdmin = req.user.role === "admin";

  if (!isAdmin) {
    throw new ApiError(403, "Only admin users can delete users");
  }

  const deletedUser = await User.findByIdAndDelete(userId);

  if (!deletedUser) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User deleted successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  forgetPassword,
  forgetPasswordToken,
  resetPasswordForForget,
  deleteUser,
};
