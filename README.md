# Full-Stack Expense Tracker
**Live Link:** https://expense-tracker-8m3y.onrender.com

A modern, full-stack Expense Tracker web application built to help users seamlessly track and categorize their expenses across multiple isolated sheets. 

## 🚀 Technologies Used

- **Backend:** Node.js with [Express.js](https://expressjs.com/)
- **Database:** [NeDB](https://github.com/louischatriot/nedb) (Node Embedded Database) via `nedb-promises`
- **Frontend:** Vanilla HTML5, CSS3, and JavaScript (No heavy frameworks required)
- **Authentication:** JSON Web Tokens (JWT) & `bcryptjs` for secure password hashing

## 📂 Architecture & File Explanations

Here is a breakdown of the code and the reasoning behind each file:

### 1. The Backend (Express.js & NeDB)

Instead of a heavy external database like MongoDB or PostgreSQL, this project uses **NeDB**, which is a lightweight, file-based database that uses the exact same API as MongoDB. This makes the application highly portable and easy to run anywhere.

- **`server.js`**: The main entry point of the application. It configures the Express server, sets up middleware (`cors`, `express.json`), and serves the frontend static files. It also maps the API routes to their specific controllers.
- **`models/db.js`**: Initializes the NeDB datastores (`users.db`, `sheets.db`, `expenses.db`). These files are automatically generated in the `data/` folder when the app runs. NeDB was chosen specifically based on project requirements to ensure simple, localized storage.
- **`middleware/authMiddleware.js`**: Protects secure routes. It intercepts incoming requests, checks for a valid `Bearer` token in the headers, and verifies it using `jsonwebtoken`. If valid, it allows the request to proceed.
- **`routes/authRoutes.js`**: Handles user Registration and Login. It uses `bcryptjs` to ensure passwords are never stored in plain text, and issues JWT tokens upon successful login.
- **`routes/sheetRoutes.js`**: Manages the CRUD (Create, Read, Update, Delete) operations for Expense Sheets. 
- **`routes/expenseRoutes.js`**: Manages the CRUD operations for individual expenses. When an expense is created or fetched, it is strictly tied to both a specific `sheetId` and the authenticated user's ID to ensure privacy.

### 2. The Frontend (Vanilla SPA)

The frontend is built as a **Single Page Application (SPA)** using pure JavaScript. This approach was chosen to keep the application lightweight and incredibly fast without the overhead of compiling React or Vue code.

- **`public/index.html`**: The main interface structure. Instead of creating multiple HTML files, the entire application exists here. JavaScript toggles the visibility of different sections (`.hidden` class) to simulate page navigation seamlessly.
- **`public/css/style.css`**: The styling engine. Designed with a premium **dark mode** aesthetic, it utilizes modern CSS techniques such as **Glassmorphism** (`backdrop-filter: blur`), CSS Grid/Flexbox for layout, and custom CSS variables for easy theming.
- **`public/js/api.js`**: A dedicated API service class. It acts as a wrapper around the native browser `fetch` API. It automatically attaches the user's JWT token to every request, keeping the main application logic clean and DRY (Don't Repeat Yourself).
- **`public/js/app.js`**: The brains of the frontend. It handles state management (current user, current sheet, expenses), DOM manipulation, and event listeners. 

### 💡 Notable Design Decisions

- **Custom Confirmation Modals:** Native `window.confirm()` dialogs were initially used for deleting expenses and sheets. However, in some embedded browser environments, these native dialogs are silently blocked, causing the delete buttons to fail. To fix this and provide a vastly superior UX, a custom HTML/CSS confirmation modal was implemented in `app.js` (`useCustomConfirm`).
- **Dynamic DOM Rendering:** Instead of using a templating engine like Handlebars, the JavaScript directly constructs and injects HTML into the DOM. This provides a highly reactive feel similar to React, but natively.