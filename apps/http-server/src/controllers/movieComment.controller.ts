import { Response } from "express";
import { MovieCommentModel } from "../models/movieComment.model";
import { PreferenceService } from "../services/preference.services";
import { TMDBService } from "../services/tmdb.services";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const normalizeMovieId = (tmdbId: string) => {
    const numericId = Number(tmdbId);

    if (!tmdbId || !Number.isFinite(numericId)) {
        throw new ApiError(400, "A valid movie ID is required");
    }

    return numericId;
};

const listMovieComments = asyncHandler(async (req: any, res: Response) => {
    const movieTmdbId = normalizeMovieId(req.params.tmdbId);

    const movie = await TMDBService.getMovieOrFetch(movieTmdbId);

    if (!movie) {
        throw new ApiError(404, "Movie not found");
    }

    const comments = await MovieCommentModel.find({ movieTmdbId })
        .sort({ createdAt: -1 })
        .lean();

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Movie comments fetched successfully"));
});

const createMovieComment = asyncHandler(async (req: any, res: Response) => {
    const movieTmdbId = normalizeMovieId(req.params.tmdbId);
    const { text } = req.body as { text?: string };

    if (!text?.trim()) {
        throw new ApiError(400, "Comment text is required");
    }

    const movie = await TMDBService.getMovieOrFetch(movieTmdbId);

    if (!movie) {
        throw new ApiError(404, "Movie not found");
    }

    const comment = await MovieCommentModel.create({
        movieTmdbId,
        userId: req.user._id,
        username: req.user.username,
        fullName: req.user.fullName,
        avatar: req.user.avatar || "",
        profilePhoto: req.user.profilePhoto || "",
        text: text.trim(),
    });

    PreferenceService.updatePreferenceStats(req.user.username, "comment", movieTmdbId)
        .catch((error) => console.error("Comment preference tracking failed", error));

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Movie comment created successfully"));
});

export { listMovieComments, createMovieComment };
