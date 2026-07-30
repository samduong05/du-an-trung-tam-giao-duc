const User = require("../models/User.model");
const { buildStudentProgressSummary } = require("../utils/progress.utils");

const getStudentProgressSummary = async (req, res) => {
  try {
    const { studentEmail } = req.query;

    if (!studentEmail) {
      return res.status(400).json({
        message: "Vui long nhap email hoc sinh",
      });
    }

    const student = await User.findOne({
      email: studentEmail.toLowerCase(),
      role: "student",
    });

    if (!student) {
      return res.status(400).json({
        message: "Khong tim thay hoc sinh",
      });
    }

    return res.json({
      summary: await buildStudentProgressSummary(student),
    });
  } catch (error) {
    console.log("Loi lay tien do hoc tap:", error);

    return res.status(500).json({
      message: "Lay tien do hoc tap that bai",
    });
  }
};

module.exports = {
  getStudentProgressSummary,
};
