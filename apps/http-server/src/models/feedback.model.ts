import mongoose, { Document, Schema } from "mongoose";

export interface IFeedback extends Document {
    userId?: mongoose.Types.ObjectId;
    username?: string;
    email?: string;
    category: "general" | "bug" | "feature" | "experience";
    rating: number;
    message: string;
}

const FeedbackSchema = new Schema<IFeedback>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        username: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        category: {
            type: String,
            enum: ["general", "bug", "feature", "experience"],
            default: "general",
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: 5,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

export const FeedbackModel =
    (mongoose.models.Feedback as mongoose.Model<IFeedback>) ||
    mongoose.model<IFeedback>("Feedback", FeedbackSchema);
