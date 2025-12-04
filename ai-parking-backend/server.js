const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/auth");
const spotsRoutes = require("./routes/spots");
const bookingsRoutes = require("./routes/bookings");
const systemRoutes = require("./routes/system");
const reviewsRouter = require('./routes/reviews');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/spots", spotsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/system", systemRoutes);
app.use('/reviews', reviewsRouter);

// Default route
app.get("/", (req, res) => res.send("Parking System API is running"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
