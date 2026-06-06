# Vanilla Node.js Auth & Captcha System

This is a custom web application built from scratch without using frameworks like Express or external auth libraries like Passport. It was built to demonstrate core web security concepts.

## Features
* Custom SVG CAPTCHA generation with a reload button.
* Secure password hashing using Node's native `crypto.scryptSync`.
* Stateful sessions using HttpOnly cookies and server-side Maps.
* Single Page Application (SPA) UI using Vanilla JavaScript.
* PostgreSQL integration with parameterized queries.
* Unit tests for the core utility functions.

## Technologies
* Frontend: HTML5, CSS3, Vanilla JS
* Backend: Node.js (native http module)
* Database: PostgreSQL
* Testing: node:test

## How to run locally

1. Create a PostgreSQL database named `telebid_db`.
2. Run this query to create the users table:
   CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       names VARCHAR(100) NOT NULL,
       email VARCHAR(100) UNIQUE NOT NULL,
       password VARCHAR(255) NOT NULL
   );
3. Update `server.js` with your local database password if needed.
4. Run `npm install pg` to install the database driver.
5. Run `node server.js`.
6. Open `index.html` in your browser.

## Running Tests
Run `node --test` in your terminal to execute the security and CAPTCHA tests.