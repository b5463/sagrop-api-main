/**
 * @file bcrypt.js
 * @description Provides a function to generate bcrypt hashed passwords for user authentication.
 * @version 1.0
 * @license Copyright © 2023 Acronym Web Design.
 *           All rights reserved. Unauthorized copying or reproduction of this file
 *           or its contents is prohibited. This file is proprietary and confidential.
 *           It may not be disclosed, copied, reproduced, or used without express
 *           written permission from Acronym Web Design.
 * @author Acronym Web Design
 */

const bcrypt = require('bcrypt');
const { createAdminUser } = require('../db'); // Import createAdminUser function from db.js

/**
 * Generates a bcrypt hashed password for a given password and creates an admin user in the database.
 * @param {string} email - The email address of the admin user.
 * @param {string} password - The plain text password to be hashed.
 * @returns {Promise<Object>} - A Promise that resolves with the created admin user object.
 * @throws {Error} - If there's an error creating the hashed password or the admin user.
 */
const generateBcryptHashAndCreateAdminUser = async (email, password) => {
  try {
    // Hash the provided password with bcrypt and a salt round of 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // Call the createAdminUser function from db.js to create the admin user in the database
    const adminUser = await createAdminUser(email, hashedPassword);

    console.log('Hashed password created and admin user created successfully.');
    return adminUser;
  } catch (error) {
    console.error('Error creating hashed password and admin user:', error);
    throw new Error('Error creating hashed password and admin user');
  }
};

(async () => {
  try {
    // Replace this with the actual email and password you want to use for the admin user
    const email = 'admin@example.com';
    const password = 'Aa123456';

    // Call the generateBcryptHashAndCreateAdminUser function to create the admin user
    const adminUser = await generateBcryptHashAndCreateAdminUser(email, password);

    // You can perform further operations with the admin user if needed
    console.log('Admin user created:', adminUser);
  } catch (error) {
    console.error('Error occurred:', error);
  }
})();