import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { Log } from '../logging_middleware/logger';
import { ErrorResponse } from '../models/Url';

/**
 * Rate limiter configuration
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later.'
  } as ErrorResponse,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    Log('backend', 'warn', 'middleware', `Rate limit exceeded for IP: ${req.ip}`);
    
    const errorResponse: ErrorResponse = {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    };
    
    res.status(429).json(errorResponse);
  },
  skip: (req: Request) => {
    // Skip rate limiting for health check
    return req.path === '/api/health';
  }
});

/**
 * Stricter rate limiter for URL creation
 */
export const createUrlRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 URL creations per 5 minutes
  message: {
    success: false,
    error: 'CREATE_RATE_LIMIT_EXCEEDED',
    message: 'Too many URL creation requests from this IP, please try again later.'
  } as ErrorResponse,
  handler: (req: Request, res: Response) => {
    Log('backend', 'warn', 'middleware', `URL creation rate limit exceeded for IP: ${req.ip}`);
    
    const errorResponse: ErrorResponse = {
      success: false,
      error: 'CREATE_RATE_LIMIT_EXCEEDED',
      message: 'Too many URL creation requests from this IP, please try again later.'
    };
    
    res.status(429).json(errorResponse);
  }
});
