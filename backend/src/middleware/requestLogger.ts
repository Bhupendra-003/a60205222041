import { Request, Response, NextFunction } from 'express';
import { Log } from '../logging_middleware/logger';

/**
 * Custom request logging middleware using our logging system
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  // Log incoming request
  Log('backend', 'info', 'middleware', `${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`);
  
  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    // Determine log level based on status code
    let logLevel: 'info' | 'warn' | 'error' = 'info';
    if (statusCode >= 400 && statusCode < 500) {
      logLevel = 'warn';
    } else if (statusCode >= 500) {
      logLevel = 'error';
    }

    Log('backend', logLevel, 'middleware',
      `${method} ${url} - ${statusCode} - ${duration}ms - IP: ${ip}`);
  });
  
  next();
};

/**
 * Security headers middleware with logging
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  Log('backend', 'debug', 'middleware', 'Security headers applied');
  next();
};
