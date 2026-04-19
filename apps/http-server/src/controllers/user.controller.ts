import { Request, Response } from "express";
import { UserModel } from "../models/users.model";
import { FeedbackModel } from "../models/feedback.model";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { randomProfilePics } from "../constants/profilePics";
import { sendMail } from "../utils/mailerService";
import { ApiResponse } from "../utils/apiResponse";
import { sendToQueue } from "../utils/queue";

const buildCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
        maxAge: 1000 * 60 * 60 * 24 * 3,
    };
};

const buildPassword = () => {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*{}[]_?~";
    let password = "";

    for (let index = 0; index < 16; index++) {
        const char = Math.floor(Math.random() * characters.length);
        password += characters.charAt(char);
    }

    return password;
};

const sanitizeUser = async (userId: any) => {
    return await UserModel.findById(userId).select("-password");
};

const createUniqueUsername = async (baseInput: string) => {
    const base = baseInput
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 18) || "cineuser";

    let candidate = base;
    let suffix = 1;

    while (await UserModel.findOne({ username: candidate })) {
        candidate = `${base}${suffix}`;
        suffix += 1;
    }

    return candidate;
};

const generateAccessToken = async (userId: any) => {
    const user = await UserModel.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return user.generateAccessToken();
};

const sendOtpMail = async (user: any, otpCode: string) => {
    const otpEmailOptions = {
        to: user.email,
        subject: "OTP Verification",
        templateName: "otpTemplate",
        variables: {
            username: user.username,
            email: user.email,
            otp: otpCode,
            year: new Date().getFullYear().toString(),
        },
    };

    const emailResponse = await sendMail(otpEmailOptions);

    if (!emailResponse.success) {
        throw new ApiError(500, emailResponse.message);
    }
};

const register = asyncHandler(async (req: any, res: Response) => {
    const {
        email,
        username,
        password = null,
        fullName,
    }: {
        email: string;
        username: string;
        password: string | null;
        fullName: string;
    } = req.body;

    if (![email, username, fullName].every((field) => field?.trim())) {
        throw new ApiError(400, "Email, username and full name are required");
    }

    const existingUserVerifiedByUsername = await UserModel.findOne({
        username: username.toLowerCase(),
        isVerified: true,
    });

    if (existingUserVerifiedByUsername) {
        throw new ApiError(400, "Username is already taken");
    }

    const profilePhotoLocalPath = req.file?.path;
    let profilePhoto: string;

    if (profilePhotoLocalPath) {
        const uploadedPhoto = await uploadOnCloudinary(profilePhotoLocalPath);
        if (!uploadedPhoto?.url) {
            throw new ApiError(400, "Avatar save failed, please re-insert image.");
        }
        profilePhoto = uploadedPhoto.url;
    } else {
        profilePhoto =
            randomProfilePics[
                Math.floor(Math.random() * randomProfilePics.length)
            ] || randomProfilePics[0] || "";
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpCodeExpiry = new Date(Date.now() + 600000);
    const generatedPassword = password?.trim() || buildPassword();
    const shouldSendGeneratedPassword = !password?.trim();

    const existingUserByEmail = await UserModel.findOne({ email });

    if (existingUserByEmail) {
        if (existingUserByEmail.isVerified) {
            throw new ApiError(409, "User already exists with this email");
        }

        await UserModel.findByIdAndDelete(existingUserByEmail._id);
    }

    const user = await UserModel.create({
        email,
        username: username.toLowerCase(),
        password: generatedPassword,
        profilePhoto,
        fullName,
        otpCode,
        otpCodeExpiry,
        avatar: "unselected",
    });

    await sendOtpMail(user, otpCode);

    if (shouldSendGeneratedPassword) {
        const passwordData = {
            to: email,
            subject: "Keep this SAFE",
            templateName: "passwordTemplate",
            variables: {
                username: user.username,
                email: user.email,
                password: generatedPassword,
                year: new Date().getFullYear().toString(),
            },
        };
        sendToQueue("sendPassword", passwordData);
    }

    const checkedUser = await sanitizeUser(user._id);

    if (!checkedUser) {
        throw new ApiError(500, "Something went wrong while creating the user.");
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                user: checkedUser,
                requiresOtp: true,
            },
            "User registered successfully, please verify your email"
        )
    );
});

const signIn = asyncHandler(async (req: Request, res: Response) => {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername?.trim() || !password?.trim()) {
        throw new ApiError(400, "Email/username and password are required");
    }

    const normalizedLogin = emailOrUsername.trim();
    const user = normalizedLogin.includes("@")
        ? await UserModel.findOne({ email: normalizedLogin.toLowerCase() })
        : await UserModel.findOne({ username: normalizedLogin.toLowerCase() });

    if (!user) {
        throw new ApiError(404, "Signup first");
    }

    if (!user.isVerified) {
        throw new ApiError(403, "Your account is not verified yet");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Password is invalid");
    }

    const accessToken = await generateAccessToken(user._id as any);
    const loggedInUser = await sanitizeUser(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, buildCookieOptions() as any)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                },
                "User logged in successfully"
            )
        );
});

