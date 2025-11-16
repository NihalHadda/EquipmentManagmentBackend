# Backend (Express + MongoDB)

Quick starter for an Express API using MongoDB (mongoose).

Files created:
- `src/app.js` - Express app configuration
- `src/server.js` - server bootstrap + DB connection
- `src/config/db.js` - mongoose connection helper
- `src/models/user.js` - sample Mongoose model
- `src/controllers/userController.js` - CRUD handlers
- `src/routes/users.js` - user routes

Usage

1) Copy `.env.example` to `.env` and update `MONGO_URI`.

2) Install dependencies:

```powershell
cd C:\Users\USER\Desktop\nihel\Backend
npm install
```

3) Start server (development):

```powershell
npm run dev
```

Or production:

```powershell
npm start
```

Routes

- GET /health
- GET /api/users
- POST /api/users { name, email }
- GET /api/users/:id
- DELETE /api/users/:id

