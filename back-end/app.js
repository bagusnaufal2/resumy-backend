import express from "express";
import cors from "cors";
import analyzeRoutes from "./routes/analyzeRoutes.js";

const app = express();
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim())
    : "*";

app.use(cors({
    origin: allowedOrigins,
}));

app.use(express.json());
app.use("/api", analyzeRoutes);

export default app;
