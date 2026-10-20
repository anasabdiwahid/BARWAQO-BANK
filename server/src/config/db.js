import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/barwaqo_bank', {
      autoIndex: true,
    });
    console.log(`[BARWAQO BANK] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[BARWAQO BANK] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

