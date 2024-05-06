import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateUserAvatar, 
    updateAccountDetails,
    forgetpassword,
    forgetpassworktoken,
    resetPasswordforforget
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.route("/register").post(
    upload.single("avatar"),
    registerUser
    )
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/forget").post( forgetpassword)
router.route("/reset-password-token/:token").get(forgetpassworktoken);
router.route('/reset-password/:token').post(resetPasswordforforget);

export default router