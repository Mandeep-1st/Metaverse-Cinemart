import { randomUUID } from "crypto";
import { Response } from "express";
import { RoomModel } from "../models/room.model";
import { TMDBService } from "../services/tmdb.services";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const DEFAULT_WEB_ROOM_URL = "https://metaverse-cinemart-web-room.vercel.app";

const buildShareLink = (roomId: string, movieId: number, aiMode: boolean) => {
    const baseUrl =
        process.env.SERVER_VAR_WEB_ROOM_URL || DEFAULT_WEB_ROOM_URL;
    const searchParams = new URLSearchParams({
        roomId,
        movieId: String(movieId),
    });

    if (aiMode) {
        searchParams.set("ai", "1");
    }

    return `${baseUrl.replace(/\/$/, "")}/?${searchParams.toString()}`;
};

const createRoom = asyncHandler(async (req: any, res: Response) => {
    const {
        movieId,
        label,
        description,
        aiMode = false,
        visibility = "private",
        maxParticipants = 8,
        allowChat = true,
        allowVoice = true,
        allowVoting = true,
    } = req.body;

    if (!movieId) {
        throw new ApiError(400, "Movie ID is required");
    }

    const movie = await TMDBService.getMovieOrFetch(String(movieId));

    if (!movie) {
        throw new ApiError(404, "Movie not found");
    }

    const roomId = randomUUID();

    const room = await RoomModel.create({
        roomId,
        owner: req.user._id,
        ownerUsername: req.user.username,
        movieTmdbId: Number(movie.tmdb_id),
        movieTitle: movie.title,
        moviePoster: movie.images?.poster,
        movieBackdrop: movie.images?.backdrop,
        label: label?.trim() || `${movie.title} Watch Party`,
        description: description?.trim() || "",
        aiMode: Boolean(aiMode),
        configuration: {
            visibility,
            maxParticipants,
            allowChat,
            allowVoice,
            allowVoting,
        },
    });

    const shareLink = buildShareLink(
        room.roomId,
        room.movieTmdbId,
        room.aiMode
    );

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                room,
                shareLink,
            },
            "Room created successfully"
        )
    );
});

const getMyRooms = asyncHandler(async (req: any, res: Response) => {
    const rooms = await RoomModel.find({
        owner: req.user._id,
        status: "active",
    }).sort({ createdAt: -1 });

    const roomList = rooms.map((room) => ({
        ...room.toObject(),
        shareLink: buildShareLink(room.roomId, room.movieTmdbId, room.aiMode),
    }));

    return res.status(200).json(
        new ApiResponse(200, roomList, "Rooms fetched successfully")
    );
});

const getRoomById = asyncHandler(async (req: any, res: Response) => {
    const { roomId } = req.params;

    const room = await RoomModel.findOne({ roomId, status: "active" });

    if (!room) {
        throw new ApiError(404, "Room not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                ...room.toObject(),
                shareLink: buildShareLink(
                    room.roomId,
                    room.movieTmdbId,
                    room.aiMode
                ),
            },
            "Room fetched successfully"
        )
    );
});

const getRoomRecommendations = asyncHandler(async (req: any, res: Response) => {
    const { roomId } = req.params;
    const room = await RoomModel.findOne({ roomId, status: "active" });

    if (!room) {
        throw new ApiError(404, "Room not found");
    }

    const recommendations = await TMDBService.getRelatedMovies(
        room.movieTmdbId,
        8
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            recommendations,
            "Room recommendations fetched successfully"
        )
    );
});

export {
    createRoom,
    getMyRooms,
    getRoomById,
    getRoomRecommendations,
};
