/**
 * @file routes.js
 * @description Defines routes for the Express application, including login, protected, and auth routes.
 *              Middleware functions are included for request validation, rate limiting, and authentication.
 * @version 1.0
 * @license Copyright © 2023 Acronym Web Design.
 *           All rights reserved. Unauthorized copying or reproduction of this file
 *           or its contents is prohibited. This file is proprietary and confidential.
 *           It may not be disclosed, copied, reproduced, or used without express
 *           written permission from Acronym Web Design.
 * @author Acronym Web Design | AjM
 */

const express = require("express")
const validator = require("validator")
const path = require("path")
const router = express.Router()
const { body, validationResult } = require("express-validator")
const rateLimit = require("express-rate-limit")
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
})

const { getAdminUserByEmail, addEmailToDatabase } = require("../db")
const { generateToken, authenticateAndAuthorize, comparePasswords } = require("../controllers/authController/authController")
const { saveArticle, deleteArticle, updateArticle, getArticle, deleteArticleImage } = require("../services/articleService/articleService")
const { saveCommodity, getAllCommodities, updateCommodity, deleteCommodity } = require("../services/commoditiesService/commoditiesService")
const { sendEmailToSubscribers } = require("../services/emailService/emailService")
const { handleImageUpload } = require("../controllers/ImageUploadController/imageUploadController")
const { getConfig, updateConfig } = require("../controllers/configController/configController")
const { logData } = require("../logging/logger")

require("dotenv").config()

/*
 * Route Naming Guidelines:
    - Use kebab-case for route names (e.g. /api/{version}/v/get-all-commodities)
    - Employ camelCase for route handlers (e.g. getAllCommodities)
    - Opt for full words over abbreviations (e.g. /api/{version}/v/get-all-commodities)
    - Keep route names within three words (e.g. /api/{version}/v/get-all-commodities)
    - And finally for the love of god, use consistent naming conventions.
*/

/**
 * Handles user login and issues a JWT token upon successful authentication.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {Object} - If login is successful, sends a 200 response with the JWT token and isAdmin flag. Otherwise, sends a 401 response with an error message.
 */
router.post(
	"/login",

	// Request body validation middleware for email and password
	[
		body("email").isEmail().normalizeEmail().withMessage("Neplatný formát e-mailu."),
		body("password")
			.isLength({ min: 8 })
			.withMessage("Heslo musí mať aspoň 8 znakov.")
			.matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/)
			.withMessage("Heslo musí obsahovať aspoň jedno veľké písmeno, jedno malé písmeno a jednu číslicu."),
	],

	// Rate limiting to prevent brute-force attacks
	limiter,

	// Actual login route handler
	async (req, res) => {
		try {
			// Check for validation errors
			const validationErrors = validationResult(req)
			if (!validationErrors.isEmpty()) {
				return res.status(400).json({ errors: validationErrors.array() })
			}

			// Extract email and password from request body
			const { email, password } = req.body

			// Attempt to retrieve user from the database based on email
			logData("routes.js", `Attempting to find user by email: ${email}`, "info")
			const user = await getAdminUserByEmail(email)

			// If user not found or invalid credentials, return 401
			if (!user || !(await comparePasswords(password, user.password))) {
				logData("routes.js", `User not found or invalid credentials for email: ${email}`)
				return res.status(401).json({ message: "Neplatný e-mail alebo heslo." })
			}

			// User is authenticated, prepare user data
			const adminUser = { email: user.email, id: user.id }
			logData("routes.js", `User found and authenticated: ${adminUser.email}`, "info")

			// Check if the user is an admin (implement as needed)
			const isAdmin = true // Assuming the user is an admin for demonstration purposes

			// Generate a JWT token with user information and isAdmin flag
			const token = generateToken(adminUser, isAdmin)

			// Return the token and isAdmin flag to the client
			res.status(200).json({ token, isAdmin })
		} catch (error) {
			// Log and handle internal server error
			logData("routes.js", `Error occurred during login: ${error.message}`)
			res.status(500).json({ message: "Prihlásenie zlyhalo. Skúste to prosím neskôr." })
		}
	}
)

