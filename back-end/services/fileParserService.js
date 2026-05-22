import { randomUUID } from "crypto";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const TMP_DIR = path.join(os.tmpdir(), "resumy-parser");
const PYTHON_SCRIPT_PATH = fileURLToPath(
  new URL("../scripts/extract_text.py", import.meta.url),
);

function getFileExtension(fileName = "") {
  return path.extname(fileName).toLowerCase() || ".bin";
}

function getPythonCommands() {
  if (process.env.PYTHON_BIN) {
    return [[process.env.PYTHON_BIN, []]];
  }

  if (process.platform === "win32") {
    return [
      ["python", []],
      ["py", ["-3"]],
    ];
  }

  return [
    ["python3", []],
    ["python", []],
  ];
}

function runExtractor(command, args, tempFilePath) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args, PYTHON_SCRIPT_PATH, tempFilePath], {
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const extractorError = new Error(
          stderr.trim() || "Resume text extraction failed.",
        );
        extractorError.statusCode = 422;
        reject(extractorError);
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (error) {
        const parseError = new Error(
          "Extractor returned an invalid response.",
        );
        parseError.statusCode = 500;
        reject(parseError);
      }
    });
  });
}

async function extractWithPython(tempFilePath) {
  let lastError = null;

  for (const [command, args] of getPythonCommands()) {
    try {
      return await runExtractor(command, args, tempFilePath);
    } catch (error) {
      if (error.code === "ENOENT") {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  const pythonError = new Error(
    "Python runtime tidak ditemukan. Backend membutuhkan Python untuk parsing resume.",
  );
  pythonError.statusCode = 500;
  pythonError.cause = lastError;
  throw pythonError;
}

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

export async function extractTextFromResume(file) {
  if (!file?.buffer?.length) {
    const invalidFileError = new Error("Resume file is empty.");
    invalidFileError.statusCode = 400;
    throw invalidFileError;
  }

  const extension = getFileExtension(file.originalname);
  const tempFilePath = path.join(TMP_DIR, `${randomUUID()}${extension}`);

  await fs.mkdir(TMP_DIR, { recursive: true });
  await fs.writeFile(tempFilePath, file.buffer);

  try {
    const parsed = await extractWithPython(tempFilePath);
    const text = normalizeText(parsed.text ?? "");

    if (!text) {
      const emptyTextError = new Error(
        "Isi resume tidak bisa dibaca. Coba gunakan file PDF atau DOCX yang text-based.",
      );
      emptyTextError.statusCode = 422;
      throw emptyTextError;
    }

    return {
      text,
      method: parsed.method ?? "unknown",
      warnings: parsed.warnings ?? [],
    };
  } finally {
    await fs.unlink(tempFilePath).catch(() => null);
  }
}
