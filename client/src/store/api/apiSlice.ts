import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../index";

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,

  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: "api",

  baseQuery,

  tagTypes: [
    "User",
    "Users",
    "Classes",
    "Attendance",
    "Assignments",
    "Materials",
    "Quizzes",
    "QuizSubmissions",
  ],

  endpoints: () => ({}),
});
