import { Router } from "express";
import {
    createUserPreference,
    getMovieDetails,
    getRecommendedMovies,
    getUserPreference,
    searchMovie,
    seedInDatabase
} from "../controllers/movie.controller";
import { verifyJwt } from "../middlewares/auth.middleware";

const router: Router = Router();

router.get("/search", searchMovie)
router.get("/recommendations", verifyJwt, getRecommendedMovies)
router.get("/:tmdbId", verifyJwt, getMovieDetails)

// Admin Routes
router.post("/seed", verifyJwt, seedInDatabase)

// User Preference Routes
router.post("/preference", verifyJwt, createUserPreference)
router.get("/preference", verifyJwt, getUserPreference)

export { router as movieRouter }