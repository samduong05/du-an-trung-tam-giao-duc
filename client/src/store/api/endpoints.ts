import { apiSlice } from "./apiSlice";

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "teacher" | "student";
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface GetMeResponse {
  user: AuthUser;
}

export interface MessageResponse {
  message: string;
}
export interface CreateStudentInput {
  name: string;
  email: string;
  password: string;
  role: "student";
  phone?: string;
}

export interface CreateStudentResponse {
  message: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: "student";
    isActive: boolean;
  };
}

export interface DashboardUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "teacher" | "student";
  isActive: boolean;
  createdAt?: string;
}

export interface GetAllUsersResponse {
  message: string;
  count: number;
  users: DashboardUser[];
}
export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginInput>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    logout: builder.mutation<MessageResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    getMe: builder.query<GetMeResponse, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
    }),

    changePassword: builder.mutation<
      MessageResponse,
      {
        currentPassword: string;
        newPassword: string;
      }
    >({
      query: (data) => ({
        url: "/auth/change-password",
        method: "PUT",
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useChangePasswordMutation,
} = authApi;

export interface Teacher {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "teacher";
  isActive: boolean;
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "student";
  isActive: boolean;
  createdAt: string;
}

export interface GetUsersResponse {
  message: string;
  count: number;
  users: Teacher[];
}

export interface GetStudentsResponse {
  message: string;
  count: number;
  users: Student[];
}

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<GetAllUsersResponse, void>({
      query: () => ({
        url: "/users",
        method: "GET",
      }),
      providesTags: ["Users"],
    }),
    // Specific endpoint to fetch teachers using backend's ?role=teacher query
    getTeachers: builder.query<GetUsersResponse, void>({
      query: () => ({
        url: "/users",
        params: { role: "teacher" },
        method: "GET",
      }),
      providesTags: ["Users"],
    }),
    // Create a new teacher using backend POST /users
    createTeacher: builder.mutation<
      { message: string; user: any },
      {
        name: string;
        email: string;
        password: string;
        role: "teacher";
        phone?: string;
      }
    >({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    updateTeacherStatus: builder.mutation<
      { message: string; user: any },
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body: { isActive },
      }),
      invalidatesTags: ["Users"],
    }),
    updateTeacher: builder.mutation<
      { message: string; user: any },
      { id: string; name: string; email: string; phone?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    getStudents: builder.query<GetStudentsResponse, void>({
      query: () => ({
        url: "/users",
        params: { role: "student" },
        method: "GET",
      }),
      providesTags: ["Users"],
    }),
    createStudent: builder.mutation<CreateStudentResponse, CreateStudentInput>({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    updateStudent: builder.mutation<
      { message: string; user: any },
      { id: string; name: string; email: string; phone?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    updateStudentStatus: builder.mutation<
      { message: string; user: any },
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body: { isActive },
      }),
      invalidatesTags: ["Users"],
    }),
    deleteStudent: builder.mutation<MessageResponse, string>({
      query: (studentId) => ({
        url: `/users/${studentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
    deleteTeacher: builder.mutation<MessageResponse, string>({
      query: (teacherId) => ({
        url: `/users/${teacherId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetTeachersQuery,
  useCreateTeacherMutation,
  useUpdateTeacherStatusMutation,
  useUpdateTeacherMutation,
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateStudentStatusMutation,
  useDeleteStudentMutation,
  useDeleteTeacherMutation,
} = usersApi;
