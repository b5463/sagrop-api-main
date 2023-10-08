/**
 * @file configController.js
 * @description This file defines a configuration class for the Express application.
 *              It retrieves and updates the application's configuration settings.
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
const dotenv = require("dotenv-safe")
const { logData } = require("../../logging/logger")
const { Z_ASCII } = require("zlib")

class ConfigController {
	constructor() {
		this.loadEnvVariables()
		this.config = this.loadConfig()
	}

	/**
	 * Loads environment variables securely from .env file.
	 * @private
	 */
	loadEnvVariables() {
		try {
			dotenv.config({
				path: path.resolve(__dirname, "../../.env"),
				example: path.resolve(__dirname, "../../.env.example"),
				allowEmptyValues: true,
			})
		} catch (error) {
			this._logError("Error loading environment variables", error, "loadEnvVariables")
			throw new Error("Error loading environment variables.")
		}
	}

	/**
	 * Handles error logging.
	 * @private
	 * @param {string} message - The error message.
	 * @param {Error} error - The error object.
	 * @param {string} functionOrigin - The name of the function where the error occurred.
	 */
	_logError(message, error, functionOrigin) {
		const fileName = "configController.js"
		logData(fileName, `[${functionOrigin}] ${message}: ${error.message}`, error)
	}

	/**
	 * Handles info logging.
	 * @private
	 * @param {string} message - The info message.
	 */
	_logInfo(message, functionOrigin) {
		const fileName = "configController.js"
		logData(fileName, `[${functionOrigin}] ${message}`, "info")
	}

	/**
	 * Generates a secure hash of the given data.
	 * @private
	 * @param {string} data - The data to hash.
	 * @returns {string} The generated hash.
	 */
	_generateHash(data) {
		const crypto = require("crypto")
		const hash = crypto.createHash("sha256")
		hash.update(data)
		return hash.digest("hex")
	}

	/**
	 * Generates the API URL based on API endpoint, port, and version.
	 * @private
	 * @param {string} endpoint - The API endpoint.
	 * @param {number} port - The port.
	 * @param {string} version - The API version.
	 * @returns {string} The generated API URL.
	 */
	_generateApiUrl(endpoint, port, version) {
		const apiUrl = `${endpoint}:${port}/api/v${version}`
		this._logInfo(`Generated API URL: ${apiUrl}`, "_generateApiUrl")
		return apiUrl
	}

	/**
	 * Retrieves the application's configuration settings.
	 *
	 * @returns {object} The configuration object.
	 * @throws {Error} If required configuration settings are missing or there's an error retrieving them.
	 */
	loadConfig() {
		try {
			const { APP_NAME, API_VERSION, API_ENDPOINT, PORT, MAX_UPLOAD_SIZE } = process.env

			if (!APP_NAME || !API_VERSION) {
				this._logError("Incomplete configuration settings", new Error("Incomplete configuration settings."), "loadConfig")
				throw new Error("Incomplete configuration settings.")
			}

			const apiUrl = this._generateApiUrl(API_ENDPOINT, PORT, API_VERSION.split(".")[0])
			const hash = this._generateHash(JSON.stringify({ apiUrl, maxUploadSize: MAX_UPLOAD_SIZE }))

			return {
				appName: APP_NAME,
				apiVersion: API_VERSION,
				maxUploadSize: MAX_UPLOAD_SIZE || 10 * 1024 * 1024, // Default: 10 MB
				apiUrl,
				configHash: hash,
			}
		} catch (error) {
			this._logError("Error loading configuration", error, "loadConfig")
			throw new Error("Error loading configuration.")
		}
	}

	/**
	 * Retrieves the application's configuration settings.
	 *
	 * @returns {object} The configuration object.
	 * @throws {Error} If required configuration settings are missing or there's an error retrieving them.
	 */
	getConfig() {
		return this.config
	}

	/**
	 * Updates the application's configuration settings.
	 *
	 * @param {object} updatedConfig - The updated configuration data.
	 * @returns {object} The updated configuration object.
	 * @throws {Error} If there is an error updating the configuration.
	 */
	updateConfig(updatedConfig) {
		try {
			if (typeof updatedConfig !== "object" || updatedConfig === null) {
				throw new Error("Invalid updatedConfig. Must be an object.")
			}

			this.config = { ...this.config, ...updatedConfig }
			return this.config
		} catch (error) {
			this._logError("Error updating configuration", error, "updateConfig")
			throw new Error("Error updating configuration.")
		}
	}
}

const configController = new ConfigController()

module.exports = {
	/**
	 * Retrieves the application's configuration settings.
	 *
	 * @returns {object} The configuration object.
	 * @throws {Error} If required configuration settings are missing or there's an error retrieving them.
	 */
	getConfig: configController.getConfig.bind(configController),

	/**
	 * Updates the application's configuration settings.
	 *
	 * @param {object} updatedConfig - The updated configuration data.
	 * @returns {object} The updated configuration object.
	 * @throws {Error} If there is an error updating the configuration.
	 */
	updateConfig: configController.updateConfig.bind(configController),
}
