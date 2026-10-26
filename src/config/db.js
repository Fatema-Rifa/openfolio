const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers to prevent querySrv ECONNREFUSED on Windows / local ISP DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Ignore if custom DNS is not permitted by environment
}

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/openfolio';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (error.message.includes('Could not connect to any servers') || error.message.includes('whitelist')) {
      console.error('\n🔒 IP Whitelist Required:');
      console.error('1. Go to MongoDB Atlas (https://cloud.mongodb.com)');
      console.error('2. Navigate to: Security -> Network Access');
      console.error('3. Click "+ ADD IP ADDRESS"');
      console.error('4. Choose "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0) or add your current IP address.');
      console.error('5. Wait 1 minute for Atlas to apply the rule and try again.\n');
    } else {
      console.error('💡 Tip: Make sure your MongoDB service is running locally, or configure a valid MONGO_URI in your .env file.');
    }

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
