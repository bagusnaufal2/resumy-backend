const DEFAULT_MODEL_API_URL = "http://127.0.0.1:8000/predict";
const DEFAULT_TIMEOUT_MS = 20_000;

const SKILL_PATTERNS = [
  ["JavaScript", ["javascript"]],
  ["TypeScript", ["typescript"]],
  ["HTML", ["html", "html5"]],
  ["CSS", ["css", "css3"]],
  ["Sass", ["sass", "scss"]],
  ["Tailwind CSS", ["tailwind", "tailwindcss", "tailwind css"]],
  ["Bootstrap", ["bootstrap"]],
  ["Material UI", ["material ui", "mui"]],
  ["Ant Design", ["ant design", "antd"]],
  ["React", ["react", "react.js"]],
  ["Redux", ["redux"]],
  ["Next.js", ["next.js", "nextjs"]],
  ["Vue", ["vue", "vue.js"]],
  ["Nuxt.js", ["nuxt", "nuxt.js"]],
  ["Angular", ["angular"]],
  ["Svelte", ["svelte"]],
  ["Node.js", ["node.js", "nodejs", "node"]],
  ["Express.js", ["express.js", "express", "expressjs"]],
  ["NestJS", ["nestjs", "nest.js"]],
  ["REST API", ["rest api", "restful api", "api development"]],
  ["GraphQL", ["graphql"]],
  ["gRPC", ["grpc"]],
  ["WebSocket", ["websocket", "web socket"]],
  ["Socket.IO", ["socket.io", "socket io"]],
  ["Python", ["python"]],
  ["FastAPI", ["fastapi"]],
  ["Flask", ["flask"]],
  ["Django", ["django"]],
  ["Java", ["java"]],
  ["Spring Boot", ["spring boot", "springboot"]],
  ["PHP", ["php"]],
  ["Laravel", ["laravel"]],
  ["Ruby on Rails", ["ruby on rails", "rails"]],
  ["Go", ["golang", "go language"]],
  ["Rust", ["rust"]],
  ["C", ["c language", "bahasa c", " c "]],
  ["C++", ["c++"]],
  ["C#", ["c#", "c sharp", "c-sharp"]],
  [".NET", [".net", "dotnet", "asp.net"]],
  ["Kotlin", ["kotlin"]],
  ["Swift", ["swift"]],
  ["Dart", ["dart"]],
  ["Flutter", ["flutter"]],
  ["React Native", ["react native"]],
  ["Android", ["android"]],
  ["iOS", ["ios"]],
  ["SQL", ["sql"]],
  ["PostgreSQL", ["postgresql", "postgres", "psql"]],
  ["MySQL", ["mysql"]],
  ["SQLite", ["sqlite"]],
  ["SQL Server", ["sql server", "mssql", "microsoft sql server"]],
  ["MongoDB", ["mongodb", "mongo db", "mongo"]],
  ["Redis", ["redis"]],
  ["Firebase", ["firebase"]],
  ["Supabase", ["supabase"]],
  ["Prisma", ["prisma"]],
  ["Sequelize", ["sequelize"]],
  ["Mongoose", ["mongoose"]],
  ["Docker", ["docker"]],
  ["Kubernetes", ["kubernetes", "k8s"]],
  ["Nginx", ["nginx"]],
  ["Apache", ["apache"]],
  ["Linux", ["linux"]],
  ["Git", ["git"]],
  ["GitHub", ["github"]],
  ["GitHub Actions", ["github actions"]],
  ["GitLab CI", ["gitlab ci", "gitlab-ci"]],
  ["CI/CD", ["ci/cd", "cicd", "continuous integration", "continuous delivery"]],
  ["Jenkins", ["jenkins"]],
  ["Terraform", ["terraform"]],
  ["Ansible", ["ansible"]],
  ["AWS", ["aws", "amazon web services"]],
  ["GCP", ["gcp", "google cloud"]],
  ["Azure", ["azure"]],
  ["Vercel", ["vercel"]],
  ["Netlify", ["netlify"]],
  ["Microservices", ["microservices", "microservice"]],
  ["Kafka", ["kafka"]],
  ["RabbitMQ", ["rabbitmq", "rabbit mq"]],
  ["TensorFlow", ["tensorflow"]],
  ["PyTorch", ["pytorch"]],
  ["Scikit-learn", ["scikit-learn", "scikit learn", "sklearn"]],
  ["Pandas", ["pandas"]],
  ["NumPy", ["numpy"]],
  ["Machine Learning", ["machine learning", "ml"]],
  ["NLP", ["nlp", "natural language processing"]],
  ["Computer Vision", ["computer vision"]],
  ["OpenCV", ["opencv"]],
  ["Data Analysis", ["data analysis", "data analytics"]],
  ["Power BI", ["power bi", "powerbi"]],
  ["Tableau", ["tableau"]],
  ["Looker", ["looker"]],
  ["Testing", ["testing", "test automation", "qa"]],
  ["Jest", ["jest"]],
  ["Vitest", ["vitest"]],
  ["Cypress", ["cypress"]],
  ["Playwright", ["playwright"]],
  ["Selenium", ["selenium"]],
  ["PyTest", ["pytest"]],
  ["JUnit", ["junit"]],
  ["Postman", ["postman"]],
  ["Figma", ["figma"]],
  ["UI/UX", ["ui/ux", "ui ux", "ux/ui"]],
  ["Adobe XD", ["adobe xd"]],
  ["Photoshop", ["photoshop", "adobe photoshop"]],
  ["Illustrator", ["illustrator", "adobe illustrator"]],
  ["ERP", ["erp"]],
  ["Odoo", ["odoo"]],
];

