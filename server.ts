import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { expressEdgeMiddleware } from './authMiddleware.js';

// Import Shared Backend State & Hydration
import * as Shared from './routes/shared.js';
import { isSupabaseDbConfigured, supabaseServer, APP_VERSION } from './routes/shared.js';

// Import Modular Routers
import academicRoutes from './routes/academic.routes.js';
import communityRoutes from './routes/community.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import aiRoutes from './routes/ai.routes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const __dirname = path.resolve();

  app.set('trust proxy', 1);

  // Primary Security & Compression Middlewares
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
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
      version: '1.0.0-enterprise',
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

  // Mount Feature Routers
  app.use(academicRoutes);
  app.use(communityRoutes);
  app.use(adminRoutes);
  app.use(userRoutes);
  app.use(teacherRoutes);
  app.use(aiRoutes);

  // Static / Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Server Startup & Initialization
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] AspirantX Enterprise Backend listening at http://0.0.0.0:${PORT}`);
  });

  return app;
}

startServer();

export default startServer;
