/**
 * @file random_jwt_secret.js
 * @description Generates a random JWT secret with 32 bytes (256 bits) and writes it to the .env file.
 * @version 1.0
 * @license Copyright © 2023 Acronym Web Design.
 *           All rights reserved. Unauthorized copying or reproduction of this file
 *           or its contents is prohibited. This file is proprietary and confidential.
 *           It may not be disclosed, copied, reproduced, or used without express
 *           written permission from Acronym Web Design.
 * @author Acronym Web Design
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generates a random JWT secret with 32 bytes (256 bits) and writes it to the .env file.
 *
 * @returns {void}
 * @throws {Error} - If there's an error writing to the .env file.
 */
const generateJwtSecretAndWriteToFile = () => {
  try {
    const jwtSecret = crypto.randomBytes(32).toString('hex');

    // Path to the .env file
    const envFilePath = path.resolve(__dirname, '../.env');

    // Update or create the JWT_SECRET entry in the .env file
    fs.appendFileSync(envFilePath, `\nJWT_SECRET=${jwtSecret}`, { flag: 'a' });

    console.log('JWT Secret:', jwtSecret);
    console.log('JWT Secret written to .env file.');
  } catch (error) {
    console.error('Error generating and writing JWT secret:', error);
  }
};

// Example usage
generateJwtSecretAndWriteToFile();