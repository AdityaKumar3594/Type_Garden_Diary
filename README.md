# Type Garden Diary

A private, typographic daily garden diary built with Node.js, Express, MongoDB, and Vanilla Canvas/HTML/CSS.

## Project Structure

```text
type-garden-diary/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection setup
│   ├── controllers/
│   │   ├── authController.js   # Signup, login, logout, getMe handlers
│   │   └── entryController.js  # Diary entry CRUD & validation logic
│   ├── middleware/
│   │   └── auth.js             # JWT authentication & rate limiting
│   ├── models/
│   │   ├── User.js             # Mongoose User schema & model
│   │   └── Entry.js            # Mongoose Entry schema & model
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth routes
│   │   └── entryRoutes.js      # /api/entries routes
│   └── server.js               # Express application entrypoint
├── frontend/
│   ├── css/
│   │   └── style.css           # UI styles and typography
│   ├── js/
│   │   └── app.js              # Type Garden canvas and client application
│   └── index.html              # Main HTML markup
├── .env.example                # Environment variables template
├── package.json                # Project configuration & npm scripts
└── README.md
```

## Getting Started

### 1. Environment Configuration

Copy `.env.example` to `.env` and fill in your MongoDB URI and a random secret for JWT:

```bash
# In the project root
cp .env.example .env
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

- **Development mode** (with auto-reload on backend changes):
  ```bash
  npm run dev
  ```
- **Production mode**:
  ```bash
  npm start
  ```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Enter` | **Next line** — moves to the next line in the garden |
| `Shift + Enter` | **New paragraph** — creates a paragraph break with vertical spacing |
| `Space` | Cut stem · separate word |
| `Backspace` | Wither previous character |
| `Ctrl/⌘ + S` | Save entry immediately |
| `Ctrl/⌘ + Z` | Undo |
| `Ctrl/⌘ + Y` or `Ctrl/⌘ + Shift + Z` | Redo |
| `Ctrl/⌘ + F` | Find in entry |
| `F` | Toggle Focus Mode |
| `?` | Keyboard shortcuts reference |
| `Esc` | Close modal / exit Focus Mode |
