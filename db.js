/**
 * @file db.js
 * @description Defines the database connection and provides functions to interact with the database.
 * @version 1.0
 * @license Copyright © 2023 Acronym Web Design.
 *           All rights reserved. Unauthorized copying or reproduction of this file
 *           or its contents is prohibited. This file is proprietary and confidential.
 *           It may not be disclosed, copied, reproduced, or used without express
 *           written permission from Acronym Web Design.
 * @author Acronym Web Design | AjM
 */

const { Pool } = require("pg")
const bcrypt = require("bcrypt")
require("dotenv").config()
const { logData } = require("./logging/logger")

// Create a new PostgreSQL connection pool with the provided DATABASE_URL
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false,
	},
})

// Error handling for unexpected errors on idle clients in the pool
pool.on("error", (err) => {
	console.error("Unexpected error on idle client:", err)
	process.exit(-1)
})

/**
 * Middleware to handle database connection in requests.
 * Attaches the database connection pool to the request object.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 */
const handleDatabaseConnection = (req, res, next) => {
	req.db = pool // Attach the database connection pool to the request object
	next()
}

/**
 * Creates an admin user in the database.
 * @param {string} email - The email address of the admin user.
 * @param {string} password - The password of the admin user.
 * @returns {Promise<Object>} - A Promise that resolves with the created admin user object.
 * @throws {Error} - If there's an error creating the admin user.
 */
const createAdminUser = async (email, password) => {
	try {
		// Hash the provided password with bcrypt and a salt round of 10
		const hashedPassword = await bcrypt.hash(password, 10)

		// Prepare the SQL query to insert the admin user with the hashed password
		const query = "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *"
		const values = [email, hashedPassword]

		// Execute the query using the pool and get the result
		const result = await pool.query(query, values)

		// Return the newly created admin user object from the result
		return result.rows[0]
	} catch (error) {
		// Log the error and throw a new error with a user-friendly message
		logData("db.js", `Error creating admin user: ${error.message}`)
		console.error("Error creating admin user:", error.message)
		throw new Error("Error creating admin user")
	}
}

/**
 * Retrieves an admin user by email from the database.
 * @param {string} email - The email address of the admin user.
 * @returns {Promise<Object|null>} - A Promise that resolves with the admin user object if found, otherwise null.
 * @throws {Error} - If there's an error retrieving the admin user.
 */
const getAdminUserByEmail = async (email) => {
	try {
		// Prepare the SQL query to select the admin user by email
		const query = "SELECT * FROM users WHERE email = $1"

		// Execute the query using the pool with the provided email as the parameter
		const result = await pool.query(query, [email])

		// If no admin user is found, return null
		if (result.rows.length === 0) {
			return null
		}

		// Return the admin user object from the result
		return result.rows[0]
	} catch (error) {
		// Log the error and throw a new error with a user-friendly message
		logData("db.js", `Error retrieving admin user: ${error.message}`)
		console.error("Error retrieving admin user:", error.message)
		throw new Error("Error occurred during login. Please try again later.")
	}
}

/**
 * Retrieves all email addresses from the database mailing_list table.
 * @returns {Promise<string[]>} - A Promise that resolves with an array of email addresses.
 * @throws {Error} - If there's an error retrieving the email addresses.
 */
const getAllEmailAddresses = async () => {
	try {
		// Prepare the SQL query to select all email addresses from the mailing_list table
		const query = "SELECT email FROM mailing_list"

		// Execute the query using the pool to get the result
		const result = await pool.query(query)

		// Map the rows from the result to extract email addresses into an array
		const emails = result.rows.map((row) => row.email)

		// Return the array of email addresses
		return emails
	} catch (error) {
		// Log the error and throw a new error with a user-friendly message
		logData("db.js", `Error retrieving email addresses: ${error.message}`)
		console.error("Error retrieving email addresses:", error.message)
		throw new Error("Error retrieving email addresses")
	}
}

/**
 * Adds an email address to the mailing list in the database.
 * @param {string} email - The email address to add to the mailing list.
 * @returns {Promise<void>} - A Promise that resolves after adding the email or rejects on error.
 * @throws {Error} - If there's an error adding the email.
 */
const addEmailToDatabase = async (email) => {
	try {
		// Check if the email already exists in the database
		const existingEmail = await pool.query("SELECT * FROM mailing_list WHERE email = $1", [email])

		if (existingEmail.rows.length > 0) {
			throw new Error("Email address already exists in the mailing list")
		}

		// Insert the email into the mailing_list table
		await pool.query("INSERT INTO mailing_list (email) VALUES ($1)", [email])

		// Reorder the table IDs sequentially
		await reorderTableIdsSequentially("mailing_list")
	} catch (error) {
		// Log the error and rethrow it after reordering the table IDs
		logData("db.js", `Error adding email to database: ${error.message}`)
		console.error("Error adding email to database:", error.message)

		// Reorder the table IDs sequentially even if there's an error
		await reorderTableIdsSequentially("mailing_list")
		throw error
	}
}

