import { Request, Response } from "express";
import { UserModel } from "../models/users.model"
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { randomProfilePics } from "../constants/profilePics";
import { sendMail } from "../utils/mailerService";
import { ApiResponse } from "../utils/apiResponse";
import { sendToQueue } from "../utils/queue";



const generateAccessToken = async (userId: any) => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found")
        }
        const accessToken = user.generateAccessToken();

        return accessToken;
    } catch (error) {
        throw new ApiError(500, "Something Went wrong while generating Access token")
    }
}



const register = asyncHandler(async (req: any, res: Response) => {
    const { email, username, password = null, fullName }: { email: string, username: string, password: string | null, fullName: string } = req.body;

    if ([email, username, fullName].some((eachField) => {
        return eachField?.trim() === "";
    })) {
        throw new ApiError(400, "All Fields are compulsory")
    }

    const existingUserVerifiedByUsername = await UserModel.findOne({
        username,
        isVerified: true
    })

    if (existingUserVerifiedByUsername) {
        throw new ApiError(400, "Username is already taken")
    }

    //extracting profilePhoto if provided
    const profilePhotoLocalPath = req.file?.path;
    console.log("Local Path of the file : " + profilePhotoLocalPath)
    let profilePhoto: any;
    if (profilePhotoLocalPath) {
        //if user gave us an image, we will save it on cloudinary\
        profilePhoto = (await uploadOnCloudinary(profilePhotoLocalPath)).url;
        if (!profilePhoto) {
            throw new ApiError(400, "Avatar Save failed, Please re-insert image.");
        }

    } else {
        //if user didn't gave us the image.
        let aRandomNumber = Math.floor(Math.random() * 6)
        profilePhoto = randomProfilePics[aRandomNumber];
    }

    let otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    let otpCodeExpiry = new Date(Date.now() + 600000)
    let passKey = "";
    if (password == null) {
        //if user didn't gaved us the password, let's create one.
        let string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*{}[]_?~";
        for (let i = 1; i <= 16; i++) {
            let char = Math.floor(Math.random() * string.length);
            passKey += string.charAt(char);
        }
    } else {
        passKey = password;
    }

    const existingUserByEmail = await UserModel.findOne({
        email
    })

    if (existingUserByEmail) {
        if (existingUserByEmail.isVerified) {
            throw new ApiError(409, "User already exists with this email")
        } else {
            await UserModel.findByIdAndDelete(existingUserByEmail._id);
        }
    }

    const user = await UserModel.create({
        email,
        username,
        password: passKey,
        profilePhoto: profilePhoto,
        fullName,
        otpCode,
        otpCodeExpiry
    })


    //send verification email
    const otpEmailOptions = {
        to: email,
        subject: "OTP Verfication",
        templateName: "otpTemplate",
        variables: {
            username: user.username,
            email: user.email,
            otp: otpCode,
            year: new Date().getFullYear().toString(),
        }
    }
    const emailResponse = await sendMail(otpEmailOptions);

    if (!emailResponse.success) {
        throw new ApiError(500, emailResponse.message);
    }

    const passwordData = {
        to: email,
        subject: "Keep this SAFE",
        templateName: "passwordTemplate",
        variables: {
            username: user.username,
            email: user.email,
            password: passKey,
            year: new Date().getFullYear().toString(),
        }
    }
    sendToQueue("sendPassword", passwordData)

    const checkedUser = await UserModel.findById(user._id).select(
        "-password"
    )
    if (!checkedUser) {
        throw new ApiError(500, "Something went wrong while creating the user.")
    }

    return res.status(201).json(
        new ApiResponse(201, checkedUser, "User Registered Successfully, Please verify your email")
    );

})