const EXTRA_TECH_HINT_TERMS = [
  "backend",
  "frontend",
  "fullstack",
  "full-stack",
  "mobile",
  "devops",
  "deployment",
  "database",
  "cloud",
  "security",
  "analytics",
  "data",
  "visualization",
  "prototype",
  "prototyping",
  "dashboard",
  "api",
  "automation",
  "vps",
];

const GENERIC_HINT_EXCLUSIONS = new Set([
  "analysis",
  "continuous",
  "delivery",
  "integration",
  "service",
  "services",
  "web",
]);

const EDGE_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "dengan",
  "di",
  "familiar",
  "for",
  "from",
  "hands",
  "hiring",
  "in",
  "in",
  "is",
  "ke",
  "like",
  "looking",
  "need",
  "needed",
  "of",
  "on",
  "or",
  "required",
  "seeking",
  "solid",
  "strong",
  "to",
  "the",
  "to",
  "untuk",
  "using",
  "with",
  "yang",
]);

const ROLE_WORDS = new Set([
  "ability",
  "admin",
  "analyst",
  "capability",
  "candidate",
  "designer",
  "developer",
  "engineer",
  "experience",
  "experienced",
  "familiarity",
  "intern",
  "knowledge",
  "lead",
  "manager",
  "pemahaman",
  "pengalaman",
  "position",
  "required",
  "requirement",
  "skill",
  "skills",
  "specialist",
  "staff",
  "team",
  "tools",
]);

const SOFT_SKILL_PHRASES = new Set([
  "adaptability",
  "attention to detail",
  "collaboration",
  "communication",
  "critical thinking",
  "leadership",
  "problem solving",
  "teamwork",
  "time management",
]);

const TOKEN_LABEL_OVERRIDES = new Map([
  ["api", "API"],
  ["aws", "AWS"],
  ["ci/cd", "CI/CD"],
  ["css", "CSS"],
  ["erp", "ERP"],
  ["gcp", "GCP"],
  ["grpc", "gRPC"],
  ["html", "HTML"],
  ["ios", "iOS"],
  ["ml", "ML"],
  ["mongodb", "MongoDB"],
  ["mysql", "MySQL"],
  ["netlify", "Netlify"],
  ["nginx", "Nginx"],
  ["nlp", "NLP"],
  ["numpy", "NumPy"],
  ["odoo", "Odoo"],
  ["opencv", "OpenCV"],
  ["photoshop", "Photoshop"],
  ["postgresql", "PostgreSQL"],
  ["postman", "Postman"],
  ["power", "Power"],
  ["powerbi", "Power BI"],
  ["prisma", "Prisma"],
  ["pytorch", "PyTorch"],
  ["qa", "QA"],
  ["react", "React"],
  ["rest", "REST"],
  ["scikit-learn", "Scikit-learn"],
  ["scikit", "Scikit"],
  ["scss", "SCSS"],
  ["seo", "SEO"],
  ["sql", "SQL"],
  ["sqlite", "SQLite"],
  ["tensorflow", "TensorFlow"],
  ["typescript", "TypeScript"],
  ["ui", "UI"],
  ["ui/ux", "UI/UX"],
  ["ux", "UX"],
  ["vps", "VPS"],
  ["xd", "XD"],
]);

const SKILL_VARIANTS_BY_LABEL = new Map(SKILL_PATTERNS);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitAliasTokens(value) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#./-]+/)
    .filter(Boolean);
}

