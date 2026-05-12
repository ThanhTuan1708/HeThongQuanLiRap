const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Nếu chạy local mà thiếu env → dùng default
        const MONGO_URI =
            process.env.MONGO_URI || "mongodb://127.0.0.1:27017/QuanLiRapChieuPhim";

        console.log("🔗 Connecting to MongoDB...");
        console.log("MONGO_URI =", MONGO_URI);

        const conn = await mongoose.connect(MONGO_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ MongoDB Connection Error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;