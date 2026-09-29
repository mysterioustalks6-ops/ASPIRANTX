import app from '../server.js';

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}