/**
 * Saves an article to the database.
 * @param {string} articleTitle - The title of the article.
 * @param {string} articleContent - The content of the article.
 * @param {Date} [articlePublication] - The publication date of the article (optional).
 * @param {string} [articleImageUrl] - The URL of the article image (optional).
 * @returns {Promise<void>} - A Promise that resolves after saving the article or rejects on error.
 * @throws {Error} - If there's an error saving the article.
 */
const saveArticle = async (articleTitle, articleContent, articlePublication, articleImageUrl) => {
	try {
		// If articlePublication is not provided or is invalid, set it to the current timestamp (NOW())
		const publicationDate = articlePublication || new Date()
		const query = "INSERT INTO articles (article_title, article_content, article_publication, article_image_url) VALUES ($1, $2, $3, $4)"
		const values = [articleTitle, articleContent, publicationDate, articleImageUrl]
		await pool.query(query, values)

		// After successful addition, perform the error check to update the article IDs sequentially
		await reorderTableIdsSequentially("articles")
	} catch (error) {
		// Log the error and throw a new error with a user-friendly message
		logData("db.js", `Error saving article: ${error.message}`)
		console.error("Error saving article:", error.message)
		throw new Error("Error saving article")
	}
}

/**
 * Retrieves an article by ID or all articles if no ID is provided.
 * If an ID is provided, it retrieves the article with that ID.
 * If no ID is provided, it retrieves the latest article by highest ID.
 * @param {number} [id] - The ID of the article to retrieve. If not provided, all articles will be retrieved.
 * @returns {Promise<Object|Object[]|null>} - A Promise that resolves with the article object, an array of all articles,
 *                                            or null if no article is found.
 * @throws {Error} - If there's an error retrieving the article(s).
 */
const getArticle = async (id) => {
	try {
		let query
		let values

		if (id) {
			query = "SELECT * FROM articles WHERE id = $1"
			values = [id]

			const result = await pool.query(query, values)
			return result.rows[0] || null
		} else {
			query = "SELECT * FROM articles ORDER BY id DESC"
			const result = await pool.query(query)

			if (result.rows.length === 0) {
				return null
			}

			return result.rows
		}
	} catch (error) {
		// Log the error and throw a new error with a user-friendly message
		logData("db.js", `Error retrieving article(s): ${error.message}`)
		console.error("Error retrieving article(s):", error.message)
		throw new Error("Error retrieving article(s)")
	}
}

/**
 * Updates an article in the database.
 * @param {number} id - The ID of the article to update.
 * @param {string} articleTitle - The updated title of the article.
 * @param {string} articleContent - The updated content of the article.
 * @param {Date} [articlePublication] - The updated publication date of the article (optional).
 * @param {string} [articleImageUrl] - The updated URL of the article image (optional).
 * @returns {Promise<void>} - A Promise that resolves after updating the article or rejects on error.
 * @throws {Error} - If there's an error updating the article.
 */
const updateArticle = async (id, articleTitle, articleContent, articlePublication, articleImageUrl) => {
	try {
		let query
		let values

		if (articlePublication && articleImageUrl) {
			query = "UPDATE articles SET article_title = $1, article_content = $2, article_publication = $3, article_image_url = $4 WHERE id = $5"
			values = [articleTitle, articleContent, articlePublication, articleImageUrl, id]
		} else if (articlePublication) {
			query = "UPDATE articles SET article_title = $1, article_content = $2, article_publication = $3 WHERE id = $4"
			values = [articleTitle, articleContent, articlePublication, id]
		} else if (articleImageUrl) {
			query = "UPDATE articles SET article_title = $1, article_content = $2, article_image_url = $3 WHERE id = $4"
			values = [articleTitle, articleContent, articleImageUrl, id]
		} else {
			query = "UPDATE articles SET article_title = $1, article_content = $2 WHERE id = $3"
			values = [articleTitle, articleContent, id]
		}

		await pool.query(query, values)
		logData("db.js", `Article updated successfully. ID: ${id}`, "info")
	} catch (error) {
		// Log the error and throw a new error with a user-friendly message
		logData("db.js", `Error updating article: ${error.message}`)
		console.error("Error updating article:", error.message)
		throw new Error("Error updating article")
	}
}

/**
 * Deletes an article from the database.
 * @param {number} id - The ID of the article to delete.
 * @returns {Promise<void>} - A Promise that resolves after deleting the article or rejects on error.
 * @throws {Error} - If there's an error deleting the article.
 */
