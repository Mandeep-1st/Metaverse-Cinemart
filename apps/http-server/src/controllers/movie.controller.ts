import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { TMDBService } from "../services/tmdb.services";
import { PreferenceService } from "../services/preference.service";
import { ApiResponse } from "../utils/apiResponse";
import { InvertedGenreModel, InvertedCastModel, InvertedDirectorModel } from "../models/invertedIndex.model";
import { MovieModel } from "../models/movies.model";


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

//post -> /movies/preference
const createUserPreference = asyncHandler(async (req: any, res: Response) => {
    const { username, preference } = req.body;

    if (!username) {
        throw new ApiError(400, "username is required");
    }

    try {
        // Delegate to service
        const newPreference = await PreferenceService.createDynamicPreference(username, preference);

        return res.status(201).json(
            new ApiResponse(201, newPreference, "User preference created successfully")
        );
    } catch (error: any) {
        if (error instanceof ApiError) throw error;

        console.error("Error creating preference:", error);
        throw new ApiError(500, "Failed to create user preference: " + error.message);
    }
});

//get -> /movies/preference?username=user123
const getUserPreference = asyncHandler(async (req: any, res: Response) => {
    const username = req.query.username as string;

    if (!username) {
        throw new ApiError(400, "username parameter is required");
    }

    const userPreference = await PreferenceService.getUserPreference(username);

    return res.status(200).json(
        new ApiResponse(200, userPreference, "User preference fetched successfully")
    );
});

//get -> /movies/recommendations?username=user123
const getRecommendedMovies = asyncHandler(async (req: any, res: Response) => {
    const username = req.query.username as string;

    if (!username) {
        throw new ApiError(400, "username parameter is required");
    }

    // Step 1: Fetch user preferences
    const userPreference = await PreferenceService.getUserPreference(username);
    const { preference } = userPreference;

    // Step 2: Get top 10 from each category based on score
    const topGenres = [...preference.genre].sort((a, b) => b.score - a.score).slice(0, 10);
    const topCast = [...preference.cast].sort((a, b) => b.score - a.score).slice(0, 10);
    const topDirectors = [...preference.director].sort((a, b) => b.score - a.score).slice(0, 10);

    // Create score maps for quick lookup
    const genreScoreMap = new Map(topGenres.map(g => [g.id, g.score]));
    const castScoreMap = new Map(topCast.map(c => [c.id, c.score]));
    const directorScoreMap = new Map(topDirectors.map(d => [d.id, d.score]));

    // Step 3: Query inverted indexes
    const genreIds = topGenres.map(g => parseInt(g.id)).filter(id => !isNaN(id));
    const castIds = topCast.map(c => parseInt(c.id)).filter(id => !isNaN(id));
    const directorIds = topDirectors.map(d => parseInt(d.id)).filter(id => !isNaN(id));

    const [genreIndexes, castIndexes, directorIndexes] = await Promise.all([
        InvertedGenreModel.find({ _id: { $in: genreIds } }),
        InvertedCastModel.find({ _id: { $in: castIds } }),
        InvertedDirectorModel.find({ _id: { $in: directorIds } })
    ]);

    // Step 4: Build movie score map
    const movieScores = new Map<number, {
        totalScore: number;
        genreMatches: number;
        castMatches: number;
        directorMatches: number;
    }>();

    const addMovieScore = (movieId: number, score: number, category: 'genre' | 'cast' | 'director') => {
        if (!movieScores.has(movieId)) {
            movieScores.set(movieId, { totalScore: 0, genreMatches: 0, castMatches: 0, directorMatches: 0 });
        }
        const movieData = movieScores.get(movieId)!;
        movieData.totalScore += score;
        if (category === 'genre') movieData.genreMatches++;
        else if (category === 'cast') movieData.castMatches++;
        else if (category === 'director') movieData.directorMatches++;
    };

    genreIndexes.forEach(idx => idx.movies.forEach(mId => addMovieScore(mId, genreScoreMap.get(idx._id.toString()) || 0, 'genre')));
    castIndexes.forEach(idx => idx.movies.forEach(mId => addMovieScore(mId, castScoreMap.get(idx._id.toString()) || 0, 'cast')));
    directorIndexes.forEach(idx => idx.movies.forEach(mId => addMovieScore(mId, directorScoreMap.get(idx._id.toString()) || 0, 'director')));

    // Step 5: Sort movies by total score and get top 30
    const sortedMovieEntries = Array.from(movieScores.entries())
        .sort((a, b) => b[1].totalScore - a[1].totalScore)
        .slice(0, 30);

    const sortedMovieIds = sortedMovieEntries.map(([movieId]) => movieId);

    if (sortedMovieIds.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No recommendations found"));
    }

    // Step 6: Fetch actual movie details
    const movies = await MovieModel.find({ tmdb_id: { $in: sortedMovieIds } });
    const movieMap = new Map(movies.map((m: any) => [m.tmdb_id, m]));

    const recommendedMovies = sortedMovieIds
        .map(movieId => {
            const movie = movieMap.get(movieId);
            const scoreData = movieScores.get(movieId);
            return (movie && scoreData) ? { movie, recommendationScore: scoreData } : null;
        })
        .filter(item => item !== null);

    return res.status(200).json(
        new ApiResponse(200, {
            recommendations: recommendedMovies,
            preferenceSummary: {
                totalMoviesScored: movieScores.size,
                moviesReturned: recommendedMovies.length
            }
        }, "Movie recommendations fetched successfully")
    );
});

export { seedInDatabase, getMovieDetails, searchMovie, getUserPreference, createUserPreference, getRecommendedMovies };