function variantToPattern(variant) {
  const hasExplicitPadding = variant.startsWith(" ") || variant.endsWith(" ");
  if (hasExplicitPadding) {
    return escapeRegex(variant);
  }

  const escaped = escapeRegex(variant.trim());
  return `(?<![A-Za-z0-9+#])${escaped}(?![A-Za-z0-9+#])`;
}

const SKILL_REGEX_BY_LABEL = new Map(
  SKILL_PATTERNS.map(([label, variants]) => [
    label,
    new RegExp(variants.map(variantToPattern).join("|"), "i"),
  ]),
);

const TECH_HINT_TERMS = new Set([
  ...EXTRA_TECH_HINT_TERMS,
  ...SKILL_PATTERNS.flatMap(([, variants]) =>
    variants.flatMap((variant) => splitAliasTokens(variant)),
  ),
].filter((term) => !GENERIC_HINT_EXCLUSIONS.has(term)));

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeSkillKey(value) {
  return normalizeWhitespace(value.toLowerCase());
}

function trimEdgeWords(words) {
  let start = 0;
  let end = words.length;

  while (
    start < end
    && (EDGE_STOPWORDS.has(words[start].toLowerCase())
      || ROLE_WORDS.has(words[start].toLowerCase()))
  ) {
    start += 1;
  }

  while (
    end > start
    && (EDGE_STOPWORDS.has(words[end - 1].toLowerCase())
      || ROLE_WORDS.has(words[end - 1].toLowerCase()))
  ) {
    end -= 1;
  }

  return words.slice(start, end);
}

function formatFallbackToken(token) {
  const normalizedToken = token.toLowerCase();

  if (TOKEN_LABEL_OVERRIDES.has(normalizedToken)) {
    return TOKEN_LABEL_OVERRIDES.get(normalizedToken);
  }

  if (normalizedToken.includes("/")) {
    return normalizedToken
      .split("/")
      .map((part) => formatFallbackToken(part))
      .join("/");
  }

  if (normalizedToken.includes("-")) {
    return normalizedToken
      .split("-")
      .map((part) => formatFallbackToken(part))
      .join("-");
  }

  return normalizedToken.charAt(0).toUpperCase() + normalizedToken.slice(1);
}

function formatFallbackSkillLabel(phrase) {
  return phrase
    .split(/\s+/)
    .map((token) => formatFallbackToken(token))
    .join(" ");
}

function buildPhrasePattern(phrase) {
  const escapedParts = phrase
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => escapeRegex(part));

  return new RegExp(
    `(?<![A-Za-z0-9+#])${escapedParts.join("[-/\\s]+")}(?![A-Za-z0-9+#])`,
    "i",
  );
}

function mergeSkills(...skillLists) {
  const merged = [];
  const seen = new Set();

  for (const skills of skillLists) {
    for (const skill of skills) {
      const normalizedSkill = normalizeSkillKey(skill);
      if (!normalizedSkill || seen.has(normalizedSkill)) {
        continue;
      }

      seen.add(normalizedSkill);
      merged.push(skill);
    }
  }

  return merged;
}

function detectKnownSkills(text) {
  const normalizedText = ` ${text.toLowerCase()} `;
  const detectedSkills = [];

  for (const [label, pattern] of SKILL_REGEX_BY_LABEL) {
    if (pattern.test(normalizedText)) {
      detectedSkills.push(label);
    }
  }

  return detectedSkills;
}

