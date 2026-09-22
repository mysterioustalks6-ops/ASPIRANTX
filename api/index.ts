let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      try {
        const mod = await import('../server.js');
        cachedApp = mod.default || mod.app;
      } catch (_e) {
        const mod = await import('../server.ts');
        cachedApp = mod.default || mod.app;
      }
    }
    return cachedApp(req, res);
  } catch (err: any) {
    console.error('[VERCEL API ERROR]:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Vercel Serverless Invocation Failed',
        message: err?.message,
        name: err?.name,
        code: err?.code,
        stack: err?.stack?.split('\n').slice(0, 5)
      });
    }
  }
}
