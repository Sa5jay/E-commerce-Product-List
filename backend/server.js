import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { connectDB } from "./config/db.js";
import productRoutes from "./routes/product.route.js";
import fs from 'fs';

// Configure environment variables
dotenv.config();

// Get proper __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration checks
if (!process.env.MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI is not defined in .env");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/products", productRoutes);

// Production setup
if (process.env.NODE_ENV === "production") {
  // Path to frontend build (go up one level from backend to frontend/dist)
  const staticPath = path.join(__dirname, '..', 'frontend', 'dist');
  
  // Debugging: Log the resolved path
  console.log("Resolved static path:", staticPath);
  
  // Verify the path exists
  if (!fs.existsSync(staticPath)) {
    console.error("❌ Frontend build not found at:", staticPath);
    console.log("Run 'npm run build' in the frontend directory first");
    process.exit(1);
  }

  // Serve static files
  app.use(express.static(staticPath));
  
  // Handle SPA routing - return index.html for all routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
  
  console.log("✅ Frontend being served from:", staticPath);
} else {
  // Development route
  app.get("/", (req, res) => {
    res.send("API is running in development mode");
  });
}

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();