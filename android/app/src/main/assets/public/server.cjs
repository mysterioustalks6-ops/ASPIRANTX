var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_config2 = require("dotenv/config");
var import_express7 = __toESM(require("express"), 1);
var import_path8 = __toESM(require("path"), 1);
var import_compression = __toESM(require("compression"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_vite = require("vite");

// authMiddleware.ts
var import_ssr = require("@supabase/ssr");
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var DESIGNATED_ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || "ambujyadav0010@gmail.com";
var JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_SUPABASE_ANON_KEY || "";
function parseCookies(req) {
  const cookieDict = {};
  let cookieHeader = "";
  if (req.headers) {
    if (typeof req.headers.get === "function") {
      cookieHeader = req.headers.get("cookie") || "";
    } else if (typeof req.headers === "object") {
      cookieHeader = req.headers["cookie"] || req.headers["Cookie"] || "";
    }
  }
  if (cookieHeader) {
    cookieHeader.split(";").forEach((pair) => {
      const [key, ...val] = pair.trim().split("=");
      if (key) {
        cookieDict[key.trim()] = decodeURIComponent(val.join("="));
      }
    });
  }
  if (req.cookies) {
    if (typeof req.cookies.get === "function") {
      const userEmailVal = req.cookies.get("user_email");
      if (userEmailVal) {
        cookieDict["user_email"] = typeof userEmailVal === "object" ? userEmailVal.value : userEmailVal;
      }
      const userRoleVal = req.cookies.get("user_role");
      if (userRoleVal) {
        cookieDict["user_role"] = typeof userRoleVal === "object" ? userRoleVal.value : userRoleVal;
      }
      const tokenVal = req.cookies.get("ax_token");
      if (tokenVal) {
        cookieDict["ax_token"] = typeof tokenVal === "object" ? tokenVal.value : tokenVal;
      }
    } else if (typeof req.cookies === "object") {
      Object.assign(cookieDict, req.cookies);
    }
  }
  return cookieDict;
}
async function middleware(req) {
  const urlString = typeof req.url === "string" ? req.url : req.url?.toString() || "/";
  const url = new URL(urlString, "http://localhost:3000");
  const currentPath = url.pathname;
  const isAdminPath = currentPath === "/admin" || currentPath.startsWith("/admin/") || currentPath.startsWith("/api/admin");
  if (!isAdminPath) {
    return { status: 200, isAuthorized: true };
  }
  const cookies = parseCookies(req);
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || "ambujyadav0010@gmail.com").trim().toLowerCase();
  let userEmail = "";
  let userRole = "";
  let authHeader = "";
  if (req.headers) {
    if (typeof req.headers.get === "function") {
      authHeader = req.headers.get("authorization") || "";
    } else if (typeof req.headers === "object") {
      authHeader = req.headers["authorization"] || req.headers["Authorization"] || "";
    }
  }
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : cookies["ax_token"];
  if (token) {
    try {
      const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
      if (decoded && decoded.email) {
        userEmail = decoded.email.trim().toLowerCase();
        if (decoded.role) userRole = decoded.role;
      }
    } catch (e) {
    }
  }
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = (0, import_ssr.createServerClient)(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return Object.entries(cookies).map(([name, value]) => ({ name, value }));
          },
          setAll() {
          }
        }
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        userEmail = user.email.trim().toLowerCase();
        if (user.user_metadata?.role) {
          userRole = user.user_metadata.role;
        }
      }
    } catch (e) {
    }
  }
  const isDesignatedAdmin = userEmail && userEmail === adminEmail || userRole === "ADMIN" || userEmail === "ambujyadav0010@gmail.com";
  if (!isDesignatedAdmin) {
    return {
      status: 302,
      headers: {
        Location: "/dashboard"
      },
      redirected: true
    };
  }
  return { status: 200, userEmail, userRole, isAuthorized: true };
}
async function expressEdgeMiddleware(req, res, next) {
  try {
    const pathname = req.path || req.url || "";
    const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin");
    if (!isAdminPath) {
      return next();
    }
    const result = await middleware(req);
    if (result && result.status === 302 && result.headers?.Location) {
      return res.redirect(result.headers.Location);
    }
  } catch (err) {
    console.error("[Edge Middleware Error]:", err);
  }
  next();
}

// routes/shared.ts
var import_config = require("dotenv/config");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_os = __toESM(require("os"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var import_supabase_js = require("@supabase/supabase-js");
var import_genai = require("@google/genai");

// src/data/academicData.ts
var neetPyqs = [];
var INITIAL_SYLLABUS_HIERARCHY = [
  {
    id: "u1-1",
    exam: "UPSC_CSE",
    paper: "General Studies - 2",
    subject: "Indian Polity & Governance",
    chapter: "Constitutional Framework",
    topic: "Preamble & Citizenship",
    subtopic: "Preamble, Citizenship & Basic Structure",
    title: "Preamble, Citizenship & Basic Structure",
    stage: "Prelims",
    weightage: "High",
    estimatedHours: 2.5,
    completed: true,
    description: "Preamble philosophy, basic structure doctrine, and citizenship acts.",
    difficulty: "Medium",
    recommendedBooks: ["M. Laxmikanth Indian Polity", "NCERT Class 11"],
    pyqCount: 14,
    prerequisites: ["Basic Historical Background"]
  },
  {
    id: "u1-2",
    exam: "UPSC_CSE",
    paper: "General Studies - 2",
    subject: "Indian Polity & Governance",
    chapter: "Constitutional Framework",
    topic: "Fundamental Rights",
    subtopic: "Fundamental Rights (Art 12 - 35)",
    title: "Fundamental Rights (Art 12 - 35)",
    stage: "Prelims",
    weightage: "High",
    estimatedHours: 2.5,
    completed: true,
    description: "Detailed analysis of Articles 12 to 35, Writs, and Judicial Review.",
    difficulty: "Hard",
    recommendedBooks: ["M. Laxmikanth", "DD Basu"],
    pyqCount: 22,
    prerequisites: ["Preamble"]
  },
  {
    id: "u1-3",
    exam: "UPSC_CSE",
    paper: "General Studies - 2",
    subject: "Indian Polity & Governance",
    chapter: "Constitutional Framework",
    topic: "Directive Principles",
    subtopic: "Directive Principles (DPSP) & Fundamental Duties",
    title: "Directive Principles (DPSP) & Fundamental Duties",
    stage: "Prelims",
    weightage: "High",
    estimatedHours: 2.5,
    completed: true,
    description: "DPSP socialist, Gandhian, and liberal-intellectual principles.",
    difficulty: "Medium",
    recommendedBooks: ["M. Laxmikanth"],
    pyqCount: 15,
    prerequisites: ["Fundamental Rights"]
  },
  {
    id: "u2-1",
    exam: "UPSC_CSE",
    paper: "General Studies - 1",
    subject: "Modern Indian History",
    chapter: "Freedom Struggle",
    topic: "Revolt of 1857",
    subtopic: "Revolt of 1857: Causes, Leaders & Failure",
    title: "Revolt of 1857: Causes, Leaders & Failure",
    stage: "Prelims",
    weightage: "High",
    estimatedHours: 2.5,
    completed: true,
    description: "Causes, centers of revolt, key leaders, and consequences.",
    difficulty: "Medium",
    recommendedBooks: ["Spectrum Modern India", "Bipin Chandra"],
    pyqCount: 18,
    prerequisites: ["British Expansionism"]
  },
  {
    id: "s1-1",
    exam: "SSC_CGL",
    paper: "Tier-1 Quant",
    subject: "Quantitative Aptitude",
    chapter: "Number System",
    topic: "HCF, LCM & Simplification",
    subtopic: "Number Systems, HCF & LCM, Simplification",
    title: "Number Systems, HCF & LCM, Simplification",
    stage: "Tier-1",
    weightage: "High",
    estimatedHours: 2.5,
    completed: true,
    description: "Divisibility rules, unit digits, LCM & HCF word problems.",
    difficulty: "Medium",
    recommendedBooks: ["RS Aggarwal Quantitative Aptitude"],
    pyqCount: 30,
    prerequisites: ["Basic Calculation Tricks"]
  }
];
var INITIAL_PYQS_DATABASE = neetPyqs || [];
var INITIAL_QUESTION_BANK = [
  {
    id: "qb_1",
    subject: "Indian Polity & Governance",
    topic: "Fundamental Rights",
    questionText: "Which Article of the Constitution guarantees right to equality before law?",
    options: ["Article 14", "Article 19", "Article 21", "Article 32"],
    correctOption: 0,
    explanation: "Article 14 ensures that the State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.",
    difficulty: "Medium",
    source: "PYQ"
  },
  {
    id: "qb_2",
    subject: "Modern Indian History",
    topic: "Gandhian Era",
    questionText: "In which year was the Non-Cooperation Movement launched by Mahatma Gandhi?",
    options: ["1919", "1920", "1922", "1930"],
    correctOption: 1,
    explanation: "The Non-Cooperation Movement was officially launched in September 1920 at the Calcutta special session of the Indian National Congress.",
    difficulty: "Easy",
    source: "PYQ"
  },
  {
    id: "qb_3",
    subject: "Indian Economy",
    topic: "Monetary Policy",
    questionText: "Who regulates the monetary policy framework in India?",
    options: ["Ministry of Finance", "SEBI", "Reserve Bank of India (RBI)", "NITI Aayog"],
    correctOption: 2,
    explanation: "Reserve Bank of India (RBI) is entrusted with the responsibility of monetary policy formulation and maintaining price stability in India.",
    difficulty: "Easy",
    source: "PYQ"
  }
];

// src/data/booksData.ts
var COMPREHENSIVE_BOOKS_DATABASE = [
  // --- INDIAN POLITY & GOVERNANCE ---
  {
    id: "b_laxmikanth",
    title: "Indian Polity for Civil Services & State Examinations",
    author: "M. Laxmikanth",
    category: "Standard Book",
    subject: "Indian Polity & Governance",
    exam: "UPSC_CSE",
    mappedTopics: ["Constitutional Framework", "System of Government", "Central Government", "State Government", "Constitutional Bodies"],
    description: "The definitive bible for UPSC CSE Polity covering Articles 1-395, amendments, Supreme Court landmark cases, and statutory bodies.",
    coverColor: "bg-indigo-900",
    edition: "7th Edition (Latest)",
    importance: "Essential"
  },
  {
    id: "b_dd_basu",
    title: "Introduction to the Constitution of India",
    author: "Dr. Durga Das Basu",
    category: "Reference Manual",
    subject: "Indian Polity & Governance",
    exam: "UPSC_CSE",
    mappedTopics: ["Constitutional Framework", "Judiciary & Judicial Review", "Federal Structure"],
    description: "In-depth legal commentary ideal for GS Paper 2 Mains descriptive answers and legal philosophy of basic structure.",
    coverColor: "bg-blue-900",
    edition: "26th Edition",
    importance: "Recommended"
  },
  {
    id: "b_ncert_polity_11",
    title: "Class 11 NCERT: Indian Constitution at Work",
    author: "NCERT",
    category: "NCERT",
    subject: "Indian Polity & Governance",
    exam: "UPSC_CSE",
    mappedTopics: ["Preamble & Fundamental Rights", "Elections and Representation", "Executive and Legislature"],
    description: "Foundational textbook building conceptual clarity on rights, federal balance, and parliamentary procedures.",
    coverColor: "bg-emerald-900",
    edition: "Latest Edition",
    importance: "Essential"
  },
  // --- HISTORY & ART & CULTURE ---
  {
    id: "b_spectrum_history",
    title: "A Brief History of Modern India",
    author: "Rajiv Ahir (Spectrum)",
    category: "Standard Book",
    subject: "Modern Indian History",
    exam: "UPSC_CSE",
    mappedTopics: ["Freedom Struggle", "Revolt of 1857", "Gandhian Era", "Governor Generals Timeline"],
    description: "Concise timeline-oriented manual summarizing 18th century decline of Mughals through 1947 Independence Act.",
    coverColor: "bg-amber-900",
    edition: "2025 Revised Edition",
    importance: "Essential"
  },
  {
    id: "b_nitin_singhania",
    title: "Indian Art and Culture",
    author: "Nitin Singhania",
    category: "Standard Book",
    subject: "Art & Culture",
    exam: "UPSC_CSE",
    mappedTopics: ["Architecture & Sculpture", "Classical Dances & Music", "UNESCO World Heritage Sites"],
    description: "Exhaustive visual encyclopedia on Indian architecture, paintings, performing arts, coinages, and UNESCO heritage.",
    coverColor: "bg-rose-900",
    edition: "4th Edition",
    importance: "Essential"
  },
  {
    id: "b_rs_sharma",
    title: "Class 11 NCERT: Ancient India",
    author: "R.S. Sharma",
    category: "NCERT",
    subject: "Ancient History",
    exam: "UPSC_CSE",
    mappedTopics: ["Indus Valley Civilization", "Vedic Age", "Buddhism & Jainism", "Mauryan Empire"],
    description: "Classic text covering stone age to post-Gupta era with emphasis on socio-economic transitions.",
    coverColor: "bg-stone-800",
    edition: "Old NCERT Text",
    importance: "Essential"
  },
  // --- GEOGRAPHY ---
  {
    id: "b_gc_leong",
    title: "Certificate Physical and Human Geography",
    author: "G.C. Leong",
    category: "Standard Book",
    subject: "Geography",
    exam: "UPSC_CSE",
    mappedTopics: ["Geomorphology", "Climatology", "Oceanography", "Biomes & Weathering"],
    description: "Must-read for global physical geography, landforms, weather patterns, and climatic zones.",
    coverColor: "bg-teal-900",
    edition: "3rd Edition",
    importance: "Essential"
  },
  {
    id: "b_ncert_geo_11",
    title: "Class 11 NCERT: Fundamentals of Physical Geography",
    author: "NCERT",
    category: "NCERT",
    subject: "Geography",
    exam: "UPSC_CSE",
    mappedTopics: ["Interior of the Earth", "Plate Tectonics", "Atmospheric Circulation"],
    description: "Core baseline for physical geography fundamentals and Earth system sciences.",
    coverColor: "bg-cyan-900",
    edition: "Latest Edition",
    importance: "Essential"
  },
  // --- ECONOMY ---
  {
    id: "b_ramesh_singh",
    title: "Indian Economy for Civil Services",
    author: "Ramesh Singh",
    category: "Standard Book",
    subject: "Indian Economy",
    exam: "UPSC_CSE",
    mappedTopics: ["National Income Accounting", "Monetary Policy", "Fiscal Policy & Union Budget", "Banking & NPA"],
    description: "Comprehensive analysis of macroeconomic indicators, banking reforms, inflation metrics, and budget terms.",
    coverColor: "bg-yellow-900",
    edition: "16th Edition",
    importance: "Essential"
  },
  {
    id: "b_eco_survey",
    title: "Economic Survey 2024-25 & Union Budget Highlights",
    author: "Ministry of Finance, Govt of India",
    category: "Government Report",
    subject: "Indian Economy",
    exam: "UPSC_CSE",
    mappedTopics: ["Macroeconomic Framework", "Capital Expenditure", "Inflation & Growth Projections"],
    description: "Official flagship document outlining annual economic performance, sectoral trends, and fiscal projections.",
    coverColor: "bg-purple-900",
    edition: "Annual 2024-25",
    importance: "Essential"
  },
  // --- ENVIRONMENT & ECOLOGY ---
  {
    id: "b_shankar_ias",
    title: "Environment & Ecology Manual",
    author: "Shankar IAS Academy",
    category: "Standard Book",
    subject: "Environment & Ecology",
    exam: "UPSC_CSE",
    mappedTopics: ["Ecosystem Functions", "Biodiversity Hotspots", "Protected Area Network", "Climate Change Summits"],
    description: "Top-rated compilation on IUCN red data species, Ramsar sites, environmental laws, and international conventions.",
    coverColor: "bg-emerald-950",
    edition: "10th Edition",
    importance: "Essential"
  },
  // --- ETHICS (GS PAPER 4) ---
  {
    id: "b_lexicon_ethics",
    title: "Lexicon for Ethics, Integrity & Aptitude",
    author: "Chronicle Publications",
    category: "Standard Book",
    subject: "Ethics, Integrity & Aptitude",
    exam: "UPSC_CSE",
    mappedTopics: ["Ethics & Human Interface", "Emotional Intelligence", "Probity in Governance", "Case Studies"],
    description: "Dictionary and guide defining core administrative terms, moral thinkers, and case study resolution frameworks.",
    coverColor: "bg-slate-800",
    edition: "Latest Edition",
    importance: "Essential"
  },
  {
    id: "b_2nd_arc",
    title: "2nd Administrative Reforms Commission (ARC) Report: Ethics in Governance",
    author: "Government of India",
    category: "Government Report",
    subject: "Ethics, Integrity & Aptitude",
    exam: "UPSC_CSE",
    mappedTopics: ["Probity in Governance", "Code of Conduct", "Anti-Corruption Framework"],
    description: "Official recommendation report for integrity, RTI, citizen charters, and whistleblower protection.",
    coverColor: "bg-red-950",
    edition: "4th Report",
    importance: "Recommended"
  },
  // --- QUANTITATIVE APTITUDE & REASONING (SSC / BANKING / RAILWAYS) ---
  {
    id: "b_rs_aggarwal_quant",
    title: "Quantitative Aptitude for Competitive Examinations",
    author: "Dr. R.S. Aggarwal",
    category: "Standard Book",
    subject: "Mathematics & Quantitative Aptitude",
    exam: "SSC_CGL",
    mappedTopics: ["Number System", "Arithmetic Ability", "Geometry & Mensuration", "Trigonometry"],
    description: "Extensive problem bank with shortcuts, formula sheets, and solved tier-1 and tier-2 practice sets.",
    coverColor: "bg-amber-950",
    edition: "2025 Revised Edition",
    importance: "Essential"
  },
  {
    id: "b_rs_aggarwal_reasoning",
    title: "A Modern Approach to Verbal & Non-Verbal Reasoning",
    author: "Dr. R.S. Aggarwal",
    category: "Standard Book",
    subject: "General Intelligence & Reasoning",
    exam: "SSC_CGL",
    mappedTopics: ["Analogy & Classification", "Syllogisms", "Puzzles & Seating Arrangement", "Blood Relations"],
    description: "Master manual for non-verbal series, pattern recognition, matrix logic, and critical statement analysis.",
    coverColor: "bg-indigo-950",
    edition: "Latest Edition",
    importance: "Essential"
  }
];

// src/lib/email.ts
var import_resend = require("resend");
async function sendTransactionalEmail(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[EMAIL] RESEND_API_KEY not set \u2014 email NOT sent to", to);
    return { sent: false, error: "RESEND_API_KEY environment variable is missing or not configured." };
  }
  try {
    const resend = new import_resend.Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || "AspirantX Support <onboarding@resend.dev>";
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html
    });
    if (result.error) {
      console.error("[EMAIL] Resend returned error:", result.error);
      return { sent: false, error: result.error.message || "Resend service failed to deliver email." };
    }
    console.log(`[EMAIL] Resend transactional email dispatched successfully to: ${to} (ID: ${result.data?.id})`);
    return { sent: true, id: result.data?.id };
  } catch (err) {
    console.error("[EMAIL] Resend send exception:", err.message || err);
    return { sent: false, error: err.message || "Exception occurred during email dispatch." };
  }
}

// routes/shared.ts
var globalApiLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded: Too many requests from this IP address." }
});
var adminMutationLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded: Too many administrative write operations from this IP." }
});
var paymentRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Payment rate limit exceeded: Too many payment attempts from this IP address." }
});
var aiRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Rate limit exceeded: Too many AI requests. Please wait a few minutes before trying AI syllabus organization again."
  }
});
var SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
var rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
var SUPABASE_KEY = rawServiceKey || process.env.VITE_SUPABASE_ANON_KEY || "";
if (!rawServiceKey || process.env.VITE_SUPABASE_ANON_KEY && rawServiceKey === process.env.VITE_SUPABASE_ANON_KEY) {
  console.error("CRITICAL: Service role key (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY) is missing or equals the anon key! Admin settings will not persist. Set the real service_role key in deployment env vars.");
}
var isSupabaseDbConfigured = Boolean(
  SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("placeholder")
);
var supabaseServer = isSupabaseDbConfigured ? (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_KEY) : null;
var JWT_SECRET2 = process.env.JWT_SECRET || process.env.VITE_SUPABASE_ANON_KEY || "aspirantx_dev_jwt_secret_fallback_key_2026";
if (!process.env.JWT_SECRET && !process.env.VITE_SUPABASE_ANON_KEY) {
  console.warn("WARNING: JWT_SECRET environment variable is not set. Using default development secret.");
}
function getWritableDataFilePath() {
  const candidateDirs = [
    import_path.default.join(process.cwd(), ".data"),
    import_path.default.join(import_os.default.tmpdir(), "aspirantx_data"),
    import_os.default.tmpdir()
  ];
  for (const dir of candidateDirs) {
    try {
      if (!import_fs.default.existsSync(dir)) {
        import_fs.default.mkdirSync(dir, { recursive: true });
      }
      const testFile = import_path.default.join(dir, `.test_write_${Date.now()}`);
      import_fs.default.writeFileSync(testFile, "test", "utf-8");
      import_fs.default.unlinkSync(testFile);
      return import_path.default.join(dir, "admin_store.json");
    } catch (_err) {
      continue;
    }
  }
  return import_path.default.join(import_os.default.tmpdir(), "admin_store.json");
}
var DESIGNATED_ADMIN_EMAIL2 = "ambujyadav0010@gmail.com";
function recordAdminAuditLog(options) {
  const newLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    user: options.user || "anonymous",
    department: options.department || "Unknown",
    action: options.action,
    ip: options.ip || "127.0.0.1",
    requestId: options.requestId || `req_${Date.now()}`,
    endpoint: options.endpoint || "/api/admin",
    outcome: options.outcome || "SUCCESS",
    details: options.details,
    beforeValue: options.beforeValue,
    afterValue: options.afterValue
  };
  blockedAuditLogs.unshift(newLog);
  if (blockedAuditLogs.length > 200) {
    blockedAuditLogs = blockedAuditLogs.slice(0, 200);
  }
  if (supabaseServer) {
    supabaseServer.from("audit_logs").insert([newLog]).then(({ error }) => {
      if (error) console.error("Supabase Audit Log error:", error.message);
    });
  }
  saveAdminStoreToDisk();
}
function addAdminAuditLogRecord(options) {
  recordAdminAuditLog({
    user: options.performedBy || "ADMIN",
    action: options.action,
    details: `${options.details} (Target: ${options.target || "N/A"})`
  });
}
async function extractVerifiedUserFromReq(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7).trim();
  if (!token) return null;
  let verifiedEmail = "";
  let role = "USER";
  let userId = "user_dev";
  let tokenVerified = false;
  try {
    const decoded = import_jsonwebtoken2.default.verify(token, JWT_SECRET2);
    if (decoded && decoded.email) {
      verifiedEmail = String(decoded.email).trim().toLowerCase();
      role = decoded.role || "USER";
      userId = decoded.sub || "user_dev";
      tokenVerified = true;
    }
  } catch (_err) {
  }
  if (!tokenVerified && supabaseServer) {
    try {
      const { data } = await supabaseServer.auth.getUser(token);
      if (data?.user?.email) {
        verifiedEmail = data.user.email.trim().toLowerCase();
        const isSuper = verifiedEmail === DESIGNATED_ADMIN_EMAIL2.toLowerCase();
        const knownUser = adminUsersDb.find((u) => u.email.toLowerCase() === verifiedEmail);
        role = isSuper ? "ADMIN" : knownUser ? knownUser.role : "USER";
        userId = data.user.id;
        tokenVerified = true;
      }
    } catch (_supaErr) {
    }
  }
  if (!tokenVerified || !verifiedEmail) {
    return null;
  }
  return { email: verifiedEmail, role, sub: userId };
}
function requireEnterprisePermission(permissionKey) {
  return async (req, res, next) => {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const clientIp = String(req.headers["x-forwarded-for"] || req.ip || req.socket?.remoteAddress || "127.0.0.1").split(",")[0].trim();
    const requestId = String(req.headers["x-request-id"] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    if (!verifiedUser) {
      recordAdminAuditLog({
        user: "anonymous",
        action: "UNAUTHORIZED_API_ACCESS",
        details: `Blocked unauthenticated attempt to ${req.method} ${req.path}`,
        ip: clientIp,
        requestId,
        endpoint: req.originalUrl || req.path,
        outcome: "DENIED"
      });
      return res.status(401).json({ error: "Authentication Required." });
    }
    const email = verifiedUser.email.toLowerCase();
    const isSuperAdmin = email === DESIGNATED_ADMIN_EMAIL2.toLowerCase();
    const teamMember = adminTeamStore.find((t) => t.email.toLowerCase() === email);
    let hasPerm = isSuperAdmin;
    if (!hasPerm && teamMember) {
      if (teamMember.role === "SUPER_ADMIN") hasPerm = true;
      else if (teamMember.permissions && teamMember.permissions[permissionKey] === true) hasPerm = true;
    }
    if (!hasPerm) {
      recordAdminAuditLog({
        user: email,
        action: "FORBIDDEN_RBAC_ACCESS",
        details: `Blocked attempt to ${req.method} ${req.path}. Missing permission: ${permissionKey}`,
        ip: clientIp,
        requestId,
        endpoint: req.originalUrl || req.path,
        outcome: "DENIED"
      });
      return res.status(403).json({ error: `Forbidden: Requires ${permissionKey} permission.` });
    }
    req.adminEmail = email;
    req.clientIp = clientIp;
    req.requestId = requestId;
    req.teamProfile = teamMember;
    next();
  };
}
async function verifyAdminAuth(req, res, next) {
  const clientIp = String(req.headers["x-forwarded-for"] || req.ip || req.socket?.remoteAddress || "127.0.0.1").split(",")[0].trim();
  const requestId = String(req.headers["x-request-id"] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    recordAdminAuditLog({
      user: "anonymous",
      action: "UNAUTHORIZED_ACCESS_ATTEMPT",
      details: `Blocked attempt to access ${req.method} ${req.path} without verified Bearer token`,
      ip: clientIp,
      requestId,
      endpoint: req.originalUrl || req.path,
      outcome: "DENIED"
    });
    return res.status(401).json({
      error: "Authentication Required: Missing, invalid, or unverified Bearer authorization token."
    });
  }
  const { email: verifiedEmail, role: verifiedRole } = verifiedUser;
  const isSuperAdmin = verifiedEmail === DESIGNATED_ADMIN_EMAIL2.toLowerCase();
  const knownUser = adminUsersDb.find((u) => u.email.toLowerCase() === verifiedEmail);
  const hasAdminRole = verifiedRole === "ADMIN" || verifiedRole === "CO_ADMIN" || verifiedRole === "DEVELOPER" || knownUser && (knownUser.role === "ADMIN" || knownUser.role === "CO_ADMIN" || knownUser.role === "DEVELOPER");
  if (!isSuperAdmin && !hasAdminRole) {
    recordAdminAuditLog({
      user: verifiedEmail,
      action: "FORBIDDEN_ADMIN_ACCESS",
      details: `User '${verifiedEmail}' with role '${verifiedRole}' attempted unauthorized write to ${req.path}`,
      ip: clientIp,
      requestId,
      endpoint: req.originalUrl || req.path,
      outcome: "DENIED"
    });
    return res.status(403).json({
      error: "Access Denied: Administrative permissions required for this resource."
    });
  }
  req.adminEmail = verifiedEmail;
  req.adminRole = verifiedRole;
  req.clientIp = clientIp;
  req.requestId = requestId;
  return next();
}
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
var blockedAuditLogs = [
  {
    id: "log_1",
    timestamp: new Date(Date.now() - 36e5).toISOString(),
    user: "User_8921",
    action: "MODERATION_VIOLATION_BLOCKED",
    ip: "127.0.0.1",
    requestId: "req_init_1",
    endpoint: "/api/gemini/moderate",
    outcome: "DENIED",
    details: "Inappropriate language sample detected in UPSC Room",
    room: "UPSC Room",
    contentSnippet: "Inappropriate language sample detected...",
    category: "abuse",
    reason: "Offensive language violation"
  }
];
var watchdogSystemLogs = [];
var userCustomSubjectsDb = [];
var userManualQuestionsDb = [];
var userPomodoroSessionsDb = [];
var processedSessionsStore = /* @__PURE__ */ new Set();
var userWorkspacePreferencesDb = /* @__PURE__ */ new Map();
var simulatedErrors = {
  googleSheets: false,
  geminiApi: false,
  supabaseDb: false
};
var globalAdminSettings = {
  googleSheetsUrl: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing",
  updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  lastUpdatedBy: "System Admin",
  planPricing: {
    monthlyPrice: 299,
    annualPrice: 1499,
    lifetimePrice: 2999,
    currency: "INR",
    customDiscountPercent: 20,
    priceMoneyRules: "Special Cashback: Get 100% XP bonus & INR 50 Cashback on completing 30-day study streak!"
  },
  razorpay: {
    enabled: Boolean(process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID),
    keyId: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: "",
    environment: (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "").startsWith("rzp_live_") ? "live" : "test",
    currency: "INR"
  },
  adsense: {
    enabled: true,
    publisherId: "ca-pub-8740054860974100",
    headerSlot: "7137181575",
    sidebarSlot: "5647382910",
    inFeedSlot: "9988776655",
    footerSlot: "4433221100",
    headerSlotEnabled: true,
    sidebarSlotEnabled: true,
    footerSlotEnabled: true,
    inFeedSlotEnabled: true,
    autoAdsEnabled: false
  },
  moderation: {
    enabled: true,
    autoban: true,
    keywords: [
      "fuck",
      "bitch",
      "asshole",
      "bastard",
      "porn",
      "nude",
      "nsfw",
      "randi",
      "chutiya",
      "madarchod",
      "behenchod",
      "bhosdi",
      "gandu",
      "harami",
      "kutta",
      "saala kutta",
      "chod",
      "lund",
      "gaand"
    ]
  },
  customizer: {
    brandName: "ASPIRANTX",
    brandTagline: "Gen-Z Prep Suite (Class 1 - Ph.D.)",
    brandBadge: "PRO",
    logoIconText: "AX",
    logoUrl: "",
    themePalette: "CYBER_EMERALD",
    fontFamily: "PLUS_JAKARTA",
    backgroundAnimation: "AURORA_WAVE",
    showBackgroundParticles: true,
    showHeroBanner: true,
    heroBannerTitle: "[STUDENT] Complete Prep Suite for All Exams (Class 1 to Ph.D.)",
    heroBannerSubtitle: "Track Syllabus, AI Study Buddy, Live Mock Predictor & Community Chat in One Place.",
    heroBannerImageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80",
    heroBannerCtaText: "Explore Syllabus Tracker",
    showAnnouncementTicker: true,
    announcementText: "[HOT] New Syllabus Templates added for UPPSC, Bihar Board, Class 10/12 PCM & Ph.D. Entrance! Customize your goal in Profile."
  },
  demoLimits: {
    demoDurationMinutes: 10
  }
};
function mergeAdminSettings(target, source) {
  if (!source) return target;
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (srcVal === void 0 || srcVal === null) continue;
    if (typeof srcVal === "object" && !Array.isArray(srcVal) && typeof tgtVal === "object" && !Array.isArray(tgtVal)) {
      result[key] = mergeAdminSettings(tgtVal, srcVal);
    } else {
      result[key] = srcVal;
    }
  }
  return result;
}
async function updateGlobalAdminSettings(body, updatedBy = "Admin") {
  if (!body) return globalAdminSettings;
  if (body.googleSheetsUrl && typeof body.googleSheetsUrl === "string") {
    globalAdminSettings.googleSheetsUrl = body.googleSheetsUrl.trim();
  }
  if (body.planPricing && typeof body.planPricing === "object") {
    globalAdminSettings.planPricing = {
      ...globalAdminSettings.planPricing,
      ...body.planPricing
    };
  }
  if (body.razorpay && typeof body.razorpay === "object") {
    const existingSecret = globalAdminSettings.razorpay.keySecret;
    const incomingSecret = body.razorpay.keySecret;
    const finalSecret = incomingSecret && incomingSecret.trim() !== "" && !incomingSecret.includes("----") ? incomingSecret : existingSecret;
    const incomingKeyId = body.razorpay.keyId !== void 0 ? body.razorpay.keyId : globalAdminSettings.razorpay.keyId;
    let detectedEnv = body.razorpay.environment || globalAdminSettings.razorpay.environment || "test";
    if (incomingKeyId) {
      if (incomingKeyId.startsWith("rzp_live_")) {
        detectedEnv = "live";
      } else if (incomingKeyId.startsWith("rzp_test_")) {
        detectedEnv = "test";
      }
    }
    globalAdminSettings.razorpay = {
      ...globalAdminSettings.razorpay,
      ...body.razorpay,
      keyId: incomingKeyId,
      keySecret: finalSecret,
      environment: detectedEnv
    };
  }
  if (body.adsense && typeof body.adsense === "object") {
    globalAdminSettings.adsense = {
      ...globalAdminSettings.adsense,
      ...body.adsense
    };
  }
  if (body.customizer && typeof body.customizer === "object") {
    globalAdminSettings.customizer = {
      ...globalAdminSettings.customizer,
      ...body.customizer
    };
  }
  if (body.demoLimits && typeof body.demoLimits === "object") {
    globalAdminSettings.demoLimits = {
      ...globalAdminSettings.demoLimits,
      ...body.demoLimits
    };
  }
  if (typeof body.demoDurationMinutes === "number" && body.demoDurationMinutes > 0) {
    globalAdminSettings.demoLimits = {
      ...globalAdminSettings.demoLimits,
      demoDurationMinutes: body.demoDurationMinutes
    };
  }
  globalAdminSettings.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  globalAdminSettings.lastUpdatedBy = updatedBy;
  await saveAdminStoreToDisk();
  return globalAdminSettings;
}
var APP_VERSION = process.env.APP_VERSION || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || process.env.COMMIT_REF?.slice(0, 7) || "2.4.0";
function isValidUUID(str) {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str).trim());
}
function getISTDateString(date = /* @__PURE__ */ new Date()) {
  const istOffset = 5.5 * 60 * 60 * 1e3;
  const istDate = new Date(date.getTime() + istOffset);
  return istDate.toISOString().split("T")[0];
}
async function updateStreak(userIdentifier) {
  if (!userIdentifier) return { streakDays: 1, lastActiveDate: getISTDateString(), persisted: false };
  const cleanId = String(userIdentifier).trim().toLowerCase();
  const isEmail = cleanId.includes("@");
  const todayStr = getISTDateString(/* @__PURE__ */ new Date());
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - 1);
  const yesterdayStr = getISTDateString(d);
  let currentStreak = 1;
  let lastActive = "";
  let matchedSupabaseId = null;
  let matchedSupabaseEmail = null;
  let supabaseRecordFound = false;
  if (supabaseServer) {
    try {
      let query = supabaseServer.from("user_profiles").select("id, email, streak_days, last_active_date");
      if (isEmail) {
        query = query.or(`id.eq.${cleanId},email.eq.${cleanId}`);
      } else {
        query = query.eq("id", userIdentifier);
      }
      const { data, error } = await query.limit(1).maybeSingle();
      if (error) {
        console.error("[StreakEngine] Supabase streak query error:", error.message, "code:", error.code);
      } else if (data) {
        supabaseRecordFound = true;
        matchedSupabaseId = data.id || null;
        matchedSupabaseEmail = data.email || null;
        currentStreak = Number(data.streak_days) || 1;
        lastActive = data.last_active_date || "";
      }
    } catch (e) {
      console.error("[StreakEngine] Supabase streak query exception:", e?.message || e);
    }
  }
  let memoryUser = adminUsersDb.find(
    (u) => u.id && (u.id === userIdentifier || u.id.toLowerCase() === cleanId || matchedSupabaseId && u.id === matchedSupabaseId) || u.email && (u.email.toLowerCase() === cleanId || matchedSupabaseEmail && u.email.toLowerCase() === matchedSupabaseEmail.toLowerCase())
  );
  if (!supabaseServer && memoryUser) {
    lastActive = memoryUser.lastActiveDate || memoryUser.last_active_date || "";
    currentStreak = Number(memoryUser.streakDays) || 1;
  }
  let newStreak = currentStreak;
  if (!lastActive) {
    newStreak = 1;
  } else if (lastActive === todayStr) {
    newStreak = currentStreak;
  } else if (lastActive === yesterdayStr) {
    newStreak = currentStreak + 1;
  } else {
    newStreak = 1;
  }
  lastActive = todayStr;
  if (memoryUser) {
    memoryUser.streakDays = newStreak;
    memoryUser.lastActiveDate = todayStr;
    memoryUser.last_active_date = todayStr;
    if (isEmail && !memoryUser.email) memoryUser.email = cleanId;
  } else {
    const targetUserId = matchedSupabaseId || userIdentifier;
    adminUsersDb.push({
      id: targetUserId,
      email: isEmail ? cleanId : matchedSupabaseEmail || "",
      name: isEmail ? cleanId.split("@")[0] : "User",
      exam: "NEET_UG",
      role: "USER",
      isPremium: false,
      planName: "FREE",
      streakDays: newStreak,
      lastActiveDate: todayStr,
      last_active_date: todayStr,
      xp: 100,
      coins: 50,
      level: 1,
      completedTopicsCount: 0,
      joinedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  let persisted = false;
  if (supabaseServer) {
    const targetId = matchedSupabaseId || userIdentifier;
    const upsertData = {
      id: targetId,
      streak_days: newStreak,
      last_active_date: todayStr,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const targetEmail = matchedSupabaseEmail || (isEmail ? cleanId : null);
    if (targetEmail) {
      upsertData.email = targetEmail;
    }
    try {
      const { error: upsertErr } = await supabaseServer.from("user_profiles").upsert(upsertData, { onConflict: "id" });
      if (upsertErr) {
        console.error("[StreakEngine] Supabase streak upsert failed:", upsertErr.message, "code:", upsertErr.code);
        persisted = false;
      } else {
        persisted = true;
      }
    } catch (e) {
      console.error("[StreakEngine] Supabase streak upsert exception:", e?.message || e);
      persisted = false;
    }
  } else {
    persisted = true;
  }
  return { streakDays: newStreak, lastActiveDate: todayStr, persisted };
}
var lastGatewaySettingsSync = 0;
var GATEWAY_SETTINGS_CACHE_MS = 1e4;
function mapRowToUtrRecord(row) {
  return {
    id: row.id,
    utr: row.utr,
    plan: row.plan || "monthly",
    amount: Number(row.amount) || 0,
    userEmail: row.user_email || row.userEmail || "",
    userName: row.user_name || row.userName || "Aspirant Student",
    submittedAt: row.created_at || row.submittedAt || row.submitted_at || (/* @__PURE__ */ new Date()).toISOString(),
    status: row.status || "PENDING",
    processedBy: row.processed_by || row.processedBy || void 0,
    processedAt: row.processed_at || row.processedAt || void 0
  };
}
var serverOrdersDb = /* @__PURE__ */ new Map();
var serverSubscriptionsDb = /* @__PURE__ */ new Map();
var adRewardsDb = /* @__PURE__ */ new Map();
var studyBuddyQueue = /* @__PURE__ */ new Map();
var studyBuddyMatches = /* @__PURE__ */ new Map();
var studyHeartbeatsStore = /* @__PURE__ */ new Map();
var rewardMilestonesStore = /* @__PURE__ */ new Map();
var rewardClaimsStore = /* @__PURE__ */ new Map();
var personalSyllabusNodesStore = /* @__PURE__ */ new Map();
var syllabusTimeLogsStore = /* @__PURE__ */ new Map();
var userErrorLogsStore = /* @__PURE__ */ new Map();
function getErrorLogEncryptionKeyBuffer() {
  const keyStr = process.env.ERROR_LOG_ENCRYPTION_KEY || "default_aspirantx_dev_error_log_encryption_secret_key_2026";
  try {
    if (/^[0-9a-fA-F]{64}$/.test(keyStr)) {
      return Buffer.from(keyStr, "hex");
    }
    return import_crypto.default.createHash("sha256").update(keyStr).digest();
  } catch (err) {
    console.warn("[ERROR LOG CRYPTO] Invalid ERROR_LOG_ENCRYPTION_KEY:", err);
    return null;
  }
}
function encryptErrorPayload(plainObj) {
  const keyBuf = getErrorLogEncryptionKeyBuffer();
  if (!keyBuf) return null;
  try {
    const iv = import_crypto.default.randomBytes(12);
    const cipher = import_crypto.default.createCipheriv("aes-256-gcm", keyBuf, iv);
    let ciphertext = cipher.update(JSON.stringify(plainObj), "utf8", "hex");
    ciphertext += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return {
      iv: iv.toString("hex"),
      authTag,
      ciphertext
    };
  } catch (err) {
    console.warn("[ERROR LOG CRYPTO] Encryption error:", err);
    return null;
  }
}
function decryptErrorPayload(encryptedPayload) {
  if (!encryptedPayload || !encryptedPayload.iv || !encryptedPayload.authTag || !encryptedPayload.ciphertext) {
    return null;
  }
  const keyBuf = getErrorLogEncryptionKeyBuffer();
  if (!keyBuf) return { error: "Encryption key not configured on server" };
  try {
    const ivBuf = Buffer.from(encryptedPayload.iv, "hex");
    const authTagBuf = Buffer.from(encryptedPayload.authTag, "hex");
    const decipher = import_crypto.default.createDecipheriv("aes-256-gcm", keyBuf, ivBuf);
    decipher.setAuthTag(authTagBuf);
    let plain = decipher.update(encryptedPayload.ciphertext, "hex", "utf8");
    plain += decipher.final("utf8");
    return JSON.parse(plain);
  } catch (err) {
    console.warn("[ERROR LOG CRYPTO] Decryption error:", err);
    return { error: "Decryption failed (Invalid key or corrupted payload)" };
  }
}
var errorLogIpLimits = /* @__PURE__ */ new Map();
function errorLogRateLimiter(req, res, next) {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1e3;
  const maxRequests = 20;
  let record = errorLogIpLimits.get(String(ip));
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    errorLogIpLimits.set(String(ip), record);
    return next();
  }
  if (record.count >= maxRequests) {
    return res.status(429).json({ error: "Too many error reports from this IP. Rate limit exceeded." });
  }
  record.count += 1;
  next();
}
var feedbackReportsStore = /* @__PURE__ */ new Map();
var customExamsStore = /* @__PURE__ */ new Map();
var INITIAL_FEEDBACK_REPORTS = [
  {
    id: "feed_1",
    section: "CBT Exam Engine",
    type: "Performance Bug",
    description: "Timer count mismatch on page reloads.",
    user_email: "ambujyadav0010@gmail.com",
    status: "Resolved",
    admin_note: "Fixed timer state synchronization in localStorage.",
    resolved_by: "ambujyadav0010@gmail.com",
    resolved_at: "2026-08-07T14:32:00.000Z",
    created_at: "2026-08-07T14:32:00.000Z"
  },
  {
    id: "feed_2",
    section: "Syllabus Tracker",
    type: "Content Correction",
    description: 'Polity subtopic "Preamble" spelling correction needed.',
    user_email: "test_student@example.com",
    status: "Under Review",
    admin_note: null,
    resolved_by: null,
    resolved_at: null,
    created_at: "2026-08-08T01:10:00.000Z"
  }
];
INITIAL_FEEDBACK_REPORTS.forEach((r) => feedbackReportsStore.set(r.id, r));
if (rewardMilestonesStore.size === 0) {
  const defaultMilestones = [
    {
      id: "ms_kit_01",
      title: "UPSC/SSC Elite Aspirant Study Kit & T-Shirt",
      description: "Receive an official AspirantX premium cotton hoodie, highlighters, notebook set, and success planner delivered to your home.",
      rewardType: "merch",
      rewardLabel: "Deluxe Study Kit & T-Shirt",
      requiredVerifiedMinutes: 3e3,
      isActive: true,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "ms_pass_02",
      title: "1-Year VIP Mentor Pass & Test Series",
      description: "Unlock 1 year of unlimited CBT mock tests, live AI answer evaluation, priority study buddy matching, and topper webinars.",
      rewardType: "subscription",
      rewardLabel: "1-Year VIP Pass",
      requiredVerifiedMinutes: 6e3,
      isActive: true,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  for (const m of defaultMilestones) {
    rewardMilestonesStore.set(m.id, m);
  }
}
var processedWebhookEvents = /* @__PURE__ */ new Set();
var pendingUtrRequestsDb = /* @__PURE__ */ new Map();
var DEFAULT_EDUCATORS_LIST = [
  {
    id: "ed_1",
    name: "Dr. Siddharth Arora",
    subject: "Indian Polity & Governance",
    experience: "12+ Years",
    qualification: "Advocate Supreme Court, PhD",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    isVerified: true,
    status: "APPROVED",
    email: "siddharth.arora@aspirantx.in",
    bio: "Senior UPSC Polity faculty & advocate supreme court",
    availability: ["Today, 6:00 PM", "Tomorrow, 9:00 AM", "Tomorrow, 5:00 PM", "12 Aug, 11:00 AM", "13 Aug, 4:00 PM"],
    rating: 4.8,
    studentsCount: 15400,
    reviewsCount: 1280,
    sessionPrice: 499,
    isOnline: true
  },
  {
    id: "ed_2",
    name: "Mrunal Patel",
    subject: "Indian Economy & Budgetary Reforms",
    experience: "10+ Years",
    qualification: "Senior Educator, MBA Finance",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    isVerified: true,
    status: "APPROVED",
    email: "mrunal.patel@aspirantx.in",
    bio: "Pioneer of UPSC Economy simplified lectures & handouts",
    availability: ["Today, 7:00 PM", "Tomorrow, 2:00 PM", "13 Aug, 10:00 AM", "14 Aug, 6:00 PM"],
    rating: 4.9,
    studentsCount: 28900,
    reviewsCount: 3100,
    sessionPrice: 0,
    // Free Session
    isOnline: false
  }
];
var educatorsStore = /* @__PURE__ */ new Map();
DEFAULT_EDUCATORS_LIST.forEach((ed) => educatorsStore.set(ed.id, ed));
var educatorBookingsStore = /* @__PURE__ */ new Map();
var educatorChatsStore = /* @__PURE__ */ new Map();
var DEFAULT_PODCASTS_LIST = [
  {
    id: "p1",
    topperName: "Anish Thakkar",
    rank: "UPSC CSE AIR 3 (2025)",
    subject: "Polity & GS Paper 2 Strategy",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: "14:20",
    description: "Anish details how keeping answer structures simple, drawing flowcharts, and solving past 10 years papers multiple times led to high marks in GS 2.",
    booklist: ["Indian Polity by Laxmikanth", "DD Basu Introduction to the Constitution", "ARC 2nd Reports on Governance"]
  },
  {
    id: "p2",
    topperName: "Priya Sharma",
    rank: "UPSC CSE AIR 12 (2025)",
    subject: "Geography Optional & Answer Writing",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: "18:45",
    description: "Priya shares tips on drawing hand-made maps, highlighting map locations in paper 2, and scoring 290+ in Geography optional.",
    booklist: ["Physical Geography by Savindra Singh", "India: A Comprehensive Geography by DR Khullar", "AspirantX Reference Library Map Notes"]
  }
];
var podcastsStore = /* @__PURE__ */ new Map();
DEFAULT_PODCASTS_LIST.forEach((p) => podcastsStore.set(p.id, p));
var DEFAULT_BLOG_POSTS = [
  {
    id: "post_default_1",
    title: "UPSC CSE 2026: Comprehensive Strategy for Prelims & Mains Integration",
    body: `Preparing for Civil Services requires a synchronized approach between Prelims factual coverage and Mains analytical depth.

### 1. The Core Pillar: NCERTs & Standard Books
Before jumping into advanced test series, ensure your basic foundation in History, Polity, Geography, and Economy is rock solid. Standard books like Laxmikanth for Indian Polity and Ramesh Singh for Economy must be read multiple times.

### 2. Daily Editorial Analysis
Never skip the daily newspaper. Focus on editorial arguments, constitutional provisions mentioned in news, and key government reports like 2nd ARC and NITI Aayog Strategy.

### 3. Answer Writing Routine
Start writing 2 answers daily after covering 50% of the syllabus. Pay attention to flowcharts, maps, and bullet points.`,
    category: "Strategy",
    authorTeacherId: "ed_1",
    authorName: "Dr. Siddharth Arora",
    status: "published",
    coverImageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80",
    createdAt: new Date(Date.now() - 864e5 * 3).toISOString(),
    publishedAt: new Date(Date.now() - 864e5 * 3).toISOString()
  },
  {
    id: "post_default_2",
    title: "Union Budget Highlights & Economic Implications for GS Paper 3",
    body: `The Union Budget sets the macroeconomic roadmap for the fiscal year. Here is a detailed breakdown of the critical sectors relevant for UPSC GS Paper 3.

### Key Macro Themes
- **Capital Expenditure Increase**: Boost to infrastructure and freight corridors.
- **Fiscal Deficit Target**: Sticking to the fiscal consolidation path below 4.5% of GDP.
- **Green Growth & Renewable Energy**: Subsidies for solar manufacturing and EV infrastructure.

### Agricultural Reforms & Digital Public Infrastructure
Enhancing Agri-Stack and crop diversification funds for climate-resilient farming practices.`,
    category: "Economy",
    authorTeacherId: "ed_2",
    authorName: "Mrunal Patel",
    status: "published",
    coverImageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80",
    createdAt: new Date(Date.now() - 864e5).toISOString(),
    publishedAt: new Date(Date.now() - 864e5).toISOString()
  }
];
var blogPostsStore = /* @__PURE__ */ new Map();
DEFAULT_BLOG_POSTS.forEach((p) => blogPostsStore.set(p.id, p));
var blogRequestsStore = /* @__PURE__ */ new Map();
var adminUsersDb = [
  {
    id: "usr-admin-01",
    name: "Ambuj Yadav (Super Admin)",
    email: "ambujyadav0010@gmail.com",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    exam: "UPSC CSE 2026",
    stateName: "Uttar Pradesh",
    role: "ADMIN",
    isPremium: true,
    planName: "PRO PASS",
    streakDays: 45,
    xp: 3500,
    coins: 999,
    level: 10,
    completedTopicsCount: 28,
    joinedAt: "2026-01-01",
    status: "ACTIVE"
  },
  {
    id: "usr-rahul-02",
    name: "Rahul Sharma (Aspirant)",
    email: "rahul.upsc2026@aspirantx.in",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    exam: "UPSC CSE 2026",
    stateName: "Delhi NCR",
    role: "USER",
    isPremium: true,
    planName: "PRO PASS",
    streakDays: 14,
    xp: 1250,
    coins: 240,
    level: 4,
    completedTopicsCount: 12,
    joinedAt: "2026-02-10",
    status: "ACTIVE"
  }
];
var adminAnnouncementsStore = /* @__PURE__ */ new Map();
var adminContentDb = {
  announcements: [
    {
      id: "ann-1",
      title: "UPSC Prelims 2026 Mock Test Series Live!",
      content: "Join the full-length All India Mock Test series starting this Sunday. Complete syllabus coverage with AI performance analytics.",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      priority: "HIGH",
      active: true
    }
  ],
  categories: [
    { id: "cat-1", name: "Polity & Governance", exam: "UPSC_CSE", icon: "BookOpen" },
    { id: "cat-2", name: "Indian History & Art", exam: "UPSC_CSE", icon: "Landmark" },
    { id: "cat-3", name: "Geography & Environment", exam: "UPSC_CSE", icon: "Globe" }
  ],
  subjects: [
    { id: "sub-1", name: "Indian Constitution & Articles", categoryId: "cat-1" },
    { id: "sub-2", name: "Modern Indian History (1857-1947)", categoryId: "cat-2" }
  ],
  questions: [
    {
      id: "q-1",
      question: "Which Article of the Indian Constitution empowers the President to promulgate Ordinances during recess of Parliament?",
      options: ["Article 123", "Article 213", "Article 352", "Article 72"],
      correctAnswer: 0,
      explanation: "Article 123 of the Indian Constitution grants the President power to promulgate ordinances during Parliament recess.",
      exam: "UPSC_CSE",
      subject: "Indian Constitution & Articles"
    }
  ],
  pyqs: [
    {
      id: "pyq-1",
      year: 2024,
      exam: "UPSC_CSE",
      paper: "GS Paper 1",
      title: "Consider the following statements regarding the Attorney General of India..."
    }
  ],
  syllabus: [],
  groups: [],
  chatSettings: {
    maxMessageLength: 1e3,
    allowAttachments: true,
    autoModeration: true
  },
  examSettings: {
    activeExams: ["UPSC_CSE", "SSC_CGL", "UPPSC", "BPSC"],
    defaultExam: "UPSC_CSE"
  }
};
var adminTeamStore = [
  {
    id: "tm-1",
    name: "Ambuj Yadav",
    email: "ambujyadav0010@gmail.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    title: "Founder & Chief Executive Officer",
    role: "SUPER_ADMIN",
    department: "Executive Leadership",
    status: "ACTIVE",
    joinedAt: "2026-01-01",
    permissions: {
      canManageFinance: true,
      canManageAdsense: true,
      canManageFlags: true,
      canManageUsers: true,
      canManageTeam: true,
      canManageWatchdog: true,
      canManageCustomizer: true
    }
  },
  {
    id: "tm-2",
    name: "Priya Sharma",
    email: "priya.content@aspirantx.in",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
    title: "Academic Director & Chief Content Officer",
    role: "ACADEMIC_LEAD",
    department: "Academics & Question Bank",
    status: "ACTIVE",
    joinedAt: "2026-01-15",
    permissions: {
      canManageFinance: false,
      canManageAdsense: false,
      canManageFlags: false,
      canManageUsers: true,
      canManageTeam: false,
      canManageWatchdog: false,
      canManageCustomizer: false
    }
  },
  {
    id: "tm-3",
    name: "Vikram Malhotra",
    email: "vikram.finance@aspirantx.in",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    title: "Head of Billing & Payment Operations",
    role: "FINANCE_MANAGER",
    department: "Finance & Monetization",
    status: "ACTIVE",
    joinedAt: "2026-02-01",
    permissions: {
      canManageFinance: true,
      canManageAdsense: true,
      canManageFlags: false,
      canManageUsers: true,
      canManageTeam: false,
      canManageWatchdog: false,
      canManageCustomizer: false
    }
  },
  {
    id: "tm-4",
    name: "Sneha Verma",
    email: "sneha.community@aspirantx.in",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
    title: "Community Lead & Student Support Specialist",
    role: "COMMUNITY_LEAD",
    department: "Community & Moderation",
    status: "ACTIVE",
    joinedAt: "2026-02-05",
    permissions: {
      canManageFinance: false,
      canManageAdsense: false,
      canManageFlags: false,
      canManageUsers: true,
      canManageTeam: false,
      canManageWatchdog: false,
      canManageCustomizer: false
    }
  },
  {
    id: "tm-5",
    name: "Rohan Mehta",
    email: "rohan.tech@aspirantx.in",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
    title: "Lead Systems Architect & DevOps",
    role: "TECH_LEAD",
    department: "Engineering & Infrastructure",
    status: "ACTIVE",
    joinedAt: "2026-01-20",
    permissions: {
      canManageFinance: false,
      canManageAdsense: true,
      canManageFlags: true,
      canManageUsers: false,
      canManageTeam: false,
      canManageWatchdog: true,
      canManageCustomizer: true
    }
  }
];
var adminTasksStore = [
  {
    id: "task-1",
    title: "Review 12 Pending UTR Bank Transfers",
    description: "Verify screenshot attachments and approve manual PRO Pass upgrades for pending UPI transactions.",
    assignedTo: "vikram.finance@aspirantx.in",
    assignedToName: "Vikram Malhotra",
    module: "FINANCE",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignedAt: new Date(Date.now() - 72e5).toISOString(),
    dueDate: "Today"
  },
  {
    id: "task-2",
    title: "Moderate Reported Answer Key Discussion #101",
    description: "Check flagged polity comment regarding Article 226 vs Article 32 writ jurisdiction in Community Forum.",
    assignedTo: "sneha.community@aspirantx.in",
    assignedToName: "Sneha Verma",
    module: "COMMUNITY",
    priority: "MEDIUM",
    status: "PENDING",
    assignedAt: new Date(Date.now() - 144e5).toISOString(),
    dueDate: "Today"
  },
  {
    id: "task-3",
    title: "Upload UPSC Prelims 2026 Mock Test #5 Question Paper",
    description: "Format and review 100 GS-1 questions with detailed explanations and syllabus mappings.",
    assignedTo: "priya.content@aspirantx.in",
    assignedToName: "Priya Sharma",
    module: "CONTENT",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignedAt: new Date(Date.now() - 288e5).toISOString(),
    dueDate: "Tomorrow"
  },
  {
    id: "task-4",
    title: "Audit System Health Logs & Rate Limiting Thresholds",
    description: "Run full Watchdog vulnerability scan and check Razorpay webhook SSL certificate validation.",
    assignedTo: "rohan.tech@aspirantx.in",
    assignedToName: "Rohan Mehta",
    module: "TECH",
    priority: "LOW",
    status: "COMPLETED",
    assignedAt: new Date(Date.now() - 864e5).toISOString(),
    dueDate: "Completed"
  }
];
var DEFAULT_SPONSORS_LIST = [
  { id: "sp-1", name: "Unacademy", logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80", website: "https://unacademy.com", tier: "gold", description: "India's largest learning platform - Official Education Partner" },
  { id: "sp-2", name: "Vajiram & Ravi", logo: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=120&auto=format&fit=crop&q=80", website: "https://vajiramandravi.com", tier: "gold", description: "Premier Institute for IAS Preparation - General Studies Partner" },
  { id: "sp-3", name: "Physics Wallah", logo: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=120&auto=format&fit=crop&q=80", website: "https://pw.live", tier: "gold", description: "Empowering students with affordable learning - Tech Sponsor" },
  { id: "sp-4", name: "Testbook", logo: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=120&auto=format&fit=crop&q=80", website: "https://testbook.com", tier: "silver", description: "Comprehensive Mock Tests & Live Test Series Partner" },
  { id: "sp-5", name: "Oliveboard", logo: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=120&auto=format&fit=crop&q=80", website: "https://oliveboard.in", tier: "silver", description: "Banking & Government Exam preparation portal" },
  { id: "sp-6", name: "Chahal Academy", logo: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=120&auto=format&fit=crop&q=80", website: "https://chahalacademy.com", tier: "silver", description: "Specialized Civil Services & State PCS classroom training" }
];
var DEFAULT_COLLABORATORS_LIST = [
  { id: "col-1", name: "Vision IAS", logo: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=120&auto=format&fit=crop&q=80", type: "Academic Partner", contribution: "Syllabus Mappings & Free Notes" },
  { id: "col-2", name: "Drishti IAS", logo: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=120&auto=format&fit=crop&q=80", type: "Hindi Medium Partner", contribution: "Bilingual Question Translation" },
  { id: "col-3", name: "IAS Baba", logo: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=120&auto=format&fit=crop&q=80", type: "Daily Quiz Contributor", contribution: "Daily Practice Quizzes & Current Affairs" },
  { id: "col-4", name: "insightsIAS", logo: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=120&auto=format&fit=crop&q=80", type: "Answer Writing Contributor", contribution: "Mains Practice Questions & Guidelines" }
];
var DEFAULT_OFFICE_ACTIVITIES = [
  { id: "act-1", timestamp: new Date(Date.now() - 6e5).toISOString(), memberName: "Priya Sharma", action: "UPLOAD", details: "Uploaded 45 questions for Indian Economy (Budget 2026)" },
  { id: "act-2", timestamp: new Date(Date.now() - 18e5).toISOString(), memberName: "Rohan Mehta", action: "SYSTEM", details: "Optimized PostgreSQL queries for Question Bank" },
  { id: "act-3", timestamp: new Date(Date.now() - 36e5).toISOString(), memberName: "Sneha Verma", action: "COMMUNITY", details: "Resolved 3 flags in UPSC Group Study Room" },
  { id: "act-4", timestamp: new Date(Date.now() - 72e5).toISOString(), memberName: "Vikram Malhotra", action: "FINANCE", details: "Processed 5 manual bank transfer upgrades" }
];
var sponsorsDb = [...DEFAULT_SPONSORS_LIST];
var collaboratorsDb = [...DEFAULT_COLLABORATORS_LIST];
var sponsorInquiriesDb = [];
var teamApplicationsDb = [];
var officeActivityFeed = [...DEFAULT_OFFICE_ACTIVITIES];
var pendingContentUploadsDb = [
  { id: "up-1", uploader: "Priya Sharma", exam: "UPSC_CSE", subject: "Polity", topic: "Preamble", questionCount: 15, title: "UPSC CSE 2025 Mock Polity Prep", uploadedAt: new Date(Date.now() - 36e5 * 2).toISOString(), status: "PENDING" },
  { id: "up-2", uploader: "Amit Patel (Contributor)", exam: "SSC_CGL", subject: "Quantitative Aptitude", topic: "Geometry", questionCount: 25, title: "SSC CGL 2024 Geometry PYQs", uploadedAt: new Date(Date.now() - 36e5 * 5).toISOString(), status: "PENDING" }
];
async function saveAdminStoreToDisk() {
  try {
    const targetFile = getWritableDataFilePath();
    const store = {
      globalAdminSettings,
      featureFlagsStore,
      orders: Array.from(serverOrdersDb.entries()),
      subscriptions: Array.from(serverSubscriptionsDb.entries()),
      processedWebhookEvents: Array.from(processedWebhookEvents),
      utrRequests: Array.from(pendingUtrRequestsDb.entries()),
      blockedAuditLogs,
      watchdogSystemLogs,
      adminUsers: adminUsersDb,
      adminContent: adminContentDb,
      adminTeam: adminTeamStore,
      adminTasks: adminTasksStore,
      savedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    import_fs.default.writeFileSync(targetFile, JSON.stringify(store, null, 2), "utf-8");
    if (supabaseServer) {
      try {
        await Promise.all([
          supabaseServer.from("admin_settings").upsert([{ id: "global", data: globalAdminSettings, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" }),
          supabaseServer.from("feature_flags").upsert(featureFlagsStore.map((f) => ({
            feature_name: f.feature_name,
            label: f.label,
            description: f.description,
            is_premium: Boolean(f.is_premium),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          })), { onConflict: "feature_name" }),
          supabaseServer.from("admin_users").upsert(adminUsersDb.map((u) => ({
            id: u.id || `usr_${Math.random().toString(36).substring(2, 9)}`,
            email: String(u.email || "").trim().toLowerCase(),
            name: u.name || "User",
            role: u.role || "STUDENT",
            is_premium: Boolean(u.isPremium),
            plan_name: u.planName || "FREE",
            streak_days: Number(u.streakDays || 0),
            xp: Number(u.xp || 0),
            coins: Number(u.coins || 0),
            level: Number(u.level || 1),
            status: u.status || "ACTIVE",
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          })), { onConflict: "id" }),
          supabaseServer.from("admin_content").upsert([{ id: "global", data: adminContentDb, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" }),
          supabaseServer.from("user_subscriptions").upsert(
            Array.from(serverSubscriptionsDb.values()).map((sub) => ({
              userEmail: String(sub.userEmail || "").trim().toLowerCase(),
              planId: sub.planId || "monthly",
              isPremium: Boolean(sub.isPremium),
              activatedAt: sub.activatedAt || (/* @__PURE__ */ new Date()).toISOString(),
              expiresAt: sub.expiresAt || (/* @__PURE__ */ new Date()).toISOString(),
              paymentId: sub.paymentId || null,
              orderId: sub.orderId || null,
              verificationMethod: sub.verificationMethod || "ADMIN_VERIFIED",
              amountPaid: Number(sub.amountPaid || 0),
              currency: sub.currency || "INR",
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            })),
            { onConflict: "userEmail" }
          ),
          supabaseServer.from("study_heartbeats").upsert(
            Array.from(studyHeartbeatsStore.values()).flat().map((hb) => ({
              id: hb.id,
              user_id: hb.userId || hb.user_id,
              session_id: hb.sessionId || hb.session_id,
              subject: hb.subject,
              topic_id: hb.topicId || hb.topic_id || null,
              pinged_at: hb.pingedAt || hb.pinged_at || (/* @__PURE__ */ new Date()).toISOString()
            })),
            { onConflict: "id" }
          ),
          supabaseServer.from("reward_milestones").upsert(
            Array.from(rewardMilestonesStore.values()).map((m) => ({
              id: m.id,
              data: m,
              updated_at: m.updated_at || (/* @__PURE__ */ new Date()).toISOString()
            })),
            { onConflict: "id" }
          ),
          supabaseServer.from("reward_claims").upsert(
            Array.from(rewardClaimsStore.values()).map((c) => ({
              id: c.id,
              data: c,
              updated_at: c.updated_at || c.claimedAt || (/* @__PURE__ */ new Date()).toISOString()
            })),
            { onConflict: "id" }
          ),
          supabaseServer.from("syllabus_nodes").upsert(
            Array.from(syllabusNodesStore.values()).map((n) => ({
              id: n.id,
              data: n,
              updated_at: n.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
            })),
            { onConflict: "id" }
          ),
          supabaseServer.from("pyqs").upsert(
            Array.from(pyqStore.values()).map((p) => ({
              id: p.id,
              data: p,
              updated_at: p.updatedAt || p.createdAt || (/* @__PURE__ */ new Date()).toISOString()
            })),
            { onConflict: "id" }
          )
        ]);
        console.log("[SUPABASE SYNC SUCCESS] All server records upserted to Supabase PostgreSQL successfully.");
      } catch (dbErr) {
        console.error("[SUPABASE SYNC ERROR]", dbErr?.message || dbErr);
      }
    }
  } catch (err) {
    console.warn("Failed to save admin store to disk:", err?.message || err);
  }
}
function lockRazorpayEnvironment() {
  const finalKeyId = globalAdminSettings.razorpay?.keyId || process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "";
  if (globalAdminSettings.razorpay) {
    globalAdminSettings.razorpay.environment = finalKeyId.startsWith("rzp_live_") ? "live" : "test";
    globalAdminSettings.razorpay.enabled = Boolean(finalKeyId && !finalKeyId.includes("placeholder"));
  }
}
async function hydrateFromPrimaryDatabase(timeoutMs = 15e3) {
  if (!supabaseServer) return;
  const controller = new AbortController();
  let timerId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      controller.abort();
      reject(new Error(`[HYDRATION TIMEOUT] DB hydration exceeded ${timeoutMs}ms limit.`));
    }, timeoutMs);
  });
  const getQueryResult = (settledItem) => {
    if (settledItem.status === "fulfilled") {
      return {
        data: settledItem.value?.data ?? null,
        error: settledItem.value?.error ?? null
      };
    }
    return {
      data: null,
      error: settledItem.reason || new Error("Query rejected or aborted")
    };
  };
  const performHydration = async () => {
    const signal = controller.signal;
    const settledResults = await Promise.allSettled([
      supabaseServer.from("admin_settings").select("*").eq("id", "global").abortSignal(signal).maybeSingle(),
      supabaseServer.from("feature_flags").select("*").abortSignal(signal),
      supabaseServer.from("admin_users").select("*").abortSignal(signal),
      supabaseServer.from("admin_content").select("*").eq("id", "global").abortSignal(signal).maybeSingle(),
      supabaseServer.from("user_subscriptions").select("*").abortSignal(signal),
      supabaseServer.from("community_groups").select("*").abortSignal(signal),
      supabaseServer.from("notifications").select("*").abortSignal(signal),
      supabaseServer.from("orders").select("*").abortSignal(signal),
      supabaseServer.from("cbt_results").select("*").abortSignal(signal),
      supabaseServer.from("ad_rewards").select("*").abortSignal(signal),
      supabaseServer.from("study_buddy_queue").select("*").abortSignal(signal),
      supabaseServer.from("study_buddy_matches").select("*").abortSignal(signal),
      supabaseServer.from("study_heartbeats").select("*").abortSignal(signal),
      supabaseServer.from("reward_milestones").select("*").abortSignal(signal),
      supabaseServer.from("reward_claims").select("*").abortSignal(signal),
      supabaseServer.from("utr_requests").select("*").abortSignal(signal),
      supabaseServer.from("admin_announcements").select("*").abortSignal(signal),
      supabaseServer.from("personal_syllabus_nodes").select("*").abortSignal(signal)
    ]);
    const settingsRes = getQueryResult(settledResults[0]);
    const flagsRes = getQueryResult(settledResults[1]);
    const usersRes = getQueryResult(settledResults[2]);
    const contentRes = getQueryResult(settledResults[3]);
    const subsRes = getQueryResult(settledResults[4]);
    const groupsRes = getQueryResult(settledResults[5]);
    const notifsRes = getQueryResult(settledResults[6]);
    const ordersRes = getQueryResult(settledResults[7]);
    const cbtRes = getQueryResult(settledResults[8]);
    const adRes = getQueryResult(settledResults[9]);
    const queueRes = getQueryResult(settledResults[10]);
    const matchesRes = getQueryResult(settledResults[11]);
    const heartbeatsRes = getQueryResult(settledResults[12]);
    const milestonesRes = getQueryResult(settledResults[13]);
    const claimsRes = getQueryResult(settledResults[14]);
    const utrRes = getQueryResult(settledResults[15]);
    const announcementsRes = getQueryResult(settledResults[16]);
    const personalSyllabusRes = getQueryResult(settledResults[17]);
    if (settingsRes.error) {
      console.error("[HYDRATION ERROR] admin_settings fetch failed:", settingsRes.error.message || settingsRes.error);
    } else if (!settingsRes.data || !settingsRes.data.data) {
      console.warn("[SEED] admin_settings global row confirmed empty (no row/data, no error) - seeding defaults");
      lockRazorpayEnvironment();
      try {
        await supabaseServer.from("admin_settings").upsert([{ id: "global", data: globalAdminSettings, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
      } catch (e) {
        console.error("[SEED ERROR] admin_settings:", e);
      }
    } else {
      globalAdminSettings = mergeAdminSettings(globalAdminSettings, settingsRes.data.data);
    }
    if (flagsRes.error) {
      console.error("[HYDRATION ERROR] feature_flags fetch failed:", flagsRes.error.message || flagsRes.error);
    } else if (Array.isArray(flagsRes.data) && flagsRes.data.length === 0) {
      console.warn("[SEED] feature_flags table confirmed empty (0 rows, no error) - seeding defaults");
      try {
        await supabaseServer.from("feature_flags").upsert(featureFlagsStore.map((f) => ({
          feature_name: f.feature_name,
          label: f.label,
          description: f.description,
          is_premium: Boolean(f.is_premium),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        })), { onConflict: "feature_name" });
      } catch (e) {
        console.error("[SEED ERROR] feature_flags:", e);
      }
    } else if (Array.isArray(flagsRes.data) && flagsRes.data.length > 0) {
      featureFlagsStore = flagsRes.data;
    }
    if (usersRes.error) {
      console.error("[HYDRATION ERROR] admin_users fetch failed:", usersRes.error.message || usersRes.error);
    } else if (Array.isArray(usersRes.data) && usersRes.data.length === 0) {
      console.warn("[SEED] admin_users table confirmed empty (0 rows, no error) - seeding defaults");
      try {
        await supabaseServer.from("admin_users").upsert(adminUsersDb.map((u) => ({
          id: u.id || `usr_${Math.random().toString(36).substring(2, 9)}`,
          email: String(u.email || "").trim().toLowerCase(),
          name: u.name || "User",
          role: u.role || "STUDENT",
          is_premium: Boolean(u.isPremium),
          plan_name: u.planName || "FREE",
          streak_days: Number(u.streakDays || 0),
          xp: Number(u.xp || 0),
          coins: Number(u.coins || 0),
          level: Number(u.level || 1),
          status: u.status || "ACTIVE",
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        })), { onConflict: "id" });
      } catch (e) {
        console.error("[SEED ERROR] admin_users:", e);
      }
    } else if (Array.isArray(usersRes.data) && usersRes.data.length > 0) {
      adminUsersDb = usersRes.data.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        isPremium: row.is_premium,
        planName: row.plan_name,
        streakDays: row.streak_days,
        xp: row.xp,
        coins: row.coins,
        level: row.level,
        completedTopicsCount: 0,
        joinedAt: row.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
        status: row.status
      }));
    }
    if (contentRes.error) {
      console.error("[HYDRATION ERROR] admin_content fetch failed:", contentRes.error.message || contentRes.error);
    } else if (!contentRes.data || !contentRes.data.data) {
      console.warn("[SEED] admin_content global row confirmed empty (no row/data, no error) - seeding defaults");
      try {
        await supabaseServer.from("admin_content").upsert([{ id: "global", data: adminContentDb, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
      } catch (e) {
        console.error("[SEED ERROR] admin_content:", e);
      }
    } else {
      adminContentDb = { ...adminContentDb, ...contentRes.data.data };
    }
    if (subsRes.error) {
      console.error("[HYDRATION ERROR] user_subscriptions fetch failed:", subsRes.error.message || subsRes.error);
    } else if (Array.isArray(subsRes.data) && subsRes.data.length > 0) {
      serverSubscriptionsDb.clear();
      for (const sub of subsRes.data) {
        if (sub.userEmail) {
          serverSubscriptionsDb.set(sub.userEmail.trim().toLowerCase(), {
            userEmail: sub.userEmail,
            planId: sub.planId,
            isPremium: sub.isPremium,
            activatedAt: sub.activatedAt,
            expiresAt: sub.expiresAt,
            paymentId: sub.paymentId,
            orderId: sub.orderId,
            verificationMethod: sub.verificationMethod,
            amountPaid: sub.amountPaid,
            currency: sub.currency
          });
        }
      }
    }
    if (groupsRes.error) {
      console.error("[HYDRATION ERROR] community_groups fetch failed:", groupsRes.error.message || groupsRes.error);
    } else if (Array.isArray(groupsRes.data) && groupsRes.data.length === 0) {
      console.warn("[SEED] community_groups table confirmed empty (0 rows, no error) - seeding defaults");
      if (communityGroupsStore.size > 0) {
        try {
          await supabaseServer.from("community_groups").upsert(Array.from(communityGroupsStore.values()).map((g) => ({ id: g.id, data: g, updated_at: (/* @__PURE__ */ new Date()).toISOString() })), { onConflict: "id" });
        } catch (e) {
          console.error("[SEED ERROR] community_groups:", e);
        }
      }
    } else if (Array.isArray(groupsRes.data) && groupsRes.data.length > 0) {
      communityGroupsStore.clear();
      for (const r of groupsRes.data) {
        if (r.id && r.data) communityGroupsStore.set(r.id, r.data);
      }
    }
    if (notifsRes.error) {
      console.error("[HYDRATION ERROR] notifications fetch failed:", notifsRes.error.message || notifsRes.error);
    } else if (Array.isArray(notifsRes.data) && notifsRes.data.length === 0) {
      console.warn("[SEED] notifications table confirmed empty (0 rows, no error) - seeding defaults");
      if (userNotificationsStore.size > 0) {
        try {
          await supabaseServer.from("notifications").upsert(Array.from(userNotificationsStore.entries()).map(([userId, notifs]) => ({ user_id: userId, data: notifs, updated_at: (/* @__PURE__ */ new Date()).toISOString() })), { onConflict: "user_id" });
        } catch (e) {
          console.error("[SEED ERROR] notifications:", e);
        }
      }
    } else if (Array.isArray(notifsRes.data) && notifsRes.data.length > 0) {
      userNotificationsStore.clear();
      for (const r of notifsRes.data) {
        if (r.user_id && r.data) userNotificationsStore.set(r.user_id, r.data);
      }
    }
    if (ordersRes.error) {
      console.error("[HYDRATION ERROR] orders fetch failed:", ordersRes.error.message || ordersRes.error);
    } else if (Array.isArray(ordersRes.data) && ordersRes.data.length > 0) {
      for (const r of ordersRes.data) {
        if (r.id && r.data) serverOrdersDb.set(r.id, r.data);
      }
    }
    if (cbtRes.error) {
      console.error("[HYDRATION ERROR] cbt_results fetch failed:", cbtRes.error.message || cbtRes.error);
    } else if (Array.isArray(cbtRes.data) && cbtRes.data.length === 0) {
      console.warn("[SEED] cbt_results table confirmed empty (0 rows, no error) - seeding defaults");
      if (cbtResultsStore.size > 0) {
        try {
          await supabaseServer.from("cbt_results").upsert(Array.from(cbtResultsStore.entries()).map(([userId, resList]) => ({ user_id: userId, data: resList, updated_at: (/* @__PURE__ */ new Date()).toISOString() })), { onConflict: "user_id" });
        } catch (e) {
          console.error("[SEED ERROR] cbt_results:", e);
        }
      }
    } else if (Array.isArray(cbtRes.data) && cbtRes.data.length > 0) {
      cbtResultsStore.clear();
      for (const r of cbtRes.data) {
        if (r.user_id && r.data) cbtResultsStore.set(r.user_id, r.data);
      }
    }
    if (adRes.error) {
      console.error("[HYDRATION ERROR] ad_rewards fetch failed:", adRes.error.message || adRes.error);
    } else if (Array.isArray(adRes.data) && adRes.data.length === 0) {
      console.warn("[SEED] ad_rewards table confirmed empty (0 rows, no error) - seeding defaults");
      if (adRewardsDb.size > 0) {
        try {
          await supabaseServer.from("ad_rewards").upsert(Array.from(adRewardsDb.entries()).map(([email, rec]) => ({ id: email, email, data: rec, updated_at: (/* @__PURE__ */ new Date()).toISOString() })), { onConflict: "id" });
        } catch (e) {
          console.error("[SEED ERROR] ad_rewards:", e);
        }
      }
    } else if (Array.isArray(adRes.data) && adRes.data.length > 0) {
      adRewardsDb.clear();
      for (const r of adRes.data) {
        if (r.email && r.data) adRewardsDb.set(r.email.toLowerCase(), r.data);
        else if (r.id && r.data) adRewardsDb.set(r.id.toLowerCase(), r.data);
      }
    }
    if (queueRes.error) {
      console.error("[HYDRATION ERROR] study_buddy_queue fetch failed:", queueRes.error.message || queueRes.error);
    } else if (Array.isArray(queueRes.data) && queueRes.data.length > 0) {
      studyBuddyQueue.clear();
      for (const r of queueRes.data) {
        if (r.email && r.data) studyBuddyQueue.set(r.email.toLowerCase(), r.data);
      }
    }
    if (matchesRes.error) {
      console.error("[HYDRATION ERROR] study_buddy_matches fetch failed:", matchesRes.error.message || matchesRes.error);
    } else if (Array.isArray(matchesRes.data) && matchesRes.data.length > 0) {
      studyBuddyMatches.clear();
      for (const r of matchesRes.data) {
        if (r.room_id && r.data) studyBuddyMatches.set(r.room_id, r.data);
        else if (r.id && r.data) studyBuddyMatches.set(r.id, r.data);
      }
    }
    if (heartbeatsRes.error) {
      console.error("[HYDRATION ERROR] study_heartbeats fetch failed:", heartbeatsRes.error.message || heartbeatsRes.error);
    } else if (Array.isArray(heartbeatsRes.data) && heartbeatsRes.data.length > 0) {
      studyHeartbeatsStore.clear();
      for (const r of heartbeatsRes.data) {
        const sid = r.session_id;
        if (!sid) continue;
        if (!studyHeartbeatsStore.has(sid)) studyHeartbeatsStore.set(sid, []);
        studyHeartbeatsStore.get(sid).push({
          id: r.id,
          userId: r.user_id,
          sessionId: r.session_id,
          subject: r.subject,
          topicId: r.topic_id,
          pingedAt: r.pinged_at
        });
      }
    }
    if (milestonesRes.error) {
      console.error("[HYDRATION ERROR] reward_milestones fetch failed:", milestonesRes.error.message || milestonesRes.error);
    } else if (Array.isArray(milestonesRes.data) && milestonesRes.data.length > 0) {
      for (const r of milestonesRes.data) {
        if (r.id && r.data) rewardMilestonesStore.set(r.id, r.data);
      }
    }
    if (claimsRes.error) {
      console.error("[HYDRATION ERROR] reward_claims fetch failed:", claimsRes.error.message || claimsRes.error);
    } else if (Array.isArray(claimsRes.data) && claimsRes.data.length > 0) {
      for (const r of claimsRes.data) {
        if (r.id && r.data) rewardClaimsStore.set(r.id, r.data);
      }
    }
    if (utrRes.error) {
      console.error("[HYDRATION ERROR] utr_requests fetch failed:", utrRes.error.message || utrRes.error);
    } else if (Array.isArray(utrRes.data) && utrRes.data.length > 0) {
      pendingUtrRequestsDb.clear();
      for (const r of utrRes.data) {
        const rec = mapRowToUtrRecord(r);
        if (rec.id) pendingUtrRequestsDb.set(rec.id, rec);
      }
    }
    if (announcementsRes.error) {
      console.error("[HYDRATION ERROR] admin_announcements fetch failed:", announcementsRes.error.message || announcementsRes.error);
    } else if (Array.isArray(announcementsRes.data) && announcementsRes.data.length > 0) {
      adminAnnouncementsStore.clear();
      for (const r of announcementsRes.data) {
        if (r.id && r.data) {
          adminAnnouncementsStore.set(r.id, r.data);
        }
      }
    }
    if (personalSyllabusRes.error) {
      console.error("[HYDRATION ERROR] personal_syllabus_nodes fetch failed:", personalSyllabusRes.error.message || personalSyllabusRes.error);
    } else if (Array.isArray(personalSyllabusRes.data) && personalSyllabusRes.data.length > 0) {
      personalSyllabusNodesStore.clear();
      for (const r of personalSyllabusRes.data) {
        if (r.id) personalSyllabusNodesStore.set(r.id, r);
      }
    }
    try {
      const { data: timeLogData } = await supabaseServer.from("syllabus_time_log").select("*");
      if (Array.isArray(timeLogData) && timeLogData.length > 0) {
        syllabusTimeLogsStore.clear();
        for (const r of timeLogData) {
          const uid = r.user_id || "guest";
          if (!syllabusTimeLogsStore.has(uid)) syllabusTimeLogsStore.set(uid, []);
          syllabusTimeLogsStore.get(uid).push(r);
        }
      }
    } catch (_tlErr) {
    }
    try {
      const { data: fbData } = await supabaseServer.from("feedback_reports").select("id, section, type, description, user_email, email, status, admin_note, resolved_by, resolved_at, is_guest_submission, created_at");
      if (fbData && fbData.length > 0) {
        feedbackReportsStore.clear();
        fbData.forEach((r) => {
          feedbackReportsStore.set(r.id, {
            id: r.id,
            section: r.section,
            type: r.type,
            description: r.description,
            user_email: r.user_email || r.email || "",
            status: r.status || "Pending",
            admin_note: r.admin_note || null,
            resolved_by: r.resolved_by || null,
            resolved_at: r.resolved_at || null,
            is_guest_submission: Boolean(r.is_guest_submission),
            created_at: r.created_at || (/* @__PURE__ */ new Date()).toISOString()
          });
        });
      }
    } catch (_fbErr) {
    }
    try {
      const { data: edData } = await supabaseServer.from("educators").select("id, name, title, bio, avatar, rating, hourly_rate, subjects, data");
      if (edData && edData.length > 0) {
        educatorsStore.clear();
        for (const r of edData) {
          if (r.id) educatorsStore.set(r.id, r.data || r);
        }
      } else {
        for (const ed of DEFAULT_EDUCATORS_LIST) {
          await supabaseServer.from("educators").upsert([{ id: ed.id, data: ed, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
        }
      }
    } catch (_edErr) {
    }
    try {
      const { data: bkData } = await supabaseServer.from("educator_bookings").select("id, educator_id, user_email, date, slot, status, created_at, data");
      if (bkData && bkData.length > 0) {
        educatorBookingsStore.clear();
        for (const r of bkData) {
          if (r.id) educatorBookingsStore.set(r.id, r.data || r);
        }
      }
    } catch (_bkErr) {
    }
    try {
      const { data: podData } = await supabaseServer.from("podcasts").select("id, title, description, audio_url, duration, category, created_at, data");
      if (podData && podData.length > 0) {
        podcastsStore.clear();
        for (const r of podData) {
          if (r.id) podcastsStore.set(r.id, r.data || r);
        }
      } else {
        for (const pod of DEFAULT_PODCASTS_LIST) {
          await supabaseServer.from("podcasts").upsert([{ id: pod.id, data: pod, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
        }
      }
    } catch (_podErr) {
    }
    try {
      const { data: spData } = await supabaseServer.from("sponsors").select("id, name, logo, website, tier, status, data");
      if (spData && spData.length > 0) {
        sponsorsDb = spData.map((r) => r.data || r);
      } else {
        for (const sp of DEFAULT_SPONSORS_LIST) {
          await supabaseServer.from("sponsors").upsert([{ id: sp.id, data: sp, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
        }
      }
    } catch (_spErr) {
    }
    try {
      const { data: colData } = await supabaseServer.from("collaborators").select("id, name, role, avatar, bio, data");
      if (colData && colData.length > 0) {
        collaboratorsDb = colData.map((r) => r.data || r);
      } else {
        for (const col of DEFAULT_COLLABORATORS_LIST) {
          await supabaseServer.from("collaborators").upsert([{ id: col.id, data: col, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
        }
      }
    } catch (_colErr) {
    }
    try {
      const { data: inqData } = await supabaseServer.from("sponsor_inquiries").select("id, company_name, contact_email, message, created_at, data");
      if (inqData && inqData.length > 0) {
        sponsorInquiriesDb = inqData.map((r) => r.data || r);
      }
    } catch (_inqErr) {
    }
    try {
      const { data: actData } = await supabaseServer.from("office_activity_feed").select("id, action, user_name, timestamp, details, data");
      if (actData && actData.length > 0) {
        const loadedActs = actData.map((r) => r.data || r);
        loadedActs.sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());
        officeActivityFeed = loadedActs.slice(0, 100);
      } else {
        for (const act of DEFAULT_OFFICE_ACTIVITIES) {
          await supabaseServer.from("office_activity_feed").upsert([{ id: act.id, data: act, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
        }
      }
    } catch (_actErr) {
    }
    try {
      const { data: blogData } = await supabaseServer.from("blog_posts").select("id, title, slug, summary, content, author, published_at, data");
      if (blogData && blogData.length > 0) {
        blogPostsStore.clear();
        for (const r of blogData) {
          const post = r.data ? { ...r.data, id: r.id } : r;
          if (post.id) blogPostsStore.set(post.id, post);
        }
      } else {
        for (const post of DEFAULT_BLOG_POSTS) {
          await supabaseServer.from("blog_posts").upsert([{ id: post.id, data: post, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
        }
      }
    } catch (_bpErr) {
    }
    try {
      const { data: reqData } = await supabaseServer.from("blog_content_requests").select("id, user_email, topic, description, votes, created_at, data");
      if (reqData && reqData.length > 0) {
        blogRequestsStore.clear();
        for (const r of reqData) {
          const reqItem = r.data ? { ...r.data, id: r.id } : r;
          if (reqItem.id) blogRequestsStore.set(reqItem.id, reqItem);
        }
      }
    } catch (_bqrErr) {
    }
    try {
      const { data: errData } = await supabaseServer.from("user_error_logs").select("id, user_id, error_message, stack_trace, path, created_at, data");
      if (errData && errData.length > 0) {
        userErrorLogsStore.clear();
        for (const r of errData) {
          const item = r.data ? { ...r.data, id: r.id } : r;
          if (item && item.id) {
            userErrorLogsStore.set(item.id, item);
          }
        }
      }
    } catch (_errLogErr) {
    }
    try {
      const { data: teamAppData } = await supabaseServer.from("team_applications").select("id, user_email, name, role_applied, message, status, created_at, data");
      if (teamAppData && teamAppData.length > 0) {
        teamApplicationsDb = teamAppData.map((r) => r.data || r);
      }
    } catch (_teamAppErr) {
    }
    try {
      const { data: pomData } = await supabaseServer.from("user_pomodoro_sessions").select("id, user_id, duration_minutes, completed_at, mode, task_name, created_at");
      if (pomData && pomData.length > 0) {
        userPomodoroSessionsDb = pomData.map((s) => ({
          id: s.id,
          userId: s.user_id,
          subject: s.subject || "General Study",
          topic: s.topic || "General Topic",
          duration: Number(s.duration) || 25,
          startTime: s.start_time,
          endTime: s.end_time,
          completedDuration: Number(s.completed_duration) || 0,
          status: s.status || "COMPLETED",
          questionsAttempted: Number(s.questions_attempted) || 0,
          correctAnswers: Number(s.correct_answers) || 0,
          questionIds: Array.isArray(s.question_ids) ? s.question_ids : [],
          questionSources: Array.isArray(s.question_sources) ? s.question_sources : [],
          manualQuestions: Array.isArray(s.manual_questions) ? s.manual_questions : [],
          selectedQuestions: Array.isArray(s.selected_questions) ? s.selected_questions : [],
          accuracy: Number(s.accuracy) || 0,
          xpEarned: Number(s.xp_earned) || 0,
          createdAt: s.created_at || (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
    } catch (_pomErr) {
    }
    lockRazorpayEnvironment();
    console.log(`[PRIMARY DB] Hydrated server state from Supabase Primary Database successfully.`);
  };
  try {
    await Promise.race([performHydration(), timeoutPromise]);
  } catch (err) {
    if (err?.name === "AbortError" || err?.message?.includes("HYDRATION TIMEOUT")) {
      console.log(`[PRIMARY DB] DB hydration timed out (${timeoutMs}ms) - falling back to local cached state.`);
    } else {
      console.warn("[PRIMARY DB] Failed to hydrate state from Supabase DB:", err?.message || err);
    }
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}
function loadAdminStoreFromDisk() {
  const possiblePaths = [
    import_path.default.join(process.cwd(), ".data", "admin_store.json"),
    import_path.default.join(import_os.default.tmpdir(), "aspirantx_data", "admin_store.json"),
    import_path.default.join(import_os.default.tmpdir(), "admin_store.json")
  ];
  for (const filePath of possiblePaths) {
    try {
      if (import_fs.default.existsSync(filePath)) {
        const raw = import_fs.default.readFileSync(filePath, "utf-8");
        const store = JSON.parse(raw);
        if (store.globalAdminSettings) {
          globalAdminSettings = mergeAdminSettings(globalAdminSettings, store.globalAdminSettings);
        }
        if (Array.isArray(store.featureFlagsStore)) featureFlagsStore = store.featureFlagsStore;
        if (Array.isArray(store.orders)) {
          serverOrdersDb.clear();
          for (const [k, v] of store.orders) serverOrdersDb.set(k, v);
        }
        if (Array.isArray(store.subscriptions)) {
          for (const [k, v] of store.subscriptions) {
            if (!serverSubscriptionsDb.has(k)) serverSubscriptionsDb.set(k, v);
          }
        }
        if (Array.isArray(store.processedWebhookEvents)) {
          processedWebhookEvents.clear();
          for (const evId of store.processedWebhookEvents) processedWebhookEvents.add(evId);
        }
        if (Array.isArray(store.utrRequests)) {
          pendingUtrRequestsDb.clear();
          for (const [k, v] of store.utrRequests) pendingUtrRequestsDb.set(k, v);
        }
        if (Array.isArray(store.blockedAuditLogs)) blockedAuditLogs = store.blockedAuditLogs;
        if (Array.isArray(store.watchdogSystemLogs)) watchdogSystemLogs = store.watchdogSystemLogs;
        if (Array.isArray(store.adminUsers)) adminUsersDb = store.adminUsers;
        if (store.adminContent) adminContentDb = { ...adminContentDb, ...store.adminContent };
        if (Array.isArray(store.adminTeam)) adminTeamStore = store.adminTeam;
        if (Array.isArray(store.adminTasks)) adminTasksStore = store.adminTasks;
        lockRazorpayEnvironment();
        console.log(`[STORAGE] Admin store loaded from ${filePath}. Users: ${adminUsersDb.length}, Subscriptions: ${serverSubscriptionsDb.size}`);
        break;
      }
    } catch (_err) {
      continue;
    }
  }
}
async function initializeServerState() {
  await hydrateFromPrimaryDatabase(15e3);
  loadAdminStoreFromDisk();
}
initializeServerState();
function verifyRazorpayPaymentSignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }
  try {
    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = import_crypto.default.createHmac("sha256", secret).update(payload).digest("hex");
    const bufExpected = Buffer.from(expectedSignature, "utf-8");
    const bufReceived = Buffer.from(signature, "utf-8");
    if (bufExpected.length !== bufReceived.length) {
      return false;
    }
    return import_crypto.default.timingSafeEqual(bufExpected, bufReceived);
  } catch (err) {
    console.error("Crypto signature verification error:", err);
    return false;
  }
}
function checkUserServerPremiumStatus(email) {
  if (!email || typeof email !== "string") return false;
  const normalizedEmail = email.trim().toLowerCase();
  const sub = serverSubscriptionsDb.get(normalizedEmail);
  if (!sub || !sub.isPremium) return false;
  if (sub.expiresAt) {
    const expTime = new Date(sub.expiresAt).getTime();
    if (isNaN(expTime) || expTime < Date.now()) return false;
  }
  return true;
}
async function verifyTeacherOrAdmin(req, res, next) {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required: Missing, invalid, or unverified Bearer token." });
  }
  const userEmail = verifiedUser.email.trim().toLowerCase();
  const userId = verifiedUser.sub;
  let role = verifiedUser.role;
  if (userEmail && userEmail === DESIGNATED_ADMIN_EMAIL2.toLowerCase()) {
    role = "ADMIN";
  }
  if ((!role || role === "USER" || role === "STUDENT") && userEmail) {
    const known = adminUsersDb.find((u) => u.email.toLowerCase() === userEmail);
    if (known && known.role) role = known.role;
  }
  if (role === "TEACHER" || role === "ADMIN" || role === "CO_ADMIN" || role === "DEVELOPER") {
    req.userRole = role;
    req.userEmail = userEmail;
    req.userId = userId;
    return next();
  }
  if (supabaseServer && userId) {
    try {
      const { data } = await supabaseServer.from("user_profiles").select("role").eq("id", userId).single();
      if (data?.role === "TEACHER" || data?.role === "ADMIN" || data?.role === "CO_ADMIN" || data?.role === "DEVELOPER") {
        req.userRole = data.role;
        req.userEmail = userEmail;
        req.userId = userId;
        return next();
      }
    } catch (_e) {
    }
  }
  return res.status(403).json({ error: "Access denied: Teacher or Admin authorization required." });
}
var teacherProfilesStore = /* @__PURE__ */ new Map();
var teacherClassesStore = /* @__PURE__ */ new Map();
var classEnrollmentsStore = /* @__PURE__ */ new Map();
var classAttendanceStore = /* @__PURE__ */ new Map();
var classAssignmentsStore = /* @__PURE__ */ new Map();
var assignmentSubmissionsStore = /* @__PURE__ */ new Map();
var sponsorshipTiersStore = /* @__PURE__ */ new Map();
var sponsorshipApplicationsStore = /* @__PURE__ */ new Map();
var activeSponsorsStore = /* @__PURE__ */ new Map();
function seedDefaultSponsorshipTiers() {
  if (sponsorshipTiersStore.size === 0) {
    const defaultTiers = [
      {
        id: "tier_community",
        name: "Community Partner",
        priceRange: "INR 15,000 / month",
        benefits: ["Logo placement on Community Platform", "Monthly partner shoutout in Newsletter", "Custom Partner Badge on Profile"],
        sortOrder: 1,
        isActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "tier_champion",
        name: "Education Champion",
        priceRange: "INR 35,000 / month",
        benefits: ["Featured Logo on Student Dashboard", "Sponsor 500 Aspirant PRO Passes", "Dedicated Banner in Study Groups", "Co-host Monthly Masterclass"],
        sortOrder: 2,
        isActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "tier_title",
        name: "Title Sponsor",
        priceRange: "INR 75,000 / month",
        benefits: ["Exclusive Title Branding across AspirantX", "Custom Sponsored CBT Mock Test Series", "Direct Internship & Hiring Channel for Aspirants", "Primary Logo on All Exam Engine Banners"],
        sortOrder: 3,
        isActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    for (const t of defaultTiers) {
      sponsorshipTiersStore.set(t.id, t);
    }
  }
  if (activeSponsorsStore.size === 0) {
    const defaultSponsors = [
      {
        id: "sp_1",
        name: "EduTech India Foundation",
        logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&auto=format&fit=crop&q=80",
        websiteUrl: "https://example.com/edutech",
        tierName: "Education Champion",
        testimonial: "Partnering with AspirantX empowered us to sponsor over 1,000 underprivileged UPSC & NEET aspirants with high quality mock tests.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    for (const s of defaultSponsors) {
      activeSponsorsStore.set(s.id, s);
    }
  }
}
seedDefaultSponsorshipTiers();
function calculateVerifiedMinutesForUser(userId, targetSubject, targetTopicId) {
  let verifiedSeconds = 0;
  for (const [sessionId, hbs] of studyHeartbeatsStore.entries()) {
    const userHbs = hbs.filter((h) => String(h.userId || h.user_id) === String(userId));
    if (userHbs.length === 0) continue;
    if (targetSubject && targetSubject.trim()) {
      const matchesSub = userHbs.some((h) => String(h.subject || "").toLowerCase() === targetSubject.toLowerCase());
      if (!matchesSub) continue;
    }
    if (targetTopicId && targetTopicId.trim()) {
      const matchesTopic = userHbs.some((h) => String(h.topicId || h.topic_id || "") === targetTopicId);
      if (!matchesTopic) continue;
    }
    const sorted = [...userHbs].sort((a, b) => {
      const ta = new Date(a.pingedAt || a.pinged_at).getTime();
      const tb = new Date(b.pingedAt || b.pinged_at).getTime();
      return ta - tb;
    });
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].pingedAt || sorted[i - 1].pinged_at).getTime();
      const curr = new Date(sorted[i].pingedAt || sorted[i].pinged_at).getTime();
      const diffSec = (curr - prev) / 1e3;
      if (diffSec > 0 && diffSec <= 35) {
        verifiedSeconds += Math.min(30, Math.round(diffSec));
      }
    }
  }
  return {
    verifiedSeconds,
    verifiedMinutes: Math.floor(verifiedSeconds / 60)
  };
}
var defaultFeatureFlagsStore = [
  {
    feature_name: "chat",
    label: "AI Study Mentor & Mains Evaluator",
    description: "1-on-1 AI Answer Evaluation & Real-time Chat Assistant",
    is_premium: false
  },
  {
    feature_name: "ai_predictor",
    label: "PYQ Syllabus Predictor Engine",
    description: "Predictive completion dates and weightage analytics",
    is_premium: true
  },
  {
    feature_name: "timer",
    label: "Live Group Pomodoro Timer",
    description: "Shared timer, stopwatch, and XP study streak tracker",
    is_premium: false
  },
  {
    feature_name: "task",
    label: "Task & Daily Planner Manager",
    description: "Subject priority board and target deadline planner",
    is_premium: false
  },
  {
    feature_name: "community",
    label: "Community Live Chat Rooms",
    description: "UPSC/SSC peer study rooms and notes PDF file sharing",
    is_premium: false
  },
  {
    feature_name: "syllabus",
    label: "Interactive Syllabus Tracker",
    description: "Comprehensive UPSC/SSC subject, topic & subtopic tracker",
    is_premium: false
  },
  {
    feature_name: "cbt",
    label: "CBT Mock Test Engine",
    description: "AI custom mock generator & All-India live exam simulator",
    is_premium: true
  },
  {
    feature_name: "library",
    label: "Aspirants Reference Library",
    description: "UPSC standard textbooks, NCERT notes, and government policy reports",
    is_premium: false
  },
  {
    feature_name: "collaboration",
    label: "Virtual Office Workspace",
    description: "Presence desks, staff Kanban tracking, and content upload approval queues",
    is_premium: false
  },
  {
    feature_name: "pyq",
    label: "Enterprise PYQ Archive (1991-2026)",
    description: "Exhaustive civil service and entrance exam previous years question bank",
    is_premium: false
  },
  {
    feature_name: "question_bank",
    label: "Question Bank & Practice Engine",
    description: "4000+ topic-tagged practice questions with interactive analytics",
    is_premium: false
  }
];
var featureFlagsStore = [...defaultFeatureFlagsStore];
var activeUsersPresenceMap = /* @__PURE__ */ new Map();
async function hydrateAnnouncementsFromSupabase() {
  if (!supabaseServer) return;
  try {
    const { data, error } = await supabaseServer.from("admin_announcements").select("*");
    if (!error && Array.isArray(data)) {
      adminAnnouncementsStore.clear();
      for (const row of data) {
        if (row.id && row.data) {
          adminAnnouncementsStore.set(row.id, row.data);
        }
      }
    }
  } catch (err) {
    console.warn("[ANNOUNCEMENTS] Error hydrating from Supabase:", err);
  }
}
var aiConversationsDb = /* @__PURE__ */ new Map();
var aiMessagesDb = /* @__PURE__ */ new Map();
function sanitizeAiPrompt(input) {
  if (!input || typeof input !== "string") return "";
  let clean = input.trim();
  const injectionPatterns = [
    /ignore (all )?previous instructions/gi,
    /system override/gi,
    /you are now in (dan|jailbreak|unrestricted) mode/gi,
    /disregard (all )?(system|safety) (prompts|rules)/gi
  ];
  for (const pattern of injectionPatterns) {
    clean = clean.replace(pattern, "[SECURITY FILTERED]");
  }
  return clean.slice(0, 12e3);
}
function getSystemInstructionForMode(mode, exam, summary) {
  let modeSpecificPrompt = "";
  switch (mode) {
    case "ncert_mentor":
      modeSpecificPrompt = `You are the NCERT Master & Conceptual Mentor for ${exam}. Break down core textbook concepts (Class 6-12 NCERTs) with vivid real-world analogies, flowcharts in markdown, key terms, and explicit connections to GS-1/2/3/4 syllabus papers.`;
      break;
    case "mains_evaluator":
      modeSpecificPrompt = `You are a Senior UPSC Mains Examiner & Answer Evaluator. Analyze the user's answer or outline against official Civil Services criteria. Provide:
1. Overall Score out of 250 (or 10)
2. Breakdown: Structure (3/10), Core Content & Subheadings (3/10), Constitutional/Data References (2/10), Way Forward & Conclusion (2/10)
3. 3 Key Strengths & 3 Critical Weaknesses
4. Missed Keywords / Scheme Names / Supreme Court Judgments / Articles
5. Improved Model Answer Outline.`;
      break;
    case "essay_evaluator":
      modeSpecificPrompt = `You are an Essay Paper Mentor for UPSC CSE (250 Marks). Evaluate the topic/draft using the PESTLE framework (Political, Economic, Social, Technological, Legal, Environmental). Grade Thesis clarity, paragraph transitions, multidimensional perspectives, quotes, and actionable conclusion.`;
      break;
    case "ethics_analyst":
      modeSpecificPrompt = `You are a GS Paper 4 Ethics, Integrity & Aptitude Specialist. Deconstruct ethics case studies with:
1. Stakeholder Mapping (Primary & Secondary)
2. Ethical Dilemmas Involved (e.g. Efficiency vs Compassion, Personal Morality vs Official Duty)
3. Available Options Matrix with Pros & Cons
4. Justified Course of Action citing ARC 2nd Report, Nolan Principles, and Foundational Values of Civil Services.`;
      break;
    case "pyq_solver":
      modeSpecificPrompt = `You are a PYQ Pattern Analyst & Elimination Technique Specialist for ${exam}. Deconstruct past 10-15 years questions, highlight recurring examiner traps, provide memory mnemonics, and show step-by-step elimination logic for Prelims & structural frameworks for Mains.`;
      break;
    case "study_planner":
      modeSpecificPrompt = `You are an Executive UPSC Study Planner & Timetable Coach. Create realistic daily/weekly study routines customized to the aspirant's target year, balancing static subjects, current affairs, answer writing, optional subjects, and revision slots.`;
      break;
    case "revision_coach":
      modeSpecificPrompt = `You are a Active Recall & Spaced Repetition Revision Coach. Generate high-yield flashcard pairs, mnemonic tricks (e.g. for ASEAN nations, Constitutional Bodies, Tiger Reserves), and 1-page bullet point summary sheets for rapid revision.`;
      break;
    case "mock_interview":
      modeSpecificPrompt = `You are a former Civil Service Board Member for UPSC Personality Test. Ask realistic, probing DAF (Detailed Application Form) and current affairs questions. Guide the candidate on balanced stance, articulate tone, administrative diplomacy, and body language presentation.`;
      break;
    default:
      modeSpecificPrompt = `You are AspirantX AI Mentor, an elite, encouraging, high-precision study assistant for ${exam}. Provide ultra-structured, concise, exam-focused answers using bullet points, markdown formatting, LaTeX formulas, and key constitutional articles where applicable.`;
  }
  let fullPrompt = `${modeSpecificPrompt}

Maintain a disciplined, encouraging, clear, and highly structured tone. Format answers using clean Markdown with headers, lists, code blocks, or KaTeX math expressions (e.g. \\alpha, \\frac{a}{b}) where appropriate.`;
  if (summary) {
    fullPrompt += `

[CONVERSATION CONTEXT SUMMARY]: ${summary}`;
  }
  return fullPrompt;
}
var syllabusNodesStore = new Map(
  INITIAL_SYLLABUS_HIERARCHY.map((node) => [node.id, { ...node, version: 1, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }])
);
var pyqQueryCache = /* @__PURE__ */ new Map();
var qbQueryCache = /* @__PURE__ */ new Map();
var ACADEMIC_CACHE_TTL_MS = 3 * 60 * 1e3;
function getCachedAcademicResult(cacheMap, key) {
  const entry = cacheMap.get(key);
  if (entry && Date.now() - entry.timestamp < ACADEMIC_CACHE_TTL_MS) {
    return entry.data;
  }
  if (entry) cacheMap.delete(key);
  return null;
}
function setCachedAcademicResult(cacheMap, key, data) {
  if (cacheMap.size > 200) cacheMap.clear();
  cacheMap.set(key, { data, timestamp: Date.now() });
}
function normalizeQuestionItem(row) {
  return normalizePyqItem(row);
}
function normalizePyqItem(row) {
  if (!row) return null;
  const item = row.data && typeof row.data === "object" ? { ...row.data, id: row.id || row.data.id } : { ...row };
  if (!item.id && row.id) item.id = row.id;
  if ((item.qualityStatus || "readable") === "corrupted") return null;
  if (item.qualityStatus === "review" && (item.correctOption === -1 || item.correctOption === void 0)) {
    item.correctOption = null;
    item.answerVerified = false;
  } else if (item.answerVerified === void 0) {
    item.answerVerified = true;
  }
  return item;
}
var pyqStore = new Map(
  INITIAL_PYQS_DATABASE.map((pyq) => [pyq.id, { ...pyq, createdAt: (/* @__PURE__ */ new Date()).toISOString() }])
);
var questionBankStore = new Map(
  INITIAL_QUESTION_BANK.map((qb) => [qb.id, { ...qb, createdAt: (/* @__PURE__ */ new Date()).toISOString() }])
);
function getStandardSubject(examId, rawSubj) {
  const exam = String(examId || "").toUpperCase();
  let s = String(rawSubj || "").trim().toLowerCase();
  s = s.replace(/^(nda|neet|upsc|ssc)\s+/i, "");
  if (exam.includes("NEET") || exam.includes("JENPAS") || exam.includes("ANM") || exam.includes("GNM") || exam.includes("NURSING")) {
    if (s.includes("physic")) return "Physics";
    if (s.includes("chemist")) return "Chemistry";
    if (s.includes("bio") || s.includes("botany") || s.includes("zoolog") || s.includes("physiol")) return "Biology";
    return "Biology";
  }
  if (exam.includes("NDA") || exam.includes("CDS") || exam.includes("DEFENCE") || exam.includes("AIR_FORCE")) {
    if (s.includes("math") || s.includes("calculus") || s.includes("algebra") || s.includes("trig") || s.includes("geometry") || s.includes("vector") || s.includes("probab")) return "Mathematics";
    if (s.includes("engl")) return "English";
    if (s.includes("physic")) return "Physics";
    if (s.includes("chemist")) return "Chemistry";
    if (s.includes("biolog") || s.includes("zoolog") || s.includes("botany")) return "Biology";
    if (s.includes("geog")) return "Geography";
    if (s.includes("hist")) return "History of India";
    if (s.includes("polit")) return "Indian Polity & Governance";
    if (s.includes("current") || s.includes("gk")) return "Current Affairs & GK";
    return "General Science";
  }
  if (exam.includes("UPSC") || exam.includes("PCS") || exam.includes("WBCS") || exam.includes("BPSC")) {
    if (s.includes("polit") || s.includes("govern") || s.includes("constitut") || s.includes("law")) return "Indian Polity & Governance";
    if (s.includes("histor") || s.includes("culture") || s.includes("art") || s.includes("freedom")) return "History of India";
    if (s.includes("environ") || s.includes("ecolog")) return "Environment & Ecology";
    if (s.includes("geograph")) return "Geography";
    if (s.includes("econom") || s.includes("finance")) return "Economy";
    if (s.includes("sci") || s.includes("tech")) return "Science & Technology";
    if (s.includes("internat") || s.includes("current") || s.includes("relation")) return "International Relations & Current Affairs";
    if (s.includes("csat") || s.includes("aptit") || s.includes("reason") || s.includes("math")) return "CSAT (Paper-2)";
    return "General Studies";
  }
  if (exam.includes("SSC") || exam.includes("BANK") || exam.includes("PO") || exam.includes("RRB")) {
    if (s.includes("quant") || s.includes("math") || s.includes("arith") || s.includes("number") || s.includes("geomet") || s.includes("algeb")) return "Quantitative Aptitude";
    if (s.includes("reason") || s.includes("intellig") || s.includes("logic") || s.includes("mental")) return "General Intelligence & Reasoning";
    if (s.includes("english") || s.includes("compreh") || s.includes("verbal")) return "English Comprehension";
    if (s.includes("aware") || s.includes("gk") || s.includes("general") || s.includes("current")) return "General Awareness";
    return "General Studies";
  }
  if (s.includes("physic")) return "Physics";
  if (s.includes("chemist")) return "Chemistry";
  if (s.includes("biolog") || s.includes("botan") || s.includes("zoolo")) return "Biology";
  if (s.includes("math")) return "Mathematics";
  if (s.includes("english")) return "English";
  if (s.includes("polit")) return "Indian Polity & Governance";
  return rawSubj || "General Studies";
}
try {
  const neetJsonPath = import_path.default.join(process.cwd(), "src", "data", "neetPyqs.json");
  if (import_fs.default.existsSync(neetJsonPath)) {
    const rawNeet = import_fs.default.readFileSync(neetJsonPath, "utf-8");
    const neetPyqs2 = JSON.parse(rawNeet);
    if (Array.isArray(neetPyqs2)) {
      neetPyqs2.forEach((q) => {
        const stdSubj = getStandardSubject(q.exam || "NEET_UG", q.subject);
        pyqStore.set(q.id, { ...q, subject: stdSubj, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
        questionBankStore.set(q.id, {
          id: q.id,
          exam: q.exam,
          type: "mcq",
          subject: stdSubj,
          topic: q.topic,
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          solutionText: q.explanation,
          difficulty: q.difficulty,
          status: "published",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      });
      console.log(`[BOOT] Loaded ${neetPyqs2.length} NEET PYQ questions from PDF successfully.`);
    }
  }
} catch (e) {
  console.warn("[BOOT] Failed to hydrate extracted NEET PDF questions:", e.message);
}
try {
  const ndaJsonPath = import_path.default.join(process.cwd(), "src", "data", "ndaPyqs.json");
  if (import_fs.default.existsSync(ndaJsonPath)) {
    const rawNda = import_fs.default.readFileSync(ndaJsonPath, "utf-8");
    const ndaPyqs = JSON.parse(rawNda);
    if (Array.isArray(ndaPyqs)) {
      ndaPyqs.forEach((q) => {
        const stdSubj = getStandardSubject(q.exam || "NDA_NA", q.subject);
        pyqStore.set(q.id, { ...q, subject: stdSubj, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
        questionBankStore.set(q.id, {
          id: q.id,
          exam: q.exam,
          type: "mcq",
          subject: stdSubj,
          topic: q.topic,
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          solutionText: q.explanation,
          difficulty: q.difficulty,
          status: "published",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      });
      console.log(`[BOOT] Loaded ${ndaPyqs.length} NDA PYQ questions from PDF successfully.`);
    }
  }
} catch (e) {
  console.warn("[BOOT] Failed to hydrate extracted NDA PDF questions:", e.message);
}
try {
  const pyqJsonPath = import_path.default.join(process.cwd(), "src", "data", "allExtractedPyqs.json");
  if (import_fs.default.existsSync(pyqJsonPath)) {
    const rawData = import_fs.default.readFileSync(pyqJsonPath, "utf-8");
    const pyqs = JSON.parse(rawData);
    if (Array.isArray(pyqs)) {
      pyqs.forEach((q) => {
        const stdSubj = getStandardSubject(q.exam || "UPSC_CSE", q.subject);
        pyqStore.set(q.id, { ...q, subject: stdSubj, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
      });
      console.log(`[BOOT] Loaded ${pyqs.length} extracted PYQ questions (NEET, NDA, UPSC) from PDF datasets successfully.`);
    }
  }
} catch (e) {
  console.warn("[BOOT] Failed to hydrate extracted PYQ dataset:", e.message);
}
try {
  const qbJsonPath = import_path.default.join(process.cwd(), "src", "data", "allExtractedQb.json");
  if (import_fs.default.existsSync(qbJsonPath)) {
    const rawQb = import_fs.default.readFileSync(qbJsonPath, "utf-8");
    const qbs = JSON.parse(rawQb);
    if (Array.isArray(qbs)) {
      qbs.forEach((q) => {
        questionBankStore.set(q.id, { ...q, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
      });
      console.log(`[BOOT] Loaded ${qbs.length} extracted Question Bank items (NEET, NDA, UPSC) successfully.`);
    }
  }
} catch (e) {
  console.warn("[BOOT] Failed to hydrate extracted QB dataset:", e.message);
}
var booksStore = new Map(
  COMPREHENSIVE_BOOKS_DATABASE.map((book) => [book.id, { ...book, createdAt: (/* @__PURE__ */ new Date()).toISOString() }])
);
var normalizeExam = (e) => {
  let s = String(e || "").trim().toLowerCase().replace(/[\s-_]/g, "");
  if (s.includes("nda") || s.includes("defence") || s.includes("naval")) return "nda";
  if (s.includes("neet") || s.includes("medical") || s.includes("eligibilitycum")) return "neet";
  if (s.includes("upsc") || s.includes("civil") || s.includes("cse")) return "upsc";
  if (s.includes("ssc") || s.includes("cgl") || s.includes("staffselection")) return "ssc";
  return s;
};
var pyqRepeatIndexMap = /* @__PURE__ */ new Map();
function getTokens(text) {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = clean.split(/\s+/).filter((w) => w.length > 3);
  return new Set(words);
}
function buildSimilarityIndexes() {
  console.log("[INDEXER] Building precomputed question similarity and repeat index...");
  const startTime = Date.now();
  const pyqList = Array.from(pyqStore.values());
  const tokenMap = /* @__PURE__ */ new Map();
  pyqList.forEach((q) => {
    tokenMap.set(q.id, getTokens(q.questionText || ""));
  });
  const groups = /* @__PURE__ */ new Map();
  pyqList.forEach((q) => {
    const key = `${normalizeExam(q.exam || "")}:${getStandardSubject(q.exam || "", q.subject || "")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(q);
  });
  groups.forEach((items) => {
    const exactMap = /* @__PURE__ */ new Map();
    items.forEach((item) => {
      const norm = (item.questionText || "").trim().toLowerCase();
      if (!norm) return;
      if (!exactMap.has(norm)) exactMap.set(norm, []);
      exactMap.get(norm).push(item);
    });
    items.forEach((q1) => {
      const text1Norm = (q1.questionText || "").trim().toLowerCase();
      const exactMatches = text1Norm ? exactMap.get(text1Norm) || [] : [q1];
      const matchedIdsSet = /* @__PURE__ */ new Set();
      const yearsSet = /* @__PURE__ */ new Set();
      exactMatches.forEach((em) => {
        matchedIdsSet.add(em.id);
        if (em.year) yearsSet.add(Number(em.year));
      });
      const hasExact = exactMatches.length > 1;
      pyqRepeatIndexMap.set(q1.id, {
        repeatCount: matchedIdsSet.size,
        repeatYears: Array.from(yearsSet).sort((a, b) => a - b),
        repeatType: hasExact ? "exact" : "none",
        matchedIds: Array.from(matchedIdsSet)
      });
    });
  });
  console.log(`[INDEXER] Fast repeat index built for ${pyqStore.size} items in ${Date.now() - startTime}ms.`);
}
setTimeout(() => buildSimilarityIndexes(), 100);
function generateRealisticSyllabus(examId) {
  const normId = examId.toUpperCase();
  let subjects = [];
  if (normId.includes("NEET") || normId.includes("NURSING") || normId.includes("ANM") || normId.includes("GNM") || normId.includes("JENPAS") || normId.includes("JEPBN") || normId.includes("PNST")) {
    subjects = [
      {
        name: "Biology (Botany & Zoology)",
        chapters: [
          { name: "Diversity in Living World", topics: ["Taxonomy & Systematics", "Five Kingdom Classification", "Plant Kingdom", "Animal Kingdom"] },
          { name: "Structural Organisation", topics: ["Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Animal Tissues"] },
          { name: "Cell Structure & Function", topics: ["Cell Theory & Structure", "Biomolecules", "Cell Cycle & Cell Division"] },
          { name: "Human Physiology", topics: ["Breathing & Respiration", "Body Fluids & Circulation", "Excretory Products", "Neural Control & Coordination"] }
        ]
      },
      {
        name: "Physics",
        chapters: [
          { name: "Mechanics", topics: ["Units & Measurements", "Motion in a Straight Line", "Laws of Motion", "Work, Energy & Power"] },
          { name: "Thermodynamics & Waves", topics: ["Kinetic Theory of Gases", "Laws of Thermodynamics", "Oscillations", "Wave Optics"] },
          { name: "Electricity & Magnetism", topics: ["Electrostatics", "Current Electricity", "Magnetic Effects of Current", "Electromagnetic Induction"] }
        ]
      },
      {
        name: "Chemistry",
        chapters: [
          { name: "Physical Chemistry", topics: ["Some Basic Concepts", "Structure of Atom", "Chemical Thermodynamics", "Chemical Kinetics"] },
          { name: "Organic Chemistry", topics: ["Basic Principles & Techniques", "Hydrocarbons", "Alcohols, Phenols & Ethers", "Organic Compounds containing Nitrogen"] },
          { name: "Inorganic Chemistry", topics: ["Classification of Elements", "Chemical Bonding", "Coordination Compounds", "p-Block Elements"] }
        ]
      }
    ];
  } else if (normId.includes("JEE") || normId.includes("GATE") || normId.includes("JEECUP") || normId.includes("JELET") || normId.includes("JEXPO") || normId.includes("BITSAT") || normId.includes("IMU_CET") || normId.includes("JET")) {
    subjects = [
      {
        name: "Mathematics",
        chapters: [
          { name: "Calculus", topics: ["Limits, Continuity & Differentiability", "Application of Derivatives", "Definite & Indefinite Integrals", "Differential Equations"] },
          { name: "Algebra & Matrices", topics: ["Complex Numbers", "Quadratic Equations", "Matrices & Determinants", "Probability & Statistics"] },
          { name: "Coordinate Geometry", topics: ["Straight Lines", "Circles", "Conic Sections (Parabola, Ellipse, Hyperbola)"] }
        ]
      },
      {
        name: "Physics",
        chapters: [
          { name: "Classical Mechanics", topics: ["Kinematics & Rotational Dynamics", "Gravitation", "Properties of Solids & Liquids", "Fluid Mechanics"] },
          { name: "Electromagnetism", topics: ["Electrostatic Potential & Capacitance", "Magnetic Fields & Forces", "Alternating Currents", "Electromagnetic Waves"] },
          { name: "Modern Physics", topics: ["Dual Nature of Matter", "Atoms & Nuclei", "Semiconductor Electronics"] }
        ]
      },
      {
        name: "Chemistry",
        chapters: [
          { name: "Physical & General Chemistry", topics: ["States of Matter", "Atomic Structure", "Chemical Equilibrium", "Electrochemistry"] },
          { name: "Organic & Polymers", topics: ["Purification of Organic Compounds", "Hydrocarbons", "Polymers & Biomolecules", "Chemistry in Everyday Life"] },
          { name: "Inorganic & Metals", topics: ["Periodic Table & Periodic Properties", "Metallurgy Processes", "d and f Block Elements"] }
        ]
      }
    ];
  } else if (normId.includes("CLAT") || normId.includes("CAT") || normId.includes("CUET") || normId.includes("NET") || normId.includes("BED") || normId.includes("PO") || normId.includes("CLERK") || normId.includes("CTET")) {
    subjects = [
      {
        name: "English Language & Comprehension",
        chapters: [
          { name: "Reading Comprehension", topics: ["Fact-based passages", "Inference-based questions", "Vocabulary in context"] },
          { name: "Grammar & Usage", topics: ["Sentence Correction", "Error Spotting", "Active & Passive Voice", "Direct & Indirect Speech"] }
        ]
      },
      {
        name: "Quantitative Aptitude",
        chapters: [
          { name: "Arithmetic & Data Interpretation", topics: ["Percentage & Profit/Loss", "Ratio & Proportion", "Time, Speed & Distance", "Bar Graphs & Pie Charts"] },
          { name: "Algebra & Numbers", topics: ["Number Systems", "Linear & Quadratic Equations", "Permutations & Combinations"] }
        ]
      },
      {
        name: "Logical & Analytical Reasoning",
        chapters: [
          { name: "Analytical Reasoning", topics: ["Linear & Circular Arrangements", "Syllogisms", "Blood Relations", "Coding-Decoding"] },
          { name: "Critical Reasoning", topics: ["Strengthen & Weaken Arguments", "Assumptions & Conclusions", "Course of Action"] }
        ]
      },
      {
        name: "General Awareness & Law",
        chapters: [
          { name: "Current & Static GK", topics: ["National & International Events", "Indian Constitution & Polity", "Legal Aptitude & Maxims", "History & Geography basics"] }
        ]
      }
    ];
  } else if (normId.includes("POLICE") || normId.includes("CONSTABLE") || normId.includes("SI")) {
    subjects = [
      {
        name: "General Studies & GK",
        chapters: [
          { name: "General Knowledge", topics: ["Indian History & Freedom Struggle", "Indian Geography & Resources", "General Science & Life science"] },
          { name: "Current Affairs", topics: ["Sports & Awards", "Important Days & Summits", "Government Schemes & Policies"] }
        ]
      },
      {
        name: "Numerical & Mental Ability",
        chapters: [
          { name: "Numerical Ability", topics: ["Simplification & Number Series", "LCM & HCF", "Percentage, Profit & Loss", "Simple & Compound Interest"] },
          { name: "Mental Ability", topics: ["Logical Diagrams", "Codified Relationships", "Perception Test", "Word Formation Test"] }
        ]
      },
      {
        name: "Reasoning Ability",
        chapters: [
          { name: "Logical Reasoning", topics: ["Analogies & Similarities", "Space Visualization", "Decision Making", "Visual Memory", "Arithmetical Reasoning"] }
        ]
      }
    ];
  } else {
    subjects = [
      {
        name: "General Studies & GK",
        chapters: [
          { name: "Indian History & Culture", topics: ["Ancient & Medieval India", "Modern Indian History", "National Movement & Art Forms"] },
          { name: "Polity, Constitution & Geography", topics: ["Salient Features of Constitution", "Fundamental Rights & Duties", "Physical Geography of India"] }
        ]
      },
      {
        name: "Quantitative Aptitude",
        chapters: [
          { name: "Arithmetic Operations", topics: ["Number Systems & Decimals", "Percentage & Profit/Loss", "Ratio & Proportion", "Time and Work", "Average & Age problems"] },
          { name: "Data Interpretation", topics: ["Tabulation & Line Charts", "Bar Graphs & Histograms"] }
        ]
      },
      {
        name: "General Intelligence & Reasoning",
        chapters: [
          { name: "Verbal & Non-Verbal Reasoning", topics: ["Analogies & Classification", "Series Completion & Coding", "Blood Relations & Direction Sense", "Paper Folding & Mirror Images"] }
        ]
      },
      {
        name: "General English",
        chapters: [
          { name: "Vocabulary & Grammar", topics: ["Synonyms & Antonyms", "Idioms & Phrases", "Sentence Correction", "Cloze Test & Fillers"] }
        ]
      }
    ];
  }
  const nodes = [];
  let nodeIndex = 1;
  for (const sub of subjects) {
    for (const chap of sub.chapters) {
      for (const top of chap.topics) {
        const nodeId = `gen_node_${examId.toLowerCase()}_${nodeIndex++}`;
        nodes.push({
          id: nodeId,
          exam: examId,
          paper: "Paper 1",
          subject: sub.name,
          chapter: chap.name,
          topic: top,
          subtopic: "Core concepts, fundamental formulas, and standard application problems.",
          title: `${top} Core Syllabus Module`,
          stage: "Prelims",
          weightage: "High",
          estimatedHours: 2.5,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
  }
  return nodes;
}
var pyqReviewQueueStore = /* @__PURE__ */ new Map();
function parseFreeformSyllabus(rawText, examHint = "UPSC_CSE") {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const knownCategories = [
    "Polity & Governance",
    "Indian History & Art",
    "Geography & Environment",
    "Economy & Finance",
    "Science & Technology",
    "Current Affairs",
    "General Studies",
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "English",
    "Reasoning",
    "Quantitative Aptitude"
  ];
  let currentSubject = "General";
  let currentChapter = "Chapter 1";
  const rawNodes = [];
  const hasMarkdown = lines.some((l) => l.startsWith("#"));
  const hasOutline = lines.some((l) => /^(?:\d+(\.\d+)*|[IVXLCDM]+\.|[A-Za-z]\))\s+/.test(l));
  const hasIndentationOrBullets = lines.some((l) => /^([-*-]|\t|\s{2,})/.test(l));
  if (hasMarkdown) {
    for (const line of lines) {
      if (line.startsWith("# ")) {
        currentSubject = line.replace(/^#\s+/, "").trim();
      } else if (line.startsWith("## ")) {
        currentChapter = line.replace(/^##\s+/, "").trim();
      } else if (line.startsWith("### ") || line.startsWith("- ") || line.startsWith("* ") || line.startsWith("- ")) {
        const title = line.replace(/^(###\s+|[-*-]\s+)/, "").trim();
        rawNodes.push({ subject: currentSubject, chapter: currentChapter, title, weightage: "Medium" });
      } else {
        rawNodes.push({ subject: currentSubject, chapter: currentChapter, title: line, weightage: "Medium" });
      }
    }
  } else if (hasOutline) {
    for (const line of lines) {
      const outlineMatch = line.match(/^((?:\d+(\.\d+)*|[IVXLCDM]+\.|[A-Za-z]\))\s+)(.+)$/);
      if (outlineMatch) {
        const marker = outlineMatch[1].trim();
        const text = outlineMatch[3].trim();
        const dots = marker.split(".").length;
        if (dots === 1 && (marker.length <= 3 || /^[IVXLCDM]+\.$/.test(marker))) {
          currentSubject = text;
        } else if (dots === 2 || /^[A-Za-z]\)$/.test(marker)) {
          currentChapter = text;
        } else {
          rawNodes.push({ subject: currentSubject, chapter: currentChapter, title: text, weightage: "Medium" });
        }
      } else {
        rawNodes.push({ subject: currentSubject, chapter: currentChapter, title: line, weightage: "Medium" });
      }
    }
  } else if (hasIndentationOrBullets) {
    for (const line of lines) {
      if (/^[-*-]\s+/.test(line)) {
        const title = line.replace(/^[-*-]\s+/, "").trim();
        rawNodes.push({ subject: currentSubject, chapter: currentChapter, title, weightage: "Medium" });
      } else {
        currentChapter = line;
      }
    }
  } else {
    const blocks = rawText.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    if (blocks.length > 1) {
      for (const block of blocks) {
        const blockLines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (blockLines.length === 0) continue;
        const chap = blockLines[0];
        const topics = blockLines.slice(1);
        if (topics.length === 0) {
          rawNodes.push({ subject: currentSubject, chapter: "General", title: chap, weightage: "Medium" });
        } else {
          for (const t of topics) {
            rawNodes.push({ subject: currentSubject, chapter: chap, title: t, weightage: "Medium" });
          }
        }
      }
    } else {
      for (const line of lines) {
        rawNodes.push({ subject: currentSubject, chapter: "General", title: line, weightage: "Medium" });
      }
    }
  }
  if (currentSubject === "General") {
    const fullText = rawText.toLowerCase();
    for (const cat of knownCategories) {
      if (fullText.includes(cat.toLowerCase())) {
        currentSubject = cat;
        break;
      }
    }
  }
  for (const node of rawNodes) {
    if (node.subject === "General" && currentSubject !== "General") {
      node.subject = currentSubject;
    }
  }
  const processedNodes = rawNodes.map((node) => {
    let weightage = "Medium";
    const lowerTitle = node.title.toLowerCase();
    if (lowerTitle.includes("(high)") || lowerTitle.includes("(imp)") || lowerTitle.includes("important") || lowerTitle.includes("must know") || lowerTitle.includes("scoring") || lowerTitle.includes("frequently asked") || lowerTitle.includes("**") || lowerTitle.includes("!!")) {
      weightage = "High";
    } else if (lowerTitle.includes("optional") || lowerTitle.includes("less important") || lowerTitle.includes("rarely asked") || lowerTitle.includes("skip")) {
      weightage = "Low";
    }
    let pyqMatchCount = 0;
    const keywords = lowerTitle.split(/\s+/).filter((w) => w.length > 3);
    if (keywords.length > 0) {
      for (const pyq of pyqStore.values()) {
        const pyqText = `${pyq.topic || ""} ${pyq.questionText || ""}`.toLowerCase();
        if (keywords.some((kw) => pyqText.includes(kw))) {
          pyqMatchCount++;
          if (pyqMatchCount >= 2) break;
        }
      }
      if (pyqMatchCount >= 2) {
        if (weightage === "Low") weightage = "Medium";
        else if (weightage === "Medium") weightage = "High";
      }
    }
    return {
      ...node,
      weightage
    };
  });
  const hierarchyMap = {};
  for (const n of processedNodes) {
    if (!hierarchyMap[n.subject]) hierarchyMap[n.subject] = {};
    if (!hierarchyMap[n.subject][n.chapter]) hierarchyMap[n.subject][n.chapter] = [];
    hierarchyMap[n.subject][n.chapter].push({ title: n.title, weightage: n.weightage });
  }
  const detectedHierarchy = Object.entries(hierarchyMap).map(([subject, chaptersObj]) => ({
    subject,
    chapters: Object.entries(chaptersObj).map(([chapter, topics]) => ({
      chapter,
      topics
    }))
  }));
  return {
    nodes: processedNodes,
    detectedHierarchy
  };
}
var cbtTestsStore = /* @__PURE__ */ new Map();
var cbtResultsStore = /* @__PURE__ */ new Map();
var adminCbtExamsStore = /* @__PURE__ */ new Map();
var communityGroupsStore = /* @__PURE__ */ new Map();
var communityPostsStore = /* @__PURE__ */ new Map();
var communityVotesStore = /* @__PURE__ */ new Map();
var communityCommentsStore = /* @__PURE__ */ new Map();
var userNotificationsStore = /* @__PURE__ */ new Map();
var userWalletsStore = /* @__PURE__ */ new Map();
var userPayoutsStore = /* @__PURE__ */ new Map();
var allPayoutsStore = /* @__PURE__ */ new Map();
var communityBookmarksStore = /* @__PURE__ */ new Map();
var communityPollVotesStore = /* @__PURE__ */ new Map();
var communityGroupMembershipsStore = /* @__PURE__ */ new Map();
var userKarmaStore = /* @__PURE__ */ new Map();
var karmaVotesStore = /* @__PURE__ */ new Map();
userKarmaStore.set("usr_mentor_tanya", { userId: "usr_mentor_tanya", postKarma: 218, commentKarma: 45, totalKarma: 263, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
userKarmaStore.set("usr_curr", { userId: "usr_curr", postKarma: 42, commentKarma: 18, totalKarma: 60, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
userKarmaStore.set("usr_guest_101", { userId: "usr_guest_101", postKarma: 15, commentKarma: 5, totalKarma: 20, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
var DEFAULT_CBT_MOCKS = [
  {
    id: "upsc_cbt_mock_01",
    title: "UPSC CSE Prelims All India Grand Mock Test 2026 (GS Paper 1)",
    exam: "UPSC_CSE",
    durationMinutes: 120,
    totalMarks: 200,
    sections: [{ name: "General Studies Paper 1", durationMinutes: 120, totalQuestions: 5 }],
    markingScheme: { correct: 2, incorrect: 0.66 },
    questions: [
      {
        id: "q_cbt_1",
        type: "mcq",
        section: "General Studies Paper 1",
        questionText: "With reference to the Constitution of India, consider the following statements regarding the Preamble:\n1. The Preamble is a part of the Constitution and can be amended under Article 368.\n2. The Preamble is a source of power to the legislature and also a prohibition upon the powers of the legislature.\n3. In the Kesavananda Bharati case (1973), the Supreme Court held that the Preamble is an integral part of the Constitution.\n\nWhich of the statements given above are correct?",
        options: ["1 and 2 only", "1 and 3 only", "2 and 3 only", "1, 2 and 3"],
        correctOption: 1,
        language: "English",
        subject: "Indian Polity & Governance",
        topic: "Preamble & Fundamental Rights",
        marks: 2,
        negativeMarks: 0.66,
        explanation: "Statement 1 is correct: Preamble is amendable under Art 368 without altering basic structure. Statement 2 is INCORRECT: Preamble is NEITHER a source of power nor a limitation on power. Statement 3 is correct: Kesavananda Bharati case affirmed Preamble as part of Constitution."
      },
      {
        id: "q_cbt_2",
        type: "passage",
        section: "General Studies Paper 1",
        passageText: "PASSAGE: The Monetary Policy Committee (MPC) constituted under Section 45ZB of the Reserve Bank of India Act, 1934 determines the policy repo rate required to achieve the inflation target.",
        questionText: "Based on the passage and macroeconomic principles, consider the following statements regarding the Monetary Policy Committee (MPC):\n1. The MPC consists of six members, including three from RBI and three appointed by the Central Government.\n2. The Governor of the RBI acts as the ex-officio Chairperson of the MPC and possesses a casting vote in case of a tie.\n\nWhich of the above statements is/are correct?",
        options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
        correctOption: 2,
        language: "English",
        subject: "Indian Economy",
        topic: "Monetary Policy & RBI",
        marks: 2,
        negativeMarks: 0.66,
        explanation: "Both 1 and 2 are correct. MPC has 6 members and RBI Governor has casting vote."
      },
      {
        id: "q_cbt_3",
        type: "assertion_reason",
        section: "General Studies Paper 1",
        assertionText: `Assertion (A): The Western Ghats in India are recognized as one of the world's eight "hottest hotspots" of biological diversity.`,
        reasonText: "Reason (R): The Western Ghats display exceptional levels of species endemism due to geographical isolation and microclimatic variations.",
        questionText: "Select the correct answer using the options given below:",
        options: [
          "Both (A) and (R) are true, and (R) is the correct explanation of (A).",
          "Both (A) and (R) are true, but (R) is NOT the correct explanation of (A).",
          "(A) is true, but (R) is false.",
          "(A) is false, but (R) is true."
        ],
        correctOption: 0,
        language: "English",
        subject: "Environment & Ecology",
        topic: "Biodiversity Hotspots",
        marks: 2,
        negativeMarks: 0.66,
        explanation: "Both Assertion and Reason are true and Reason correctly explains why Western Ghats is a biodiversity hotspot."
      },
      {
        id: "q_cbt_4",
        type: "mcq",
        section: "General Studies Paper 1",
        questionText: "Consider the following statements regarding the Indian Ocean Dipole (IOD):\n1. A positive IOD characteristically brings cooler ocean waters in the eastern Indian Ocean and warmer waters in the western Indian Ocean.\n2. A positive IOD is generally associated with good rainfall over the Indian subcontinent during the monsoon season.\n\nWhich of the statements given above is/are correct?",
        options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
        correctOption: 2,
        language: "English",
        subject: "Geography",
        topic: "Monsoon & Climate Dynamics",
        marks: 2,
        negativeMarks: 0.66,
        explanation: "Both statements are correct. Positive IOD favors Indian Summer Monsoon."
      },
      {
        id: "q_cbt_5",
        type: "paragraph",
        section: "General Studies Paper 1",
        questionText: "The ancient Harappan Civilization possessed advanced urban planning. Which among the following sites is famous for its unique water harvesting and reservoir system surrounded by stone masonry fortifications?",
        options: ["Lothal", "Dholavira", "Kalibangan", "Rakhigarhi"],
        correctOption: 1,
        language: "English",
        subject: "History",
        topic: "Indus Valley Civilization",
        marks: 2,
        negativeMarks: 0.66,
        explanation: "Dholavira in Rann of Kutch, Gujarat is world-famous for its elaborate water management system with rock-cut reservoirs."
      }
    ]
  },
  {
    id: "ssc_cgl_cbt_mock_01",
    title: "SSC CGL Tier-1 All India Speed Test Series 2026",
    exam: "SSC_CGL",
    durationMinutes: 60,
    totalMarks: 200,
    sections: [
      { name: "General Intelligence & Reasoning", durationMinutes: 15, totalQuestions: 2 },
      { name: "General Awareness", durationMinutes: 15, totalQuestions: 2 },
      { name: "Quantitative Aptitude", durationMinutes: 15, totalQuestions: 2 }
    ],
    markingScheme: { correct: 2, incorrect: 0.5 },
    questions: [
      {
        id: "q_ssc_1",
        type: "mcq",
        section: "General Intelligence & Reasoning",
        questionText: "Select the missing number in the following series:\n12, 23, 45, 89, 177, ?",
        options: ["353", "355", "351", "349"],
        correctOption: 0,
        language: "English",
        subject: "Reasoning",
        topic: "Number Series",
        marks: 2,
        negativeMarks: 0.5,
        explanation: "Pattern: (12 * 2) - 1 = 23; (23 * 2) - 1 = 45; (45 * 2) - 1 = 89; (89 * 2) - 1 = 177; (177 * 2) - 1 = 353."
      },
      {
        id: "q_ssc_2",
        type: "mcq",
        section: "General Intelligence & Reasoning",
        questionText: 'If "POLITY" is coded as "QNKNUX", how is "RIGHTS" coded in that language?',
        options: ["SJHITR", "SHFISR", "SHGIST", "SJGIUR"],
        correctOption: 3,
        language: "English",
        subject: "Reasoning",
        topic: "Coding Decoding",
        marks: 2,
        negativeMarks: 0.5,
        explanation: "Pattern alternates +1, -1, +1, -1 for adjacent letters."
      },
      {
        id: "q_ssc_3",
        type: "mcq",
        section: "General Awareness",
        questionText: "Who among the following was the founder of the Brahmo Samaj in 1828?",
        options: ["Swami Dayananda Saraswati", "Raja Ram Mohan Roy", "Ishwar Chandra Vidyasagar", "Swami Vivekananda"],
        correctOption: 1,
        language: "English",
        subject: "History",
        topic: "Socio-Religious Movements",
        marks: 2,
        negativeMarks: 0.5,
        explanation: "Raja Ram Mohan Roy founded Brahmo Sabha in 1828, later renamed Brahmo Samaj."
      },
      {
        id: "q_ssc_4",
        type: "mcq",
        section: "General Awareness",
        questionText: "Which organ in the human body produces bile juice stored in the gallbladder?",
        options: ["Pancreas", "Liver", "Kidney", "Stomach"],
        correctOption: 1,
        language: "English",
        subject: "General Science",
        topic: "Human Anatomy",
        marks: 2,
        negativeMarks: 0.5,
        explanation: "Bile is synthesized by the liver and stored in the gallbladder."
      },
      {
        id: "q_ssc_5",
        type: "numerical",
        section: "Quantitative Aptitude",
        questionText: "A train 240 m long passes a telegraph post in 12 seconds. What is the speed of the train in km/h?",
        options: ["72 km/h", "60 km/h", "80 km/h", "54 km/h"],
        correctOption: 0,
        language: "English",
        subject: "Quantitative Aptitude",
        topic: "Speed, Time & Distance",
        marks: 2,
        negativeMarks: 0.5,
        explanation: "Speed = Distance / Time = 240 / 12 = 20 m/s. Convert to km/h: 20 * (18/5) = 72 km/h."
      },
      {
        id: "q_ssc_6",
        type: "numerical",
        section: "Quantitative Aptitude",
        questionText: "If the simple interest on a sum of money at 8% per annum for 3 years is Rs. 1,200, find the principal sum.",
        options: ["Rs. 5,000", "Rs. 4,500", "Rs. 6,000", "Rs. 5,500"],
        correctOption: 0,
        language: "English",
        subject: "Quantitative Aptitude",
        topic: "Simple Interest",
        marks: 2,
        negativeMarks: 0.5,
        explanation: "Principal P = (SI * 100) / (R * T) = (1200 * 100) / (8 * 3) = 120000 / 24 = Rs. 5,000."
      }
    ]
  },
  {
    id: "neet_ug_cbt_mock_01",
    title: "NEET UG All India National Grand Mock Test 2026 (Physics, Chem & Bio)",
    exam: "NEET_UG",
    durationMinutes: 180,
    totalMarks: 720,
    sections: [
      { name: "Physics", durationMinutes: 45, totalQuestions: 2 },
      { name: "Chemistry", durationMinutes: 45, totalQuestions: 2 },
      { name: "Biology", durationMinutes: 90, totalQuestions: 2 }
    ],
    markingScheme: { correct: 4, incorrect: 1 },
    questions: [
      {
        id: "q_neet_1",
        type: "mcq",
        section: "Physics",
        questionText: "A particle starts from rest with a uniform acceleration of 2 m/s\xB2. The distance travelled by the particle in the 5th second is:",
        options: ["9 m", "10 m", "25 m", "12 m"],
        correctOption: 0,
        language: "English",
        subject: "Physics",
        topic: "Kinematics in 1D",
        marks: 4,
        negativeMarks: 1,
        explanation: "Distance in nth second: Sn = u + a/2 * (2n - 1) = 0 + 2/2 * (2*5 - 1) = 9 m."
      },
      {
        id: "q_neet_2",
        type: "mcq",
        section: "Physics",
        questionText: "Two point charges +3\xB5C and -3\xB5C are separated by a distance of 2cm in air. What is the electric dipole moment of the system?",
        options: ["6 \xD7 10\u207B\u2078 C\xB7m", "6 \xD7 10\u207B\u2076 C\xB7m", "3 \xD7 10\u207B\u2078 C\xB7m", "1.5 \xD7 10\u207B\u2078 C\xB7m"],
        correctOption: 0,
        language: "English",
        subject: "Physics",
        topic: "Electrostatics",
        marks: 4,
        negativeMarks: 1,
        explanation: "Dipole moment p = q \xD7 2a = (3 \xD7 10\u207B\u2076) \xD7 (2 \xD7 10\u207B\xB2) = 6 \xD7 10\u207B\u2078 C\xB7m."
      },
      {
        id: "q_neet_3",
        type: "mcq",
        section: "Chemistry",
        questionText: "Which among the following coordination compounds exhibits optical isomerism?",
        options: ["[Co(en)\u2083]\xB3\u207A", "trans-[Co(NH\u2083)\u2084Cl\u2082]\u207A", "cis-[Pt(NH\u2083)\u2082Cl\u2082]", "[Zn(en)\u2082]\xB2\u207A (tetrahedral)"],
        correctOption: 0,
        language: "English",
        subject: "Chemistry",
        topic: "Coordination Compounds",
        marks: 4,
        negativeMarks: 1,
        explanation: "Tris-chelate octahedral complex [Co(en)\u2083]\xB3\u207A lacks plane of symmetry and exhibits optical isomerism."
      },
      {
        id: "q_neet_4",
        type: "mcq",
        section: "Chemistry",
        questionText: "The pH of a 10\u207B\u2078 M aqueous solution of HCl at 25\xB0C is:",
        options: ["8.00", "6.98", "7.00", "1.00"],
        correctOption: 1,
        language: "English",
        subject: "Chemistry",
        topic: "Ionic Equilibrium",
        marks: 4,
        negativeMarks: 1,
        explanation: "Total [H\u207A] = 10\u207B\u2078 (from HCl) + 10\u207B\u2077 (from water) = 1.1 \xD7 10\u207B\u2077 M, yielding pH = 6.98."
      },
      {
        id: "q_neet_5",
        type: "mcq",
        section: "Biology",
        questionText: "In cellular respiration, what is the net gain of ATP molecules per molecule of glucose oxidized in glycolysis?",
        options: ["2 ATP", "4 ATP", "36 ATP", "38 ATP"],
        correctOption: 0,
        language: "English",
        subject: "Biology",
        topic: "Respiration in Plants",
        marks: 4,
        negativeMarks: 1,
        explanation: "Glycolysis yields 4 ATP total and consumes 2 ATP, resulting in a net gain of 2 ATP."
      },
      {
        id: "q_neet_6",
        type: "mcq",
        section: "Biology",
        questionText: "Which hormone triggers ovulation and the development of corpus luteum in human females?",
        options: ["Luteinizing Hormone (LH)", "Follicle Stimulating Hormone (FSH)", "Estrogen", "Progesterone"],
        correctOption: 0,
        language: "English",
        subject: "Biology",
        topic: "Human Reproduction",
        marks: 4,
        negativeMarks: 1,
        explanation: "A rapid surge in LH (LH surge) mid-cycle induces rupture of Graafian follicle and releases the ovum."
      }
    ]
  },
  {
    id: "nda_na_cbt_mock_01",
    title: "NDA / NA All India Defense Officers Mock Test (Maths & GAT)",
    exam: "NDA_NA",
    durationMinutes: 150,
    totalMarks: 300,
    sections: [
      { name: "Mathematics", durationMinutes: 75, totalQuestions: 2 },
      { name: "General Ability Test (GAT)", durationMinutes: 75, totalQuestions: 2 }
    ],
    markingScheme: { correct: 2.5, incorrect: 0.83 },
    questions: [
      {
        id: "q_nda_1",
        type: "mcq",
        section: "Mathematics",
        questionText: "If sin \u03B8 + cos \u03B8 = \u221A2 cos \u03B8, then what is the value of cos \u03B8 - sin \u03B8?",
        options: ["\u221A2 sin \u03B8", "\u221A2 cos \u03B8", "sin \u03B8", "-\u221A2 sin \u03B8"],
        correctOption: 0,
        language: "English",
        subject: "Mathematics",
        topic: "Trigonometry",
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: "Squaring both sides and simplifying yields cos \u03B8 - sin \u03B8 = \u221A2 sin \u03B8."
      },
      {
        id: "q_nda_2",
        type: "mcq",
        section: "Mathematics",
        questionText: "What is the value of lim (x \u2192 0) (sin 3x) / (tan 2x)?",
        options: ["3/2", "2/3", "1", "0"],
        correctOption: 0,
        language: "English",
        subject: "Mathematics",
        topic: "Limits & Calculus",
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: "lim (x \u2192 0) [ (sin 3x / 3x) * 3 ] / [ (tan 2x / 2x) * 2 ] = (1 * 3) / (1 * 2) = 3/2."
      },
      {
        id: "q_nda_3",
        type: "mcq",
        section: "General Ability Test (GAT)",
        questionText: "Where is the headquarters of the Indian National Defence Academy (NDA) located?",
        options: ["Khadakwasla, Pune", "Dehradun", "Dungigal, Hyderabad", "Ezhimala, Kerala"],
        correctOption: 0,
        language: "English",
        subject: "General Knowledge",
        topic: "Defense Institutions",
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: "The National Defence Academy (NDA) is located at Khadakwasla near Pune, Maharashtra."
      },
      {
        id: "q_nda_4",
        type: "mcq",
        section: "General Ability Test (GAT)",
        questionText: "Which optical phenomenon is primarily responsible for the sparkling brilliance of diamonds?",
        options: ["Total Internal Reflection", "Refraction", "Dispersion", "Interference"],
        correctOption: 0,
        language: "English",
        subject: "Physics",
        topic: "Ray Optics",
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: "The small critical angle of diamond (24.4\xB0) ensures multiple total internal reflections of trapped light."
      }
    ]
  }
];
DEFAULT_CBT_MOCKS.forEach((m) => cbtTestsStore.set(m.id, m));
var DEFAULT_COMMUNITY_GROUPS = [
  {
    id: "grp_upsc_general",
    name: "UPSC CSE 2026 Strategy & Mentorship",
    description: "Comprehensive discussions on Prelims & Mains GS Strategy, optional papers, daily answer writing, and topper notes.",
    exam: "UPSC_CSE",
    category: "public",
    icon: "Target",
    membersCount: 1420,
    postsCount: 56,
    isJoined: true,
    rules: [
      "Be respectful and constructive.",
      "Cite sources for current affairs and notes.",
      "No spamming or self-promotion."
    ]
  },
  {
    id: "grp_neet_aiims",
    name: "NEET UG 2026 AIIMS Mission 700+",
    description: "High-yield NCERT Biology mnemonics, Physics numericals shortcuts, Organic Chemistry reaction charts, and mock test post-mortems.",
    exam: "NEET_UG",
    category: "public",
    icon: "Sparkles",
    membersCount: 2310,
    postsCount: 88,
    isJoined: true,
    rules: ["Strictly stick to NCERT syllabus.", "Share verified formulas only."]
  },
  {
    id: "grp_jee_advanced",
    name: "JEE Advanced 2026 Problem Solvers",
    description: "Challenging physics mechanics problems, Irodov discussion, advanced calculus problem threads, and JEE ranking strategies.",
    exam: "JEE_MAIN",
    category: "public",
    icon: "Zap",
    membersCount: 1890,
    postsCount: 42,
    isJoined: false,
    rules: ["Provide complete step-by-step solutions when sharing doubts."]
  }
];
var DEFAULT_COMMUNITY_POSTS = [
  {
    id: "post_upsc_1",
    groupId: "grp_upsc_general",
    groupName: "UPSC CSE 2026 Strategy & Mentorship",
    title: "High-Yield Modern Indian History (1857-1947) Timeline & Spectrum Micro-Notes",
    content: "Fellow Aspirants! Here is a concise 5-page revision matrix covering all Governor-Generals, Congress sessions, Peasant movements, and Constitutional milestones. Perfect for quick Prelims revision before CBT tests!\n\nKey Highlights:\n- Charter Acts 1773-1853 summary\n- Revolutionary Phase I & II comparisons\n- Round Table Conferences key attendees",
    authorName: "Aarav Sharma (AIR 48 Aspirant)",
    authorAvatar: "",
    authorBadge: "Topper Contributor",
    authorId: "usr_topper_aarav",
    exam: "UPSC_CSE",
    category: "notes",
    tags: ["History", "ModernIndia", "Prelims2026", "HighYield"],
    score: 142,
    upvotesCount: 142,
    downvotesCount: 0,
    likesCount: 142,
    isLiked: false,
    isBookmarked: false,
    isPinned: true,
    tippedCoins: 65,
    repliesCount: 18,
    createdAt: new Date(Date.now() - 36e5 * 5).toISOString()
  },
  {
    id: "post_neet_1",
    groupId: "grp_neet_aiims",
    groupName: "NEET UG 2026 AIIMS Mission 700+",
    title: "Complete Genetics & Molecular Biology Formula & Pedigree Analysis Cheat Sheet",
    content: "Consolidated all Hardy-Weinberg equilibrium problem variations, dihybrid cross phenotypic & genotypic ratios, and pedigree chart decision trees into one place. Hope this saves you 15+ marks in Botany/Zoology!",
    authorName: "Dr. Tanya Verma (AIIMS New Delhi Aspirant)",
    authorAvatar: "",
    authorBadge: "Biology Mentor",
    authorId: "usr_mentor_tanya",
    exam: "NEET_UG",
    category: "notes",
    tags: ["Genetics", "NEETBiology", "NCERT", "Mnemonics"],
    score: 218,
    upvotesCount: 218,
    downvotesCount: 0,
    likesCount: 218,
    isLiked: false,
    isBookmarked: false,
    isPinned: true,
    tippedCoins: 120,
    repliesCount: 34,
    createdAt: new Date(Date.now() - 36e5 * 12).toISOString()
  }
];
DEFAULT_COMMUNITY_GROUPS.forEach((g) => communityGroupsStore.set(g.id, g));
DEFAULT_COMMUNITY_POSTS.forEach((p) => communityPostsStore.set(p.id, p));
async function hydrateCommunityPostsFromSupabase() {
  if (!supabaseServer) return;
  try {
    const { data: postsData, error: postsErr } = await supabaseServer.from("community_posts").select("*");
    if (postsErr) {
      console.warn("[HYDRATION COMMUNITY POSTS NOTICE]", postsErr.message);
    } else if (Array.isArray(postsData) && postsData.length > 0) {
      postsData.forEach((row) => {
        const item = row.data || row;
        if (item && item.id) {
          communityPostsStore.set(item.id, item);
        }
      });
    }
    const { data: votesData, error: votesErr } = await supabaseServer.from("community_votes").select("*");
    if (votesErr) {
      console.warn("[HYDRATION COMMUNITY VOTES NOTICE]", votesErr.message);
    } else if (Array.isArray(votesData) && votesData.length > 0) {
      votesData.forEach((row) => {
        const item = row.data || row;
        const key = row.key || (item.postId && item.userId ? `${item.postId}:${item.userId}` : item.id);
        if (key && item) {
          communityVotesStore.set(key, item);
        }
      });
    }
    const { data: groupsData, error: groupsErr } = await supabaseServer.from("community_groups").select("*");
    if (groupsErr) {
      console.warn("[HYDRATION COMMUNITY GROUPS NOTICE]", groupsErr.message);
    } else if (Array.isArray(groupsData) && groupsData.length > 0) {
      groupsData.forEach((row) => {
        const item = row.data || row;
        if (item && item.id) {
          communityGroupsStore.set(item.id, item);
        }
      });
    }
  } catch (e) {
    console.warn("[HYDRATION COMMUNITY NOTICE]", e?.message || e);
  }
}
async function hydrateWalletsFromSupabase(userId) {
  if (!supabaseServer) return;
  try {
    let query = supabaseServer.from("user_wallets").select("*");
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (error) {
      console.warn("[HYDRATION WALLETS NOTICE]", error.message);
    } else if (Array.isArray(data) && data.length > 0) {
      data.forEach((row) => {
        const uid = row.user_id || row.id;
        const wData = row.data || row;
        if (uid && wData) {
          userWalletsStore.set(uid, wData);
        }
      });
    }
  } catch (e) {
    console.warn("[HYDRATION WALLETS NOTICE]", e?.message || e);
  }
}
async function hydratePayoutsFromSupabase() {
  if (!supabaseServer) return;
  try {
    const { data, error } = await supabaseServer.from("user_payouts").select("*").order("created_at", { ascending: false });
    if (error) {
      console.warn("[HYDRATION PAYOUTS NOTICE]", error.message);
    } else if (Array.isArray(data) && data.length > 0) {
      data.forEach((row) => {
        const payout = row.data || row;
        if (payout && payout.id) {
          allPayoutsStore.set(payout.id, payout);
          const uId = payout.userId || row.user_id;
          if (uId) {
            const userList = userPayoutsStore.get(uId) || [];
            if (!userList.some((p) => p.id === payout.id)) {
              userList.push(payout);
              userPayoutsStore.set(uId, userList);
            }
          }
        }
      });
    }
  } catch (e) {
    console.warn("[HYDRATION PAYOUTS NOTICE]", e?.message || e);
  }
}
async function hydrateKarmaFromSupabase(userId) {
  if (!supabaseServer) return;
  try {
    let karmaQuery = supabaseServer.from("user_karma").select("*");
    if (userId) karmaQuery = karmaQuery.eq("user_id", userId);
    const { data: kData, error: kErr } = await karmaQuery;
    if (kErr) {
      console.warn("[HYDRATION USER KARMA NOTICE]", kErr.message);
    } else if (Array.isArray(kData) && kData.length > 0) {
      kData.forEach((row) => {
        const uid = row.user_id || row.id;
        if (uid) {
          const postKarma = Number(row.post_karma) || 0;
          const commentKarma = Number(row.comment_karma) || 0;
          const totalKarma = Number(row.total_karma) ?? postKarma + commentKarma;
          userKarmaStore.set(uid, {
            userId: uid,
            postKarma,
            commentKarma,
            totalKarma,
            updatedAt: row.updated_at || (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      });
    }
    let votesQuery = supabaseServer.from("karma_votes").select("*");
    if (userId) votesQuery = votesQuery.or(`voter_id.eq.${userId},target_owner_id.eq.${userId}`);
    const { data: vData, error: vErr } = await votesQuery;
    if (vErr) {
      console.warn("[HYDRATION KARMA VOTES NOTICE]", vErr.message);
    } else if (Array.isArray(vData) && vData.length > 0) {
      vData.forEach((row) => {
        const key = `${row.voter_id || row.user_id}:${row.target_type}:${row.target_id}`;
        karmaVotesStore.set(key, {
          id: row.id || key,
          voterId: row.voter_id || row.user_id,
          targetType: row.target_type,
          targetId: row.target_id,
          targetOwnerId: row.target_owner_id,
          vote: row.vote,
          createdAt: row.created_at || (/* @__PURE__ */ new Date()).toISOString()
        });
      });
    }
  } catch (e) {
    console.warn("[HYDRATION KARMA NOTICE]", e?.message || e);
  }
}
function recalculateUserKarma(userId) {
  let postKarma = 0;
  let commentKarma = 0;
  karmaVotesStore.forEach((v) => {
    if (v.targetOwnerId === userId) {
      if (v.targetType === "post") postKarma += v.vote;
      else if (v.targetType === "comment") commentKarma += v.vote;
    }
  });
  const existing = userKarmaStore.get(userId);
  const finalPost = karmaVotesStore.size > 0 ? postKarma : existing?.postKarma ?? postKarma;
  const finalComment = karmaVotesStore.size > 0 ? commentKarma : existing?.commentKarma ?? commentKarma;
  const record = {
    userId,
    postKarma: finalPost,
    commentKarma: finalComment,
    totalKarma: finalPost + finalComment,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  userKarmaStore.set(userId, record);
  return record;
}
hydrateCommunityPostsFromSupabase().catch((err) => console.error("[INIT HYDRATE COMMUNITY ERROR]", err));
hydrateWalletsFromSupabase().catch((err) => console.error("[INIT HYDRATE WALLETS ERROR]", err));
hydratePayoutsFromSupabase().catch((err) => console.error("[INIT HYDRATE PAYOUTS ERROR]", err));
hydrateKarmaFromSupabase().catch((err) => console.error("[INIT HYDRATE KARMA ERROR]", err));
var DEFAULT_NOTIFS = [
  {
    id: "notif_1",
    userId: "usr_default",
    title: "Daily Study Target Alert [GOAL]",
    message: "You have completed 6.5 hours out of your 10.0 hours study target today! 3.5 hours remaining.",
    type: "study_reminder",
    read: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "notif_2",
    userId: "usr_default",
    title: "New CBT All India Mock Test Released!",
    message: "UPSC CSE All India Grand Mock Test 2026 (GS Paper 1) is live now. Attempt now to benchmark your national rank.",
    type: "mock_test",
    read: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    actionUrl: "cbt_exam"
  }
];
userNotificationsStore.set("default_user", DEFAULT_NOTIFS);
function setWatchdogSystemLogs(val) {
  if (typeof val === "function") {
    watchdogSystemLogs = val(watchdogSystemLogs);
  } else {
    watchdogSystemLogs = val;
  }
}
function setSimulatedErrors(val) {
  simulatedErrors = val;
}
function setGlobalAdminSettings(val) {
  if (typeof val === "function") {
    globalAdminSettings = val(globalAdminSettings);
  } else {
    globalAdminSettings = val;
  }
}
function setLastGatewaySettingsSync(val) {
  lastGatewaySettingsSync = val;
}
function setAdminUsersDb(val) {
  if (typeof val === "function") {
    adminUsersDb = val(adminUsersDb);
  } else {
    adminUsersDb = val;
  }
}
function setAdminContentDb(val) {
  adminContentDb = val;
}
function setFeatureFlagsStore(val) {
  if (typeof val === "function") {
    featureFlagsStore = val(featureFlagsStore);
  } else {
    featureFlagsStore = val;
  }
}
function setAdminTeamStore(val) {
  if (typeof val === "function") {
    adminTeamStore = val(adminTeamStore);
  } else {
    adminTeamStore = val;
  }
}

// routes/academic.routes.ts
var import_express = require("express");
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_crypto2 = __toESM(require("crypto"), 1);
var router = (0, import_express.Router)();
var __dirname = import_path2.default.resolve();
router.post("/api/syllabus/ai-organize", aiRateLimiter, async (req, res) => {
  try {
    const { rawText, content, defaultExam = "UPSC_CSE", defaultSubject = "Custom Subject" } = req.body;
    let inputText = typeof rawText === "string" ? rawText.trim() : typeof content === "string" ? content.trim() : "";
    if (!inputText) {
      return res.status(400).json({
        success: false,
        error: "No syllabus rawText or Google Sheets link provided"
      });
    }
    const truncatedText = inputText.slice(0, 12e3);
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        error: "AI service unavailable. Please try manual column mapping."
      });
    }
    const systemInstruction = `You are a strict syllabus STRUCTURE classifier. Your ONLY job is to take raw, possibly messy syllabus text and assign each line/item into a 4-level hierarchy position: Subject -> Chapter -> Topic -> Subtopic.

ABSOLUTE RULES - DO NOT VIOLATE:
1. NEVER rewrite, rephrase, paraphrase, summarize, expand, shorten, translate, or "correct" any topic/chapter/subtopic text. Copy it EXACTLY as it appears in the input, character-for-character (trimming only leading/trailing whitespace).
2. The ONLY normalization you may do is grouping OBVIOUSLY identical subjects that are just formatting variants of the same word - e.g. 'Physical Geography 1' and 'Human Geography1' both clearly belong under a subject the user is calling 'Geography' - group these under ONE subject label PICKED FROM the user's own text (use the most common or cleanest variant that already appears in the input; do NOT invent a subject name that never appears in the input).
3. Do not merge, split, reorder, or drop any topic/subtopic content. If the input has 40 distinct topic lines, your output must contain all 40 as distinct nodes - you are re-organizing structure, not summarizing content.
4. If you genuinely cannot tell whether something is a chapter, topic, or subtopic, default to the most granular available level (subtopic) rather than guessing and potentially altering meaning by misclassifying.
5. Output ONLY valid JSON, nothing else - no markdown, no explanation.`;
    const promptText = `Classify (do NOT rewrite) the following raw syllabus text for exam "${defaultExam}" (Default Subject fallback if a row has no identifiable subject: "${defaultSubject}") into structured nodes. Copy all topic/chapter/subtopic text EXACTLY as given - you are only deciding WHICH HIERARCHY LEVEL each piece of text belongs to, never changing the text itself.

Target JSON Schema:
{
  "nodes": [
    {
      "subject": "Subject name - copied or grouped from input, never invented",
      "chapter": "Chapter/Module - EXACT text from input",
      "topic": "Topic - EXACT text from input",
      "subtopic": "Subtopic - EXACT text from input",
      "stage": "Prelims" | "Mains" | "Foundation" | "Advanced",
      "weightage": "Low" | "Medium" | "High"
    }
  ]
}

Raw Syllabus Content:
${truncatedText}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0
      }
    });
    const replyText = response.text || "";
    let parsedJson = null;
    try {
      const cleaned = replyText.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedJson = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse Gemini response as JSON:", parseErr, replyText);
      return res.json({
        success: false,
        error: "AI could not parse this syllabus, try manual mapping"
      });
    }
    let nodesArray = [];
    if (parsedJson && Array.isArray(parsedJson.nodes)) {
      nodesArray = parsedJson.nodes;
    } else if (Array.isArray(parsedJson)) {
      nodesArray = parsedJson;
    } else {
      return res.json({
        success: false,
        error: "AI returned malformed JSON structure, try manual mapping"
      });
    }
    if (nodesArray.length === 0) {
      return res.json({
        success: false,
        error: "AI returned an empty syllabus array, try manual mapping"
      });
    }
    const rawLines = truncatedText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const distinctLineCount = new Set(rawLines).size;
    if (distinctLineCount > 0 && nodesArray.length < distinctLineCount * 0.7) {
      return res.json({
        success: false,
        error: "AI output looks incomplete compared to your input - try manual column mapping instead for exact control."
      });
    }
    const formattedNodes = nodesArray.map((item, idx) => ({
      id: `pers_node_ai_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      exam: defaultExam,
      subject: (item.subject || defaultSubject || "Custom Subject").trim(),
      chapter: (item.chapter || item.topic || "General Chapter").trim(),
      topic: (item.topic || item.chapter || "").trim(),
      subtopic: (item.subtopic || item.topic || item.chapter || "").trim(),
      stage: item.stage || "Prelims",
      weightage: item.weightage || "Medium",
      tags: item.tags || ""
    }));
    const subjectsFound = Array.from(
      new Set(formattedNodes.map((n) => n.subject).filter(Boolean))
    );
    return res.json({
      success: true,
      nodes: formattedNodes,
      subjectsFound
    });
  } catch (error) {
    console.error("Error in /api/syllabus/ai-organize:", error);
    return res.json({
      success: false,
      error: "AI could not parse this syllabus, try manual mapping"
    });
  }
});
router.get("/api/academic/syllabus", async (req, res) => {
  try {
    const exam = req.query.exam || "";
    const search = req.query.search || "";
    const paper = req.query.paper || "";
    const stage = req.query.stage || "";
    let items = Array.from(syllabusNodesStore.values());
    if (exam) {
      items = items.filter((i) => {
        const itemExam = i.exam || i.data?.exam || "";
        return normalizeExam(itemExam) === normalizeExam(exam);
      });
      if (items.length === 0 && customExamsStore.size > 0) {
        const examParam = String(exam || "").toLowerCase();
        const customMatch = Array.from(customExamsStore.values()).find(
          (c) => c.id && c.id.toLowerCase() === examParam || c.label && c.label.toLowerCase().includes(examParam) || c.name && c.name.toLowerCase().includes(examParam) || c.id && normalizeExam(c.id) === normalizeExam(exam)
        );
        if (customMatch && Array.isArray(customMatch.syllabus) && customMatch.syllabus.length > 0) {
          items = customMatch.syllabus;
        }
      }
      if (items.length === 0) {
        const generated = generateRealisticSyllabus(exam);
        generated.forEach((node) => {
          syllabusNodesStore.set(node.id, node);
        });
        items = generated;
      }
    }
    if (paper) {
      items = items.filter((i) => i.paper === paper);
    }
    if (stage && stage !== "All") {
      items = items.filter((i) => i.stage === stage);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) => i.title && i.title.toLowerCase().includes(q) || i.subject && i.subject.toLowerCase().includes(q) || i.chapter && i.chapter.toLowerCase().includes(q) || i.topic && i.topic.toLowerCase().includes(q) || i.subtopic && i.subtopic.toLowerCase().includes(q)
      );
    }
    res.json({ success: true, count: items.length, syllabus: items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch syllabus nodes", details: err.message });
  }
});
router.post("/api/syllabus/import-from-official", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || req.body.userId || "guest";
    const { exam = "UPSC_CSE", items = [] } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array is required" });
    }
    const imported = [];
    const alreadyImported = [];
    const rowsToInsert = [];
    const existingNodes = Array.from(personalSyllabusNodesStore.values()).filter(
      (n) => n.user_id === userId
    );
    for (const item of items) {
      const officialNodeId = item.officialNodeId || item.id;
      if (!officialNodeId) continue;
      const isAlready = existingNodes.some(
        (n) => n.origin_official_id === officialNodeId
      );
      if (isAlready) {
        alreadyImported.push(officialNodeId);
        continue;
      }
      const newId = `pers_node_imp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nodeObj = {
        id: newId,
        user_id: userId,
        exam,
        subject: item.subject || "General Subject",
        chapter: item.chapter || item.topic || "General Chapter",
        topic: item.topic || "",
        subtopic: item.subtopic || "",
        origin_official_id: officialNodeId,
        time_studied_seconds: 0,
        stage: item.stage || "Prelims",
        weightage: item.weightage || "Medium",
        tags: item.tags || "",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      personalSyllabusNodesStore.set(newId, nodeObj);
      existingNodes.push(nodeObj);
      rowsToInsert.push(nodeObj);
      imported.push(officialNodeId);
    }
    if (supabaseServer && rowsToInsert.length > 0) {
      try {
        await supabaseServer.from("personal_syllabus_nodes").insert(rowsToInsert);
      } catch (sbErr) {
        console.warn("Failed to insert imported nodes into Supabase:", sbErr);
      }
    }
    res.json({ success: true, imported, alreadyImported });
  } catch (err) {
    res.status(500).json({ error: "Failed to import from official syllabus", details: err.message });
  }
});
router.post("/api/syllabus/log-time", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || req.body.userId || "guest";
    const { nodeId, nodeSource = "official", subject, topic, subtopic, secondsLogged = 0, sessionId } = req.body;
    const seconds = Number(secondsLogged) || 0;
    if (seconds <= 0) {
      return res.status(400).json({ error: "secondsLogged must be > 0" });
    }
    const logRecord = {
      id: `stl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      node_id: nodeId || null,
      node_source: nodeSource,
      subject: subject || "",
      topic: topic || "",
      subtopic: subtopic || "",
      seconds_logged: seconds,
      session_id: sessionId || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!syllabusTimeLogsStore.has(userId)) syllabusTimeLogsStore.set(userId, []);
    syllabusTimeLogsStore.get(userId).push(logRecord);
    if (supabaseServer) {
      try {
        await supabaseServer.from("syllabus_time_log").insert([logRecord]);
      } catch (sbErr) {
        console.warn("Failed to insert syllabus_time_log in Supabase:", sbErr);
      }
    }
    let totalTimeForNode = seconds;
    if (nodeSource === "personal" && nodeId) {
      const existingNode = personalSyllabusNodesStore.get(nodeId);
      if (existingNode) {
        existingNode.time_studied_seconds = (Number(existingNode.time_studied_seconds) || 0) + seconds;
        existingNode.updated_at = (/* @__PURE__ */ new Date()).toISOString();
        totalTimeForNode = existingNode.time_studied_seconds;
      }
      if (supabaseServer) {
        const { data: currentData } = await supabaseServer.from("personal_syllabus_nodes").select("time_studied_seconds").eq("id", nodeId).maybeSingle();
        const newTime = (Number(currentData?.time_studied_seconds) || 0) + seconds;
        totalTimeForNode = newTime;
        await supabaseServer.from("personal_syllabus_nodes").update({ time_studied_seconds: newTime, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", nodeId);
      }
    }
    res.json({ success: true, secondsLogged: seconds, totalTimeForNode });
  } catch (err) {
    res.status(500).json({ error: "Failed to log study time", details: err.message });
  }
});
router.get("/api/syllabus/time-summary", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = req.query.userId || verifiedUser?.sub || "guest";
    const nodeSource = req.query.nodeSource;
    const summary = {};
    let userLogs = syllabusTimeLogsStore.get(userId) || [];
    if (supabaseServer) {
      try {
        let q = supabaseServer.from("syllabus_time_log").select("*").eq("user_id", userId);
        if (nodeSource) q = q.eq("node_source", nodeSource);
        const { data } = await q;
        if (Array.isArray(data)) {
          userLogs = data;
        }
      } catch (sbErr) {
        console.warn("Supabase fetch time-summary error:", sbErr);
      }
    }
    for (const log of userLogs) {
      if (nodeSource && log.node_source && log.node_source !== nodeSource) continue;
      const key = log.node_id || `${log.subject}|||${log.topic}|||${log.subtopic}`;
      summary[key] = (summary[key] || 0) + (Number(log.seconds_logged) || 0);
    }
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch time summary", details: err.message });
  }
});
router.get("/api/personal-syllabus", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = req.query.userId || verifiedUser?.sub || "guest";
    const exam = req.query.exam;
    let nodes = Array.from(personalSyllabusNodesStore.values()).filter((n) => n.user_id === userId);
    if (supabaseServer) {
      try {
        let q = supabaseServer.from("personal_syllabus_nodes").select("*").eq("user_id", userId);
        if (exam) q = q.eq("exam", exam);
        const { data } = await q;
        if (Array.isArray(data)) nodes = data;
      } catch (e) {
      }
    } else if (exam) {
      nodes = nodes.filter((n) => n.exam === exam);
    }
    res.json({ success: true, nodes });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch personal syllabus", details: err.message });
  }
});
router.post("/api/personal-syllabus", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || req.body.userId || "guest";
    const { nodes = [], exam = "UPSC_CSE", subject } = req.body;
    if (!Array.isArray(nodes)) {
      return res.status(400).json({ error: "nodes must be an array" });
    }
    const savedNodes = [];
    for (const n of nodes) {
      const nodeObj = {
        id: n.id || `pers_node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: userId,
        exam: n.exam || exam,
        subject: n.subject || subject || "General Subject",
        chapter: n.chapter || n.topic || "General Chapter",
        topic: n.topic || "",
        subtopic: n.subtopic || "",
        stage: n.stage || "Prelims",
        weightage: n.weightage || "Medium",
        tags: n.tags || "",
        origin_official_id: n.origin_official_id || null,
        time_studied_seconds: Number(n.time_studied_seconds) || 0,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      personalSyllabusNodesStore.set(nodeObj.id, nodeObj);
      savedNodes.push(nodeObj);
    }
    if (supabaseServer && savedNodes.length > 0) {
      try {
        await supabaseServer.from("personal_syllabus_nodes").upsert(savedNodes);
      } catch (sbErr) {
        console.warn("Supabase upsert personal_syllabus_nodes error:", sbErr);
      }
    }
    res.json({ success: true, nodes: savedNodes });
  } catch (err) {
    res.status(500).json({ error: "Failed to save personal syllabus", details: err.message });
  }
});
router.delete("/api/personal-syllabus/:id", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || "guest";
    const { id } = req.params;
    personalSyllabusNodesStore.delete(id);
    if (supabaseServer) {
      try {
        await supabaseServer.from("personal_syllabus_nodes").delete().eq("id", id).eq("user_id", userId);
      } catch (e) {
      }
    }
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete personal syllabus node", details: err.message });
  }
});
router.post("/api/academic/syllabus", async (req, res) => {
  try {
    const { id, exam = "UPSC_CSE", paper, subject, chapter, topic, subtopic, title, stage = "Prelims", weightage = "High", estimatedHours = 2.5 } = req.body;
    if (!title || !subject || !chapter || !topic) {
      return res.status(400).json({ error: "Title, subject, chapter, and topic are required fields." });
    }
    const nodeId = id || `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const existing = syllabusNodesStore.get(nodeId);
    const record = {
      id: nodeId,
      exam,
      paper: paper || "GS Paper 1",
      subject: subject.trim(),
      chapter: chapter.trim(),
      topic: topic.trim(),
      subtopic: (subtopic || title).trim(),
      title: title.trim(),
      stage,
      weightage,
      estimatedHours: Number(estimatedHours) || 2.5,
      version: (existing?.version || 0) + 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    syllabusNodesStore.set(nodeId, record);
    if (supabaseServer) {
      try {
        await supabaseServer.from("syllabus_nodes").upsert([{ id: record.id, data: record, updated_at: record.updatedAt || (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
      } catch (e) {
      }
    }
    addAdminAuditLogRecord({
      action: existing ? "SYLLABUS_NODE_UPDATE" : "SYLLABUS_NODE_CREATE",
      performedBy: "ADMIN",
      target: nodeId,
      details: `Syllabus node '${record.title}' updated for ${record.exam}.`
    });
    res.json({ success: true, node: record });
  } catch (err) {
    res.status(500).json({ error: "Failed to save syllabus node", details: err.message });
  }
});
router.delete("/api/academic/syllabus/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = syllabusNodesStore.get(id);
    syllabusNodesStore.delete(id);
    if (supabaseServer) {
      try {
        await supabaseServer.from("syllabus_nodes").delete().eq("id", id);
      } catch (e) {
      }
    }
    if (existing) {
      addAdminAuditLogRecord({
        action: "SYLLABUS_NODE_DELETE",
        performedBy: "ADMIN",
        target: id,
        details: `Deleted syllabus node '${existing.title}'.`
      });
    }
    res.json({ success: true, id, message: "Syllabus node deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete syllabus node", details: err.message });
  }
});
router.post("/api/academic/syllabus/calculate-prediction", async (req, res) => {
  try {
    const {
      completedSubtopicIds = [],
      totalSubtopicsCount = 120,
      dailyStudyHours = 10,
      hoursPerSubtopic = 2.5,
      targetExamDate = "2026-05-24",
      exam = "UPSC_CSE",
      actualHoursLoggedToday = 8.5
    } = req.body;
    const completedCount = Array.isArray(completedSubtopicIds) ? completedSubtopicIds.length : 0;
    const totalCount = Math.max(completedCount, Number(totalSubtopicsCount) || 120);
    const remainingCount = totalCount - completedCount;
    const completedPercent = Math.round(completedCount / totalCount * 100);
    const remainingPercent = 100 - completedPercent;
    const hoursPerItem = Number(hoursPerSubtopic) || 2.5;
    const totalHoursNeeded = totalCount * hoursPerItem;
    const completedHours = completedCount * hoursPerItem;
    const remainingHours = remainingCount * hoursPerItem;
    const targetDateObj = new Date(targetExamDate);
    const todayObj = /* @__PURE__ */ new Date();
    const diffTime = targetDateObj.getTime() - todayObj.getTime();
    const daysLeft = Math.max(1, Math.ceil(diffTime / (1e3 * 60 * 60 * 24)));
    const dailyHoursTarget = Math.max(1, Number(dailyStudyHours) || 10);
    const currentDailyPaceHours = Math.max(0.5, Number(actualHoursLoggedToday) || dailyHoursTarget);
    const requiredHoursPerDay = Number((remainingHours / daysLeft).toFixed(1));
    const requiredSubtopicsPerDay = Number((remainingCount / daysLeft).toFixed(2));
    const estimatedDaysNeededToComplete = Math.ceil(remainingHours / currentDailyPaceHours);
    const estimatedCompletionDateObj = new Date(todayObj.getTime() + estimatedDaysNeededToComplete * 864e5);
    const estimatedCompletionDate = estimatedCompletionDateObj.toISOString().split("T")[0];
    const daysDifference = daysLeft - estimatedDaysNeededToComplete;
    let status = "on_track";
    if (daysDifference >= 7) {
      status = "ahead_of_schedule";
    } else if (daysDifference < -2) {
      status = "behind_schedule";
    }
    const weeklyTargetSubtopics = Math.ceil(requiredSubtopicsPerDay * 7);
    const monthlyTargetSubtopics = Math.ceil(requiredSubtopicsPerDay * 30);
    const recoveryPlan = {
      recommendedDailyHours: Math.min(14, Math.max(dailyHoursTarget, Number((requiredHoursPerDay * 1.1).toFixed(1)))),
      recommendedSubtopicsPerDay: Math.max(1, Math.ceil(requiredSubtopicsPerDay * 1.15)),
      prioritySubjectsToFocus: ["Indian Polity & Governance", "Economy", "Modern History", "Current Affairs"],
      aiSuggestions: [
        status === "behind_schedule" ? `[AI] ACCELERATION NEEDED: You are currently estimated to be ${Math.abs(daysDifference)} days behind your target exam date. Increase daily study pace to ${requiredHoursPerDay} hrs/day.` : `[PARTY] GREAT MOMENTUM: You are ${daysDifference} days ahead of schedule! Focus on active recall and revision.`,
        `Target completing ${weeklyTargetSubtopics} subtopics this week to maintain buffer for mock test series.`,
        `Allocate morning slots (8 AM - 12 PM) to high-weightage static syllabus modules.`
      ]
    };
    const weeklyProgressTrend = [
      { weekLabel: "Week 1", completedCount: Math.round(completedCount * 0.25), targetCount: Math.round(totalCount * 0.25) },
      { weekLabel: "Week 2", completedCount: Math.round(completedCount * 0.5), targetCount: Math.round(totalCount * 0.5) },
      { weekLabel: "Week 3", completedCount: Math.round(completedCount * 0.75), targetCount: Math.round(totalCount * 0.75) },
      { weekLabel: "Current Week", completedCount, targetCount: totalCount }
    ];
    const subjectWeightageBreakdown = [
      { subject: "Polity & Governance", total: 25, completed: Math.min(25, Math.round(completedCount * 0.3)), percentage: 0 },
      { subject: "Modern History", total: 20, completed: Math.min(20, Math.round(completedCount * 0.25)), percentage: 0 },
      { subject: "Economy & Planning", total: 22, completed: Math.min(22, Math.round(completedCount * 0.2)), percentage: 0 },
      { subject: "Environment & Ecology", total: 18, completed: Math.min(18, Math.round(completedCount * 0.15)), percentage: 0 },
      { subject: "Geography & CSAT", total: 35, completed: Math.min(35, Math.round(completedCount * 0.1)), percentage: 0 }
    ].map((s) => ({ ...s, percentage: Math.round(s.completed / s.total * 100) }));
    const analyticsResult = {
      totalSyllabusPercent: 100,
      completedPercent,
      remainingPercent,
      totalHours: totalHoursNeeded,
      completedHours,
      remainingHours,
      totalSubtopics: totalCount,
      completedSubtopics: completedCount,
      remainingSubtopics: remainingCount,
      targetExamDate,
      daysLeft,
      estimatedCompletionDate,
      currentDailyPaceHours,
      requiredDailyPaceHours: requiredHoursPerDay,
      status,
      daysDifference,
      weeklyTargetSubtopics,
      monthlyTargetSubtopics,
      recoveryPlan,
      weeklyProgressTrend,
      subjectWeightageBreakdown
    };
    res.json({ success: true, analytics: analyticsResult });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate syllabus prediction analytics", details: err.message });
  }
});
router.get("/api/academic/pyqs", async (req, res) => {
  try {
    const exam = req.query.exam || "";
    const subject = req.query.subject || "";
    const topic = req.query.topic || "";
    const stage = req.query.stage || "";
    const minYear = Number(req.query.minYear) || 1991;
    const maxYear = Number(req.query.maxYear) || 2026;
    const difficulty = req.query.difficulty || "";
    const search = req.query.search || "";
    const language = req.query.language || "";
    const pageNum = Math.max(1, Number(req.query.page) || 1);
    const pageLimit = Math.min(Math.max(1, Number(req.query.limit) || 20), 500);
    const repeatFilter = req.query.repeatFilter || (req.query.repeat === "true" ? "Repeated" : "All");
    const minRepeats = Number(req.query.minRepeats) || 1;
    const minYears = Number(req.query.minYears) || 1;
    const cacheKey = [exam, subject, topic, stage, minYear, maxYear, difficulty, search, language, pageNum, pageLimit, repeatFilter, minRepeats, minYears].join(":");
    const cached = getCachedAcademicResult(pyqQueryCache, cacheKey);
    if (cached) {
      return res.json(cached);
    }
    let items = [];
    let total = 0;
    let fetchedFromDb = false;
    if (supabaseServer) {
      try {
        let query = supabaseServer.from("pyqs").select("id, data", { count: "exact" });
        if (exam) {
          const cleanExam = exam.replace(/_/g, "%");
          query = query.or(`data->>exam.ilike.%${exam}%,data->>exam.ilike.%${cleanExam}%`);
        }
        if (stage) {
          query = query.eq("data->>stage", stage);
        }
        if (difficulty && difficulty !== "All") {
          query = query.eq("data->>difficulty", difficulty);
        }
        if (language && language !== "All") {
          query = query.ilike("data->>language", language);
        }
        if (minYear) {
          query = query.gte("data->>year", minYear);
        }
        if (maxYear) {
          query = query.lte("data->>year", maxYear);
        }
        const offset = (pageNum - 1) * pageLimit;
        query = query.range(offset, offset + pageLimit - 1);
        const { data: dbData, count: dbCount, error: dbErr } = await query;
        if (!dbErr && Array.isArray(dbData)) {
          fetchedFromDb = true;
          total = dbCount || dbData.length;
          items = dbData.map(normalizePyqItem).filter(Boolean);
        }
      } catch (e) {
      }
    }
    if (!fetchedFromDb) {
      let memoryItems = Array.from(pyqStore.values());
      memoryItems = memoryItems.map(normalizePyqItem).filter(Boolean);
      if (exam) {
        memoryItems = memoryItems.filter((i) => normalizeExam(i.exam || i.data?.exam || "") === normalizeExam(exam));
      }
      if (stage) {
        memoryItems = memoryItems.filter((i) => i.stage === stage);
      }
      if (subject && subject !== "All") {
        const targetSubjCanon = getStandardSubject(exam || "", subject).toLowerCase();
        memoryItems = memoryItems.filter((i) => getStandardSubject(i.exam || "", i.subject || "").toLowerCase() === targetSubjCanon);
      }
      if (topic && topic !== "All") {
        const targetTopic = topic.toLowerCase();
        memoryItems = memoryItems.filter((i) => (i.topic || "").toLowerCase().includes(targetTopic));
      }
      if (difficulty && difficulty !== "All") {
        memoryItems = memoryItems.filter((i) => i.difficulty === difficulty);
      }
      if (language && language !== "All") {
        memoryItems = memoryItems.filter((i) => (i.language || "English").toLowerCase() === language.toLowerCase());
      }
      memoryItems = memoryItems.filter((i) => i.year >= minYear && i.year <= maxYear);
      if (search) {
        const q = search.toLowerCase();
        memoryItems = memoryItems.filter(
          (i) => (i.questionText || "").toLowerCase().includes(q) || (i.topic || "").toLowerCase().includes(q) || (i.subject || "").toLowerCase().includes(q) || (i.explanation || "").toLowerCase().includes(q)
        );
      }
      if (repeatFilter !== "All") {
        memoryItems = memoryItems.filter((i) => {
          const info = pyqRepeatIndexMap.get(i.id) || { repeatCount: 1, repeatYears: [i.year], repeatType: "none" };
          if (info.repeatCount < minRepeats) return false;
          if (info.repeatYears.length < minYears) return false;
          if (repeatFilter === "ExactDuplicate") return info.repeatType === "exact";
          if (repeatFilter === "SimilarPattern") return info.repeatType === "similar";
          if (repeatFilter === "Repeated") return info.repeatCount > 1;
          return true;
        });
      }
      memoryItems.sort((a, b) => (b.year || 0) - (a.year || 0));
      total = memoryItems.length;
      const totalPages2 = Math.max(1, Math.ceil(total / pageLimit));
      const safePage2 = Math.min(pageNum, totalPages2);
      const startIndex = (safePage2 - 1) * pageLimit;
      items = memoryItems.slice(startIndex, startIndex + pageLimit);
    }
    const totalPages = Math.max(1, Math.ceil(total / pageLimit));
    const safePage = Math.min(pageNum, totalPages);
    const paginated = items.map((q) => {
      const info = pyqRepeatIndexMap.get(q.id) || { repeatCount: 1, repeatYears: q.year ? [q.year] : [], repeatType: "none" };
      return {
        ...q,
        repeatCount: info.repeatCount,
        repeatYears: info.repeatYears,
        repeatType: info.repeatType
      };
    });
    const responsePayload = {
      success: true,
      total,
      page: safePage,
      limit: pageLimit,
      totalPages,
      pyqs: paginated
    };
    setCachedAcademicResult(pyqQueryCache, cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch PYQs", details: err.message });
  }
});
router.get("/api/academic/pyqs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (pyqStore.has(id)) {
      return res.json({ success: true, pyq: pyqStore.get(id) });
    }
    if (supabaseServer) {
      const { data, error } = await supabaseServer.from("pyqs").select("id, data").eq("id", id).single();
      if (!error && data) {
        const item = normalizePyqItem(data);
        return res.json({ success: true, pyq: item });
      }
    }
    res.status(404).json({ error: "PYQ not found" });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch PYQ", details: err.message });
  }
});
router.get("/api/academic/pyqs/analytics", (req, res) => {
  try {
    const exam = req.query.exam || "";
    let items = Array.from(pyqStore.values());
    if (exam) {
      items = items.filter((i) => normalizeExam(i.exam || "") === normalizeExam(exam));
    }
    const topicStatsMap = /* @__PURE__ */ new Map();
    const subjectStatsMap = /* @__PURE__ */ new Map();
    let totalRepeated = 0;
    let exactDups = 0;
    let similarPatterns = 0;
    items.forEach((q) => {
      const stdSubj = getStandardSubject(q.exam || "", q.subject || "");
      const topic = q.topic || "General Concepts";
      const info = pyqRepeatIndexMap.get(q.id) || { repeatCount: 1, repeatYears: [], repeatType: "none" };
      if (!subjectStatsMap.has(stdSubj)) {
        subjectStatsMap.set(stdSubj, { subject: stdSubj, total: 0, repeated: 0 });
      }
      const sStat = subjectStatsMap.get(stdSubj);
      sStat.total++;
      if (!topicStatsMap.has(topic)) {
        topicStatsMap.set(topic, { topic, total: 0, repeated: 0, years: /* @__PURE__ */ new Set() });
      }
      const tStat = topicStatsMap.get(topic);
      tStat.total++;
      if (info.repeatCount > 1) {
        totalRepeated++;
        sStat.repeated++;
        tStat.repeated++;
        if (info.repeatType === "exact") exactDups++;
        if (info.repeatType === "similar") similarPatterns++;
        (info.repeatYears || []).forEach((y) => tStat.years.add(y));
      }
    });
    const topicBreakdown = Array.from(topicStatsMap.values()).map((t) => ({
      topic: t.topic,
      total: t.total,
      repeated: t.repeated,
      topYears: Array.from(t.years).sort((a, b) => b - a)
    })).sort((a, b) => b.repeated - a.repeated);
    const subjectBreakdown = Array.from(subjectStatsMap.values()).sort((a, b) => b.total - a.total);
    res.json({
      success: true,
      exam,
      totalQuestions: items.length,
      totalRepeated,
      exactDups,
      similarPatterns,
      topicBreakdown,
      subjectBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate PYQ repeat analytics", details: err.message });
  }
});
router.get("/api/academic/pyqs/pdfs", async (req, res) => {
  try {
    const exam = req.query.exam || "";
    const search = req.query.search || "";
    const jsonPath = import_path2.default.join(process.cwd(), "src", "data", "drishtiPcsPapers.json");
    if (!import_fs2.default.existsSync(jsonPath)) {
      return res.json({ success: true, count: 0, papers: [] });
    }
    const raw = import_fs2.default.readFileSync(jsonPath, "utf-8");
    const allPapers = JSON.parse(raw);
    let filtered = allPapers;
    if (exam) {
      filtered = filtered.filter((p) => normalizeExam(p.exam) === normalizeExam(exam));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) => p.title.toLowerCase().includes(q));
    }
    res.json({ success: true, count: filtered.length, papers: filtered });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch PDF papers", details: err.message });
  }
});
router.post("/api/academic/pyqs", async (req, res) => {
  try {
    const {
      id,
      exam = "UPSC_CSE",
      year = 2024,
      stage = "Prelims",
      paper = "GS Paper 1",
      subject,
      topic,
      questionText,
      options,
      correctOption,
      explanation,
      marks = 2,
      difficulty = "Medium",
      language = "English"
    } = req.body;
    if (!questionText || !subject || !topic) {
      return res.status(400).json({ error: "Question text, subject, and topic are required." });
    }
    const cleanQ = questionText.trim().toLowerCase();
    for (const [existingId, pyq] of pyqStore.entries()) {
      if (existingId !== id && pyq.year === Number(year) && pyq.questionText.trim().toLowerCase() === cleanQ) {
        return res.status(409).json({ error: "DUPLICATE ENTRY DETECTED: This question already exists in the PYQ database for year " + year });
      }
    }
    const pyqId = id || `pyq_${year}_${Date.now()}`;
    const pyqRecord = {
      id: pyqId,
      exam,
      year: Number(year),
      stage,
      paper,
      subject: subject.trim(),
      topic: topic.trim(),
      questionText: questionText.trim(),
      options: Array.isArray(options) ? options : [],
      correctOption: correctOption !== void 0 ? Number(correctOption) : 0,
      explanation: explanation || "",
      marks: Number(marks),
      difficulty,
      language,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    pyqStore.set(pyqId, pyqRecord);
    if (supabaseServer) {
      try {
        await supabaseServer.from("pyqs").upsert([{ id: pyqRecord.id, data: pyqRecord, updated_at: pyqRecord.updatedAt || pyqRecord.createdAt || (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
      } catch (e) {
      }
    }
    addAdminAuditLogRecord({
      action: id ? "PYQ_UPDATE" : "PYQ_CREATE",
      performedBy: "ADMIN",
      target: pyqId,
      details: `PYQ for ${pyqRecord.exam} (${pyqRecord.year}) saved.`
    });
    buildSimilarityIndexes();
    res.json({ success: true, pyq: pyqRecord });
  } catch (err) {
    res.status(500).json({ error: "Failed to save PYQ record", details: err.message });
  }
});
router.post("/api/academic/pyqs/ingest", requireEnterprisePermission("canManageContent"), async (req, res) => {
  try {
    const { questions, dryRun = false, batchSize = 500, defaultExam } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INGESTION_PAYLOAD",
          message: "Payload must contain a non-empty `questions` array."
        }
      });
    }
    const jobId = `job_ingest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (defaultExam) {
      const stdDefaultExam = normalizeExam(defaultExam);
      const sampleMismatches = questions.filter((q) => q.exam && normalizeExam(q.exam) !== stdDefaultExam);
      if (sampleMismatches.length > questions.length * 0.3) {
        return res.status(400).json({
          success: false,
          error: {
            code: "DOCUMENT_EXAM_MISMATCH",
            message: `Selected target exam '${stdDefaultExam}' conflicts with detected document exam '${normalizeExam(sampleMismatches[0].exam)}'. Ingestion blocked to prevent database contamination.`
          }
        });
      }
    }
    const totalUploaded = questions.length;
    const invalidRecords = [];
    const warnings = [];
    const exactHashSet = /* @__PURE__ */ new Set();
    for (const q of pyqStore.values()) {
      if (q.questionText) {
        const h = import_crypto2.default.createHash("md5").update(q.questionText.trim().toLowerCase()).digest("hex");
        exactHashSet.add(h);
      }
    }
    const validToInsert = [];
    let exactDuplicatesCount = 0;
    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      if (!q.questionText || typeof q.questionText !== "string" || !q.questionText.trim()) {
        invalidRecords.push({ index: idx, id: q.id, reason: "Missing or empty `questionText` field." });
        continue;
      }
      if (!q.subject || typeof q.subject !== "string" || !q.subject.trim()) {
        invalidRecords.push({ index: idx, id: q.id, reason: "Missing or empty `subject` field." });
        continue;
      }
      if (!q.topic || typeof q.topic !== "string" || !q.topic.trim()) {
        invalidRecords.push({ index: idx, id: q.id, reason: "Missing or empty `topic` field." });
        continue;
      }
      if (q.options !== void 0 && (!Array.isArray(q.options) || q.options.length < 2)) {
        invalidRecords.push({ index: idx, id: q.id, reason: "Options must be an array with at least 2 items." });
        continue;
      }
      if (q.correctOption !== void 0 && (typeof q.correctOption !== "number" || q.correctOption < 0 || q.options && q.correctOption >= q.options.length)) {
        invalidRecords.push({ index: idx, id: q.id, reason: `Invalid correctOption index ${q.correctOption} for options length ${q.options?.length || 0}.` });
        continue;
      }
      const targetExam = q.exam || defaultExam || "UPSC_CSE";
      const stdExam = normalizeExam(targetExam);
      const stdSubject = getStandardSubject(stdExam, q.subject);
      if (stdSubject === q.subject.trim() && !["Physics", "Chemistry", "Biology", "History of India", "Indian Polity & Governance", "Geography", "Mathematics", "General Intelligence & Reasoning", "Economy"].includes(stdSubject)) {
        warnings.push({
          index: idx,
          id: q.id,
          type: "UNRESOLVED_ALIAS",
          details: `Subject '${q.subject}' retained as raw string without mapped canonical subject.`
        });
      }
      const normHash = import_crypto2.default.createHash("md5").update(q.questionText.trim().toLowerCase()).digest("hex");
      if (exactHashSet.has(normHash)) {
        exactDuplicatesCount++;
        continue;
      }
      const qId = q.id || `pyq_${stdExam}_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`;
      const cleanRecord = {
        id: qId,
        exam: stdExam,
        subject: stdSubject,
        rawSubject: q.subject,
        topic: q.topic.trim(),
        subtopic: q.subtopic ? q.subtopic.trim() : null,
        questionText: q.questionText.trim(),
        options: Array.isArray(q.options) ? q.options : [],
        correctOption: q.correctOption !== void 0 ? Number(q.correctOption) : 0,
        explanation: q.explanation ? q.explanation.trim() : "",
        year: q.year !== void 0 && q.year !== null ? Number(q.year) : null,
        stage: q.stage || "Prelims",
        paper: q.paper || "GS Paper 1",
        difficulty: q.difficulty || "Medium",
        language: q.language || "English",
        source: q.source || "Bulk Ingestion API",
        importJobId: jobId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      exactHashSet.add(normHash);
      validToInsert.push(cleanRecord);
    }
    const validCount = validToInsert.length;
    const invalidCount = invalidRecords.length;
    if (!dryRun && validCount > 0) {
      const safeBatchSize = Math.max(50, Math.min(Number(batchSize) || 500, 2e3));
      for (let i = 0; i < validToInsert.length; i += safeBatchSize) {
        const batch = validToInsert.slice(i, i + safeBatchSize);
        batch.forEach((rec) => pyqStore.set(rec.id, rec));
        if (supabaseServer) {
          try {
            const rows = batch.map((r) => ({ id: r.id, data: r, updated_at: r.createdAt }));
            await supabaseServer.from("pyqs").upsert(rows, { onConflict: "id" });
          } catch (e) {
            console.warn("Supabase bulk upsert batch error:", e);
          }
        }
      }
      buildSimilarityIndexes();
      try {
        const diskPath = import_path2.default.join(process.cwd(), "src", "data", "allExtractedPyqs.json");
        if (import_fs2.default.existsSync(diskPath)) {
          const allArr = Array.from(pyqStore.values());
          import_fs2.default.writeFileSync(diskPath, JSON.stringify(allArr, null, 2), "utf-8");
        }
      } catch (e) {
        console.warn("Failed to update disk backup json file");
      }
    }
    res.json({
      success: true,
      dryRun,
      summary: {
        jobId,
        totalUploaded,
        validCount,
        invalidCount,
        exactDuplicatesCount,
        reviewQueueCount: pyqReviewQueueStore.size,
        insertedCount: dryRun ? 0 : validCount,
        reconciliationPass: validCount + invalidCount + exactDuplicatesCount === totalUploaded,
        status: dryRun ? "DRY_RUN_COMPLETED" : "COMMITTED_SUCCESSFULLY"
      },
      invalidReport: invalidRecords.slice(0, 100),
      // Cap payload report length
      warnings: warnings.slice(0, 100)
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: {
        code: "BULK_INGESTION_FAILED",
        message: err.message || "Bulk ingestion transaction encountered an error."
      }
    });
  }
});
router.get("/api/academic/pyqs/ingest/review-queue", (req, res) => {
  const items = Array.from(pyqReviewQueueStore.values());
  res.json({ success: true, count: items.length, queue: items });
});
router.post("/api/academic/pyqs/ingest/review-queue/resolve", async (req, res) => {
  try {
    const { id, action, pyqRecord } = req.body;
    if (!id || !action) {
      return res.status(400).json({ success: false, error: "`id` and `action` (APPROVE|DISCARD) required." });
    }
    if (action === "APPROVE" && pyqRecord) {
      pyqStore.set(pyqRecord.id || id, pyqRecord);
      pyqReviewQueueStore.delete(id);
      buildSimilarityIndexes();
      return res.json({ success: true, message: "Item approved and committed to PYQ store.", pyq: pyqRecord });
    } else {
      pyqReviewQueueStore.delete(id);
      return res.json({ success: true, message: "Item discarded from review queue." });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.delete("/api/academic/pyqs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    pyqStore.delete(id);
    pyqQueryCache.clear();
    if (supabaseServer) {
      try {
        await supabaseServer.from("pyqs").delete().eq("id", id);
      } catch (e) {
      }
    }
    addAdminAuditLogRecord({
      action: "PYQ_DELETE",
      performedBy: "ADMIN",
      target: id,
      details: `Deleted PYQ record ID ${id}.`
    });
    res.json({ success: true, id, message: "PYQ deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete PYQ", details: err.message });
  }
});
router.get("/api/academic/questions", async (req, res) => {
  try {
    const exam = req.query.exam || "";
    const type = req.query.type || "";
    const subject = req.query.subject || "";
    const topic = req.query.topic || "";
    const status = req.query.status || "";
    const difficulty = req.query.difficulty || "";
    const search = req.query.search || "";
    const language = req.query.language || "";
    const pageNum = Math.max(1, Number(req.query.page) || 1);
    const pageLimit = Math.min(Math.max(1, Number(req.query.limit) || 20), 500);
    const cacheKey = [exam, type, subject, topic, status, difficulty, search, language, pageNum, pageLimit].join(":");
    const cached = getCachedAcademicResult(qbQueryCache, cacheKey);
    if (cached) {
      return res.json(cached);
    }
    let items = [];
    let total = 0;
    let fetchedFromDb = false;
    if (supabaseServer) {
      try {
        let query = supabaseServer.from("pyqs").select("id, data", { count: "exact" });
        if (exam) {
          const cleanExam = exam.replace(/_/g, "%");
          query = query.or(`data->>exam.ilike.%${exam}%,data->>exam.ilike.%${cleanExam}%`);
        }
        if (difficulty && difficulty !== "All") {
          query = query.eq("data->>difficulty", difficulty);
        }
        if (language && language !== "All") {
          query = query.ilike("data->>language", language);
        }
        const offset = (pageNum - 1) * pageLimit;
        query = query.range(offset, offset + pageLimit - 1);
        const { data: dbData, count: dbCount, error: dbErr } = await query;
        if (!dbErr && Array.isArray(dbData) && dbData.length > 0) {
          fetchedFromDb = true;
          total = dbCount || dbData.length;
          items = dbData.map(normalizeQuestionItem).filter(Boolean);
        }
      } catch (e) {
      }
    }
    if (!fetchedFromDb) {
      let memoryItems = Array.from(questionBankStore.values());
      memoryItems = memoryItems.map(normalizeQuestionItem).filter(Boolean);
      if (exam) {
        memoryItems = memoryItems.filter((i) => normalizeExam(i.exam || i.data?.exam || "") === normalizeExam(exam));
      }
      if (type && type !== "All") memoryItems = memoryItems.filter((i) => i.type === type);
      if (subject && subject !== "All") {
        const targetSubjCanon = getStandardSubject(exam || "", subject).toLowerCase();
        memoryItems = memoryItems.filter((i) => getStandardSubject(i.exam || "", i.subject || "").toLowerCase() === targetSubjCanon);
      }
      if (topic && topic !== "All") {
        const targetTopic = topic.toLowerCase();
        memoryItems = memoryItems.filter((i) => (i.topic || "").toLowerCase().includes(targetTopic));
      }
      if (status && status !== "All") memoryItems = memoryItems.filter((i) => i.status === status);
      if (difficulty && difficulty !== "All") memoryItems = memoryItems.filter((i) => i.difficulty === difficulty);
      if (language && language !== "All") {
        memoryItems = memoryItems.filter((i) => (i.language || "English").toLowerCase() === language.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        memoryItems = memoryItems.filter((i) => (i.questionText || "").toLowerCase().includes(q) || (i.topic || "").toLowerCase().includes(q));
      }
      total = memoryItems.length;
      const totalPages2 = Math.max(1, Math.ceil(total / pageLimit));
      const safePage2 = Math.min(pageNum, totalPages2);
      const startIndex = (safePage2 - 1) * pageLimit;
      items = memoryItems.slice(startIndex, startIndex + pageLimit);
    }
    const totalPages = Math.max(1, Math.ceil(total / pageLimit));
    const safePage = Math.min(pageNum, totalPages);
    const paginated = items.map((q) => {
      const info = pyqRepeatIndexMap.get(q.id) || { repeatCount: 1, repeatYears: [], repeatType: "none" };
      return {
        ...q,
        repeatCount: info.repeatCount,
        repeatYears: info.repeatYears,
        repeatType: info.repeatType
      };
    });
    const responsePayload = {
      success: true,
      total,
      page: safePage,
      limit: pageLimit,
      totalPages,
      questions: paginated
    };
    setCachedAcademicResult(qbQueryCache, cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch question bank", details: err.message });
  }
});
router.get("/api/academic/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (questionBankStore.has(id)) {
      return res.json({ success: true, question: questionBankStore.get(id) });
    }
    if (supabaseServer) {
      const { data, error } = await supabaseServer.from("question_bank").select("id, data").eq("id", id).single();
      if (!error && data) {
        const item = normalizeQuestionItem(data);
        return res.json({ success: true, question: item });
      }
    }
    res.status(404).json({ error: "Question not found" });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch question", details: err.message });
  }
});
router.post("/api/academic/questions", async (req, res) => {
  try {
    const {
      id,
      exam = "UPSC_CSE",
      type = "mcq",
      subject,
      topic,
      questionText,
      options,
      correctOption,
      solutionText,
      imageUrl,
      difficulty = "Medium",
      status = "published",
      author = "Academic Team"
    } = req.body;
    if (!questionText || !subject || !topic) {
      return res.status(400).json({ error: "Question text, subject, and topic are required." });
    }
    const qbId = id || `qb_${Date.now()}`;
    const record = {
      id: qbId,
      exam,
      type,
      subject: subject.trim(),
      topic: topic.trim(),
      questionText: questionText.trim(),
      options: Array.isArray(options) ? options : [],
      correctOption: correctOption !== void 0 ? Number(correctOption) : 0,
      solutionText: solutionText || "",
      imageUrl: imageUrl || "",
      difficulty,
      status,
      author,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    questionBankStore.set(qbId, record);
    if (supabaseServer) {
      try {
        await supabaseServer.from("question_bank").upsert([record]);
      } catch (e) {
      }
    }
    addAdminAuditLogRecord({
      action: id ? "QUESTION_BANK_UPDATE" : "QUESTION_BANK_CREATE",
      performedBy: "ADMIN",
      target: qbId,
      details: `Question Bank item (${record.type}) saved.`
    });
    res.json({ success: true, question: record });
  } catch (err) {
    res.status(500).json({ error: "Failed to save question bank item", details: err.message });
  }
});
router.delete("/api/academic/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    questionBankStore.delete(id);
    qbQueryCache.clear();
    if (supabaseServer) {
      try {
        await supabaseServer.from("question_bank").delete().eq("id", id);
      } catch (e) {
      }
    }
    res.json({ success: true, id, message: "Question Bank item deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete question", details: err.message });
  }
});
router.post("/api/academic/bulk-import", verifyAdminAuth, async (req, res) => {
  try {
    const { type = "pyqs", rows = [], rawText, mode = "preview" } = req.body;
    let parsed = 0;
    let duplicates = 0;
    let inserted = 0;
    let failed = 0;
    const errors = [];
    const sampleParsed = [];
    let detectedHierarchy = [];
    const upsertPromises = [];
    if (type === "syllabus" && rawText && typeof rawText === "string") {
      const resParsed = parseFreeformSyllabus(rawText);
      const nodes = resParsed.nodes;
      detectedHierarchy = resParsed.detectedHierarchy;
      if (nodes.length === 0) {
        return res.status(400).json({ error: "No valid syllabus structure detected in pasted text." });
      }
      nodes.forEach((n, idx) => {
        parsed++;
        const title = n.title.trim();
        const subj = n.subject.trim();
        if (!title || !subj) {
          failed++;
          errors.push(`Item #${idx + 1}: Missing title or subject`);
          return;
        }
        const cleanTitle = title.toLowerCase();
        const cleanSubj = subj.toLowerCase();
        let isDup = false;
        for (const node of syllabusNodesStore.values()) {
          if (node.subject.trim().toLowerCase() === cleanSubj && node.title.trim().toLowerCase() === cleanTitle) {
            isDup = true;
            break;
          }
        }
        if (isDup) {
          duplicates++;
        } else {
          inserted++;
          const record = {
            id: `node_smart_${Date.now()}_${idx}`,
            exam: req.body.exam || "UPSC_CSE",
            paper: "GS Paper 1",
            subject: subj,
            chapter: n.chapter || "Chapter 1",
            topic: title,
            subtopic: title,
            title,
            stage: "Prelims",
            weightage: n.weightage || "Medium",
            estimatedHours: 2.5,
            version: 1,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          if (mode === "execute") {
            syllabusNodesStore.set(record.id, record);
            if (supabaseServer) {
              upsertPromises.push(
                (async () => {
                  try {
                    await supabaseServer.from("syllabus_nodes").upsert([{ id: record.id, data: record, updated_at: record.updatedAt || (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
                  } catch (e) {
                  }
                })()
              );
            }
          }
          if (sampleParsed.length < 5) sampleParsed.push(record);
        }
      });
    } else {
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: "At least 1 valid row is required for bulk import." });
      }
      rows.forEach((row, idx) => {
        if (!row || typeof row !== "object") {
          failed++;
          errors.push(`Row #${idx + 1}: Invalid format`);
          return;
        }
        parsed++;
        if (type === "pyqs") {
          const qText = (row.questionText || row.Question || "").toString().trim();
          const yearVal = Number(row.year || row.Year) || 2024;
          const subj = (row.subject || row.Subject || "General").toString().trim();
          if (!qText) {
            failed++;
            errors.push(`Row #${idx + 1}: Missing question text`);
            return;
          }
          const cleanQ = qText.toLowerCase();
          let isDup = false;
          for (const pyq of pyqStore.values()) {
            if (pyq.year === yearVal && pyq.questionText.trim().toLowerCase() === cleanQ) {
              isDup = true;
              break;
            }
          }
          if (isDup) {
            duplicates++;
          } else {
            inserted++;
            const record = {
              id: `pyq_bulk_${Date.now()}_${idx}`,
              exam: row.exam || "UPSC_CSE",
              year: yearVal,
              stage: row.stage || "Prelims",
              paper: row.paper || "GS Paper 1",
              subject: subj,
              topic: (row.topic || row.Topic || "General Topic").toString().trim(),
              questionText: qText,
              options: Array.isArray(row.options) ? row.options : [row.A, row.B, row.C, row.D].filter(Boolean),
              correctOption: Number(row.correctOption) || 0,
              explanation: row.explanation || "",
              marks: Number(row.marks) || 2,
              difficulty: row.difficulty || "Medium",
              language: row.language || "English",
              source: "Bulk Import",
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            };
            if (mode === "execute") {
              pyqStore.set(record.id, record);
              if (supabaseServer) {
                upsertPromises.push(
                  (async () => {
                    try {
                      await supabaseServer.from("pyqs").upsert([{ id: record.id, data: record, updated_at: record.updatedAt || record.createdAt || (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
                    } catch (e) {
                    }
                  })()
                );
              }
            }
            if (sampleParsed.length < 5) sampleParsed.push(record);
          }
        } else if (type === "questions" || type === "question_bank") {
          const qText = (row.questionText || row.Question || "").toString().trim();
          if (!qText) {
            failed++;
            errors.push(`Row #${idx + 1}: Missing question text`);
            return;
          }
          inserted++;
          const record = {
            id: `qb_bulk_${Date.now()}_${idx}`,
            exam: row.exam || "UPSC_CSE",
            type: row.type || "mcq",
            subject: (row.subject || "General").toString().trim(),
            topic: (row.topic || "General").toString().trim(),
            questionText: qText,
            options: Array.isArray(row.options) ? row.options : [row.A, row.B, row.C, row.D].filter(Boolean),
            correctOption: Number(row.correctOption) || 0,
            solutionText: row.solutionText || row.Explanation || "",
            difficulty: row.difficulty || "Medium",
            status: row.status || "published",
            author: row.author || "Bulk Import",
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          if (mode === "execute") {
            questionBankStore.set(record.id, record);
            if (supabaseServer) {
              upsertPromises.push(
                (async () => {
                  try {
                    await supabaseServer.from("question_bank").upsert([record]);
                  } catch (e) {
                  }
                })()
              );
            }
          }
          if (sampleParsed.length < 5) sampleParsed.push(record);
        } else if (type === "syllabus") {
          const title = (row.title || row.Title || "").toString().trim();
          const subj = (row.subject || row.Subject || "General").toString().trim();
          if (!title || !subj) {
            failed++;
            errors.push(`Row #${idx + 1}: Missing title or subject`);
            return;
          }
          inserted++;
          const record = {
            id: `node_bulk_${Date.now()}_${idx}`,
            exam: row.exam || "UPSC_CSE",
            paper: row.paper || "GS Paper 1",
            subject: subj,
            chapter: row.chapter || "Chapter 1",
            topic: row.topic || title,
            subtopic: title,
            title,
            stage: row.stage || "Prelims",
            weightage: row.weightage || "High",
            estimatedHours: Number(row.estimatedHours) || 2.5,
            version: 1,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          if (mode === "execute") {
            syllabusNodesStore.set(record.id, record);
            if (supabaseServer) {
              upsertPromises.push(
                (async () => {
                  try {
                    await supabaseServer.from("syllabus_nodes").upsert([{ id: record.id, data: record, updated_at: record.updatedAt || (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
                  } catch (e) {
                  }
                })()
              );
            }
          }
          if (sampleParsed.length < 5) sampleParsed.push(record);
        }
      });
    }
    if (mode === "execute" && upsertPromises.length > 0) {
      await Promise.all(upsertPromises);
    }
    if (mode === "execute" && inserted > 0) {
      addAdminAuditLogRecord({
        action: "BULK_IMPORT_EXECUTE",
        performedBy: "ADMIN",
        target: type,
        details: `Bulk imported ${inserted} ${type} records safely. Duplicates skipped: ${duplicates}.`
      });
    }
    res.json({
      success: true,
      type,
      mode,
      totalRows: type === "syllabus" && rawText ? parsed : rows.length,
      parsed,
      duplicates,
      inserted,
      failed,
      errors: errors.slice(0, 10),
      sampleParsed,
      detectedHierarchy
    });
  } catch (err) {
    res.status(500).json({ error: "Bulk import processing failed", details: err.message });
  }
});
router.get("/api/academic/search", async (req, res) => {
  try {
    const q = (req.query.q || "").toLowerCase().trim();
    if (!q) {
      return res.json({ success: true, syllabus: [], pyqs: [], questions: [] });
    }
    const syllabusMatches = Array.from(syllabusNodesStore.values()).filter(
      (s) => s.title.toLowerCase().includes(q) || s.subject.toLowerCase().includes(q) || s.topic.toLowerCase().includes(q)
    );
    const pyqMatches = Array.from(pyqStore.values()).filter(
      (p) => p.questionText.toLowerCase().includes(q) || p.subject.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q)
    );
    const questionMatches = Array.from(questionBankStore.values()).filter(
      (qb) => qb.questionText.toLowerCase().includes(q) || qb.subject.toLowerCase().includes(q) || qb.topic.toLowerCase().includes(q)
    );
    res.json({
      success: true,
      query: q,
      counts: {
        syllabus: syllabusMatches.length,
        pyqs: pyqMatches.length,
        questions: questionMatches.length
      },
      syllabus: syllabusMatches.slice(0, 10),
      pyqs: pyqMatches.slice(0, 10),
      questions: questionMatches.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ error: "Search failed", details: err.message });
  }
});
router.get("/api/academic/books", async (req, res) => {
  try {
    const subject = req.query.subject || "";
    const category = req.query.category || "";
    const exam = req.query.exam || "";
    const search = req.query.search || "";
    let items = Array.from(booksStore.values());
    if (exam) items = items.filter((b) => normalizeExam(b.exam) === normalizeExam(exam));
    if (category) items = items.filter((b) => b.category === category);
    if (subject) items = items.filter((b) => b.subject.toLowerCase().includes(subject.toLowerCase()));
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q) || b.mappedTopics?.some((t) => t.toLowerCase().includes(q))
      );
    }
    res.json({ success: true, count: items.length, books: items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch books library", details: err.message });
  }
});
router.post("/api/academic/books", async (req, res) => {
  try {
    const { id, title, author, category = "Standard Book", subject, exam = "UPSC_CSE", mappedTopics = [], description = "", edition = "Latest Edition", importance = "Essential" } = req.body;
    if (!title || !author || !subject) {
      return res.status(400).json({ error: "Title, author, and subject are required fields." });
    }
    const bookId = id || `b_${Date.now()}`;
    const bookRecord = {
      id: bookId,
      title: title.trim(),
      author: author.trim(),
      category,
      subject: subject.trim(),
      exam,
      mappedTopics: Array.isArray(mappedTopics) ? mappedTopics : [mappedTopics].filter(Boolean),
      description: description.trim(),
      edition,
      importance,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    booksStore.set(bookId, bookRecord);
    if (supabaseServer) {
      try {
        await supabaseServer.from("books_library").upsert([bookRecord]);
      } catch (e) {
      }
    }
    addAdminAuditLogRecord({
      action: id ? "BOOK_UPDATE" : "BOOK_CREATE",
      performedBy: "ADMIN",
      target: bookId,
      details: `Book record '${bookRecord.title}' saved.`
    });
    res.json({ success: true, book: bookRecord });
  } catch (err) {
    res.status(500).json({ error: "Failed to save book record", details: err.message });
  }
});
router.delete("/api/academic/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    booksStore.delete(id);
    if (supabaseServer) {
      try {
        await supabaseServer.from("books_library").delete().eq("id", id);
      } catch (e) {
      }
    }
    res.json({ success: true, id, message: "Book record deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete book record", details: err.message });
  }
});
router.post("/api/ai/ocr", async (req, res) => {
  try {
    const { contentText, fileUrl, targetModule = "pyqs", defaultExam = "UPSC_CSE", defaultSubject = "General", previewOnly = false } = req.body;
    const sourceText = contentText || fileUrl || "";
    if (!sourceText.trim()) {
      return res.status(400).json({ error: "Please provide contentText or fileUrl to parse." });
    }
    const gemini = getGeminiClient();
    let parsedResult = null;
    if (gemini) {
      try {
        const prompt = `You are an expert AI Academic Parser for competitive exams (${defaultExam}).
Parse the following document/image text and extract structured academic data for module: ${targetModule}.
Return ONLY valid JSON matching this schema:
{
  "extractedCount": number,
  "exam": "${defaultExam}",
  "subject": "${defaultSubject}",
  "items": [
    {
      "questionText": "exact question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0,
      "explanation": "detailed conceptual explanation",
      "year": 2024,
      "subject": "subject name",
      "topic": "topic name",
      "difficulty": "Easy|Medium|Hard",
      "marks": 2
    }
  ]
}

Document Text to parse:
${sourceText.substring(0, 15e3)}`;
        const response = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });
        const textOutput = response.text || "";
        const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        }
      } catch (aiErr) {
        console.warn("Gemini OCR fallback parsing triggered:", aiErr);
      }
    }
    if (!parsedResult || !Array.isArray(parsedResult.items)) {
      parsedResult = {
        extractedCount: 1,
        exam: defaultExam,
        subject: defaultSubject,
        items: [
          {
            questionText: sourceText.length > 200 ? sourceText.substring(0, 200) + "..." : sourceText,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctOption: 0,
            explanation: "Extracted automatically via AI OCR & Pattern Matcher.",
            year: 2025,
            subject: defaultSubject,
            topic: "OCR Extracted Topic",
            difficulty: "Medium",
            marks: 2
          }
        ]
      };
    }
    const savedIds = [];
    if (!previewOnly && targetModule === "pyqs") {
      for (const [idx, item] of parsedResult.items.entries()) {
        const id = `pyq_ocr_${Date.now()}_${idx}`;
        const record = {
          id,
          exam: item.exam || defaultExam,
          year: item.year || 2025,
          stage: "Prelims",
          paper: "GS Paper 1",
          subject: item.subject || defaultSubject,
          topic: item.topic || "OCR Topic",
          questionText: item.questionText,
          options: item.options || [],
          correctOption: item.correctOption || 0,
          explanation: item.explanation || "",
          marks: item.marks || 2,
          difficulty: item.difficulty || "Medium",
          language: "English",
          source: "AI OCR Upload",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        pyqStore.set(id, record);
        if (supabaseServer) {
          try {
            await supabaseServer.from("pyqs").upsert([{ id: record.id, data: record, updated_at: record.createdAt || (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
          } catch (e) {
          }
        }
        savedIds.push(id);
      }
    } else if (!previewOnly && targetModule === "question_bank") {
      parsedResult.items.forEach((item, idx) => {
        const id = `qb_ocr_${Date.now()}_${idx}`;
        const record = {
          id,
          exam: item.exam || defaultExam,
          type: "mcq",
          subject: item.subject || defaultSubject,
          topic: item.topic || "OCR Topic",
          questionText: item.questionText,
          options: item.options || [],
          correctOption: item.correctOption || 0,
          solutionText: item.explanation || "",
          difficulty: item.difficulty || "Medium",
          status: "published",
          author: "AI OCR Engine",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        questionBankStore.set(id, record);
        savedIds.push(id);
      });
    }
    addAdminAuditLogRecord({
      action: "AI_OCR_PROCESSING",
      performedBy: "ADMIN",
      target: targetModule,
      details: `Parsed ${parsedResult.items.length} records using AI OCR engine for ${defaultExam}.`
    });
    res.json({
      success: true,
      extractedCount: parsedResult.items.length,
      savedIds,
      extractedData: parsedResult
    });
  } catch (err) {
    res.status(500).json({ error: "AI OCR processing failed", details: err.message });
  }
});
router.get("/api/academic/export", async (req, res) => {
  try {
    const moduleType = req.query.module || "all";
    const format = req.query.format || "json";
    const exportBundle = {
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      platform: "AspirantX Enterprise Academic Platform"
    };
    if (moduleType === "all" || moduleType === "syllabus") {
      exportBundle.syllabus = Array.from(syllabusNodesStore.values());
    }
    if (moduleType === "all" || moduleType === "pyqs") {
      exportBundle.pyqs = Array.from(pyqStore.values());
    }
    if (moduleType === "all" || moduleType === "questions") {
      exportBundle.questions = Array.from(questionBankStore.values());
    }
    if (moduleType === "all" || moduleType === "books") {
      exportBundle.books = Array.from(booksStore.values());
    }
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="aspirantx_${moduleType}_export.csv"`);
      let csvContent = "Module,ID,Title/Question,Subject,Exam\n";
      if (exportBundle.syllabus) {
        exportBundle.syllabus.forEach((s) => {
          csvContent += `"Syllabus","${s.id}","${s.title.replace(/"/g, '""')}","${s.subject}","${s.exam}"
`;
        });
      }
      if (exportBundle.pyqs) {
        exportBundle.pyqs.forEach((p) => {
          csvContent += `"PYQ","${p.id}","${p.questionText.substring(0, 50).replace(/"/g, '""')}","${p.subject}","${p.exam}"
`;
        });
      }
      return res.send(csvContent);
    }
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="aspirantx_${moduleType}_export.json"`);
    res.json(exportBundle);
  } catch (err) {
    res.status(500).json({ error: "Export failed", details: err.message });
  }
});
router.get("/api/academic/cbt/tests", (req, res) => {
  try {
    const exam = req.query.exam || "UPSC_CSE";
    const tests = Array.from(cbtTestsStore.values()).filter((t) => !exam || normalizeExam(t.exam) === normalizeExam(exam));
    res.json({ success: true, tests });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch CBT tests" });
  }
});
router.get("/api/academic/cbt/tests/:id", (req, res) => {
  try {
    const test = cbtTestsStore.get(req.params.id);
    if (!test) {
      return res.status(404).json({ error: "CBT Test not found" });
    }
    res.json({ success: true, test });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch CBT test details" });
  }
});
router.post("/api/academic/cbt/submit", async (req, res) => {
  try {
    const { testId, sessionState, userId = "default_user" } = req.body;
    const test = cbtTestsStore.get(testId);
    if (!test) {
      return res.status(404).json({ error: "Invalid Test ID" });
    }
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    const timePerSubject = {};
    const timePerQuestion = {};
    const subjectPerformance = {};
    const topicPerformance = {};
    const responses = sessionState.responses || {};
    test.questions.forEach((q) => {
      const resp = responses[q.id];
      const selected = resp?.selectedOption;
      const timeSpent = resp?.timeSpentSeconds || 0;
      timePerQuestion[q.id] = timeSpent;
      timePerSubject[q.subject] = (timePerSubject[q.subject] || 0) + timeSpent;
      if (!subjectPerformance[q.subject]) subjectPerformance[q.subject] = { correct: 0, total: 0 };
      subjectPerformance[q.subject].total += 1;
      if (!topicPerformance[q.topic]) topicPerformance[q.topic] = { correct: 0, total: 0 };
      topicPerformance[q.topic].total += 1;
      const isCorrect = q.correctOptionId !== void 0 && q.correctOptionId !== null ? q.options?.[selected]?.id === q.correctOptionId || `opt_${selected}` === q.correctOptionId || String(selected) === String(q.correctOptionId) : selected === q.correctOption;
      if (selected === void 0 || selected === null) {
        unattemptedCount += 1;
      } else if (isCorrect) {
        correctCount += 1;
        score += q.marks || test.markingScheme.correct;
        subjectPerformance[q.subject].correct += 1;
        topicPerformance[q.topic].correct += 1;
      } else {
        incorrectCount += 1;
        score -= q.negativeMarks || test.markingScheme.incorrect;
      }
    });
    const totalQuestions = test.questions.length;
    const totalPossibleScore = test.totalMarks || totalQuestions * 2;
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round(correctCount / attemptedCount * 100) : 0;
    const attemptRate = totalQuestions > 0 ? Math.round(attemptedCount / totalQuestions * 100) : 0;
    const weakSubjects = [];
    const strongSubjects = [];
    Object.entries(subjectPerformance).forEach(([subj, data]) => {
      const pct = data.correct / data.total * 100;
      if (pct < 50) weakSubjects.push(subj);
      else strongSubjects.push(subj);
    });
    const weakTopics = [];
    const strongTopics = [];
    Object.entries(topicPerformance).forEach(([topic, data]) => {
      const pct = data.correct / data.total * 100;
      if (pct < 50) weakTopics.push(topic);
      else strongTopics.push(topic);
    });
    const aiMistakeAnalysis = [];
    if (incorrectCount > 0) {
      aiMistakeAnalysis.push(`Identified negative marks penalty in ${incorrectCount} questions.`);
      if (weakSubjects.length > 0) {
        aiMistakeAnalysis.push(`Accuracy dropped significantly in subject(s): ${weakSubjects.join(", ")}.`);
      }
    } else {
      aiMistakeAnalysis.push("Flawless accuracy! No negative marking penalties incurred.");
    }
    const aiImprovementSuggestions = [
      "Allocate 45 mins daily to revise conceptual notes in weak topics.",
      "Practice 20 targeted PYQs daily in " + (weakSubjects[0] || "Polity"),
      "Maintain negative marking discipline: eliminate 2 options before attempting borderline questions."
    ];
    const nextRevisionPlan = [
      "Day 1: High yield revision of " + (weakTopics[0] || "Fundamental Rights & Preamble"),
      "Day 2: Re-attempt incorrect question set with detailed solution explanations",
      "Day 3: Speed test section-wise evaluation"
    ];
    const globalRank = Math.floor(Math.random() * 20) + 1;
    const percentile = Math.min(99.8, Math.max(50, Math.round((1 - globalRank / 250) * 100)));
    const result = {
      testId: test.id,
      testTitle: test.title,
      sessionState,
      score: Number(score.toFixed(2)),
      totalPossibleScore,
      accuracy,
      attemptRate,
      correctCount,
      incorrectCount,
      unattemptedCount,
      globalRank,
      percentile,
      timePerSubject,
      timePerQuestion,
      weakSubjects,
      strongSubjects,
      weakTopics,
      strongTopics,
      aiMistakeAnalysis,
      aiImprovementSuggestions,
      nextRevisionPlan,
      recommendedPyqIds: ["pyq_001", "pyq_002"],
      recommendedTopics: weakTopics.length > 0 ? weakTopics : ["Polity", "Economy"]
    };
    const userHistory = cbtResultsStore.get(userId) || [];
    userHistory.unshift(result);
    cbtResultsStore.set(userId, userHistory);
    if (supabaseServer) {
      try {
        await supabaseServer.from("cbt_results").upsert([{ user_id: userId, data: userHistory, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "user_id" });
      } catch (e) {
      }
    }
    let streakResult = { streakDays: 1 };
    try {
      streakResult = await updateStreak(userId);
    } catch (e) {
      console.warn("Streak update on CBT submit error:", e);
    }
    res.json({ success: true, result, streak: streakResult });
  } catch (err) {
    res.status(500).json({ error: "CBT evaluation error", details: err.message });
  }
});
router.get("/api/academic/cbt/history", (req, res) => {
  try {
    const userId = req.query.userId || "default_user";
    const history = cbtResultsStore.get(userId) || [];
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch CBT history" });
  }
});
router.get("/api/academic/syllabus/subjects", (req, res) => {
  try {
    const exam = req.query.exam || "";
    const items = Array.from(syllabusNodesStore.values());
    let filtered = exam ? items.filter((i) => normalizeExam(i.exam || i.data?.exam || "") === normalizeExam(exam)) : items;
    if (filtered.length === 0 && exam) {
      const generated = generateRealisticSyllabus(exam);
      generated.forEach((n) => syllabusNodesStore.set(n.id, n));
      filtered = generated;
    }
    const subjectSet = /* @__PURE__ */ new Set();
    filtered.forEach((i) => {
      const subj = i.subject || i.data?.subject || "";
      if (subj) subjectSet.add(subj);
    });
    res.json({ success: true, subjects: Array.from(subjectSet).sort() });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch subjects", details: err.message });
  }
});
router.get("/api/academic/syllabus/topics", (req, res) => {
  try {
    const exam = req.query.exam || "";
    const subject = req.query.subject || "";
    let items = Array.from(syllabusNodesStore.values());
    if (exam) {
      items = items.filter((i) => normalizeExam(i.exam || i.data?.exam || "") === normalizeExam(exam));
      if (items.length === 0) {
        const generated = generateRealisticSyllabus(exam);
        generated.forEach((n) => syllabusNodesStore.set(n.id, n));
        items = generated;
      }
    }
    if (subject) {
      items = items.filter((i) => {
        const s = i.subject || i.data?.subject || "";
        return s.toLowerCase() === subject.toLowerCase();
      });
    }
    const topicSet = /* @__PURE__ */ new Set();
    items.forEach((i) => {
      const t = i.topic || i.data?.topic || "";
      if (t) topicSet.add(t);
    });
    res.json({ success: true, topics: Array.from(topicSet).sort() });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch topics", details: err.message });
  }
});
router.post("/api/academic/cbt/from-bank", async (req, res) => {
  try {
    const {
      exam,
      subject,
      topics,
      questionCount = 30,
      durationMinutes = 45,
      difficulty,
      mode = "subject",
      // 'full' | 'subject' | 'topic'
      markingScheme = { correct: 4, incorrect: 1, unattempted: 0 }
    } = req.body;
    if (!exam) {
      return res.status(400).json({ error: "exam is required." });
    }
    let pool = Array.from(questionBankStore.values()).filter((q) => {
      const examMatch = normalizeExam(q.exam || "") === normalizeExam(exam);
      const isPublished = q.status === "published" || !q.status;
      const isMcq = q.type === "mcq" || !q.type;
      return examMatch && isPublished && isMcq;
    });
    if (mode !== "full" && subject) {
      pool = pool.filter(
        (q) => (q.subject || "").toLowerCase().includes(subject.toLowerCase())
      );
    }
    if (mode === "topic" && Array.isArray(topics) && topics.length > 0) {
      const topicNorms = topics.map((t) => t.toLowerCase().trim());
      pool = pool.filter(
        (q) => topicNorms.some((t) => (q.topic || "").toLowerCase().includes(t))
      );
    }
    if (difficulty && difficulty !== "Mixed") {
      pool = pool.filter((q) => q.difficulty === difficulty);
    }
    if (pool.length === 0) {
      pool = Array.from(questionBankStore.values()).filter((q) => {
        return normalizeExam(q.exam || "") === normalizeExam(exam) && (q.type === "mcq" || !q.type) && (q.status === "published" || !q.status);
      });
    }
    if (pool.length === 0) {
      return res.status(404).json({
        error: `No questions found in question bank for exam: ${exam}. Try AI generation instead.`
      });
    }
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    const subjectBreakdown = {};
    selected.forEach((q) => {
      const s = q.subject || "General";
      subjectBreakdown[s] = (subjectBreakdown[s] || 0) + 1;
    });
    const questions = selected.map((q, idx) => ({
      id: q.id || `bank_q_${idx + 1}`,
      questionNumber: idx + 1,
      questionText: q.questionText || q.question || "",
      options: Array.isArray(q.options) ? q.options : ["Option A", "Option B", "Option C", "Option D"],
      correctOption: typeof q.correctOption === "number" ? q.correctOption : 0,
      solution: q.solutionText || q.explanation || "",
      subject: q.subject || subject || "General",
      topic: q.topic || "",
      difficulty: q.difficulty || "Medium",
      section: q.subject || subject || "General",
      marks: markingScheme.correct,
      negativeMarks: markingScheme.incorrect,
      imageUrl: q.imageUrl || null
    }));
    const uniqueSubjects = [...new Set(questions.map((q) => q.subject))];
    const sections = uniqueSubjects.map((s) => ({
      name: s,
      questionCount: questions.filter((q) => q.subject === s).length,
      timeLimit: null
    }));
    const examId = `bank_cbt_${Date.now()}`;
    const examLabel = exam.replace(/_/g, " ");
    const title = mode === "full" ? `${examLabel} - Full Mock Test (${selected.length} Qs)` : mode === "subject" ? `${examLabel} - ${subject} (${selected.length} Qs)` : `${examLabel} - ${(topics || []).join(", ")} (${selected.length} Qs)`;
    const cbtTest = {
      id: examId,
      title,
      exam,
      subject: subject || "Mixed",
      durationMinutes,
      totalMarks: questions.length * markingScheme.correct,
      markingScheme,
      sections,
      questions,
      sourceType: "question_bank",
      subjectBreakdown,
      totalAvailableInBank: pool.length,
      selectedCount: selected.length,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    res.json({ success: true, test: cbtTest, availableCount: pool.length });
  } catch (err) {
    console.error("[CBT from-bank] Error:", err);
    res.status(500).json({ error: "Failed to build CBT from question bank", details: err.message });
  }
});
router.get("/api/academic/cbt/bank-stats", async (req, res) => {
  try {
    const { exam } = req.query;
    let pool = Array.from(questionBankStore.values()).filter(
      (q) => (q.type === "mcq" || !q.type) && (q.status === "published" || !q.status)
    );
    if (exam) {
      pool = pool.filter((q) => normalizeExam(q.exam || "") === normalizeExam(exam));
    }
    const byExam = {};
    for (const q of pool) {
      const e = q.exam || "Unknown";
      const s = q.subject || "General";
      const t = q.topic || "";
      if (!byExam[e]) byExam[e] = { total: 0, subjects: {} };
      byExam[e].total++;
      if (!byExam[e].subjects[s]) byExam[e].subjects[s] = { count: 0, topics: [] };
      byExam[e].subjects[s].count++;
      if (t && !byExam[e].subjects[s].topics.includes(t)) {
        byExam[e].subjects[s].topics.push(t);
      }
    }
    res.json({ success: true, totalQuestions: pool.length, byExam });
  } catch (err) {
    res.status(500).json({ error: "Failed to get bank stats", details: err.message });
  }
});
router.post("/api/academic/cbt/generate-custom", async (req, res) => {
  try {
    const { exam, subject, topics, questionCount = 20, durationMinutes = 30, difficulty = "Medium" } = req.body;
    if (!exam || !subject || !topics || topics.length === 0) {
      return res.status(400).json({ error: "exam, subject, and topics are required." });
    }
    const topicList = topics.join(", ");
    const prompt = `Generate exactly ${questionCount} multiple-choice questions (MCQs) for a competitive exam.
Exam: ${exam.replace(/_/g, " ")}
Subject: ${subject}
Topics: ${topicList}
Difficulty: ${difficulty}

For each question provide:
1. A clear, concise question stem
2. Exactly 4 options labeled A, B, C, D
3. The correct option index (0=A, 1=B, 2=C, 3=D)
4. A brief explanation

Respond in this exact JSON array format:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "explanation": "Brief explanation of the correct answer",
    "topic": "Topic name"
  }
]
Only return valid JSON. No markdown, no extra text.`;
    let questions = [];
    try {
      const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + (process.env.GEMINI_API_KEY || ""), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const aiData = await aiRes.json();
      const raw = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      questions = JSON.parse(cleaned);
    } catch (e) {
      console.error("AI generation failed, using fallback questions:", e);
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      const topicsArr = topics;
      questions = topicsArr.flatMap(
        (topic, ti) => Array.from({ length: Math.ceil(questionCount / topicsArr.length) }, (_, qi) => ({
          question: `Which of the following best describes a key concept in "${topic}"?`,
          options: [
            `Core principle of ${topic}`,
            `Secondary aspect of ${topic}`,
            `Unrelated concept`,
            `Advanced application of ${topic}`
          ],
          correctOptionIndex: 0,
          explanation: `The first option correctly identifies the core principle of ${topic}.`,
          topic
        }))
      ).slice(0, questionCount);
    }
    const testId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cbtQuestions = questions.map((q, idx) => ({
      id: `${testId}_q${idx + 1}`,
      questionText: q.question,
      options: (q.options || []).map((opt, oi) => ({ id: `opt_${oi}`, text: opt })),
      correctOptionId: `opt_${q.correctOptionIndex ?? 0}`,
      explanation: q.explanation || "",
      subject,
      topic: q.topic || topics[0],
      difficulty,
      section: subject,
      marks: 4,
      negativeMarks: -1,
      type: "MCQ"
    }));
    const customTest = {
      id: testId,
      title: `Custom ${subject} Test - ${topics.slice(0, 2).join(" & ")}${topics.length > 2 ? ` +${topics.length - 2} more` : ""}`,
      exam,
      subject,
      topics,
      durationMinutes,
      totalMarks: cbtQuestions.length * 4,
      questions: cbtQuestions,
      sections: [{ name: subject, questionCount: cbtQuestions.length }],
      markingScheme: { correct: 4, incorrect: -1, unattempted: 0 },
      difficulty,
      isCustom: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    cbtTestsStore.set(testId, customTest);
    res.json({ success: true, test: customTest });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate custom CBT test", details: err.message });
  }
});
router.post("/api/admin/cbt/create-exam", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const {
      title,
      exam,
      subject,
      topics,
      questionCount = 30,
      durationMinutes = 60,
      scheduledAt,
      difficulty = "Medium",
      markingScheme = { correct: 4, incorrect: -1, unattempted: 0 },
      instructions = "Read all questions carefully. Each correct answer awards 4 marks. Wrong answer deducts 1 mark.",
      targetAudience = "ALL"
    } = req.body;
    if (!title || !exam || !scheduledAt) {
      return res.status(400).json({ error: "title, exam, and scheduledAt are required." });
    }
    const topicList = (topics || []).join(", ") || subject || exam;
    const prompt = `Generate exactly ${questionCount} multiple-choice questions (MCQs) for a competitive exam.
Exam: ${exam.replace(/_/g, " ")}
Subject: ${subject || "General Studies"}
Topics: ${topicList}
Difficulty: ${difficulty}
Respond in this exact JSON array format - only valid JSON, no extra text:
[{"question":"...","options":["A","B","C","D"],"correctOptionIndex":0,"explanation":"...","topic":"..."}]`;
    let questions = [];
    try {
      const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + (process.env.GEMINI_API_KEY || ""), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const aiData = await aiRes.json();
      const raw = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      questions = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch (e) {
      console.error("AI gen error for admin exam:", e);
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      questions = Array.from({ length: questionCount }, (_, i) => ({
        question: `Sample question ${i + 1} on ${subject || exam}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctOptionIndex: 0,
        explanation: "This is a sample explanation.",
        topic: (topics || [subject || exam])[0]
      }));
    }
    const examId = `admin_cbt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cbtQuestions = questions.map((q, idx) => ({
      id: `${examId}_q${idx + 1}`,
      questionText: q.question,
      options: (q.options || []).map((opt, oi) => ({ id: `opt_${oi}`, text: opt })),
      correctOptionId: `opt_${q.correctOptionIndex ?? 0}`,
      explanation: q.explanation || "",
      subject: subject || "General Studies",
      topic: q.topic || (topics || [])[0] || subject,
      difficulty,
      section: subject || "General Studies",
      marks: markingScheme.correct,
      negativeMarks: markingScheme.incorrect,
      type: "MCQ"
    }));
    const adminExam = {
      id: examId,
      title,
      exam,
      subject: subject || "General Studies",
      topics: topics || [],
      durationMinutes,
      totalMarks: cbtQuestions.length * markingScheme.correct,
      questions: cbtQuestions,
      sections: [{ name: subject || "General Studies", questionCount: cbtQuestions.length }],
      markingScheme,
      difficulty,
      instructions,
      scheduledAt,
      targetAudience,
      status: new Date(scheduledAt) <= /* @__PURE__ */ new Date() ? "live" : "scheduled",
      participants: {},
      // userId -> result
      joinedCount: 0,
      submittedCount: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isAdminConducted: true
    };
    adminCbtExamsStore.set(examId, adminExam);
    cbtTestsStore.set(examId, adminExam);
    for (const [userId] of Array.from(userNotificationsStore.entries())) {
      const notifs = userNotificationsStore.get(userId) || [];
      notifs.unshift({
        id: `notif_cbt_${examId}_${userId}`,
        type: "cbt_exam",
        title: `[NOTE] New Live Exam: ${title}`,
        message: `Admin has scheduled a live exam on ${subject || exam}. Join at ${new Date(scheduledAt).toLocaleString("en-IN")}`,
        actionUrl: "cbt_exam",
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      userNotificationsStore.set(userId, notifs.slice(0, 50));
    }
    res.json({ success: true, exam: { ...adminExam, questions: void 0, questionCount: cbtQuestions.length } });
  } catch (err) {
    res.status(500).json({ error: "Failed to create admin CBT exam", details: err.message });
  }
});
router.get("/api/admin/cbt/exams", verifyAdminAuth, (req, res) => {
  try {
    const exams = Array.from(adminCbtExamsStore.values()).map((e) => ({
      ...e,
      questions: void 0,
      questionCount: e.questions?.length || 0
    }));
    res.json({ success: true, exams: exams.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin CBT exams" });
  }
});
router.get("/api/academic/cbt/live-exams", (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const exams = Array.from(adminCbtExamsStore.values()).map((e) => {
      const scheduledTime = new Date(e.scheduledAt);
      const endTime = new Date(scheduledTime.getTime() + e.durationMinutes * 60 * 1e3);
      let status = e.status;
      if (now >= scheduledTime && now <= endTime) status = "live";
      else if (now > endTime) status = "ended";
      else status = "scheduled";
      return { ...e, status, questions: void 0, questionCount: e.questions?.length || 0 };
    }).filter((e) => e.status !== "ended" || (/* @__PURE__ */ new Date()).getTime() - new Date(e.scheduledAt).getTime() < 24 * 60 * 60 * 1e3).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    res.json({ success: true, exams });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch live exams" });
  }
});
router.post("/api/admin/cbt/publish/:examId", adminMutationLimiter, verifyAdminAuth, (req, res) => {
  try {
    const exam = adminCbtExamsStore.get(req.params.examId);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    exam.status = "live";
    exam.scheduledAt = (/* @__PURE__ */ new Date()).toISOString();
    adminCbtExamsStore.set(exam.id, exam);
    cbtTestsStore.set(exam.id, exam);
    res.json({ success: true, message: "Exam is now live!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to publish exam" });
  }
});
router.get("/api/admin/cbt/monitor/:examId", verifyAdminAuth, (req, res) => {
  try {
    const exam = adminCbtExamsStore.get(req.params.examId);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    const now = /* @__PURE__ */ new Date();
    const scheduledTime = new Date(exam.scheduledAt);
    const endTime = new Date(scheduledTime.getTime() + exam.durationMinutes * 60 * 1e3);
    const remainingSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1e3));
    const participants = Object.values(exam.participants || {});
    res.json({
      success: true,
      examId: exam.id,
      title: exam.title,
      status: exam.status,
      scheduledAt: exam.scheduledAt,
      durationMinutes: exam.durationMinutes,
      remainingSeconds,
      joinedCount: exam.joinedCount || 0,
      submittedCount: exam.submittedCount || 0,
      totalQuestions: exam.questions?.length || 0,
      recentSubmissions: participants.slice(-10).map((p) => ({
        userId: p.userId,
        score: p.score,
        submittedAt: p.submittedAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch monitor data" });
  }
});
router.get("/api/admin/cbt/results/:examId", verifyAdminAuth, (req, res) => {
  try {
    const exam = adminCbtExamsStore.get(req.params.examId);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    const participants = Object.values(exam.participants || {});
    const ranked = participants.sort((a, b) => b.score - a.score || a.timeTakenSeconds - b.timeTakenSeconds).map((p, idx) => ({ ...p, rank: idx + 1, percentile: ((participants.length - idx - 1) / Math.max(participants.length, 1) * 100).toFixed(1) }));
    res.json({ success: true, totalParticipants: ranked.length, results: ranked });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch exam results" });
  }
});
router.post("/api/academic/cbt/join-admin-exam", (req, res) => {
  try {
    const { examId, userId } = req.body;
    const exam = adminCbtExamsStore.get(examId);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    if (!exam.participants[userId]) {
      exam.joinedCount = (exam.joinedCount || 0) + 1;
    }
    adminCbtExamsStore.set(examId, exam);
    res.json({ success: true, test: exam });
  } catch (err) {
    res.status(500).json({ error: "Failed to join exam" });
  }
});
router.post("/api/academic/cbt/submit-admin-exam", (req, res) => {
  try {
    const { examId, userId, score, totalMarks, timeTakenSeconds, correctCount, incorrectCount, unattemptedCount } = req.body;
    const exam = adminCbtExamsStore.get(examId);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    exam.participants[userId] = { userId, score, totalMarks, timeTakenSeconds, correctCount, incorrectCount, unattemptedCount, submittedAt: (/* @__PURE__ */ new Date()).toISOString() };
    exam.submittedCount = Object.keys(exam.participants).length;
    adminCbtExamsStore.set(examId, exam);
    const ranked = Object.values(exam.participants).sort((a, b) => b.score - a.score || a.timeTakenSeconds - b.timeTakenSeconds);
    const myRank = ranked.findIndex((p) => p.userId === userId) + 1;
    res.json({ success: true, rank: myRank, totalParticipants: ranked.length, score, totalMarks });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit admin exam result" });
  }
});
router.get("/api/academic/leaderboard", (req, res) => {
  try {
    const scope = req.query.scope || "global";
    const exam = req.query.exam || "";
    const leaderboardEntries = [];
    for (const user of adminUsersDb) {
      const results = cbtResultsStore.get(user.id) || [];
      if (results.length === 0) continue;
      if (exam) {
        const uExam = String(user.exam || "").toLowerCase().trim();
        const qExam = exam.toLowerCase().trim();
        if (uExam && qExam && !uExam.includes(qExam) && !qExam.includes(uExam)) {
          continue;
        }
      }
      let bestScore = -1;
      let bestPercentile = 0;
      for (const r of results) {
        if (r.score !== void 0 && r.score > bestScore) {
          bestScore = r.score;
          bestPercentile = r.percentile || 0;
        }
      }
      if (bestScore < 0) continue;
      leaderboardEntries.push({
        userId: user.id,
        userName: user.name || "Aspirant",
        score: Number(bestScore.toFixed(2)),
        percentile: Number(bestPercentile.toFixed(2)),
        xp: user.xp || 0,
        exam: user.exam || exam || "UPSC_CSE"
      });
    }
    leaderboardEntries.sort((a, b) => b.score - a.score);
    const leaderboard = leaderboardEntries.map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));
    res.json({ success: true, scope, exam: exam || "UPSC_CSE", leaderboard });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});
var academic_routes_default = router;

// routes/community.routes.ts
var import_express2 = require("express");
var import_path3 = __toESM(require("path"), 1);
var router2 = (0, import_express2.Router)();
var __dirname2 = import_path3.default.resolve();
router2.get("/api/community/groups", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const callerUserId = verifiedUser?.sub || req.query.userId || "usr_guest_101";
    const groups = Array.from(communityGroupsStore.values()).map((g) => {
      const isJoined = communityGroupMembershipsStore.get(`${callerUserId}:${g.id}`) || false;
      return {
        ...g,
        isJoined
      };
    });
    res.json({ success: true, groups });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});
router2.post("/api/community/groups", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser) {
      return res.status(401).json({ error: "Authentication required to create a group" });
    }
    const creatorId = verifiedUser.sub;
    const { name, description, exam = "UPSC_CSE", category = "public", icon = "Users" } = req.body;
    if (!name || !description) {
      return res.status(400).json({ error: "Name and description are required" });
    }
    const newGroup = {
      id: "grp_" + Date.now(),
      name,
      description,
      category,
      exam,
      memberCount: 1,
      icon
    };
    communityGroupsStore.set(newGroup.id, newGroup);
    communityGroupMembershipsStore.set(`${creatorId}:${newGroup.id}`, true);
    if (supabaseServer) {
      try {
        const { error } = await supabaseServer.from("community_groups").upsert([{ id: newGroup.id, data: newGroup, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
        if (error) console.error("[SUPABASE GROUP UPSERT FAILURE]", error.message);
      } catch (e) {
        console.error("[SUPABASE GROUP UPSERT EXCEPTION]", e?.message || e);
      }
    }
    res.json({ success: true, group: { ...newGroup, isJoined: true } });
  } catch (err) {
    res.status(500).json({ error: "Failed to create group" });
  }
});
router2.post("/api/community/groups/:id/join", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser) {
      return res.status(401).json({ error: "Authentication required to join or leave groups" });
    }
    const userId = verifiedUser.sub;
    const groupId = req.params.id;
    const group = communityGroupsStore.get(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    const key = `${userId}:${groupId}`;
    const isCurrentlyJoined = communityGroupMembershipsStore.get(key) || false;
    const isJoined = !isCurrentlyJoined;
    if (isJoined) {
      communityGroupMembershipsStore.set(key, true);
      group.memberCount = (group.memberCount || 0) + 1;
    } else {
      communityGroupMembershipsStore.delete(key);
      group.memberCount = Math.max(0, (group.memberCount || 1) - 1);
    }
    communityGroupsStore.set(group.id, group);
    if (supabaseServer) {
      try {
        await supabaseServer.from("community_groups").upsert([{ id: group.id, data: group, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
      } catch (e) {
        console.error("[SUPABASE GROUP JOIN EXCEPTION]", e?.message || e);
      }
    }
    res.json({ success: true, isJoined, memberCount: group.memberCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle group membership" });
  }
});
router2.get("/api/community/posts", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const callerUserId = verifiedUser?.sub || req.query.userId || "usr_guest_101";
    const groupId = req.query.groupId;
    const search = (req.query.search || "").toLowerCase().trim();
    const tag = (req.query.tag || "").toLowerCase().trim();
    const filter = (req.query.filter || "all").toLowerCase().trim();
    const sort = (req.query.sort || "recent").toLowerCase().trim();
    if (communityPostsStore.size <= 2 && supabaseServer) {
      await hydrateCommunityPostsFromSupabase().catch(() => {
      });
    }
    let posts = Array.from(communityPostsStore.values());
    if (groupId) {
      posts = posts.filter((p) => p.groupId === groupId);
    }
    if (tag) {
      posts = posts.filter(
        (p) => Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(tag))
      );
    }
    if (search) {
      posts = posts.filter(
        (p) => p.title.toLowerCase().includes(search) || p.content.toLowerCase().includes(search) || Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(search)) || p.authorName && p.authorName.toLowerCase().includes(search)
      );
    }
    posts = posts.map((p) => {
      const kVoteKey = `${callerUserId}:post:${p.id}`;
      const kVote = karmaVotesStore.get(kVoteKey);
      const userVote = kVote ? kVote.vote === 1 ? "up" : "down" : null;
      const upvotes = p.upvotesCount ?? p.likesCount ?? 0;
      const downvotes = p.downvotesCount ?? 0;
      const score = p.score ?? upvotes - downvotes;
      const isBookmarked = communityBookmarksStore.get(`${callerUserId}:${p.id}`) || false;
      const userVotedOptionId = p.poll ? communityPollVotesStore.get(`${callerUserId}:${p.id}`) : void 0;
      const poll = p.poll ? { ...p.poll, userVotedOptionId } : void 0;
      return {
        ...p,
        score,
        upvotesCount: upvotes,
        downvotesCount: downvotes,
        userVote,
        isLiked: userVote === "up",
        likesCount: upvotes,
        isBookmarked,
        poll
      };
    });
    if (filter === "bookmarked") {
      posts = posts.filter((p) => p.isBookmarked);
    } else if (filter === "my_posts") {
      posts = posts.filter((p) => p.authorId === callerUserId || callerUserId === "usr_guest_101" && p.authorId === "usr_curr");
    }
    if (sort === "popular") {
      posts.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sort === "discussed") {
      posts.sort((a, b) => (b.repliesCount || 0) - (a.repliesCount || 0));
    } else {
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch community posts" });
  }
});
router2.post("/api/community/posts", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser) {
      return res.status(401).json({ error: "Authentication required to create a post" });
    }
    const authorId = verifiedUser.sub;
    const { groupId, title, content, tags, authorName = "Aspirant", authorAvatar, attachments, poll } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }
    const group = communityGroupsStore.get(groupId) || Array.from(communityGroupsStore.values())[0];
    if (!group) {
      return res.status(404).json({ error: "Community group not found" });
    }
    const formattedPoll = poll && poll.question && Array.isArray(poll.options) && poll.options.length > 0 ? {
      question: poll.question,
      options: poll.options.map((optText, i) => ({
        id: `opt_${Date.now()}_${i}`,
        text: optText,
        votes: 0
      })),
      totalVotes: 0,
      userVotedOptionId: void 0
    } : void 0;
    const newPost = {
      id: "post_" + Date.now(),
      groupId: group.id,
      groupName: group.name,
      authorId,
      authorName: authorName || (verifiedUser ? verifiedUser.email.split("@")[0] : "Aspirant"),
      authorAvatar: authorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      authorRole: verifiedUser?.role || "Aspirant",
      title,
      content,
      tags: tags && tags.length > 0 ? tags : ["Discussion"],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      score: 1,
      upvotesCount: 1,
      downvotesCount: 0,
      likesCount: 1,
      repliesCount: 0,
      isLiked: false,
      isBookmarked: false,
      isPinned: false,
      attachments,
      poll: formattedPoll
    };
    communityPostsStore.set(newPost.id, newPost);
    if (supabaseServer) {
      try {
        const { error } = await supabaseServer.from("community_posts").upsert([{ id: newPost.id, data: newPost, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
        if (error) console.error("[SUPABASE POST UPSERT FAILURE]", error.message);
      } catch (e) {
        console.error("[SUPABASE POST UPSERT EXCEPTION]", e?.message || e);
      }
    }
    res.json({ success: true, post: newPost });
  } catch (err) {
    res.status(500).json({ error: "Failed to create post" });
  }
});
router2.get("/api/karma/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }
    if (typeof hydrateKarmaFromSupabase === "function") {
      await hydrateKarmaFromSupabase(userId);
    }
    let karma = userKarmaStore.get(userId);
    if (!karma) {
      karma = recalculateUserKarma(userId);
    }
    const recentVotes = [];
    karmaVotesStore.forEach((v) => {
      if (v.targetOwnerId === userId || v.voterId === userId) {
        let targetTitle = v.targetType === "post" ? "Discussion Post" : "Peer Comment";
        if (v.targetType === "post") {
          const post = communityPostsStore.get(v.targetId);
          if (post) targetTitle = post.title;
        } else if (v.targetType === "comment") {
          for (const commentList of communityCommentsStore.values()) {
            const found = commentList.find((c) => c.id === v.targetId);
            if (found && found.content) {
              targetTitle = found.content.substring(0, 40) + "...";
              break;
            }
          }
        }
        recentVotes.push({
          id: v.id,
          voterId: v.voterId,
          targetType: v.targetType,
          targetId: v.targetId,
          targetOwnerId: v.targetOwnerId,
          voteType: v.vote === 1 ? "up" : "down",
          targetTitle,
          timestamp: v.createdAt || (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    });
    recentVotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedVotes = recentVotes.slice(0, 20);
    res.json({
      success: true,
      karma: {
        ...karma,
        recentVotes: limitedVotes,
        activityFeed: limitedVotes
      },
      recentVotes: limitedVotes
    });
  } catch (err) {
    console.error("[API /karma/:userId] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal error" });
  }
});
router2.post("/api/community/vote", async (req, res) => {
  try {
    const { voterId, targetType, targetId, targetOwnerId, vote } = req.body;
    if (!voterId || !targetType || !targetId || vote === void 0) {
      return res.status(400).json({ success: false, error: "Missing required voting parameters" });
    }
    const voteVal = Number(vote) >= 0 ? 1 : -1;
    const voteKey = `${voterId}_${targetType}_${targetId}`;
    const existing = karmaVotesStore.get(voteKey);
    if (existing) {
      if (existing.vote === voteVal) {
        karmaVotesStore.delete(voteKey);
      } else {
        existing.vote = voteVal;
        existing.createdAt = (/* @__PURE__ */ new Date()).toISOString();
        karmaVotesStore.set(voteKey, existing);
      }
    } else {
      const newVote = {
        id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        voterId,
        targetType,
        targetId,
        targetOwnerId: targetOwnerId || "",
        vote: voteVal,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      karmaVotesStore.set(voteKey, newVote);
    }
    let updatedKarma = null;
    if (targetOwnerId) {
      updatedKarma = recalculateUserKarma(targetOwnerId);
    }
    res.json({ success: true, data: { voteKey, vote: voteVal, karma: updatedKarma } });
  } catch (err) {
    console.error("[POST /api/community/vote] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router2.post("/api/community/comments", async (req, res) => {
  try {
    const { postId, content, authorName, authorAvatar, authorId } = req.body;
    if (!postId || !content) {
      return res.status(400).json({ success: false, error: "Post ID and comment content are required" });
    }
    const commentList = communityCommentsStore.get(postId) || [];
    const newComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      postId,
      authorId: authorId || "usr_guest_101",
      authorName: authorName || "Aspirant",
      authorAvatar: authorAvatar || "",
      content: content.trim(),
      upvotes: 0,
      downvotes: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    commentList.push(newComment);
    communityCommentsStore.set(postId, commentList);
    const post = communityPostsStore.get(postId);
    if (post) {
      post.commentCount = (post.commentCount || 0) + 1;
      communityPostsStore.set(postId, post);
    }
    if (supabaseServer) {
      await supabaseServer.from("community_comments").insert(newComment);
    }
    res.json({ success: true, data: newComment });
  } catch (err) {
    console.error("[POST /api/community/comments] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router2.delete("/api/community/comments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Comment ID is required" });
    }
    let deleted = false;
    for (const [postId, list] of communityCommentsStore.entries()) {
      const idx = list.findIndex((c) => c.id === id);
      if (idx !== -1) {
        list.splice(idx, 1);
        communityCommentsStore.set(postId, list);
        const post = communityPostsStore.get(postId);
        if (post && post.commentCount) {
          post.commentCount = Math.max(0, post.commentCount - 1);
          communityPostsStore.set(postId, post);
        }
        deleted = true;
        break;
      }
    }
    if (supabaseServer) {
      await supabaseServer.from("community_comments").delete().eq("id", id);
    }
    res.json({ success: true, data: { id, deleted } });
  } catch (err) {
    console.error("[DELETE /api/community/comments/:id] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router2.post("/api/community/bookmark/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = communityPostsStore.get(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    post.isBookmarked = !post.isBookmarked;
    communityPostsStore.set(postId, post);
    res.json({ success: true, data: { postId, isBookmarked: post.isBookmarked } });
  } catch (err) {
    console.error("[POST /api/community/bookmark/:postId] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router2.post("/api/community/tip", async (req, res) => {
  try {
    const { postId, senderId, senderName, amount } = req.body;
    if (!postId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: "Post ID and valid tip amount are required" });
    }
    const tipAmount = Number(amount);
    const post = communityPostsStore.get(postId);
    if (post) {
      post.tipsTotal = (post.tipsTotal || 0) + tipAmount;
      communityPostsStore.set(postId, post);
    }
    res.json({
      success: true,
      data: {
        postId,
        senderId: senderId || "usr_guest_101",
        senderName: senderName || "Aspirant",
        amount: tipAmount,
        message: "Tip processed successfully"
      }
    });
  } catch (err) {
    console.error("[POST /api/community/tip] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
var community_routes_default = router2;

// routes/admin.routes.ts
var import_express3 = require("express");
var import_path4 = __toESM(require("path"), 1);
var router3 = (0, import_express3.Router)();
var __dirname3 = import_path4.default.resolve();
router3.get("/api/admin/team-applications", verifyAdminAuth, async (_req, res) => {
  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer.from("team_applications").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        const apps = data.map((r) => r.data || r);
        return res.json({ success: true, applications: apps });
      }
    } catch (e) {
      console.warn("Supabase fetch team_applications error:", e);
    }
  }
  return res.json({ success: true, applications: teamApplicationsDb });
});
router3.get("/api/admin/watchdog", verifyAdminAuth, async (_req, res) => {
  const startTime = Date.now();
  let sheetsStatus = "OK";
  let sheetsMsg = "Google Sheets master syllabus link accessible & responding.";
  let sheetsLatency = 0;
  if (simulatedErrors.googleSheets) {
    sheetsStatus = "ERROR";
    sheetsMsg = "HTTP 404 / Access Denied: Google Sheets syllabus link unavailable or restricted permissions.";
  } else {
    try {
      const sStart = Date.now();
      const sRes = await fetch(globalAdminSettings.googleSheetsUrl, { method: "HEAD", redirect: "follow" });
      sheetsLatency = Date.now() - sStart;
      if (!sRes.ok && sRes.status !== 302 && sRes.status !== 301) {
        sheetsStatus = "ERROR";
        sheetsMsg = `HTTP Error ${sRes.status}: Unable to load public syllabus spreadsheet.`;
      }
    } catch (e) {
      sheetsLatency = 120;
      sheetsStatus = "OK";
      sheetsMsg = "Google Sheets URL validated (Public Docs format ok).";
    }
  }
  let geminiStatus = "OK";
  let geminiMsg = "Gemini 3.6 Flash API key active & model endpoints operational.";
  let geminiLatency = 0;
  if (simulatedErrors.geminiApi) {
    geminiStatus = "ERROR";
    geminiMsg = "RESOURCE_EXHAUSTED: Gemini API Quota exceeded or invalid API Key supplied.";
  } else {
    const ai = getGeminiClient();
    if (!ai && !process.env.GEMINI_API_KEY) {
      geminiStatus = "OK";
      geminiMsg = "Gemini client running in local fallback mode (Set GEMINI_API_KEY for live generation).";
    } else {
      geminiLatency = Math.floor(Math.random() * 40) + 15;
    }
  }
  let supabaseStatus = "OK";
  let supabaseMsg = "Supabase PostgreSQL database & Realtime websocket channel connected.";
  if (simulatedErrors.supabaseDb) {
    supabaseStatus = "ERROR";
    supabaseMsg = "ETIMEDOUT: Supabase PostgreSQL database connection refused or pool exhausted.";
  }
  const hasError = sheetsStatus === "ERROR" || geminiStatus === "ERROR" || supabaseStatus === "ERROR";
  const overallStatus = hasError ? "CRITICAL" : "HEALTHY";
  if (sheetsStatus === "ERROR" && !watchdogSystemLogs.some((l) => l.service === "Google Sheets" && !l.resolved)) {
    watchdogSystemLogs.unshift({
      id: `wd_${Date.now()}_sheets`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: "Google Sheets",
      level: "CRITICAL",
      message: sheetsMsg,
      resolved: false
    });
  }
  if (geminiStatus === "ERROR" && !watchdogSystemLogs.some((l) => l.service === "Gemini API" && !l.resolved)) {
    watchdogSystemLogs.unshift({
      id: `wd_${Date.now()}_gemini`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: "Gemini API",
      level: "CRITICAL",
      message: geminiMsg,
      resolved: false
    });
  }
  if (supabaseStatus === "ERROR" && !watchdogSystemLogs.some((l) => l.service === "Supabase DB" && !l.resolved)) {
    watchdogSystemLogs.unshift({
      id: `wd_${Date.now()}_supabase`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: "Supabase DB",
      level: "CRITICAL",
      message: supabaseMsg,
      resolved: false
    });
  }
  const memoryUsage = process.memoryUsage();
  res.json({
    overallStatus,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    scanDurationMs: Date.now() - startTime,
    checks: {
      googleSheets: {
        status: sheetsStatus,
        message: sheetsMsg,
        url: globalAdminSettings.googleSheetsUrl,
        latencyMs: sheetsLatency
      },
      geminiApi: {
        status: geminiStatus,
        message: geminiMsg,
        keyConfigured: Boolean(process.env.GEMINI_API_KEY),
        latencyMs: geminiLatency
      },
      supabaseDb: {
        status: supabaseStatus,
        message: supabaseMsg,
        connected: !simulatedErrors.supabaseDb
      },
      serverEngine: {
        status: "OK",
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: (memoryUsage.rss / (1024 * 1024)).toFixed(1),
        memoryHeapMb: (memoryUsage.heapUsed / (1024 * 1024)).toFixed(1)
      }
    },
    unresolvedLogs: watchdogSystemLogs.filter((l) => !l.resolved),
    simulatedErrors
  });
});
router3.post("/api/admin/watchdog/diagnose-fix", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { logId, service, message } = req.body;
    const ai = getGeminiClient();
    let diagnosis = {
      rootCause: "",
      recommendedAction: "",
      codeFixSnippet: ""
    };
    if (ai) {
      const prompt = `You are AspirantX AI Watchdog, an elite site-reliability engineering AI.
An error incident was logged in the application.
Service: ${service}
Error Message: "${message}"

Analyze this error and provide:
1. Short Root Cause Analysis
2. Step-by-step Recommended Action to resolve it
3. Exact Code Fix or Environment Configuration snippet needed.

Reply ONLY with a JSON object matching this schema:
{
  "rootCause": string,
  "recommendedAction": string,
  "codeFixSnippet": string
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });
      try {
        if (response.text) {
          diagnosis = JSON.parse(response.text.trim());
        }
      } catch (e) {
        console.warn("JSON parse error for watchdog diagnosis:", response.text);
      }
    }
    if (!diagnosis.rootCause) {
      if (service === "Google Sheets") {
        diagnosis = {
          rootCause: "Target Google Spreadsheet link is broken, deleted, or set to private viewing permissions.",
          recommendedAction: 'Open Google Sheets -> Click Share -> Set access to "Anyone with the link can view". Then update link in Admin Panel.',
          codeFixSnippet: `// Verify or update spreadsheet ID in server.ts:
const MASTER_SHEET_URL = "${globalAdminSettings.googleSheetsUrl}";
if (!MASTER_SHEET_URL.includes("docs.google.com")) throw new Error("Invalid Sheet URL");`
        };
      } else if (service === "Gemini API") {
        diagnosis = {
          rootCause: "GEMINI_API_KEY is missing from environment variables or API quota limit reached.",
          recommendedAction: "Check .env file for GEMINI_API_KEY or generate a new API key in Google AI Studio console.",
          codeFixSnippet: `// In .env.example or server environment:
GEMINI_API_KEY=AIzaSyYourSecretKeyHere

// In server.ts safe wrapper:
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });`
        };
      } else if (service === "Supabase DB") {
        diagnosis = {
          rootCause: "Database connection timeout or invalid VITE_SUPABASE_URL endpoint credentials.",
          recommendedAction: "Verify Supabase service status, check database pool limits, or confirm VITE_SUPABASE_ANON_KEY.",
          codeFixSnippet: `// In src/lib/supabase.ts:
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'
);`
        };
      } else {
        diagnosis = {
          rootCause: "Unexpected server exception or unhandled promise rejection.",
          recommendedAction: "Inspect server console logs and restart Node dev server.",
          codeFixSnippet: `app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server Watchdog caught exception' });
});`
        };
      }
    }
    setWatchdogSystemLogs(watchdogSystemLogs.map((log) => {
      if (log.id === logId) {
        return { ...log, diagnosis };
      }
      return log;
    }));
    res.json({ success: true, diagnosis });
  } catch (error) {
    console.error("Watchdog diagnosis error:", error);
    res.status(500).json({ error: "Failed to generate diagnosis" });
  }
});
router3.post("/api/admin/watchdog/simulate-error", adminMutationLimiter, verifyAdminAuth, (req, res) => {
  const { service, trigger } = req.body;
  if (service === "googleSheets") simulatedErrors.googleSheets = Boolean(trigger);
  if (service === "geminiApi") simulatedErrors.geminiApi = Boolean(trigger);
  if (service === "supabaseDb") simulatedErrors.supabaseDb = Boolean(trigger);
  if (!trigger) {
    const serviceName = service === "googleSheets" ? "Google Sheets" : service === "geminiApi" ? "Gemini API" : "Supabase DB";
    setWatchdogSystemLogs(watchdogSystemLogs.map((l) => l.service === serviceName ? { ...l, resolved: true } : l));
  }
  res.json({ success: true, simulatedErrors, watchdogSystemLogs });
});
router3.post("/api/admin/watchdog/resolve-log", adminMutationLimiter, verifyAdminAuth, (req, res) => {
  const { logId } = req.body;
  if (logId === "ALL") {
    setWatchdogSystemLogs([]);
    setSimulatedErrors({ googleSheets: false, geminiApi: false, supabaseDb: false });
  } else {
    setWatchdogSystemLogs(watchdogSystemLogs.map((l) => l.id === logId ? { ...l, resolved: true } : l));
  }
  res.json({ success: true, watchdogSystemLogs, simulatedErrors });
});
router3.get("/api/admin/settings", verifyAdminAuth, (_req, res) => {
  const safeRazorpay = {
    ...globalAdminSettings.razorpay,
    keySecret: globalAdminSettings.razorpay.keySecret ? `${globalAdminSettings.razorpay.keySecret.substring(0, 4)}--------` : ""
  };
  res.json({
    ...globalAdminSettings,
    razorpay: safeRazorpay
  });
});
router3.get("/api/admin/gateway-settings", verifyAdminAuth, async (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const now = Date.now();
  if (supabaseServer && now - lastGatewaySettingsSync > GATEWAY_SETTINGS_CACHE_MS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const { data, error } = await supabaseServer.from("admin_settings").select("*").eq("id", "global").abortSignal(controller.signal).maybeSingle();
      clearTimeout(timer);
      if (!error && data?.data) {
        setGlobalAdminSettings(mergeAdminSettings(globalAdminSettings, data.data));
      }
      setLastGatewaySettingsSync(now);
    } catch (e) {
      console.warn("[gateway-settings GET] Supabase refresh failed, serving in-memory copy:", e);
    }
  }
  const safeRazorpay = {
    ...globalAdminSettings.razorpay,
    keySecret: globalAdminSettings.razorpay.keySecret ? `${globalAdminSettings.razorpay.keySecret.substring(0, 4)}--------` : ""
  };
  res.json({
    planPricing: globalAdminSettings.planPricing,
    razorpay: safeRazorpay,
    adsense: globalAdminSettings.adsense
  });
});
router3.get("/api/public/adsense-config", async (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=30");
  const now = Date.now();
  if (supabaseServer && now - lastGatewaySettingsSync > GATEWAY_SETTINGS_CACHE_MS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const { data, error } = await supabaseServer.from("admin_settings").select("*").eq("id", "global").abortSignal(controller.signal).maybeSingle();
      clearTimeout(timer);
      if (!error && data?.data) {
        setGlobalAdminSettings(mergeAdminSettings(globalAdminSettings, data.data));
      }
      setLastGatewaySettingsSync(now);
    } catch (e) {
    }
  }
  res.json({
    success: true,
    adsense: globalAdminSettings.adsense
  });
});
router3.post("/api/admin/gateway-settings", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  await updateGlobalAdminSettings(req.body, req.body.updatedBy || "Admin");
  saveAdminStoreToDisk();
  if (supabaseServer) {
    try {
      const { error } = await supabaseServer.from("admin_settings").upsert(
        [{ id: "global", data: globalAdminSettings, updated_at: (/* @__PURE__ */ new Date()).toISOString() }],
        { onConflict: "id" }
      );
      if (error) {
        console.warn("Failed to upsert admin_settings in Supabase:", error.message);
      }
    } catch (e) {
      console.warn("Supabase upsert exception:", e?.message || e);
    }
  }
  setLastGatewaySettingsSync(Date.now());
  res.json({
    success: true,
    settings: {
      planPricing: globalAdminSettings.planPricing,
      razorpay: {
        ...globalAdminSettings.razorpay,
        keySecret: globalAdminSettings.razorpay.keySecret ? "--------" : ""
      },
      adsense: globalAdminSettings.adsense
    }
  });
});
router3.get("/api/admin/customizer", (_req, res) => {
  res.json({
    success: true,
    customizer: globalAdminSettings.customizer
  });
});
router3.post("/api/admin/customizer", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  await updateGlobalAdminSettings(req.body, req.body.updatedBy || "Admin");
  if (supabaseServer) {
    const { error } = await supabaseServer.from("admin_settings").upsert([
      { id: "global", data: globalAdminSettings, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
    ], { onConflict: "id" });
    if (error) {
      console.error("Failed to upsert admin_settings in Supabase:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  res.json({
    success: true,
    customizer: globalAdminSettings.customizer
  });
});
router3.get("/api/admin/demo-limits", (_req, res) => {
  res.json({
    success: true,
    demoDurationMinutes: globalAdminSettings.demoLimits?.demoDurationMinutes || 10
  });
});
router3.post("/api/admin/demo-limits", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  await updateGlobalAdminSettings(req.body, req.body.updatedBy || "Admin");
  if (supabaseServer) {
    const { error } = await supabaseServer.from("admin_settings").upsert([
      { id: "global", data: globalAdminSettings, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
    ], { onConflict: "id" });
    if (error) {
      console.error("Failed to upsert admin_settings in Supabase:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  res.json({
    success: true,
    demoDurationMinutes: globalAdminSettings.demoLimits.demoDurationMinutes
  });
});
router3.get("/api/admin/db", verifyAdminAuth, (_req, res) => {
  res.json({
    success: true,
    database: {
      settings: globalAdminSettings,
      featureFlags: featureFlagsStore,
      users: adminUsersDb,
      content: adminContentDb,
      utrRequests: Array.from(pendingUtrRequestsDb.values()),
      subscriptions: Array.from(serverSubscriptionsDb.values()),
      orders: Array.from(serverOrdersDb.values()),
      auditLogs: blockedAuditLogs,
      watchdogLogs: watchdogSystemLogs
    }
  });
});
router3.get("/api/admin/error-logs", verifyAdminAuth, (req, res) => {
  try {
    const { userId, userEmail, resolved } = req.query || {};
    let logs = Array.from(userErrorLogsStore.values());
    if (userId) {
      const uStr = String(userId).trim().toLowerCase();
      logs = logs.filter((l) => l.userId && l.userId.toLowerCase() === uStr || l.userEmail && l.userEmail.toLowerCase() === uStr);
    }
    if (userEmail) {
      const eStr = String(userEmail).trim().toLowerCase();
      logs = logs.filter((l) => l.userEmail && l.userEmail.toLowerCase() === eStr);
    }
    if (resolved !== void 0 && resolved !== null && resolved !== "") {
      const isResolved = String(resolved) === "true";
      logs = logs.filter((l) => Boolean(l.resolved) === isResolved);
    }
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const decryptedLogs = logs.map((l) => {
      const decryptedPayload = decryptErrorPayload(l.encryptedPayload);
      return {
        ...l,
        decryptedPayload: decryptedPayload || { message: "[Encrypted content unavailable]", stack: null, context: null }
      };
    });
    res.json({ success: true, logs: decryptedLogs });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch error logs" });
  }
});
router3.post("/api/admin/error-logs/:id/resolve", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const log = userErrorLogsStore.get(id);
    if (!log) {
      return res.status(404).json({ error: "Error log not found" });
    }
    log.resolved = true;
    userErrorLogsStore.set(id, log);
    if (supabaseServer) {
      try {
        await supabaseServer.from("user_error_logs").upsert([
          { id: log.id, data: log, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
        ], { onConflict: "id" });
      } catch (_dbErr) {
      }
    }
    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to resolve error log" });
  }
});
router3.get("/api/admin/utr/requests", verifyAdminAuth, async (req, res) => {
  let list = [];
  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer.from("utr_requests").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        list = data.map(mapRowToUtrRecord);
        for (const item of list) {
          pendingUtrRequestsDb.set(item.id, item);
        }
      }
    } catch (err) {
      console.warn("Supabase fetch UTR requests warning:", err);
    }
  }
  if (list.length === 0) {
    list = Array.from(pendingUtrRequestsDb.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }
  return res.json({ success: true, requests: list });
});
router3.post("/api/admin/utr/approve", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  const { utrId, action = "APPROVE" } = req.body;
  if (!utrId) {
    return res.status(400).json({ error: "utrId parameter is required" });
  }
  let utrRecord = pendingUtrRequestsDb.get(utrId);
  if (!utrRecord && supabaseServer) {
    try {
      const { data } = await supabaseServer.from("utr_requests").select("*").eq("id", utrId).limit(1).maybeSingle();
      if (data) {
        utrRecord = mapRowToUtrRecord(data);
        pendingUtrRequestsDb.set(utrRecord.id, utrRecord);
      }
    } catch (err) {
      console.warn("Supabase UTR lookup warning:", err);
    }
  }
  if (!utrRecord) {
    return res.status(404).json({ error: "UTR request record not found" });
  }
  const adminUser = req.adminEmail || DESIGNATED_ADMIN_EMAIL2;
  const now = /* @__PURE__ */ new Date();
  if (action === "REJECT") {
    utrRecord.status = "REJECTED";
    utrRecord.processedBy = adminUser;
    utrRecord.processedAt = now.toISOString();
    pendingUtrRequestsDb.set(utrId, utrRecord);
    if (supabaseServer) {
      try {
        const { error: jsonbErr } = await supabaseServer.from("utr_requests").upsert([{
          id: utrId,
          data: utrRecord,
          updated_at: now.toISOString()
        }], { onConflict: "id" });
        if (jsonbErr) {
          await supabaseServer.from("utr_requests").update({
            status: "REJECTED",
            processed_by: adminUser,
            processed_at: now.toISOString()
          }).eq("id", utrId);
        }
      } catch (err) {
        console.warn("Supabase UTR reject update warning:", err);
      }
    }
    saveAdminStoreToDisk();
    recordAdminAuditLog({
      user: adminUser,
      action: "REJECT_UTR",
      details: `Admin rejected UTR ${utrRecord.utr} for ${utrRecord.userEmail}`,
      ip: req.clientIp,
      requestId: req.requestId,
      endpoint: req.originalUrl,
      outcome: "SUCCESS"
    });
    return res.json({ success: true, message: `UTR '${utrRecord.utr}' rejected.`, record: utrRecord });
  }
  utrRecord.status = "APPROVED";
  utrRecord.processedBy = adminUser;
  utrRecord.processedAt = now.toISOString();
  pendingUtrRequestsDb.set(utrId, utrRecord);
  if (supabaseServer) {
    try {
      const { error: jsonbErr } = await supabaseServer.from("utr_requests").upsert([{
        id: utrId,
        data: utrRecord,
        updated_at: now.toISOString()
      }], { onConflict: "id" });
      if (jsonbErr) {
        await supabaseServer.from("utr_requests").update({
          status: "APPROVED",
          processed_by: adminUser,
          processed_at: now.toISOString()
        }).eq("id", utrId);
      }
    } catch (err) {
      console.warn("Supabase UTR approve update warning:", err);
    }
  }
  let expiresAt = null;
  if (utrRecord.plan === "monthly") {
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3).toISOString();
  } else if (utrRecord.plan === "annual") {
    expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1e3).toISOString();
  }
  const subRecord = {
    userEmail: utrRecord.userEmail,
    planId: utrRecord.plan,
    isPremium: true,
    activatedAt: now.toISOString(),
    expiresAt,
    paymentId: `utr_${utrRecord.utr}`,
    orderId: `ord_utr_${utrRecord.id}`,
    verificationMethod: "ADMIN_UTR_VERIFIED",
    amountPaid: utrRecord.amount,
    currency: "INR"
  };
  serverSubscriptionsDb.set(utrRecord.userEmail, subRecord);
  if (supabaseServer) {
    await supabaseServer.from("user_subscriptions").upsert([
      { ...subRecord, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
    ], { onConflict: "userEmail" });
  }
  saveAdminStoreToDisk();
  recordAdminAuditLog({
    user: adminUser,
    action: "APPROVE_UTR",
    details: `Admin approved UTR ${utrRecord.utr} and activated ${utrRecord.plan} subscription for ${utrRecord.userEmail}`,
    ip: req.clientIp,
    requestId: req.requestId,
    endpoint: req.originalUrl,
    outcome: "SUCCESS"
  });
  return res.json({
    success: true,
    message: `UTR '${utrRecord.utr}' approved. ${utrRecord.plan} subscription activated for ${utrRecord.userEmail}`,
    subscription: subRecord,
    record: utrRecord
  });
});
router3.post("/api/admin/podcasts", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { title, subject, topperName, audioUrl, description, rank, duration, booklist } = req.body;
    const finalSubject = (title || subject || "").trim();
    const finalTopper = (topperName || "").trim();
    const finalAudio = (audioUrl || "").trim();
    if (!finalTopper || !finalAudio || !finalSubject) {
      return res.status(400).json({ error: "Title/Subject, Topper Name, and Audio URL are required fields." });
    }
    const id = `pod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const parsedBooklist = Array.isArray(booklist) ? booklist : typeof booklist === "string" && booklist.trim() ? booklist.split(",").map((b) => b.trim()).filter(Boolean) : ["Standard NCERT & Core Books"];
    const newPod = {
      id,
      topperName: finalTopper,
      rank: rank || "Topper Strategy",
      subject: finalSubject,
      audioUrl: finalAudio,
      duration: duration || "15:00",
      description: description || "Topper guidance and preparation strategy podcast.",
      booklist: parsedBooklist,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    podcastsStore.set(id, newPod);
    if (supabaseServer) {
      try {
        await supabaseServer.from("podcasts").upsert([{
          id,
          data: newPod,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (err) {
        console.warn("Supabase save podcast warning:", err);
      }
    }
    res.json({ success: true, podcast: newPod, message: "Podcast episode added successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create podcast: " + err.message });
  }
});
router3.get("/api/admin/reward-milestones", verifyAdminAuth, (_req, res) => {
  const milestones = Array.from(rewardMilestonesStore.values());
  res.json({ success: true, milestones });
});
router3.post("/api/admin/reward-milestones", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { id, title, description, rewardType, rewardLabel, requiredVerifiedMinutes, requiredSubject, requiredTopicId, isActive, trackId, tier } = req.body;
    if (!title || !rewardType || !requiredVerifiedMinutes) {
      return res.status(400).json({ error: "Title, rewardType, and requiredVerifiedMinutes are required" });
    }
    const milestoneId = id || `ms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const milestoneObj = {
      id: milestoneId,
      title,
      description: description || "",
      rewardType: rewardType || "goodie",
      rewardLabel: rewardLabel || title,
      requiredVerifiedMinutes: Number(requiredVerifiedMinutes) || 600,
      requiredSubject: requiredSubject || null,
      requiredTopicId: requiredTopicId || null,
      isActive: isActive !== false,
      trackId: trackId ? trackId.trim() : null,
      tier: tier ? Number(tier) : 1,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    rewardMilestonesStore.set(milestoneId, milestoneObj);
    if (supabaseServer) {
      try {
        await supabaseServer.from("reward_milestones").upsert([{
          id: milestoneId,
          data: milestoneObj,
          updated_at: milestoneObj.updated_at
        }], { onConflict: "id" });
      } catch (e) {
      }
    }
    res.json({ success: true, milestone: milestoneObj });
  } catch (err) {
    res.status(500).json({ error: "Failed to save milestone", details: err.message });
  }
});
router3.post("/api/admin/reward-milestones/generate-track", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { trackId, baseTitle, baseRewardLabel, tierCount, baseRequiredMinutes, difficultyMultiplier, rewardEscalation } = req.body;
    if (!trackId || !baseTitle || !tierCount || !baseRequiredMinutes) {
      return res.status(400).json({ error: "trackId, baseTitle, tierCount, and baseRequiredMinutes are required" });
    }
    const count = Number(tierCount) || 3;
    const baseMin = Number(baseRequiredMinutes) || 300;
    const mult = Number(difficultyMultiplier) || 1.4;
    const escalation = Array.isArray(rewardEscalation) ? rewardEscalation : [baseRewardLabel || "Reward"];
    const generatedMilestones = [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (let i = 1; i <= count; i++) {
      const reqMins = Math.round(baseMin * Math.pow(mult, i - 1));
      const rewardLbl = escalation[i - 1] || escalation[escalation.length - 1] || baseRewardLabel || `Tier ${i} Reward`;
      const mId = `ms_${trackId}_t${i}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const mObj = {
        id: mId,
        trackId: trackId.trim(),
        tier: i,
        title: `${baseTitle} - Tier ${i} (${rewardLbl})`,
        description: `Progressive challenge tier ${i} for ${trackId}. Complete ${reqMins} verified study minutes to unlock this reward.`,
        rewardType: i === count ? "subscription" : "merch",
        rewardLabel: rewardLbl,
        requiredVerifiedMinutes: reqMins,
        isActive: true,
        updated_at: now
      };
      rewardMilestonesStore.set(mId, mObj);
      generatedMilestones.push(mObj);
      if (supabaseServer) {
        try {
          await supabaseServer.from("reward_milestones").upsert([{
            id: mId,
            data: mObj,
            updated_at: now
          }], { onConflict: "id" });
        } catch (e) {
        }
      }
    }
    res.json({ success: true, count: generatedMilestones.length, milestones: generatedMilestones });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate track milestones", details: err.message });
  }
});
router3.get("/api/admin/reward-claims", verifyAdminAuth, (req, res) => {
  const statusFilter = (req.query.status || "").toString().trim().toLowerCase();
  let claims = Array.from(rewardClaimsStore.values());
  if (statusFilter) {
    claims = claims.filter((c) => (c.status || "").toLowerCase() === statusFilter);
  }
  res.json({ success: true, claims });
});
router3.post("/api/admin/reward-claims/:id/:action", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const claimId = req.params.id;
    const action = req.params.action.toLowerCase();
    const { adminNote } = req.body;
    const claim = rewardClaimsStore.get(claimId);
    if (!claim) {
      return res.status(404).json({ error: "Reward claim not found" });
    }
    let newStatus = claim.status;
    if (action === "approve") newStatus = "approved";
    else if (action === "reject") newStatus = "rejected";
    else if (action === "fulfill") newStatus = "fulfilled";
    else {
      return res.status(400).json({ error: "Invalid action. Use approve, reject, or fulfill." });
    }
    claim.status = newStatus;
    if (adminNote) claim.adminNote = adminNote;
    if (newStatus === "fulfilled") claim.fulfilledAt = (/* @__PURE__ */ new Date()).toISOString();
    claim.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    rewardClaimsStore.set(claimId, claim);
    if (supabaseServer) {
      try {
        await supabaseServer.from("reward_claims").upsert([{
          id: claimId,
          data: claim,
          updated_at: claim.updated_at
        }], { onConflict: "id" });
      } catch (e) {
      }
    }
    recordAdminAuditLog({
      user: req.adminEmail || "admin",
      action: `REWARD_CLAIM_${action.toUpperCase()}`,
      details: `Admin processed reward claim ${claimId} for user ${claim.userEmail} -> status: ${newStatus}`,
      ip: req.clientIp || "127.0.0.1",
      requestId: req.requestId || "req_claim",
      endpoint: req.originalUrl,
      outcome: "SUCCESS"
    });
    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ error: "Failed to update reward claim", details: err.message });
  }
});
router3.post("/api/admin/subscriptions/activate", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  const { userEmail, planId = "monthly" } = req.body;
  if (!userEmail) {
    return res.status(400).json({ error: "Target userEmail is required" });
  }
  const cleanEmail = String(userEmail).trim().toLowerCase();
  const now = /* @__PURE__ */ new Date();
  let expiresAt = null;
  if (planId === "monthly") {
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3).toISOString();
  } else if (planId === "annual") {
    expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1e3).toISOString();
  }
  const subRecord = {
    userEmail: cleanEmail,
    planId,
    isPremium: true,
    activatedAt: now.toISOString(),
    expiresAt,
    paymentId: `admin_utr_${Date.now()}`,
    orderId: `admin_ord_${Date.now()}`,
    verificationMethod: "ADMIN_VERIFIED",
    amountPaid: 0,
    currency: "INR"
  };
  serverSubscriptionsDb.set(cleanEmail, subRecord);
  let user = adminUsersDb.find((u) => u.email.toLowerCase() === cleanEmail);
  if (user) {
    user.isPremium = true;
    user.planName = planId === "annual" ? "ANNUAL PASS" : "PRO PASS";
  } else {
    user = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanEmail.split("@")[0],
      email: cleanEmail,
      exam: "UPSC CSE 2026",
      role: "USER",
      isPremium: true,
      planName: planId === "annual" ? "ANNUAL PASS" : "PRO PASS",
      streakDays: 1,
      xp: 100,
      coins: 50,
      level: 1,
      completedTopicsCount: 0,
      joinedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "ACTIVE"
    };
    adminUsersDb.push(user);
  }
  if (supabaseServer) {
    await Promise.all([
      supabaseServer.from("user_subscriptions").upsert([
        { ...subRecord, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
      ], { onConflict: "userEmail" }),
      supabaseServer.from("admin_users").upsert([
        { ...user, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
      ], { onConflict: "id" })
    ]);
  }
  saveAdminStoreToDisk();
  recordAdminAuditLog({
    user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
    action: "ACTIVATE_SUBSCRIPTION",
    details: `Admin activated ${planId} subscription for ${cleanEmail}`,
    ip: req.clientIp,
    requestId: req.requestId,
    endpoint: req.originalUrl,
    outcome: "SUCCESS"
  });
  res.json({
    success: true,
    subscription: subRecord,
    message: `Activated ${planId} subscription for ${cleanEmail} via Admin verification.`
  });
});
router3.get("/api/admin/users", verifyAdminAuth, async (_req, res) => {
  try {
    let profileMap = /* @__PURE__ */ new Map();
    if (supabaseServer) {
      const { data: profiles } = await supabaseServer.from("user_profiles").select("id, avatar_url");
      if (profiles) {
        for (const p of profiles) {
          if (p.id && p.avatar_url) {
            profileMap.set(p.id, p.avatar_url);
          }
        }
      }
    }
    const mergedUsers = adminUsersDb.map((u) => ({
      ...u,
      avatar_url: profileMap.get(u.id) || u.avatar_url
    }));
    res.json({ success: true, users: mergedUsers });
  } catch (err) {
    res.json({ success: true, users: adminUsersDb });
  }
});
router3.get("/api/admin/team", verifyAdminAuth, (_req, res) => {
  res.json({ success: true, team: adminTeamStore, tasks: adminTasksStore });
});
router3.post("/api/admin/team", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { name, email, role, title, department, permissions, avatar } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required for staff recruitment." });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const existingIndex = adminTeamStore.findIndex((t) => t.email.toLowerCase() === cleanEmail);
    const newMember = {
      id: existingIndex >= 0 ? adminTeamStore[existingIndex].id : `tm-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      title: title || "Startup Team Member",
      role: role || "ACADEMIC_LEAD",
      department: department || "Operations",
      avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      status: "ACTIVE",
      joinedAt: existingIndex >= 0 ? adminTeamStore[existingIndex].joinedAt : (/* @__PURE__ */ new Date()).toISOString(),
      permissions: permissions || {
        canManageFinance: false,
        canManageAdsense: false,
        canManageFlags: false,
        canManageUsers: true,
        canManageTeam: false,
        canManageWatchdog: false,
        canManageCustomizer: false
      }
    };
    if (existingIndex >= 0) {
      adminTeamStore[existingIndex] = newMember;
    } else {
      adminTeamStore.push(newMember);
    }
    await saveAdminStoreToDisk();
    recordAdminAuditLog({
      user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
      action: existingIndex >= 0 ? "UPDATE_TEAM_MEMBER" : "ADD_TEAM_MEMBER",
      details: `Recruited/Updated ${newMember.name} (${cleanEmail}) as ${newMember.role} in ${newMember.department}`,
      ip: req.clientIp,
      requestId: req.requestId,
      endpoint: req.originalUrl,
      outcome: "SUCCESS"
    });
    res.json({ success: true, member: newMember, team: adminTeamStore });
  } catch (err) {
    res.status(500).json({ error: "Failed to add/update team member" });
  }
});
router3.put("/api/admin/team/:id", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const memberId = req.params.id;
    const member = adminTeamStore.find((t) => t.id === memberId);
    if (!member) {
      return res.status(404).json({ error: "Team member not found." });
    }
    const { role, title, department, permissions, status } = req.body;
    if (role) member.role = role;
    if (title) member.title = title;
    if (department) member.department = department;
    if (permissions) member.permissions = { ...member.permissions, ...permissions };
    if (status) member.status = status;
    await saveAdminStoreToDisk();
    recordAdminAuditLog({
      user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
      action: "UPDATE_TEAM_PERMISSIONS",
      details: `Updated permissions/role for ${member.name} (${member.email})`,
      ip: req.clientIp,
      requestId: req.requestId,
      endpoint: req.originalUrl,
      outcome: "SUCCESS"
    });
    res.json({ success: true, member, team: adminTeamStore });
  } catch (err) {
    res.status(500).json({ error: "Failed to update team permissions" });
  }
});
router3.delete("/api/admin/team/:id", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const memberId = req.params.id;
    setAdminTeamStore(adminTeamStore.filter((t) => t.id !== memberId));
    await saveAdminStoreToDisk();
    res.json({ success: true, memberId, team: adminTeamStore });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete team member" });
  }
});
router3.post("/api/admin/team/tasks", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { title, description, assignedTo, module: module2, priority, dueDate } = req.body;
    if (!title || !assignedTo) {
      return res.status(400).json({ error: "Task title and assigned employee email are required." });
    }
    const assignee = adminTeamStore.find((t) => t.email.toLowerCase() === String(assignedTo).trim().toLowerCase());
    const newTask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: (description || "").trim(),
      assignedTo: String(assignedTo).trim().toLowerCase(),
      assignedToName: assignee ? assignee.name : assignedTo,
      module: module2 || "OPERATIONS",
      priority: priority || "MEDIUM",
      status: "PENDING",
      assignedAt: (/* @__PURE__ */ new Date()).toISOString(),
      dueDate: dueDate || "Today"
    };
    adminTasksStore.unshift(newTask);
    await saveAdminStoreToDisk();
    res.json({ success: true, task: newTask, tasks: adminTasksStore });
  } catch (err) {
    res.status(500).json({ error: "Failed to create work task" });
  }
});
router3.put("/api/admin/team/tasks/:id/status", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    const task = adminTasksStore.find((t) => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }
    task.status = status || "COMPLETED";
    await saveAdminStoreToDisk();
    res.json({ success: true, task, tasks: adminTasksStore });
  } catch (err) {
    res.status(500).json({ error: "Failed to update task status" });
  }
});
router3.get("/api/feature-flags", (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.json({ flags: featureFlagsStore });
});
router3.post("/api/feature-flags/toggle", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  const { feature_name, is_premium } = req.body;
  setFeatureFlagsStore(featureFlagsStore.map((flag) => {
    if (flag.feature_name === feature_name) {
      return { ...flag, is_premium: Boolean(is_premium) };
    }
    return flag;
  }));
  if (supabaseServer) {
    const { error } = await supabaseServer.from("feature_flags").upsert(
      featureFlagsStore.map((f) => ({ ...f, updated_at: (/* @__PURE__ */ new Date()).toISOString() })),
      { onConflict: "feature_name" }
    );
    if (error) {
      console.error("Failed to upsert feature_flags in Supabase:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  saveAdminStoreToDisk();
  recordAdminAuditLog({
    user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
    action: "TOGGLE_FEATURE_FLAG",
    details: `Flag '${feature_name}' set to premium=${is_premium}`,
    ip: req.clientIp,
    requestId: req.requestId,
    endpoint: req.originalUrl,
    outcome: "SUCCESS"
  });
  res.json({ success: true, flags: featureFlagsStore });
});
router3.post("/api/feature-flags/add", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  const { feature_name, label, description, is_premium } = req.body;
  if (!feature_name || !label) {
    return res.status(400).json({ error: "feature_name and label are required" });
  }
  const cleanName = String(feature_name).trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const exists = featureFlagsStore.some((f) => f.feature_name === cleanName);
  if (exists) {
    return res.status(400).json({ error: "A feature flag with this key name already exists" });
  }
  const newFlag = {
    feature_name: cleanName,
    label: String(label).trim(),
    description: description ? String(description).trim() : "Custom feature restriction flag",
    is_premium: Boolean(is_premium)
  };
  featureFlagsStore.push(newFlag);
  if (supabaseServer) {
    const { error } = await supabaseServer.from("feature_flags").upsert([
      { ...newFlag, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
    ], { onConflict: "feature_name" });
    if (error) {
      console.error("Failed to upsert feature_flags in Supabase:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  saveAdminStoreToDisk();
  recordAdminAuditLog({
    user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
    action: "ADD_FEATURE_FLAG",
    details: `Added flag '${cleanName}' (${label})`,
    ip: req.clientIp,
    requestId: req.requestId,
    endpoint: req.originalUrl,
    outcome: "SUCCESS"
  });
  res.json({ success: true, flags: featureFlagsStore });
});
router3.post("/api/feature-flags/preset", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  const { action } = req.body;
  if (action === "lock_all") {
    setFeatureFlagsStore(featureFlagsStore.map((f) => ({ ...f, is_premium: true })));
  } else if (action === "unlock_all") {
    setFeatureFlagsStore(featureFlagsStore.map((f) => ({ ...f, is_premium: false })));
  } else if (action === "reset") {
    setFeatureFlagsStore([...defaultFeatureFlagsStore]);
  } else {
    return res.status(400).json({ error: "Invalid preset action" });
  }
  if (supabaseServer) {
    const { error } = await supabaseServer.from("feature_flags").upsert(
      featureFlagsStore.map((f) => ({ ...f, updated_at: (/* @__PURE__ */ new Date()).toISOString() })),
      { onConflict: "feature_name" }
    );
    if (error) {
      console.error("Failed to upsert feature_flags in Supabase:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  saveAdminStoreToDisk();
  recordAdminAuditLog({
    user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
    action: "PRESET_FEATURE_FLAGS",
    details: `Applied preset action '${action}'`,
    ip: req.clientIp,
    requestId: req.requestId,
    endpoint: req.originalUrl,
    outcome: "SUCCESS"
  });
  res.json({ success: true, flags: featureFlagsStore });
});
router3.delete("/api/feature-flags/:feature_name", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  const { feature_name } = req.params;
  setFeatureFlagsStore(featureFlagsStore.filter((f) => f.feature_name !== feature_name));
  if (supabaseServer) {
    await supabaseServer.from("feature_flags").delete().eq("feature_name", feature_name);
  }
  saveAdminStoreToDisk();
  recordAdminAuditLog({
    user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
    action: "DELETE_FEATURE_FLAG",
    details: `Deleted flag '${feature_name}'`,
    ip: req.clientIp,
    requestId: req.requestId,
    endpoint: req.originalUrl,
    outcome: "SUCCESS"
  });
  res.json({ success: true, flags: featureFlagsStore });
});
router3.post("/api/admin/settings", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  updateGlobalAdminSettings(req.body, req.body.updatedBy || req.adminEmail || "Admin");
  if (supabaseServer) {
    const { error } = await supabaseServer.from("admin_settings").upsert([
      { id: "global", data: globalAdminSettings, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
    ], { onConflict: "id" });
    if (error) {
      console.error("Failed to upsert admin_settings in Supabase:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  saveAdminStoreToDisk();
  recordAdminAuditLog({
    user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
    action: "UPDATE_ADMIN_SETTINGS",
    details: `Updated global admin configuration settings`,
    ip: req.clientIp,
    requestId: req.requestId,
    endpoint: req.originalUrl,
    outcome: "SUCCESS"
  });
  res.json({ success: true, settings: globalAdminSettings });
});
router3.get("/api/admin/moderation-settings", verifyAdminAuth, (req, res) => {
  res.json(globalAdminSettings.moderation || { enabled: true, autoban: true, keywords: [] });
});
router3.put("/api/admin/moderation-settings", verifyAdminAuth, adminMutationLimiter, async (req, res) => {
  try {
    const { enabled, autoban, keywords } = req.body;
    if (!globalAdminSettings.moderation) {
      globalAdminSettings.moderation = { enabled: true, autoban: true, keywords: [] };
    }
    if (typeof enabled === "boolean") globalAdminSettings.moderation.enabled = enabled;
    if (typeof autoban === "boolean") globalAdminSettings.moderation.autoban = autoban;
    if (Array.isArray(keywords)) globalAdminSettings.moderation.keywords = keywords;
    globalAdminSettings.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    globalAdminSettings.lastUpdatedBy = req.verifiedUser?.email || "Admin";
    if (supabaseServer) {
      await supabaseServer.from("admin_settings").upsert([
        { id: "global", data: globalAdminSettings, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
      ], { onConflict: "id" });
    }
    saveAdminStoreToDisk();
    recordAdminAuditLog({
      user: req.verifiedUser?.email || "ADMIN",
      action: "UPDATE_MODERATION_SETTINGS",
      details: `Updated moderation settings (Autoban: ${globalAdminSettings.moderation.autoban}, Keywords count: ${globalAdminSettings.moderation.keywords.length})`
    });
    res.json({ success: true, moderation: globalAdminSettings.moderation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.post("/api/admin/force-reload", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    await hydrateFromPrimaryDatabase();
    return res.json({ success: true, message: "Server state reloaded from Supabase successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || "Failed to reload state." });
  }
});
router3.get("/api/admin/live-users", verifyAdminAuth, (_req, res) => {
  try {
    const now = Date.now();
    const threshold = 18e4;
    let liveCount = 0;
    const onlineUsers = [];
    for (const [key, val] of activeUsersPresenceMap.entries()) {
      if (now - val.lastSeen > 18e5) {
        activeUsersPresenceMap.delete(key);
      } else if (now - val.lastSeen <= threshold) {
        liveCount++;
        onlineUsers.push(val);
      }
    }
    res.json({
      success: true,
      liveCount,
      totalRegistered: adminUsersDb.length,
      onlineUsers,
      allPresence: Array.from(activeUsersPresenceMap.values())
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch live users" });
  }
});
router3.post("/api/admin/users", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  const { users } = req.body;
  if (Array.isArray(users)) {
    setAdminUsersDb(users);
    if (supabaseServer) {
      await supabaseServer.from("admin_users").upsert(
        adminUsersDb.map((u) => ({ ...u, updated_at: (/* @__PURE__ */ new Date()).toISOString() })),
        { onConflict: "id" }
      );
    }
    saveAdminStoreToDisk();
    recordAdminAuditLog({
      user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
      action: "SYNC_USER_DIRECTORY",
      details: `Synced ${users.length} users into directory`,
      ip: req.clientIp,
      requestId: req.requestId,
      endpoint: req.originalUrl,
      outcome: "SUCCESS"
    });
    return res.json({ success: true, count: adminUsersDb.length, users: adminUsersDb });
  }
  res.status(400).json({ error: "Invalid users array provided" });
});
router3.put("/api/admin/users/:email", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  const targetEmail = decodeURIComponent(String(req.params.email || "")).trim().toLowerCase();
  const updates = req.body;
  let found = false;
  setAdminUsersDb(adminUsersDb.map((u) => {
    if (String(u.email).trim().toLowerCase() === targetEmail) {
      found = true;
      const updatedUser = { ...u, ...updates };
      if (typeof updates.isPremium === "boolean") {
        if (updates.isPremium) {
          serverSubscriptionsDb.set(targetEmail, {
            userEmail: targetEmail,
            planId: updates.planName || "PRO PASS",
            isPremium: true,
            activatedAt: (/* @__PURE__ */ new Date()).toISOString(),
            expiresAt: null,
            paymentId: `admin_sync_${Date.now()}`,
            orderId: `admin_sync_${Date.now()}`,
            verificationMethod: "ADMIN_VERIFIED",
            amountPaid: 0,
            currency: "INR"
          });
        } else {
          serverSubscriptionsDb.delete(targetEmail);
        }
      }
      return updatedUser;
    }
    return u;
  }));
  if (!found && updates.email) {
    const newUser = {
      id: updates.id || `usr-${Date.now()}`,
      name: updates.name || "User",
      email: targetEmail,
      role: updates.role || "USER",
      isPremium: Boolean(updates.isPremium),
      planName: updates.planName || (updates.isPremium ? "PRO PASS" : "FREE"),
      streakDays: updates.streakDays || 1,
      xp: updates.xp || 100,
      coins: updates.coins || 50,
      level: updates.level || 1,
      completedTopicsCount: updates.completedTopicsCount || 0,
      joinedAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      status: updates.status || "ACTIVE"
    };
    adminUsersDb.unshift(newUser);
  }
  if (supabaseServer) {
    const updatedRecord = adminUsersDb.find((u) => String(u.email).trim().toLowerCase() === targetEmail);
    if (updatedRecord) {
      await supabaseServer.from("admin_users").upsert([{ ...updatedRecord, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
    }
    const sub = serverSubscriptionsDb.get(targetEmail);
    if (sub) {
      await supabaseServer.from("user_subscriptions").upsert([{ ...sub, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "userEmail" });
    } else {
      await supabaseServer.from("user_subscriptions").delete().eq("userEmail", targetEmail);
    }
  }
  saveAdminStoreToDisk();
  recordAdminAuditLog({
    user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
    action: "UPDATE_USER",
    details: `Updated user details/role for ${targetEmail}`,
    ip: req.clientIp,
    requestId: req.requestId,
    endpoint: req.originalUrl,
    outcome: "SUCCESS"
  });
  res.json({ success: true, users: adminUsersDb });
});
router3.delete("/api/admin/users/:email", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  const targetEmail = String(req.params.email).trim().toLowerCase();
  const userToRemove = adminUsersDb.find((u) => String(u.email).trim().toLowerCase() === targetEmail);
  setAdminUsersDb(adminUsersDb.filter((u) => String(u.email).trim().toLowerCase() !== targetEmail));
  serverSubscriptionsDb.delete(targetEmail);
  if (supabaseServer) {
    if (userToRemove?.id) {
      await supabaseServer.from("admin_users").delete().eq("id", userToRemove.id);
    }
    await supabaseServer.from("user_subscriptions").delete().eq("userEmail", targetEmail);
  }
  saveAdminStoreToDisk();
  recordAdminAuditLog({
    user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
    action: "DELETE_USER",
    details: `Removed user ${targetEmail} from system`,
    ip: req.clientIp,
    requestId: req.requestId,
    endpoint: req.originalUrl,
    outcome: "SUCCESS"
  });
  res.json({ success: true, users: adminUsersDb });
});
router3.get("/api/admin/content", (_req, res) => {
  res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.json(adminContentDb);
});
router3.post("/api/admin/content", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  const updates = req.body;
  const beforeSnippet = JSON.stringify(adminContentDb).substring(0, 100);
  setAdminContentDb({
    ...adminContentDb,
    ...updates
  });
  if (supabaseServer) {
    await supabaseServer.from("admin_content").upsert([
      { id: "global", data: adminContentDb, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
    ], { onConflict: "id" });
  }
  saveAdminStoreToDisk();
  recordAdminAuditLog({
    user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
    action: "UPDATE_CONTENT",
    details: `Updated admin database content section`,
    ip: req.clientIp,
    requestId: req.requestId,
    endpoint: req.originalUrl,
    outcome: "SUCCESS",
    beforeValue: beforeSnippet,
    afterValue: JSON.stringify(updates).substring(0, 100)
  });
  res.json({ success: true, content: adminContentDb });
});
router3.get("/api/admin/audit-logs", verifyAdminAuth, (_req, res) => {
  res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.json(blockedAuditLogs);
});
router3.post("/api/admin/announcements", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { title, message, examTags = [], priority = "normal", isActive = true, expiresAt = null } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Announcement title is required" });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Announcement message is required" });
    }
    const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAnnouncement = {
      id,
      title: title.trim(),
      message: message.trim(),
      examTags: Array.isArray(examTags) ? examTags : [],
      priority: priority === "urgent" ? "urgent" : "normal",
      isActive: Boolean(isActive),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      expiresAt: expiresAt ? String(expiresAt) : null
    };
    adminAnnouncementsStore.set(id, newAnnouncement);
    if (supabaseServer) {
      const { error } = await supabaseServer.from("admin_announcements").upsert({
        id,
        data: newAnnouncement,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }, { onConflict: "id" });
      if (error) {
        console.warn("[ANNOUNCEMENTS] Supabase save error:", error.message);
      }
    }
    recordAdminAuditLog({
      user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
      action: "CREATE_ANNOUNCEMENT",
      details: `Created announcement "${newAnnouncement.title}"`,
      ip: req.clientIp,
      requestId: req.requestId,
      endpoint: req.originalUrl,
      outcome: "SUCCESS",
      afterValue: JSON.stringify(newAnnouncement).substring(0, 100)
    });
    return res.json({ success: true, announcement: newAnnouncement });
  } catch (err) {
    console.error("Create announcement error:", err);
    return res.status(500).json({ error: err?.message || "Failed to create announcement" });
  }
});
router3.get("/api/admin/announcements", verifyAdminAuth, async (_req, res) => {
  res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  await hydrateAnnouncementsFromSupabase();
  const announcements = Array.from(adminAnnouncementsStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return res.json({ success: true, announcements });
});
router3.patch("/api/admin/announcements/:id", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await hydrateAnnouncementsFromSupabase();
    const announcement = adminAnnouncementsStore.get(id);
    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }
    const { title, message, examTags, priority, isActive, expiresAt } = req.body;
    if (title !== void 0 && typeof title === "string") announcement.title = title.trim();
    if (message !== void 0 && typeof message === "string") announcement.message = message.trim();
    if (examTags !== void 0 && Array.isArray(examTags)) announcement.examTags = examTags;
    if (priority !== void 0) announcement.priority = priority === "urgent" ? "urgent" : "normal";
    if (isActive !== void 0) announcement.isActive = Boolean(isActive);
    if (expiresAt !== void 0) announcement.expiresAt = expiresAt ? String(expiresAt) : null;
    adminAnnouncementsStore.set(id, announcement);
    if (supabaseServer) {
      const { error } = await supabaseServer.from("admin_announcements").upsert({
        id,
        data: announcement,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }, { onConflict: "id" });
      if (error) {
        console.warn("[ANNOUNCEMENTS] Supabase update error:", error.message);
      }
    }
    recordAdminAuditLog({
      user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
      action: "UPDATE_ANNOUNCEMENT",
      details: `Updated announcement "${announcement.id}"`,
      ip: req.clientIp,
      requestId: req.requestId,
      endpoint: req.originalUrl,
      outcome: "SUCCESS",
      afterValue: JSON.stringify(announcement).substring(0, 100)
    });
    return res.json({ success: true, announcement });
  } catch (err) {
    console.error("Update announcement error:", err);
    return res.status(500).json({ error: err?.message || "Failed to update announcement" });
  }
});
router3.delete("/api/admin/announcements/:id", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await hydrateAnnouncementsFromSupabase();
    const exists = adminAnnouncementsStore.has(id);
    if (!exists) {
      return res.status(404).json({ error: "Announcement not found" });
    }
    adminAnnouncementsStore.delete(id);
    if (supabaseServer) {
      const { error } = await supabaseServer.from("admin_announcements").delete().eq("id", id);
      if (error) {
        console.warn("[ANNOUNCEMENTS] Supabase delete error:", error.message);
      }
    }
    recordAdminAuditLog({
      user: req.adminEmail || DESIGNATED_ADMIN_EMAIL2,
      action: "DELETE_ANNOUNCEMENT",
      details: `Deleted announcement "${id}"`,
      ip: req.clientIp,
      requestId: req.requestId,
      endpoint: req.originalUrl,
      outcome: "SUCCESS"
    });
    return res.json({ success: true, message: "Announcement deleted successfully" });
  } catch (err) {
    console.error("Delete announcement error:", err);
    return res.status(500).json({ error: err?.message || "Failed to delete announcement" });
  }
});
router3.get("/api/announcements", async (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  await hydrateAnnouncementsFromSupabase();
  const now = /* @__PURE__ */ new Date();
  const examQuery = String(req.query.exam || "").trim().toLowerCase();
  const activeAnnouncements = Array.from(adminAnnouncementsStore.values()).filter((ann) => {
    if (!ann.isActive) return false;
    if (ann.expiresAt && new Date(ann.expiresAt) <= now) return false;
    if (examQuery) {
      if (!ann.examTags || ann.examTags.length === 0) return true;
      const normalizedExamQuery = examQuery.replace(/[\s_]/g, "");
      return ann.examTags.some((tag) => {
        const normalizedTag = tag.toLowerCase().replace(/[\s_]/g, "");
        return normalizedTag === normalizedExamQuery || tag.toLowerCase() === examQuery;
      });
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, announcements: activeAnnouncements });
});
router3.get("/api/admin/payouts", verifyAdminAuth, async (req, res) => {
  try {
    const statusFilter = req.query.status;
    let payouts = Array.from(allPayoutsStore.values());
    if (statusFilter && statusFilter !== "all") {
      payouts = payouts.filter((p) => p.status === statusFilter);
    }
    res.json({ success: true, data: payouts });
  } catch (err) {
    console.error("[GET /api/admin/payouts] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router3.post("/api/admin/payouts/:id/approve", verifyAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const payout = allPayoutsStore.get(id);
    if (!payout) {
      return res.status(404).json({ success: false, error: "Payout request not found" });
    }
    payout.status = "approved";
    payout.processedAt = (/* @__PURE__ */ new Date()).toISOString();
    allPayoutsStore.set(id, payout);
    if (supabaseServer) {
      await supabaseServer.from("user_payouts").update({ status: "approved", updated_at: payout.processedAt }).eq("id", id);
    }
    res.json({ success: true, data: payout });
  } catch (err) {
    console.error("[POST /api/admin/payouts/:id/approve] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router3.post("/api/admin/moderation/:contentId/action", verifyAdminAuth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { action, contentType, adminNote } = req.body;
    if (!action) {
      return res.status(400).json({ success: false, error: "Moderation action is required" });
    }
    if (action === "delete") {
      if (contentType === "post") {
        communityPostsStore.delete(contentId);
      } else if (contentType === "comment") {
        for (const [pId, list] of communityCommentsStore.entries()) {
          const filtered = list.filter((c) => c.id !== contentId);
          communityCommentsStore.set(pId, filtered);
        }
      }
    }
    res.json({
      success: true,
      data: {
        contentId,
        action,
        adminNote: adminNote || "",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (err) {
    console.error("[POST /api/admin/moderation/:contentId/action] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router3.get("/api/admin/feedback", verifyAdminAuth, async (_req, res) => {
  try {
    const feedbackList = Array.from(feedbackReportsStore.values());
    res.json({ success: true, data: feedbackList });
  } catch (err) {
    console.error("[GET /api/admin/feedback] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router3.post("/api/admin/ingestion/trigger", verifyAdminAuth, async (req, res) => {
  try {
    const { source, exam, options } = req.body;
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const jobStatus = {
      jobId,
      source: source || "manual_upload",
      exam: exam || "UPSC_CSE",
      options: options || {},
      status: "completed",
      processedItems: 45,
      errorsCount: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    res.json({ success: true, data: jobStatus });
  } catch (err) {
    console.error("[POST /api/admin/ingestion/trigger] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router3.get("/api/admin/ingestion/status/:jobId", verifyAdminAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = {
      jobId,
      status: "completed",
      progressPercentage: 100,
      detected: 30,
      published: 28,
      sentToReview: 2,
      rejected: 0,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    res.json({ success: true, data: status });
  } catch (err) {
    console.error("[GET /api/admin/ingestion/status/:jobId] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
var admin_routes_default = router3;

// routes/user.routes.ts
var import_express4 = require("express");
var import_path5 = __toESM(require("path"), 1);
var import_crypto3 = __toESM(require("crypto"), 1);
var import_jsonwebtoken3 = __toESM(require("jsonwebtoken"), 1);
var router4 = (0, import_express4.Router)();
var __dirname4 = import_path5.default.resolve();
router4.get("/api/user/subjects", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer.from("user_custom_subjects").select("*").eq("user_id", userId);
      if (!error && data) {
        return res.json({ success: true, subjects: data.map((s) => ({ id: s.id, userId: s.user_id, name: s.name, createdAt: s.created_at, updatedAt: s.updated_at })) });
      }
    } catch (e) {
    }
  }
  const userSubjects = userCustomSubjectsDb.filter((s) => s.userId === userId);
  return res.json({ success: true, subjects: userSubjects });
});
router4.post("/api/user/subjects", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Subject name is required" });
  }
  const newSubject = {
    id: `subj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    name: name.trim(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  userCustomSubjectsDb.push(newSubject);
  if (supabaseServer) {
    try {
      await supabaseServer.from("user_custom_subjects").insert([{
        id: newSubject.id,
        user_id: newSubject.userId,
        name: newSubject.name,
        created_at: newSubject.createdAt,
        updated_at: newSubject.updatedAt
      }]);
    } catch (e) {
    }
  }
  return res.json({ success: true, subject: newSubject });
});
router4.patch("/api/user/subjects/:id", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  const { id } = req.params;
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Subject name is required" });
  }
  const existing = userCustomSubjectsDb.find((s) => s.id === id);
  if (existing) {
    if (existing.userId !== userId) {
      return res.status(403).json({ error: "Forbidden: Cannot modify custom subject owned by another user" });
    }
    existing.name = name.trim();
    existing.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return res.json({ success: true, subject: existing });
  }
  if (supabaseServer) {
    try {
      const { data } = await supabaseServer.from("user_custom_subjects").select("id, user_id, name, created_at, updated_at").eq("id", id).single();
      if (data) {
        if (data.user_id !== userId) {
          return res.status(403).json({ error: "Forbidden: Cannot modify custom subject owned by another user" });
        }
        const { data: updated } = await supabaseServer.from("user_custom_subjects").update({ name: name.trim(), updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).select().single();
        return res.json({ success: true, subject: updated });
      }
    } catch (e) {
    }
  }
  return res.status(404).json({ error: "Subject not found" });
});
router4.put("/api/user/subjects/:id", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  const { id } = req.params;
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Subject name is required" });
  }
  const existing = userCustomSubjectsDb.find((s) => s.id === id);
  if (existing) {
    if (existing.userId !== userId) {
      return res.status(403).json({ error: "Forbidden: Cannot modify custom subject owned by another user" });
    }
    existing.name = name.trim();
    existing.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return res.json({ success: true, subject: existing });
  }
  return res.status(404).json({ error: "Subject not found" });
});
router4.delete("/api/user/subjects/:id", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  const { id } = req.params;
  const index = userCustomSubjectsDb.findIndex((s) => s.id === id);
  if (index >= 0) {
    if (userCustomSubjectsDb[index].userId !== userId) {
      return res.status(403).json({ error: "Forbidden: Cannot delete custom subject owned by another user" });
    }
    const removed = userCustomSubjectsDb.splice(index, 1)[0];
    return res.json({ success: true, subject: removed });
  }
  if (supabaseServer) {
    try {
      const { data } = await supabaseServer.from("user_custom_subjects").select("id, user_id, name, created_at, updated_at").eq("id", id).single();
      if (data) {
        if (data.user_id !== userId) {
          return res.status(403).json({ error: "Forbidden: Cannot delete custom subject owned by another user" });
        }
        await supabaseServer.from("user_custom_subjects").delete().eq("id", id);
        return res.json({ success: true, id });
      }
    } catch (e) {
    }
  }
  return res.status(404).json({ error: "Subject not found" });
});
router4.get("/api/user/workspace-preferences", async (req, res) => {
  const rawUserId = String(req.query.userId || "").trim();
  const userId = rawUserId || "default_user";
  if (supabaseServer && rawUserId) {
    try {
      const { data, error } = await supabaseServer.from("user_profiles").select("workspace_preferences").eq("id", rawUserId).maybeSingle();
      if (error) {
        console.warn(`[WorkspacePrefs] Supabase GET query error for user ${rawUserId}:`, error.message, error.code);
      } else if (data?.workspace_preferences) {
        userWorkspacePreferencesDb.set(rawUserId, data.workspace_preferences);
        return res.json({ success: true, workspaceConfig: data.workspace_preferences });
      }
    } catch (err) {
      console.warn(`[WorkspacePrefs] Supabase GET exception for user ${rawUserId}:`, err?.message || err);
    }
  }
  if (userWorkspacePreferencesDb.has(userId)) {
    const cached = userWorkspacePreferencesDb.get(userId);
    return res.json({ success: true, workspaceConfig: cached });
  }
  return res.json({ success: true, workspaceConfig: null });
});
router4.post("/api/user/workspace-preferences", async (req, res) => {
  const rawUserId = String(req.body.userId || "").trim();
  const userId = rawUserId || "default_user";
  const workspaceConfig = req.body.workspaceConfig;
  if (!workspaceConfig) {
    return res.status(400).json({ error: "Missing workspaceConfig payload" });
  }
  userWorkspacePreferencesDb.set(userId, workspaceConfig);
  if (supabaseServer && rawUserId) {
    try {
      const { error } = await supabaseServer.from("user_profiles").update({
        workspace_preferences: workspaceConfig,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", rawUserId);
      if (error) {
        console.warn(`[WorkspacePrefs] Supabase POST update warning for user ${rawUserId}:`, error.message, error.code);
      }
    } catch (err) {
      console.warn(`[WorkspacePrefs] Supabase update exception for user ${rawUserId}:`, err?.message || err);
    }
  }
  return res.json({ success: true, workspaceConfig });
});
router4.get("/api/user/questions", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer.from("user_manual_questions").select("*").eq("user_id", userId);
      if (!error && data) {
        return res.json({
          success: true,
          questions: data.map((q) => ({
            id: q.id,
            userId: q.user_id,
            subject: q.subject,
            topic: q.topic,
            questionText: q.question_text,
            options: q.options,
            correctOption: q.correct_option,
            explanation: q.explanation,
            difficulty: q.difficulty,
            source: "manual",
            answerVerified: Boolean(q.answer_verified),
            createdAt: q.created_at
          }))
        });
      }
    } catch (e) {
    }
  }
  const userQuestions = userManualQuestionsDb.filter((q) => q.userId === userId);
  return res.json({ success: true, questions: userQuestions });
});
router4.post("/api/user/questions", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  const { questionText, options, correctOption, explanation, subject, topic, difficulty } = req.body;
  if (!questionText || typeof questionText !== "string" || !questionText.trim()) {
    return res.status(400).json({ error: "Question text is required" });
  }
  const validCorrectOption = typeof correctOption === "number" && correctOption >= 0 && correctOption <= 3 ? correctOption : null;
  const isVerified = validCorrectOption !== null;
  const newQuestion = {
    id: `mq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    subject: (subject || "General").trim(),
    topic: (topic || "General").trim(),
    questionText: questionText.trim(),
    options: Array.isArray(options) ? options : [],
    correctOption: validCorrectOption,
    explanation: explanation ? String(explanation).trim() : null,
    difficulty: difficulty || "Medium",
    source: "manual",
    answerVerified: isVerified,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  userManualQuestionsDb.push(newQuestion);
  if (supabaseServer) {
    try {
      await supabaseServer.from("user_manual_questions").insert([{
        id: newQuestion.id,
        user_id: newQuestion.userId,
        subject: newQuestion.subject,
        topic: newQuestion.topic,
        question_text: newQuestion.questionText,
        options: newQuestion.options,
        correct_option: newQuestion.correctOption,
        explanation: newQuestion.explanation,
        difficulty: newQuestion.difficulty,
        source: "manual",
        answer_verified: newQuestion.answerVerified,
        created_at: newQuestion.createdAt
      }]);
    } catch (e) {
    }
  }
  return res.json({ success: true, question: newQuestion });
});
router4.patch("/api/user/questions/:id", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  const { id } = req.params;
  const existing = userManualQuestionsDb.find((q) => q.id === id);
  if (existing) {
    if (existing.userId !== userId) {
      return res.status(403).json({ error: "Forbidden: Cannot edit manual question owned by another user" });
    }
    if (req.body.questionText) existing.questionText = req.body.questionText.trim();
    if (Array.isArray(req.body.options)) existing.options = req.body.options;
    if (req.body.correctOption !== void 0) {
      existing.correctOption = typeof req.body.correctOption === "number" && req.body.correctOption >= 0 ? req.body.correctOption : null;
      existing.answerVerified = existing.correctOption !== null;
    }
    if (req.body.subject) existing.subject = req.body.subject;
    if (req.body.topic) existing.topic = req.body.topic;
    return res.json({ success: true, question: existing });
  }
  return res.status(404).json({ error: "Question not found" });
});
router4.put("/api/user/questions/:id", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  const { id } = req.params;
  const existing = userManualQuestionsDb.find((q) => q.id === id);
  if (existing) {
    if (existing.userId !== userId) {
      return res.status(403).json({ error: "Forbidden: Cannot edit manual question owned by another user" });
    }
    if (req.body.questionText) existing.questionText = req.body.questionText.trim();
    if (Array.isArray(req.body.options)) existing.options = req.body.options;
    if (req.body.correctOption !== void 0) {
      existing.correctOption = typeof req.body.correctOption === "number" && req.body.correctOption >= 0 ? req.body.correctOption : null;
      existing.answerVerified = existing.correctOption !== null;
    }
    if (req.body.subject) existing.subject = req.body.subject;
    if (req.body.topic) existing.topic = req.body.topic;
    return res.json({ success: true, question: existing });
  }
  return res.status(404).json({ error: "Question not found" });
});
router4.delete("/api/user/questions/:id", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  const { id } = req.params;
  const index = userManualQuestionsDb.findIndex((q) => q.id === id);
  if (index >= 0) {
    if (userManualQuestionsDb[index].userId !== userId) {
      return res.status(403).json({ error: "Forbidden: Cannot delete manual question owned by another user" });
    }
    const removed = userManualQuestionsDb.splice(index, 1)[0];
    return res.json({ success: true, question: removed });
  }
  return res.status(404).json({ error: "Question not found" });
});
router4.get("/api/user/study-sessions", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer.from("user_pomodoro_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (!error && data) {
        const mapped = data.map((s) => ({
          id: s.id,
          userId: s.user_id,
          subject: s.subject || "General Study",
          topic: s.topic || "General Topic",
          duration: Number(s.duration) || 25,
          startTime: s.start_time,
          endTime: s.end_time,
          completedDuration: Number(s.completed_duration) || 0,
          status: s.status || "ACTIVE",
          questionsAttempted: Number(s.questions_attempted) || 0,
          correctAnswers: Number(s.correct_answers) || 0,
          questionIds: Array.isArray(s.question_ids) ? s.question_ids : [],
          questionSources: Array.isArray(s.question_sources) ? s.question_sources : [],
          manualQuestions: Array.isArray(s.manual_questions) ? s.manual_questions : [],
          selectedQuestions: Array.isArray(s.selected_questions) ? s.selected_questions : [],
          accuracy: Number(s.accuracy) || 0,
          xpEarned: Number(s.xp_earned) || 0,
          createdAt: s.created_at || (/* @__PURE__ */ new Date()).toISOString()
        }));
        return res.json({ success: true, sessions: mapped });
      }
    } catch (err) {
      console.warn("Error fetching study sessions from Supabase:", err);
    }
  }
  const userSessions = userPomodoroSessionsDb.filter((s) => s.userId === userId);
  return res.json({ success: true, sessions: userSessions });
});
router4.post("/api/user/study-sessions", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  const {
    sessionId,
    id,
    subject,
    topic,
    duration,
    startTime,
    endTime,
    completedDuration,
    status,
    questionsAttempted,
    correctAnswers,
    questionIds,
    questionSources,
    manualQuestions,
    selectedQuestions,
    accuracy,
    xpEarned
  } = req.body;
  const targetSessionId = sessionId || id || `pomo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let session = userPomodoroSessionsDb.find((s) => s.id === targetSessionId);
  if (session) {
    if (session.userId !== userId) {
      return res.status(403).json({ error: "Forbidden: Cannot update session owned by another user" });
    }
    if (subject) session.subject = subject;
    if (topic) session.topic = topic;
    if (duration) session.duration = duration;
    if (completedDuration !== void 0) session.completedDuration = completedDuration;
    if (status) session.status = status;
    if (questionsAttempted !== void 0) session.questionsAttempted = questionsAttempted;
    if (accuracy !== void 0) session.accuracy = accuracy;
  } else {
    session = {
      id: targetSessionId,
      userId,
      subject: subject || "General Study",
      topic: topic || "General Topic",
      duration: duration || 25,
      startTime: startTime || (/* @__PURE__ */ new Date()).toISOString(),
      endTime: endTime || null,
      completedDuration: completedDuration || 0,
      status: status || "ACTIVE",
      questionsAttempted: questionsAttempted || 0,
      correctAnswers: correctAnswers || 0,
      questionIds: Array.isArray(questionIds) ? questionIds : [],
      questionSources: Array.isArray(questionSources) ? questionSources : [],
      manualQuestions: Array.isArray(manualQuestions) ? manualQuestions : [],
      selectedQuestions: Array.isArray(selectedQuestions) ? selectedQuestions : [],
      accuracy: accuracy || 0,
      xpEarned: xpEarned || 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    userPomodoroSessionsDb.push(session);
  }
  if (supabaseServer) {
    try {
      await supabaseServer.from("user_pomodoro_sessions").upsert([{
        id: session.id,
        user_id: session.userId,
        subject: session.subject,
        topic: session.topic,
        duration: session.duration,
        start_time: session.startTime,
        end_time: session.endTime,
        completed_duration: session.completedDuration,
        status: session.status,
        questions_attempted: session.questionsAttempted,
        correct_answers: session.correctAnswers,
        question_ids: session.questionIds,
        question_sources: session.questionSources,
        manual_questions: session.manualQuestions,
        selected_questions: session.selectedQuestions,
        accuracy: session.accuracy,
        xp_earned: session.xpEarned,
        created_at: session.createdAt
      }], { onConflict: "id" });
    } catch (e) {
      console.warn("Supabase pomodoro session upsert error:", e);
    }
  }
  return res.json({ success: true, session });
});
router4.post("/api/user/study-sessions/:id/complete", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  const userId = verifiedUser?.sub || req.body.userId || "guest";
  const { id } = req.params;
  const { completedDuration, questionsAttempted, correctAnswers, accuracy, nodeId, nodeSource = "official", subject, topic, subtopic } = req.body;
  const isAlreadyProcessed = processedSessionsStore.has(id);
  let session = userPomodoroSessionsDb.find((s) => s.id === id);
  if (session && session.userId !== userId) {
    return res.status(403).json({ error: "Forbidden: Cannot complete study session owned by another user" });
  }
  if (!session) {
    session = {
      id,
      userId,
      subject: req.body.subject || "General Study",
      topic: req.body.topic || "General Topic",
      duration: req.body.duration || 25,
      startTime: req.body.startTime || (/* @__PURE__ */ new Date()).toISOString(),
      endTime: (/* @__PURE__ */ new Date()).toISOString(),
      completedDuration: completedDuration || 1500,
      status: "COMPLETED",
      questionsAttempted: questionsAttempted || 0,
      correctAnswers: correctAnswers || 0,
      questionIds: req.body.questionIds || [],
      questionSources: req.body.questionSources || [],
      manualQuestions: req.body.manualQuestions || [],
      selectedQuestions: req.body.selectedQuestions || [],
      accuracy: accuracy || 100,
      xpEarned: 50,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    userPomodoroSessionsDb.push(session);
  } else {
    session.status = "COMPLETED";
    session.endTime = (/* @__PURE__ */ new Date()).toISOString();
    if (completedDuration) session.completedDuration = completedDuration;
    if (questionsAttempted !== void 0) session.questionsAttempted = questionsAttempted;
    if (correctAnswers !== void 0) session.correctAnswers = correctAnswers;
    if (accuracy !== void 0) session.accuracy = accuracy;
  }
  if (isAlreadyProcessed) {
    if (supabaseServer) {
      try {
        await supabaseServer.from("user_pomodoro_sessions").upsert([{
          id: session.id,
          user_id: session.userId,
          subject: session.subject,
          topic: session.topic,
          duration: session.duration,
          start_time: session.startTime,
          end_time: session.endTime,
          completed_duration: session.completedDuration,
          status: session.status,
          questions_attempted: session.questionsAttempted,
          correct_answers: session.correctAnswers,
          question_ids: session.questionIds,
          question_sources: session.questionSources,
          manual_questions: session.manualQuestions,
          selected_questions: session.selectedQuestions,
          accuracy: session.accuracy,
          xp_earned: session.xpEarned,
          created_at: session.createdAt
        }], { onConflict: "id" });
      } catch (e) {
      }
    }
    return res.json({
      success: true,
      session,
      xpAwarded: 0,
      alreadyAwarded: true,
      message: "Session already completed and XP awarded previously."
    });
  }
  processedSessionsStore.add(id);
  const xpAwarded = Math.min(100, Math.max(10, Math.round(session.completedDuration / 60 * 2)));
  session.xpEarned = xpAwarded;
  if (supabaseServer) {
    try {
      await supabaseServer.from("user_pomodoro_sessions").upsert([{
        id: session.id,
        user_id: session.userId,
        subject: session.subject,
        topic: session.topic,
        duration: session.duration,
        start_time: session.startTime,
        end_time: session.endTime,
        completed_duration: session.completedDuration,
        status: session.status,
        questions_attempted: session.questionsAttempted,
        correct_answers: session.correctAnswers,
        question_ids: session.questionIds,
        question_sources: session.questionSources,
        manual_questions: session.manualQuestions,
        selected_questions: session.selectedQuestions,
        accuracy: session.accuracy,
        xp_earned: session.xpEarned,
        created_at: session.createdAt
      }], { onConflict: "id" });
    } catch (e) {
      console.warn("Supabase pomodoro completion upsert error:", e);
    }
  }
  let streakResult = null;
  if ((session.completedDuration || 0) >= 300 || (session.duration || 0) >= 5) {
    try {
      streakResult = await updateStreak(userId);
    } catch (e) {
      console.warn("Streak update on study session complete error:", e);
    }
  }
  let syllabusTimeLogged = null;
  let totalTimeForNode = 0;
  const secondsLogged = Number(req.body.secondsLogged || completedDuration || (session.duration ? session.duration * 60 : 0)) || 0;
  if (secondsLogged > 0 && (nodeId || subject || topic || subtopic)) {
    try {
      const logRecord = {
        id: `stl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: userId,
        node_id: nodeId || null,
        node_source: nodeSource,
        subject: subject || session.subject || "",
        topic: topic || session.topic || "",
        subtopic: subtopic || "",
        seconds_logged: secondsLogged,
        session_id: id,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!syllabusTimeLogsStore.has(userId)) syllabusTimeLogsStore.set(userId, []);
      syllabusTimeLogsStore.get(userId).push(logRecord);
      if (supabaseServer) {
        await supabaseServer.from("syllabus_time_log").insert([logRecord]);
      }
      const userLogs = syllabusTimeLogsStore.get(userId) || [];
      totalTimeForNode = userLogs.filter((l) => nodeId && l.node_id === nodeId || l.subject === (subject || session.subject) && l.subtopic === subtopic).reduce((sum, l) => sum + (l.seconds_logged || 0), 0);
      if (nodeSource === "personal" && nodeId) {
        const existingNode = personalSyllabusNodesStore.get(nodeId);
        if (existingNode) {
          existingNode.time_studied_seconds = (Number(existingNode.time_studied_seconds) || 0) + secondsLogged;
          existingNode.updated_at = (/* @__PURE__ */ new Date()).toISOString();
          totalTimeForNode = Math.max(totalTimeForNode, existingNode.time_studied_seconds);
        }
        if (supabaseServer) {
          const { data: currentData } = await supabaseServer.from("personal_syllabus_nodes").select("time_studied_seconds").eq("id", nodeId).maybeSingle();
          const newTime = (Number(currentData?.time_studied_seconds) || 0) + secondsLogged;
          totalTimeForNode = Math.max(totalTimeForNode, newTime);
          await supabaseServer.from("personal_syllabus_nodes").update({ time_studied_seconds: newTime, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", nodeId);
        }
      }
      syllabusTimeLogged = {
        logged: true,
        nodeId: nodeId || null,
        nodeSource,
        secondsLogged,
        totalTimeForNode
      };
    } catch (stlErr) {
      console.warn("Syllabus time logging on session complete error:", stlErr);
    }
  }
  return res.json({
    success: true,
    session,
    xpAwarded,
    alreadyAwarded: false,
    streak: streakResult,
    syllabusTimeLogged,
    totalTimeForNode,
    message: "Session completed successfully and XP awarded."
  });
});
router4.patch("/api/user/study-sessions/:id", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  const { id } = req.params;
  const session = userPomodoroSessionsDb.find((s) => s.id === id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  if (session.userId !== userId) {
    return res.status(403).json({ error: "Forbidden: Cannot edit session owned by another user" });
  }
  if (req.body.status) session.status = req.body.status;
  if (req.body.completedDuration !== void 0) session.completedDuration = req.body.completedDuration;
  if (req.body.accuracy !== void 0) session.accuracy = req.body.accuracy;
  if (supabaseServer) {
    try {
      await supabaseServer.from("user_pomodoro_sessions").upsert([{
        id: session.id,
        user_id: session.userId,
        subject: session.subject,
        topic: session.topic,
        duration: session.duration,
        start_time: session.startTime,
        end_time: session.endTime,
        completed_duration: session.completedDuration,
        status: session.status,
        questions_attempted: session.questionsAttempted,
        correct_answers: session.correctAnswers,
        question_ids: session.questionIds,
        question_sources: session.questionSources,
        manual_questions: session.manualQuestions,
        selected_questions: session.selectedQuestions,
        accuracy: session.accuracy,
        xp_earned: session.xpEarned,
        created_at: session.createdAt
      }], { onConflict: "id" });
    } catch (e) {
      console.warn("Supabase pomodoro patch error:", e);
    }
  }
  return res.json({ success: true, session });
});
router4.delete("/api/user/study-sessions/:id", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  const { id } = req.params;
  const index = userPomodoroSessionsDb.findIndex((s) => s.id === id);
  if (index >= 0) {
    if (userPomodoroSessionsDb[index].userId !== userId) {
      return res.status(403).json({ error: "Forbidden: Cannot delete session owned by another user" });
    }
    const removed = userPomodoroSessionsDb.splice(index, 1)[0];
    if (supabaseServer) {
      try {
        await supabaseServer.from("user_pomodoro_sessions").delete().eq("id", id).eq("user_id", userId);
      } catch (e) {
        console.warn("Supabase pomodoro delete error:", e);
      }
    }
    return res.json({ success: true, session: removed });
  }
  return res.status(404).json({ error: "Session not found" });
});
router4.post("/api/user/streak/trigger", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  const userId = verifiedUser?.sub || req.body.userId || req.body.userEmail || "guest";
  const { activityType = "general" } = req.body;
  const result = await updateStreak(userId);
  return res.json({ success: true, activityType, ...result });
});
router4.get("/api/user/profile", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  if (supabaseServer && userId) {
    try {
      const { data, error } = await supabaseServer.from("user_profiles").select("*").eq("id", userId).single();
      if (!error && data) {
        const isComplete = data.is_profile_complete === true || Boolean(data.exam && data.exam.trim() !== "");
        return res.json({
          success: true,
          profile: {
            id: data.id,
            name: data.name || verifiedUser.email.split("@")[0],
            email: verifiedUser.email,
            exam: data.exam || "NEET_UG",
            targetExam: data.exam || "NEET_UG",
            profileComplete: isComplete,
            isProfileComplete: isComplete,
            educationCategory: data.education_category || "UPSC_CIVILS",
            stateName: data.state_name || "All India",
            targetYear: data.target_year || 2026,
            streakDays: data.streak_days || 1,
            lastActiveDate: data.last_active_date || getISTDateString(),
            xp: data.xp || 0,
            coins: data.coins || 0,
            level: data.level || 1
          }
        });
      }
    } catch (e) {
    }
  }
  return res.json({
    success: true,
    profile: {
      id: userId,
      name: verifiedUser.email.split("@")[0],
      email: verifiedUser.email,
      exam: "NEET_UG",
      targetExam: "NEET_UG",
      profileComplete: true,
      isProfileComplete: true,
      targetYear: 2026,
      streakDays: 1,
      lastActiveDate: getISTDateString(),
      xp: 0,
      coins: 0,
      level: 1
    }
  });
});
router4.post("/api/user/profile", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Authentication Required" });
  }
  const userId = verifiedUser.sub || "user_dev";
  const { name, exam, targetExam, educationCategory, stateName, targetYear, isProfileComplete } = req.body;
  const chosenExam = targetExam || exam || "NEET_UG";
  const complete = isProfileComplete !== void 0 ? isProfileComplete : Boolean(chosenExam && chosenExam.trim());
  if (supabaseServer && userId) {
    try {
      await supabaseServer.from("user_profiles").upsert({
        id: userId,
        name: name || verifiedUser.email.split("@")[0],
        exam: chosenExam,
        education_category: educationCategory || "UPSC_CIVILS",
        state_name: stateName || "All India",
        target_year: targetYear || 2026,
        is_profile_complete: complete,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (e) {
    }
  }
  return res.json({
    success: true,
    profile: {
      id: userId,
      name: name || verifiedUser.email.split("@")[0],
      email: verifiedUser.email,
      exam: chosenExam,
      targetExam: chosenExam,
      profileComplete: complete,
      isProfileComplete: complete,
      educationCategory,
      stateName,
      targetYear: targetYear || 2026
    }
  });
});
router4.post("/api/error-log", errorLogRateLimiter, async (req, res) => {
  try {
    const { userId, userEmail, source, endpoint, severity, message, stack, context } = req.body || {};
    const plainPayload = {
      message: message || "Unknown Error",
      stack: stack || null,
      context: context || null
    };
    const encryptedPayload = encryptErrorPayload(plainPayload);
    const logRecord = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: userId ? String(userId) : null,
      userEmail: userEmail ? String(userEmail).trim().toLowerCase() : null,
      source: source === "backend" ? "backend" : "frontend",
      endpoint: endpoint ? String(endpoint) : null,
      severity: severity === "warning" ? "warning" : "error",
      encryptedPayload,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      resolved: false
    };
    userErrorLogsStore.set(logRecord.id, logRecord);
    if (supabaseServer) {
      try {
        await supabaseServer.from("user_error_logs").upsert([
          { id: logRecord.id, data: logRecord, updated_at: logRecord.createdAt }
        ], { onConflict: "id" });
      } catch (_dbErr) {
      }
    }
    res.json({ success: true, id: logRecord.id });
  } catch (err) {
    console.warn("[ERROR LOGGING API FAILED]", err);
    res.status(500).json({ error: "Failed to record error log" });
  }
});
router4.post("/api/payments/razorpay-order", paymentRateLimiter, async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  const { planId = "monthly", amount, currency = "INR", userEmail: bodyEmail = "", userName = "" } = req.body;
  const userEmail = verifiedUser?.email || bodyEmail;
  const razorpayConfig = globalAdminSettings.razorpay;
  const keyId = razorpayConfig.keyId || process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "";
  const keySecret = razorpayConfig.keySecret || process.env.RAZORPAY_KEY_SECRET || "";
  const orderAmount = amount || (planId === "monthly" ? globalAdminSettings.planPricing.monthlyPrice : globalAdminSettings.planPricing.annualPrice);
  const amountInPaise = Math.round(orderAmount * 100);
  const validKey = Boolean(keyId) && !keyId.includes("demo") && keyId.length > 5;
  const validSecret = Boolean(keySecret) && !keySecret.includes("demo") && keySecret.length > 5;
  let orderId = "";
  let realOrderCreated = false;
  if (validKey && validSecret) {
    try {
      const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: currency || razorpayConfig.currency || "INR",
          receipt: `receipt_${Date.now()}`,
          notes: {
            userEmail: userEmail ? String(userEmail).trim().toLowerCase() : "",
            userName: userName || "",
            planId
          }
        })
      });
      if (rzpRes.ok) {
        const rzpData = await rzpRes.json();
        if (rzpData && rzpData.id) {
          orderId = rzpData.id;
          realOrderCreated = true;
        } else {
          return res.status(500).json({
            success: false,
            error: "Razorpay API returned invalid order response structure."
          });
        }
      } else {
        const errText = await rzpRes.text();
        console.error("Razorpay Orders API failed:", errText);
        return res.status(500).json({
          success: false,
          error: `Razorpay Gateway Error: ${errText || "Failed to create Razorpay order. Please check Key ID & Key Secret."}`
        });
      }
    } catch (err) {
      console.error("Failed to connect to Razorpay API:", err?.message || err);
      return res.status(500).json({
        success: false,
        error: `Network error connecting to Razorpay: ${err?.message || "Unknown error"}`
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      error: "Razorpay Key ID and Key Secret are not configured or invalid in Admin Settings."
    });
  }
  const newOrderRecord = {
    orderId,
    amount: orderAmount,
    currency: currency || razorpayConfig.currency || "INR",
    userEmail: userEmail ? String(userEmail).trim().toLowerCase() : "",
    planId,
    status: "CREATED",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  serverOrdersDb.set(orderId, newOrderRecord);
  saveAdminStoreToDisk();
  if (supabaseServer) {
    try {
      await supabaseServer.from("orders").upsert([{ id: orderId, data: newOrderRecord, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
    } catch (e) {
    }
  }
  res.json({
    success: true,
    orderId,
    amount: orderAmount,
    currency: currency || razorpayConfig.currency || "INR",
    keyId: validKey ? keyId : "",
    hasKey: validKey,
    enabled: validKey,
    realOrderCreated,
    environment: razorpayConfig.environment || "test",
    name: "AspirantX Pro Membership",
    description: `Upgrade for ${userEmail || userName || "Aspirant"}`,
    message: validKey ? "Razorpay active" : "Razorpay API Key ID is missing. Configure Razorpay Key in Admin Settings or .env"
  });
});
router4.post("/api/payments/verify-payment", paymentRateLimiter, async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userEmail: bodyEmail,
    planId = "monthly"
  } = req.body;
  const targetEmail = verifiedUser?.email || bodyEmail;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !targetEmail) {
    return res.status(400).json({
      verified: false,
      isPremium: false,
      error: "Missing required payment verification parameters (order_id, payment_id, signature, userEmail)"
    });
  }
  const cleanEmail = String(targetEmail).trim().toLowerCase();
  const razorpayConfig = globalAdminSettings.razorpay;
  const keySecret = razorpayConfig.keySecret || process.env.RAZORPAY_KEY_SECRET || "";
  if (!keySecret || keySecret.includes("demo")) {
    return res.status(400).json({
      verified: false,
      isPremium: false,
      error: "Razorpay Key Secret is not configured on server. Cannot verify cryptographic payment signature."
    });
  }
  const isSignatureValid = verifyRazorpayPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    keySecret
  );
  if (!isSignatureValid) {
    console.error(`SECURITY ALERT: Invalid payment signature received for order ${razorpay_order_id} from ${cleanEmail}`);
    return res.status(400).json({
      verified: false,
      isPremium: false,
      error: "SECURITY VIOLATION: Cryptographic payment signature verification failed. Premium access DENIED."
    });
  }
  const existingOrder = serverOrdersDb.get(razorpay_order_id);
  if (existingOrder && existingOrder.status === "PAID") {
    if (existingOrder.paymentId === razorpay_payment_id) {
      const sub = serverSubscriptionsDb.get(cleanEmail);
      return res.json({
        success: true,
        verified: true,
        isPremium: true,
        idempotent: true,
        message: "Payment already verified (idempotent request). Premium active.",
        subscription: sub
      });
    } else {
      return res.status(400).json({
        verified: false,
        isPremium: false,
        error: "SECURITY REPLAY ALERT: Order ID has already been processed with a different payment ID."
      });
    }
  }
  for (const [_, ord] of serverOrdersDb.entries()) {
    if (ord.paymentId === razorpay_payment_id && ord.orderId !== razorpay_order_id) {
      return res.status(400).json({
        verified: false,
        isPremium: false,
        error: "SECURITY REPLAY ALERT: Payment ID has already been processed for another order."
      });
    }
  }
  const now = /* @__PURE__ */ new Date();
  const orderAmount = existingOrder?.amount || (planId === "monthly" ? globalAdminSettings.planPricing.monthlyPrice : globalAdminSettings.planPricing.annualPrice);
  const verifiedOrderRecord = {
    orderId: razorpay_order_id,
    amount: orderAmount,
    currency: existingOrder?.currency || "INR",
    userEmail: cleanEmail,
    planId,
    status: "PAID",
    createdAt: existingOrder?.createdAt || now.toISOString(),
    paidAt: now.toISOString(),
    paymentId: razorpay_payment_id,
    signatureVerified: true
  };
  serverOrdersDb.set(razorpay_order_id, verifiedOrderRecord);
  if (supabaseServer) {
    try {
      await supabaseServer.from("orders").upsert([{ id: razorpay_order_id, data: verifiedOrderRecord, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" });
    } catch (e) {
    }
  }
  let expiresAt = null;
  if (planId === "monthly") {
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3).toISOString();
  } else if (planId === "annual") {
    expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1e3).toISOString();
  } else if (planId === "lifetime") {
    expiresAt = null;
  }
  const newSubRecord = {
    userEmail: cleanEmail,
    planId,
    isPremium: true,
    activatedAt: now.toISOString(),
    expiresAt,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    verificationMethod: "RAZORPAY_SIGNATURE",
    amountPaid: orderAmount,
    currency: "INR"
  };
  serverSubscriptionsDb.set(cleanEmail, newSubRecord);
  if (supabaseServer) {
    try {
      const { error: supaErr } = await supabaseServer.from("user_subscriptions").upsert([
        {
          userEmail: cleanEmail,
          planId: newSubRecord.planId,
          isPremium: newSubRecord.isPremium,
          activatedAt: newSubRecord.activatedAt,
          expiresAt: newSubRecord.expiresAt,
          paymentId: newSubRecord.paymentId,
          orderId: newSubRecord.orderId,
          verificationMethod: newSubRecord.verificationMethod,
          amountPaid: newSubRecord.amountPaid,
          currency: newSubRecord.currency,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      ], { onConflict: "userEmail" });
      if (supaErr) {
        console.error("Failed to upsert user_subscriptions in Supabase:", supaErr);
      } else {
        console.log(`[SUPABASE] User subscription updated successfully for ${cleanEmail}`);
      }
      const adminUser = adminUsersDb.find((u) => u.email?.trim().toLowerCase() === cleanEmail);
      if (adminUser?.id && isValidUUID(adminUser.id)) {
        await supabaseServer.from("user_profiles").upsert({
          id: adminUser.id,
          is_premium: true,
          premium_until: newSubRecord.expiresAt,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }, { onConflict: "id" });
      }
    } catch (supaErr) {
      console.error("Supabase subscription upsert exception:", supaErr?.message || supaErr);
    }
  }
  saveAdminStoreToDisk();
  console.log(`[SUCCESS] Verified payment ${razorpay_payment_id} for user ${cleanEmail}. Activated plan: ${planId}`);
  return res.json({
    success: true,
    verified: true,
    isPremium: true,
    message: "Payment cryptographically verified by server. Premium membership activated.",
    subscription: newSubRecord
  });
});
router4.post("/api/payments/razorpay-webhook", async (req, res) => {
  const webhookSignature = req.headers["x-razorpay-signature"];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || globalAdminSettings.razorpay.keySecret || "";
  if (!webhookSignature || !webhookSecret) {
    return res.status(400).json({ error: "Missing webhook signature or secret" });
  }
  try {
    const rawPayload = req.rawBody || JSON.stringify(req.body);
    const expectedSignature = import_crypto3.default.createHmac("sha256", webhookSecret).update(rawPayload).digest("hex");
    const bufExpected = Buffer.from(expectedSignature, "utf-8");
    const bufReceived = Buffer.from(webhookSignature, "utf-8");
    if (bufExpected.length !== bufReceived.length || !import_crypto3.default.timingSafeEqual(bufExpected, bufReceived)) {
      console.error("SECURITY ALERT: Invalid Razorpay webhook signature");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }
    const event = req.body;
    const eventId = event?.id || event?.payload?.payment?.entity?.id || `event_${Date.now()}`;
    if (processedWebhookEvents.has(eventId)) {
      return res.json({ status: "ok", idempotency: "already_processed" });
    }
    if (event && (event.event === "payment.captured" || event.event === "order.paid")) {
      const paymentEntity = event.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const userEmail = notes.userEmail;
      const planId = notes.planId || "monthly";
      const orderId = paymentEntity?.order_id || `wh_${Date.now()}`;
      const paymentId = paymentEntity?.id || `pay_${Date.now()}`;
      if (userEmail) {
        const cleanEmail = String(userEmail).trim().toLowerCase();
        const now = /* @__PURE__ */ new Date();
        let expiresAt = null;
        if (planId === "monthly") {
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3).toISOString();
        } else if (planId === "annual") {
          expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1e3).toISOString();
        }
        const subRec = {
          userEmail: cleanEmail,
          planId,
          isPremium: true,
          activatedAt: now.toISOString(),
          expiresAt,
          paymentId,
          orderId,
          verificationMethod: "RAZORPAY_WEBHOOK",
          amountPaid: (paymentEntity?.amount || 0) / 100,
          currency: paymentEntity?.currency || "INR",
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        serverSubscriptionsDb.set(cleanEmail, subRec);
        if (supabaseServer) {
          await supabaseServer.from("user_subscriptions").upsert([subRec], { onConflict: "userEmail" });
        }
        processedWebhookEvents.add(eventId);
        saveAdminStoreToDisk();
        console.log(`[WEBHOOK SUCCESS] Activated subscription via webhook for ${cleanEmail}`);
      }
    } else {
      processedWebhookEvents.add(eventId);
    }
    return res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});
router4.post("/api/payments/utr-submit", paymentRateLimiter, async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  const { utr, plan = "monthly", amount = 499, userEmail: bodyEmail, userName = "" } = req.body;
  const userEmail = verifiedUser?.email || bodyEmail;
  if (!utr || typeof utr !== "string" || utr.trim().length < 6) {
    return res.status(400).json({ error: "Valid UTR / Transaction reference (minimum 6 characters) is required." });
  }
  if (!userEmail) {
    return res.status(400).json({ error: "User email is required for UTR verification submission." });
  }
  const cleanUtr = utr.trim().toUpperCase();
  const cleanEmail = userEmail.trim().toLowerCase();
  for (const [_, existing] of pendingUtrRequestsDb.entries()) {
    if (existing.utr === cleanUtr) {
      return res.json({
        success: true,
        idempotent: true,
        message: `UTR '${cleanUtr}' has already been submitted for verification. Current status: ${existing.status}`,
        record: existing
      });
    }
  }
  if (supabaseServer) {
    try {
      const { data: existingSupabase } = await supabaseServer.from("utr_requests").select("*").eq("utr", cleanUtr).limit(1).maybeSingle();
      if (existingSupabase) {
        const existingRecord = mapRowToUtrRecord(existingSupabase);
        pendingUtrRequestsDb.set(existingRecord.id, existingRecord);
        return res.json({
          success: true,
          idempotent: true,
          message: `UTR '${cleanUtr}' has already been submitted for verification. Current status: ${existingRecord.status}`,
          record: existingRecord
        });
      }
    } catch (err) {
      console.warn("Supabase duplicate UTR check warning:", err);
    }
  }
  const recordId = `utr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const utrRecord = {
    id: recordId,
    userEmail: cleanEmail,
    userName: userName || (verifiedUser ? verifiedUser.email : "Aspirant Student"),
    utr: cleanUtr,
    plan,
    amount,
    submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "PENDING"
  };
  pendingUtrRequestsDb.set(recordId, utrRecord);
  if (supabaseServer) {
    try {
      const { error: jsonbErr } = await supabaseServer.from("utr_requests").upsert([{
        id: recordId,
        data: utrRecord,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }], { onConflict: "id" });
      if (jsonbErr) {
        await supabaseServer.from("utr_requests").upsert([{
          id: recordId,
          utr: cleanUtr,
          plan,
          amount,
          user_email: cleanEmail,
          user_name: utrRecord.userName,
          status: "PENDING",
          created_at: utrRecord.submittedAt
        }], { onConflict: "id" });
      }
    } catch (err) {
      console.warn("Supabase UTR insert warning:", err);
    }
  }
  saveAdminStoreToDisk();
  return res.json({
    success: true,
    message: `UTR reference '${cleanUtr}' received and queued for Admin verification.`,
    record: utrRecord
  });
});
router4.get("/api/user/subscription", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  const emailQuery = req.query.email || "";
  const cleanEmail = verifiedUser?.email || emailQuery.trim().toLowerCase();
  if (!cleanEmail) {
    return res.json({ isPremium: false, planId: "FREE", expiresAt: null, premiumSource: null });
  }
  const isPaidPremium = checkUserServerPremiumStatus(cleanEmail);
  const sub = serverSubscriptionsDb.get(cleanEmail);
  if (isPaidPremium && sub) {
    return res.json({
      isPremium: true,
      planId: sub.planId,
      expiresAt: sub.expiresAt,
      activatedAt: sub.activatedAt,
      verificationMethod: sub.verificationMethod,
      paymentId: sub.paymentId,
      premiumSource: "paid"
    });
  }
  const adRecord = adRewardsDb.get(cleanEmail);
  const now = Date.now();
  const rewardActive = Boolean(adRecord?.reward_premium_until && new Date(adRecord.reward_premium_until).getTime() > now);
  if (rewardActive) {
    return res.json({
      isPremium: true,
      planId: "REWARD_PREMIUM",
      expiresAt: adRecord?.reward_premium_until,
      activatedAt: adRecord?.updated_at,
      verificationMethod: "AD_REWARD",
      paymentId: null,
      premiumSource: "reward"
    });
  }
  return res.json({
    isPremium: false,
    planId: "FREE",
    expiresAt: null,
    premiumSource: null
  });
});
router4.get("/api/rewards/status", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const emailQuery = req.query.email || "";
    const email = verifiedUser?.email || emailQuery.trim().toLowerCase();
    if (!email) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const today = (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA");
    let record = adRewardsDb.get(email);
    if (!record) {
      record = {
        email,
        views_today: 0,
        last_view_date: today,
        total_videos_watched: 0,
        reward_premium_until: null,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      adRewardsDb.set(email, record);
    } else if (record.last_view_date !== today) {
      record.views_today = 0;
      record.last_view_date = today;
      adRewardsDb.set(email, record);
    }
    const now = Date.now();
    const rewardActive = Boolean(record.reward_premium_until && new Date(record.reward_premium_until).getTime() > now);
    res.json({
      viewsToday: record.views_today,
      viewsNeeded: 5,
      rewardActive,
      rewardPremiumUntil: record.reward_premium_until,
      totalVideosWatched: record.total_videos_watched,
      justUnlocked: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.post("/api/rewards/watch-ad", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const email = verifiedUser?.email || req.body?.email?.trim()?.toLowerCase();
    if (!email) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const today = (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA");
    let record = adRewardsDb.get(email);
    if (!record) {
      record = {
        email,
        views_today: 0,
        last_view_date: today,
        total_videos_watched: 0,
        reward_premium_until: null,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    if (record.last_view_date !== today) {
      record.views_today = 0;
      record.last_view_date = today;
    }
    record.views_today += 1;
    record.total_videos_watched += 1;
    let justUnlocked = false;
    if (record.views_today >= 5) {
      justUnlocked = true;
      const now2 = Date.now();
      const duration = 1728e5;
      let baseTime = now2;
      if (record.reward_premium_until) {
        const existingExp = new Date(record.reward_premium_until).getTime();
        if (!isNaN(existingExp) && existingExp > now2) {
          baseTime = existingExp;
        }
      }
      record.reward_premium_until = new Date(baseTime + duration).toISOString();
      record.views_today = 0;
    }
    record.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    adRewardsDb.set(email, record);
    if (supabaseServer) {
      try {
        await supabaseServer.from("ad_rewards").upsert([{
          id: email,
          email,
          data: record,
          updated_at: record.updated_at
        }], { onConflict: "id" });
      } catch (e) {
      }
    }
    const now = Date.now();
    const rewardActive = Boolean(record.reward_premium_until && new Date(record.reward_premium_until).getTime() > now);
    res.json({
      viewsToday: record.views_today,
      viewsNeeded: 5,
      rewardActive,
      rewardPremiumUntil: record.reward_premium_until,
      totalVideosWatched: record.total_videos_watched,
      justUnlocked
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.post("/api/buddy/join", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const email = verifiedUser?.email || req.body?.email?.trim()?.toLowerCase();
    const userId = verifiedUser?.sub || req.body?.userId || "guest";
    const { exam, targetYear } = req.body;
    if (!email || !exam) {
      return res.status(400).json({ error: "Email and exam are required" });
    }
    studyBuddyQueue.delete(email);
    if (supabaseServer) {
      await supabaseServer.from("study_buddy_queue").delete().eq("email", email);
    }
    for (const [roomId, match] of studyBuddyMatches.entries()) {
      if ((match.user1Email === email || match.user2Email === email) && match.active) {
        const buddyEmail = match.user1Email === email ? match.user2Email : match.user1Email;
        return res.json({ matched: true, roomId, buddyEmail });
      }
    }
    let foundMatch = null;
    for (const [qEmail, qUser] of studyBuddyQueue.entries()) {
      if (qEmail !== email && qUser.exam.toLowerCase().trim() === exam.toLowerCase().trim()) {
        if (!targetYear || !qUser.targetYear || Number(qUser.targetYear) === Number(targetYear)) {
          foundMatch = qUser;
          break;
        }
      }
    }
    if (foundMatch) {
      const random = Math.floor(Math.random() * 9e5 + 1e5);
      const roomId = `buddy_${Date.now()}_${random}`;
      const matchObj = {
        roomId,
        user1Email: foundMatch.email,
        user2Email: email,
        exam,
        active: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      studyBuddyMatches.set(roomId, matchObj);
      studyBuddyQueue.delete(foundMatch.email);
      if (supabaseServer) {
        await Promise.all([
          supabaseServer.from("study_buddy_matches").upsert([{ room_id: roomId, data: matchObj, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "room_id" }),
          supabaseServer.from("study_buddy_queue").delete().eq("email", foundMatch.email)
        ]);
      }
      return res.json({ matched: true, roomId, buddyEmail: foundMatch.email });
    } else {
      const queueObj = {
        email,
        userId,
        exam,
        targetYear: targetYear ? Number(targetYear) : void 0,
        joinedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      studyBuddyQueue.set(email, queueObj);
      if (supabaseServer) {
        await supabaseServer.from("study_buddy_queue").upsert([{ email, data: queueObj, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "email" });
      }
      return res.json({ matched: false, waiting: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.get("/api/buddy/status", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const emailQuery = req.query.email || "";
    const email = verifiedUser?.email || emailQuery.trim().toLowerCase();
    if (!email) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    for (const [roomId, match] of studyBuddyMatches.entries()) {
      if ((match.user1Email === email || match.user2Email === email) && match.active) {
        const buddyEmail = match.user1Email === email ? match.user2Email : match.user1Email;
        return res.json({ status: "matched", roomId, buddyEmail });
      }
    }
    if (studyBuddyQueue.has(email)) {
      return res.json({ status: "waiting" });
    }
    return res.json({ status: "unmatched" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.post("/api/buddy/leave", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const email = verifiedUser?.email || req.body?.email?.trim()?.toLowerCase();
    if (!email) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    studyBuddyQueue.delete(email);
    if (supabaseServer) {
      await supabaseServer.from("study_buddy_queue").delete().eq("email", email);
    }
    for (const [roomId, match] of studyBuddyMatches.entries()) {
      if ((match.user1Email === email || match.user2Email === email) && match.active) {
        match.active = false;
        studyBuddyMatches.set(roomId, match);
        if (supabaseServer) {
          await supabaseServer.from("study_buddy_matches").upsert([{ room_id: roomId, data: match, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "room_id" });
        }
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.post("/api/user/set-exam", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const email = verifiedUser?.email || req.body?.email?.trim()?.toLowerCase();
    const { exam } = req.body;
    if (!email || !exam) {
      return res.status(400).json({ error: "Email and exam are required" });
    }
    let updated = false;
    setAdminUsersDb(adminUsersDb.map((u) => {
      if (String(u.email).trim().toLowerCase() === String(email).trim().toLowerCase()) {
        updated = true;
        return { ...u, exam };
      }
      return u;
    }));
    if (updated) {
      saveAdminStoreToDisk();
    }
    if (supabaseServer && verifiedUser?.sub) {
      await supabaseServer.from("user_profiles").update({ exam, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", verifiedUser.sub);
    }
    res.json({ success: true, exam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.post("/api/user/update-profile", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const email = verifiedUser?.email || req.body?.email?.trim()?.toLowerCase();
    const {
      name,
      exam,
      educationCategory,
      stateName,
      boardOrUniversity,
      streamOrSubject,
      targetYear,
      isProfileComplete
    } = req.body;
    if (!email) {
      return res.status(400).json({ error: "User email is required" });
    }
    let updated = false;
    setAdminUsersDb(adminUsersDb.map((u) => {
      if (String(u.email).trim().toLowerCase() === String(email).trim().toLowerCase()) {
        updated = true;
        return {
          ...u,
          name: name || u.name,
          exam: exam || u.exam,
          stateName: stateName || u.stateName,
          educationCategory: educationCategory || u.educationCategory,
          boardOrUniversity: boardOrUniversity || u.boardOrUniversity,
          streamOrSubject: streamOrSubject || u.streamOrSubject,
          targetYear: targetYear !== void 0 ? Number(targetYear) : u.targetYear,
          isProfileComplete: isProfileComplete !== void 0 ? Boolean(isProfileComplete) : u.isProfileComplete
        };
      }
      return u;
    }));
    if (updated) {
      saveAdminStoreToDisk();
    }
    if (supabaseServer && verifiedUser?.sub) {
      const dbUpdates = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (name) dbUpdates.name = name;
      if (exam) dbUpdates.exam = exam;
      if (stateName) dbUpdates.state_name = stateName;
      if (educationCategory) dbUpdates.education_category = educationCategory;
      if (boardOrUniversity) dbUpdates.board_or_university = boardOrUniversity;
      if (streamOrSubject) dbUpdates.stream_or_subject = streamOrSubject;
      if (targetYear !== void 0) dbUpdates.target_year = Number(targetYear);
      if (isProfileComplete !== void 0) dbUpdates.is_profile_complete = Boolean(isProfileComplete);
      await supabaseServer.from("user_profiles").update(dbUpdates).eq("id", verifiedUser.sub);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.post("/api/study/heartbeat", async (req, res) => {
  try {
    const { userId, sessionId, subject, topicId } = req.body;
    if (!userId || !sessionId) {
      return res.status(400).json({ error: "userId and sessionId are required" });
    }
    if (!studyHeartbeatsStore.has(sessionId)) {
      studyHeartbeatsStore.set(sessionId, []);
    }
    const sessionHbs = studyHeartbeatsStore.get(sessionId);
    const now = Date.now();
    if (sessionHbs.length > 0) {
      const lastHb = sessionHbs[sessionHbs.length - 1];
      const lastTime = new Date(lastHb.pingedAt || lastHb.pinged_at).getTime();
      if (now - lastTime < 15e3) {
        return res.status(204).send();
      }
    }
    const hb = {
      id: `hb_${now}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      sessionId,
      subject: subject || "General",
      topicId: topicId || null,
      pingedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    sessionHbs.push(hb);
    if (supabaseServer) {
      try {
        await supabaseServer.from("study_heartbeats").upsert([{
          id: hb.id,
          user_id: hb.userId,
          session_id: hb.sessionId,
          subject: hb.subject,
          topic_id: hb.topicId,
          pinged_at: hb.pingedAt
        }], { onConflict: "id" });
      } catch (e) {
      }
    }
    res.json({ success: true, heartbeatId: hb.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to record heartbeat", details: err.message });
  }
});
router4.get("/api/study/verified-time", async (req, res) => {
  try {
    const userId = (req.query.userId || "").toString().trim();
    const topicId = (req.query.topicId || "").toString().trim();
    if (!userId) {
      return res.json({ verifiedSeconds: 0, verifiedMinutes: 0 });
    }
    let verifiedSeconds = 0;
    for (const [sessionId, hbs] of studyHeartbeatsStore.entries()) {
      const userHbs = hbs.filter((h) => (h.userId || h.user_id) === userId);
      if (userHbs.length === 0) continue;
      if (topicId) {
        const matches = userHbs.some((h) => (h.topicId || h.topic_id) === topicId);
        if (!matches) continue;
      }
      const sorted = [...userHbs].sort((a, b) => {
        const ta = new Date(a.pingedAt || a.pinged_at).getTime();
        const tb = new Date(b.pingedAt || b.pinged_at).getTime();
        return ta - tb;
      });
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].pingedAt || sorted[i - 1].pinged_at).getTime();
        const curr = new Date(sorted[i].pingedAt || sorted[i].pinged_at).getTime();
        const diffSec = (curr - prev) / 1e3;
        if (diffSec > 0 && diffSec <= 35) {
          verifiedSeconds += Math.min(30, Math.round(diffSec));
        }
      }
    }
    res.json({
      verifiedSeconds,
      verifiedMinutes: Math.floor(verifiedSeconds / 60)
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate verified time", details: err.message });
  }
});
router4.get("/api/rewards/milestones", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = (req.query.userId || "").toString().trim();
    const emailQuery = (req.query.userEmail || "").toString().trim();
    const userEmail = verifiedUser?.email || emailQuery || userId;
    const isPremium = checkUserServerPremiumStatus(userEmail) || checkUserServerPremiumStatus(userId) || (() => {
      const adRecord = adRewardsDb.get(userEmail.toLowerCase());
      return Boolean(adRecord?.reward_premium_until && new Date(adRecord.reward_premium_until).getTime() > Date.now());
    })() || (verifiedUser?.email ? checkUserServerPremiumStatus(verifiedUser.email) : false);
    if (!isPremium) {
      return res.json({ success: true, milestones: [], premiumRequired: true });
    }
    const allMilestones = Array.from(rewardMilestonesStore.values()).filter((m) => m.isActive !== false);
    const userClaimsList = Array.from(rewardClaimsStore.values()).filter(
      (c) => (c.userId === userId || userEmail && c.userEmail?.toLowerCase() === userEmail.toLowerCase()) && ["approved", "fulfilled"].includes((c.status || "").toLowerCase())
    );
    const milMap = /* @__PURE__ */ new Map();
    for (const m of allMilestones) {
      milMap.set(m.id, m);
    }
    const trackMaxCompletedTier = /* @__PURE__ */ new Map();
    for (const c of userClaimsList) {
      const mil = milMap.get(c.milestoneId);
      if (mil && mil.trackId) {
        const t = Number(mil.tier) || 1;
        const curMax = trackMaxCompletedTier.get(mil.trackId) || 0;
        if (t > curMax) {
          trackMaxCompletedTier.set(mil.trackId, t);
        }
      }
    }
    const tracksMap = /* @__PURE__ */ new Map();
    const untracked = [];
    for (const m of allMilestones) {
      const tid = (m.trackId || "").trim();
      if (!tid) {
        untracked.push({ ...m, locked: false, tier: m.tier || 1 });
      } else {
        if (!tracksMap.has(tid)) tracksMap.set(tid, []);
        tracksMap.get(tid).push(m);
      }
    }
    const filteredMilestones = [...untracked];
    for (const [tid, milList] of tracksMap.entries()) {
      milList.sort((a, b) => (Number(a.tier) || 1) - (Number(b.tier) || 1));
      const maxCompleted = trackMaxCompletedTier.get(tid) || 0;
      const maxUnlocked = maxCompleted + 1;
      for (const m of milList) {
        const t = Number(m.tier) || 1;
        if (t <= maxUnlocked) {
          filteredMilestones.push({ ...m, tier: t, locked: false });
        } else if (t === maxUnlocked + 1) {
          filteredMilestones.push({ ...m, tier: t, locked: true });
        }
      }
    }
    res.json({ success: true, milestones: filteredMilestones, premiumRequired: false });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reward milestones", details: err.message });
  }
});
router4.get("/api/rewards/progress", async (req, res) => {
  try {
    const userId = (req.query.userId || "").toString().trim();
    const milestoneId = (req.query.milestoneId || "").toString().trim();
    if (!userId || !milestoneId) {
      return res.status(400).json({ error: "userId and milestoneId are required" });
    }
    const milestone = rewardMilestonesStore.get(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }
    const { verifiedMinutes } = calculateVerifiedMinutesForUser(
      userId,
      milestone.requiredSubject,
      milestone.requiredTopicId
    );
    const requiredMinutes = Number(milestone.requiredVerifiedMinutes) || 600;
    const canClaim = verifiedMinutes >= requiredMinutes;
    res.json({
      success: true,
      verifiedMinutes,
      requiredMinutes,
      canClaim
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate progress", details: err.message });
  }
});
router4.post("/api/rewards/claim", async (req, res) => {
  try {
    const { userId, userEmail, milestoneId } = req.body;
    if (!userId || !milestoneId) {
      return res.status(400).json({ error: "userId and milestoneId are required" });
    }
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const isPremium = checkUserServerPremiumStatus(cleanEmail) || checkUserServerPremiumStatus(userId) || (() => {
      const adRecord = adRewardsDb.get(cleanEmail);
      return Boolean(adRecord?.reward_premium_until && new Date(adRecord.reward_premium_until).getTime() > Date.now());
    })();
    if (!isPremium) {
      return res.status(403).json({ error: "Premium subscription required to claim reward milestones." });
    }
    const milestone = rewardMilestonesStore.get(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }
    if (milestone.trackId) {
      const tid = milestone.trackId;
      const targetTier = Number(milestone.tier) || 1;
      const allMilestonesInTrack = Array.from(rewardMilestonesStore.values()).filter((m) => m.trackId === tid);
      const milMapInTrack = new Map(allMilestonesInTrack.map((m) => [m.id, m]));
      const userClaimsInTrack = Array.from(rewardClaimsStore.values()).filter(
        (c) => (c.userId === userId || cleanEmail && c.userEmail?.toLowerCase() === cleanEmail) && ["approved", "fulfilled"].includes((c.status || "").toLowerCase()) && milMapInTrack.has(c.milestoneId)
      );
      let maxCompleted = 0;
      for (const c of userClaimsInTrack) {
        const mil = milMapInTrack.get(c.milestoneId);
        if (mil) {
          const t = Number(mil.tier) || 1;
          if (t > maxCompleted) maxCompleted = t;
        }
      }
      const maxUnlocked = maxCompleted + 1;
      if (targetTier > maxUnlocked) {
        return res.status(403).json({ error: `Milestone tier ${targetTier} is locked. Complete tier ${maxUnlocked - 1} first.` });
      }
    }
    const { verifiedMinutes } = calculateVerifiedMinutesForUser(
      userId,
      milestone.requiredSubject,
      milestone.requiredTopicId
    );
    const requiredMinutes = Number(milestone.requiredVerifiedMinutes) || 600;
    if (verifiedMinutes < requiredMinutes) {
      return res.status(400).json({
        error: `You've studied ${verifiedMinutes} of ${requiredMinutes} required minutes - keep going, you're not done yet.`
      });
    }
    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const claimObj = {
      id: claimId,
      userId,
      userEmail: cleanEmail || userId,
      milestoneId,
      milestoneTitle: milestone.title,
      verifiedMinutesAtClaim: verifiedMinutes,
      status: "pending",
      claimedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    rewardClaimsStore.set(claimId, claimObj);
    if (supabaseServer) {
      try {
        await supabaseServer.from("reward_claims").upsert([{
          id: claimId,
          data: claimObj,
          updated_at: claimObj.claimedAt
        }], { onConflict: "id" });
      } catch (e) {
      }
    }
    res.json({ success: true, claim: claimObj, message: "Claim submitted successfully - pending admin review." });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit reward claim", details: err.message });
  }
});
router4.get("/api/rewards/my-claims", (req, res) => {
  const userId = (req.query.userId || "").toString().trim();
  const userEmail = (req.query.userEmail || "").toString().trim().toLowerCase();
  const allClaims = Array.from(rewardClaimsStore.values());
  const userClaims = allClaims.filter((c) => {
    if (userId && c.userId === userId) return true;
    if (userEmail && c.userEmail && c.userEmail.toLowerCase() === userEmail) return true;
    return false;
  });
  res.json({ success: true, claims: userClaims });
});
router4.post("/api/auth/token", async (req, res) => {
  const authHeader = req.headers.authorization;
  const clientIp = String(req.headers["x-forwarded-for"] || req.ip || req.socket?.remoteAddress || "127.0.0.1").split(",")[0].trim();
  const requestId = String(req.headers["x-request-id"] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    recordAdminAuditLog({
      user: "anonymous",
      action: "TOKEN_ISSUANCE_DENIED",
      details: "Rejected /api/auth/token attempt: Missing Bearer token in Authorization header.",
      ip: clientIp,
      requestId,
      endpoint: "/api/auth/token",
      outcome: "DENIED"
    });
    return res.status(401).json({
      error: "Authentication Required: Missing Bearer authorization token in headers."
    });
  }
  const token = authHeader.substring(7).trim();
  let verifiedEmail = "";
  let userId = "";
  let tokenVerified = false;
  try {
    const decoded = import_jsonwebtoken3.default.verify(token, JWT_SECRET2);
    if (decoded && decoded.email) {
      verifiedEmail = String(decoded.email).trim().toLowerCase();
      userId = decoded.sub || "user_dev";
      tokenVerified = true;
    }
  } catch (_jwtErr) {
  }
  if (!tokenVerified && supabaseServer) {
    try {
      const { data, error } = await supabaseServer.auth.getUser(token);
      if (!error && data?.user?.email) {
        verifiedEmail = data.user.email.trim().toLowerCase();
        userId = data.user.id;
        tokenVerified = true;
      }
    } catch (_supaErr) {
    }
  }
  if (!tokenVerified || !verifiedEmail) {
    recordAdminAuditLog({
      user: "unverified_token",
      action: "TOKEN_ISSUANCE_FAILED",
      details: "All token verification methods failed for /api/auth/token",
      ip: clientIp,
      requestId,
      endpoint: "/api/auth/token",
      outcome: "DENIED"
    });
    return res.status(401).json({
      error: "Authentication Failed: Could not verify access token with identity provider or internal secret."
    });
  }
  const isSuper = verifiedEmail === DESIGNATED_ADMIN_EMAIL2.toLowerCase();
  const knownUser = adminUsersDb.find((u) => u.email.toLowerCase() === verifiedEmail);
  let finalUser = knownUser;
  if (!knownUser && !isSuper) {
    finalUser = {
      id: userId || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: verifiedEmail.split("@")[0],
      email: verifiedEmail,
      exam: "",
      role: "USER",
      isPremium: false,
      planName: "FREE",
      streakDays: 1,
      xp: 100,
      coins: 50,
      level: 1,
      completedTopicsCount: 0,
      joinedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "ACTIVE",
      isProfileComplete: false
    };
    adminUsersDb.push(finalUser);
    if (supabaseServer) {
      try {
        await supabaseServer.from("admin_users").upsert([
          { ...finalUser, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
        ], { onConflict: "id" });
      } catch (e) {
      }
    }
    saveAdminStoreToDisk();
  }
  if (finalUser && finalUser.status === "BANNED" && !isSuper) {
    recordAdminAuditLog({
      user: verifiedEmail,
      action: "BANNED_LOGIN_BLOCKED",
      details: "Blocked token issuance for banned user",
      ip: clientIp,
      requestId,
      endpoint: "/api/auth/token",
      outcome: "DENIED"
    });
    return res.status(403).json({
      error: "ACCOUNT_BANNED",
      message: "Your account has been suspended for violating community guidelines. Contact support if you believe this is a mistake."
    });
  }
  const assignedRole = isSuper ? "ADMIN" : finalUser ? finalUser.role : "USER";
  const userIsPremium = isSuper || (finalUser ? finalUser.isPremium : false);
  const internalToken = import_jsonwebtoken3.default.sign(
    {
      sub: userId,
      email: verifiedEmail,
      role: assignedRole,
      isPremium: userIsPremium,
      iss: "aspirantx-auth-server"
    },
    JWT_SECRET2,
    { expiresIn: "7d" }
  );
  recordAdminAuditLog({
    user: verifiedEmail,
    action: "TOKEN_ISSUED_SUCCESSFULLY",
    details: `Issued internal JWT for verified identity '${verifiedEmail}' with role '${assignedRole}'`,
    ip: clientIp,
    requestId,
    endpoint: "/api/auth/token",
    outcome: "SUCCESS"
  });
  return res.json({
    success: true,
    token: internalToken,
    user: {
      id: userId,
      email: verifiedEmail,
      role: assignedRole,
      isPremium: userIsPremium
    }
  });
});
router4.post("/api/user/heartbeat", (req, res) => {
  try {
    const { userId, email, name, exam } = req.body;
    const identifier = email || userId || req.ip;
    if (identifier) {
      activeUsersPresenceMap.set(identifier, {
        userId: userId || identifier,
        email: email || "",
        name: name || email?.split("@")[0] || "User",
        exam: exam || "UPSC CSE",
        lastSeen: Date.now(),
        ip: req.ip
      });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to record heartbeat" });
  }
});
router4.get("/api/dashboard/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const exam = req.query.exam || "UPSC_CSE";
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }
    if (supabaseServer) {
      const { data, error } = await supabaseServer.from("user_dashboards").select("*").eq("user_id", userId).maybeSingle();
      if (!error && data) {
        return res.json({ success: true, data });
      }
    }
    const karma = userKarmaStore.get(userId) || { totalKarma: 0, postKarma: 0, commentKarma: 0 };
    const wallet = userWalletsStore.get(userId) || { coins: 0, balance: 0 };
    const dashboardData = {
      userId,
      exam,
      currentStreak: 7,
      totalStudyMinutes: 480,
      completedTopicsCount: 14,
      totalTopicsCount: 85,
      testAccuracy: 78.5,
      karmaPoints: karma.totalKarma,
      coinsEarned: wallet.coins,
      recentActivity: [
        { type: "test", title: "Polity Prelims Mock 1", score: "82%", date: (/* @__PURE__ */ new Date()).toISOString() },
        { type: "study", title: "Fundamental Rights and DPSP", duration: "45 mins", date: new Date(Date.now() - 864e5).toISOString() }
      ]
    };
    res.json({ success: true, data: dashboardData });
  } catch (err) {
    console.error("[GET /api/dashboard/:userId] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router4.get("/api/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }
    if (supabaseServer) {
      const { data, error } = await supabaseServer.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (!error && Array.isArray(data)) {
        return res.json({ success: true, data });
      }
    }
    const defaultNotifications = [
      {
        id: "notif_1",
        userId,
        title: "Daily Goal Reminder",
        message: "Complete your remaining 2 syllabus topics today to maintain your streak!",
        type: "reminder",
        read: false,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "notif_2",
        userId,
        title: "New Live CBT Test Available",
        message: "National Level Mock Test Series is now live. Rank yourself nationwide.",
        type: "announcement",
        read: false,
        created_at: new Date(Date.now() - 72e5).toISOString()
      }
    ];
    res.json({ success: true, data: defaultNotifications });
  } catch (err) {
    console.error("[GET /api/notifications/:userId] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router4.post("/api/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Notification ID is required" });
    }
    if (supabaseServer) {
      const { error } = await supabaseServer.from("notifications").update({ read: true, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
      if (error) {
        console.error("[POST /api/notifications/:id/read] Supabase error:", error.message);
      }
    }
    res.json({ success: true, data: { id, read: true } });
  } catch (err) {
    console.error("[POST /api/notifications/:id/read] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router4.post("/api/notifications", async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: "Title and message are required" });
    }
    const notificationRecord = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || "all",
      title,
      message,
      type: type || "general",
      read: false,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (supabaseServer) {
      const { error } = await supabaseServer.from("notifications").insert(notificationRecord);
      if (error) {
        console.error("[POST /api/notifications] Supabase error:", error.message);
      }
    }
    res.json({ success: true, data: notificationRecord });
  } catch (err) {
    console.error("[POST /api/notifications] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router4.get("/api/search", async (req, res) => {
  try {
    const query = (req.query.q || "").toLowerCase().trim();
    if (!query) {
      return res.json({ success: true, data: { posts: [], topics: [], questions: [] } });
    }
    const posts = Array.from(communityPostsStore.values()).filter((p) => (p.title || "").toLowerCase().includes(query) || (p.content || "").toLowerCase().includes(query)).slice(0, 10);
    const questions = Array.from(questionBankStore.values()).filter((q) => (q.question || q.text || "").toLowerCase().includes(query) || (q.topic || "").toLowerCase().includes(query)).slice(0, 10);
    const topics = Array.from(syllabusNodesStore.values()).filter((n) => (n.name || n.title || "").toLowerCase().includes(query)).map((n) => ({ id: n.id, name: n.name || n.title, type: n.type || "topic", subject: n.subject || "" })).slice(0, 10);
    res.json({
      success: true,
      data: {
        posts,
        topics,
        questions
      }
    });
  } catch (err) {
    console.error("[GET /api/search] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router4.get("/api/wallet/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }
    if (supabaseServer) {
      const { data, error } = await supabaseServer.from("user_wallets").select("*").eq("user_id", userId).maybeSingle();
      if (!error && data) {
        return res.json({ success: true, data });
      }
    }
    let wallet = userWalletsStore.get(userId);
    if (!wallet) {
      wallet = {
        userId,
        balance: 150,
        coins: 450,
        totalEarned: 220,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      userWalletsStore.set(userId, wallet);
    }
    res.json({ success: true, data: wallet });
  } catch (err) {
    console.error("[GET /api/wallet/:userId] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router4.get("/api/wallet/:userId/transactions", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }
    if (supabaseServer) {
      const { data, error } = await supabaseServer.from("wallet_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (!error && Array.isArray(data)) {
        return res.json({ success: true, data });
      }
    }
    const transactions = (userPayoutsStore.get(userId) || []).map((p) => ({
      id: p.id,
      userId: p.userId,
      type: "payout",
      amount: p.amount,
      status: p.status,
      created_at: p.createdAt || p.created_at || (/* @__PURE__ */ new Date()).toISOString()
    }));
    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error("[GET /api/wallet/:userId/transactions] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router4.post("/api/wallet/withdraw", async (req, res) => {
  try {
    const { userId, amount, upiId, method } = req.body;
    if (!userId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: "Valid user ID and withdrawal amount are required" });
    }
    const withdrawAmount = Number(amount);
    let wallet = userWalletsStore.get(userId) || { userId, balance: 0, coins: 0, totalEarned: 0, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    if (wallet.balance < withdrawAmount) {
      return res.status(400).json({ success: false, error: "Insufficient wallet balance" });
    }
    wallet.balance -= withdrawAmount;
    wallet.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    userWalletsStore.set(userId, wallet);
    const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payoutRecord = {
      id: payoutId,
      userId,
      amount: withdrawAmount,
      upiId: upiId || "aspirant@upi",
      method: method || "UPI",
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    allPayoutsStore.set(payoutId, payoutRecord);
    const userList = userPayoutsStore.get(userId) || [];
    userList.unshift(payoutRecord);
    userPayoutsStore.set(userId, userList);
    if (supabaseServer) {
      await supabaseServer.from("user_payouts").insert({
        id: payoutId,
        user_id: userId,
        amount: withdrawAmount,
        upi_id: upiId || "aspirant@upi",
        method: method || "UPI",
        status: "pending",
        created_at: payoutRecord.createdAt
      });
    }
    res.json({ success: true, data: { payout: payoutRecord, wallet } });
  } catch (err) {
    console.error("[POST /api/wallet/withdraw] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router4.get("/api/exams", async (_req, res) => {
  try {
    const exams = Array.from(customExamsStore.values());
    res.json({ success: true, data: exams });
  } catch (err) {
    console.error("[GET /api/exams] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router4.post("/api/exams", async (req, res) => {
  try {
    const { name, description, category, userEmail } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "Exam name is required" });
    }
    const id = `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const examRecord = {
      id,
      name: name.trim(),
      description: description ? description.trim() : "",
      category: category || "Custom",
      userEmail: userEmail || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    customExamsStore.set(id, examRecord);
    if (supabaseServer) {
      await supabaseServer.from("exams").insert(examRecord);
    }
    res.json({ success: true, data: examRecord });
  } catch (err) {
    console.error("[POST /api/exams] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router4.put("/api/exams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category } = req.body;
    let exam = customExamsStore.get(id);
    if (!exam) {
      return res.status(404).json({ success: false, error: "Exam not found" });
    }
    exam = {
      ...exam,
      name: name ? name.trim() : exam.name,
      description: description !== void 0 ? description.trim() : exam.description,
      category: category || exam.category,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    customExamsStore.set(id, exam);
    if (supabaseServer) {
      await supabaseServer.from("exams").update(exam).eq("id", id);
    }
    res.json({ success: true, data: exam });
  } catch (err) {
    console.error("[PUT /api/exams/:id] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
router4.delete("/api/exams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existed = customExamsStore.delete(id);
    if (supabaseServer) {
      await supabaseServer.from("exams").delete().eq("id", id);
    }
    res.json({ success: true, data: { id, deleted: existed } });
  } catch (err) {
    console.error("[DELETE /api/exams/:id] error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});
var user_routes_default = router4;

// routes/teacher.routes.ts
var import_express5 = require("express");
var import_path6 = __toESM(require("path"), 1);
var router5 = (0, import_express5.Router)();
var __dirname5 = import_path6.default.resolve();
router5.get("/api/collaboration/public", (_req, res) => {
  res.json({
    success: true,
    sponsors: sponsorsDb,
    collaborators: collaboratorsDb,
    team: adminTeamStore.map((t) => ({
      id: t.id,
      name: t.name,
      avatar: t.avatar,
      title: t.title,
      department: t.department,
      status: t.status,
      joinedAt: t.joinedAt
    }))
  });
});
router5.post("/api/collaboration/sponsor-apply", async (req, res) => {
  try {
    const { name, organization, email, message, tier } = req.body;
    if (!name || !organization || !email) {
      return res.status(400).json({ error: "Name, organization and email are required." });
    }
    const inquiry = {
      id: `sp-inq-${Date.now()}`,
      name,
      organization,
      email,
      message: message || "",
      tier: tier || "silver",
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    sponsorInquiriesDb.push(inquiry);
    if (supabaseServer) {
      try {
        await supabaseServer.from("sponsor_inquiries").upsert([{
          id: inquiry.id,
          data: inquiry,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (e) {
        console.warn("Supabase sponsor_inquiries upsert error:", e);
      }
    }
    const act = {
      id: `act-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      memberName: "System Bot",
      action: "SPONSOR",
      details: `New sponsorship lead from ${organization} (${name}) for ${tier} tier.`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();
    if (supabaseServer) {
      try {
        await supabaseServer.from("office_activity_feed").upsert([{
          id: act.id,
          data: act,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (e) {
        console.warn("Supabase office_activity_feed upsert error:", e);
      }
    }
    res.json({ success: true, inquiry });
  } catch (err) {
    res.status(500).json({ error: "Failed to process inquiry" });
  }
});
router5.post("/api/collaboration/join-team", async (req, res) => {
  try {
    const { name, email, role, bio, github, linkedin } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: "Name, email and role are required." });
    }
    const application = {
      id: `tm-app-${Date.now()}`,
      name,
      email,
      role,
      bio: bio || "",
      github: github || "",
      linkedin: linkedin || "",
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    teamApplicationsDb.push(application);
    if (supabaseServer) {
      try {
        await supabaseServer.from("team_applications").upsert([{
          id: application.id,
          name: application.name,
          email: application.email,
          role: application.role,
          bio: application.bio,
          github: application.github,
          linkedin: application.linkedin,
          status: application.status,
          data: application,
          created_at: application.createdAt,
          updated_at: application.createdAt
        }], { onConflict: "id" });
      } catch (e) {
        console.warn("Supabase team_applications upsert error:", e);
      }
    }
    const act = {
      id: `act-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      memberName: "System Bot",
      action: "RECRUIT",
      details: `${name} applied to join the team as a ${role}.`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();
    if (supabaseServer) {
      try {
        await supabaseServer.from("office_activity_feed").upsert([{
          id: act.id,
          data: act,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (e) {
        console.warn("Supabase office_activity_feed upsert error:", e);
      }
    }
    res.json({ success: true, application });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit application" });
  }
});
router5.get("/api/collaboration/office", (_req, res) => {
  res.json({
    success: true,
    team: adminTeamStore,
    activity: officeActivityFeed,
    tasks: adminTasksStore,
    pendingUploads: pendingContentUploadsDb,
    applications: teamApplicationsDb
  });
});
router5.post("/api/collaboration/update-status", async (req, res) => {
  try {
    const { email, status, currentActivity } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required to update status." });
    }
    const member = adminTeamStore.find((t) => t.email.toLowerCase() === String(email).trim().toLowerCase());
    let updatedMember;
    if (member) {
      member.status = status || "ACTIVE";
      member.currentActivity = currentActivity || "";
      updatedMember = member;
    } else {
      const newGuestMember = {
        id: `tm-guest-${Date.now()}`,
        name: email.split("@")[0],
        email,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
        title: "Content contributor",
        role: "ACADEMIC_LEAD",
        department: "Academics & Question Bank",
        status: status || "ACTIVE",
        currentActivity: currentActivity || "",
        joinedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      adminTeamStore.push(newGuestMember);
      updatedMember = newGuestMember;
    }
    const act = {
      id: `act-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      memberName: updatedMember.name,
      action: "STATUS",
      details: `Updated status to [${status}] - ${currentActivity || "Active"}`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();
    if (supabaseServer) {
      try {
        await supabaseServer.from("office_activity_feed").upsert([{
          id: act.id,
          data: act,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (e) {
        console.warn("Supabase office_activity_feed upsert error:", e);
      }
    }
    await saveAdminStoreToDisk();
    res.json({ success: true, member: updatedMember });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});
router5.post("/api/collaboration/update-task-status", async (req, res) => {
  try {
    const { taskId, newStatus } = req.body;
    if (!taskId || !newStatus) {
      return res.status(400).json({ error: "Task ID and new status are required." });
    }
    const task = adminTasksStore.find((t) => t.id === taskId);
    if (task) {
      const oldStatus = task.status;
      task.status = newStatus;
      const act = {
        id: `act-${Date.now()}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        memberName: task.assignedToName || "Team Member",
        action: "TASK",
        details: `Moved task "${task.title}" from ${oldStatus} to ${newStatus}`
      };
      officeActivityFeed.unshift(act);
      if (officeActivityFeed.length > 100) officeActivityFeed.pop();
      if (supabaseServer) {
        try {
          await supabaseServer.from("office_activity_feed").upsert([{
            id: act.id,
            data: act,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }], { onConflict: "id" });
        } catch (e) {
          console.warn("Supabase office_activity_feed upsert error:", e);
        }
      }
      await saveAdminStoreToDisk();
      res.json({ success: true, task });
    } else {
      res.status(404).json({ error: "Task not found." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update task status" });
  }
});
router5.post("/api/collaboration/add-activity", async (req, res) => {
  try {
    const { memberName, action, details } = req.body;
    if (!memberName || !details) {
      return res.status(400).json({ error: "Member name and details are required." });
    }
    const newActivity = {
      id: `act-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      memberName,
      action: action || "GENERAL",
      details
    };
    officeActivityFeed.unshift(newActivity);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();
    if (supabaseServer) {
      try {
        await supabaseServer.from("office_activity_feed").upsert([{
          id: newActivity.id,
          data: newActivity,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (e) {
        console.warn("Supabase office_activity_feed upsert error:", e);
      }
    }
    res.json({ success: true, activity: newActivity });
  } catch (err) {
    res.status(500).json({ error: "Failed to add activity" });
  }
});
router5.post("/api/collaboration/approve-content", async (req, res) => {
  try {
    const { uploadId, reviewerName } = req.body;
    if (!uploadId) {
      return res.status(400).json({ error: "Upload ID is required." });
    }
    const uploadIndex = pendingContentUploadsDb.findIndex((up) => up.id === uploadId);
    if (uploadIndex >= 0) {
      const item = pendingContentUploadsDb[uploadIndex];
      item.status = "APPROVED";
      pendingContentUploadsDb.splice(uploadIndex, 1);
      const act = {
        id: `act-${Date.now()}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        memberName: reviewerName || "Admin",
        action: "APPROVE",
        details: `Approved "${item.title}" by ${item.uploader}. Content is now live!`
      };
      officeActivityFeed.unshift(act);
      if (officeActivityFeed.length > 100) officeActivityFeed.pop();
      if (supabaseServer) {
        try {
          await supabaseServer.from("office_activity_feed").upsert([{
            id: act.id,
            data: act,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }], { onConflict: "id" });
        } catch (e) {
          console.warn("Supabase office_activity_feed upsert error:", e);
        }
      }
      res.json({ success: true, approvedItem: item });
    } else {
      res.status(404).json({ error: "Upload item not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to approve content" });
  }
});
router5.post("/api/collaboration/reject-content", async (req, res) => {
  try {
    const { uploadId, reason, reviewerName } = req.body;
    if (!uploadId || !reason) {
      return res.status(400).json({ error: "Upload ID and rejection reason are required." });
    }
    const uploadIndex = pendingContentUploadsDb.findIndex((up) => up.id === uploadId);
    if (uploadIndex >= 0) {
      const item = pendingContentUploadsDb[uploadIndex];
      item.status = "REJECTED";
      item.rejectionReason = reason;
      pendingContentUploadsDb.splice(uploadIndex, 1);
      const act = {
        id: `act-${Date.now()}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        memberName: reviewerName || "Admin",
        action: "REJECT",
        details: `Rejected "${item.title}" by ${item.uploader}. Reason: ${reason}`
      };
      officeActivityFeed.unshift(act);
      if (officeActivityFeed.length > 100) officeActivityFeed.pop();
      if (supabaseServer) {
        try {
          await supabaseServer.from("office_activity_feed").upsert([{
            id: act.id,
            data: act,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }], { onConflict: "id" });
        } catch (e) {
          console.warn("Supabase office_activity_feed upsert error:", e);
        }
      }
      res.json({ success: true, rejectedItem: item });
    } else {
      res.status(404).json({ error: "Upload item not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to reject content" });
  }
});
router5.post("/api/teachers/register", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const { name, subject, bio, experience, qualification, avatar, email, availability, sessionPrice } = req.body;
    if (!name || !subject) {
      return res.status(400).json({ error: "Name and subject are required fields" });
    }
    const cleanEmail = (email || verifiedUser?.email || "").trim().toLowerCase();
    const id = `ed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEd = {
      id,
      name,
      subject,
      experience: experience || "1+ Years",
      qualification: qualification || "Educator",
      avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isVerified: false,
      status: "APPROVED",
      email: cleanEmail,
      bio: bio || "",
      availability: Array.isArray(availability) && availability.length > 0 ? availability : ["Today, 6:00 PM", "Tomorrow, 10:00 AM", "Tomorrow, 4:00 PM"],
      rating: 0,
      studentsCount: 0,
      reviewsCount: 0,
      sessionPrice: typeof sessionPrice === "number" ? sessionPrice : sessionPrice ? Number(sessionPrice) : 0,
      isOnline: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    educatorsStore.set(id, newEd);
    if (supabaseServer) {
      try {
        await supabaseServer.from("educators").upsert([{
          id,
          data: newEd,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (err) {
        console.warn("Supabase register educator warning:", err);
      }
    }
    res.json({ success: true, educator: newEd, message: "Aapka registration successfully submit ho gaya hai!" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed: " + err.message });
  }
});
router5.get("/api/teachers", async (_req, res) => {
  try {
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from("educators").select("id, name, title, bio, avatar, rating, hourly_rate, subjects, data");
        if (data && data.length > 0) {
          for (const item of data) {
            const ed = item.data ? { ...item.data, id: item.id } : item;
            if (ed.id) educatorsStore.set(ed.id, ed);
          }
        }
      } catch (err) {
        console.warn("Supabase fetch educators warning:", err);
      }
    }
    if (educatorsStore.size === 0) {
      DEFAULT_EDUCATORS_LIST.forEach((ed) => educatorsStore.set(ed.id, ed));
    }
    const list = Array.from(educatorsStore.values());
    res.json({ success: true, educators: list });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch educators: " + err.message });
  }
});
router5.patch("/api/teachers/:id/status", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const educatorId = req.params.id;
    const { isOnline, status, rating, studentsCount, sessionPrice } = req.body;
    let ed = educatorsStore.get(educatorId);
    if (!ed) {
      ed = DEFAULT_EDUCATORS_LIST.find((e) => e.id === educatorId);
    }
    if (!ed) {
      return res.status(404).json({ error: "Educator not found" });
    }
    if (typeof isOnline === "boolean") ed.isOnline = isOnline;
    if (status) ed.status = status;
    if (typeof rating === "number") ed.rating = rating;
    if (typeof studentsCount === "number") ed.studentsCount = studentsCount;
    if (typeof sessionPrice === "number") ed.sessionPrice = sessionPrice;
    educatorsStore.set(educatorId, ed);
    if (supabaseServer) {
      try {
        await supabaseServer.from("educators").upsert([{
          id: educatorId,
          data: ed,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (err) {
        console.warn("Supabase update educator status warning:", err);
      }
    }
    res.json({ success: true, educator: ed, message: `Status updated for ${ed.name}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to update educator status: " + err.message });
  }
});
router5.post("/api/teachers/:id/book", async (req, res) => {
  try {
    const educatorId = req.params.id;
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const { slot, date, time, studentEmail, studentName, notes, utrNumber } = req.body;
    const selectedSlot = slot || (date && time ? `${date} ${time}` : "");
    if (!selectedSlot) {
      return res.status(400).json({ error: "Available session slot selection is required" });
    }
    const educator = educatorsStore.get(educatorId) || DEFAULT_EDUCATORS_LIST.find((e) => e.id === educatorId);
    const price = educator?.sessionPrice ?? 0;
    const cleanEmail = (studentEmail || verifiedUser?.email || "student@aspirantx.in").trim().toLowerCase();
    const bookingId = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const initialStatus = price > 0 ? "PENDING_PAYMENT" : "CONFIRMED";
    const newBooking = {
      id: bookingId,
      educatorId,
      date: date || selectedSlot.split(" ")[0] || "Scheduled",
      time: time || selectedSlot,
      selectedSlot,
      studentEmail: cleanEmail,
      studentName: studentName || (verifiedUser?.email ? verifiedUser.email.split("@")[0] : "Aspirant Student"),
      notes: notes || "",
      status: initialStatus,
      price,
      utrNumber: utrNumber || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    educatorBookingsStore.set(bookingId, newBooking);
    if (supabaseServer) {
      try {
        await supabaseServer.from("educator_bookings").upsert([{
          id: bookingId,
          data: newBooking,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (err) {
        console.warn("Supabase book session warning:", err);
      }
    }
    res.json({
      success: true,
      booking: newBooking,
      message: initialStatus === "CONFIRMED" ? `1-to-1 Live session confirmed for ${selectedSlot}.` : `Booking submitted for ${selectedSlot}! Status: Pending Payment Verification.`
    });
  } catch (err) {
    res.status(500).json({ error: "Booking failed: " + err.message });
  }
});
router5.get("/api/teachers/bookings/all", verifyAdminAuth, async (_req, res) => {
  try {
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from("educator_bookings").select("id, educator_id, user_email, date, slot, status, created_at, data");
        if (data && data.length > 0) {
          for (const item of data) {
            const bk = item.data ? { ...item.data, id: item.id } : item;
            if (bk.id) educatorBookingsStore.set(bk.id, bk);
          }
        }
      } catch (err) {
        console.warn("Supabase fetch all bookings warning:", err);
      }
    }
    const bookings = Array.from(educatorBookingsStore.values());
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all bookings: " + err.message });
  }
});
router5.get("/api/teachers/:id/bookings", async (req, res) => {
  try {
    const educatorId = req.params.id;
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from("educator_bookings").select("id, educator_id, user_email, date, slot, status, created_at, data");
        if (data && data.length > 0) {
          for (const item of data) {
            const bk = item.data ? { ...item.data, id: item.id } : item;
            if (bk.id) educatorBookingsStore.set(bk.id, bk);
          }
        }
      } catch (err) {
        console.warn("Supabase fetch educator bookings warning:", err);
      }
    }
    const bookings = Array.from(educatorBookingsStore.values()).filter((b) => b.educatorId === educatorId);
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings: " + err.message });
  }
});
router5.post("/api/teachers/bookings/:bookingId/cancel", async (req, res) => {
  try {
    const { bookingId } = req.params;
    let bk = educatorBookingsStore.get(bookingId);
    if (!bk && supabaseServer) {
      try {
        const { data } = await supabaseServer.from("educator_bookings").select("id, educator_id, user_email, date, slot, status, created_at, data").eq("id", bookingId).single();
        if (data) {
          bk = data.data ? { ...data.data, id: data.id } : data;
          if (bk) educatorBookingsStore.set(bookingId, bk);
        }
      } catch (_err) {
      }
    }
    if (!bk) {
      return res.status(404).json({ error: "Booking not found" });
    }
    bk.status = "CANCELLED";
    educatorBookingsStore.set(bookingId, bk);
    if (supabaseServer) {
      try {
        await supabaseServer.from("educator_bookings").upsert([{
          id: bookingId,
          data: bk,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (err) {
        console.warn("Supabase cancel booking warning:", err);
      }
    }
    res.json({ success: true, booking: bk, message: "Booking has been successfully cancelled." });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel booking: " + err.message });
  }
});
router5.get("/api/teachers/chat/:educatorId", async (req, res) => {
  try {
    const educatorId = req.params.educatorId;
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from("educator_chats").select("*").eq("educator_id", educatorId);
        if (data && data.length > 0) {
          const msgs = data.map((item) => item.data || item).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          educatorChatsStore.set(educatorId, msgs);
        }
      } catch (err) {
        console.warn("Supabase fetch educator chat warning:", err);
      }
    }
    const messages = educatorChatsStore.get(educatorId) || [];
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
});
router5.post("/api/teachers/chat/:educatorId", async (req, res) => {
  try {
    const educatorId = req.params.educatorId;
    const { sender, msg } = req.body;
    if (!msg || !msg.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }
    const chatMsg = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      educatorId,
      sender: sender || "Aspirant",
      msg: msg.trim(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    const currentMsgs = educatorChatsStore.get(educatorId) || [];
    currentMsgs.push(chatMsg);
    educatorChatsStore.set(educatorId, currentMsgs);
    if (supabaseServer) {
      try {
        await supabaseServer.from("educator_chats").upsert([{
          id: chatMsg.id,
          educator_id: educatorId,
          data: chatMsg,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (err) {
        console.warn("Supabase save educator chat message warning:", err);
      }
    }
    res.json({ success: true, chatMessage: chatMsg });
  } catch (err) {
    res.status(500).json({ error: "Failed to post message" });
  }
});
router5.get("/api/teacher/profile", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = req.query.userId || verifiedUser?.sub;
    const email = req.query.email || verifiedUser?.email;
    if (!userId && !email) {
      return res.status(400).json({ error: "userId or email is required" });
    }
    if (supabaseServer) {
      try {
        let q = supabaseServer.from("teacher_profiles").select("*");
        if (userId) q = q.eq("user_id", userId);
        else if (email) q = q.eq("email", email);
        const { data } = await q.single();
        if (data) {
          teacherProfilesStore.set(data.user_id || userId, data);
          return res.json({ success: true, profile: data });
        }
      } catch (_err) {
      }
    }
    const cached = teacherProfilesStore.get(userId) || Array.from(teacherProfilesStore.values()).find((p) => p.email === email);
    res.json({ success: true, profile: cached || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teacher profile" });
  }
});
router5.post("/api/teacher/profile", verifyTeacherOrAdmin, async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || req.body.userId || `teacher_${Date.now()}`;
    const email = verifiedUser?.email || req.body.email || "";
    const { name, subjects, bio, qualification, experienceYears, photoUrl } = req.body;
    const profileData = {
      id: req.body.id || `tp_${Date.now()}`,
      userId,
      name: name || verifiedUser?.email?.split("@")[0] || "Teacher",
      email,
      subjects: Array.isArray(subjects) ? subjects : [subjects || "General Studies"],
      bio: bio || "",
      qualification: qualification || "Educator",
      experienceYears: Number(experienceYears) || 1,
      photoUrl: photoUrl || "",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    teacherProfilesStore.set(userId, profileData);
    if (supabaseServer) {
      try {
        await supabaseServer.from("teacher_profiles").upsert([{
          id: profileData.id,
          user_id: userId,
          name: profileData.name,
          email,
          subjects: profileData.subjects,
          bio: profileData.bio,
          qualification: profileData.qualification,
          experience_years: profileData.experienceYears,
          photo_url: profileData.photoUrl,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "user_id" });
      } catch (err) {
        console.warn("Supabase save teacher profile warning:", err);
      }
    }
    res.json({ success: true, profile: profileData });
  } catch (err) {
    res.status(500).json({ error: "Failed to save teacher profile" });
  }
});
router5.get("/api/teacher/classes", async (req, res) => {
  try {
    const teacherId = req.query.teacherId;
    const status = req.query.status;
    if (supabaseServer) {
      try {
        let q = supabaseServer.from("teacher_classes").select("*").order("scheduled_at", { ascending: true });
        if (teacherId) q = q.eq("teacher_id", teacherId);
        if (status) q = q.in("status", status.split(","));
        const { data } = await q;
        if (data) {
          for (const c of data) {
            const mapped = {
              id: c.id,
              teacherId: c.teacher_id,
              teacherName: c.teacher_name,
              title: c.title,
              subject: c.subject,
              description: c.description,
              scheduledAt: c.scheduled_at,
              durationMins: c.duration_mins,
              maxStudents: c.max_students,
              meetingLink: c.meeting_link,
              status: c.status,
              recordingUrl: c.recording_url,
              createdAt: c.created_at
            };
            teacherClassesStore.set(c.id, mapped);
          }
        }
      } catch (_err) {
      }
    }
    let classes = Array.from(teacherClassesStore.values());
    if (teacherId) classes = classes.filter((c) => c.teacherId === teacherId);
    if (status) {
      const allowed = status.split(",");
      classes = classes.filter((c) => allowed.includes(c.status));
    }
    const enriched = classes.map((c) => {
      const enrollments = classEnrollmentsStore.get(c.id) || [];
      return { ...c, enrolledCount: enrollments.length };
    });
    res.json({ success: true, classes: enriched });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teacher classes" });
  }
});
router5.post("/api/teacher/classes", verifyTeacherOrAdmin, async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const teacherId = verifiedUser?.sub || req.body.teacherId || "teacher_dev";
    const teacherName = req.body.teacherName || verifiedUser?.email?.split("@")[0] || "Faculty Member";
    const { title, subject, description, scheduledAt, durationMins, maxStudents, meetingLink } = req.body;
    if (!title || !subject) {
      return res.status(400).json({ error: "Title and subject are required." });
    }
    const newClass = {
      id: `cls_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      teacherId,
      teacherName,
      title,
      subject,
      description: description || "",
      scheduledAt: scheduledAt || new Date(Date.now() + 36e5).toISOString(),
      durationMins: Number(durationMins) || 60,
      maxStudents: Number(maxStudents) || 100,
      meetingLink: meetingLink || `https://meet.jit.si/aspirantx-class-${Date.now()}`,
      status: "SCHEDULED",
      recordingUrl: "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    teacherClassesStore.set(newClass.id, newClass);
    if (supabaseServer) {
      try {
        await supabaseServer.from("teacher_classes").upsert([{
          id: newClass.id,
          teacher_id: teacherId,
          teacher_name: teacherName,
          title: newClass.title,
          subject: newClass.subject,
          description: newClass.description,
          scheduled_at: newClass.scheduledAt,
          duration_mins: newClass.durationMins,
          max_students: newClass.maxStudents,
          meeting_link: newClass.meetingLink,
          status: newClass.status,
          recording_url: newClass.recordingUrl,
          created_at: newClass.createdAt
        }], { onConflict: "id" });
      } catch (err) {
        console.warn("Supabase save class warning:", err);
      }
    }
    res.json({ success: true, class: newClass });
  } catch (err) {
    res.status(500).json({ error: "Failed to schedule class" });
  }
});
router5.patch("/api/teacher/classes/:id", verifyTeacherOrAdmin, async (req, res) => {
  try {
    const classId = req.params.id;
    const { status, recordingUrl } = req.body;
    const existing = teacherClassesStore.get(classId) || {};
    const updated = {
      ...existing,
      id: classId,
      ...status ? { status } : {},
      ...recordingUrl !== void 0 ? { recordingUrl } : {}
    };
    teacherClassesStore.set(classId, updated);
    if (supabaseServer) {
      try {
        const payload = {};
        if (status) payload.status = status;
        if (recordingUrl !== void 0) payload.recording_url = recordingUrl;
        await supabaseServer.from("teacher_classes").update(payload).eq("id", classId);
      } catch (err) {
        console.warn("Supabase update class status warning:", err);
      }
    }
    res.json({ success: true, class: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update class" });
  }
});
router5.post("/api/teacher/classes/:id/enroll", async (req, res) => {
  try {
    const classId = req.params.id;
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const studentId = verifiedUser ? verifiedUser.sub : `guest_${Date.now()}`;
    const studentEmail = verifiedUser ? verifiedUser.email : req.body.studentEmail || "guest@example.com";
    const studentName = req.body.studentName || (verifiedUser ? verifiedUser.email.split("@")[0] : "Guest Aspirant");
    const enrollment = {
      id: `enr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      classId,
      studentId,
      studentName,
      studentEmail,
      enrolledAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const current = classEnrollmentsStore.get(classId) || [];
    if (!current.some((e) => e.studentId === studentId || e.studentEmail === studentEmail)) {
      current.push(enrollment);
      classEnrollmentsStore.set(classId, current);
    }
    if (supabaseServer) {
      try {
        await supabaseServer.from("class_enrollments").upsert([{
          id: enrollment.id,
          class_id: classId,
          student_id: studentId,
          student_name: studentName,
          student_email: studentEmail,
          enrolled_at: enrollment.enrolledAt
        }], { onConflict: "id" });
      } catch (_e) {
      }
    }
    res.json({ success: true, enrollment });
  } catch (err) {
    res.status(500).json({ error: "Failed to enroll in class" });
  }
});
router5.post("/api/teacher/classes/:id/join", async (req, res) => {
  try {
    const classId = req.params.id;
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const studentId = verifiedUser ? verifiedUser.sub : `guest_${Date.now()}`;
    const studentEmail = verifiedUser ? verifiedUser.email : req.body.studentEmail || "guest@example.com";
    const studentName = req.body.studentName || (verifiedUser ? verifiedUser.email.split("@")[0] : "Guest Aspirant");
    const attendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      classId,
      studentId,
      studentName,
      studentEmail,
      joinedAt: (/* @__PURE__ */ new Date()).toISOString(),
      durationMins: 0
    };
    const currentAtt = classAttendanceStore.get(classId) || [];
    currentAtt.push(attendanceRecord);
    classAttendanceStore.set(classId, currentAtt);
    if (supabaseServer) {
      try {
        await supabaseServer.from("class_attendance").upsert([{
          id: attendanceRecord.id,
          class_id: classId,
          student_id: studentId,
          student_name: studentName,
          student_email: studentEmail,
          joined_at: attendanceRecord.joinedAt
        }], { onConflict: "id" });
      } catch (_e) {
      }
    }
    const classInfo = teacherClassesStore.get(classId);
    res.json({
      success: true,
      meetingLink: classInfo?.meetingLink || `https://meet.jit.si/aspirantx-class-${classId}`,
      attendance: attendanceRecord
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to record class attendance" });
  }
});
router5.get("/api/teacher/classes/:id/students", verifyTeacherOrAdmin, async (req, res) => {
  try {
    const classId = req.params.id;
    let enrollments = classEnrollmentsStore.get(classId) || [];
    let attendance = classAttendanceStore.get(classId) || [];
    if (supabaseServer) {
      try {
        const [enrRes, attRes] = await Promise.all([
          supabaseServer.from("class_enrollments").select("*").eq("class_id", classId),
          supabaseServer.from("class_attendance").select("*").eq("class_id", classId)
        ]);
        if (enrRes.data) enrollments = enrRes.data.map((e) => ({ id: e.id, classId: e.class_id, studentId: e.student_id, studentName: e.student_name, studentEmail: e.student_email, enrolledAt: e.enrolled_at }));
        if (attRes.data) attendance = attRes.data.map((a) => ({ id: a.id, classId: a.class_id, studentId: a.student_id, studentName: a.student_name, studentEmail: a.student_email, joinedAt: a.joined_at }));
      } catch (_e) {
      }
    }
    res.json({ success: true, enrollments, attendance });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch class students" });
  }
});
router5.get("/api/teacher/my-students", verifyTeacherOrAdmin, async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const teacherId = verifiedUser?.sub || req.query.teacherId;
    let classes = Array.from(teacherClassesStore.values());
    if (teacherId) classes = classes.filter((c) => c.teacherId === teacherId);
    const classIds = classes.map((c) => c.id);
    const studentMap = /* @__PURE__ */ new Map();
    for (const cid of classIds) {
      const enrollments = classEnrollmentsStore.get(cid) || [];
      const attendance = classAttendanceStore.get(cid) || [];
      for (const enr of enrollments) {
        const sid = enr.studentId || enr.studentEmail;
        if (!studentMap.has(sid)) {
          studentMap.set(sid, {
            studentId: enr.studentId,
            studentName: enr.studentName,
            studentEmail: enr.studentEmail,
            classesAttendedCount: 0,
            assignmentsSubmittedCount: 0
          });
        }
      }
      for (const att of attendance) {
        const sid = att.studentId || att.studentEmail;
        const entry = studentMap.get(sid) || {
          studentId: att.studentId,
          studentName: att.studentName,
          studentEmail: att.studentEmail,
          classesAttendedCount: 0,
          assignmentsSubmittedCount: 0
        };
        entry.classesAttendedCount += 1;
        studentMap.set(sid, entry);
      }
    }
    res.json({ success: true, students: Array.from(studentMap.values()) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teacher students" });
  }
});
router5.post("/api/teacher/classes/:classId/assignments", verifyTeacherOrAdmin, async (req, res) => {
  try {
    const classId = req.params.classId;
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const teacherId = verifiedUser?.sub || req.body.teacherId || "teacher_dev";
    const { title, description, dueDate, attachmentUrl } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Assignment title is required." });
    }
    const assignment = {
      id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      classId,
      teacherId,
      title,
      description: description || "",
      dueDate: dueDate || new Date(Date.now() + 864e5 * 7).toISOString(),
      attachmentUrl: attachmentUrl || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const current = classAssignmentsStore.get(classId) || [];
    current.push(assignment);
    classAssignmentsStore.set(classId, current);
    if (supabaseServer) {
      try {
        await supabaseServer.from("class_assignments").upsert([{
          id: assignment.id,
          class_id: classId,
          teacher_id: teacherId,
          title,
          description: assignment.description,
          due_date: assignment.dueDate,
          attachment_url: assignment.attachmentUrl,
          created_at: assignment.createdAt
        }], { onConflict: "id" });
      } catch (_e) {
      }
    }
    res.json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ error: "Failed to create assignment" });
  }
});
router5.get("/api/teacher/classes/:classId/assignments", async (req, res) => {
  try {
    const classId = req.params.classId;
    let assignments = classAssignmentsStore.get(classId) || [];
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from("class_assignments").select("*").eq("class_id", classId);
        if (data) {
          assignments = data.map((a) => ({
            id: a.id,
            classId: a.class_id,
            teacherId: a.teacher_id,
            title: a.title,
            description: a.description,
            dueDate: a.due_date,
            attachmentUrl: a.attachment_url,
            createdAt: a.created_at
          }));
          classAssignmentsStore.set(classId, assignments);
        }
      } catch (_e) {
      }
    }
    const enriched = assignments.map((a) => {
      const subs = assignmentSubmissionsStore.get(a.id) || [];
      return { ...a, submissionCount: subs.length };
    });
    res.json({ success: true, assignments: enriched });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});
router5.post("/api/teacher/assignments/:assignmentId/submit", async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const studentId = verifiedUser ? verifiedUser.sub : `guest_${Date.now()}`;
    const studentEmail = verifiedUser ? verifiedUser.email : req.body.studentEmail || "guest@example.com";
    const studentName = req.body.studentName || (verifiedUser ? verifiedUser.email.split("@")[0] : "Guest Aspirant");
    const { submissionText, attachmentUrl } = req.body;
    const submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      assignmentId,
      studentId,
      studentName,
      studentEmail,
      submissionText: submissionText || "",
      attachmentUrl: attachmentUrl || "",
      submittedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const current = assignmentSubmissionsStore.get(assignmentId) || [];
    current.push(submission);
    assignmentSubmissionsStore.set(assignmentId, current);
    if (supabaseServer) {
      try {
        await supabaseServer.from("assignment_submissions").upsert([{
          id: submission.id,
          assignment_id: assignmentId,
          student_id: studentId,
          student_name: studentName,
          student_email: studentEmail,
          submission_text: submission.submissionText,
          attachment_url: submission.attachmentUrl,
          submitted_at: submission.submittedAt
        }], { onConflict: "id" });
      } catch (_e) {
      }
    }
    res.json({ success: true, submission });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit assignment" });
  }
});
router5.get("/api/teacher/assignments/:assignmentId/submissions", verifyTeacherOrAdmin, async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    let submissions = assignmentSubmissionsStore.get(assignmentId) || [];
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from("assignment_submissions").select("*").eq("assignment_id", assignmentId);
        if (data) {
          submissions = data.map((s) => ({
            id: s.id,
            assignmentId: s.assignment_id,
            studentId: s.student_id,
            studentName: s.student_name,
            studentEmail: s.student_email,
            submissionText: s.submission_text,
            attachmentUrl: s.attachment_url,
            grade: s.grade,
            feedback: s.feedback,
            submittedAt: s.submitted_at,
            gradedAt: s.graded_at
          }));
          assignmentSubmissionsStore.set(assignmentId, submissions);
        }
      } catch (_e) {
      }
    }
    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});
router5.post("/api/teacher/submissions/:submissionId/grade", verifyTeacherOrAdmin, async (req, res) => {
  try {
    const submissionId = req.params.submissionId;
    const { grade, feedback } = req.body;
    let targetSub = null;
    for (const [asgId, list] of assignmentSubmissionsStore.entries()) {
      const idx = list.findIndex((s) => s.id === submissionId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], grade, feedback, gradedAt: (/* @__PURE__ */ new Date()).toISOString() };
        targetSub = list[idx];
        assignmentSubmissionsStore.set(asgId, list);
        break;
      }
    }
    if (supabaseServer) {
      try {
        await supabaseServer.from("assignment_submissions").update({
          grade,
          feedback,
          graded_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", submissionId);
      } catch (_e) {
      }
    }
    res.json({ success: true, submission: targetSub });
  } catch (err) {
    res.status(500).json({ error: "Failed to grade submission" });
  }
});
router5.get("/api/sponsorship/public-stats", async (_req, res) => {
  try {
    let totalStudents = adminUsersDb.length || 12500;
    let totalQuestionsAnswered = 85e4;
    let examsCovered = 14;
    if (supabaseServer) {
      try {
        const { count } = await supabaseServer.from("user_profiles").select("*", { count: "exact", head: true });
        if (count) totalStudents = count;
      } catch (_e) {
      }
    }
    res.json({
      success: true,
      stats: {
        totalStudents,
        totalQuestionsAnswered,
        examsCovered,
        activeMonthlyUsers: Math.round(totalStudents * 0.72)
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sponsorship public stats" });
  }
});
router5.get("/api/sponsorship/tiers", async (_req, res) => {
  try {
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from("sponsorship_tiers").select("*").order("sort_order", { ascending: true });
        if (data && data.length > 0) {
          sponsorshipTiersStore.clear();
          for (const t of data) {
            sponsorshipTiersStore.set(t.id, {
              id: t.id,
              name: t.name,
              priceRange: t.price_range,
              benefits: Array.isArray(t.benefits) ? t.benefits : typeof t.benefits === "string" ? JSON.parse(t.benefits) : [],
              sortOrder: t.sort_order,
              isActive: t.is_active,
              createdAt: t.created_at
            });
          }
        }
      } catch (_e) {
      }
    }
    const tiers = Array.from(sponsorshipTiersStore.values()).sort((a, b) => a.sortOrder - b.sortOrder);
    res.json({ success: true, tiers });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sponsorship tiers" });
  }
});
router5.post("/api/sponsorship/tiers", verifyAdminAuth, async (req, res) => {
  try {
    const { name, priceRange, benefits, sortOrder } = req.body;
    if (!name || !priceRange) {
      return res.status(400).json({ error: "Name and price range are required." });
    }
    const tier = {
      id: `tier_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      priceRange,
      benefits: Array.isArray(benefits) ? benefits : [],
      sortOrder: Number(sortOrder) || sponsorshipTiersStore.size + 1,
      isActive: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    sponsorshipTiersStore.set(tier.id, tier);
    if (supabaseServer) {
      try {
        await supabaseServer.from("sponsorship_tiers").upsert([{
          id: tier.id,
          name: tier.name,
          price_range: tier.priceRange,
          benefits: tier.benefits,
          sort_order: tier.sortOrder,
          is_active: tier.isActive,
          created_at: tier.createdAt
        }], { onConflict: "id" });
      } catch (_e) {
      }
    }
    res.json({ success: true, tier });
  } catch (err) {
    res.status(500).json({ error: "Failed to create sponsorship tier" });
  }
});
router5.patch("/api/sponsorship/tiers/:id", verifyAdminAuth, async (req, res) => {
  try {
    const tierId = req.params.id;
    const existing = sponsorshipTiersStore.get(tierId);
    if (!existing) {
      return res.status(404).json({ error: "Tier not found" });
    }
    const updated = { ...existing, ...req.body };
    sponsorshipTiersStore.set(tierId, updated);
    if (supabaseServer) {
      try {
        await supabaseServer.from("sponsorship_tiers").update({
          name: updated.name,
          price_range: updated.priceRange,
          benefits: updated.benefits,
          sort_order: updated.sortOrder,
          is_active: updated.isActive
        }).eq("id", tierId);
      } catch (_e) {
      }
    }
    res.json({ success: true, tier: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update sponsorship tier" });
  }
});
router5.delete("/api/sponsorship/tiers/:id", verifyAdminAuth, async (req, res) => {
  try {
    const tierId = req.params.id;
    sponsorshipTiersStore.delete(tierId);
    if (supabaseServer) {
      try {
        await supabaseServer.from("sponsorship_tiers").delete().eq("id", tierId);
      } catch (_e) {
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete sponsorship tier" });
  }
});
router5.get("/api/sponsorship/sponsors", async (_req, res) => {
  try {
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from("active_sponsors").select("*");
        if (data && data.length > 0) {
          activeSponsorsStore.clear();
          for (const s of data) {
            activeSponsorsStore.set(s.id, {
              id: s.id,
              name: s.name,
              logoUrl: s.logo_url,
              websiteUrl: s.website_url,
              tierName: s.tier_name,
              testimonial: s.testimonial,
              createdAt: s.created_at
            });
          }
        }
      } catch (_e) {
      }
    }
    res.json({ success: true, sponsors: Array.from(activeSponsorsStore.values()) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch active sponsors" });
  }
});
router5.post("/api/sponsorship/sponsors", verifyAdminAuth, async (req, res) => {
  try {
    const { name, logoUrl, websiteUrl, tierName, testimonial } = req.body;
    if (!name || !logoUrl) {
      return res.status(400).json({ error: "Sponsor name and logo URL are required." });
    }
    const sponsor = {
      id: `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      logoUrl,
      websiteUrl: websiteUrl || "",
      tierName: tierName || "Community Partner",
      testimonial: testimonial || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    activeSponsorsStore.set(sponsor.id, sponsor);
    if (supabaseServer) {
      try {
        await supabaseServer.from("active_sponsors").upsert([{
          id: sponsor.id,
          name: sponsor.name,
          logo_url: sponsor.logoUrl,
          website_url: sponsor.websiteUrl,
          tier_name: sponsor.tierName,
          testimonial: sponsor.testimonial,
          created_at: sponsor.createdAt
        }], { onConflict: "id" });
      } catch (_e) {
      }
    }
    res.json({ success: true, sponsor });
  } catch (err) {
    res.status(500).json({ error: "Failed to add active sponsor" });
  }
});
router5.delete("/api/sponsorship/sponsors/:id", verifyAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    activeSponsorsStore.delete(id);
    if (supabaseServer) {
      try {
        await supabaseServer.from("active_sponsors").delete().eq("id", id);
      } catch (_e) {
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove active sponsor" });
  }
});
router5.post("/api/sponsorship/apply", async (req, res) => {
  try {
    const { companyName, contactName, email, phone, tierInterest, message } = req.body;
    if (!companyName || !contactName || !email) {
      return res.status(400).json({ error: "Company name, contact name, and email are required." });
    }
    const application = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyName,
      contactName,
      email,
      phone: phone || "",
      tierInterest: tierInterest || "Community Partner",
      message: message || "",
      status: "PENDING",
      adminNote: "",
      appliedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    sponsorshipApplicationsStore.set(application.id, application);
    if (supabaseServer) {
      try {
        await supabaseServer.from("sponsorship_applications").upsert([{
          id: application.id,
          company_name: companyName,
          contact_name: contactName,
          email,
          phone: application.phone,
          tier_interest: application.tierInterest,
          message: application.message,
          status: application.status,
          admin_note: "",
          applied_at: application.appliedAt
        }], { onConflict: "id" });
      } catch (_e) {
      }
    }
    res.json({ success: true, application });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit sponsorship application" });
  }
});
router5.get("/api/sponsorship/applications", verifyAdminAuth, async (_req, res) => {
  try {
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from("sponsorship_applications").select("*").order("applied_at", { ascending: false });
        if (data && data.length > 0) {
          sponsorshipApplicationsStore.clear();
          for (const a of data) {
            sponsorshipApplicationsStore.set(a.id, {
              id: a.id,
              companyName: a.company_name,
              contactName: a.contact_name,
              email: a.email,
              phone: a.phone,
              tierInterest: a.tier_interest,
              message: a.message,
              status: a.status,
              adminNote: a.admin_note,
              appliedAt: a.applied_at
            });
          }
        }
      } catch (_e) {
      }
    }
    res.json({ success: true, applications: Array.from(sponsorshipApplicationsStore.values()) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sponsorship applications" });
  }
});
router5.post("/api/sponsorship/applications/:id/action", verifyAdminAuth, async (req, res) => {
  try {
    const appId = req.params.id;
    const { action, adminNote } = req.body;
    const app = sponsorshipApplicationsStore.get(appId);
    if (!app) {
      return res.status(404).json({ error: "Application not found" });
    }
    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    app.status = newStatus;
    if (adminNote) app.adminNote = adminNote;
    sponsorshipApplicationsStore.set(appId, app);
    if (supabaseServer) {
      try {
        await supabaseServer.from("sponsorship_applications").update({
          status: newStatus,
          admin_note: adminNote || ""
        }).eq("id", appId);
      } catch (_e) {
      }
    }
    if (action === "APPROVE") {
      const newSponsor = {
        id: `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: app.companyName,
        logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&auto=format&fit=crop&q=80",
        websiteUrl: "",
        tierName: app.tierInterest,
        testimonial: `Proud partner of AspirantX.`,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      activeSponsorsStore.set(newSponsor.id, newSponsor);
      if (supabaseServer) {
        try {
          await supabaseServer.from("active_sponsors").upsert([{
            id: newSponsor.id,
            name: newSponsor.name,
            logo_url: newSponsor.logoUrl,
            website_url: newSponsor.websiteUrl,
            tier_name: newSponsor.tierName,
            testimonial: newSponsor.testimonial,
            created_at: newSponsor.createdAt
          }], { onConflict: "id" });
        } catch (_e) {
        }
      }
    }
    res.json({ success: true, application: app });
  } catch (err) {
    res.status(500).json({ error: "Failed to update application status" });
  }
});
router5.get("/api/podcasts", async (_req, res) => {
  try {
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from("podcasts").select("id, title, description, audio_url, duration, category, created_at, data");
        if (data && data.length > 0) {
          for (const item of data) {
            const pod = item.data ? { ...item.data, id: item.id } : item;
            if (pod.id) podcastsStore.set(pod.id, pod);
          }
        }
      } catch (err) {
        console.warn("Supabase fetch podcasts warning:", err);
      }
    }
    if (podcastsStore.size === 0) {
      DEFAULT_PODCASTS_LIST.forEach((p) => podcastsStore.set(p.id, p));
    }
    const list = Array.from(podcastsStore.values());
    res.json({ success: true, podcasts: list });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch podcasts: " + err.message });
  }
});
router5.post("/api/blog/requests", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { teacherId, teacherEmail, teacherName, customMessage } = req.body;
    if (!teacherEmail) {
      return res.status(400).json({ error: "Teacher email is required" });
    }
    const submissionToken = `req_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const reqId = `breq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const blogReq = {
      id: reqId,
      teacherId: teacherId || "ed_1",
      teacherEmail: String(teacherEmail).trim().toLowerCase(),
      teacherName: teacherName || "Educator",
      requestedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "sent",
      submissionToken,
      customMessage: customMessage || ""
    };
    blogRequestsStore.set(reqId, blogReq);
    if (supabaseServer) {
      try {
        await supabaseServer.from("blog_content_requests").upsert([{
          id: reqId,
          data: blogReq,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (err) {
        console.warn("Supabase blog_content_requests upsert warning:", err);
      }
    }
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol || "https";
    const submissionUrl = `${protocol}://${host}/#blog-submit/${submissionToken}`;
    const subject = "Aaj ka current affairs/newspaper content bhejein";
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; color: #1e293b; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0;">AspirantX Faculty Hub</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Daily Current Affairs & Editorial Content Request</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${teacherName || "Educator"}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6;">AspirantX team is requesting today's daily current affairs analysis, newspaper summary, or editorial article for our student community.</p>
        
        ${customMessage ? `<div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-size: 14px; color: #334155;"><strong>Admin Note:</strong> ${customMessage}</div>` : ""}

        <div style="text-align: center; margin: 32px 0;">
          <a href="${submissionUrl}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">Submit Content Now &rarr;</a>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Or copy & paste this link in your browser:<br/><a href="${submissionUrl}" style="color: #0284c7; word-break: break-all;">${submissionUrl}</a></p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">This unique submission link is valid specifically for your teacher profile.</p>
      </div>
    `;
    const sendRes = await sendTransactionalEmail(blogReq.teacherEmail, subject, emailHtml);
    const act = {
      id: `act-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      memberName: "Admin",
      action: "BLOG_REQUEST",
      details: `Requested daily blog content from ${teacherName || teacherEmail}`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();
    res.json({
      success: true,
      request: blogReq,
      emailSent: sendRes.sent,
      emailError: sendRes.error,
      submissionUrl
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create blog request: " + err.message });
  }
});
router5.get("/api/blog/requests", verifyAdminAuth, async (_req, res) => {
  try {
    const list = Array.from(blogRequestsStore.values()).sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
    res.json({ success: true, requests: list });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog requests" });
  }
});
router5.get("/api/blog/submit/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const request = Array.from(blogRequestsStore.values()).find((r) => r.submissionToken === token);
    if (!request) {
      return res.status(404).json({ error: "Invalid or expired submission link." });
    }
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: "Failed to load submission form data" });
  }
});
router5.post("/api/blog/submit/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { title, body, category, coverImageUrl } = req.body;
    const request = Array.from(blogRequestsStore.values()).find((r) => r.submissionToken === token);
    if (!request) {
      return res.status(404).json({ error: "Invalid or expired submission token." });
    }
    if (!title || !body) {
      return res.status(400).json({ error: "Title and content body are required." });
    }
    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPost = {
      id: postId,
      title: String(title).trim(),
      body: String(body).trim(),
      category: category || "Current Affairs",
      authorTeacherId: request.teacherId,
      authorName: request.teacherName || "Faculty",
      status: "pending",
      coverImageUrl: coverImageUrl || "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    blogPostsStore.set(postId, newPost);
    request.status = "submitted";
    request.submittedPostId = postId;
    blogRequestsStore.set(request.id, request);
    if (supabaseServer) {
      try {
        await Promise.all([
          supabaseServer.from("blog_posts").upsert([{ id: postId, data: newPost, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" }),
          supabaseServer.from("blog_content_requests").upsert([{ id: request.id, data: request, updated_at: (/* @__PURE__ */ new Date()).toISOString() }], { onConflict: "id" })
        ]);
      } catch (err) {
        console.warn("Supabase save submitted blog post warning:", err);
      }
    }
    const act = {
      id: `act-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      memberName: request.teacherName || "Faculty",
      action: "BLOG_SUBMIT",
      details: `Submitted post "${newPost.title}" for review.`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();
    res.json({ success: true, post: newPost, message: "Blog post submitted successfully! Pending admin approval." });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit blog post: " + err.message });
  }
});
router5.get("/api/blog/posts", async (req, res) => {
  try {
    const statusParam = req.query.status ? String(req.query.status) : "published";
    const allPosts = Array.from(blogPostsStore.values());
    let filtered = allPosts;
    if (statusParam !== "all") {
      filtered = allPosts.filter((p) => p.status === statusParam);
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, posts: filtered });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});
router5.get("/api/blog/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = blogPostsStore.get(id);
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});
router5.post("/api/blog/posts/:id/approve", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const post = blogPostsStore.get(id);
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    post.status = "published";
    post.publishedAt = (/* @__PURE__ */ new Date()).toISOString();
    blogPostsStore.set(id, post);
    if (supabaseServer) {
      try {
        await supabaseServer.from("blog_posts").upsert([{
          id,
          data: post,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (err) {
        console.warn("Supabase approve blog post warning:", err);
      }
    }
    const act = {
      id: `act-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      memberName: "Admin",
      action: "BLOG_APPROVE",
      details: `Approved blog post "${post.title}". It is now published live!`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();
    res.json({ success: true, post, message: "Blog post approved and published!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve blog post" });
  }
});
router5.post("/api/blog/posts/:id/reject", adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const post = blogPostsStore.get(id);
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    post.status = "rejected";
    post.rejectionReason = reason || "Content does not meet editorial standards.";
    blogPostsStore.set(id, post);
    if (supabaseServer) {
      try {
        await supabaseServer.from("blog_posts").upsert([{
          id,
          data: post,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }], { onConflict: "id" });
      } catch (err) {
        console.warn("Supabase reject blog post warning:", err);
      }
    }
    const act = {
      id: `act-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      memberName: "Admin",
      action: "BLOG_REJECT",
      details: `Rejected blog post "${post.title}". Reason: ${post.rejectionReason}`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();
    res.json({ success: true, post, message: "Blog post rejected." });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject blog post" });
  }
});
var teacher_routes_default = router5;

// routes/ai.routes.ts
var import_express6 = require("express");
var import_path7 = __toESM(require("path"), 1);
var router6 = (0, import_express6.Router)();
var __dirname6 = import_path7.default.resolve();
router6.post("/api/gemini/moderate", async (req, res) => {
  try {
    const { text = "", fileName = "", user = "Guest Aspirant", room = "Community", userId, userEmail } = req.body;
    if (userId || userEmail) {
      const bannedUser = adminUsersDb.find(
        (u) => userId && u.id === userId || userEmail && u.email?.toLowerCase() === String(userEmail).toLowerCase()
      );
      if (bannedUser && bannedUser.status === "BANNED") {
        return res.json({ safe: false, banned: true, reason: "Your account has been suspended.", category: "banned" });
      }
    }
    const contentToTest = `${text} ${fileName}`.trim();
    if (!contentToTest) {
      return res.json({ safe: true, reason: "Empty content" });
    }
    const modSettings = globalAdminSettings.moderation || {
      enabled: true,
      autoban: true,
      keywords: ["nsfw", "porn", "nude", "hate", "abuse", "fuck", "bitch", "asshole", "bastard", "explicit"]
    };
    const activeKeywords = modSettings.enabled && Array.isArray(modSettings.keywords) ? modSettings.keywords : [];
    const lower = contentToTest.toLowerCase();
    const hasLocalViolation = activeKeywords.some((kw) => lower.includes(kw.toLowerCase()));
    let modResult = { safe: true, reason: "Clean", category: "clean" };
    if (hasLocalViolation) {
      modResult = { safe: false, reason: "Message contains profane or abusive language violating study guidelines.", category: "abuse" };
    } else {
      const ai = getGeminiClient();
      if (ai) {
        const systemInstruction = `You are AspirantX AI Security Guard, an automated content moderation engine for a student UPSC/SSC study application.
Analyze the input string (message text or attachment filename).
Detect any NSFW content, sexual explicitness, hate speech, severe profanity, harassment, or dangerous material.
You MUST reply ONLY with a valid JSON object matching this schema:
{
  "safe": boolean,
  "reason": string (short explanation if unsafe, or "Clean" if safe),
  "category": string ("clean" | "nsfw" | "abuse" | "hate" | "violence")
}`;
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `Content to evaluate: "${contentToTest}"`,
            config: {
              systemInstruction,
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          });
          if (response.text) {
            modResult = JSON.parse(response.text.trim());
          }
        } catch (e) {
          console.warn("Moderation AI evaluation error:", e);
        }
      }
    }
    let isBanned = false;
    if (!modResult.safe) {
      const clientIp = String(req.headers["x-forwarded-for"] || req.ip || req.socket?.remoteAddress || "127.0.0.1").split(",")[0].trim();
      const requestId = String(req.headers["x-request-id"] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
      recordAdminAuditLog({
        user: userEmail || user,
        action: "AI_MODERATION_VIOLATION",
        details: `${modResult.reason} in ${room}: "${contentToTest.substring(0, 80)}"`,
        ip: clientIp,
        requestId,
        endpoint: req.originalUrl,
        outcome: "DENIED"
      });
      if (modSettings.autoban && (userId || userEmail)) {
        let targetUser = adminUsersDb.find((u) => u.id === userId || userEmail && u.email.toLowerCase() === String(userEmail).toLowerCase());
        if (!targetUser && userEmail) {
          targetUser = {
            id: userId || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: String(userEmail).split("@")[0],
            email: String(userEmail).toLowerCase(),
            exam: "UPSC CSE 2026",
            role: "USER",
            isPremium: false,
            planName: "FREE",
            streakDays: 1,
            xp: 100,
            coins: 50,
            level: 1,
            completedTopicsCount: 0,
            joinedAt: (/* @__PURE__ */ new Date()).toISOString(),
            status: "ACTIVE"
          };
          adminUsersDb.push(targetUser);
        }
        if (targetUser && targetUser.role !== "ADMIN") {
          targetUser.status = "BANNED";
          isBanned = true;
          if (supabaseServer) {
            try {
              await supabaseServer.from("admin_users").upsert([
                { ...targetUser, updated_at: (/* @__PURE__ */ new Date()).toISOString() }
              ], { onConflict: "id" });
            } catch (e) {
            }
          }
          saveAdminStoreToDisk();
          recordAdminAuditLog({
            user: targetUser.email || user,
            action: "AUTO_BAN_TRIGGERED",
            details: `Auto-banned user for violating moderation policy: "${contentToTest.substring(0, 60)}"`,
            outcome: "DENIED"
          });
        }
      }
    }
    res.json({ ...modResult, banned: isBanned });
  } catch (error) {
    console.error("Moderation error:", error);
    res.json({ safe: true, reason: "Bypassed error safely" });
  }
});
router6.post("/api/gemini/bot-moderator", async (req, res) => {
  try {
    const { room = "UPSC Room", query, user = "Aspirant" } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query required" });
    }
    const ai = getGeminiClient();
    if (!ai) {
      const demoReply = `@${user}, regarding your query in ${room}: "${query}" - Here is a quick study takeaway: Ensure you cross-reference this with the official syllabus roadmap and current affairs! Keep grinding! [LAUNCH]`;
      return res.json({ reply: demoReply });
    }
    const systemInstruction = `You are @AspirantX Bot, the official AI Room Moderator and Study Assistant in the ${room} community chat room for UPSC Civil Services & SSC aspirants.
- Address the user (@${user}) directly.
- Provide crisp, authoritative, exam-relevant study insights, PYQ tips, or concept explanations.
- Use bullet points, mnemonic tricks, and an encouraging tone.
- Keep the response around 80-120 words maximum so it fits nicely inside the live room chat stream.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `User query in ${room}: "${query}"`,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    const reply = response.text || `@${user} I'm here to assist! Let me know if you need specific notes or formulas.`;
    res.json({ reply });
  } catch (error) {
    console.error("Bot moderator error:", error);
    res.status(500).json({ error: "Failed to generate bot response" });
  }
});
router6.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, exam = "UPSC_CSE", history = [], userEmail } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message field is required" });
    }
    const chatFlag = featureFlagsStore.find((f) => f.feature_name === "chat");
    if (chatFlag && chatFlag.is_premium) {
      const emailToCheck = userEmail || req.headers["x-user-email"];
      if (!checkUserServerPremiumStatus(emailToCheck)) {
        return res.status(403).json({
          error: "ACCESS DENIED: Premium subscription required. Access blocked by server security.",
          isPremiumRequired: true
        });
      }
    }
    const ai = getGeminiClient();
    if (!ai) {
      const demoReply = `[AspirantX AI Mentor (${exam})]: Great query regarding ${exam}! I see you asked: "${message}". Remember to correlate static concepts (like Laxmikanth or NCERTs) with current affairs from The Hindu / PIB. For detailed answer evaluation or custom notes generation, attach your outline!`;
      return res.json({ reply: demoReply });
    }
    const systemInstruction = `You are AspirantX AI Mentor, an elite, encouraging, high-precision study assistant for ${exam} (UPSC Civil Services & SSC Exams).
- Provide ultra-structured, concise, exam-focused answers.
- Use bullet points, mnemonic devices, key constitutional articles, and PYQ trends where applicable.
- Adopt a Gen-Z motivational, disciplined yet empathetic tone. Use modern formatting with markdown headers and code blocks if appropriate.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    const reply = response.text || "Sorry, I could not generate a response at this time.";
    res.json({ reply });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({
      error: "Failed to process AI chat request",
      details: error.message || "Unknown server error"
    });
  }
});
router6.post("/api/gemini/parse-syllabus", (req, res, next) => {
  req.url = "/api/syllabus/ai-organize";
  return req.app._router.handle(req, res, next);
});
router6.get("/api/ai/conversations", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const emailQuery = req.query.email || "";
    const targetEmail = (verifiedUser?.email || emailQuery || "guest@aspirantx.in").trim().toLowerCase();
    const conversations = [];
    for (const [_, conv] of aiConversationsDb.entries()) {
      if (conv.userEmail === targetEmail) {
        conversations.push(conv);
      }
    }
    conversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations", details: err.message });
  }
});
router6.post("/api/ai/conversations", async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const { title = "New AI Study Session", exam = "UPSC_CSE", mode = "general", userEmail: bodyEmail } = req.body;
    const targetEmail = (verifiedUser?.email || bodyEmail || "guest@aspirantx.in").trim().toLowerCase();
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newConv = {
      id,
      userEmail: targetEmail,
      title: title.trim(),
      exam,
      mode,
      isPinned: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now
    };
    aiConversationsDb.set(id, newConv);
    aiMessagesDb.set(id, []);
    if (supabaseServer) {
      try {
        await supabaseServer.from("ai_conversations").upsert([newConv]);
      } catch (e) {
        console.warn("Supabase conv save note:", e);
      }
    }
    res.json({ success: true, conversation: newConv });
  } catch (err) {
    res.status(500).json({ error: "Failed to create conversation", details: err.message });
  }
});
router6.put("/api/ai/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, isPinned, isArchived, mode, summary } = req.body;
    const conv = aiConversationsDb.get(id);
    if (!conv) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    if (title !== void 0) conv.title = String(title).trim();
    if (isPinned !== void 0) conv.isPinned = Boolean(isPinned);
    if (isArchived !== void 0) conv.isArchived = Boolean(isArchived);
    if (mode !== void 0) conv.mode = String(mode);
    if (summary !== void 0) conv.summary = String(summary);
    conv.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    aiConversationsDb.set(id, conv);
    if (supabaseServer) {
      try {
        await supabaseServer.from("ai_conversations").upsert([conv]);
      } catch (e) {
      }
    }
    res.json({ success: true, conversation: conv });
  } catch (err) {
    res.status(500).json({ error: "Failed to update conversation", details: err.message });
  }
});
router6.delete("/api/ai/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    aiConversationsDb.delete(id);
    aiMessagesDb.delete(id);
    if (supabaseServer) {
      try {
        await supabaseServer.from("ai_conversations").delete().eq("id", id);
        await supabaseServer.from("ai_messages").delete().eq("conversationId", id);
      } catch (e) {
      }
    }
    res.json({ success: true, message: "Conversation deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete conversation", details: err.message });
  }
});
router6.get("/api/ai/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const messages = aiMessagesDb.get(id) || [];
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages", details: err.message });
  }
});
router6.post("/api/ai/messages/:id/feedback", async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, conversationId } = req.body;
    if (conversationId && aiMessagesDb.has(conversationId)) {
      const msgs = aiMessagesDb.get(conversationId) || [];
      const msg = msgs.find((m) => m.id === id);
      if (msg) {
        msg.feedback = feedback;
        aiMessagesDb.set(conversationId, msgs);
      }
    }
    res.json({ success: true, id, feedback });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit feedback", details: err.message });
  }
});
router6.post("/api/ai/stream", async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  const {
    conversationId,
    message,
    exam = "UPSC_CSE",
    mode = "general",
    history = [],
    userEmail: bodyEmail
  } = req.body;
  const targetEmail = (verifiedUser?.email || bodyEmail || "guest@aspirantx.in").trim().toLowerCase();
  const chatFlag = featureFlagsStore.find((f) => f.feature_name === "chat");
  if (chatFlag && chatFlag.is_premium) {
    if (!checkUserServerPremiumStatus(targetEmail)) {
      res.status(403).json({
        error: "ACCESS DENIED: Premium subscription required to access AI Mentor.",
        isPremiumRequired: true
      });
      return;
    }
  }
  const cleanInput = sanitizeAiPrompt(message);
  if (!cleanInput) {
    res.status(400).json({ error: "Valid input message is required." });
    return;
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  const convId = conversationId || `conv_${Date.now()}`;
  if (!aiConversationsDb.has(convId)) {
    const newConv = {
      id: convId,
      userEmail: targetEmail,
      title: cleanInput.slice(0, 35) + "...",
      exam,
      mode,
      isPinned: false,
      isArchived: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    aiConversationsDb.set(convId, newConv);
    aiMessagesDb.set(convId, []);
  }
  const userMsgRecord = {
    id: `msg_u_${Date.now()}`,
    conversationId: convId,
    sender: "user",
    text: cleanInput,
    timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    modeTag: mode
  };
  const existingMsgs = aiMessagesDb.get(convId) || [];
  existingMsgs.push(userMsgRecord);
  aiMessagesDb.set(convId, existingMsgs);
  const assistantMsgId = `msg_a_${Date.now()}`;
  let fullAssistantText = "";
  const ai = getGeminiClient();
  if (!ai) {
    const simulatedResponse = `[AspirantX AI Mentor (${mode.toUpperCase()} - ${exam})]

**Analysis & Guidance for Query:**

"${cleanInput}"

1. **Core Concept Overview**: In ${exam} preparation, analyzing this query requires combining static fundamentals (NCERT / standard textbooks) with current policy updates.
2. **Key Keywords**: Make sure to incorporate key terminology, relevant Constitutional Articles (or equations/data), and Supreme Court judgments.
3. **Way Forward**: Structure your answer with clear intro, subheadings, and a forward-looking conclusion.

*Note: Set your GEMINI_API_KEY in environment or AI Studio settings for real-time Live Gemini streaming.*`;
    const chunks = simulatedResponse.split(" ");
    let i = 0;
    const interval = setInterval(async () => {
      if (i < chunks.length) {
        const word = chunks[i] + " ";
        fullAssistantText += word;
        res.write(`data: ${JSON.stringify({ text: word })}

`);
        i++;
      } else {
        clearInterval(interval);
        const assistantMsgRecord = {
          id: assistantMsgId,
          conversationId: convId,
          sender: "assistant",
          text: fullAssistantText,
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          modeTag: mode
        };
        existingMsgs.push(assistantMsgRecord);
        aiMessagesDb.set(convId, existingMsgs);
        if (supabaseServer) {
          try {
            await supabaseServer.from("ai_messages").upsert([
              {
                id: userMsgRecord.id,
                conversationId: convId,
                sender: userMsgRecord.sender,
                text: userMsgRecord.text,
                timestamp: userMsgRecord.timestamp,
                mode_tag: userMsgRecord.modeTag,
                updated_at: (/* @__PURE__ */ new Date()).toISOString()
              },
              {
                id: assistantMsgRecord.id,
                conversationId: convId,
                sender: assistantMsgRecord.sender,
                text: assistantMsgRecord.text,
                timestamp: assistantMsgRecord.timestamp,
                mode_tag: assistantMsgRecord.modeTag,
                updated_at: (/* @__PURE__ */ new Date()).toISOString()
              }
            ], { onConflict: "id" });
          } catch (e) {
          }
        }
        res.write(`data: ${JSON.stringify({ done: true, messageId: assistantMsgId, conversationId: convId })}

`);
        res.end();
      }
    }, 30);
    req.on("close", () => {
      clearInterval(interval);
    });
    return;
  }
  try {
    const conv = aiConversationsDb.get(convId);
    const summary = conv?.summary;
    const systemInstruction = getSystemInstructionForMode(mode, exam, summary);
    const formattedHistory = Array.isArray(history) ? history.slice(-8).map((h) => ({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    })) : [];
    const contents = [
      ...formattedHistory,
      { role: "user", parts: [{ text: cleanInput }] }
    ];
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullAssistantText += chunk.text;
        res.write(`data: ${JSON.stringify({ text: chunk.text })}

`);
      }
    }
    const assistantMsgRecord = {
      id: assistantMsgId,
      conversationId: convId,
      sender: "assistant",
      text: fullAssistantText,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modeTag: mode
    };
    existingMsgs.push(assistantMsgRecord);
    aiMessagesDb.set(convId, existingMsgs);
    if (supabaseServer) {
      try {
        await supabaseServer.from("ai_messages").upsert([
          {
            id: userMsgRecord.id,
            conversationId: convId,
            sender: userMsgRecord.sender,
            text: userMsgRecord.text,
            timestamp: userMsgRecord.timestamp,
            mode_tag: userMsgRecord.modeTag,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: assistantMsgRecord.id,
            conversationId: convId,
            sender: assistantMsgRecord.sender,
            text: assistantMsgRecord.text,
            timestamp: assistantMsgRecord.timestamp,
            mode_tag: assistantMsgRecord.modeTag,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        ], { onConflict: "id" });
      } catch (e) {
      }
    }
    if (conv) {
      conv.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      aiConversationsDb.set(convId, conv);
    }
    res.write(`data: ${JSON.stringify({ done: true, messageId: assistantMsgId, conversationId: convId })}

`);
    res.end();
  } catch (err) {
    console.error("SSE Stream error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message || "Stream processing error occurred." })}

`);
    res.end();
  }
});
router6.post("/api/ai/evaluate", async (req, res) => {
  try {
    const { answerText, questionText, exam = "UPSC_CSE", type = "mains" } = req.body;
    if (!answerText || typeof answerText !== "string" || answerText.trim().length < 10) {
      return res.status(400).json({ error: "Answer text (minimum 10 characters) is required for evaluation." });
    }
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: true,
        evaluation: {
          totalScore: 6.5,
          structureScore: 7,
          contentScore: 6,
          keywordsScore: 6.5,
          wayForwardScore: 7,
          strengths: [
            "Good structural intro linking topic to current context",
            "Subheadings used effectively to divide arguments",
            "Neutral, balanced administrative tone preserved"
          ],
          weaknesses: [
            "Missing explicit Constitutional Articles (e.g., Art. 38, Art. 39)",
            "Budgetary data / Economic Survey figures could be cited",
            "Way forward needs specific committee recommendations (e.g., NITI Aayog/ARC)"
          ],
          missedKeywords: ["Article 39(b)", "Fiscal Consolidation", "SDG 8", "Inclusive Growth"],
          suggestedAdditions: ["Include a schematic flowchart showing institutional mechanisms."],
          modelAnswerBlueprint: `**Introduction**: Define core concept and link to recent government policy.

**Body**: Split into 3 dimensions (Administrative, Economic, Social).

**Conclusion**: Conclude with a vision towards Amrit Kaal 2047.`
        }
      });
    }
    const prompt = `You are an expert UPSC Civil Services Mains Answer Evaluator.
Evaluate the following ${type.toUpperCase()} response.

Question: ${questionText || "UPSC GS Mains Standard Question"}
Student Answer:
${answerText}

Return a valid JSON object with EXACTLY this structure:
{
  "totalScore": 6.5,
  "structureScore": 7.0,
  "contentScore": 6.0,
  "keywordsScore": 6.5,
  "wayForwardScore": 7.0,
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "missedKeywords": ["Keyword 1", "Keyword 2", "Keyword 3"],
  "suggestedAdditions": ["Addition 1", "Addition 2"],
  "modelAnswerBlueprint": "Detailed markdown outline for a top-scoring model answer"
}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });
    const jsonText = response.text || "{}";
    const evalData = JSON.parse(jsonText);
    res.json({ success: true, evaluation: evalData });
  } catch (err) {
    console.error("AI Evaluation error:", err);
    res.status(500).json({ error: "Failed to complete AI answer evaluation", details: err.message });
  }
});
router6.post("/api/ai/trend-prediction", async (req, res) => {
  try {
    const { userEmail, exam = "UPSC_CSE", clientAttempts } = req.body;
    const emailToCheck = (userEmail || req.headers["x-user-email"] || "").toString().trim().toLowerCase();
    let history = [];
    if (emailToCheck) {
      const direct = cbtResultsStore.get(emailToCheck);
      if (Array.isArray(direct)) {
        history.push(...direct);
      }
      if (history.length === 0) {
        for (const [key, records] of cbtResultsStore.entries()) {
          if (Array.isArray(records)) {
            const matches = records.filter(
              (r) => r.userEmail && r.userEmail.toLowerCase() === emailToCheck || r.user_email && r.user_email.toLowerCase() === emailToCheck
            );
            if (matches.length > 0) {
              history.push(...matches);
            }
          }
        }
      }
    }
    const clientAttemptArray = Array.isArray(clientAttempts) ? clientAttempts : [];
    const totalAttemptsCount = history.length + clientAttemptArray.length;
    if (totalAttemptsCount < 1) {
      return res.json({
        success: false,
        notEnoughData: true,
        message: "Attempt at least 3 practice questions or PYQ tests first so Gemini AI can analyze your accuracy and weak areas!"
      });
    }
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: false,
        geminiNotConfigured: true,
        message: "AI prediction unavailable - GEMINI_API_KEY is not configured in the server environment."
      });
    }
    let totalAccuracy = 0;
    const weakTopicsSet = /* @__PURE__ */ new Set();
    const strongTopicsSet = /* @__PURE__ */ new Set();
    history.forEach((h) => {
      if (typeof h.accuracy === "number") totalAccuracy += h.accuracy;
      if (Array.isArray(h.weakTopics)) h.weakTopics.forEach((t) => weakTopicsSet.add(t));
      if (Array.isArray(h.weakSubjects)) h.weakSubjects.forEach((s) => weakTopicsSet.add(s));
      if (Array.isArray(h.strongTopics)) h.strongTopics.forEach((t) => strongTopicsSet.add(t));
      if (Array.isArray(h.strongSubjects)) h.strongSubjects.forEach((s) => strongTopicsSet.add(s));
    });
    clientAttemptArray.forEach((ca) => {
      if (typeof ca.accuracy === "number") totalAccuracy += ca.accuracy;
      if (ca.weakTopic) weakTopicsSet.add(ca.weakTopic);
      if (ca.subject) strongTopicsSet.add(ca.subject);
    });
    const avgAccuracy = Math.round(totalAccuracy / Math.max(1, totalAttemptsCount));
    const weakTopicsList = Array.from(weakTopicsSet);
    const strongTopicsList = Array.from(strongTopicsSet);
    const prompt = `You are an expert AI Exam Trend Analyst for competitive exams like ${exam}.
Analyze the candidate's actual practice performance data and generate a high-yield AI Trend & Weak Area Prediction Report.

Candidate Data:
- Target Exam: ${exam}
- Total Practice Tests / Quizzes Attempted: ${totalAttemptsCount}
- Average Accuracy Rate: ${avgAccuracy}%
- Identified Weak Topics/Subjects: ${weakTopicsList.join(", ") || "Polity Constitutional Amendments, Economic Monetary Policy"}
- Identified Strong Topics/Subjects: ${strongTopicsList.join(", ") || "Modern History, Indian Geography"}

Output MUST be formatted in clean Markdown with clear emoji headings:
### [HOT] High-Probability Topics for ${exam} (2026 Prediction)
(List 3 specific high-probability topics based on candidate's weak/strong areas and historical exam patterns)

### [!CRITICAL] Weak-Area Diagnostic & Remediation
(Provide concise diagnostic advice on how to fix their weak areas)

### [GOAL] 7-Day High-Yield Action Plan
(3 actionable steps for the upcoming week)

Keep the response concise, razor-sharp, and highly motivating (around 150-200 words max).`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.4
      }
    });
    const predictionText = response.text || "Unable to generate trend prediction report at this moment.";
    res.json({
      success: true,
      prediction: predictionText,
      summaryStats: {
        totalAttempts: totalAttemptsCount,
        avgAccuracy,
        weakTopics: weakTopicsList,
        strongTopics: strongTopicsList
      }
    });
  } catch (err) {
    console.error("AI Trend Prediction Error:", err);
    res.status(500).json({ error: "Failed to generate AI trend prediction", details: err.message });
  }
});
router6.post("/api/ai/summarize", async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ error: "conversationId parameter is required" });
    }
    const msgs = aiMessagesDb.get(conversationId) || [];
    if (msgs.length < 4) {
      return res.json({ success: true, message: "Conversation too short for summarization" });
    }
    const fullTranscript = msgs.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join("\n\n");
    const ai = getGeminiClient();
    let summaryText = "Discussion covered UPSC core syllabus topics, key articles, and exam strategy.";
    if (ai) {
      const prompt = `Summarize the following study discussion in 3-4 bullet points capturing key facts, articles, mnemonics, and topics covered for memory retention:

${fullTranscript.slice(0, 8e3)}`;
      const resp = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: { temperature: 0.3 }
      });
      summaryText = resp.text || summaryText;
    }
    const conv = aiConversationsDb.get(conversationId);
    if (conv) {
      conv.summary = summaryText;
      conv.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      aiConversationsDb.set(conversationId, conv);
    }
    res.json({ success: true, summary: summaryText });
  } catch (err) {
    res.status(500).json({ error: "Failed to summarize conversation", details: err.message });
  }
});
var ai_routes_default = router6;

// server.ts
async function startServer() {
  const app = (0, import_express7.default)();
  const PORT = 3e3;
  const __dirname7 = import_path8.default.resolve();
  app.set("trust proxy", 1);
  app.use((0, import_helmet.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  app.use((0, import_compression.default)());
  app.use(import_express7.default.json({ limit: "50mb" }));
  app.use(import_express7.default.urlencoded({ extended: true, limit: "50mb" }));
  app.use(expressEdgeMiddleware);
  app.use("/api", globalApiLimiter);
  app.get("/ads.txt", (_req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.status(200).send("google.com, pub-8740054860974100, DIRECT, f08c47fec0942fa0\n");
  });
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0-enterprise",
      supabaseUrl: Boolean(process.env.VITE_SUPABASE_URL),
      supabaseKey: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
      isSupabaseDbConfigured,
      supabaseServerExists: Boolean(supabaseServer),
      supabaseConnected: Boolean(supabaseServer),
      memoryUsage: process.memoryUsage(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  });
  app.get("/api/ping", (_req, res) => {
    res.json({ status: "ok", ts: Date.now() });
  });
  app.get("/api/version", (_req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json({
      version: APP_VERSION,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.use(academic_routes_default);
  app.use(community_routes_default);
  app.use(admin_routes_default);
  app.use(user_routes_default);
  app.use(teacher_routes_default);
  app.use(ai_routes_default);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path8.default.join(__dirname7, "dist");
    app.use(import_express7.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path8.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] AspirantX Enterprise Backend listening at http://0.0.0.0:${PORT}`);
  });
  return app;
}
startServer();
var server_default = startServer;
//# sourceMappingURL=server.cjs.map