const signIn = asyncHandler(async (req: Request, res: Response) => {
    const { emailOrUsername, password } = req.body;
    let user;

    if (emailOrUsername.includes("@")) {
        //TODO - We need an frontend check for username that it can't contain @
        user = await UserModel.findOne({ email: emailOrUsername })
    } else {
        user = await UserModel.findOne({ username: emailOrUsername })
    }


    if (!user) {
        throw new ApiError(404, "Signup First")
    }

    if (!user.isVerified) {
        throw new ApiError(403, "Your account is not verified, You should signup again.")
    }

    const isPasswordValid = user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Password is InValid")
    }

    const accessToken: string = await generateAccessToken(user._id as any);

    const loggedInUser = await UserModel.findById(user._id).select("-password");

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    }

    return res.status(200).cookie("accessToken", accessToken, options as any).json(
        new ApiResponse(200, {
            user: loggedInUser,
            accessToken
        },
            "User loggedIn Successfully")
    )
})



const me = asyncHandler(async (req: any, res: Response) => {
    const user = await UserModel.findById(req.user._id).select(
        "-password"
    );
    return res.status(200).json(new ApiResponse(200, { user: user }, "User fetched successfully"));
});


const logout = asyncHandler(async (req: any, res: Response) => {

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    };

    return res
        .status(200)
        .clearCookie("accessToken", options as any)
        .json(new ApiResponse(200, {}, "User LoggedOut Successfully"));
});


const verifyOtp = asyncHandler(async (req: any, res: Response) => {
    const { username, otpReceived } = req.body;

    const toVerifyUser: any = await UserModel.findOne({ username });

    if (!toVerifyUser) {
        throw new ApiError(404, "User not found")
    }

    if (toVerifyUser.isVerified) {
        throw new ApiError(404, "User is already verified")
    }

    //we check if the codeExpirty exists and if it's smaller than our current date
    if (toVerifyUser.otpCodeExpiry && toVerifyUser.otpCodeExpiry < new Date(Date.now())) {
        throw new ApiError(400, "OTP has expired, Re-Request for the otp.")
    }

    if (toVerifyUser.otpCode === otpReceived.toString()) {
        // we will verify the user
        toVerifyUser.isVerified = true;
        await toVerifyUser.save();
        /**
         * We will give the access token here, after this route user probably will land on home page.
        */
        const accessToken = generateAccessToken(toVerifyUser._id);
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }
        return res.status(200).cookie("accessToken", accessToken, cookieOptions as any).json(new ApiResponse(200, {}, "OTP verified successfully"));
    } else {
        throw new ApiError(403, "Otp Entered is Wrong.")
    }

})


const requestOtp = asyncHandler(async (req: any, res: Response) => {
    //User requested for an otp.
    const { emailOrUsername } = req.body;

    if (!emailOrUsername) {
        throw new ApiError(400, "Provide the email or username")
    }

    let targetedUser;
    if (emailOrUsername.includes("@")) {
        //TODO - We need an frontend check for username that it can't contain @
        targetedUser = await UserModel.findOne({ email: emailOrUsername })
    } else {
        targetedUser = await UserModel.findOne({ username: emailOrUsername })
    }

    if (!targetedUser) {
        throw new ApiError(404, "No user found")
    }

    if (targetedUser.isVerified) {
        throw new ApiError(403, "User is already Verified!, No more OTPs")
    }


    let otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    let otpCodeExpiry = new Date(Date.now() + 600000)

    targetedUser.otpCode = otpCode;
    targetedUser.otpCodeExpiry = otpCodeExpiry;
    await targetedUser.save();


    const otpEmailOptions = {
        to: targetedUser.email,
        subject: "OTP Verfication",
        templateName: "otpTemplate",
        variables: {
            username: targetedUser.username,
            email: targetedUser.email,
            otp: otpCode,
            year: new Date().getFullYear().toString(),
        }
    }
    const emailResponse = await sendMail(otpEmailOptions);

    if (!emailResponse.success) {
        console.log("email sent atleast")
        throw new ApiError(500, emailResponse.message);
    }

    return res.status(201).json(
        new ApiResponse(201, {}, "Otp Sent to your Email!, Please verify this time.")
    );
})


const passwordSentByEmail = asyncHandler(async (req: any, res: Response) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(404, "Provide an email")
    }

    const user = await UserModel.findOne({ email: email });

    if (!user) {
        throw new ApiError(404, "No user found")
    }

    user.isPasswordIssued = true;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Email was sent.")
    )

})

export { register, logout, signIn, me, verifyOtp, requestOtp, passwordSentByEmail }