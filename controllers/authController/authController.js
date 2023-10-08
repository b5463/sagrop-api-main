/**
 * @file authController.js
 * @description This file provides functions for JWT token generation, user authentication,
 *              and authorization using advanced approaches.
 * 
 * @version 1.0
 * @license Copyright © 2023 Acronym Web Design.
 *           All rights reserved. Unauthorized copying or reproduction of this file
 *           or its contents is prohibited. This file is proprietary and confidential.
 *           It may not be disclosed, copied, reproduced, or used without express
 *           written permission from Acronym Web Design.
 * @author Acronym Web Design | AjM
 */

const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { logData } = require('../../logging/logger'); // Use logData for info logging
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

class AuthController {
  constructor() {
    this.loadSecret();
    this.jwtOptions = { expiresIn: '1h' };
  }

  /**
   * Load JWT secret key securely from environment variables.
   * @private
   */
  loadSecret() {
    this.secret = process.env.JWT_SECRET;
    if (!this.secret) {
      throw new Error('JWT secret not configured');
    }
  }

  /**
   * Generates a JWT token for a user.
   *
   * @param {Object} user - The user object to generate the token for.
   * @param {boolean} isAdmin - Flag indicating if the user has admin permissions.
   * @returns {string} - The generated JWT token.
   * @throws {Error} - If there's an error generating the JWT token.
   */
  generateToken(user, isAdmin) {
    try {
      const payload = { id: user.id, isAdmin };
      return jwt.sign(payload, this.secret, this.jwtOptions);
    } catch (error) {
      this._logError('generateToken', 'Error generating JWT token', error);
      throw new Error('Error generating JWT token');
    }
  }

  /**
   * Compares a password with its hashed version.
   *
   * @param {string} password - The plain text password to compare.
   * @param {string} hashedPassword - The hashed password stored in the database.
   * @returns {boolean} - True if the password matches the hashed version, otherwise false.
   * @throws {Error} - If there's an error comparing the passwords.
   */
  async comparePasswords(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      this._logError('comparePasswords', 'Error comparing passwords', error);
      throw new Error('Error comparing passwords');
    }
  }

  // Private method to handle error logging
  _logError(funcName, message, error) {
    const fileName = 'authController.js';
    logData(fileName, `[${funcName}] ${message}: ${error.message}`, 'error');
  }

  // Private method to handle info logging
  _logInfo(funcName, message) {
    const fileName = 'authController.js';
    logData(fileName, `[${funcName}] ${message}`, 'info');
  }

  // Custom algorithm to handle authentication and authorization
  async authenticateAndAuthorize(req, res, next) {
    const token = req.header('Authorization');

    try {
      if (!token) {
        this._logInfo('authenticateAndAuthorize', 'Authorization token missing');
        return res.status(401).json({ message: 'Authorization token missing' });
      }

      const decodedToken = jwt.verify(token, this.secret);
      req.user = { id: decodedToken.id, isAdmin: decodedToken.isAdmin };
      this._logInfo('authenticateAndAuthorize', 'User authenticated and authorized');
      next();
    } catch (error) {
      this._logError('authenticateAndAuthorize', `Invalid token: ${token}`, error);
      console.error('Error occurred during authentication:', error);
      res.status(401).json({ message: 'Invalid token' });
    }
  }
}

// Create an instance of AuthController
const authController = new AuthController();

module.exports = {
  /**
   * Generates a JWT token for a user.
   *
   * @param {Object} user - The user object to generate the token for.
   * @param {boolean} isAdmin - Flag indicating if the user has admin permissions.
   * @returns {string} - The generated JWT token.
   * @throws {Error} - If there's an error generating the JWT token.
   */
  generateToken: authController.generateToken.bind(authController),

  /**
   * Compares a password with its hashed version.
   *
   * @param {string} password - The plain text password to compare.
   * @param {string} hashedPassword - The hashed password stored in the database.
   * @returns {boolean} - True if the password matches the hashed version, otherwise false.
   * @throws {Error} - If there's an error comparing the passwords.
   */
  comparePasswords: authController.comparePasswords.bind(authController),

  /**
   * Middleware to authenticate and authorize users using JWT.
   *
   * @param {express.Request} req - The Express request object.
   * @param {express.Response} res - The Express response object.
   * @param {Function} next - The next middleware function.
   * @returns {void}
   */
  authenticateAndAuthorize: authController.authenticateAndAuthorize.bind(authController),
};