const deleteArticle = async (id) => {
	try {
		const query = "DELETE FROM articles WHERE id = $1"
		const values = [id]
		await pool.query(query, values)

		// After successful deletion, perform the error check to update the article IDs sequentially
		await reorderTableIdsSequentially("articles")

		logData("db.js", `Article deleted successfully. ID: ${id}`)
	} catch (error) {
		// Log the error and throw a new error with a user-friendly message
		logData("db.js", `Error deleting article: ${error.message}`)
		console.error("Error deleting article:", error.message)
		throw new Error("Error deleting article")
	}
}

/**
 * Reorder the IDs of the specified table sequentially.
 * This function should be called after any operation that may affect the IDs.
 * @param {string} tableName - The name of the table to reorder.
 * @returns {Promise<void>} - A Promise that resolves after updating the IDs or rejects on error.
 */
const reorderTableIdsSequentially = async (tableName) => {
	try {
		// Retrieve all rows from the specified table in ascending order by ID
		const query = `SELECT id FROM ${tableName} ORDER BY id`
		const result = await pool.query(query)
		const rows = result.rows

		// Update the IDs of the remaining rows sequentially starting from 1
		for (let i = 0; i < rows.length; i++) {
			const rowId = rows[i].id
			// Skip if the row already has the correct ID
			if (rowId === i + 1) continue

			// Update the row's ID to the correct sequential value
			const updateQuery = `UPDATE ${tableName} SET id = $1 WHERE id = $2`
			const updateValues = [i + 1, rowId]
			await pool.query(updateQuery, updateValues)
		}
	} catch (error) {
		// Log the error and throw a new error with a user-friendly message
		logData("db.js", `Error updating ${tableName} IDs: ${error.message}`)
		console.error(`Error updating ${tableName} IDs:`, error.message)
		throw new Error(`Error updating ${tableName} IDs`)
	}
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
 * @returns {Promise<void>} - A Promise that resolves after saving the commodity or rejects on error.
 * @throws {Error} - If there's an error saving the commodity.
 */
const saveCommodity = async (name, inquiry, offer, price, amount, date, parita) => {
	const query = `
    INSERT INTO Commodities (name, inquiry, offer, price, amount, date, parita)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `

	const values = [name, inquiry, offer, price, amount, date, parita]

	try {
		await pool.query(query, values)
	} catch (error) {
		// Log the error and throw it again
		logData("db.js", `Error saving commodity: ${error.message}`)
		throw error
	}
}

/**
 * Retrieve all commodities from the database.
 * @returns {Promise<Array>} - A Promise that resolves with an array of commodities or an empty array if no commodities are found.
 * @throws {Error} - If there's an error retrieving the commodities.
 */
const getAllCommodities = async () => {
	const query = `
    SELECT *
    FROM Commodities
  `

	try {
		const result = await pool.query(query)
		return result.rows
	} catch (error) {
		// Log the error and throw it again
		logData("db.js", `Error retrieving commodities: ${error.message}`)
		throw error
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
 * @returns {Promise<void>} - A Promise that resolves after updating the commodity or rejects on error.
 * @throws {Error} - If there's an error updating the commodity.
 */
const updateCommodity = async (id, name, inquiry, offer, price, amount, date, parita) => {
	const query = `
    UPDATE Commodities
    SET name = $1, inquiry = $2, offer = $3, price = $4, amount = $5, date = $6, parita = $7
    WHERE id = $8
  `

	const values = [name, inquiry, offer, price, amount, date, parita, id]

	try {
		await pool.query(query, values)
	} catch (error) {
		// Log the error and throw it again
		logData("db.js", `Error updating commodity: ${error.message}`)
		throw error
	}
}

/**
 * Delete a commodity from the database.
 * @param {number} id - The ID of the commodity to delete.
 * @returns {Promise<void>} - A Promise that resolves after deleting the commodity or rejects on error.
 * @throws {Error} - If there's an error deleting the commodity.
 */
const deleteCommodity = async (id) => {
	const query = `
    DELETE FROM Commodities
    WHERE id = $1
  `

	try {
		await pool.query(query, [id])
	} catch (error) {
		// Log the error and throw it again
		logData("db.js", `Error deleting commodity: ${error.message}`)
		throw error
	}
}

// Export the functions and middlewares
module.exports = {
	handleDatabaseConnection,
	createAdminUser,
	getAdminUserByEmail,
	getAllEmailAddresses,
	addEmailToDatabase,
	saveArticle,
	getArticle,
	updateArticle,
	deleteArticle,
	saveCommodity,
	getAllCommodities,
	updateCommodity,
	deleteCommodity,
}
