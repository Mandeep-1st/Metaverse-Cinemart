import mongoose, { Schema, Document } from "mongoose";

// Sub-Schemas for preferences
const PreferenceItemSchema = new Schema({
    id: { type: String, required: true },
    score: { type: Number, required: true }
}, { _id: false });

const PreferencesSchema = new Schema({
    genre: { type: [PreferenceItemSchema], default: [] },
    cast: { type: [PreferenceItemSchema], default: [] },
    director: { type: [PreferenceItemSchema], default: [] }
}, { _id: false });

// Main UserPreference Interface
export interface IUserPreference extends Document {
    username: string;
    preference: {
        genre: { id: string; score: number }[];
        cast: { id: string; score: number }[];
        director: { id: string; score: number }[];
    };
}

// Main UserPreference Schema
const UserPreferenceSchema = new Schema<IUserPreference>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        preference: {
            type: PreferencesSchema,
            default: () => ({})
        }
    },
    { timestamps: true }
);

export const UserPreferenceModel = mongoose.models.UserPreferenceV2 as mongoose.Model<IUserPreference>
    || mongoose.model<IUserPreference>("UserPreferenceV2", UserPreferenceSchema) as mongoose.Model<IUserPreference>;