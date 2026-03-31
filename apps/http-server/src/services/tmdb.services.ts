import axios from "axios";
import { MovieModel } from "../models/movies.model";
import https from 'https'
import {
    InvertedGenreModel,
    InvertedCastModel,
    InvertedDirectorModel,
    InvertedKeywordModel
} from "../models/invertedIndex.model";

const TMDB_TOKEN = process.env.SERVER_VAR_TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export class TMDBService {

    private static agent = new https.Agent({ family: 4 })
    private static getOptions(params?: object) {
        return {
            headers: {
                accept: "application/json",
                Authorization: `Bearer ${TMDB_TOKEN}`
            },
            httpsAgent: this.agent,
            params: params,
            timeout: 10000
        }
    }

    private static buildVideoLinks(video: any) {
        const key = String(video?.key ?? "");
        const site = String(video?.site ?? "");

        if (!key || !site) {
            return { url: "", embedUrl: "" };
        }

        if (site === "YouTube") {
            return {
                url: `https://www.youtube.com/watch?v=${key}`,
                embedUrl: `https://www.youtube.com/embed/${key}`,
            };
        }

        if (site === "Vimeo") {
            return {
                url: `https://vimeo.com/${key}`,
                embedUrl: `https://player.vimeo.com/video/${key}`,
            };
        }

        return {
            url: key,
            embedUrl: "",
        };
    }

    // 1. Seeder - Returns number of movies ingested
    static async seedPopularMovies(pages: number = 10): Promise<number> {
        console.log("Bulk seeding started.")
        let totalIngested = 0;

        for (let page = 1; page <= pages; page++) {
            try {
                const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, this.getOptions({ page: page }));
                const movies = response.data.results;

                // Process batch
                const results = await Promise.all(movies.map(async (simpleMovie: any) => {
                    const doc = await this.fetchAndIngestMovie(simpleMovie.id);
                    return doc ? 1 : 0;
                }));

                const countInPage = results.reduce((a: number, b: number) => a + b, 0);
                totalIngested += countInPage;

                console.log(`Page ${page} processed. Added ${countInPage} movies.`);
            } catch (error) {
                console.error(`Error seeding page ${page}`, error);
            }
        }
        console.log(`Seeding Complete! Total Movies: ${totalIngested}`);
        return totalIngested;
    }

    static async discoverMovies(category: string = "popular", page: number = 1) {
        const normalizedCategory = category === "top_rated" ? "top_rated" : "popular";
        const response = await axios.get(
            `${TMDB_BASE_URL}/movie/${normalizedCategory}`,
            this.getOptions({ page })
        );

        const movies = response.data.results || [];

        Promise.all(movies.slice(0, 12).map((m: any) => this.fetchAndIngestMovie(m.id)))
            .catch((error: any) => console.error("Error ingesting discover results", error));

        return movies.map((m: any) => ({
            tmdb_id: m.id,
            title: m.title,
            overview: m.overview,
            images: {
                poster: m.poster_path
                    ? `https://image.tmdb.org/t/p/original${m.poster_path}`
                    : null,
                backdrop: m.backdrop_path
                    ? `https://image.tmdb.org/t/p/original${m.backdrop_path}`
                    : null,
            },
            metrics: {
                vote_average: m.vote_average,
                popularity: m.popularity,
            },
            details: {
                release_date: m.release_date,
            },
        }));
    }

    // 2. While Searching Checks DB first, then TMDB
    static async searchMovies(query: string) {
        // A. Check Local DB first
        const localResults = await MovieModel.find({
            title: { $regex: query, $options: "i" }
        }).select("tmdb_id title images.poster metrics.vote_average");

        if (localResults.length > 5) {
            console.log("Serving search from Cache");
            return localResults;
        }

        console.log("Searching TMDB for:", query);
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, this.getOptions({ query: query }));

        const movies = response.data.results;

        // Ingest movies from search results in the background
        Promise.all(movies.map((m: any) => this.fetchAndIngestMovie(m.id)))
            .catch((error: any) => console.error("Error ingesting search results", error));

        return response.data.results.map((m: any) => ({
            tmdb_id: m.id,
            title: m.title,
            images: { poster: m.poster_path },
            metrics: { vote_average: m.vote_average }
        }));
    }

    static async getMovieOrFetch(tmdbId: string | number) {
        // A. Check DB
        const normalizedId = Number(tmdbId);
        const existingMovie = await MovieModel.findOne({
            tmdb_id: Number.isNaN(normalizedId) ? tmdbId : normalizedId
        });
        if (existingMovie) {
            if (typeof (existingMovie as any).videos === "undefined") {
                const refreshedMovie = await this.fetchAndIngestMovie(
                    Number.isNaN(normalizedId) ? tmdbId : normalizedId,
                );
                return refreshedMovie || existingMovie;
            }
            console.log("Movie should exist")
            return existingMovie;
        }

        // B. If Not in DB? Fetch, Ingest.
        console.log("Movie not in DB. Fetching from TMDB......");
        return await this.fetchAndIngestMovie(tmdbId);
    }

    static async getRelatedMovies(tmdbId: string | number, limit: number = 12) {
        const response = await axios.get(
            `${TMDB_BASE_URL}/movie/${tmdbId}/recommendations`,
            this.getOptions()
        );

        const movies = (response.data.results || []).slice(0, limit);

        Promise.all(movies.map((movie: any) => this.fetchAndIngestMovie(movie.id)))
            .catch((error: any) => console.error("Error ingesting related movies", error));

        return movies.map((m: any) => ({
            tmdb_id: m.id,
            title: m.title,
            overview: m.overview,
            images: {
                poster: m.poster_path
                    ? `https://image.tmdb.org/t/p/original${m.poster_path}`
                    : null,
                backdrop: m.backdrop_path
                    ? `https://image.tmdb.org/t/p/original${m.backdrop_path}`
                    : null,
            },
            metrics: {
                vote_average: m.vote_average,
                popularity: m.popularity,
            },
            details: {
                release_date: m.release_date,
            },
        }));
    }

    private static async fetchAndIngestMovie(tmdbId: string | number) {
        try {
            // Fetch Details + Credits + Keywords in one go using 'append_to_response'
            const { data } = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, this.getOptions({
                append_to_response: "credits,keywords,images,videos"
            }));

            const movieDoc = this.transformData(data);

            // Save to Movie Collection
            await MovieModel.updateOne(
                { tmdb_id: movieDoc.tmdb_id },
                { $set: movieDoc },
                { upsert: true }
            );

            // Update Inverted Indexes not awaiting because it can happen in background
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
                upsert: true
            }
        }));
        await Model.bulkWrite(ops);
    }

    private static transformData(data: any) {
        const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original"; // High quality
        const playableVideos = (data.videos?.results || [])
            .map((video: any) => {
                const links = this.buildVideoLinks(video);

                if (!links.url) {
                    return null;
                }

                return {
                    key: video.key,
                    url: links.url,
                    embedUrl: links.embedUrl || undefined,
                    site: video.site,
                    name: video.name,
                    type: video.type,
                    official: video.official,
                    published_at: video.published_at,
                };
            })
            .filter(Boolean);

        const explicitTrailer = playableVideos.find(
            (video: any) => String(video?.type ?? "").toLowerCase() === "trailer",
        );

        return {
            tmdb_id: data.id,
            title: data.title,
            overview: data.overview,
            images: {
                poster: data.poster_path ? `${IMAGE_BASE_URL}${data.poster_path}` : null,
                backdrop: data.backdrop_path ? `${IMAGE_BASE_URL}${data.backdrop_path}` : null,
                logo: data.images?.logos?.[0]?.file_path
                    ? `${IMAGE_BASE_URL}${data.images.logos[0].file_path}`
                    : null
            },
            video: explicitTrailer,
            videos: playableVideos,

            genres: data.genres || [],
            keywords: data.keywords?.keywords || [],

            credits: {
                cast: (data.credits?.cast || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    character: c.character,
                    profile_path: c.profile_path ? `${IMAGE_BASE_URL}${c.profile_path}` : null,
                    order: c.order
                })),
                crew: (data.credits?.crew || [])
                    .filter((c: any) => c.job === "Director" || c.job === "Writer")
                    .map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        job: c.job,
                        department: c.department,
                        profile_path: c.profile_path ? `${IMAGE_BASE_URL}${c.profile_path}` : null
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
