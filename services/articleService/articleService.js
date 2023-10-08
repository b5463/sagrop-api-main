/**
 * @file articleService.js
 * @description Provides functions to interact with the articles in the database.
 * @version 1.0
 * @license Copyright © 2023 Acronym Web Design.
 *           All rights reserved. Unauthorized copying or reproduction of this file
 *           or its contents is prohibited. This file is proprietary and confidential.
 *           It may not be disclosed, copied, reproduced, or used without express
 *           written permission from Acronym Web Design.
 * @author Acronym Web Design | AjM
 */

const path = require('path');
const fsPromises = require('fs').promises;
const { body, validationResult } = require('express-validator');
const { logData } = require('../../logging/logger');
const db = require('../../db');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Logs errors that occur during service functions.
 */
class ArticleService {
  /**
   * @param {string} functionName - The name of the service function.
   * @param {Error} error - The error object.
   */
  static logServiceError(functionName, error) {
    logData('articleService.js', `Error in ${functionName}: ${error.message}`);
  }

  /**
   * Middleware to validate the request body when saving or updating an article.
   */
  static validateArticleData = [
    body('articleTitle').trim().notEmpty().withMessage('Article title is required.'),
    body('articleContent').trim().notEmpty().withMessage('Article content is required.'),
    // Add more validation rules as needed
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    },
  ];

  /**
   * Save an article to the database.
   * @param {string} articleTitle - The title of the article.
   * @param {string} articleContent - The content of the article.
   * @param {string} [articleImageUrl] - The URL of the article image (optional).
   * @param {string} [articlePublication] - The publication date of the article (optional).
   * @throws {Error} - If there's an error saving the article.
   */
  static async saveArticle(articleTitle, articleContent, articlePublication, articleImageUrl) {
    try {
      await db.saveArticle(articleTitle, articleContent, articlePublication, articleImageUrl);
    } catch (error) {
      ArticleService.logServiceError('saveArticle', error);
      throw new Error('Error saving article');
    }
  }

  /**
   * Retrieve an article by ID or the latest article if no ID is provided.
   * @param {number} [id] - The ID of the article to retrieve. If not provided, the latest article will be retrieved.
   * @returns {Promise<Object|null>} - A Promise that resolves with the article object or null if no article is found.
   * @throws {Error} - If there's an error retrieving the article.
   */
  static async getArticle(id) {
    try {
      return await db.getArticle(id);
    } catch (error) {
      ArticleService.logServiceError('getArticle', error);
      throw new Error('Error retrieving article');
    }
  }

  /**
   * Update an existing article in the database.
   * @param {number} id - The ID of the article to update.
   * @param {string} articleTitle - The updated title of the article.
   * @param {string} articleContent - The updated content of the article.
   * @param {string} [articleImageUrl] - The updated URL of the article image (optional).
   * @param {string} [articlePublication] - The updated publication date of the article (optional).
   * @throws {Error} - If there's an error updating the article.
   */
  static async updateArticle(id, articleTitle, articleContent, articlePublication, articleImageUrl) {
    try {
      await db.updateArticle(id, articleTitle, articleContent, articlePublication, articleImageUrl);
    } catch (error) {
      ArticleService.logServiceError('updateArticle', error);
      throw new Error('Error updating article');
    }
  }

  /**
   * Delete an article from the database.
   * @param {number} id - The ID of the article to delete.
   * @throws {Error} - If there's an error deleting the article.
   */
  static async deleteArticle(id) {
    try {
      await db.deleteArticle(id);
    } catch (error) {
      ArticleService.logServiceError('deleteArticle', error);
      throw new Error('Error deleting article');
    }
  }

  /**
   * Delete the image file associated with the article.
   * @param {string} imagePath - The path of the image file to be deleted.
   * @throws {Error} - If there's an error deleting the article image.
   */
  static async deleteArticleImage(imagePath) {
    try {
      await fsPromises.unlink(imagePath);
    } catch (error) {
      ArticleService.logServiceError('deleteArticleImage', error);
      throw new Error('Error deleting article image');
    }
  }
}

// Export individual methods with annotations
module.exports = {
  /**
   * Middleware to validate the request body when saving or updating an article.
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The next middleware function.
   * @throws {Error} - If validation errors are present.
   */
  validateArticleData: ArticleService.validateArticleData,

  /**
   * Save an article to the database.
   * @param {string} articleTitle - The title of the article.
   * @param {string} articleContent - The content of the article.
   * @param {string} [articleImageUrl] - The URL of the article image (optional).
   * @param {string} [articlePublication] - The publication date of the article (optional).
   * @throws {Error} - If there's an error saving the article.
   */
  saveArticle: ArticleService.saveArticle,

  /**
   * Retrieve an article by ID or the latest article if no ID is provided.
   * @param {number} [id] - The ID of the article to retrieve.
   * @returns {Promise<Object|null>} - A Promise that resolves with the article object or null if no article is found.
   * @throws {Error} - If there's an error retrieving the article.
   */
  getArticle: ArticleService.getArticle,

  /**
   * Update an existing article in the database.
   * @param {number} id - The ID of the article to update.
   * @param {string} articleTitle - The updated title of the article.
   * @param {string} articleContent - The updated content of the article.
   * @param {string} [articleImageUrl] - The updated URL of the article image (optional).
   * @param {string} [articlePublication] - The updated publication date of the article (optional).
   * @throws {Error} - If there's an error updating the article.
   */
  updateArticle: ArticleService.updateArticle,

  /**
   * Delete an article from the database.
   * @param {number} id - The ID of the article to delete.
   * @throws {Error} - If there's an error deleting the article.
   */
  deleteArticle: ArticleService.deleteArticle,

  /**
   * Delete the image file associated with the article.
   * @param {string} imagePath - The path of the image file to be deleted.
   * @throws {Error} - If there's an error deleting the article image.
   */
  deleteArticleImage: ArticleService.deleteArticleImage,
};