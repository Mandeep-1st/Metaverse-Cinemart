import mongoose, { Document, Schema } from "mongoose";

export interface IRoom extends Document {
    roomId: string;
    owner: mongoose.Types.ObjectId;
    ownerUsername: string;
    movieTmdbId: number;
    movieTitle: string;
    moviePoster?: string;
    movieBackdrop?: string;
    label?: string;
    description?: string;
    aiMode: boolean;
    status: "active" | "archived";
    configuration: {
        visibility: "private" | "public";
        maxParticipants: number;
        allowChat: boolean;
        allowVoice: boolean;
        allowVoting: boolean;
    };
}

const RoomConfigurationSchema = new Schema(
    {
        visibility: {
            type: String,
            enum: ["private", "public"],
            default: "private",
        },
        maxParticipants: {
            type: Number,
            default: 8,
            min: 2,
            max: 50,
        },
        allowChat: {
            type: Boolean,
            default: true,
        },
        allowVoice: {
            type: Boolean,
            default: true,
        },
        allowVoting: {
            type: Boolean,
            default: true,
        },
    },
    { _id: false }
);

const RoomSchema = new Schema<IRoom>(
    {
        roomId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        ownerUsername: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        movieTmdbId: {
            type: Number,
            required: true,
            index: true,
        },
        movieTitle: {
            type: String,
            required: true,
            trim: true,
        },
        moviePoster: {
            type: String,
        },
        movieBackdrop: {
            type: String,
        },
        label: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        aiMode: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["active", "archived"],
            default: "active",
        },
        configuration: {
            type: RoomConfigurationSchema,
            default: () => ({}),
        },
    },
    {
        timestamps: true,
    }
);

export const RoomModel =
    (mongoose.models.Room as mongoose.Model<IRoom>) ||
    mongoose.model<IRoom>("Room", RoomSchema);
