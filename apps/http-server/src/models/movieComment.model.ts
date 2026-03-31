import mongoose, { Document, Schema } from "mongoose";

export interface IMovieComment extends Document {
    movieTmdbId: number;
    userId: mongoose.Types.ObjectId;
    username: string;
    fullName: string;
    avatar?: string;
    profilePhoto?: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

const MovieCommentSchema = new Schema<IMovieComment>(
    {
        movieTmdbId: {
            type: Number,
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        username: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        avatar: {
            type: String,
            default: "",
        },
        profilePhoto: {
            type: String,
            default: "",
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1500,
        },
    },
    {
        timestamps: true,
    }
);

export const MovieCommentModel =
    (mongoose.models.MovieComment as mongoose.Model<IMovieComment>) ||
    mongoose.model<IMovieComment>("MovieComment", MovieCommentSchema);
