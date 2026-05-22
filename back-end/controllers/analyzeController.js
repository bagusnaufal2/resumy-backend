import { buildResumeInsights, predictResumeMatch } from "../services/aiService.js";
import { extractTextFromResume } from "../services/fileParserService.js";

function getErrorStatusCode(error) {
  if (Number.isInteger(error?.statusCode)) {
    return error.statusCode;
  }

  return 500;
}

async function analyzeResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF, DOC, or DOCX file.",
      });
    }

    const jobDescText = req.body?.jobDescText?.trim();

    if (!jobDescText) {
      return res.status(400).json({
        success: false,
        message: "Please provide a job description before analyzing the resume.",
      });
    }

    const parsedResume = await extractTextFromResume(req.file);
    const prediction = await predictResumeMatch({
      cvText: parsedResume.text,
      jobDescText,
    });
    const insights = buildResumeInsights({
      cvText: parsedResume.text,
      jobDescText,
      prediction,
    });

    return res.json({
      success: true,
      message: "Resume analyzed successfully.",
      data: {
        score: prediction.match_percentage,
        skillsHave: insights.skillsHave,
        skillsMissing: insights.skillsMissing,
        improvements: insights.improvements,
        extractedFeatures: prediction.extracted_features,
      },
      file: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        parserMethod: parsedResume.method,
        parserWarnings: parsedResume.warnings,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(getErrorStatusCode(error)).json({
      success: false,
      message: error.message || "An error occurred while analyzing the resume.",
    });
  }
}

export default analyzeResume;
