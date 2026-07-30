// const buildClassAttendanceSummary = (classData, attendances) => {
//   const summaryByStudent = classData.students.map((student) => {
//     const studentSummary = {
//       student,
//       totalSessions: attendances.length,
//       presentCount: 0,
//       absentCount: 0,
//       attendanceRate: 0,
//     };

//     attendances.forEach((attendance) => {
//       const record = attendance.records.find(
//         (item) => item.student.toString() === student._id.toString(),
//       );

//       if (record?.status === "present") {
//         studentSummary.presentCount += 1;
//       }

//       if (record?.status === "absent") {
//         studentSummary.absentCount += 1;
//       }
//     });

//     if (studentSummary.totalSessions > 0) {
//       studentSummary.attendanceRate = Math.round(
//         (studentSummary.presentCount / studentSummary.totalSessions) * 100,
//       );
//     }

//     return studentSummary;
//   });

//   return {
//     class: {
//       id: classData._id,
//       name: classData.name,
//       schedule: classData.schedule,
//     },
//     totalSessions: attendances.length,
//     students: summaryByStudent,
//   };
// };

// const buildStudentAttendanceSummary = (student, classesWithAttendances) =>
//   classesWithAttendances.map(({ classData, attendances }) => {
//     const sessions = attendances.map((attendance) => {
//       const record = attendance.records.find(
//         (item) => item.student.toString() === student._id.toString(),
//       );

//       return {
//         sessionDate: attendance.sessionDate,
//         status: record?.status || "absent",
//       };
//     });

//     const presentCount = sessions.filter(
//       (session) => session.status === "present",
//     ).length;
//     const absentCount = sessions.filter(
//       (session) => session.status === "absent",
//     ).length;
//     const attendanceRate =
//       sessions.length > 0 ? Math.round((presentCount / sessions.length) * 100) : 0;

//     return {
//       class: {
//         id: classData._id,
//         name: classData.name,
//         schedule: classData.schedule,
//       },
//       totalSessions: sessions.length,
//       presentCount,
//       absentCount,
//       attendanceRate,
//       sessions,
//     };
//   });

// module.exports = {
//   buildClassAttendanceSummary,
//   buildStudentAttendanceSummary,
// };
