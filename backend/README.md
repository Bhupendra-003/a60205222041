# URL Shortener Microservice

A robust HTTP URL Shortener Microservice that provides core URL shortening functionality along with basic analytical capabilities for the shortened links.

## Features

- ✅ **URL Shortening**: Convert long URLs into short, manageable links
- ✅ **Custom Short Codes**: Support for user-defined short codes
- ✅ **Expiry Management**: Configurable validity periods (default: 30 minutes)
- ✅ **Analytics**: Track access count and last accessed time
- ✅ **Rate Limiting**: Prevent abuse with configurable rate limits
- ✅ **Comprehensive Logging**: Extensive logging using custom middleware
- ✅ **Error Handling**: Robust error handling with descriptive responses
- ✅ **Security**: CORS, Helmet, and input validation

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file (optional):
```bash
cp .env.example .env
```

4. Build the project:
```bash
npm run build
```

5. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### 1. Create Short URL

**POST** `/api/shorten`

Create a shortened URL with optional custom code and validity period.

#### Request Body

```json
{
  "url": "https://example.com/very/long/url",
  "customCode": "mycode",  // Optional: 3-20 alphanumeric characters
  "validityMinutes": 60    // Optional: 1-525600 minutes (default: 30)
}
```

#### Response

**Success (201):**
```json
{
  "success": true,
  "shortUrl": "http://localhost:3000/abc123",
  "originalUrl": "https://example.com/very/long/url",
  "shortCode": "abc123",
  "expiresAt": "2024-01-01T12:30:00.000Z"
}
```

**Error (400/409/500):**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "URL is required"
}
```

### 2. Redirect to Original URL

**GET** `/:shortCode`

Redirect to the original URL using the short code.

#### Response

**Success (302):** Redirects to original URL

**Error (404/410/500):**
```json
{
  "success": false,
  "error": "REDIRECT_FAILED",
  "message": "Short URL not found"
}
```

### 3. Get URL Statistics

**GET** `/api/stats/:shortCode`

Retrieve analytics and information about a shortened URL.

#### Response

**Success (200):**
```json
{
  "success": true,
  "shortCode": "abc123",
  "originalUrl": "https://example.com/very/long/url",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "expiresAt": "2024-01-01T12:30:00.000Z",
  "accessCount": 5,
  "lastAccessed": "2024-01-01T12:15:00.000Z",
  "isActive": true
}
```

**Error (404/500):**
```json
{
  "success": false,
  "error": "STATS_RETRIEVAL_FAILED",
  "message": "Short URL not found"
}
```

### 4. Health Check

**GET** `/api/health` or `/health`

Check service health status.

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "URL Shortener service is healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **URL Creation**: 10 requests per 5 minutes per IP
- **Health Check**: No rate limiting

## Error Codes

| Code | Description |
|------|-------------|
| `MISSING_URL` | URL parameter is required |
| `VALIDATION_ERROR` | Input validation failed |
| `SHORTENING_FAILED` | Failed to create short URL |
| `MISSING_SHORT_CODE` | Short code parameter is required |
| `REDIRECT_FAILED` | Failed to redirect (not found/expired) |
| `STATS_RETRIEVAL_FAILED` | Failed to retrieve statistics |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `CREATE_RATE_LIMIT_EXCEEDED` | Too many URL creation requests |
| `NOT_FOUND` | Route not found |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `BASE_URL` | `http://localhost:3000` | Base URL for short links |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001` | CORS allowed origins |

### Database

The service uses SQLite for data storage. The database file is automatically created at `backend/data/urls.db`.

#### Schema

**urls table:**
- `id`: Primary key
- `original_url`: The original long URL
- `short_code`: Unique short code
- `created_at`: Creation timestamp
- `expires_at`: Expiry timestamp
- `is_active`: Active status
- `access_count`: Number of times accessed
- `last_accessed`: Last access timestamp

**analytics table:**
- `id`: Primary key
- `short_code`: Reference to short code
- `accessed_at`: Access timestamp
- `ip_address`: Client IP address
- `user_agent`: Client user agent

## Logging

The service uses a custom logging middleware that sends logs to the evaluation server. All operations are extensively logged with appropriate log levels:

- `debug`: Detailed debugging information
- `info`: General information about operations
- `warn`: Warning conditions (validation failures, rate limits)
- `error`: Error conditions that don't stop the service
- `fatal`: Critical errors that may stop the service

## Security Features

- **Input Validation**: Comprehensive validation of all inputs
- **Rate Limiting**: Protection against abuse
- **CORS**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for security headers
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## Development

### Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
npm run clean    # Clean build directory
```

### Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # TypeScript interfaces
│   ├── routes/          # Route definitions
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.ts          # Express app setup
│   └── index.ts        # Entry point
├── data/               # SQLite database
├── dist/               # Compiled JavaScript
└── package.json
```

## Testing

To test the API endpoints, you can use curl or any HTTP client:

```bash
# Create a short URL
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Access the short URL (replace abc123 with actual code)
curl -L http://localhost:3000/abc123

# Get statistics
curl http://localhost:3000/api/stats/abc123

# Health check
curl http://localhost:3000/health
```
