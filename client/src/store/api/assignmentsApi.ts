import { apiSlice } from "./apiSlice";

export type AssignmentType = "essay" | "homework" | "project" | "classwork";

export type SubmissionStatus = "submitted" | "late" | "graded" | "returned";

export interface AssignmentFile {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

export interface AssignmentClass {
  _id: string;
  name: string;
  teacher?: string;
  students?: string[];
}

export interface AssignmentTeacher {
  _id: string;
  name: string;
  email: string;
}

export interface AssignmentStudent {
  _id: string;
  name: string;
  email: string;
}

export interface AssignmentSubmission {
  _id: string;
  studentId: AssignmentStudent | string;
  text: string;
  files: AssignmentFile[];
  submittedAt: string;
  status: SubmissionStatus;
  score: number | null;
  feedback: string;
  gradedBy: AssignmentTeacher | string | null;
  gradedAt: string | null;
  resubmissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentItem {
  _id: string;
  classId: AssignmentClass | string;
  teacherId: AssignmentTeacher | string;
  title: string;
  description: string;
  type: AssignmentType;
  dueDate: string;
  maxScore: number;
  attachments: AssignmentFile[];
  submissions?: AssignmentSubmission[];
  submissionCount: number;
  pendingCount: number;
  isPublished: boolean;
  allowLateSubmission: boolean;
  allowResubmission: boolean;
  createdAt: string;
  updatedAt: string;
  hasSubmitted?: boolean;
  mySubmission?: AssignmentSubmission | null;
}

export interface GetAssignmentsResponse {
  assignments: AssignmentItem[];
}

export interface GetAssignmentResponse {
  assignment: AssignmentItem;
}

export interface AssignmentMutationResponse {
  message: string;
  assignment: AssignmentItem;
}

export interface UploadAssignmentFilesResponse {
  message: string;
  count: number;
  files: AssignmentFile[];
}

export interface SubmitAssignmentInput {
  assignmentId: string;
  text?: string;
  files?: AssignmentFile[];
}

export interface SubmitAssignmentResponse {
  message: string;
  submission: AssignmentSubmission;
}

export interface GetAssignmentsParams {
  classId?: string;
}

export interface CreateAssignmentInput {
  classId: string;
  title: string;
  description: string;
  type?: AssignmentType;
  dueDate: string;
  maxScore?: number;
  attachments?: AssignmentFile[];
  isPublished?: boolean;
  allowLateSubmission?: boolean;
  allowResubmission?: boolean;
}

export interface UpdateAssignmentInput {
  id: string;
  title?: string;
  description?: string;
  type?: AssignmentType;
  dueDate?: string;
  maxScore?: number;
  attachments?: AssignmentFile[];
  isPublished?: boolean;
  allowLateSubmission?: boolean;
  allowResubmission?: boolean;
}

export interface GradeSubmissionInput {
  assignmentId: string;
  studentId: string;
  score: number;
  feedback?: string;
}

export interface GradeSubmissionResponse {
  message: string;
  submission: AssignmentSubmission;
}

export const assignmentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAssignments: builder.query<
      GetAssignmentsResponse,
      GetAssignmentsParams | void
    >({
      query: (params) => ({
        url: "/assignments",
        method: "GET",
        params: params ?? undefined,
      }),

      providesTags: (result) =>
        result
          ? [
              { type: "Assignments", id: "LIST" },
              ...result.assignments.map((assignment) => ({
                type: "Assignments" as const,
                id: assignment._id,
              })),
            ]
          : [{ type: "Assignments", id: "LIST" }],
    }),

    getAssignmentById: builder.query<GetAssignmentResponse, string>({
      query: (assignmentId) => ({
        url: `/assignments/${assignmentId}`,
        method: "GET",
      }),

      providesTags: (_result, _error, assignmentId) => [
        { type: "Assignments", id: assignmentId },
      ],
    }),

    uploadAssignmentFiles: builder.mutation<
      UploadAssignmentFilesResponse,
      File[]
    >({
      query: (files) => {
        const formData = new FormData();

        files.forEach((file) => {
          formData.append("files", file);
        });

        return {
          url: "/uploads/assignments",
          method: "POST",
          body: formData,
        };
      },
    }),

    uploadAssignmentSubmissionFiles: builder.mutation<
      UploadAssignmentFilesResponse,
      File[]
    >({
      query: (files) => {
        const formData = new FormData();

        files.forEach((file) => {
          formData.append("files", file);
        });

        return {
          url: "/uploads/assignment-submissions",
          method: "POST",
          body: formData,
        };
      },
    }),
    createAssignment: builder.mutation<
      AssignmentMutationResponse,
      CreateAssignmentInput
    >({
      query: (body) => ({
        url: "/assignments",
        method: "POST",
        body,
      }),

      invalidatesTags: [{ type: "Assignments", id: "LIST" }],
    }),

    updateAssignment: builder.mutation<
      AssignmentMutationResponse,
      UpdateAssignmentInput
    >({
      query: ({ id, ...body }) => ({
        url: `/assignments/${id}`,
        method: "PUT",
        body,
      }),

      invalidatesTags: (_result, _error, { id }) => [
        { type: "Assignments", id: "LIST" },
        { type: "Assignments", id },
      ],
    }),

    deleteAssignment: builder.mutation<{ message: string }, string>({
      query: (assignmentId) => ({
        url: `/assignments/${assignmentId}`,
        method: "DELETE",
      }),

      invalidatesTags: (_result, _error, assignmentId) => [
        { type: "Assignments", id: "LIST" },
        { type: "Assignments", id: assignmentId },
      ],
    }),

    submitAssignment: builder.mutation<
      SubmitAssignmentResponse,
      SubmitAssignmentInput
    >({
      query: ({ assignmentId, text, files }) => ({
        url: `/assignments/${assignmentId}/submit`,
        method: "POST",
        body: {
          text: text ?? "",
          files: files ?? [],
        },
      }),

      invalidatesTags: (_result, _error, { assignmentId }) => [
        { type: "Assignments", id: "LIST" },
        { type: "Assignments", id: assignmentId },
      ],
    }),
    gradeSubmission: builder.mutation<
      GradeSubmissionResponse,
      GradeSubmissionInput
    >({
      query: ({ assignmentId, studentId, score, feedback }) => ({
        url: `/assignments/${assignmentId}/submissions/${studentId}/grade`,
        method: "PATCH",
        body: {
          score,
          feedback,
        },
      }),

      invalidatesTags: (_result, _error, { assignmentId }) => [
        { type: "Assignments", id: "LIST" },
        { type: "Assignments", id: assignmentId },
      ],
    }),
  }),
});

export const {
  useGetAssignmentsQuery,
  useLazyGetAssignmentsQuery,
  useGetAssignmentByIdQuery,
  useLazyGetAssignmentByIdQuery,
  useUploadAssignmentFilesMutation,
  useUploadAssignmentSubmissionFilesMutation,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useSubmitAssignmentMutation,
  useGradeSubmissionMutation,
} = assignmentsApi;
