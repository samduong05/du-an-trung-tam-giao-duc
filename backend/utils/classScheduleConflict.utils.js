const Class = require("../models/Class.model");

const ACTIVE_CLASS_STATUS = "active";

const CONFLICT_TYPES = {
  TEACHER: "teacher",
  STUDENT: "student",
  ROOM: "room",
};

/**
 * Chuyển ObjectId hoặc document MongoDB thành chuỗi ID.
 */
const getObjectIdString = (value) => {
  if (!value) {
    return "";
  }

  if (value._id) {
    return value._id.toString();
  }

  return value.toString();
};

/**
 * Chuẩn hóa tên phòng để:
 * " Phòng 103 " và "phòng 103" được coi là cùng một phòng.
 */
const normalizeRoom = (room) => {
  if (typeof room !== "string") {
    return "";
  }

  return room.trim().toLowerCase();
};

/**
 * Hai khoảng giờ được coi là trùng khi:
 *
 * newStart < existingEnd
 * và
 * newEnd > existingStart
 *
 * Ví dụ:
 * 08:00 - 10:00 và 09:00 - 11:00 => trùng.
 * 08:00 - 10:00 và 10:00 - 12:00 => không trùng.
 */
const isTimeOverlap = (
  firstStartTime,
  firstEndTime,
  secondStartTime,
  secondEndTime,
) => {
  if (!firstStartTime || !firstEndTime || !secondStartTime || !secondEndTime) {
    return false;
  }

  return firstStartTime < secondEndTime && firstEndTime > secondStartTime;
};

/**
 * Chuyển giá trị ngày thành Date.
 *
 * Nếu ngày không tồn tại hoặc không hợp lệ thì trả về null,
 * được hiểu là không giới hạn đầu hoặc cuối.
 */
const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

/**
 * Kiểm tra hai khoảng ngày hoạt động của lớp có giao nhau không.
 *
 * Không có startedAt:
 * - được hiểu là bắt đầu không giới hạn.
 *
 * Không có endedAt:
 * - được hiểu là kết thúc không giới hạn.
 */
const isDateRangeOverlap = (
  firstStartedAt,
  firstEndedAt,
  secondStartedAt,
  secondEndedAt,
) => {
  const firstStart = parseDate(firstStartedAt);
  const firstEnd = parseDate(firstEndedAt);
  const secondStart = parseDate(secondStartedAt);
  const secondEnd = parseDate(secondEndedAt);

  if (firstEnd && secondStart && firstEnd < secondStart) {
    return false;
  }

  if (secondEnd && firstStart && secondEnd < firstStart) {
    return false;
  }

  return true;
};

/**
 * Chuẩn hóa schedule từ request hoặc document Mongoose.
 */
const normalizeSchedule = (schedule) => {
  if (!Array.isArray(schedule)) {
    return [];
  }

  return schedule
    .filter(
      (scheduleItem) =>
        scheduleItem &&
        scheduleItem.dayOfWeek &&
        scheduleItem.startTime &&
        scheduleItem.endTime,
    )
    .map((scheduleItem) => ({
      dayOfWeek: scheduleItem.dayOfWeek,
      startTime: scheduleItem.startTime.trim(),
      endTime: scheduleItem.endTime.trim(),
      room:
        typeof scheduleItem.room === "string" ? scheduleItem.room.trim() : "",
    }));
};

/**
 * Trả về phần thời gian thực sự bị giao nhau.
 */
const getOverlappingTime = (
  firstStartTime,
  firstEndTime,
  secondStartTime,
  secondEndTime,
) => {
  return {
    startTime:
      firstStartTime > secondStartTime ? firstStartTime : secondStartTime,
    endTime: firstEndTime < secondEndTime ? firstEndTime : secondEndTime,
  };
};

/**
 * Lấy các học sinh xuất hiện trong cả lớp mới và lớp đang tồn tại.
 */
const getConflictingStudents = (proposedStudentIds, existingStudents) => {
  const proposedStudentIdSet = new Set(
    (proposedStudentIds ?? []).map(getObjectIdString),
  );

  return (existingStudents ?? []).filter((student) =>
    proposedStudentIdSet.has(getObjectIdString(student)),
  );
};

