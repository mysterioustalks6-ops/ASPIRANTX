let appInstance: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!appInstance) {
      try {
        const mod = await import('./index.js');
        appInstance = mod.default || mod.app || mod;
      } catch (err1: any) {
        try {
          const mod = await import('../server.js');
          appInstance = mod.default || mod.app || mod;
        } catch (err2: any) {
          return res.status(500).json({
            error: 'Failed to import server module',
            err1: { message: err1?.message, code: err1?.code },
            err2: { message: err2?.message, code: err2?.code }
          });
        }
      }
    }
    return appInstance(req, res);
  } catch (err: any) {
    return res.status(500).json({
      error: 'Handler Execution Exception',
      message: err?.message,
      stack: err?.stack
    });
  }
}
