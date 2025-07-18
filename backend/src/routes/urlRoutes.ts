import { Router } from 'express';
import { UrlController } from '../controllers/UrlController';
import { validateCreateUrlRequest } from '../middleware/validation';
import { rateLimiter, createUrlRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const urlController = new UrlController();

// Apply rate limiting to all routes
router.use(rateLimiter);

// API routes
router.post('/shorturls', createUrlRateLimiter, validateCreateUrlRequest, urlController.createShortUrl);
router.get('/shorturls/:shortCode', urlController.getUrlStats);
router.get('/api/health', urlController.healthCheck);

// Redirect route (should be last to avoid conflicts)
router.get('/:shortCode', urlController.redirectToOriginalUrl);

export default router;
