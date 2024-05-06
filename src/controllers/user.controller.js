import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import {sendWelcomeEmail} from "../utils/email.js"
import jwt from "jsonwebtoken"
import { sendPasswordResetEmail } from "../utils/sendPasswordResetEmail.js";
import fs from "fs"


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {

    const {fullName, email, password,role } = req.body
  
    if (
        [fullName, email, password,role].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ email }]
    })

    if (existedUser) {
        throw new ApiError(409, " email  already exists")
    }

    const avatarLocalPath = req.file?.path;
   
   
    const user = await User.create({
        fullName,
        avatar: avatarLocalPath,
        email, 
        role,
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    await sendWelcomeEmail(email,password)

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler(async (req, res) =>{
    
    const {email, password} = req.body
    console.log(email);

    if (!email) {
        throw new ApiError(400, "username or email is required")
    }
    

    const user = await User.findOne({
        $or: [{email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }
   const isPasswordValid = await user.isPasswordCorrect(password)
   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user Password credentials")
    }
   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    console.log(req.user);
    console.log("ghghghh");
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
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
            $set:{
                avatar: avatarLocalPath
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const forgetpassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new ApiError(404, "User not found");
      }
    const {accessToken,refreshToken}=  await generateAccessAndRefereshTokens(user._id)
      user.refreshToken = refreshToken;
      const resetToken=accessToken
      await user.save();
      await sendPasswordResetEmail(user.email, resetToken);
      res.status(200).json(new ApiResponse(200,user.email,"Password reset email sent successfully"));
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, error.message));
    }
  });
  
const forgetpassworktoken = asyncHandler(async (req, res) => {
    const { token } = req.params;
    // console.log(token);
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log(decoded);
      const user = await User.findOne({ _id: decoded._id });
      console.log(user);
      if (!user) {
        return res
          .status(404)
          .json({
            success: false,
            message: "User not found with provided email",
          });
      }
  
      if (user.forgetEmailVerified) {
        return res
          .status(400)
          .json({ success: false, message: "Email already verified change passwork within 15 mint" });
      }
       user.forgetEmailVerified = true;
      
      await user.save();
      return res
      .status(200) 
       .json(new ApiResponse(200, "Email Token Verfiy successfully"))
    } catch (error) {
      console.log("Error verifying email: ", error);
      res.status(500).json({ success: false, message: "Failed to verify email" });
    }
  });
  
const resetPasswordforforget = asyncHandler(async (req, res) => {

    const {password, confirmPassword } = req.body;
     const { token }= req.params;
    if (
        [password,confirmPassword].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

   
    console.log(token);
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log(decoded);
      console.log("qwer");
      const user = await User.findById(decoded?._id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }
  
    //   if (Date.now() > user.resetTokenExpiry) {
    //     throw new ApiError(400, "Reset token has expired");
    //   }
      if(user.emailVerified){
        throw new ApiError(400, "Please Verfiy Email Token");
      }
      
      user.password = password
      user.refreshToken=null
      user.forgetEmailVerified=false;
      await user.save({validateBeforeSave: false})
  
      return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password forget successfully"))
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(error.statusCode || 401).json(new ApiResponse(error.statusCode || 401, error.message));
    }
  });


export {
    registerUser,
    loginUser,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
   forgetpassword,
   forgetpassworktoken,
   resetPasswordforforget
}
