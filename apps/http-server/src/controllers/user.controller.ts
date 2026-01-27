import { Request, Response } from "express";
import { UserModel } from "../models/users.model"
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { randomProfilePics } from "../constants/profilePics";
import { sendMail } from "../utils/mailerService";
import { ApiResponse } from "../utils/apiResponse";
import mongoose from "mongoose";





const generateAccessToken = async (userId: mongoose.Types.ObjectId) => {
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



const register = asyncHandler(async (req: Request, res: Response) => {
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
        profilePhoto = await uploadOnCloudinary(profilePhotoLocalPath);
        if (!profilePhoto) {
            throw new ApiError(400, "Avatar Save failed, Please re-insert image.");
        }

    } else {
        //if user didn't gave us the image.
        let aRandomNumber = Math.floor(Math.random() * 6)
        profilePhoto = randomProfilePics[aRandomNumber];
    }

    let otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    let otpCodeExpiry = new Date(Date.now() + 3600000)
    let passKey = "";
    if (password == null) {
        //if user didn't gaved us the password, let's create one.
        let string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*{}[]_?~";
        for (let i = 1; i <= 16; i++) {
            let char = Math.floor(Math.random() * string.length + 1);
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
        profilePhoto: profilePhoto?.url,
        fullName,
        otpCode,
        otpCodeExpiry
    })

    await user.save();

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

    //TODO - we need to setup the redis and shit so we can send password through email

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

    const isPasswordValid = user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Password is InValid")
    }

    const accessToken: string = await generateAccessToken(user._id);

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