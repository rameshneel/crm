// import { ApiError } from "../utils/ApiError.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import jwt from "jsonwebtoken"
// import { User } from "../models/user.model.js";

// export const verifyJWT = asyncHandler(async(req, _, next) => {
//     try {
       
//         const token = req.cookies?.accessTokenCrm 
       
//             // ||req.header("Authorization")?.replace("Bearer ", "")
//         if (!token) {
//             throw new ApiError(401, "Unauthorized request")
//         }
    
//         const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
//         const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
//         if (!user) {
            
//             throw new ApiError(401, "Invalid User Access Token")
//         }
    
//         req.user = user;
//         next()
//     } catch (error) {
//         throw new ApiError(401, error?.message || "Invalid access token")
//     }
    
// })

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessTokenCrm;
        const refreshToken = req.cookies?.refreshTokenCrm;

        if (!accessToken) {
            // If no access token, check for refresh token
            if (!refreshToken) {
                throw new ApiError(401, "Unauthorized request: No access or refresh token");
            }

            // Verify refresh token
            let decodedRefreshToken;
            try {
                decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            } catch (error) {
                throw new ApiError(403, "Invalid refresh token");
            }

            const user = await User.findById(decodedRefreshToken._id);
            if (!user) {
                throw new ApiError(403, "User not found");
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
                { id: user._id },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            );

            // Set new access token in cookie
            res.cookie('accessTokenCrm', newAccessToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 15 * 60 * 1000
            });

            // Proceed with the new access token
            req.user = user;
            return next();
        }

        // If access token is present, verify it
        let decodedToken;
        try {
            decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        } catch (error) {
            throw new ApiError(401, "Invalid access token");
        }

        // Fetch user based on decoded token
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(401, "Invalid User Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        return next(error); // Handle error using the next middleware
    }
});

// import { ApiError } from "../utils/ApiError.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import jwt from "jsonwebtoken";
// import { User } from "../models/user.model.js";

// export const verifyJWT = asyncHandler(async (req, res, next) => {
//     try {
//         const accessToken = req.cookies?.accessTokenCrm;
//         const refreshToken = req.cookies?.refreshTokenCrm; // Refresh token ko read karein

//         if (!accessToken) {
//             throw new ApiError(401, "Unauthorized request");
//         }

//         let decodedToken;
//         try {
//             decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
//         } catch (error) {
//             // Agar access token invalid hai, to check for refresh token
//             if (refreshToken) {
//                 // Verify refresh token
//                 const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
//                 const user = await User.findById(decodedRefreshToken.id);

//                 if (!user) {
//                     throw new ApiError(403, "User not found");
//                 }

//                 // Generate new access token
//                 const newAccessToken = jwt.sign(
//                     { id: user._id },
//                     process.env.ACCESS_TOKEN_SECRET,
//                     { expiresIn: '15m' } // Access token expires in 15 minutes
//                 );

//                 // Set new access token in cookie
//                 res.cookie('accessTokenCrm', newAccessToken, {
//                     httpOnly: true,
//                     secure: process.env.NODE_ENV === 'production',
//                     sameSite: 'Strict',
//                     maxAge: 15 * 60 * 1000 // 15 minutes in milliseconds
//                 });

//                 decodedToken = { id: user._id }; // Update decoded token
//             } else {
//                 throw new ApiError(401, "Invalid access token and no refresh token");
//             }
//         }

//         const user = await User.findById(decodedToken._id).select("-password -refreshToken");

//         if (!user) {
//             throw new ApiError(401, "Invalid User Access Token");
//         }

//         req.user = user;
//         next();
//     } catch (error) {
//         throw new ApiError(401, error?.message || "Invalid access token");
//     }
// });
