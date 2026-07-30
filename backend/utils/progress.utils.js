// const Class = require("../models/Class.model");
// const Attendance = require("../models/Attendance.model");
// const Quiz = require("../models/Quiz.model");
// const QuizSubmission = require("../models/QuizSubmission.model");
// const EssayAssignment = require("../models/Assignment.model");
// // const EssaySubmission = require("../models/EssaySubmission");

// const buildStudentProgressSummary = async (student) => {
//   const classes = await Class.find({ students: student._id }).sort({
//     createdAt: -1,
//   });

//   return Promise.all(
//     classes.map(async (classData) => {
//       const attendances = await Attendance.find({ class: classData._id });
//       const attendanceSessions = attendances.map((attendance) => {
//         const record = attendance.records.find(
//           (item) => item.student.toString() === student._id.toString(),
//         );

//         return record?.status || "absent";
//       });

//       const presentCount = attendanceSessions.filter(
//         (status) => status === "present",
//       ).length;

//       const attendanceRate =
//         attendanceSessions.length > 0
//           ? Math.round((presentCount / attendanceSessions.length) * 100)
//           : 0;

//       const quizzes = await Quiz.find({ class: classData._id }).select("_id");
//       const quizSubmissions = await QuizSubmission.find({
//         quiz: { $in: quizzes.map((quiz) => quiz._id) },
//         student: student._id,
//       });

//       const quizAverage =
//         quizSubmissions.length > 0
//           ? Math.round(
//               (quizSubmissions.reduce(
//                 (sum, submission) =>
//                   sum + (submission.score / submission.totalQuestions) * 10,
//                 0,
//               ) /
//                 quizSubmissions.length) *
//                 10,
//             ) / 10
//           : 0;

//       const essays = await EssayAssignment.find({
//         class: classData._id,
//       }).select("_id");

//       const essaySubmissions = await EssaySubmission.find({
//         assignment: { $in: essays.map((essay) => essay._id) },
//         student: student._id,
//         status: "graded",
//       });

//       const essayAverage =
//         essaySubmissions.length > 0
//           ? Math.round(
//               (essaySubmissions.reduce(
//                 (sum, submission) => sum + (submission.score || 0),
//                 0,
//               ) /
//                 essaySubmissions.length) *
//                 10,
//             ) / 10
//           : 0;

//       const completedItems =
//         quizSubmissions.length + essaySubmissions.length + presentCount;
//       const totalItems =
//         quizzes.length + essays.length + attendanceSessions.length;

//       const completionRate =
//         totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

//       return {
//         class: {
//           id: classData._id,
//           name: classData.name,
//           schedule: classData.schedule,
//         },
//         attendanceRate,
//         quizAverage,
//         essayAverage,
//         completedItems,
//         totalItems,
//         completionRate,
//       };
//     }),
//   );
// };

// module.exports = {
//   buildStudentProgressSummary,
// };
