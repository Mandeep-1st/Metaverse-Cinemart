import mongoose, { Document, Schema } from "mongoose";
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from "jsonwebtoken";
export interface IUser extends Document {
    username: string,
    email: string,
    fullName: string,
    password: string,
    avatar: string,
    profilePhoto?: string,
    role: "admin" | "user",
    otpCode?: string,
    otpCodeExpiry?: Date,
    isVerified: boolean,
    isPasswordIssued: boolean,
    generateAccessToken: () => string,
    isPasswordCorrect: (password: string) => any,
}

const UserSchema: Schema<IUser> = new Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, "Please enter a valid email"],
    },
    fullName: {
        type: String,
        required: [true, "Name is required"]
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true,
        default: "abc"
    },
    profilePhoto: {
        type: String,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    otpCode: {
        type: String,
    },
    otpCodeExpiry: {
        type: Date
    },
    isPasswordIssued: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true,
    })

UserSchema.pre<IUser>("save", async function () {
    if (!this.isModified("password")) return;

    if (this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
})


UserSchema.methods.isPasswordCorrect = async function (password: string) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
}

UserSchema.methods.generateAccessToken = function () {
    const ACCESS_TOKEN_SECRET: Secret = process.env.SERVER_VAR_ACCESS_TOKEN_SECRET as Secret;

    if (!ACCESS_TOKEN_SECRET) {
        throw new Error("ACCESS TOKEN SECRET is not defined");
    }

    const ACCESS_TOKEN_EXPIRY: SignOptions["expiresIn"] =
        (process.env.SERVER_VAR_ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"]) || "3d";


    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            role: this.role
        },
        ACCESS_TOKEN_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        }
    )
}


export const UserModel = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema)
