import mongoose from "mongoose";

export const connectDB = async () => {
  // Connection configuration
  const options = {
    serverSelectionTimeoutMS: 5000,  // Timeout after 5s instead of 30s
    maxPoolSize: 10,                // Maximum number of sockets in the connection pool
  };

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log(`Connection Pool Size: ${conn.connections.length}`);
    
    return conn;
  } catch (error) {
    console.error("\x1b[31m", "MongoDB Connection Failed:", error.message, "\x1b[0m");
    
    // Enhanced error diagnostics
    if (error.name === 'MongooseServerSelectionError') {
      console.error("This typically indicates:");
      console.error("- Network connectivity issues");
      console.error("- Incorrect connection string");
      console.error("- MongoDB service not running");
      console.error("- Firewall blocking connection");
    }
    
    process.exit(1);
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('\x1b[32m', 'Mongoose default connection open', '\x1b[0m');
});

mongoose.connection.on('error', (err) => {
  console.error('\x1b[31m', `Mongoose connection error: ${err}`, '\x1b[0m');
});

mongoose.connection.on('disconnected', () => {
  console.log('\x1b[33m', 'Mongoose default connection disconnected', '\x1b[0m');
});

// Graceful shutdown handlers
const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Closing MongoDB connection...`);
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed gracefully');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

// Handle different shutdown signals
process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => shutdown('SIGTERM')); // Kubernetes/Docker stop
process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Nodemon restart

// Export the mongoose instance for potential model registration
export const mongooseInstance = mongoose;