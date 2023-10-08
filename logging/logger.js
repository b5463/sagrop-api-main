/**
 * @file logger.js
 * @description This file contains the central logging system that logs data from both the frontend
 *         and backend of the Sagrop application using the Winston library. It facilitates
 *         structured and efficient logging, both to the console during development and to a
 *         rotating log file in production.
 * @version 1.0
 * @license Copyright © 2023 Acronym Web Design.
 *           All rights reserved. Unauthorized copying or reproduction of this file
 *           or its contents is prohibited. This file is proprietary and confidential.
 *           It may not be disclosed, copied, reproduced, or used without express
 *           written permission from Acronym Web Design.
 * @author Acronym Web Design | AjM
 */

const fs = require('fs');
const path = require('path');
const expressWinston = require('express-winston');
const { createLogger, format, transports } = require('winston');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, 'logs');
    this.logFilePath = path.join(this.logDir, '.log');

    // Create the log directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir);
    }

    this.logger = this.createLogger();
  }

  /**
   * Create a Winston logger instance with file and console transports.
   * @returns {import('winston').Logger} The Winston logger instance.
   */
  createLogger() {
    const logger = createLogger({
      level: 'info', // Default log level
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
      ),
      transports: [
        new transports.File({ filename: this.logFilePath, maxsize: 1000000, maxFiles: 5 }), // Log to a file with rotation
      ],
    });

    // Add console transport for development/debugging
    if (process.env.NODE_ENV !== 'production') {
      logger.add(new transports.Console());
    }

    return logger;
  }

  /**
   * Log data to the central logging system.
   * @param {string} source - The source of the log (e.g., 'frontend' or 'backend').
   * @param {any} data - The data to be logged.
   * @param {string} [level='error'] - The log level (info, warn, error, etc.).
   * @returns {void}
   */
  logData(source, data, level = 'error') {
    const formattedSource = `[${source.toUpperCase()}]`;
    const formattedData = JSON.stringify(data);

    switch (level) {
      case 'info':
        this.logger.info(`${formattedSource} ${formattedData}`);
        break;
      case 'warn':
        this.logger.warn(`${formattedSource} ${formattedData}`);
        break;
      case 'error':
      default:
        this.logger.error(`${formattedSource} ${formattedData}`);
    }
  }

  /**
   * Clear the log file on each restart of the backend.
   * @returns {void}
   */
  clearLogFile() {
    try {
      fs.writeFileSync(this.logFilePath, '');
    } catch (error) {
      this.logger.error(`Error clearing log file: ${error.message}`);
    }
  }

  /**
   * Express middleware for logging incoming requests.
   * @returns {function} The middleware function for request logging.
   */
  requestLoggerMiddleware() {
    return expressWinston.logger({
      winstonInstance: this.logger,
      msg: 'HTTP {{req.method}} {{req.url}}',
      meta: false,
    });
  }

  /**
   * Express middleware for handling errors and logging them.
   * @returns {function} The middleware function for error logging.
   */
  errorLoggerMiddleware() {
    return expressWinston.errorLogger({
      winstonInstance: this.logger,
      msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{err.message}}',
    });
  }
}

const loggerInstance = new Logger();

/**
 * @module logger
 * @description Central logging system for the Sagrop application.
 */
module.exports = {
  /**
   * Log data to the central logging system.
   * @function
   * @param {string} source - The source of the log.
   * @param {any} data - The data to be logged.
   * @param {string} [level='error'] - The log level.
   */
  logData: loggerInstance.logData.bind(loggerInstance),

  /**
   * Clear the log file on each restart of the backend.
   * @function
   */
  clearLogFile: loggerInstance.clearLogFile.bind(loggerInstance),

  /**
   * Express middleware for logging incoming requests.
   * @function
   * @returns {function} The middleware function for request logging.
   */
  requestLoggerMiddleware: loggerInstance.requestLoggerMiddleware.bind(loggerInstance),

  /**
   * Express middleware for handling errors and logging them.
   * @function
   * @returns {function} The middleware function for error logging.
   */
  errorLoggerMiddleware: loggerInstance.errorLoggerMiddleware.bind(loggerInstance),
};