const loginWithGoogle = asyncHandler(async (req: Request, res: Response) => {
    const { credential } = req.body as { credential?: string };

    if (!credential) {
        throw new ApiError(400, "Google credential is required");
    }

    const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );

    if (!response.ok) {
        throw new ApiError(401, "Unable to verify Google credential");
    }

    const payload = await response.json() as {
        aud?: string;
        email?: string;
        email_verified?: string;
        name?: string;
        picture?: string;
    };

    const expectedClientId = process.env.SERVER_VAR_GOOGLE_CLIENT_ID;

    if (expectedClientId && payload.aud && payload.aud !== expectedClientId) {
        throw new ApiError(401, "Google client mismatch");
    }

    if (!payload.email || payload.email_verified !== "true") {
        throw new ApiError(401, "Google email is not verified");
    }

    let user = await UserModel.findOne({ email: payload.email.toLowerCase() });

    if (!user) {
        const username = await createUniqueUsername(
            payload.email.split("@")[0] || "cineuser"
        );

        user = await UserModel.create({
            email: payload.email.toLowerCase(),
            username,
            password: buildPassword(),
            fullName: payload.name || username,
            profilePhoto:
                payload.picture ||
                randomProfilePics[
                    Math.floor(Math.random() * randomProfilePics.length)
                ],
            isVerified: true,
            avatar: "unselected",
        });
    } else if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
    }

    const accessToken = await generateAccessToken(user._id as any);
    const loggedInUser = await sanitizeUser(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, buildCookieOptions() as any)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                },
                "Google sign in successful"
            )
        );
});

const me = asyncHandler(async (req: any, res: Response) => {
    const user = await sanitizeUser(req.user._id);

    return res
        .status(200)
        .json(new ApiResponse(200, { user }, "User fetched successfully"));
});

const logout = asyncHandler(async (req: any, res: Response) => {
    return res
        .status(200)
        .clearCookie("accessToken", buildCookieOptions() as any)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const verifyOtp = asyncHandler(async (req: any, res: Response) => {
    const { username, otpReceived } = req.body;

    if (!username || !otpReceived) {
        throw new ApiError(400, "Username and OTP are required");
    }

    const toVerifyUser: any = await UserModel.findOne({
        username: String(username).toLowerCase(),
    });

    if (!toVerifyUser) {
        throw new ApiError(404, "User not found");
    }

    if (toVerifyUser.isVerified) {
        throw new ApiError(409, "User is already verified");
    }

    if (
        toVerifyUser.otpCodeExpiry &&
        toVerifyUser.otpCodeExpiry < new Date(Date.now())
    ) {
        throw new ApiError(400, "OTP has expired, please request a new OTP");
    }

    if (toVerifyUser.otpCode !== otpReceived.toString()) {
        throw new ApiError(403, "OTP entered is wrong");
    }

    toVerifyUser.isVerified = true;
    toVerifyUser.otpCode = undefined;
    toVerifyUser.otpCodeExpiry = undefined;
    await toVerifyUser.save();

    const accessToken = await generateAccessToken(toVerifyUser._id);
    const verifiedUser = await sanitizeUser(toVerifyUser._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, buildCookieOptions() as any)
        .json(
            new ApiResponse(
                200,
                {
                    user: verifiedUser,
                    accessToken,
                },
                "OTP verified successfully"
            )
        );
});

const requestOtp = asyncHandler(async (req: any, res: Response) => {
    const { emailOrUsername } = req.body;

    if (!emailOrUsername) {
        throw new ApiError(400, "Provide the email or username");
    }

    const normalizedLogin = String(emailOrUsername).trim();
    const targetedUser = normalizedLogin.includes("@")
        ? await UserModel.findOne({ email: normalizedLogin.toLowerCase() })
        : await UserModel.findOne({ username: normalizedLogin.toLowerCase() });

    if (!targetedUser) {
        throw new ApiError(404, "No user found");
    }

    if (targetedUser.isVerified) {
        throw new ApiError(403, "User is already verified");
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpCodeExpiry = new Date(Date.now() + 600000);

    targetedUser.otpCode = otpCode;
    targetedUser.otpCodeExpiry = otpCodeExpiry;
    await targetedUser.save();

    await sendOtpMail(targetedUser, otpCode);

    return res.status(201).json(
        new ApiResponse(201, {}, "OTP sent to your email successfully")
    );
});

const passwordSentByEmail = asyncHandler(async (req: any, res: Response) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(404, "Provide an email");
    }

    const user = await UserModel.findOne({ email: String(email).toLowerCase() });

    if (!user) {
        throw new ApiError(404, "No user found");
    }

    user.isPasswordIssued = true;
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Email was sent."));
});

const updateAvatar = asyncHandler(async (req: any, res: Response) => {
    const { avatar } = req.body as { avatar?: string };

    if (!avatar?.trim()) {
        throw new ApiError(400, "Avatar is required");
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.trim(),
            },
        },
        { new: true }
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(
            200,
            { user: updatedUser },
            "Avatar updated successfully"
        )
    );
});

const changePassword = asyncHandler(async (req: any, res: Response) => {
    const {
        currentPassword,
        newPassword,
    }: { currentPassword?: string; newPassword?: string } = req.body;

    if (!currentPassword?.trim() || !newPassword?.trim()) {
        throw new ApiError(400, "Current password and new password are required");
    }

    const user = await UserModel.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isCurrentPasswordValid = await user.isPasswordCorrect(currentPassword);

    if (!isCurrentPasswordValid) {
        throw new ApiError(401, "Current password is incorrect");
    }

    user.password = newPassword;
    user.isPasswordIssued = false;
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password updated successfully"));
});

const submitFeedback = asyncHandler(async (req: any, res: Response) => {
    const {
        message,
        category = "general",
        rating = 5,
    }: { message?: string; category?: string; rating?: number } = req.body;

    if (!message?.trim()) {
        throw new ApiError(400, "Feedback message is required");
    }

    const feedback = await FeedbackModel.create({
        userId: req.user._id,
        username: req.user.username,
        email: req.user.email,
        category,
        rating,
        message: message.trim(),
    });

    return res.status(201).json(
        new ApiResponse(201, feedback, "Feedback submitted successfully")
    );
});

export {
    register,
    signIn,
    loginWithGoogle,
    logout,
    me,
    verifyOtp,
    requestOtp,
    passwordSentByEmail,
    updateAvatar,
    changePassword,
    submitFeedback,
};
