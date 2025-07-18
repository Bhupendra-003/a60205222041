import { Log } from '../logging_middleware/logger';

export class GeoLocationService {
  /**
   * Get coarse-grained geographical location from IP address
   * For this implementation, we'll use a simple IP-to-location mapping
   * In production, you would use a service like MaxMind GeoIP or similar
   */
  public static getLocationFromIP(ipAddress: string): string {
    try {
      // Remove any IPv6 prefix or port numbers
      const cleanIP = ipAddress.replace(/^::ffff:/, '').split(':')[0];
      
      // Handle localhost and private IPs
      if (this.isLocalOrPrivateIP(cleanIP)) {
        return 'Local/Private Network';
      }
      
      // For demo purposes, we'll return a mock location based on IP patterns
      // In production, integrate with a real GeoIP service
      const location = this.getMockLocationFromIP(cleanIP);
      
      Log('backend', 'debug', 'utils', `IP ${cleanIP} mapped to location: ${location}`);
      return location;
    } catch (error) {
      Log('backend', 'warn', 'utils', `Failed to get location for IP ${ipAddress}: ${error}`);
      return 'Unknown';
    }
  }

  /**
   * Check if IP is localhost or private network
   */
  private static isLocalOrPrivateIP(ip: string): boolean {
    if (!ip || ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') {
      return true;
    }

    // Check private IP ranges
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./, // Link-local
    ];

    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Mock location mapping for demonstration
   * In production, replace with actual GeoIP service
   */
  private static getMockLocationFromIP(ip: string): string {
    // Simple mock mapping based on IP patterns
    const ipParts = ip.split('.').map(Number);
    
    if (ipParts.length !== 4) {
      return 'Unknown';
    }

    const firstOctet = ipParts[0];
    const secondOctet = ipParts[1];

    // Mock geographical mapping based on IP ranges
    if (firstOctet >= 1 && firstOctet <= 50) {
      return 'North America';
    } else if (firstOctet >= 51 && firstOctet <= 100) {
      return 'Europe';
    } else if (firstOctet >= 101 && firstOctet <= 150) {
      return 'Asia';
    } else if (firstOctet >= 151 && firstOctet <= 200) {
      return 'South America';
    } else if (firstOctet >= 201 && firstOctet <= 230) {
      return 'Africa';
    } else {
      return 'Oceania';
    }
  }

  /**
   * Get more specific location if available
   * This could be enhanced to return city/country information
   */
  public static getDetailedLocation(ipAddress: string): { country: string; region: string; city: string } {
    const baseLocation = this.getLocationFromIP(ipAddress);
    
    // Mock detailed location for demonstration
    return {
      country: baseLocation,
      region: 'Unknown Region',
      city: 'Unknown City'
    };
  }
}
