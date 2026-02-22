import { MovieModel } from "../models/movies.model";
import { UserPreferenceModel } from "../models/userPreference.model";
import { InvertedGenreModel, InvertedCastModel, InvertedDirectorModel } from "../models/invertedIndex.model";
import { ApiError } from "../utils/apiError";

export class PreferenceService {

    /**
     * Initializes user preference from specific onboarding selections (Genre, Cast, Director IDs).
     * Assigns a default high score (10) to selected items.
     */
    static async initializeFromSelection(
        username: string,
        selectedGenres: string[] = [],
        selectedCast: string[] = [],
        selectedDirectors: string[] = []
    ) {
        // 1. Check if preference already exists
        const existingPreference = await UserPreferenceModel.findOne({ username });
        if (existingPreference) {
            throw new ApiError(409, "User preference already exists. Use update endpoints.");
        }

        // 2. Transform IDs to Preference Objects with a default score
        const INITIAL_SCORE = 10;

        const genrePreferences = selectedGenres.map(id => ({
            id: id.toString(),
            score: INITIAL_SCORE
        }));

        const castPreferences = selectedCast.map(id => ({
            id: id.toString(),
            score: INITIAL_SCORE
        }));

        const directorPreferences = selectedDirectors.map(id => ({
            id: id.toString(),
            score: INITIAL_SCORE
        }));

        // 3. Create the document
        return await UserPreferenceModel.create({
            username,
            preference: {
                genre: genrePreferences,
                cast: castPreferences,
                director: directorPreferences
            }
        });
    }

    /**
     * Updates user preferences based on interaction type (click, search, room, comment).
     * Points: Click=1, Search=2, Room=3, Comment=4
     */
    static async updatePreferenceStats(username: string, interactionType: string, tmdbId: number) {
        // 1. Determine points based on interaction
        let points = 0;
        switch (interactionType) {
            case 'click': points = 1; break;
            case 'search': points = 2; break;
            case 'room': points = 3; break;
            case 'comment': points = 4; break;
            default: throw new ApiError(400, "Invalid interaction type");
        }

        // 2. Fetch the movie to get its metadata
        const movie = await MovieModel.findOne({ tmdb_id: tmdbId });
        if (!movie) {
            throw new ApiError(404, "Movie not found with the provided TMDB ID");
        }

        // 3. Extract IDs
        const genreIds = movie.genres.map(g => g.id.toString());
        const castIds = movie.credits.cast.slice(0, 10).map(c => c.id.toString());
        const director = movie.credits.crew.find(c => c.job === "Director");
        const directorIds = director ? [director.id.toString()] : [];

        // 4. Find or Create User Preference (Lazy Init)
        let userPref = await UserPreferenceModel.findOne({ username });

        if (!userPref) {
            userPref = await UserPreferenceModel.create({
                username,
                preference: { genre: [], cast: [], director: [] }
            });
        }

        // 5. Helper function to update score arrays
        const updateScoreArray = (currentArray: { id: string, score: number }[], idsToUpdate: string[]) => {
            const map = new Map(currentArray.map(item => [item.id, item.score]));

            idsToUpdate.forEach(id => {
                const currentScore = map.get(id) || 0;
                map.set(id, currentScore + points);
            });

            return Array.from(map.entries()).map(([id, score]) => ({ id, score }));
        };

        // 6. Apply updates
        userPref.preference.genre = updateScoreArray(userPref.preference.genre, genreIds);
        userPref.preference.cast = updateScoreArray(userPref.preference.cast, castIds);
        userPref.preference.director = updateScoreArray(userPref.preference.director, directorIds);

        await userPref.save();

        return {
            username,
            updatedMovie: movie.title,
            pointsAdded: points,
            interaction: interactionType
        };
    }

    /**
     * Retrieves a user's preference
     */
    static async getUserPreference(username: string) {
        const userPreference = await UserPreferenceModel.findOne({ username });
        if (!userPreference) {
            throw new ApiError(404, "User preference not found");
        }
        return userPreference;
    }

    /**
     * Generates movie recommendations for a user based on their preferences
     */
    static async getRecommendations(username: string) {
        // Step 1: Fetch user preferences
        const userPreference = await UserPreferenceModel.findOne({ username });
        if (!userPreference) {
            // If no preference found, return empty recommendations or generic fallback
            // For now, returning empty to be safe, or you could return popular movies here.
            return {
                recommendations: [],
                preferenceSummary: { totalMoviesScored: 0, moviesReturned: 0 }
            };
        }

        const { preference } = userPreference;

        // Step 2: Get top 10 from each category based on score
        const topGenres = [...preference.genre].sort((a, b) => b.score - a.score).slice(0, 10);
        const topCast = [...preference.cast].sort((a, b) => b.score - a.score).slice(0, 10);
        const topDirectors = [...preference.director].sort((a, b) => b.score - a.score).slice(0, 10);

        // ... (The rest of the logic remains exactly the same as your previous file) ...
        // Create score maps
        const genreScoreMap = new Map(topGenres.map(g => [g.id, g.score]));
        const castScoreMap = new Map(topCast.map(c => [c.id, c.score]));
        const directorScoreMap = new Map(topDirectors.map(d => [d.id, d.score]));

        // Query inverted indexes
        const genreIds = topGenres.map(g => parseInt(g.id)).filter(id => !isNaN(id));
        const castIds = topCast.map(c => parseInt(c.id)).filter(id => !isNaN(id));
        const directorIds = topDirectors.map(d => parseInt(d.id)).filter(id => !isNaN(id));

        const [genreIndexes, castIndexes, directorIndexes] = await Promise.all([
            InvertedGenreModel.find({ _id: { $in: genreIds } }),
            InvertedCastModel.find({ _id: { $in: castIds } }),
            InvertedDirectorModel.find({ _id: { $in: directorIds } })
        ]);

        // Build movie score map
        const movieScores = new Map<number, { totalScore: number; genreMatches: number; castMatches: number; directorMatches: number; }>();

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

        // Sort and get top 30
        const sortedMovieEntries = Array.from(movieScores.entries()).sort((a, b) => b[1].totalScore - a[1].totalScore).slice(0, 30);
        const sortedMovieIds = sortedMovieEntries.map(([movieId]) => movieId);

        if (sortedMovieIds.length === 0) {
            return { recommendations: [], preferenceSummary: { totalMoviesScored: 0, moviesReturned: 0 } };
        }

        const movies = await MovieModel.find({ tmdb_id: { $in: sortedMovieIds } });
        const movieMap = new Map(movies.map((m: any) => [m.tmdb_id, m]));

        const recommendedMovies = sortedMovieIds.map(movieId => {
            const movie = movieMap.get(movieId);
            const scoreData = movieScores.get(movieId);
            return (movie && scoreData) ? { movie, recommendationScore: scoreData } : null;
        }).filter(item => item !== null);

        return {
            recommendations: recommendedMovies,
            preferenceSummary: {
                topGenres: topGenres.length,
                topCast: topCast.length,
                topDirectors: topDirectors.length,
                totalMoviesScored: movieScores.size,
                moviesReturned: recommendedMovies.length
            }
        };
    }
}