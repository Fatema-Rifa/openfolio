require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
async function startServer() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`
🚀 ======================================================== 🚀
    Openfolio Backend Server is running!
    Port:          ${PORT}
    Environment:   ${process.env.NODE_ENV || 'development'}
    API Base:      http://localhost:${PORT}/api/v1
    Swagger Docs:  http://localhost:${PORT}/api/docs
🚀 ======================================================== 🚀
    `);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down gracefully...', err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
      console.log('💥 Process terminated!');
    });
  });
}

startServer();