function isLikelyFallbackSkill(phrase) {
  const normalizedPhrase = normalizeSkillKey(phrase);
  if (!normalizedPhrase || SOFT_SKILL_PHRASES.has(normalizedPhrase)) {
    return false;
  }

  const words = normalizedPhrase.split(" ");
  if (words.length === 0 || words.length > 3) {
    return false;
  }

  if (words.every((word) => EDGE_STOPWORDS.has(word) || ROLE_WORDS.has(word))) {
    return false;
  }

  if (words.length === 1 && words[0].length < 3 && !TOKEN_LABEL_OVERRIDES.has(words[0])) {
    return false;
  }

  if (/[+#./]/.test(phrase)) {
    return true;
  }

  if (words.some((word) => TECH_HINT_TERMS.has(word))) {
    return true;
  }

  return phrase.split(/\s+/).some((word) => /[A-Z]{2,}|\d/.test(word));
}

function extractFallbackSkills(text) {
  const words = (text.match(/[A-Za-z][A-Za-z0-9+#./-]*/g) ?? [])
    .map((word) => word.replace(/^[,;:()]+|[.,;:()]+$/g, ""))
    .filter(Boolean);
  const detectedSkills = [];
  const seen = new Set();

  for (let size = 1; size >= 1; size -= 1) {
    for (let index = 0; index <= words.length - size; index += 1) {
      const candidateWords = trimEdgeWords(words.slice(index, index + size));
      if (candidateWords.length === 0 || candidateWords.length > 3) {
        continue;
      }

      const candidate = normalizeWhitespace(candidateWords.join(" "));
      const normalizedCandidate = normalizeSkillKey(candidate);
      const knownSkillCount = detectKnownSkills(candidate).length;

      if (
        seen.has(normalizedCandidate)
        || !isLikelyFallbackSkill(candidate)
        || knownSkillCount > 1
      ) {
        continue;
      }

      seen.add(normalizedCandidate);
      detectedSkills.push(formatFallbackSkillLabel(candidate));

      if (detectedSkills.length >= 12) {
        return detectedSkills;
      }
    }
  }

  return detectedSkills;
}

function textHasSkill(text, skillLabel) {
  if (SKILL_VARIANTS_BY_LABEL.has(skillLabel)) {
    const skillPattern = SKILL_REGEX_BY_LABEL.get(skillLabel);
    return skillPattern.test(` ${text.toLowerCase()} `);
  }

  return buildPhrasePattern(skillLabel).test(text);
}

function buildImprovements({ score, skillsMissing, prediction }) {
  const improvements = [];
  const featureSummary = prediction.extracted_features ?? {};

  if (skillsMissing.length > 0) {
    improvements.push(
      `Tambahkan keyword penting seperti ${skillsMissing.slice(0, 4).join(", ")} agar resume lebih selaras dengan lowongan.`,
    );
  }

  if (score < 60) {
    improvements.push(
      "Perjelas pengalaman yang paling relevan dengan posisi target dan tampilkan dampak kerjanya dengan angka atau hasil konkret.",
    );
  }

  if ((featureSummary.tfidf_cosine_similarity ?? 0) < 0.15) {
    improvements.push(
      "Ringkasan profil dan deskripsi project masih kurang dekat dengan bahasa di job description, jadi sebaiknya disesuaikan lagi.",
    );
  }

  if ((featureSummary.length_ratio ?? 0) < 0.4) {
    improvements.push(
      "Resume terlihat terlalu singkat dibanding kebutuhan lowongan. Tambahkan konteks project, tools, dan tanggung jawab utama.",
    );
  }

  if (improvements.length === 0) {
    improvements.push(
      "Struktur resume sudah cukup dekat dengan kebutuhan lowongan. Rapikan urutan pengalaman dan tonjolkan skill yang paling relevan di bagian atas.",
    );
  }

  return improvements.slice(0, 4);
}

async function parseErrorPayload(response) {
  const responseType = response.headers.get("content-type") ?? "";

  if (responseType.includes("application/json")) {
    const payload = await response.json();
    return payload.detail ?? payload.message ?? "Model inference failed.";
  }

  const fallbackText = await response.text();
  return fallbackText || "Model inference failed.";
}

export async function predictResumeMatch({ cvText, jobDescText }) {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.MODEL_API_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      process.env.MODEL_API_URL ?? DEFAULT_MODEL_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cv_text: cvText,
          job_desc_text: jobDescText,
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const message = await parseErrorPayload(response);
      const error = new Error(message);
      error.statusCode = response.status;
      throw error;
    }

    return response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(
        "Model inference timed out. Pastikan service FastAPI sedang berjalan.",
      );
      timeoutError.statusCode = 504;
      throw timeoutError;
    }

    if (error instanceof TypeError) {
      const networkError = new Error(
        "Tidak bisa terhubung ke service model. Pastikan FastAPI aktif di MODEL_API_URL.",
      );
      networkError.statusCode = 502;
      throw networkError;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function buildResumeInsights({ cvText, jobDescText, prediction }) {
  const knownResumeSkills = detectKnownSkills(cvText);
  const knownJobSkills = detectKnownSkills(jobDescText);
  const resumeSkills = mergeSkills(
    knownResumeSkills,
    knownResumeSkills.length >= 2 ? [] : extractFallbackSkills(cvText),
  );
  const jobSkills = mergeSkills(
    knownJobSkills,
    knownJobSkills.length >= 2 ? [] : extractFallbackSkills(jobDescText),
  );
  const score = Number(prediction.match_percentage ?? 0);

  const skillsHave = [];
  const skillsMissing = [];

  for (const skill of jobSkills) {
    if (textHasSkill(cvText, skill) || resumeSkills.includes(skill)) {
      skillsHave.push(skill);
    } else {
      skillsMissing.push(skill);
    }
  }

  return {
    skillsHave: skillsHave.slice(0, 8),
    skillsMissing: skillsMissing.slice(0, 8),
    improvements: buildImprovements({ score, skillsMissing, prediction }),
  };
}
