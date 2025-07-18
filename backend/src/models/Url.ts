export interface Url {
  id?: number;
  original_url: string;
  short_code: string;
  created_at?: string;
  expires_at: string;
  is_active?: boolean;
  access_count?: number;
  last_accessed?: string | null;
}

export interface UrlAnalytics {
  id?: number;
  short_code: string;
  accessed_at?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  location?: string;
}

export interface CreateUrlRequest {
  url: string;
  shortcode?: string;
  validity?: number;
}

export interface CreateUrlResponse {
  shortLink: string;
  expiry: string;
}

export interface ClickData {
  timestamp: string;
  referrer: string | null;
  location: string;
  ipAddress: string;
  userAgent: string;
}

export interface UrlStatsResponse {
  shortCode: string;
  originalUrl: string;
  createdAt: string;
  expiresAt: string;
  totalClicks: number;
  clickData: ClickData[];
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}