/**
 * Thêm conflict nhưng không cho phép bản ghi trùng lặp.
 */
const addUniqueConflict = (conflicts, conflictKeys, conflictKey, conflict) => {
  if (conflictKeys.has(conflictKey)) {
    return;
  }

  conflictKeys.add(conflictKey);
  conflicts.push(conflict);
};

/**
 * Kiểm tra xung đột lịch.
 *
 * proposedClass:
 * {
 *   teacherId,
 *   studentIds,
 *   schedule,
 *   status,
 *   startedAt,
 *   endedAt
 * }
 *
 * options:
 * {
 *   excludeClassId,
 *   conflictTypes
 * }
 */
const findClassScheduleConflicts = async (proposedClass, options = {}) => {
  const {
    excludeClassId,
    conflictTypes = [
      CONFLICT_TYPES.TEACHER,
      CONFLICT_TYPES.STUDENT,
      CONFLICT_TYPES.ROOM,
    ],
  } = options;

  /*
   * Lớp paused hoặc completed không chiếm lịch.
   */
  if (proposedClass.status !== ACTIVE_CLASS_STATUS) {
    return [];
  }

  const proposedSchedule = normalizeSchedule(proposedClass.schedule);

  if (proposedSchedule.length === 0) {
    return [];
  }

  const enabledConflictTypes = new Set(conflictTypes);

  const classFilter = {
    status: ACTIVE_CLASS_STATUS,
  };

  /*
   * Khi sửa lớp hoặc thay đổi thành viên,
   * phải loại chính lớp hiện tại khỏi kết quả.
   */
  if (excludeClassId) {
    classFilter._id = {
      $ne: excludeClassId,
    };
  }

  const existingClasses = await Class.find(classFilter)
    .populate("teacher", "_id name email phone role")
    .populate("students", "_id name email phone role")
    .lean();

  const conflicts = [];
  const conflictKeys = new Set();

  const proposedTeacherId = getObjectIdString(proposedClass.teacherId);

  for (const existingClass of existingClasses) {
    const hasDateOverlap = isDateRangeOverlap(
      proposedClass.startedAt,
      proposedClass.endedAt,
      existingClass.startedAt,
      existingClass.endedAt,
    );

    if (!hasDateOverlap) {
      continue;
    }

    const existingSchedule = normalizeSchedule(existingClass.schedule);

    const existingTeacherId = getObjectIdString(existingClass.teacher);

    const conflictingStudents = getConflictingStudents(
      proposedClass.studentIds,
      existingClass.students,
    );

    for (
      let proposedScheduleIndex = 0;
      proposedScheduleIndex < proposedSchedule.length;
      proposedScheduleIndex += 1
    ) {
      const proposedScheduleItem = proposedSchedule[proposedScheduleIndex];

      for (
        let existingScheduleIndex = 0;
        existingScheduleIndex < existingSchedule.length;
        existingScheduleIndex += 1
      ) {
        const existingScheduleItem = existingSchedule[existingScheduleIndex];

        if (proposedScheduleItem.dayOfWeek !== existingScheduleItem.dayOfWeek) {
          continue;
        }

        const hasTimeOverlap = isTimeOverlap(
          proposedScheduleItem.startTime,
          proposedScheduleItem.endTime,
          existingScheduleItem.startTime,
          existingScheduleItem.endTime,
        );

        if (!hasTimeOverlap) {
          continue;
        }

        const overlappingTime = getOverlappingTime(
          proposedScheduleItem.startTime,
          proposedScheduleItem.endTime,
          existingScheduleItem.startTime,
          existingScheduleItem.endTime,
        );

        /*
         * 1. Trùng giáo viên
         */
        if (
          enabledConflictTypes.has(CONFLICT_TYPES.TEACHER) &&
          proposedTeacherId &&
          proposedTeacherId === existingTeacherId
        ) {
          const conflictKey = [
            CONFLICT_TYPES.TEACHER,
            existingClass._id,
            proposedScheduleIndex,
            existingScheduleIndex,
            proposedTeacherId,
          ].join(":");

          addUniqueConflict(conflicts, conflictKeys, conflictKey, {
            id: conflictKey,
            type: CONFLICT_TYPES.TEACHER,

            personId: existingTeacherId,
            personName: existingClass.teacher?.name ?? "",
            personEmail: existingClass.teacher?.email ?? "",

            conflictingClassId: existingClass._id.toString(),
            conflictingClassName: existingClass.name,

            dayOfWeek: proposedScheduleItem.dayOfWeek,
            startTime: overlappingTime.startTime,
            endTime: overlappingTime.endTime,

            requestedStartTime: proposedScheduleItem.startTime,
            requestedEndTime: proposedScheduleItem.endTime,

            conflictingStartTime: existingScheduleItem.startTime,
            conflictingEndTime: existingScheduleItem.endTime,

            room: existingScheduleItem.room || proposedScheduleItem.room || "",
          });
        }

        /*
         * 2. Trùng học sinh
         */
        if (
          enabledConflictTypes.has(CONFLICT_TYPES.STUDENT) &&
          conflictingStudents.length > 0
        ) {
          for (const student of conflictingStudents) {
            const studentId = getObjectIdString(student);

            const conflictKey = [
              CONFLICT_TYPES.STUDENT,
              existingClass._id,
              proposedScheduleIndex,
              existingScheduleIndex,
              studentId,
            ].join(":");

            addUniqueConflict(conflicts, conflictKeys, conflictKey, {
              id: conflictKey,
              type: CONFLICT_TYPES.STUDENT,

              personId: studentId,
              personName: student.name ?? "",
              personEmail: student.email ?? "",

              conflictingClassId: existingClass._id.toString(),
              conflictingClassName: existingClass.name,

              teacherId: existingTeacherId,
              teacherName: existingClass.teacher?.name ?? "",
              teacherEmail: existingClass.teacher?.email ?? "",

              dayOfWeek: proposedScheduleItem.dayOfWeek,
              startTime: overlappingTime.startTime,
              endTime: overlappingTime.endTime,

              requestedStartTime: proposedScheduleItem.startTime,
              requestedEndTime: proposedScheduleItem.endTime,

              conflictingStartTime: existingScheduleItem.startTime,
              conflictingEndTime: existingScheduleItem.endTime,

              room: existingScheduleItem.room || "",
            });
          }
        }

        /*
         * 3. Trùng phòng
         */
        const proposedRoom = normalizeRoom(proposedScheduleItem.room);

        const existingRoom = normalizeRoom(existingScheduleItem.room);

        if (
          enabledConflictTypes.has(CONFLICT_TYPES.ROOM) &&
          proposedRoom &&
          proposedRoom === existingRoom
        ) {
          const conflictKey = [
            CONFLICT_TYPES.ROOM,
            existingClass._id,
            proposedScheduleIndex,
            existingScheduleIndex,
            proposedRoom,
          ].join(":");

          addUniqueConflict(conflicts, conflictKeys, conflictKey, {
            id: conflictKey,
            type: CONFLICT_TYPES.ROOM,

            room: existingScheduleItem.room,

            conflictingClassId: existingClass._id.toString(),
            conflictingClassName: existingClass.name,

            teacherId: existingTeacherId,
            teacherName: existingClass.teacher?.name ?? "",
            teacherEmail: existingClass.teacher?.email ?? "",

            dayOfWeek: proposedScheduleItem.dayOfWeek,
            startTime: overlappingTime.startTime,
            endTime: overlappingTime.endTime,

            requestedStartTime: proposedScheduleItem.startTime,
            requestedEndTime: proposedScheduleItem.endTime,

            conflictingStartTime: existingScheduleItem.startTime,
            conflictingEndTime: existingScheduleItem.endTime,
          });
        }
      }
    }
  }

  return conflicts;
};

module.exports = {
  CONFLICT_TYPES,
  normalizeRoom,
  normalizeSchedule,
  isTimeOverlap,
  isDateRangeOverlap,
  findClassScheduleConflicts,
};
