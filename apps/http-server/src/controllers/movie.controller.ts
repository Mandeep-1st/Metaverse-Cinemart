import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { TMDBService } from "../services/tmdb.services";
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

//post -> api/v1/movies/seed

const seedInDatabase = asyncHandler(async (req: any, res: Response) => {
    if (req.user.role != "admin") {
        return res.status(401).json(
            new ApiResponse(401, {}, "You are not allowed to access this route.")
        )
    }

    //not awaiting because not wanted to block the thread.
    TMDBService.seedPopularMovies(5).catch(err => console.error(err))
    return res.status(200).json(new ApiResponse(200, {}, "Seeding started in background"))
})


export { seedInDatabase, getMovieDetails, searchMovie };