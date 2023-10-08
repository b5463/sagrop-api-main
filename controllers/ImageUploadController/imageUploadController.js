/**
 * @file imageUploadController.js
 * @description This file contains the image upload algorithm for the Sagrop application.
 *              The algorithm uses the 'multer' library to handle image uploads and stores
 *              the images in the local file system in a designated directory.
 *
 * @version 1.0
 * @license Copyright © 2023 Acronym Web Design.
 *           All rights reserved. Unauthorized copying or reproduction of this file
 *           or its contents is prohibited. This file is proprietary and confidential.
 *           It may not be disclosed, copied, reproduced, or used without express
 *           written permission from Acronym Web Design.
 * @author Acronym Web Design
 */

const path = require("path")
const multer = require("multer")
const { logData } = require("../../logging/logger")

/**
 * Class representing the Image Upload Controller.
 */
class ImageUploadController {
	constructor() {
		// Configure storage for multer
		this.storage = multer.diskStorage({
			destination: (req, file, cb) => {
				cb(null, path.join(__dirname, "../../../public/uploads"))
			},
			filename: (req, file, cb) => {
				cb(null, `${Date.now()}-${file.originalname}`)
			},
		})

		// Create multer instance
		this.upload = multer({ storage: this.storage })
	}

	/**
	 * Private function to handle error logging.
	 * @private
	 * @param {string} message - The error message.
	 * @param {Error} error - The error object.
	 * @param {string} functionOrigin - The name of the function where the error occurred.
	 */
	_logError(message, error, functionOrigin) {
		const fileName = "imageUploadController.js"
		logData(fileName, `[${functionOrigin}] ${message}: ${error.message}`, "error")
	}

	/**
	 * Private function to handle info logging.
	 * @private
	 * @param {string} message - The info message.
	 * @param {string} functionOrigin - The name of the function where the info originated.
	 */
	_logInfo(message, functionOrigin) {
		const fileName = "imageUploadController.js"
		logData(fileName, `[${functionOrigin}] ${message}`, "info")
	}

	/**
	 * Middleware to handle image upload errors.
	 *
	 * @param {Error} err - The error object.
	 * @param {express.Request} req - The request object from Express.
	 * @param {express.Response} res - The response object from Express.
	 * @param {Function} next - The next middleware function.
	 */
	handleUploadError(err, req, res, next) {
		if (err instanceof multer.MulterError) {
			this._logError("Multer Error", err, "handleUploadError")
			return res.status(400).json({ message: "Image upload error" })
		} else if (err) {
			this._logError("Error uploading image", err, "handleUploadError")
			return res.status(500).json({ message: "Error uploading image" })
		}
		next()
	}

	/**
	 * Handles image upload for the Sagrop application.
	 *
	 * @param {express.Request} req - The request object from Express.
	 * @param {express.Response} res - The response object from Express.
	 */
	handleImageUpload(req, res) {
		this.upload.single("image")(req, res, (err) => {
			if (err) {
				this._logError("Error uploading image", err, "handleImageUpload")
				return res.status(500).json({ message: "Error uploading image" })
			}

			const imageUrl = `../../../public/uploads/${req.file.filename}`
			this._logInfo(`Image uploaded: ${imageUrl}`, "handleImageUpload")
			return res.status(200).json({ imageUrl })
		})
	}
}

// Create an instance of ImageUploadController
const imageUploadController = new ImageUploadController()

// Export the methods with the instance bound to maintain context
module.exports = {
	/**
	 * Handles image upload for the Sagrop application.
	 *
	 * @param {express.Request} req - The request object from Express.
	 * @param {express.Response} res - The response object from Express.
	 */
	handleImageUpload: imageUploadController.handleImageUpload.bind(imageUploadController),

	/**
	 * Middleware to handle image upload errors.
	 *
	 * @param {Error} err - The error object.
	 * @param {express.Request} req - The request object from Express.
	 * @param {express.Response} res - The response object from Express.
	 * @param {Function} next - The next middleware function.
	 */
	handleUploadError: imageUploadController.handleUploadError.bind(imageUploadController),
}
