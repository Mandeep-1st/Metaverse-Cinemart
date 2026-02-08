import { Router } from "express";
import {
    getMovieDetails,
    getRecommendedMovies,
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
router.get("/recommendations", verifyJwt, getRecommendedMovies)
router.get("/:tmdbId", verifyJwt, getMovieDetails)

// Admin Routes
router.post("/seed", verifyJwt, seedInDatabase)

// User Preference Routes
router.post("/preference/init", verifyJwt, initUserPreference) // Smart Init
router.get("/preference", verifyJwt, getUserPreference)

// Smart Preference Interaction Routes
router.post("/whenclicked", verifyJwt, handleWhenClicked)
router.post("/whensearch", verifyJwt, handleWhenSearch)
router.post("/whencomment", verifyJwt, handleWhenComment)
router.post("/whenroom", verifyJwt, handleWhenRoom)

export { router as movieRouter }