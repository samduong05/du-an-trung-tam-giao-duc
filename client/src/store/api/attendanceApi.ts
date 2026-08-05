import { apiSlice } from "./apiSlice";

export type AttendanceStatus = "present" | "late" | "excused" | "absent";

export interface AttendanceStudent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface AttendanceClass {
  _id: string;
  name: string;
  description?: string;
  subject: string;
  schedule: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room?: string;
  }[];
}

export interface AttendanceTeacher {
  _id: string;
  name: string;
  email: string;
}

export interface AttendanceRecord {
  studentId: AttendanceStudent;
  status: AttendanceStatus;
  note: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface AttendanceItem {
  _id: string;
  classId: AttendanceClass;
  subject: string;
  teacherId: AttendanceTeacher;
  date: string;
  records: AttendanceRecord[];
  summary: AttendanceSummary;
  isFinalized: boolean;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceResponse {
  message: string;
  attendance: AttendanceItem;
}

export interface AttendanceRecordInput {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface MarkAttendanceInput {
  classId: string;
  date: string;
  records: AttendanceRecordInput[];
  remarks?: string;
}

export interface GetAttendanceByDateInput {
  classId: string;
  date: string;
}

export interface AttendanceWeekStatusItem {
  attendanceId: string;
  classId: string;
  date: string;
  isFinalized: boolean;
}

export interface AttendanceWeekStatusResponse {
  message: string;
  count: number;
  statuses: AttendanceWeekStatusItem[];
}

export interface GetAttendanceWeekStatusInput {
  from: string;
  to: string;
}

export interface AdminAttendanceDayStatusItem {
  attendanceId: string;
  classId: string;
  date: string;
  isFinalized: boolean;
}

export interface AdminAttendanceDayStatusResponse {
  message: string;
  count: number;
  statuses: AdminAttendanceDayStatusItem[];
}

export interface GetAdminAttendanceDayStatusInput {
  date: string;
}

export interface AttendanceReportDetail {
  attendanceId: string;
  class: AttendanceClass;
  subject: string;
  teacher: AttendanceTeacher;
  date: string;
  status: AttendanceStatus;
  note: string;
  isFinalized: boolean;
  remarks: string;
}

export interface AttendanceReportSummary {
  total: number;
  present: number;
  late: number;
  excused: number;
  absent: number;
}

export interface StudentAttendanceReportResponse {
  message: string;
  student: AttendanceStudent;
  class: AttendanceClass | null;
  summary: AttendanceReportSummary;
  details: AttendanceReportDetail[];
}

export interface GetStudentAttendanceReportInput {
  studentId: string;
  classId?: string;
  from?: string;
  to?: string;
}

export interface ClassAttendanceReportStudent {
  student: AttendanceStudent;
  summary: AttendanceReportSummary;
  attendanceRate: number;
}

export interface ClassAttendanceReportClass {
  _id: string;
  name: string;
  description?: string;
  subject: string;
  status: "active" | "paused" | "completed";
  startedAt?: string;
  endedAt?: string;
  teacher: AttendanceTeacher;
}

export interface ClassAttendanceReportResponse {
  message: string;

  class: ClassAttendanceReportClass;

  range: {
    from: string | null;
    to: string | null;
  };

  totalSessions: number;
  totalStudents: number;
  averageAttendanceRate: number;

  students: ClassAttendanceReportStudent[];
}

export interface GetClassAttendanceReportInput {
  classId: string;
  from?: string;
  to?: string;
}

export const attendanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceByClassAndDate: builder.query<
      AttendanceResponse,
      GetAttendanceByDateInput
    >({
      query: ({ classId, date }) => ({
        url: `/attendance/classes/${classId}/by-date`,
        method: "GET",
        params: { date },
      }),
      providesTags: (result, _error, { classId, date }) =>
        result
          ? [
              { type: "Attendance", id: result.attendance._id },
              { type: "Attendance", id: `${classId}-${date}` },
            ]
          : [{ type: "Attendance", id: `${classId}-${date}` }],
    }),

    markAttendance: builder.mutation<AttendanceResponse, MarkAttendanceInput>({
      query: ({ classId, ...body }) => ({
        url: `/attendance/classes/${classId}/mark`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, _error, { classId, date }) => [
        { type: "Attendance", id: `${classId}-${date}` },
        { type: "Attendance", id: "WEEK-STATUS" },
        { type: "Attendance", id: `ADMIN-DAY-STATUS-${date}` },
        ...(result
          ? [{ type: "Attendance" as const, id: result.attendance._id }]
          : []),
      ],
    }),

    finalizeAttendance: builder.mutation<AttendanceResponse, string>({
      query: (attendanceId) => ({
        url: `/attendance/${attendanceId}/finalize`,
        method: "PATCH",
      }),
      invalidatesTags: (result, _error, attendanceId) => [
        { type: "Attendance", id: attendanceId },
        {
          type: "Attendance",
          id: "WEEK-STATUS",
        },
        ...(result
          ? [
              {
                type: "Attendance" as const,
                id: `${result.attendance.classId._id}-${result.attendance.date.slice(
                  0,
                  10,
                )}`,
              },
              {
                type: "Attendance" as const,
                id: `ADMIN-DAY-STATUS-${result.attendance.date.slice(0, 10)}`,
              },
            ]
          : []),
      ],
    }),

    getTeacherAttendanceWeekStatus: builder.query<
      AttendanceWeekStatusResponse,
      GetAttendanceWeekStatusInput
    >({
      query: ({ from, to }) => ({
        url: "/attendance/teacher/week-status",
        method: "GET",
        params: {
          from,
          to,
        },
      }),
      providesTags: [
        {
          type: "Attendance",
          id: "WEEK-STATUS",
        },
      ],
    }),

    getAdminAttendanceDayStatus: builder.query<
      AdminAttendanceDayStatusResponse,
      GetAdminAttendanceDayStatusInput
    >({
      query: ({ date }) => ({
        url: "/attendance/admin/day-status",
        method: "GET",
        params: { date },
      }),
      providesTags: (_result, _error, { date }) => [
        {
          type: "Attendance",
          id: `ADMIN-DAY-STATUS-${date}`,
        },
      ],
    }),

    getStudentAttendanceReport: builder.query<
      StudentAttendanceReportResponse,
      GetStudentAttendanceReportInput
    >({
      query: ({ studentId, classId, from, to }) => ({
        url: `/attendance/students/${studentId}/report`,
        method: "GET",
        params: {
          ...(classId ? { classId } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
      }),
      providesTags: (_result, _error, { studentId, classId }) => [
        {
          type: "Attendance",
          id: classId
            ? `REPORT-${studentId}-${classId}`
            : `REPORT-${studentId}`,
        },
      ],
    }),
    getClassAttendanceReport: builder.query<
      ClassAttendanceReportResponse,
      GetClassAttendanceReportInput
    >({
      query: ({ classId, from, to }) => ({
        url: `/attendance/classes/${classId}/report`,
        method: "GET",
        params: {
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
      }),

      providesTags: (_result, _error, { classId }) => [
        {
          type: "Attendance",
          id: `CLASS-REPORT-${classId}`,
        },
      ],
    }),
  }),
});

export const {
  useGetAttendanceByClassAndDateQuery,
  useLazyGetAttendanceByClassAndDateQuery,
  useMarkAttendanceMutation,
  useFinalizeAttendanceMutation,
  useGetTeacherAttendanceWeekStatusQuery,
  useGetAdminAttendanceDayStatusQuery,
  useGetStudentAttendanceReportQuery,
  useGetClassAttendanceReportQuery,
} = attendanceApi;
