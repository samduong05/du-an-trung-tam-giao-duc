// const User = require("../models/User.model");

// const getStudentIdsByEmails = async (studentEmails = []) => {
//   const emails = studentEmails
//     .map((email) => email.trim().toLowerCase())
//     .filter(Boolean);

//   if (emails.length === 0) {
//     return [];
//   }

//   const students = await User.find({
//     email: { $in: emails },
//     role: "student",
//   }).select("_id");

//   return students.map((student) => student._id);
// };

// const findClassViewer = async (email) => {
//   if (!email) {
//     return null;
//   }

//   return User.findOne({ email: email.toLowerCase() });
// };

// const findAdminUser = async (email) => {
//   if (!email) {
//     return null;
//   }

//   return User.findOne({
//     email: email.toLowerCase(),
//     role: "admin",
//   });
// };

// module.exports = {
//   getStudentIdsByEmails,
//   findClassViewer,
//   findAdminUser,
// };
