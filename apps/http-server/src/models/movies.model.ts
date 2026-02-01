import mongoose, { Schema, Document } from "mongoose";

// Sub-Schemas required for main schema

const ImageSchema = new Schema({
    poster: { type: String, required: true },
    backdrop: { type: String }, // Made Optional
    logo: { type: String },     // Made Optional
}, { _id: false });

const VideoSchema = new Schema({
    key: { type: String, required: true },
    site: { type: String, required: true },
}, { _id: false });

const GenreSchema = new Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
}, { _id: false });

const KeywordSchema = new Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
}, { _id: false });

const CastSchema = new Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    character: { type: String, required: true },
    profile_path: { type: String },
    order: { type: Number },
}, { _id: false });

const CrewSchema = new Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    job: { type: String, required: true },
    department: { type: String, required: true },
}, { _id: false });

const DetailsSchema = new Schema({
    runtime: { type: Number },
    release_date: { type: Date },
    status: { type: String, required: true }, // Removed Enum to prevent TMDB errors
    original_language: { type: String },
}, { _id: false });

const MetricsSchema = new Schema({
    popularity: { type: Number },
    vote_average: { type: Number },
    vote_count: { type: Number },
}, { _id: false });

const InternalStatsSchema = new Schema({
    rooms_created: { type: Number, default: 0 },
    total_views: { type: Number, default: 0 },
}, { _id: false });

//  Main Movie Mongo Schema 

export interface IMovie extends Document {
    tmdb_id: number;
    title: string;
    overview: string;
    images: { poster: string; backdrop?: string; logo?: string };
    video?: { key: string; site: string };
    genres: { id: number; name: string }[];
    keywords: { id: number; name: string }[];
    credits: {
        cast: { id: number; name: string; character: string; profile_path?: string; order?: number }[];
        crew: { id: number; name: string; job: string; department: string }[];
    };
    details: { runtime?: number; release_date?: Date; status: string; original_language?: string };
    metrics: { popularity?: number; vote_average?: number; vote_count?: number };
    internal_stats: { rooms_created: number; total_views: number };
}

const MovieSchema = new Schema<IMovie>(
    {
        tmdb_id: { type: Number, required: true, unique: true, index: true },
        title: { type: String, required: true },
        overview: { type: String },
        images: { type: ImageSchema, required: true },
        video: { type: VideoSchema },
        genres: { type: [GenreSchema], default: [] },
        keywords: { type: [KeywordSchema], default: [] },
        credits: {
            cast: { type: [CastSchema], default: [] },
            crew: { type: [CrewSchema], default: [] }
        },
        details: { type: DetailsSchema },
        metrics: { type: MetricsSchema },
        internal_stats: { type: InternalStatsSchema, default: () => ({}) },
    },
    { timestamps: true }
);

export const MovieModel = mongoose.models.Movie || mongoose.model<IMovie>("Movie", MovieSchema);