/**
 * @file index.js
 * @description Contains the main configuration and setup for the Sagrop application.
 * @version 1.0
 * @license Copyright © 2023 Acronym Web Design.
 *           All rights reserved. Unauthorized copying or reproduction of this file
 *           or its contents is prohibited. This file is proprietary and confidential.
 *           It may not be disclosed, copied, reproduced, or used without express
 *           written permission from Acronym Web Design.
 * @author Acronym Web Design
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const routes = require('./routes/routes');
const { logData } = require('./logging/logger');

class Application {
  constructor() {
    this.app = express();
    this.port = process.env.API_PORT || 5402;
  }

  /**
   * Load environment variables from .env file.
   * @private
   */
  _loadEnvVariables() {
    if (!fs.existsSync(path.join(__dirname, '.env'))) {
      logData('index.js', 'The .env file is missing');
      process.exit(1);
    }
    dotenv.config();
  }

  /**
   * Apply security middleware for the application.
   * @private
   */
  _applySecurityMiddleware() {
    this.app.use(require('helmet')());
    this.app.use(require('xss-clean')());
    this.app.use(require('hpp')());
  }

  /**
   * Apply rate limiting middleware for request throttling.
   * @private
   */
  _applyRateLimiting() {
    const rateLimitWindowMs = 15 * 60 * 1000;
    const rateLimitMaxRequests = 1000;
    const rateLimiter = require('express-rate-limit')({
      windowMs: rateLimitWindowMs,
      max: rateLimitMaxRequests,
    });
    this.app.use(rateLimiter);
  }

  /**
   * Apply request slowing middleware for request throttling.
   * @private
   */
  _applyRequestSlowing() {
    const slowDownWindowMs = 5 * 60 * 1000;
    const slowDownDelayMs = 500;
    const speedLimiter = require('express-slow-down')({
      windowMs: slowDownWindowMs,
      delayAfter: 100,
      delayMs: slowDownDelayMs,
    });
    this.app.use(speedLimiter);
  }

  /**
   * Apply middleware for the application.
   * @private
   */
  _applyMiddleware() {
    this.app.use(require('cors')());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(require('compression')());
    this.app.use(require('morgan')('combined'));
  }

  /**
   * Configure error handling for the application.
   * @private
   */
  _configureErrorHandling() {
    this.app.use((err, req, res, next) => {
      logData('index.js', `Unhandled Error: ${err.stack}`);
      console.error(err.stack);
      res.status(500).json({ message: 'Server Error' });
    });
  }

  /**
   * Apply Content Security Policy middleware.
   * @private
   */
  _applyCSP() {
    this.app.use((req, res, next) => {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self'"
      );
      next();
    });
  }

  /**
   * Mount routes for the application.
   * @private
   */
  _mountRoutes() {
    this.app.use(`${process.env.API_PATH || '/api/'}v${process.env.API_VERSION.split('.')[0]}`, routes);
  }

  /**
   * Start the server and print startup information.
   * @private
   */
  _startServer() {
    this.app.listen(this.port, () => {
      this._printStartupInfo();
    });
  }

  /**
   * Print startup information to the console.
   * @private
   */
  _printStartupInfo() {
    const nameEnv = process.env.APP_NAME || 'unknown';
    const fullApiVersion = process.env.API_VERSION || 'unknown';
    const parsedApiVersion = `v${fullApiVersion.split('.')[0]}` || 'unknown';
    const nodeEnv = process.env.NODE_ENV || 'unknown';
    const apiUrl = process.env.API_ENDPOINT || `http://localhost:${this.port}`;
    const apiPath = `${process.env.API_PATH || '/api/'}${parsedApiVersion}`;

    console.clear();
    console.log(
      `\x1b[2m\x1b[37m%s\x1b[0m`,
      `   \x1b[0m\x1b[32m\x1b[1m${nameEnv}\x1b[0m (Version \x1b[32m${fullApiVersion}\x1b[0m) running in \x1b[37m\x1b[1m${nodeEnv}\x1b[0m mode\n`
    );
    console.log('   ➜  \x1b[37m%s\x1b[0m', `API URL:  \x1b[32m\x1b[1m${apiUrl}${apiPath}\x1b[0m`);
    console.log('   ➜  \x1b[37m%s\x1b[0m', `API PORT: \x1b[32m\x1b[1m${this.port}\x1b[0m`);
    console.log('   ➜  \x1b[95;1m%s\x1b[0m', 'Made with ❤ by Acronym\n');
  }

  /**
   * Write the API URL to the .fe.env file.
   * @private
   */
  _writeApiUrlToFile() {
    const feEnvFilePath = path.join(__dirname, '../.env');
    const feEnvContent = `VITE_API_ENDPOINT=${process.env.API_ENDPOINT}:${this.port}${process.env.API_PATH || '/api/'}v${process.env.API_VERSION.split('.')[0]}`;
    fs.writeFileSync(feEnvFilePath, feEnvContent);
  }

  /**
   * Handle unhandled promise rejections.
   * @private
   */
  _handleUnhandledRejections() {
    process.on('unhandledRejection', (reason, promise) => {
      logData('index.js', `Unhandled Rejection: ${reason}`);
      console.error('Unhandled Rejection:', reason);
    });
  }

  /**
   * Handle uncaught exceptions.
   * @private
   */
  _handleUncaughtExceptions() {
    process.on('uncaughtException', err => {
      logData('index.js', `Uncaught Exception: ${err}`);
      console.error('Uncaught Exception:', err);
    });
  }

  /**
   * Perform the setup and start the application.
   */
  setup() {
    this._loadEnvVariables();
    this._applySecurityMiddleware();
    this._applyRateLimiting();
    this._applyRequestSlowing();
    this._applyMiddleware();
    this._configureErrorHandling();
    this._applyCSP();
    this._mountRoutes();
    this._startServer();
    this._writeApiUrlToFile();
    this._handleUnhandledRejections();
    this._handleUncaughtExceptions();
  }
}

// Check for the existence of critical files before proceeding
const criticalFiles = [
  './routes/routes.js',
  './logging/logger.js',
  './services/commoditiesService/commoditiesService.js',
  './services/articleService/articleService.js',
  './services/emailService/emailService.js',
  './services/emailService/emailContent.html',
  './controllers/imageUploadController/imageUploadController.js',
  './controllers/configController/configController.js',
  './controllers/authController/authController.js',
  './db.js',
];
const missingCriticalFiles = criticalFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));
if (missingCriticalFiles.length > 0) {
  console.error('Critical files are missing:', missingCriticalFiles);
  process.exit(1);
}

const appInstance = new Application();
appInstance.setup();