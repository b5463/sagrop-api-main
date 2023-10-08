/**
 * @file commoditiesService.js
 * @description Provides functions to interact with the commodities in the database.
 * @version 1.0
 * @license Copyright © 2023 Acronym Web Design.
 *           All rights reserved. Unauthorized copying or reproduction of this file
 *           or its contents is prohibited. This file is proprietary and confidential.
 *           It may not be disclosed, copied, reproduced, or used without express
 *           written permission from Acronym Web Design.
 * @author Acronym Web Design | AjM
 */

const path = require('path');
const { logData } = require('../../logging/logger');
const db = require('../../db');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Logs errors that occur during service functions.
 * @class
 */
class CommoditiesService {
  /**
   * @param {string} functionName - The name of the service function.
   * @param {Error} error - The error object.
   */
  static logServiceError(functionName, error) {
    logData('commoditiesService.js', `Error in ${functionName}: ${error.message}`);
  }

  /**
   * Save a commodity to the database.
   * @param {string} name - The name of the commodity.
   * @param {string} inquiry - The inquiry of the commodity.
   * @param {string} offer - The offer of the commodity.
   * @param {number} price - The price of the commodity.
   * @param {number} amount - The amount of the commodity.
   * @param {Date} date - The date of the commodity.
   * @param {string} parita - The parita of the commodity.
   * @throws {Error} - If there's an error saving the commodity.
   */
  static async saveCommodity(name, inquiry, offer, price, amount, date, parita) {
    try {
      await db.saveCommodity(name, inquiry, offer, price, amount, date, parita);
    } catch (error) {
      CommoditiesService.logServiceError('saveCommodity', error);
      throw new Error('Error saving commodity.');
    }
  }

  /**
   * Retrieve all commodities from the database.
   * @returns {Promise<Array>} - A Promise that resolves with an array of commodities or an empty array if no commodities are found.
   * @throws {Error} - If there's an error retrieving the commodities.
   */
  static async getAllCommodities() {
    try {
      return await db.getAllCommodities();
    } catch (error) {
      CommoditiesService.logServiceError('getAllCommodities', error);
      throw new Error('Error retrieving commodities.');
    }
  }

  /**
   * Update an existing commodity in the database.
   * @param {number} id - The ID of the commodity to update.
   * @param {string} name - The updated name of the commodity.
   * @param {string} inquiry - The updated inquiry of the commodity.
   * @param {string} offer - The updated offer of the commodity.
   * @param {number} price - The updated price of the commodity.
   * @param {number} amount - The updated amount of the commodity.
   * @param {Date} date - The updated date of the commodity.
   * @param {string} parita - The updated parita of the commodity.
   * @throws {Error} - If there's an error updating the commodity.
   */
  static async updateCommodity(id, name, inquiry, offer, price, amount, date, parita) {
    try {
      await db.updateCommodity(id, name, inquiry, offer, price, amount, date, parita);
    } catch (error) {
      CommoditiesService.logServiceError('updateCommodity', error);
      throw new Error('Error updating commodity.');
    }
  }

  /**
   * Delete a commodity from the database.
   * @param {number} id - The ID of the commodity to delete.
   * @throws {Error} - If there's an error deleting the commodity.
   */
  static async deleteCommodity(id) {
    try {
      await db.deleteCommodity(id);
    } catch (error) {
      CommoditiesService.logServiceError('deleteCommodity', error);
      throw new Error('Error deleting commodity.');
    }
  }
}

// Export individual methods with annotations
module.exports = {
  /**
   * Save a commodity to the database.
   * @param {string} name - The name of the commodity.
   * @param {string} inquiry - The inquiry of the commodity.
   * @param {string} offer - The offer of the commodity.
   * @param {number} price - The price of the commodity.
   * @param {number} amount - The amount of the commodity.
   * @param {Date} date - The date of the commodity.
   * @param {string} parita - The parita of the commodity.
   * @throws {Error} - If there's an error saving the commodity.
   */
  saveCommodity: CommoditiesService.saveCommodity,

  /**
   * Retrieve all commodities from the database.
   * @returns {Promise<Array>} - A Promise that resolves with an array of commodities or an empty array if no commodities are found.
   * @throws {Error} - If there's an error retrieving the commodities.
   */
  getAllCommodities: CommoditiesService.getAllCommodities,

  /**
   * Update an existing commodity in the database.
   * @param {number} id - The ID of the commodity to update.
   * @param {string} name - The updated name of the commodity.
   * @param {string} inquiry - The updated inquiry of the commodity.
   * @param {string} offer - The updated offer of the commodity.
   * @param {number} price - The updated price of the commodity.
   * @param {number} amount - The updated amount of the commodity.
   * @param {Date} date - The updated date of the commodity.
   * @param {string} parita - The updated parita of the commodity.
   * @throws {Error} - If there's an error updating the commodity.
   */
  updateCommodity: CommoditiesService.updateCommodity,

  /**
   * Delete a commodity from the database.
   * @param {number} id - The ID of the commodity to delete.
   * @throws {Error} - If there's an error deleting the commodity.
   */
  deleteCommodity: CommoditiesService.deleteCommodity,
};