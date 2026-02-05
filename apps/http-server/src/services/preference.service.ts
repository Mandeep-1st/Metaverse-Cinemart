import { MovieModel } from "../models/movies.model";
import { UserPreferenceModel } from "../models/userPreference.model";
import { InvertedGenreModel, InvertedCastModel, InvertedDirectorModel } from "../models/invertedIndex.model";
import { ApiError } from "../utils/apiError";

export class PreferenceService {
    // ... existing methods ...

    /**
     * Generates movie recommendations for a user based on their preferences
     */
    static async getRecommendations(username: string) {
        // Step 1: Fetch user preferences
        const userPreference = await UserPreferenceModel.findOne({ username });
        if (!userPreference) {
            throw new ApiError(404, "User preference not found");
        }

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
                movieScores.set(movieId, {
                    totalScore: 0,
                    genreMatches: 0,
                    castMatches: 0,
                    directorMatches: 0
                });
            }
            const movieData = movieScores.get(movieId)!;
            movieData.totalScore += score;
            if (category === 'genre') movieData.genreMatches++;
            else if (category === 'cast') movieData.castMatches++;
            else if (category === 'director') movieData.directorMatches++;
        };

        genreIndexes.forEach(idx => {
            const score = genreScoreMap.get(idx._id.toString()) || 0;
            idx.movies.forEach(mId => addMovieScore(mId, score, 'genre'));
        });
        castIndexes.forEach(idx => {
            const score = castScoreMap.get(idx._id.toString()) || 0;
            idx.movies.forEach(mId => addMovieScore(mId, score, 'cast'));
        });
        directorIndexes.forEach(idx => {
            const score = directorScoreMap.get(idx._id.toString()) || 0;
            idx.movies.forEach(mId => addMovieScore(mId, score, 'director'));
        });

        // Step 5: Sort and get top 30
        const sortedMovieEntries = Array.from(movieScores.entries())
            .sort((a, b) => b[1].totalScore - a[1].totalScore)
            .slice(0, 30);

        const sortedMovieIds = sortedMovieEntries.map(([movieId]) => movieId);

        if (sortedMovieIds.length === 0) {
            return {
                recommendations: [],
                preferenceSummary: {
                    totalMoviesScored: 0,
                    moviesReturned: 0
                }
            };
        }

        // Step 6: Fetch actual movie details
        const movies = await MovieModel.find({ tmdb_id: { $in: sortedMovieIds } });
        const movieMap = new Map(movies.map((m: any) => [m.tmdb_id, m]));

        const recommendedMovies = sortedMovieIds
            .map(movieId => {
                const movie = movieMap.get(movieId);
                const scoreData = movieScores.get(movieId);
                if (movie && scoreData) {
                    return {
                        movie,
                        recommendationScore: scoreData
                    };
                }
                return null;
            })
            .filter(item => item !== null);

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


    /**
     * Creates a dynamic user preference based on available data in the database.
     * If no data is available, it throws an error.
     */
    static async createDynamicPreference(username: string, explicitPreference?: any) {
        // 1. Check if preference already exists
        const existingPreference = await UserPreferenceModel.findOne({ username });
        if (existingPreference) {
            throw new ApiError(409, "User preference already exists. Use update endpoint instead.");
        }

        // 2. If explicit preference provided, use it
        if (explicitPreference) {
            return await UserPreferenceModel.create({
                username,
                preference: explicitPreference
            });
        }

        // 3. Otherwise fetch random data from DB to build dynamic preference
        const [genres, castMembers, directors] = await Promise.all([
            InvertedGenreModel.find({}).limit(10),
            InvertedCastModel.find({}).limit(15),
            InvertedDirectorModel.find({}).limit(10)
        ]);

        if (genres.length === 0 && castMembers.length === 0 && directors.length === 0) {
            throw new ApiError(400, "No movie data found in database. Please seed the database first.");
        }

        // 4. Build preferences with random scores
        const genrePreferences = genres.map((g, index) => ({
            id: g._id.toString(),
            score: Math.max(10 - index, 1) + Math.floor(Math.random() * 3)
        }));

        const castPreferences = castMembers.slice(0, 10).map((c, index) => ({
            id: c._id.toString(),
            score: Math.max(10 - index, 1) + Math.floor(Math.random() * 3)
        }));

        const directorPreferences = directors.map((d, index) => ({
            id: d._id.toString(),
            score: Math.max(10 - index, 1) + Math.floor(Math.random() * 3)
        }));

        const dynamicPreference = {
            genre: genrePreferences,
            cast: castPreferences,
            director: directorPreferences
        };

        // 5. Save and return
        return await UserPreferenceModel.create({
            username,
            preference: dynamicPreference
        });
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
}
