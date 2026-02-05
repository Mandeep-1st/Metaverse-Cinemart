import { Router } from "express";
import { createUserPreference, getMovieDetails, getRecommendedMovies, getUserPreference, searchMovie, seedInDatabase, seedTestData } from "../controllers/movie.controller";
import { verifyJwt } from "../middlewares/auth.middleware";



const router: Router = Router();

router.get("/search", searchMovie)
router.get("/recommendations", verifyJwt, getRecommendedMovies)
router.get("/:tmdbId", verifyJwt, getMovieDetails)
router.post("/seed", verifyJwt, seedInDatabase)
router.post("/seed-test", seedTestData)  // No auth needed for test seeding

// User Preference Routes
router.post("/preference", verifyJwt, createUserPreference)
router.get("/preference", verifyJwt, getUserPreference)

export { router as movieRouter }