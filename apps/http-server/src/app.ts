import "dotenv/config";
import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./utils/globalErrorHandler";
import { verifyMailer } from "./utils/nodemailer";

const app: Application = express();

// If SERVER_VAR_CORS_ORIGIN is missing, reflect the request origin (dev-friendly).
// This prevents the browser from blocking cross-origin REST calls during local testing.
const corsOrigins = process.env.SERVER_VAR_CORS_ORIGIN
    ? process.env.SERVER_VAR_CORS_ORIGIN.split(",")
    : [];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || corsOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

verifyMailer();
// importing routes
import { userRouter } from "./routes/user.route"
import { movieRouter } from "./routes/movie.route"
import { aiRouter } from "./routes/ai.route";
import { roomRouter } from "./routes/room.route";
// using routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/movies", movieRouter)
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/rooms", roomRouter);



app.use(globalErrorHandler);
export { app };
