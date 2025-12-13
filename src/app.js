const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

// Routes
const usersRouter = require("./routes/userRoutes");
const authRouter = require("./routes/authRoutes");
const roleRouter = require("./routes/roleRoutes");
const equipmentRouter = require("./routes/equipmentRoutes.js");  // <-- AJOUTÉ
const reservationRoutes = require("./routes/reservationRoutes");

const createApp = () => {
  const app = express();

  // Middlewares
  app.use(morgan("dev"));
  app.use(cors());
  app.use(express.json());

  // Main API Routes
  app.use("/api/users", usersRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/roles", roleRouter);
  app.use("/api/equipments", equipmentRouter); // <-- AJOUTÉ
  app.use("/api/reservations", reservationRoutes);

  // Health Check Route
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
};

module.exports = createApp;