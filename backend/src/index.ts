import { App } from './app';
import { Log } from './logging_middleware/logger';

// Environment configuration
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Set base URL for short links
if (!process.env.BASE_URL) {
  process.env.BASE_URL = `http://localhost:${PORT}`;
}

async function startServer(): Promise<void> {
  try {
    Log('backend', 'info', 'config', 'Starting URL Shortener service...');
    Log('backend', 'info', 'config', `Environment: ${NODE_ENV}`);
    Log('backend', 'info', 'config', `Port: ${PORT}`);
    Log('backend', 'info', 'config', `Base URL: ${process.env.BASE_URL}`);

    // Create and start the application
    const app = new App();
    app.listen(PORT);

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      Log('backend', 'info', 'config', `Received ${signal}. Starting graceful shutdown...`);
      
      try {
        await app.shutdown();
        Log('backend', 'info', 'config', 'Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        Log('backend', 'error', 'config', `Error during graceful shutdown: ${error}`);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      Log('backend', 'fatal', 'config', `Uncaught Exception: ${error.message}`);
      Log('backend', 'fatal', 'config', `Stack: ${error.stack}`);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      Log('backend', 'fatal', 'config', `Unhandled Rejection at: ${promise}, reason: ${reason}`);
      process.exit(1);
    });

  } catch (error) {
    Log('backend', 'fatal', 'config', `Failed to start server: ${error}`);
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
