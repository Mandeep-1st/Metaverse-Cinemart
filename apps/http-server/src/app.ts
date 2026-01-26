import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./utils/globalErrorHandler";

const app: Application = express();

app.use(cors({ origin: process.env.SERVER_VAR_CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//importing routes
// import userRouter from "./routes/user.routes.js";

//using routes
// app.use("/api/v1/users", userRouter);


app.use(globalErrorHandler);
export { app };
