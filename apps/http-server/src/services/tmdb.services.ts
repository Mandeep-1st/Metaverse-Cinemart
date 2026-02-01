import axios from "axios";
import { MovieModel } from "../models/movies.model";
import {
    InvertedGenreModel,
    InvertedCastModel,
    InvertedDirectorModel,
    InvertedKeywordModel
} from "../models/invertedIndex.model";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export class TMDBService {

    // 1. Seeder , we will call this once or whenever we like.
    static async seedPopularMovies(pages: number = 10) {
        console.log("Builk seeding.")
        let totalIngested = 0;

        for (let page = 1; page <= pages; page++) {
            try {
                const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
                    params: { api_key: TMDB_API_KEY, page: page }
                });

                const movies = response.data.results;

                //batching to get the data in speed.
                await Promise.all(movies.map(async (simpleMovie: any) => {
                    // We must fetch full details because "popular" endpoint gives incomplete data
                    await this.fetchAndIngestMovie(simpleMovie.id);
                }));

                totalIngested += movies.length;
                console.log(`Page ${page} processed.`);
            } catch (error) {
                console.error(`Error seeding page ${page}`, error);
            }
        }
        console.log(`Seeding Complete! Total Movies: ${totalIngested}`);
    }

    // 2. whiele Searchjing Checks DB first, then TMDB
    static async searchMovies(query: string) {
        // A. Check Local DB first
        const localResults = await MovieModel.find({
            title: { $regex: query, $options: "i" }
        }).select("tmdb_id title images.poster metrics.vote_average");

        if (localResults.length > 5) {
            console.log("⚡ Serving search from Cache (DB)");
            return localResults;
        }

        console.log("Searching TMDB for:", query);
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: { api_key: TMDB_API_KEY, query: query }
        });

        const movies = response.data.results;

        // Ingest movies from search results in the background
        movies.map((m: any) => this.fetchAndIngestMovie(m.id)).catch((error: any) =>
            console.error("Error ingesting search results", error)
        );
        return response.data.results.map((m: any) => ({
            tmdb_id: m.id,
            title: m.title,
            images: { poster: m.poster_path },
            metrics: { vote_average: m.vote_average }
        }));
    }

    static async getMovieOrFetch(tmdbId: string) {
        // A. Check DB
        const existingMovie = await MovieModel.findOne({ tmdb_id: tmdbId });
        if (existingMovie) {
            return existingMovie;
        }

        // B. If Not in DB? Fetch, Ingest.
        console.log("Movie not in DB. Fetching from TMDB...");
        return await this.fetchAndIngestMovie(tmdbId);
    }


    private static async fetchAndIngestMovie(tmdbId: string | number) {
        try {
            // Fetch Details + Credits + Keywords in one go using 'append_to_response'
            // 'append_to_response' :- Fetch normal details with the extras 
            const { data } = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    append_to_response: "credits,keywords,images,videos"
                }
            });

            const movieDoc = this.transformData(data);

            // Save to Movie Collection
            await MovieModel.updateOne(
                { tmdb_id: movieDoc.tmdb_id },
                { $set: movieDoc },
                { upsert: true }
            );

            // Update Inverted Indexes not awaitng because it can happen in background
            this.updateInvertedIndexes(movieDoc);

            return movieDoc;
        } catch (error) {
            console.error(`Failed to ingest movie ${tmdbId}`);
            return null;
        }
    }

    private static async updateInvertedIndexes(movieDoc: any) {
        // keeping promise so this will happen in background.
        Promise.all([
            this.updateIndex(InvertedGenreModel, movieDoc.genres, movieDoc.tmdb_id),
            this.updateIndex(InvertedKeywordModel, movieDoc.keywords, movieDoc.tmdb_id),
            this.updateIndex(InvertedCastModel, movieDoc.credits.cast.slice(0, 10), movieDoc.tmdb_id),
            this.updateIndex(InvertedDirectorModel, movieDoc.credits.crew, movieDoc.tmdb_id)
        ]);
    }

    private static async updateIndex(Model: any, items: any[], movieId: number) {
        if (!items || items.length === 0) return;

        const ops = items.map((item) => ({
            updateOne: {
                filter: { _id: item.id },
                update: {
                    $setOnInsert: { name: item.name },
                    $addToSet: { movies: movieId }
                },
                upsert: true //only when not present already
            }
        }));
        await Model.bulkWrite(ops);
    }

    private static transformData(data: any) {
        // we will normalise the data here. data.credits (can fail) 
        return {
            tmdb_id: data.id,
            title: data.title,
            overview: data.overview,
            images: {
                poster: data.poster_path,
                backdrop: data.backdrop_path,
                logo: data.images?.logos?.[0]?.file_path
            },
            video: data.videos?.results?.[0] ? {
                key: data.videos.results[0].key,
                site: data.videos.results[0].site
            } : undefined,
            genres: data.genres || [],
            keywords: data.keywords?.keywords || [],
            credits: {
                cast: (data.credits?.cast || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    character: c.character,
                    profile_path: c.profile_path,
                    order: c.order
                })),
                crew: (data.credits?.crew || [])
                    .filter((c: any) => c.job === "Director" || c.job === "Writer")
                    .map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        job: c.job,
                        department: c.department
                    }))
            },
            details: {
                runtime: data.runtime,
                release_date: data.release_date,
                status: data.status,
                original_language: data.original_language
            },
            metrics: {
                popularity: data.popularity,
                vote_average: data.vote_average,
                vote_count: data.vote_count
            }
        };
    }
}