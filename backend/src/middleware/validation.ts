import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { Log } from '../logging_middleware/logger';
import { ErrorResponse } from '../models/Url';

/**
 * Validation rules for creating a short URL
 */
export const validateCreateUrlRequest = [
  body('url')
    .notEmpty()
    .withMessage('URL is required')
    .isLength({ max: 2048 })
    .withMessage('URL cannot exceed 2048 characters')
    .custom((value) => {
      // Basic URL format validation
      try {
        const url = value.startsWith('http') ? value : `https://${value}`;
        new URL(url);
        return true;
      } catch {
        throw new Error('Invalid URL format');
      }
    }),
  
  body('shortcode')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Shortcode must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Shortcode can only contain alphanumeric characters')
    .custom((value) => {
      const reservedWords = ['api', 'admin', 'www', 'app', 'stats', 'analytics', 'health', 'shorturls'];
      if (reservedWords.includes(value.toLowerCase())) {
        throw new Error('Shortcode cannot be a reserved word');
      }
      return true;
    }),

  body('validity')
    .optional()
    .isInt({ min: 1, max: 525600 })
    .withMessage('Validity must be between 1 and 525600 minutes (1 year)'),

  // Middleware to handle validation errors
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg).join(', ');
      
      Log('backend', 'warn', 'middleware', `Validation failed: ${errorMessages}`);
      
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'VALIDATION_ERROR',
        message: errorMessages
      };
      
      res.status(400).json(errorResponse);
      return;
    }
    
    next();
  }
];

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  Log('backend', 'error', 'middleware', `Unhandled error: ${error.message}`);
  Log('backend', 'error', 'middleware', `Stack trace: ${error.stack}`);
  
  const errorResponse: ErrorResponse = {
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  };
  
  res.status(500).json(errorResponse);
};

/**
 * 404 handler middleware
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  Log('backend', 'warn', 'middleware', `404 - Route not found: ${req.method} ${req.path}`);
  
  const errorResponse: ErrorResponse = {
    success: false,
    error: 'NOT_FOUND',
    message: 'Route not found'
  };
  
  res.status(404).json(errorResponse);
};
