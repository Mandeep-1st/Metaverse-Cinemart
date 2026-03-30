import { Router } from "express";
import {
    discoverMovies,
    getMovieDetails,
    getRecommendedMovies,
    getRelatedMovies,
    getUserPreference,
    searchMovie,
    seedInDatabase,
    handleWhenClicked,
    handleWhenSearch,
    handleWhenComment,
    handleWhenRoom,
    initUserPreference
} from "../controllers/movie.controller";
import { verifyJwt } from "../middlewares/auth.middleware";

const router: Router = Router();

router.get("/search", searchMovie)
router.get("/discover", discoverMovies)
router.get("/recommendations", getRecommendedMovies)
router.get("/:tmdbId/related", getRelatedMovies)
router.get("/:tmdbId", getMovieDetails)

// Admin Routes
router.post("/seed", verifyJwt, seedInDatabase)

// User Preference Routes
router.post("/preference/init", initUserPreference) // Smart Init
router.get("/preference", getUserPreference)

// Smart Preference Interaction Routes
router.post("/whenclicked", handleWhenClicked)
router.post("/whensearch", handleWhenSearch)
router.post("/whencomment", handleWhenComment)
router.post("/whenroom", handleWhenRoom)

export { router as movieRouter }
