import mongoose, { Schema, Document, Model } from "mongoose";

// Interface for all Inverted Index types
export interface IInvertedIndex extends Document {
    _id: number; // this is the Id given by the tmdb (like for action:- 42, nolan:- 123 etc.)
    name: string;// Stores the name (action, nolan, etc)
    movies: number[]; // this will contain the movie ids.
}

const InvertedSchema = new Schema<IInvertedIndex>({
    _id: { type: Number, required: true }, // we need the id from tmdb so we override it.
    name: { type: String, required: true }, //action, nolan
    movies: { type: [Number], default: [] } // tmdb_id of movies
});

// We need 4 separate models but they share same structure.
export const InvertedGenreModel = (mongoose.models.InvertedGenre || mongoose.model<IInvertedIndex>("InvertedGenre", InvertedSchema)) as Model<IInvertedIndex>;
export const InvertedCastModel = (mongoose.models.InvertedCast || mongoose.model<IInvertedIndex>("InvertedCast", InvertedSchema)) as Model<IInvertedIndex>;
export const InvertedDirectorModel = (mongoose.models.InvertedDirector || mongoose.model<IInvertedIndex>("InvertedDirector", InvertedSchema)) as Model<IInvertedIndex>;
export const InvertedKeywordModel = (mongoose.models.InvertedKeyword || mongoose.model<IInvertedIndex>("InvertedKeyword", InvertedSchema)) as Model<IInvertedIndex>;

