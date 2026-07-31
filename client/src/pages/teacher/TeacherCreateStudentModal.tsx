import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Loader2, X } from "lucide-react";

import { useCreateStudentMutation } from "../../store/api/endpoints";
import { useAddStudentToClassMutation } from "../../store/api/classesApi";

interface TeacherCreateStudentModalProps {
  isOpen: boolean;
  classId: string;
  onClose: () => void;
}

const createStudentSchema = z
  .object({
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

    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),

    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Xác nhận mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type CreateStudentFormData = z.infer<typeof createStudentSchema>;

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

export default function TeacherCreateStudentModal({
  isOpen,
  classId,
  onClose,
}: TeacherCreateStudentModalProps) {
  const [createStudent, { isLoading: isCreatingStudent }] =
    useCreateStudentMutation();

  const [addStudentToClass, { isLoading: isAddingStudent }] =
    useAddStudentToClassMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStudentFormData>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isSubmitting = isCreatingStudent || isAddingStudent;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
  }, [isOpen, reset]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    reset();
    onClose();
  };

  const onSubmit = async (values: CreateStudentFormData) => {
    try {
      const response = await createStudent({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: "student",
        ...(values.phone?.trim() ? { phone: values.phone.trim() } : {}),
      }).unwrap();

      await addStudentToClass({
        classId,
        studentId: response.user._id,
      }).unwrap();

      toast.success("Tạo học sinh và thêm vào lớp thành công");

      reset();
      onClose();
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error) ??
          "Không thể tạo học sinh hoặc thêm học sinh vào lớp",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-create-student-title"
        className="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl sm:max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div>
            <h3
              id="teacher-create-student-title"
              className="text-lg font-semibold text-slate-900"
            >
              Tạo học sinh mới
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Tài khoản sẽ được thêm trực tiếp vào lớp hiện tại.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            <div>
              <label
                htmlFor="teacher-student-name"
                className="text-sm font-medium text-slate-700"
              >
                Họ và tên
              </label>

              <input
                id="teacher-student-name"
                {...register("name")}
                autoComplete="name"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
              />

              {errors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="teacher-student-email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <input
                id="teacher-student-email"
                {...register("email")}
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
              />

              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="teacher-student-phone"
                className="text-sm font-medium text-slate-700"
              >
                Số điện thoại
              </label>

              <input
                id="teacher-student-phone"
                {...register("phone")}
                type="tel"
                autoComplete="tel"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
              />

              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="teacher-student-password"
                className="text-sm font-medium text-slate-700"
              >
                Mật khẩu
              </label>

              <input
                id="teacher-student-password"
                {...register("password")}
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
              />

              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="teacher-student-confirm-password"
                className="text-sm font-medium text-slate-700"
              >
                Xác nhận mật khẩu
              </label>

              <input
                id="teacher-student-confirm-password"
                {...register("confirmPassword")}
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
              />

              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-slate-200 bg-white px-4 py-4 min-[420px]:grid-cols-2 sm:px-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}

              {isCreatingStudent
                ? "Đang tạo tài khoản..."
                : isAddingStudent
                  ? "Đang thêm vào lớp..."
                  : "Tạo và thêm vào lớp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
