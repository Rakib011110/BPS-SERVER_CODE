// middleware/ipnLogger.ts
import { Request, Response, NextFunction } from 'express';

export const ipnLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔥 IPN MIDDLEWARE - Incoming Request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    headers: {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip']
    },
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Log the raw body for debugging
  if (req.body) {
    console.log('🔍 Raw Request Body:', JSON.stringify(req.body, null, 2));
  }

  next();
};

export default ipnLogger;
