import express from "express";
import analyzeResume from "../controllers/analyzeController.js";
import upload from "../middlewares/uploadMiddleware.js";
const router = express.Router();

router.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Server is running"
    });
});

router.post("/analyze", upload.single("resume"), analyzeResume);

export default router;
