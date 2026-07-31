import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { useGetClassesQuery } from "../../../store/api/classesApi";
import {
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useUploadMaterialFilesMutation,
  type MaterialFile,
  type MaterialItem,
  type MaterialLink,
  type MaterialStatus,
  type MaterialType,
} from "../../../store/api/materialsApi";

interface AdminMaterialFormModalProps {
  material: MaterialItem | null;
  defaultMaterialType: MaterialType;
  onClose: () => void;
}

interface FormState {
  title: string;
  description: string;
  status: MaterialStatus;
  classIds: string[];
  links: MaterialLink[];
  files: MaterialFile[];
}

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

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const formatFileSize = (size?: number): string => {
  if (!size || size <= 0) {
    return "";
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AdminMaterialFormModal({
  material,
  defaultMaterialType,
  onClose,
}: AdminMaterialFormModalProps) {
  const materialType = material?.materialType ?? defaultMaterialType;

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    status: "published",
    classIds: [],
    links: [],
    files: [],
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [classSearch, setClassSearch] = useState("");

  const { data: classesData, isLoading: isLoadingClasses } =
    useGetClassesQuery();

  const [createMaterial, { isLoading: isCreating }] =
    useCreateMaterialMutation();
  const [updateMaterial, { isLoading: isUpdating }] =
    useUpdateMaterialMutation();
  const [uploadMaterialFiles, { isLoading: isUploading }] =
    useUploadMaterialFilesMutation();

  const isSubmitting = isCreating || isUpdating || isUploading;
  const classes = classesData?.classes ?? [];

  const filteredClasses = useMemo(() => {
    const keyword = classSearch.trim().toLowerCase();

    if (!keyword) {
      return classes;
    }

    return classes.filter(
      (classItem) =>
        classItem.name.toLowerCase().includes(keyword) ||
        classItem.subject.toLowerCase().includes(keyword),
    );
  }, [classSearch, classes]);

  useEffect(() => {
    if (!material) {
      setForm({
        title: "",
        description: "",
        status: "published",
        classIds: [],
        links: [],
        files: [],
      });
      setSelectedFiles([]);
      return;
    }

    setForm({
      title: material.title,
      description: material.description,
      status: material.status,
      classIds: material.classIds.map((classItem) => classItem._id),
      links: material.links.map((link) => ({
        title: link.title ?? "",
        url: link.url,
      })),
      files: material.files,
    });
    setSelectedFiles([]);
  }, [material]);

  const toggleClass = (classId: string) => {
    setForm((current) => ({
      ...current,
      classIds: current.classIds.includes(classId)
        ? current.classIds.filter((id) => id !== classId)
        : [...current.classIds, classId],
    }));
  };

  const addLink = () => {
    setForm((current) => ({
      ...current,
      links: [...current.links, { title: "", url: "" }],
    }));
  };

  const updateLink = (
    index: number,
    field: keyof MaterialLink,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link,
      ),
    }));
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);

    if (
      form.files.length + selectedFiles.length + files.length >
      5
    ) {
      toast.error("Mỗi tài liệu chỉ được đính kèm tối đa 5 file");
      event.target.value = "";
      return;
    }

    const oversizedFile = files.find(
      (file) => file.size > 10 * 1024 * 1024,
    );

    if (oversizedFile) {
      toast.error(`File "${oversizedFile.name}" vượt quá 10 MB`);
      event.target.value = "";
      return;
    }

    setSelectedFiles((current) => [...current, ...files]);
    event.target.value = "";
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề tài liệu");
      return;
    }

    if (form.classIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một lớp học");
      return;
    }

    const links = form.links
      .map((link) => ({
        title: link.title?.trim() ?? "",
        url: link.url.trim(),
      }))
      .filter((link) => link.title || link.url);

    if (links.some((link) => !link.url || !isValidUrl(link.url))) {
      toast.error("Có liên kết chưa nhập URL hoặc URL không hợp lệ");
      return;
    }

    try {
      let uploadedFiles: MaterialFile[] = [];

      if (selectedFiles.length > 0) {
        const uploadResult =
          await uploadMaterialFiles(selectedFiles).unwrap();
        uploadedFiles = uploadResult.files;
      }

      const body = {
        classIds: form.classIds,
        materialType,
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        links,
        files: [...form.files, ...uploadedFiles],
      };

      if (material) {
        await updateMaterial({
          id: material._id,
          ...body,
        }).unwrap();

        toast.success("Cập nhật tài liệu thành công");
      } else {
        await createMaterial(body).unwrap();
        toast.success("Tạo giáo trình thành công");
      }

      onClose();
    } catch (error) {
      toast.error(
        getErrorMessage(error) ??
          (material
            ? "Không thể cập nhật tài liệu"
            : "Không thể tạo giáo trình"),
      );
    }
  };

  const closeModal = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        aria-label="Đóng biểu mẫu"
        onClick={closeModal}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl sm:max-h-[90vh]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {material
                ? `Chỉnh sửa ${
                    materialType === "curriculum"
                      ? "giáo trình"
                      : "tài liệu bổ sung"
                  }`
                : "Thêm giáo trình chính thức"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {materialType === "curriculum"
                ? "Có thể gán giáo trình cho nhiều lớp."
                : "Admin có toàn quyền quản lý tài liệu này."}
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Tiêu đề
            </label>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Mô tả
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              disabled={isSubmitting}
              rows={4}
              className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Trạng thái
            </label>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as MaterialStatus,
                }))
              }
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="published">Công khai</option>
              <option value="hidden">Ẩn</option>
            </select>
          </div>

          <section>
            <h3 className="text-sm font-semibold text-slate-700">
              Lớp được nhận tài liệu
            </h3>

            <input
              type="search"
              value={classSearch}
              onChange={(event) => setClassSearch(event.target.value)}
              placeholder="Tìm theo tên lớp hoặc môn học"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />

            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
              {isLoadingClasses ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  Đang tải danh sách lớp...
                </p>
              ) : filteredClasses.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  Không tìm thấy lớp học.
                </p>
              ) : (
                filteredClasses.map((classItem) => (
                  <label
                    key={classItem._id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.classIds.includes(classItem._id)}
                      onChange={() => toggleClass(classItem._id)}
                      disabled={isSubmitting}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {classItem.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {classItem.subject}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Đã chọn {form.classIds.length} lớp.
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-700">
                Liên kết
              </h3>

              <button
                type="button"
                onClick={addLink}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                <Plus className="h-4 w-4" />
                Thêm link
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {form.links.map((link, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <input
                    value={link.title ?? ""}
                    onChange={(event) =>
                      updateLink(index, "title", event.target.value)
                    }
                    placeholder="Tên liên kết"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />

                  <input
                    type="url"
                    value={link.url}
                    onChange={(event) =>
                      updateLink(index, "url", event.target.value)
                    }
                    placeholder="https://..."
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        links: current.links.filter(
                          (_, linkIndex) => linkIndex !== index,
                        ),
                      }))
                    }
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-700">
              Tệp đính kèm
            </h3>

            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center hover:border-blue-400 hover:bg-blue-50">
              <Upload className="h-8 w-8 text-slate-400" />
              <span className="mt-2 text-sm font-semibold text-slate-700">
                Chọn file từ máy
              </span>
              <span className="mt-1 text-xs text-slate-500">
                Tối đa 5 file, mỗi file không quá 10 MB
              </span>

              <input
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={isSubmitting}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp"
                className="sr-only"
              />
            </label>

            <div className="mt-4 space-y-2">
              {form.files.map((file, index) => (
                <div
                  key={`${file.url}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <FileText className="h-5 w-5 shrink-0 text-blue-500" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {file.name}
                    </p>
                    {file.size ? (
                      <p className="text-xs text-slate-500">
                        {formatFileSize(file.size)}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        files: current.files.filter(
                          (_, fileIndex) => fileIndex !== index,
                        ),
                      }))
                    }
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2"
                >
                  <FileText className="h-5 w-5 shrink-0 text-blue-600" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedFiles((current) =>
                        current.filter(
                          (_, fileIndex) => fileIndex !== index,
                        ),
                      )
                    }
                    className="rounded-lg p-2 text-red-500 hover:bg-red-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : material ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}

            {isUploading
              ? "Đang tải file..."
              : material
                ? "Lưu thay đổi"
                : "Tạo giáo trình"}
          </button>
        </footer>
      </div>
    </div>
  );
}
