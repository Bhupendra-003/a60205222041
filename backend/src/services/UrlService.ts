import { Database } from '../config/database';
import { Url, UrlAnalytics, CreateUrlRequest, CreateUrlResponse, UrlStatsResponse, ClickData } from '../models/Url';
import { ShortCodeGenerator } from '../utils/shortCodeGenerator';
import { UrlValidator } from '../utils/urlValidator';
import { GeoLocationService } from '../utils/geoLocation';
import { Log } from '../logging_middleware/logger';

export class UrlService {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Create a shortened URL
   */
  public async createShortUrl(request: CreateUrlRequest): Promise<CreateUrlResponse> {
    try {
      Log('backend', 'info', 'service', `Creating short URL for: ${request.url}`);

      // Validate URL
      const urlValidation = UrlValidator.validateUrl(request.url);
      if (!urlValidation.isValid) {
        throw new Error(urlValidation.error);
      }

      // Validate validity period
      const validityValidation = UrlValidator.validateValidityMinutes(request.validity);
      if (!validityValidation.isValid) {
        throw new Error(validityValidation.error);
      }

      // Generate unique short code
      const shortCode = await ShortCodeGenerator.generateUniqueCode(
        this.checkShortCodeUniqueness.bind(this),
        request.shortcode
      );

      // Calculate expiry date
      const expiryDate = UrlValidator.calculateExpiryDate(validityValidation.validMinutes);

      // Save to database
      const url: Url = {
        original_url: urlValidation.normalizedUrl!,
        short_code: shortCode,
        expires_at: expiryDate.toISOString(),
        is_active: true,
        access_count: 0
      };

      await this.saveUrl(url);

      Log('backend', 'info', 'service', `Short URL created successfully: ${shortCode}`);

      return {
        shortLink: `${process.env.BASE_URL || 'http://localhost:3000'}/${shortCode}`,
        expiry: expiryDate.toISOString()
      };
    } catch (error) {
      Log('backend', 'error', 'service', `Failed to create short URL: ${error}`);
      throw error;
    }
  }

  /**
   * Get original URL by short code and handle redirection
   */
  public async getOriginalUrl(shortCode: string, clientInfo?: { ip?: string; userAgent?: string; referrer?: string }): Promise<string> {
    try {
      Log('backend', 'info', 'service', `Retrieving original URL for: ${shortCode}`);

      const url = await this.getUrlByShortCode(shortCode);
      if (!url) {
        throw new Error('Short URL not found');
      }

      if (!url.is_active) {
        throw new Error('Short URL is inactive');
      }

      if (UrlValidator.isExpired(url.expires_at)) {
        // Mark as inactive
        await this.deactivateUrl(shortCode);
        throw new Error('Short URL has expired');
      }

      // Record analytics
      await this.recordAccess(shortCode, clientInfo);

      // Update access count and last accessed time
      await this.updateAccessInfo(shortCode);

      Log('backend', 'info', 'service', `URL accessed successfully: ${shortCode} -> ${url.original_url}`);
      return url.original_url;
    } catch (error) {
      Log('backend', 'error', 'service', `Failed to retrieve URL for ${shortCode}: ${error}`);
      throw error;
    }
  }

  /**
   * Get URL statistics with detailed click data
   */
  public async getUrlStats(shortCode: string): Promise<UrlStatsResponse> {
    try {
      Log('backend', 'info', 'service', `Retrieving stats for: ${shortCode}`);

      const url = await this.getUrlByShortCode(shortCode);
      if (!url) {
        throw new Error('Short URL not found');
      }

      // Get detailed click data
      const clickData = await this.getClickData(shortCode);

      return {
        shortCode: url.short_code,
        originalUrl: url.original_url,
        createdAt: url.created_at!,
        expiresAt: url.expires_at,
        totalClicks: url.access_count || 0,
        clickData: clickData
      };
    } catch (error) {
      Log('backend', 'error', 'service', `Failed to retrieve stats for ${shortCode}: ${error}`);
      throw error;
    }
  }

  /**
   * Check if short code is unique
   */
  private async checkShortCodeUniqueness(shortCode: string): Promise<boolean> {
    try {
      const existing = await this.db.get(
        'SELECT short_code FROM urls WHERE short_code = ?',
        [shortCode]
      );
      return !existing;
    } catch (error) {
      Log('backend', 'error', 'service', `Error checking uniqueness for ${shortCode}: ${error}`);
      throw error;
    }
  }

  /**
   * Save URL to database
   */
  private async saveUrl(url: Url): Promise<void> {
    try {
      await this.db.run(
        `INSERT INTO urls (original_url, short_code, expires_at, is_active, access_count) 
         VALUES (?, ?, ?, ?, ?)`,
        [url.original_url, url.short_code, url.expires_at, url.is_active, url.access_count]
      );
    } catch (error) {
      Log('backend', 'error', 'service', `Failed to save URL: ${error}`);
      throw error;
    }
  }

  /**
   * Get URL by short code
   */
  private async getUrlByShortCode(shortCode: string): Promise<Url | null> {
    try {
      return await this.db.get(
        'SELECT * FROM urls WHERE short_code = ?',
        [shortCode]
      );
    } catch (error) {
      Log('backend', 'error', 'service', `Failed to get URL by short code: ${error}`);
      throw error;
    }
  }

  /**
   * Record URL access for analytics
   */
  private async recordAccess(shortCode: string, clientInfo?: { ip?: string; userAgent?: string; referrer?: string }): Promise<void> {
    try {
      const location = GeoLocationService.getLocationFromIP(clientInfo?.ip || '');

      await this.db.run(
        `INSERT INTO analytics (short_code, ip_address, user_agent, referrer, location) VALUES (?, ?, ?, ?, ?)`,
        [
          shortCode,
          clientInfo?.ip || null,
          clientInfo?.userAgent || null,
          clientInfo?.referrer || null,
          location
        ]
      );
    } catch (error) {
      Log('backend', 'warn', 'service', `Failed to record analytics: ${error}`);
      // Don't throw error for analytics failure
    }
  }

  /**
   * Update access count and last accessed time
   */
  private async updateAccessInfo(shortCode: string): Promise<void> {
    try {
      await this.db.run(
        `UPDATE urls SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP 
         WHERE short_code = ?`,
        [shortCode]
      );
    } catch (error) {
      Log('backend', 'error', 'service', `Failed to update access info: ${error}`);
      throw error;
    }
  }

  /**
   * Get detailed click data for analytics
   */
  private async getClickData(shortCode: string): Promise<ClickData[]> {
    try {
      const analytics = await this.db.all(
        `SELECT accessed_at, referrer, location, ip_address, user_agent
         FROM analytics
         WHERE short_code = ?
         ORDER BY accessed_at DESC`,
        [shortCode]
      );

      return analytics.map((record: any) => ({
        timestamp: record.accessed_at,
        referrer: record.referrer,
        location: record.location || 'Unknown',
        ipAddress: record.ip_address || 'Unknown',
        userAgent: record.user_agent || 'Unknown'
      }));
    } catch (error) {
      Log('backend', 'error', 'service', `Failed to get click data: ${error}`);
      return [];
    }
  }

  /**
   * Deactivate expired URL
   */
  private async deactivateUrl(shortCode: string): Promise<void> {
    try {
      await this.db.run(
        'UPDATE urls SET is_active = 0 WHERE short_code = ?',
        [shortCode]
      );
      Log('backend', 'info', 'service', `URL deactivated: ${shortCode}`);
    } catch (error) {
      Log('backend', 'error', 'service', `Failed to deactivate URL: ${error}`);
      // Don't throw error for deactivation failure
    }
  }
}
