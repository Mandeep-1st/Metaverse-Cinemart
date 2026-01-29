import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import { verifyJwt } from "../middlewares/auth.middleware";
import { logout, me, passwordSentByEmail, register, requestOtp, signIn, verifyOtp } from "../controllers/user.controller";

const router: Router = Router();

router.route("/register").post(upload.single("profilePhoto"), register)
router.route("/signin").post(signIn)
router.route("/verifyotp").post(verifyOtp);
router.route("/requestotp").post(requestOtp);
router.route("/me").get(verifyJwt, me)
router.route("/logout").get(verifyJwt, logout)
router.route("/password-email-sent").post(passwordSentByEmail)
export { router as userRouter }