import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import urlRoutes from './routes/urlRoutes';
import { requestLogger, securityHeaders } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/validation';
import { Database } from './config/database';
import { Log } from './logging_middleware/logger';

export class App {
  public app: express.Application;
  private db: Database;

  constructor() {
    this.app = express();
    this.db = Database.getInstance();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.logAppInitialization();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP for API
      crossOriginEmbedderPolicy: false
    }));
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);

    // Custom middleware
    this.app.use(securityHeaders);
    this.app.use(requestLogger);

    Log('backend', 'info', 'config', 'Middlewares initialized successfully');
  }

  private initializeRoutes(): void {
    // Health check route (before other routes)
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'URL Shortener service is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // Main routes
    this.app.use('/', urlRoutes);

    Log('backend', 'info', 'config', 'Routes initialized successfully');
  }

  private initializeErrorHandling(): void {
    // 404 handler (must be after all routes)
    this.app.use(notFoundHandler);

    // Global error handler (must be last)
    this.app.use(errorHandler);

    Log('backend', 'info', 'config', 'Error handling initialized successfully');
  }

  private logAppInitialization(): void {
    Log('backend', 'info', 'config', 'URL Shortener application initialized successfully');
    Log('backend', 'info', 'config', `Environment: ${process.env.NODE_ENV || 'development'}`);
    Log('backend', 'info', 'config', `Base URL: ${process.env.BASE_URL || 'http://localhost:3000'}`);
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      Log('backend', 'info', 'config', `Server is running on port ${port}`);
      Log('backend', 'info', 'config', `API endpoints available at http://localhost:${port}/api`);
      console.log(`🚀 URL Shortener service is running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`📝 API Documentation: http://localhost:${port}/api/health`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }

  public async shutdown(): Promise<void> {
    try {
      await this.db.close();
      Log('backend', 'info', 'config', 'Application shutdown completed');
    } catch (error) {
      Log('backend', 'error', 'config', `Error during shutdown: ${error}`);
    }
  }
}
