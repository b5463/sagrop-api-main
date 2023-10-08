# Sagrop API - Developer Guide

## Overview

The **ACR_SAGROP_API** powers the **Sagrop app**, managing users, articles, commodities, and email subscriptions.

## Getting Started

### Prerequisites

- Node.js (v20.5.0 or later)
- PostgreSQL database

### Installation

1. Clone the repository.
2. Navigate to the project directory and install the required dependencies using the command: `npm install`.

### Configuration

1. Locate the `.env.example` file in the project root.
2. Create a copy of `.env.example` and name it `.env`.
3. Edit the `.env` file to configure environment variables, including `DATABASE_URL` which should point to your PostgreSQL database.

### Running

To start the Sagrop API project, execute the command: `npm start`.

## API Documentation

### Use Cases

- Authentication & Authorization
- User Management (Registration & Login)
- Article Management (CRUD)
- Commodity Management (CRUD)
- Email Subscription

### Guidelines for Routes

- Use kebab-case for route naming (e.g., `/api/get-all-commodities`).
- Implement authentication middleware to secure routes.
- Maintain consistent code styling and formatting.
- Ensure comprehensive error handling and input validation.

### Security & Performance

To enhance security and optimize performance, consider implementing the following measures:

- Rate limiting to prevent abuse.
- Content Security Policy (CSP) to mitigate cross-site scripting (XSS) attacks.
- Cross-Site Scripting (XSS) protection mechanisms.
- HTTP Parameter Pollution (HPP) prevention to safeguard against parameter pollution attacks.

## Files

- `index.js`: Core setup, middleware integration, routing configuration, and server initialization.
- `db.js`: Manages database connectivity and CRUD (Create, Read, Update, Delete) operations.
- `routes/routes.js`: Maps API endpoints to corresponding controller functions.
- `controllers/`: Contains the logic for various API features.
- `services/`: Facilitates interactions with external services or APIs.
- `logging/logger.js`: Handles data tracking and error logging.

## Contact

For inquiries, support, or additional details, please reach out to us:

- Website: [acronym.sk](https://acronym.sk)
- Email: [support@acronym.sk](mailto:support@acronym.sk)

Author: Acronym Web Design Studio