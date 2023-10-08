/**
 * @file EmailService.js
 * @description Provides a class to send custom HTML emails to all email addresses in the database.
 * @version 1.0
 * @license Copyright Â© 2023 Acronym Web Design.
 *           All rights reserved. Unauthorized copying or reproduction of this file
 *           or its contents is prohibited. This file is proprietary and confidential.
 *           It may not be disclosed, copied, reproduced, or used without express
 *           written permission from Acronym Web Design.
 * @author Acronym Web Design | AjM
 */

const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const validator = require('validator');

const { getAllEmailAddresses } = require('../../db');
const { logData } = require('../../logging/logger');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Class for sending custom HTML emails to subscribers.
 */
class EmailService {
  /**
   * Send custom HTML email to all subscribers.
   * @param {string} articleTitle - The title of the new article.
   * @param {string} articleContent - The content of the new article.
   * @throws {Error} If there's an error sending emails.
   */
  static async sendEmailToSubscribers(articleTitle, articleContent) {
    try {
      // Create a transporter for sending emails
      const transporter = nodemailer.createTransport({
        service: 'Gmail', // e.g., 'Gmail' or 'Outlook'
        auth: {
          user: process.env.EMAIL_USER, // your email address
          pass: process.env.EMAIL_PASSWORD, // your email password or app password
        },
        // Set additional security options
        secure: true,
        requireTLS: true,
      });

      // Load custom email content from a file
      const customHTMLContent = await fs.readFile(path.join(__dirname, 'emailContent.html'), 'utf8');

      // Get all email addresses from the database using the getAllEmailAddresses function
      const emails = await getAllEmailAddresses();

      // Validate and sanitize email addresses
      if (!Array.isArray(emails) || emails.length === 0) {
        logData('EmailService', 'No email addresses found in the mailing list');
        return;
      }

      // Validate email addresses using the 'validator' library
      const validEmails = emails.filter(email => validator.isEmail(email));

      // Replace placeholders with article information in the HTML content
      const mergedHTMLContent = customHTMLContent
        .replace('{{articleTitle}}', articleTitle)
        .replace('{{articleContent}}', articleContent);

      // Send email to each address using Promise.all to parallelize the email sending process
      await Promise.all(validEmails.map(async (email) => {
        const mailOptions = {
          from: process.env.EMAIL_USER, // sender email address
          to: email, // recipient email address
          subject: 'New Article Published', // email subject
          html: mergedHTMLContent, // replace placeholder with article information
        };

        try {
          await transporter.sendMail(mailOptions);
          logData('EmailService', `Email sent successfully to: ${email}`, 'info');
        } catch (error) {
          logData('EmailService', `Error sending email to: ${email}, Error: ${error.message}`, 'error');
          // Implement retry mechanism here if needed
        }
      }));

      // All emails sent successfully
      logData('EmailService', 'Emails sent to all subscribers', 'info');
    } catch (error) {
      logData('EmailService', `Error sending emails to subscribers: ${error.message}`, 'error');
      throw new Error('Error sending emails to subscribers.');
    }
  }
}

/**
 * Wrapper function that exports the sendEmailToSubscribers function with parameters.
 * @param {string} articleTitle - The title of the new article.
 * @param {string} articleContent - The content of the new article.
 * @throws {Error} If there's an error sending emails.
 */
function sendEmailToSubscribersWithParams(articleTitle, articleContent) {
  return EmailService.sendEmailToSubscribers(articleTitle, articleContent);
}

// Export the wrapper function with parameters
module.exports = {
  sendEmailToSubscribers: sendEmailToSubscribersWithParams,
};