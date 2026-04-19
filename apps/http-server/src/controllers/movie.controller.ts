import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { TMDBService } from "../services/tmdb.services";
import { PreferenceService } from "../services/preference.services";
import { ApiResponse } from "../utils/apiResponse";

//get -> /movies/search?query=batman
const searchMovie = asyncHandler(async (req: any, res: Response) => {
    const query = req.query.query as string;

    if (!query) {
        throw new ApiError(400, "Query parameter is required")
    }

    //Calling search service
    const movies = await TMDBService.searchMovies(query);

    return res.status(200).json(new ApiResponse(200, movies, "Search results fetched successfully"))

})


//get -> api/v1/movies/Movie_ID
const getMovieDetails = asyncHandler(async (req: any, res: Response) => {
    const { tmdbId } = req.params;


    if (!tmdbId) {
        throw new ApiError(400, "Movie ID is required")
    }

    const movie = await TMDBService.getMovieOrFetch(tmdbId);

    if (!movie) {
        throw new ApiError(404, "Movie not found")
    }

    res.status(200).json(new ApiResponse(200, movie, "Movie details fetched successfully"))
})

const discoverMovies = asyncHandler(async (req: any, res: Response) => {
    const category = (req.query.category as string) || "popular";
    const page = Number(req.query.page || 1);

    const movies = await TMDBService.discoverMovies(category, page);

    return res.status(200).json(
        new ApiResponse(200, movies, "Movies fetched successfully")
    );
})

const getRelatedMovies = asyncHandler(async (req: any, res: Response) => {
    const { tmdbId } = req.params;

    if (!tmdbId) {
        throw new ApiError(400, "Movie ID is required")
    }

    const movies = await TMDBService.getRelatedMovies(tmdbId);

    return res.status(200).json(
        new ApiResponse(200, movies, "Related movies fetched successfully")
    );
})

//post -> api/v1/movies/seed (ADMIN ONLY)
const seedInDatabase = asyncHandler(async (req: any, res: Response) => {
    if (req.user.role != "admin") {
        return res.status(401).json(
            new ApiResponse(401, {}, "You are not allowed to access this route.")
        )
    }

    // Trigger background seeding of popular movies (5 pages)
    TMDBService.seedPopularMovies(5).catch(err => console.error(err))

    return res.status(200).json(new ApiResponse(200, {}, "Production seeding started in background"))
})

// POST -> /movies/preference/init
const initUserPreference = asyncHandler(async (req: any, res: Response) => {
    const { username, genres, cast, directors } = req.body;

    if (!username) {
        throw new ApiError(400, "Username is required");
    }

    const newPreference = await PreferenceService.initializeFromSelection(
        username,
        genres,
        cast,
        directors
    );

    return res.status(201).json(
        new ApiResponse(201, newPreference, "User preferences initialized successfully")
    );
});

// GET -> /movies/preference?username=user123
const getUserPreference = asyncHandler(async (req: any, res: Response) => {
    const username = req.query.username as string;
    if (!username) throw new ApiError(400, "username parameter is required");

    const userPreference = await PreferenceService.getUserPreference(username);
    return res.status(200).json(new ApiResponse(200, userPreference, "Fetched successfully"));
});


// GET -> /movies/recommendations?username=user123
const getRecommendedMovies = asyncHandler(async (req: any, res: Response) => {
    const username = req.query.username as string;
    if (!username) throw new ApiError(400, "username parameter is required");

    const recommendations = await PreferenceService.getRecommendations(username);
    return res.status(200).json(new ApiResponse(200, recommendations, "Fetched successfully"));
});

// --- Interaction Handlers ---
const trackInteraction = async (req: any, res: Response, type: string) => {
    const { username, movie } = req.body;
    if (!username || !movie) throw new ApiError(400, "Username and movie (TMDB ID) required");

    const result = await PreferenceService.updatePreferenceStats(username, type, parseInt(movie));
    return res.status(200).json(new ApiResponse(200, result, `Preference updated for ${type}`));
};

const handleWhenClicked = asyncHandler(async (req: any, res: Response) => trackInteraction(req, res, 'click'));
const handleWhenSearch = asyncHandler(async (req: any, res: Response) => trackInteraction(req, res, 'search'));
const handleWhenComment = asyncHandler(async (req: any, res: Response) => trackInteraction(req, res, 'comment'));
const handleWhenRoom = asyncHandler(async (req: any, res: Response) => trackInteraction(req, res, 'room'));

export {
    seedInDatabase,
    discoverMovies,
    getMovieDetails,
    getRelatedMovies,
    searchMovie,
    getUserPreference,
    initUserPreference,   // EXPORTED
    getRecommendedMovies,
    handleWhenClicked,
    handleWhenSearch,
    handleWhenComment,
    handleWhenRoom
};
