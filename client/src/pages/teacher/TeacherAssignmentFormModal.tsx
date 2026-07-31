import { useEffect, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  Loader2,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useUploadAssignmentFilesMutation,
  type AssignmentFile,
  type AssignmentItem,
  type AssignmentType,
} from "../../store/api/assignmentsApi";

const assignmentFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tên bài tập không được để trống")
    .max(200, "Tên bài tập không được vượt quá 200 ký tự"),

  description: z
    .string()
    .trim()
    .min(1, "Mô tả bài tập không được để trống"),

  type: z.enum(["essay", "homework", "project", "classwork"]),

  dueDate: z
    .string()
    .min(1, "Vui lòng chọn hạn nộp"),

  maxScore: z.coerce
    .number()
    .min(1, "Điểm tối đa phải lớn hơn hoặc bằng 1"),

  isPublished: z.boolean(),

  allowLateSubmission: z.boolean(),

  allowResubmission: z.boolean(),
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

interface TeacherAssignmentFormModalProps {
  isOpen: boolean;
  classId: string;
  assignment?: AssignmentItem | null;
  onClose: () => void;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const allowedExtensions = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "txt",
  "jpg",
  "jpeg",
  "png",
  "webp",
];

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

const toDateTimeLocalValue = (dateValue: string): string => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
};

const getDefaultDueDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(23, 59, 0, 0);

  return toDateTimeLocalValue(date.toISOString());
};

const formatFileSize = (size?: number): string => {
  if (size === undefined) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() ?? "";
};

