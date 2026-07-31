import { apiSlice } from "./apiSlice";

export type AttendanceStatus = "present" | "absent" | "late";

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

    markAttendance: builder.mutation<
      AttendanceResponse,
      MarkAttendanceInput
    >({
      query: ({ classId, ...body }) => ({
        url: `/attendance/classes/${classId}/mark`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, _error, { classId, date }) => [
        { type: "Attendance", id: `${classId}-${date}` },
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
        ...(result
          ? [
              {
                type: "Attendance" as const,
                id: `${result.attendance.classId._id}-${result.attendance.date.slice(
                  0,
                  10,
                )}`,
              },
            ]
          : []),
      ],
    }),
  }),
});

export const {
  useGetAttendanceByClassAndDateQuery,
  useLazyGetAttendanceByClassAndDateQuery,
  useMarkAttendanceMutation,
  useFinalizeAttendanceMutation,
} = attendanceApi;