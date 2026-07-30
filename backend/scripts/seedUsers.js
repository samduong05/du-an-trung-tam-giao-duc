require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User.model");

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("Thiếu MONGODB_URI trong file .env");
    }

    await mongoose.connect(mongoUri);

    const users = [
      {
        name: process.env.ADMIN_NAME || "System Admin",
        email: process.env.ADMIN_EMAIL?.toLowerCase().trim(),
        password: process.env.ADMIN_PASSWORD,
        role: "admin",
      },
      {
        name: process.env.TEACHER_NAME || "Teacher Test",
        email: process.env.TEACHER_EMAIL?.toLowerCase().trim(),
        password: process.env.TEACHER_PASSWORD,
        role: "teacher",
      },
      {
        name: process.env.STUDENT_NAME || "Student Test",
        email: process.env.STUDENT_EMAIL?.toLowerCase().trim(),
        password: process.env.STUDENT_PASSWORD,
        role: "student",
      },
    ];

    for (const userData of users) {
      const { name, email, password, role } = userData;

      if (!email || !password) {
        console.log(`Bỏ qua ${role}: thiếu email hoặc password trong file .env`);
        continue;
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        console.log(
          `Tài khoản ${role} đã tồn tại:`,
          existingUser.email,
        );
        continue;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true,
      });

      console.log(`Tạo ${role} thành công:`, user.email);
    }
  } catch (error) {
    console.error("Seed tài khoản thất bại:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedUsers();