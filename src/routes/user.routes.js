import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    changeCurrentPassword, 
    updateUserAvatar, 
    updateAccountDetails,
    resetPasswordForForget,
    forgetPasswordToken,
    forgetPassword,
    deleteUser,
    getAllUsers,
    userDetails,
    deleteUsers
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.route("/").post(
    upload.single("avatar"),
    registerUser
    )
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/:userId").get(verifyJWT, userDetails)
router.route("/update-account").patch(verifyJWT,upload.single("avatar"), updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/forget").post( forgetPassword)
router.route("/reset-password-token/:token").get(forgetPasswordToken);
router.route('/reset-password/:token').post(resetPasswordForForget);
router.route('/delete').delete(verifyJWT,deleteUser);
router.route('/delete/:userId').delete(verifyJWT,deleteUsers);
router.route('/').get(verifyJWT,getAllUsers);

export default router