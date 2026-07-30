// const Class = require("../models/Class.model");
// const Material = require("../models/Material.model");
// const Attendance = require("../models/Attendance.model");

// const getClassWithDetails = async (classId) => {
//   return Class.findById(classId)
//     .populate("teacher", "name email role phone")
//     .populate("students", "name email role phone")
//     .sort({ createdAt: -1 });
// };
// const isTeacherOfClass = (req, classData) => {
//   return (
//     req.user.role === "teacher" &&
//     classData.teacher.toString() === req.user.userId
//   );
// };
// const getMaterialsByClass = (classId) =>
//   Material.find({ class: classId })
//     .populate("uploadedBy", "name email")
//     .sort({ createdAt: -1 });

// const getAttendancesByClass = (classId) =>
//   Attendance.find({ class: classId })
//     .populate("records.student", "name email")
//     .populate("markedBy", "name email")
//     .sort({ sessionDate: -1 });

// const canAccessClass = (classData, viewer) => {
//   if (!viewer) {
//     return false;
//   }

//   if (viewer.role === "teacher") {
//     return classData.teacher.toString() === viewer._id.toString();
//   }

//   if (viewer.role === "student") {
//     return classData.students.some(
//       (studentId) => studentId.toString() === viewer._id.toString(),
//     );
//   }

//   return false;
// };

// const canViewClassMaterials = canAccessClass;

// module.exports = {
//   getClassWithDetails,
//   isTeacherOfClass,
//   getMaterialsByClass,
//   getAttendancesByClass,
//   canAccessClass,
//   canViewClassMaterials,
// };
