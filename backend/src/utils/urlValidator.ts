import { Log } from '../logging_middleware/logger';

export class UrlValidator {
  private static readonly MAX_URL_LENGTH = 2048;
  private static readonly ALLOWED_PROTOCOLS = ['http:', 'https:'];

  /**
   * Validate URL format and accessibility
   */
  public static validateUrl(url: string): { isValid: boolean; error?: string; normalizedUrl?: string } {
    try {
      if (!url || typeof url !== 'string') {
        return { isValid: false, error: 'URL is required and must be a string' };
      }

      if (url.length > this.MAX_URL_LENGTH) {
        return { isValid: false, error: `URL cannot exceed ${this.MAX_URL_LENGTH} characters` };
      }

      // Add protocol if missing
      let normalizedUrl = url.trim();
      if (!normalizedUrl.match(/^https?:\/\//)) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      // Parse URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(normalizedUrl);
      } catch (error) {
        return { isValid: false, error: 'Invalid URL format' };
      }

      // Check protocol
      if (!this.ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
        return { isValid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
      }

      // Check for localhost or private IPs (optional security measure)
      const hostname = parsedUrl.hostname.toLowerCase();
      if (this.isPrivateOrLocalhost(hostname)) {
        return { isValid: false, error: 'URLs pointing to localhost or private networks are not allowed' };
      }

      Log('backend', 'debug', 'utils', `URL validated successfully: ${normalizedUrl}`);
      return { isValid: true, normalizedUrl };
    } catch (error) {
      Log('backend', 'error', 'utils', `URL validation error: ${error}`);
      return { isValid: false, error: 'URL validation failed' };
    }
  }

  /**
   * Check if hostname is localhost or private IP
   */
  private static isPrivateOrLocalhost(hostname: string): boolean {
    // Localhost variations
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return true;
    }

    // Private IP ranges
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./, // Link-local
    ];

    return privateRanges.some(range => range.test(hostname));
  }

  /**
   * Validate validity period in minutes
   */
  public static validateValidityMinutes(minutes?: number): { isValid: boolean; error?: string; validMinutes: number } {
    const DEFAULT_VALIDITY = 30; // 30 minutes default
    const MAX_VALIDITY = 525600; // 1 year in minutes
    const MIN_VALIDITY = 1; // 1 minute minimum

    if (minutes === undefined || minutes === null) {
      return { isValid: true, validMinutes: DEFAULT_VALIDITY };
    }

    if (!Number.isInteger(minutes) || minutes < MIN_VALIDITY) {
      return { isValid: false, error: `Validity must be at least ${MIN_VALIDITY} minute`, validMinutes: DEFAULT_VALIDITY };
    }

    if (minutes > MAX_VALIDITY) {
      return { isValid: false, error: `Validity cannot exceed ${MAX_VALIDITY} minutes (1 year)`, validMinutes: DEFAULT_VALIDITY };
    }

    Log('backend', 'debug', 'utils', `Validity period validated: ${minutes} minutes`);
    return { isValid: true, validMinutes: minutes };
  }

  /**
   * Calculate expiry date from validity minutes
   */
  public static calculateExpiryDate(validityMinutes: number): Date {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + validityMinutes * 60 * 1000);
    Log('backend', 'debug', 'utils', `Calculated expiry date: ${expiryDate.toISOString()}`);
    return expiryDate;
  }

  /**
   * Check if URL has expired
   */
  public static isExpired(expiryDate: string | Date): boolean {
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    const now = new Date();
    const expired = now > expiry;
    
    if (expired) {
      Log('backend', 'debug', 'utils', `URL has expired: ${expiry.toISOString()}`);
    }
    
    return expired;
  }
}
