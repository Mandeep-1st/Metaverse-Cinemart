import { Router } from "express";
import { getMovieDetails, searchMovie, seedInDatabase } from "../controllers/movie.controller";
import { verifyJwt } from "../middlewares/auth.middleware";



const router: Router = Router();

router.get("/search", verifyJwt, searchMovie)
router.get("/:tmdbId", verifyJwt, getMovieDetails)
router.post("/seed", verifyJwt, seedInDatabase)

export { router as movieRouter }