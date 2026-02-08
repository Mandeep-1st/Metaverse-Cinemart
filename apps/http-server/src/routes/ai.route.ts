import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
    getSuggestion,
    askAboutMovie,
    simpleChat
} from "../controllers/ai.controller";

const router: Router = Router();

router.use(verifyJwt);
router.post("/suggest", getSuggestion);
router.post("/context-chat", askAboutMovie);
router.post("/chat", simpleChat);

export { router as aiRouter };