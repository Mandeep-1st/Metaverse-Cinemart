import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import jwt, { JwtPayload } from "jsonwebtoken"
import { UserModel } from "../models/users.model";


interface TokenPayload extends JwtPayload {
    _id: string,
    email: string,
    role: "admin" | "user"
}


const verifyJwt = asyncHandler(async (req: any, res: Response, next: NextFunction) => {

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized Request");
    }

    const ACCESS_TOKEN_SECRET = process.env.SERVER_VAR_ACCESS_TOKEN_SECRET;

    if (!ACCESS_TOKEN_SECRET) {
        throw new Error("ACCESS TOKEN SECRET is not defined");
    }

    const decoded: string | JwtPayload = jwt.verify(token, ACCESS_TOKEN_SECRET);

    if (typeof decoded === "string") {
        throw new ApiError(401, "Invalid Access Token")
    }

    const decodedToken = decoded as TokenPayload;

    const user = await UserModel.findById(decodedToken?._id).select(
        "-password"
    );

    if (!user) {
        throw new ApiError(401, "Invalid Access Token");
    }

    //if user exist then we add that user in req object
    req.user = user;
    next();
})

export { verifyJwt }