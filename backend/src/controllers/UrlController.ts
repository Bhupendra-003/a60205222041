import { Request, Response } from 'express';
import { UrlService } from '../services/UrlService';
import { CreateUrlRequest, ErrorResponse } from '../models/Url';
import { Log } from '../logging_middleware/logger';

export class UrlController {
  private urlService: UrlService;

  constructor() {
    this.urlService = new UrlService();
  }

  /**
   * Create a shortened URL
   * POST /shorturls
   */
  public createShortUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      Log('backend', 'info', 'controller', `Received URL shortening request from ${req.ip}`);

      const { url, shortcode, validity }: CreateUrlRequest = req.body;

      if (!url) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: 'MISSING_URL',
          message: 'URL is required'
        };
        Log('backend', 'warn', 'controller', 'URL shortening request missing URL parameter');
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.urlService.createShortUrl({
        url,
        shortcode,
        validity
      });

      Log('backend', 'info', 'controller', `URL shortened successfully`);
      res.status(201).json(result);
    } catch (error) {
      Log('backend', 'error', 'controller', `URL shortening failed: ${error}`);
      
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'SHORTENING_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create short URL'
      };

      // Determine appropriate status code based on error type
      let statusCode = 500;
      if (error instanceof Error) {
        if (error.message.includes('already in use') || error.message.includes('collision')) {
          statusCode = 409; // Conflict
        } else if (error.message.includes('Invalid') || error.message.includes('must be')) {
          statusCode = 400; // Bad Request
        }
      }

      res.status(statusCode).json(errorResponse);
    }
  };

  /**
   * Redirect to original URL
   * GET /:shortCode
   */
  public redirectToOriginalUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortCode } = req.params;
      
      Log('backend', 'info', 'controller', `Redirect request for short code: ${shortCode}`);

      if (!shortCode) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: 'MISSING_SHORT_CODE',
          message: 'Short code is required'
        };
        res.status(400).json(errorResponse);
        return;
      }

      const clientInfo = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referer') || req.get('Referrer')
      };

      const originalUrl = await this.urlService.getOriginalUrl(shortCode, clientInfo);
      
      Log('backend', 'info', 'controller', `Redirecting ${shortCode} to ${originalUrl}`);
      res.redirect(302, originalUrl);
    } catch (error) {
      Log('backend', 'error', 'controller', `Redirect failed for ${req.params.shortCode}: ${error}`);
      
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'REDIRECT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to redirect'
      };

      // Determine appropriate status code
      let statusCode = 500;
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          statusCode = 404;
        } else if (error.message.includes('expired') || error.message.includes('inactive')) {
          statusCode = 410; // Gone
        }
      }

      res.status(statusCode).json(errorResponse);
    }
  };

  /**
   * Get URL statistics
   * GET /shorturls/:shortCode
   */
  public getUrlStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortCode } = req.params;
      
      Log('backend', 'info', 'controller', `Stats request for short code: ${shortCode}`);

      if (!shortCode) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: 'MISSING_SHORT_CODE',
          message: 'Short code is required'
        };
        res.status(400).json(errorResponse);
        return;
      }

      const stats = await this.urlService.getUrlStats(shortCode);
      
      Log('backend', 'info', 'controller', `Stats retrieved for ${shortCode}`);
      res.status(200).json(stats);
    } catch (error) {
      Log('backend', 'error', 'controller', `Stats retrieval failed for ${req.params.shortCode}: ${error}`);
      
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'STATS_RETRIEVAL_FAILED',
        message: error instanceof Error ? error.message : 'Failed to retrieve statistics'
      };

      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json(errorResponse);
    }
  };

  /**
   * Health check endpoint
   * GET /api/health
   */
  public healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      Log('backend', 'debug', 'controller', 'Health check requested');
      
      res.status(200).json({
        success: true,
        message: 'URL Shortener service is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      Log('backend', 'error', 'controller', `Health check failed: ${error}`);
      
      res.status(500).json({
        success: false,
        error: 'HEALTH_CHECK_FAILED',
        message: 'Service is unhealthy'
      });
    }
  };
}