/**
 * Middleware to check if the user is an admin.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The next middleware function.
 * @returns {Object} - If authenticated, sets the req.user object and calls the next middleware. Otherwise, sends a 401 response.
 */
router.get("/check-admin", authenticateAndAuthorize, (req, res) => {
	res.json({ isAdmin: true })
})

/**
 * POST /api/{version}/upload-image
 * Handles the image upload and returns the uploaded image URL.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.post("/upload-image", handleImageUpload, (req, res) => {
	try {
		// Get the image URL/key from the 'req.file' object provided by multer
		const imageUrl = req.file ? `/uploads/${req.file.filename}` : null

		// Send the URL of the uploaded image in the response
		res.status(200).json({ imageUrl })
	} catch (error) {
		// Log and handle errors
		logData("routes.js", `Error during image upload: ${error.message}`, "error")
		res.status(500).json({ message: "Image upload failed" })
	}
})

/**
 * API endpoint to save an article.
 * Example: POST /api/{version}/articles
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.post(
	"/articles",
	authenticateAndAuthorize, // Middleware to authenticate admin user
	async (req, res) => {
		try {
			const { articleTitle, articleContent, articlePublication, articleImageUrl } = req.body

			// Validate that articlePublication is provided
			if (!articlePublication) {
				return res.status(400).json({ message: "articlePublication is required." })
			}

			// Call the saveArticle function to save the article
			const article = await saveArticle(articleTitle, articleContent, articlePublication, articleImageUrl)

			// Log successful article creation
			logData("routes.js", `Article saved: ${articleTitle}`, "info")

			// Send a successful response with the saved article
			res.status(201).json(article) // Use 201 Created status code for successful creation
		} catch (error) {
			// Log and handle errors
			logData("routes.js", `Error saving article: ${error.message}`, "error")
			res.status(500).json({ message: "Error saving article" })
		}
	}
)

/**
 * API endpoint to get all articles.
 * Example: GET /api/{version}/articles
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.get("/articles", async (req, res) => {
	try {
		// Call the getAllArticles function to get all articles
		const articles = await getArticle()

		// Log successful retrieval of articles
		logData("routes.js", "Articles retrieved successfully", "info")

		// Send a successful response with the retrieved articles
		res.status(200).json(articles)
	} catch (error) {
		// Log and handle errors
		logData("routes.js", `Error retrieving articles: ${error.message}`, "error")
		res.status(500).json({ message: "Error retrieving articles" })
	}
})

/**
 * API endpoint to update an article by ID.
 * Example: PUT /api/{version}/articles/1
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.put(
	"/articles/:id",
	authenticateAndAuthorize, // Middleware to authenticate admin user
	async (req, res) => {
		const { id } = req.params
		const { articleTitle, articleContent, articlePublication, articleImageUrl } = req.body

		try {
			// Ensure the provided ID is a valid integer
			const articleId = parseInt(id, 10)
			if (isNaN(articleId)) {
				return res.status(400).json({ message: "Invalid article ID" })
			}

			// Call the updateArticle function to update the article by ID
			const updatedArticle = await updateArticle(articleId, {
				articleTitle,
				articleContent,
				articlePublication,
				articleImageUrl,
			})

			if (!updatedArticle) {
				return res.status(404).json({ message: "Article not found" })
			}

			// Log successful article update
			logData("routes.js", `Article updated successfully: ID ${articleId}`, "info")

			// Send a successful response with the updated article
			res.status(200).json(updatedArticle)
		} catch (error) {
			// Log and handle errors
			logData("routes.js", `Error updating article: ${error.message}`, "error")
			res.status(500).json({ message: "Error updating article" })
		}
	}
)

/**
 * Delete an article by its ID.
 *
 * @route DELETE /api/{version}/articles/:id
 * @param {string} id - The ID of the article to delete.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.delete(
	"/articles/:id",
	authenticateAndAuthorize, // Middleware to authenticate admin user
	async (req, res) => {
		const { id } = req.params

		try {
			// Ensure the provided ID is a valid integer
			const articleId = parseInt(id, 10)
			if (isNaN(articleId)) {
				return res.status(400).json({ message: "Invalid article ID" })
			}

			// Get the article by ID to check if it exists and to get the image path
			const article = await getArticle(articleId)

			// If the article does not exist, return a 404 status
			if (!article) {
				return res.status(404).json({ message: "Article not found." })
			}

			// Delete the article image if it exists
			if (article.article_image_url) {
				const imagePath = path.join(__dirname, "../public/uploads", article.article_image_url)
				await deleteArticleImage(imagePath)
			}

			// Delete the article
			await deleteArticle(articleId)

			// Log successful article deletion
			logData("routes.js", `Article deleted successfully: ID ${articleId}`, "info")

			res.status(200).json({ message: "Article deleted successfully." })
		} catch (error) {
			// Log and handle errors
			logData("routes.js", `Error deleting article: ${error.message}`, "error")
			res.status(500).json({ message: "Error deleting article" })
		}
	}
)

/**
 * Save a new commodity to the database.
 *
 * @route POST /api/{version}/commodities
 * @param {string} name - The name of the commodity.
 * @param {string} inquiry - The inquiry details of the commodity.
 * @param {string} offer - The offer details of the commodity.
 * @param {number} price - The price of the commodity.
 * @param {number} amount - The amount of the commodity.
 * @param {Date} date - The date of the commodity.
 * @param {string} parita - The parita details of the commodity.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.post(
	"/commodities",
	authenticateAndAuthorize, // Middleware to authenticate admin user
	async (req, res) => {
		const { name, inquiry, offer, price, amount, date, parita } = req.body

		try {
			// Convert price and amount to numbers
			const parsedPrice = parseFloat(price)
			const parsedAmount = parseFloat(amount)

			// Check for valid numbers
			if (isNaN(parsedPrice) || isNaN(parsedAmount)) {
				return res.status(400).json({ message: "Invalid price or amount" })
			}

			// Call the saveCommodity function to save the commodity
			await saveCommodity(name, inquiry, offer, parsedPrice, parsedAmount, new Date(date), parita)

			// Log successful commodity creation
			logData("routes.js", "Commodity saved successfully", "info")

			res.status(201).json({ message: "Commodity saved successfully" })
		} catch (error) {
			// Log and handle errors
			logData("routes.js", `Error saving commodity: ${error.message}`, "error")
			res.status(500).json({ message: "Error saving commodity" })
		}
	}
)

/**
 * Retrieve all commodities from the database.
 *
 * @route GET /api/{version}/commodities
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.get("/commodities", async (req, res) => {
	try {
		// Call the getAllCommodities function to get all commodities
		const commodities = await getAllCommodities()

		// Check if commodities exist
		if (!commodities || commodities.length === 0) {
			logData("routes.js", "No commodities found", "info")
			return res.status(404).json({ message: "No commodities found" })
		}

		// Log successful retrieval
		logData("routes.js", "Commodities retrieved successfully", "info")
		res.status(200).json(commodities)
	} catch (error) {
		// Log and handle errors
		logData("routes.js", `Error retrieving commodities: ${error.message}`, "error")
		res.status(500).json({ message: "Error retrieving commodities" })
	}
})

/**
 * Update an existing commodity in the database.
 *
 * @route PUT /api/{version}/commodities/:id
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.put("/commodities/:id", authenticateAndAuthorize, async (req, res) => {
	const { id } = req.params
	const { name, inquiry, offer, price, amount, date, parita } = req.body

	try {
		// Update the commodity in the database
		await updateCommodity(id, name, inquiry, offer, price, amount, date, parita)

		// Log and respond with success
		logData("routes.js", "Commodity updated successfully", "info")
		res.status(200).json({ message: "Commodity updated successfully" })
	} catch (error) {
		// Log and handle errors
		logData("routes.js", `Error updating commodity: ${error.message}`, "error")
		res.status(500).json({ message: "Error updating commodity" })
	}
})

/**
 * Delete a commodity from the database.
 *
 * @route DELETE /api/{version}/commodities/:id
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.delete("/commodities/:id", authenticateAndAuthorize, async (req, res) => {
	const { id } = req.params

	try {
		// Check if the provided ID is valid
		if (isNaN(id)) {
			return res.status(400).json({ message: "Invalid commodity ID." })
		}

		// Delete the commodity from the database
		await deleteCommodity(id)

		// Log and respond with success
		logData("routes.js", "Commodity deleted successfully", "info")
		res.status(200).json({ message: "Commodity deleted successfully" })
	} catch (error) {
		// Log and handle errors
		logData("routes.js", `Error deleting commodity: ${error.message}`, "error")
		res.status(500).json({ message: "Error deleting commodity" })
	}
})

/**
 * Add an email address to the database.
 *
 * @route POST /api/{version}/add-email
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.post("/add-email", async (req, res) => {
	const { email } = req.body

	try {
		// Validate email address
		if (!email || !validator.isEmail(email)) {
			return res.status(400).json({ message: "Neplatná e-mailová adresa." })
		}

		// Call the addEmailToDatabase function from db.js to add the email address
		await addEmailToDatabase(email)

		// Log and respond with success
		logData("routes.js", `Email address added: ${email}`, "info")
		res.status(201).json({ message: "Úspešne pridaná e-mailová adresa." })
	} catch (error) {
		// Log and handle errors
		logData("routes.js", `Error adding ${email}: ${error.message}`, "error")
		res.status(500).json({ message: "Chyba pri pridávaní e-mailovej adresy." })
	}
})

/**
 * Send email to all subscribers about a new article being published.
 *
 * @route POST /api/{version}/send-article-email
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.post("/send-article-email", authenticateAndAuthorize, async (req, res) => {
	const { articleTitle, articleContent, articleImageUrl } = req.body

	try {
		// Validate article title, content, and image URL
		if (!articleTitle || !articleContent || !articleImageUrl) {
			return res.status(400).json({ message: "Article title, content, and image URL are required." })
		}

		// Call the sendEmailToSubscribers function from emailService.js to send emails
		await sendEmailToSubscribers(articleTitle, articleContent, articleImageUrl)

		// Log and respond with success
		logData("routes.js", `Article emails sent for: ${articleTitle}`, "info") // Add this line

		res.status(200).json({ message: "Úspešne odoslané e-maily odberateľom." })
	} catch (error) {
		// Log and handle errors
		logData("routes.js", `Error sending article emails: ${error.message}`, "error") // Add this line

		res.status(500).json({ message: "Chyba odosielania e-mailov s článkami." })
	}
})

/**
 * GET /api/{version}/config
 * Retrieves the application's configuration settings.
 *
 * @route GET /api/{version}/config
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.get("/config", async (req, res) => {
	try {
		// Call the getConfig function asynchronously to retrieve the configuration settings
		const config = await getConfig()

		// Respond with the configuration object
		res.status(200).json(config)
	} catch (error) {
		// Log and handle errors
		logData("routes.js", `Error retrieving configuration: ${error.message}`, "error")
		res.status(500).json({ message: "Error retrieving configuration" })
	}
})

/**
 * PUT /api/{version}/config
 * Updates the application's configuration settings.
 *
 * @route PUT /api/{version}/config
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.put(
	"/config",
	authenticateAndAuthorize, // Middleware to authenticate admin user
	async (req, res) => {
		const updatedConfig = req.body

		try {
			// Call the updateConfig function asynchronously to update the configuration settings
			const config = await updateConfig(updatedConfig)

			// Respond with the updated configuration object
			res.status(200).json(config)
		} catch (error) {
			// Log and handle errors
			logData("routes.js", `Error updating configuration: ${error.message}`, "error")
			res.status(500).json({ message: "Error updating configuration" })
		}
	}
)

/**
 * Logs data received from the client to the server console and log file.
 *
 * @route POST /api/{version}/log
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void}
 */
router.post("/log", (req, res) => {
	const { source, message } = req.body

	try {
		// Log to server console
		console.log(`[${source}] ${message}`)

		// Log to your data logging service (e.g., to a file or database)
		logData(source, message)

		// Respond with a success status
		res.sendStatus(200)
	} catch (error) {
		// Handle errors and respond with an error status
		console.error(`Error logging data: ${error.message}`)
		res.status(500).json({ message: "Error logging data" })
	}
})

// Export the router
module.exports = router