export default function TeacherAssignmentFormModal({
  isOpen,
  classId,
  assignment,
  onClose,
}: TeacherAssignmentFormModalProps) {
  const isEditMode = Boolean(assignment);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<
    AssignmentFile[]
  >([]);

  const [uploadAssignmentFiles, { isLoading: isUploading }] =
    useUploadAssignmentFilesMutation();

  const [createAssignment, { isLoading: isCreating }] =
    useCreateAssignmentMutation();

  const [updateAssignment, { isLoading: isUpdating }] =
    useUpdateAssignmentMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),

    defaultValues: {
      title: "",
      description: "",
      type: "homework",
      dueDate: getDefaultDueDate(),
      maxScore: 10,
      isPublished: true,
      allowLateSubmission: false,
      allowResubmission: false,
    },
  });

  const isSubmitting = isUploading || isCreating || isUpdating;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (assignment) {
      reset({
        title: assignment.title,
        description: assignment.description,
        type: assignment.type,
        dueDate: toDateTimeLocalValue(assignment.dueDate),
        maxScore: assignment.maxScore,
        isPublished: assignment.isPublished,
        allowLateSubmission: assignment.allowLateSubmission,
        allowResubmission: assignment.allowResubmission,
      });

      setExistingAttachments(assignment.attachments ?? []);
    } else {
      reset({
        title: "",
        description: "",
        type: "homework",
        dueDate: getDefaultDueDate(),
        maxScore: 10,
        isPublished: true,
        allowLateSubmission: false,
        allowResubmission: false,
      });

      setExistingAttachments([]);
    }

    setSelectedFiles([]);
  }, [assignment, isOpen, reset]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isSubmitting, onClose]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files ?? []);

    if (newFiles.length === 0) {
      return;
    }

    const totalFileCount =
      existingAttachments.length + selectedFiles.length + newFiles.length;

    if (totalFileCount > MAX_FILES) {
      toast.error(`Mỗi bài tập chỉ được đính kèm tối đa ${MAX_FILES} file`);
      event.target.value = "";
      return;
    }

    const invalidExtensionFile = newFiles.find(
      (file) => !allowedExtensions.includes(getFileExtension(file.name)),
    );

    if (invalidExtensionFile) {
      toast.error(`Định dạng file "${invalidExtensionFile.name}" không được hỗ trợ`);
      event.target.value = "";
      return;
    }

    const oversizedFile = newFiles.find(
      (file) => file.size > MAX_FILE_SIZE,
    );

    if (oversizedFile) {
      toast.error(`File "${oversizedFile.name}" vượt quá 10 MB`);
      event.target.value = "";
      return;
    }

    const duplicatedFile = newFiles.find((newFile) =>
      selectedFiles.some(
        (currentFile) =>
          currentFile.name === newFile.name &&
          currentFile.size === newFile.size,
      ),
    );

    if (duplicatedFile) {
      toast.error(`File "${duplicatedFile.name}" đã được chọn`);
      event.target.value = "";
      return;
    }

    setSelectedFiles((currentFiles) => [...currentFiles, ...newFiles]);

    event.target.value = "";
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  const handleRemoveExistingFile = (index: number) => {
    setExistingAttachments((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    onClose();
  };

  const onSubmit = async (formData: AssignmentFormData) => {
    try {
      let uploadedFiles: AssignmentFile[] = [];

      if (selectedFiles.length > 0) {
        const uploadResponse = await uploadAssignmentFiles(
          selectedFiles,
        ).unwrap();

        uploadedFiles = uploadResponse.files;
      }

      const attachments = [...existingAttachments, ...uploadedFiles];

      const assignmentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type as AssignmentType,
        dueDate: new Date(formData.dueDate).toISOString(),
        maxScore: formData.maxScore,
        attachments,
        isPublished: formData.isPublished,
        allowLateSubmission: formData.allowLateSubmission,
        allowResubmission: formData.allowResubmission,
      };

      if (assignment) {
        await updateAssignment({
          id: assignment._id,
          ...assignmentData,
        }).unwrap();

        toast.success("Cập nhật bài tập thành công");
      } else {
        await createAssignment({
          classId,
          ...assignmentData,
        }).unwrap();

        toast.success("Tạo bài tập thành công");
      }

      onClose();
    } catch (error) {
      toast.error(
        getErrorMessage(error) ??
          (isEditMode
            ? "Cập nhật bài tập thất bại"
            : "Tạo bài tập thất bại"),
      );
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        aria-label="Đóng cửa sổ"
        onClick={handleClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-modal-title"
        className="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl sm:max-h-[92vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div>
            <h2
              id="assignment-modal-title"
              className="text-lg font-semibold text-slate-800"
            >
              {isEditMode ? "Chỉnh sửa bài tập" : "Thêm bài tập"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Thiết lập nội dung, thời hạn và quyền nộp bài.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
            <div>
              <label
                htmlFor="assignment-title"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Tên bài tập <span className="text-red-500">*</span>
              </label>

              <input
                id="assignment-title"
                type="text"
                {...register("title")}
                placeholder="Ví dụ: Bài tập ngữ pháp tuần 3"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                  errors.title
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                }`}
              />

              {errors.title && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="assignment-description"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Mô tả <span className="text-red-500">*</span>
              </label>

              <textarea
                id="assignment-description"
                rows={5}
                {...register("description")}
                placeholder="Nhập yêu cầu và hướng dẫn làm bài..."
                className={`w-full resize-y rounded-lg border px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                  errors.description
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                }`}
              />

              {errors.description && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="assignment-type"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Loại bài tập
                </label>

                <select
                  id="assignment-type"
                  {...register("type")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="homework">Bài tập về nhà</option>
                  <option value="classwork">Bài tập trên lớp</option>
                  <option value="essay">Bài luận</option>
                  <option value="project">Dự án</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="assignment-max-score"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Điểm tối đa
                </label>

                <input
                  id="assignment-max-score"
                  type="number"
                  min={1}
                  step="0.5"
                  {...register("maxScore")}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:ring-2 ${
                    errors.maxScore
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />

                {errors.maxScore && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.maxScore.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="assignment-due-date"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Hạn nộp <span className="text-red-500">*</span>
              </label>

              <input
                id="assignment-due-date"
                type="datetime-local"
                {...register("dueDate")}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:ring-2 ${
                  errors.dueDate
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                }`}
              />

              {errors.dueDate && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.dueDate.message}
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    File đính kèm
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Tối đa 5 file, mỗi file không quá 10 MB.
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  <Upload className="h-4 w-4" />
                  Chọn file

                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    disabled={
                      isSubmitting ||
                      existingAttachments.length + selectedFiles.length >=
                        MAX_FILES
                    }
                    className="hidden"
                  />
                </label>
              </div>

              {existingAttachments.length === 0 &&
              selectedFiles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center">
                  <Paperclip className="mx-auto h-7 w-7 text-slate-400" />

                  <p className="mt-2 text-sm text-slate-500">
                    Chưa có file đính kèm
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {existingAttachments.map((file, index) => (
                    <div
                      key={`${file.url}-${index}`}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
                    >
                      <FileText className="h-5 w-5 shrink-0 text-slate-400" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {file.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          File đã tải lên
                          {file.size ? ` · ${formatFileSize(file.size)}` : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExistingFile(index)}
                        disabled={isSubmitting}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label={`Xóa ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/40 px-3 py-2.5"
                    >
                      <FileText className="h-5 w-5 shrink-0 text-blue-500" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {file.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          Chờ tải lên · {formatFileSize(file.size)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedFile(index)}
                        disabled={isSubmitting}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label={`Bỏ chọn ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  {...register("isPublished")}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-700">
                    Công khai bài tập
                  </span>

                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    Học sinh có thể xem và nộp bài ngay sau khi tạo.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  {...register("allowLateSubmission")}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-700">
                    Cho phép nộp muộn
                  </span>

                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    Học sinh vẫn có thể nộp sau thời hạn và bài sẽ được đánh dấu
                    nộp muộn.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  {...register("allowResubmission")}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-700">
                    Cho phép nộp lại
                  </span>

                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    Bài nộp mới sẽ thay thế nội dung và kết quả chấm trước đó.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}

              {isUploading
                ? "Đang tải file..."
                : isEditMode
                  ? "Lưu thay đổi"
                  : "Tạo bài tập"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}