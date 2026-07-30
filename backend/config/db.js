const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("Thiếu biến môi trường MONGODB_URI");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log("Kết nối MongoDB thành công");
    console.log("Database name:", conn.connection.name);
    console.log("Host:", conn.connection.host);

    return conn;
  } catch (error) {
    console.error(`Kết nối MongoDB thất bại: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
