import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
    changePassword,
    loginWithGoogle,
    logout,
    me,
    passwordSentByEmail,
    register,
    requestOtp,
    signIn,
    submitFeedback,
    updateAvatar,
    updateProfile,
    verifyOtp
} from "../controllers/user.controller";

const router: Router = Router();

router.route("/register").post(upload.single("profilePhoto"), register)
router.route("/signin").post(signIn)
router.route("/google").post(loginWithGoogle)
router.route("/verifyotp").post(verifyOtp);
router.route("/requestotp").post(requestOtp);
router.route("/me").get(verifyJwt, me)
router.route("/logout").get(verifyJwt, logout)
router.route("/password-email-sent").post(passwordSentByEmail);
router.route("/avatar").patch(verifyJwt, updateAvatar)
router.route("/profile").patch(verifyJwt, upload.single("profilePhoto"), updateProfile)
router.route("/password").patch(verifyJwt, changePassword)
router.route("/feedback").post(verifyJwt, submitFeedback)

export { router as userRouter }
