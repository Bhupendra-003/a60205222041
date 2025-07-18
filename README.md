# URL Shortener Application

A full-stack URL shortener application with a robust backend microservice and a modern React frontend. This application provides URL shortening functionality with analytics, custom short codes, expiry management, and comprehensive logging.

## 🚀 Features

### Backend Features
- ✅ **URL Shortening**: Convert long URLs into short, manageable links
- ✅ **Custom Short Codes**: Support for user-defined short codes (3-20 characters)
- ✅ **Expiry Management**: Configurable validity periods (1 minute to 1 year, default: 30 minutes)
- ✅ **Analytics**: Track access count, last accessed time, and client information
- ✅ **Rate Limiting**: Prevent abuse with configurable rate limits
- ✅ **Comprehensive Logging**: Extensive logging using custom middleware
- ✅ **Error Handling**: Robust error handling with descriptive responses
- ✅ **Security**: CORS, Helmet, input validation, and SQL injection protection
- ✅ **Database**: SQLite with automatic schema creation
- ✅ **TypeScript**: Full TypeScript implementation for type safety

## 📁 Project Structure

```
a60205222041/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # TypeScript interfaces
│   │   ├── routes/         # Route definitions
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   ├── app.ts         # Express app setup
│   │   └── index.ts       # Entry point
│   ├── data/              # SQLite database
│   ├── dist/              # Compiled JavaScript
│   └── README.md          # Backend documentation
├── logging_middleware/    # Shared logging middleware
└── README.md             # This file
```

## 🛠️ Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Start the server:**
   ```bash
   # Development mode (with hot reload)
   npm run dev
   
   # Production mode
   npm start
   ```

The backend server will start on `http://localhost:3000`

## 🔗 API Endpoints

### Base URL: `http://localhost:3000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shorten` | Create a shortened URL |
| GET | `/:shortCode` | Redirect to original URL |
| GET | `/api/stats/:shortCode` | Get URL statistics |
| GET | `/health` | Health check |

## 🧪 Testing with Postman

### Postman Collection Setup

1. **Create a new collection** in Postman named "URL Shortener API"
2. **Set collection variables:**
   - `baseUrl`: `http://localhost:3000`
   - `shortCode`: (will be set dynamically from responses)

### Test Requests

#### 1. Health Check
**GET** `{{baseUrl}}/health`

**Expected Response (200):**
```json
{
  "success": true,
  "message": "URL Shortener service is healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

#### 2. Create Short URL - Basic
**POST** `{{baseUrl}}/api/shorten`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "url": "https://www.google.com"
}
```

**Tests Script (add to Tests tab):**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has shortCode", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('shortCode');
    pm.collectionVariables.set("shortCode", jsonData.shortCode);
});
```

#### 3. Create Short URL - With Custom Code
**POST** `{{baseUrl}}/api/shorten`

**Body (raw JSON):**
```json
{
  "url": "https://www.github.com",
  "customCode": "github"
}
```

#### 4. Create Short URL - With Validity
**POST** `{{baseUrl}}/api/shorten`

**Body (raw JSON):**
```json
{
  "url": "https://www.stackoverflow.com",
  "validityMinutes": 60
}
```

#### 5. Create Short URL - Complete Example
**POST** `{{baseUrl}}/api/shorten`

**Body (raw JSON):**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "customCode": "rickroll",
  "validityMinutes": 120
}
```

#### 6. Get URL Statistics
**GET** `{{baseUrl}}/api/stats/{{shortCode}}`

**Expected Response (200):**
```json
{
  "success": true,
  "shortCode": "abc123",
  "originalUrl": "https://www.google.com",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "expiresAt": "2024-01-01T12:30:00.000Z",
  "accessCount": 0,
  "lastAccessed": null,
  "isActive": true
}
```

#### 7. Redirect Test
**GET** `{{baseUrl}}/{{shortCode}}`

**Note:** This will redirect (302) to the original URL. In Postman, you can:
- Turn off "Automatically follow redirects" in Settings to see the 302 response
- Or leave it on to follow the redirect and see the final destination

#### 8. Error Testing - Invalid URL
**POST** `{{baseUrl}}/api/shorten`

**Body (raw JSON):**
```json
{
  "url": "not-a-valid-url"
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid URL format"
}
```

#### 9. Error Testing - Missing URL
**POST** `{{baseUrl}}/api/shorten`

**Body (raw JSON):**
```json
{
  "customCode": "test"
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "URL is required"
}
```

#### 10. Error Testing - Non-existent Short Code
**GET** `{{baseUrl}}/api/stats/nonexistent`

**Expected Response (404):**
```json
{
  "success": false,
  "error": "STATS_RETRIEVAL_FAILED",
  "message": "Short URL not found"
}
```

### Rate Limiting Tests

#### 11. Rate Limit Test - URL Creation
Create 11 consecutive requests to test the rate limit (10 requests per 5 minutes):

**POST** `{{baseUrl}}/api/shorten`

**Body (raw JSON):**
```json
{
  "url": "https://www.example{{$randomInt}}.com"
}
```

**Expected:** The 11th request should return 429 Too Many Requests

### Postman Environment Variables

Create an environment with these variables:
- `baseUrl`: `http://localhost:3000`
- `testUrl`: `https://www.example.com`
- `customCode`: `test123`
- `validityMinutes`: `60`

### 📥 Import Postman Collection

A ready-to-use Postman collection is available in the repository:

**File:** `URL_Shortener_Postman_Collection.json`

**To import:**
1. Open Postman
2. Click "Import" button
3. Select the `URL_Shortener_Postman_Collection.json` file
4. The collection will be imported with all test requests and scripts

**Features of the collection:**
- ✅ Pre-configured requests for all endpoints
- ✅ Automatic variable extraction (shortCode from responses)
- ✅ Built-in test scripts for response validation
- ✅ Error handling test cases
- ✅ Rate limiting test scenarios
- ✅ Environment variables setup

### 🔄 Quick Test Sequence

Run these requests in order for a complete test:

1. **Health Check** - Verify service is running
2. **Create Short URL - Basic** - Creates a short URL and saves shortCode
3. **Get URL Statistics** - Uses the saved shortCode
4. **Redirect to Original URL** - Tests the redirect functionality
5. **Error Tests** - Validate error handling

### cURL Commands (Alternative to Postman)

```bash
# Health check
curl http://localhost:3000/health

# Create short URL
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Create with custom code
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com", "customCode": "github"}'

# Get statistics (replace 'abc123' with actual shortCode)
curl http://localhost:3000/api/stats/abc123

# Test redirect (replace 'abc123' with actual shortCode)
curl -L http://localhost:3000/abc123
```

## 📊 Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **URL Creation**: 10 requests per 5 minutes per IP
- **Health Check**: No rate limiting

## 🔒 Security Features

- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Protection against abuse and DDoS
- **CORS**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for security headers
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `BASE_URL` | `http://localhost:3000` | Base URL for short links |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001` | CORS allowed origins |

## 🗄️ Database

The application uses SQLite for data storage with automatic schema creation:

- **urls table**: Stores URL mappings, metadata, and analytics
- **analytics table**: Detailed access logs with IP and user agent tracking

## 📋 Development Scripts

### Backend
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
npm run clean    # Clean build directory
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Bhupendra Singh Rajput**

---

For detailed backend API documentation, see [backend/README.md](./backend/README.md)
