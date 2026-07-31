import { apiSlice } from "./apiSlice";

export type MaterialType = "curriculum" | "supplementary";
export type MaterialStatus = "published" | "hidden";

export interface MaterialFile {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

export interface MaterialLink {
  title?: string;
  url: string;
}

export interface MaterialClass {
  _id: string;
  name: string;
  description?: string;
  subject?: string;
  status?: "active" | "paused" | "completed";
}

export interface MaterialCreator {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
}

export interface MaterialItem {
  _id: string;
  classIds: MaterialClass[];
  createdBy: MaterialCreator;
  materialType: MaterialType;
  title: string;
  description: string;
  files: MaterialFile[];
  links: MaterialLink[];
  status: MaterialStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GetMaterialsResponse {
  count: number;
  materials: MaterialItem[];
}

export interface GetMaterialResponse {
  material: MaterialItem;
}

export interface MaterialMutationResponse {
  message: string;
  material: MaterialItem;
}

export interface UploadMaterialFilesResponse {
  message: string;
  count: number;
  files: MaterialFile[];
}

export interface GetMaterialsParams {
  classId?: string;
  materialType?: MaterialType;
  status?: MaterialStatus;
  search?: string;
}

export interface CreateMaterialInput {
  classIds: string[];
  materialType: MaterialType;
  title: string;
  description?: string;
  files?: MaterialFile[];
  links?: MaterialLink[];
  status?: MaterialStatus;
}

export interface UpdateMaterialInput {
  id: string;
  classIds?: string[];
  materialType?: MaterialType;
  title?: string;
  description?: string;
  files?: MaterialFile[];
  links?: MaterialLink[];
  status?: MaterialStatus;
}

export const materialsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMaterials: builder.query<
      GetMaterialsResponse,
      GetMaterialsParams | void
    >({
      query: (params) => ({
        url: "/materials",
        method: "GET",
        params: params ?? undefined,
      }),

      providesTags: (result) =>
        result
          ? [
              { type: "Materials", id: "LIST" },
              ...result.materials.map((material) => ({
                type: "Materials" as const,
                id: material._id,
              })),
            ]
          : [{ type: "Materials", id: "LIST" }],
    }),

    getMaterialById: builder.query<GetMaterialResponse, string>({
      query: (materialId) => ({
        url: `/materials/${materialId}`,
        method: "GET",
      }),

      providesTags: (_result, _error, materialId) => [
        { type: "Materials", id: materialId },
      ],
    }),

    uploadMaterialFiles: builder.mutation<
      UploadMaterialFilesResponse,
      File[]
    >({
      query: (files) => {
        const formData = new FormData();

        files.forEach((file) => {
          formData.append("files", file);
        });

        return {
          url: "/uploads/materials",
          method: "POST",
          body: formData,
        };
      },
    }),

    createMaterial: builder.mutation<
      MaterialMutationResponse,
      CreateMaterialInput
    >({
      query: (body) => ({
        url: "/materials",
        method: "POST",
        body,
      }),

      invalidatesTags: [{ type: "Materials", id: "LIST" }],
    }),

    updateMaterial: builder.mutation<
      MaterialMutationResponse,
      UpdateMaterialInput
    >({
      query: ({ id, ...body }) => ({
        url: `/materials/${id}`,
        method: "PUT",
        body,
      }),

      invalidatesTags: (_result, _error, { id }) => [
        { type: "Materials", id: "LIST" },
        { type: "Materials", id },
      ],
    }),

    deleteMaterial: builder.mutation<{ message: string }, string>({
      query: (materialId) => ({
        url: `/materials/${materialId}`,
        method: "DELETE",
      }),

      invalidatesTags: (_result, _error, materialId) => [
        { type: "Materials", id: "LIST" },
        { type: "Materials", id: materialId },
      ],
    }),
  }),
});

export const {
  useGetMaterialsQuery,
  useGetMaterialByIdQuery,
  useLazyGetMaterialByIdQuery,
  useUploadMaterialFilesMutation,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
} = materialsApi;