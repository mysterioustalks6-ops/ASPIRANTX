import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { expressEdgeMiddleware } from './authMiddleware.js';

// Import Shared Backend State & Hydration
import * as Shared from './routes/shared.js';
import { isSupabaseDbConfigured, supabaseServer, APP_VERSION } from './routes/shared.js';
import { pgPool, findDatabaseUrl } from './src/lib/postgres.js';

// Import Modular Routers
import academicRoutes from './routes/academic.routes.js';
import communityRoutes from './routes/community.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import aiRoutes from './routes/ai.routes.js';
import cbtRoutes from './routes/cbt.routes.js';
import rewardsRoutes from './routes/rewards.routes.js';
import focusRoutes from './routes/focus.routes.js';

// Server Startup & Initialization (Standalone Mode)
const PORT = 3000;
const __dirname = path.resolve();

export const app = express();

app.set('trust proxy', 1);

// Primary Security & Compression Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Allowed production and mobile application origins
const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:[0-9]+)?$/,
  /^https?:\/\/127\.0\.0\.1(:[0-9]+)?$/,
  /^capacitor:\/\/localhost$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/(www\.)?aspirantx\.com$/,
  /^https:\/\/(www\.)?protrack\.app$/,
];

const customOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Enable CORS for native mobile apps (Capacitor/Android/iOS), web deployments, and local dev
app.use((req, res, next) => {
  const origin = req.headers.origin;

  let isAllowed = false;
  if (!origin) {
    // Non-browser or same-origin direct calls (e.g. native HTTP stack, health probes)
    isAllowed = true;
  } else if (customOrigins.includes(origin)) {
    isAllowed = true;
  } else if (ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin))) {
    isAllowed = true;
  }

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Edge auth & global rate limiter on API routes
app.use(expressEdgeMiddleware);
app.use('/api', Shared.globalApiLimiter);

// Public Diagnostic / Health Endpoints
app.get('/ads.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send('google.com, pub-8740054860974100, DIRECT, f08c47fec0942fa0\n');
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    postgresConfigured: Boolean(findDatabaseUrl()),
    neonPoolInitialized: Boolean(pgPool),
    envKeysDetected: {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
      hasNeonUrl: Boolean(process.env.NEON_DATABASE_URL),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      detectedCandidateKeys: Object.keys(process.env).filter(k => 
        k.toLowerCase().includes('data') || 
        k.toLowerCase().includes('post') || 
        k.toLowerCase().includes('neon') || 
        k.toLowerCase().includes('sql') ||
        k.toLowerCase().includes('db')
      ),
    },
    supabaseUrl: Boolean(process.env.VITE_SUPABASE_URL),
    supabaseKey: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
    isSupabaseDbConfigured,
    supabaseServerExists: Boolean(supabaseServer),
    supabaseConnected: Boolean(supabaseServer),
    memoryUsage: process.memoryUsage(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.get('/api/ping', (_req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

app.get('/api/version', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({
    version: APP_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Canonical Release APK Endpoints with strict anti-stale cache headers
const apkDownloadHandler = (_req: express.Request, res: express.Response) => {
  const protrackPath = path.join(__dirname, 'public', 'protrack.apk');
  const aspirantxPath = path.join(__dirname, 'public', 'aspirantx.apk');
  const apkPath = fs.existsSync(protrackPath) ? protrackPath : aspirantxPath;
  if (fs.existsSync(apkPath)) {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="ProTrack.apk"');
    res.sendFile(apkPath);
  } else {
    res.status(404).send('Release APK Not Found');
  }
};

app.get('/protrack.apk', apkDownloadHandler);
app.get('/ProTrack.apk', apkDownloadHandler);
app.get('/ProTrack-v2.4.2.apk', apkDownloadHandler);
app.get('/aspirantx.apk', apkDownloadHandler);
app.get('/AspirantX.apk', apkDownloadHandler);
app.get('/AspirantX-v2.4.2.apk', apkDownloadHandler);
app.get('/AspirantX-v2.4.1.apk', apkDownloadHandler);
app.get('/api/download/apk', apkDownloadHandler);

// Mount Feature Routers
app.use(academicRoutes);
app.use(communityRoutes);
app.use(adminRoutes);
app.use(userRoutes);
app.use(teacherRoutes);
app.use(aiRoutes);
app.use(cbtRoutes);
app.use(rewardsRoutes);
app.use(focusRoutes);

// Standalone Server Listening (Skipped in Vercel Serverless / AWS Lambda)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  if (process.env.NODE_ENV !== 'production') {
    import('vite').then(({ createServer: createViteServer }) => {
      createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      }).then((vite) => {
        app.use(vite.middlewares);
        app.listen(PORT, '0.0.0.0', () => {
          console.log(`[SERVER] ProTrack Enterprise Backend listening at http://0.0.0.0:${PORT}`);
        });
      });
    }).catch(err => {
      console.error('[SERVER] Vite dev server error:', err);
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`[SERVER] ProTrack Enterprise Backend fallback listening at http://0.0.0.0:${PORT}`);
      });
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    const publicPath = path.join(__dirname, 'public');
    
    app.use(express.static(distPath));
    app.use(express.static(publicPath));
    app.use('/audio', express.static(path.join(publicPath, 'audio'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.wav')) {
          res.setHeader('Content-Type', 'audio/wav');
        } else if (filePath.endsWith('.mp3')) {
          res.setHeader('Content-Type', 'audio/mpeg');
        }
      }
    }));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] ProTrack Enterprise Backend listening at http://0.0.0.0:${PORT}`);
    });
  }
}

export default app;
