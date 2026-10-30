const mongoose = require('mongoose');

const connectDB = async () => {
  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI || MONGODB_URI.includes('<db_password>') || MONGODB_URI.includes('YOUR_PASSWORD')) {
    console.error('Set a real MONGODB_URI (with your DB password) in .env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
