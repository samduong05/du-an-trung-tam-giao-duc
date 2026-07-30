require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server chạy ở http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Không thể khởi động server");
    process.exit(1);
  }
};

startServer();
