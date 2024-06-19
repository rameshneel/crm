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
    deleteUsers,
    updateUser,
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadFile } from "../helper/multererror.js";


const router = Router()
router.route("/").post(uploadFile,
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
router.route('/reset-password/').patch(resetPasswordForForget);
router.route('/delete').delete(verifyJWT,deleteUser);
router.route('/:userId').delete(verifyJWT,deleteUsers);
router.route('/').get(verifyJWT,getAllUsers);
router.route("/update/:userId").patch(verifyJWT,upload.single("avatar"),updateUser)

export default router