import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import type { Teacher } from "../../store/api/endpoints";
import {
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
} from "../../store/api/endpoints";

type TeacherFormModalProps = {
  isOpen: boolean;
  teacher?: Teacher | null;
  onClose: () => void;
};

type TeacherFormData = {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

const teacherBaseSchema = z.object({
  name: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().min(1, "Họ và tên không được để trống"),
  ),

  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().email("Email không hợp lệ"),
  ),

  phone: z.preprocess((value) => {
    if (typeof value === "string") {
      const trimmedValue = value.trim();

      return trimmedValue === "" ? undefined : trimmedValue;
    }

    return value;
  }, z.string().optional()),
});

const createTeacherSchema = teacherBaseSchema
  .extend({
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Xác nhận mật khẩu không khớp",
    path: ["confirmPassword"],
  });

const updateTeacherSchema = teacherBaseSchema;

const getErrorMessage = (error: unknown): string | undefined => {
  if (typeof error === "object" && error !== null && "data" in error) {
    const apiError = error as {
      data?: {
        message?: string;
      };
    };

    return apiError.data?.message;
  }

  return undefined;
};

export default function TeacherFormModal({
  isOpen,
  teacher,
  onClose,
}: TeacherFormModalProps) {
  const [createTeacher, { isLoading: isCreating }] =
    useCreateTeacherMutation();

  const [updateTeacher, { isLoading: isUpdating }] =
    useUpdateTeacherMutation();

  const isEditMode = Boolean(teacher);

  const schema = isEditMode
    ? updateTeacherSchema
    : createTeacherSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeacherFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (teacher) {
      reset({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone ?? "",
        password: "",
        confirmPassword: "",
      });

      return;
    }

    reset({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
  }, [isOpen, teacher, reset]);

  if (!isOpen) {
    return null;
  }

  const onSubmit = async (values: TeacherFormData) => {
    if (isEditMode && teacher) {
      try {
        await updateTeacher({
          id: teacher._id,
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone?.trim() || "",
        }).unwrap();

        toast.success("Cập nhật giáo viên thành công");
        reset();
        onClose();
      } catch (error: unknown) {
        toast.error(
          getErrorMessage(error) || "Cập nhật giáo viên thất bại",
        );
      }

      return;
    }

    try {
      await createTeacher({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password ?? "",
        role: "teacher",
        ...(values.phone?.trim()
          ? { phone: values.phone.trim() }
          : {}),
      }).unwrap();

      toast.success("Tạo giáo viên thành công");
      reset();
      onClose();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Tạo giáo viên thất bại");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-modal-title"
        className="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl sm:max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <h3
            id="teacher-modal-title"
            className="min-w-0 wrap-break-word text-lg font-semibold leading-tight text-slate-900"
          >
            {isEditMode ? "Chỉnh sửa giáo viên" : "Thêm giáo viên"}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            <div>
              <label
                htmlFor="teacher-name"
                className="text-sm font-medium text-slate-700"
              >
                Họ và tên
              </label>

              <input
                id="teacher-name"
                {...register("name")}
                autoComplete="name"
                className="mt-1 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-blue-600 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

              {errors.name && (
                <p className="mt-1 wrap-break-word text-xs text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="teacher-email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <input
                id="teacher-email"
                {...register("email")}
                type="email"
                autoComplete="email"
                className="mt-1 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-blue-600 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

              {errors.email && (
                <p className="mt-1 wrap-break-word text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="teacher-phone"
                className="text-sm font-medium text-slate-700"
              >
                Số điện thoại
              </label>

              <input
                id="teacher-phone"
                {...register("phone")}
                type="tel"
                autoComplete="tel"
                className="mt-1 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-blue-600 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

              {errors.phone && (
                <p className="mt-1 wrap-break-word text-xs text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {!isEditMode && (
              <>
                <div>
                  <label
                    htmlFor="teacher-password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Mật khẩu
                  </label>

                  <input
                    id="teacher-password"
                    {...register("password")}
                    type="password"
                    autoComplete="new-password"
                    className="mt-1 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-blue-600 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />

                  {errors.password && (
                    <p className="mt-1 wrap-break-word text-xs text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="teacher-confirm-password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Xác nhận mật khẩu
                  </label>

                  <input
                    id="teacher-confirm-password"
                    {...register("confirmPassword")}
                    type="password"
                    autoComplete="new-password"
                    className="mt-1 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-blue-600 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />

                  {errors.confirmPassword && (
                    <p className="mt-1 wrap-break-word text-xs text-red-600">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-slate-200 bg-white px-4 py-4 min-[420px]:grid-cols-2 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating || isUpdating}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEditMode
                ? isUpdating
                  ? "Đang lưu..."
                  : "Lưu thay đổi"
                : isCreating
                  ? "Đang tạo..."
                  : "Tạo giáo viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}