import { apiSlice } from "./apiSlice";

export type ClassStatus = "active" | "paused" | "completed";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface ClassSchedule {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room?: string;
}
export type ScheduleConflictType = "teacher" | "student" | "room";

export interface ScheduleConflict {
  id: string;
  type: ScheduleConflictType;

  personId?: string;
  personName?: string;
  personEmail?: string;

  conflictingClassId: string;
  conflictingClassName: string;

  teacherId?: string;
  teacherName?: string;
  teacherEmail?: string;

  dayOfWeek: DayOfWeek;

  startTime: string;
  endTime: string;

  requestedStartTime?: string;
  requestedEndTime?: string;

  conflictingStartTime?: string;
  conflictingEndTime?: string;

  room?: string;
}

export interface ScheduleConflictResponse {
  message: string;
  requiresConfirmation: true;
  conflictCount: number;
  conflicts: ScheduleConflict[];
}

export interface ClassTeacher {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "teacher";
}

export interface ClassStudent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "student";
}

export interface ClassItem {
  _id: string;
  name: string;
  description: string;
  subject: string;
  teacher: ClassTeacher;
  students: ClassStudent[];
  schedule: ClassSchedule[];
  status: ClassStatus;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetClassesResponse {
  message: string;
  count: number;
  classes: ClassItem[];
}

export interface GetClassResponse {
  message: string;
  class: ClassItem;
}

export interface GetMyClassesResponse {
  message: string;
  count: number;
  classes: ClassItem[];
}

export interface GetMyClassResponse {
  message: string;
  class: ClassItem;
}

export interface GetClassesParams {
  status?: ClassStatus;
  search?: string;
}

export interface CreateClassInput {
  name: string;
  subject: string;
  teacherId: string;
  description?: string;
  students?: string[];
  schedule?: ClassSchedule[];
  status?: ClassStatus;
  startedAt?: string;
  endedAt?: string;
  forceSave?: boolean;
}

export interface UpdateClassInput {
  id: string;
  name?: string;
  subject?: string;
  teacherId?: string;
  description?: string;
  students?: string[];
  schedule?: ClassSchedule[];
  status?: ClassStatus;
  startedAt?: string;
  endedAt?: string;
  forceSave?: boolean;
}

export interface UpdateClassStatusInput {
  id: string;
  status: ClassStatus;
}

export interface AssignTeacherInput {
  classId: string;
  teacherId: string;
  forceSave?: boolean;
}

export interface AddStudentToClassInput {
  classId: string;
  studentId: string;
  forceSave?: boolean;
}

export interface RemoveStudentFromClassInput {
  classId: string;
  studentId: string;
}
export interface AvailableStudent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "student";
  isActive: boolean;
}

export interface GetAvailableStudentsResponse {
  message: string;
  count: number;
  students: AvailableStudent[];
}
export const classesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getClasses: builder.query<GetClassesResponse, GetClassesParams | void>({
      query: (params) => ({
        url: "/classes",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Classes"],
    }),

    getClassById: builder.query<GetClassResponse, string>({
      query: (classId) => ({
        url: `/classes/${classId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, classId) => [
        { type: "Classes", id: classId },
      ],
    }),

    getMyClasses: builder.query<GetMyClassesResponse, GetClassesParams | void>({
      query: (params) => ({
        url: "/classes/my-classes",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Classes"],
    }),

    getMyClassById: builder.query<GetMyClassResponse, string>({
      query: (classId) => ({
        url: `/classes/my-classes/${classId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, classId) => [
        { type: "Classes", id: `MY-CLASS-${classId}` },
      ],
    }),

    getAvailableStudents: builder.query<GetAvailableStudentsResponse, string>({
      query: (classId) => ({
        url: `/classes/${classId}/available-students`,
        method: "GET",
      }),
      providesTags: (_result, _error, classId) => [
        { type: "Classes", id: `AVAILABLE-${classId}` },
      ],
    }),
    createClass: builder.mutation<GetClassResponse, CreateClassInput>({
      query: (body) => ({
        url: "/classes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Classes"],
    }),

    updateClass: builder.mutation<GetClassResponse, UpdateClassInput>({
      query: ({ id, ...body }) => ({
        url: `/classes/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Classes",
        { type: "Classes", id },
      ],
    }),

    updateClassStatus: builder.mutation<
      GetClassResponse,
      UpdateClassStatusInput
    >({
      query: ({ id, status }) => ({
        url: `/classes/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Classes",
        { type: "Classes", id },
      ],
    }),

    deleteClass: builder.mutation<{ message: string }, string>({
      query: (classId) => ({
        url: `/classes/${classId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Classes"],
    }),

    assignTeacherToClass: builder.mutation<
      GetClassResponse,
      AssignTeacherInput
    >({
      query: ({ classId, teacherId, forceSave }) => ({
        url: `/classes/${classId}/teachers`,
        method: "POST",
        body: { teacherId },
        forceSave,
      }),
      invalidatesTags: (_result, _error, { classId }) => [
        "Classes",
        { type: "Classes", id: classId },
      ],
    }),

    addStudentToClass: builder.mutation<
      GetClassResponse,
      AddStudentToClassInput
    >({
      query: ({ classId, studentId, forceSave }) => ({
        url: `/classes/${classId}/students`,
        method: "POST",
        body: { studentId },
        forceSave,
      }),
      invalidatesTags: (_result, _error, { classId }) => [
        "Classes",
        { type: "Classes", id: classId },
        { type: "Classes", id: `AVAILABLE-${classId}` },
      ],
    }),

    removeStudentFromClass: builder.mutation<
      GetClassResponse,
      RemoveStudentFromClassInput
    >({
      query: ({ classId, studentId }) => ({
        url: `/classes/${classId}/students/${studentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { classId }) => [
        "Classes",
        { type: "Classes", id: `AVAILABLE-${classId}` },
      ],
    }),
  }),
});

export const {
  useGetClassesQuery,
  useGetClassByIdQuery,
  useLazyGetClassByIdQuery,
  useGetMyClassesQuery,
  useGetMyClassByIdQuery,
  useGetAvailableStudentsQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useUpdateClassStatusMutation,
  useDeleteClassMutation,
  useAssignTeacherToClassMutation,
  useAddStudentToClassMutation,
  useRemoveStudentFromClassMutation,
} = classesApi;
