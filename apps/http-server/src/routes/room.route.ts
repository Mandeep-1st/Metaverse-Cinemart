import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
    createRoom,
    getMyRooms,
    getRoomById,
    getRoomRecommendations,
} from "../controllers/room.controller";

const router: Router = Router();

router.route("/mine").get(verifyJwt, getMyRooms);
router.route("/").post(verifyJwt, createRoom);
router.route("/:roomId").get(getRoomById);
router.route("/:roomId/recommendations").get(getRoomRecommendations);

export { router as roomRouter };
