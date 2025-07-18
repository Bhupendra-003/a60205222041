import { nanoid } from 'nanoid';
import { Log } from '../logging_middleware/logger';

export class ShortCodeGenerator {
  private static readonly ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  private static readonly DEFAULT_LENGTH = 6;
  private static readonly MAX_LENGTH = 20;
  private static readonly MIN_LENGTH = 3;

  /**
   * Generate a random short code
   */
  public static generateRandomCode(length: number = this.DEFAULT_LENGTH): string {
    try {
      const code = nanoid(length);
      Log('backend', 'debug', 'utils', `Generated random short code: ${code}`);
      return code;
    } catch (error) {
      Log('backend', 'error', 'utils', `Failed to generate random code: ${error}`);
      throw new Error('Failed to generate short code');
    }
  }

  /**
   * Validate custom short code
   */
  public static validateCustomCode(code: string): { isValid: boolean; error?: string } {
    if (!code) {
      return { isValid: false, error: 'Short code cannot be empty' };
    }

    if (code.length < this.MIN_LENGTH) {
      return { isValid: false, error: `Short code must be at least ${this.MIN_LENGTH} characters long` };
    }

    if (code.length > this.MAX_LENGTH) {
      return { isValid: false, error: `Short code cannot exceed ${this.MAX_LENGTH} characters` };
    }

    // Check if code contains only alphanumeric characters
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(code)) {
      return { isValid: false, error: 'Short code can only contain alphanumeric characters' };
    }

    // Check for reserved words
    const reservedWords = ['api', 'admin', 'www', 'app', 'stats', 'analytics', 'health'];
    if (reservedWords.includes(code.toLowerCase())) {
      return { isValid: false, error: 'Short code cannot be a reserved word' };
    }

    Log('backend', 'debug', 'utils', `Custom short code validated: ${code}`);
    return { isValid: true };
  }

  /**
   * Generate a unique short code with retry mechanism
   */
  public static async generateUniqueCode(
    checkUniqueness: (code: string) => Promise<boolean>,
    customCode?: string,
    maxRetries: number = 10
  ): Promise<string> {
    try {
      // If custom code is provided, validate and check uniqueness
      if (customCode) {
        const validation = this.validateCustomCode(customCode);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        const isUnique = await checkUniqueness(customCode);
        if (!isUnique) {
          throw new Error('Custom short code is already in use');
        }

        Log('backend', 'info', 'utils', `Using custom short code: ${customCode}`);
        return customCode;
      }

      // Generate random code with retry mechanism
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const code = this.generateRandomCode();
        const isUnique = await checkUniqueness(code);
        
        if (isUnique) {
          Log('backend', 'info', 'utils', `Generated unique short code: ${code} (attempt ${attempt})`);
          return code;
        }

        Log('backend', 'warn', 'utils', `Short code collision detected: ${code} (attempt ${attempt})`);
      }

      throw new Error('Failed to generate unique short code after maximum retries');
    } catch (error) {
      Log('backend', 'error', 'utils', `Error generating unique code: ${error}`);
      throw error;
    }
  }
}
