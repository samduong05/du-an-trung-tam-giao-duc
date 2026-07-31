import { useEffect, useState } from "react";
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

import {
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useUploadMaterialFilesMutation,
  type MaterialFile,
  type MaterialItem,
  type MaterialLink,
  type MaterialStatus,
} from "../../../store/api/materialsApi";
import {
  formatFileSize,
  getErrorMessage,
  normalizeLinks,
} from "./material.utils";

interface MaterialFormState {
  title: string;
  description: string;
  status: MaterialStatus;
  links: MaterialLink[];
  files: MaterialFile[];
}

const INITIAL_FORM: MaterialFormState = {
  title: "",
  description: "",
  status: "published",
  links: [],
  files: [],
};

interface SupplementaryMaterialFormModalProps {
  classId: string;
  className: string;
  material: MaterialItem | null;
  onClose: () => void;
}

export default function SupplementaryMaterialFormModal({
  classId,
  className,
  material,
  onClose,
}: SupplementaryMaterialFormModalProps) {
  const [form, setForm] = useState<MaterialFormState>(INITIAL_FORM);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [createMaterial, { isLoading: isCreating }] =
    useCreateMaterialMutation();
  const [updateMaterial, { isLoading: isUpdating }] =
    useUpdateMaterialMutation();
  const [uploadMaterialFiles, { isLoading: isUploading }] =
    useUploadMaterialFilesMutation();

  const isSubmitting = isCreating || isUpdating || isUploading;

  useEffect(() => {
    if (!material) {
      setForm(INITIAL_FORM);
      setSelectedFiles([]);
      return;
    }

    setForm({
      title: material.title,
      description: material.description,
      status: material.status,
      links: material.links.map((link) => ({
        title: link.title ?? "",
        url: link.url,
      })),
      files: material.files,
    });
    setSelectedFiles([]);
  }, [material]);

  const closeModal = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const addLinkField = () => {
    setForm((current) => ({
      ...current,
      links: [...current.links, { title: "", url: "" }],
    }));
  };

  const updateLinkField = (
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

  const removeLinkField = (index: number) => {
    setForm((current) => ({
      ...current,
      links: current.links.filter((_, linkIndex) => linkIndex !== index),
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const totalFileCount =
      form.files.length + selectedFiles.length + files.length;

    if (totalFileCount > 5) {
      toast.error("Mỗi tài liệu chỉ được đính kèm tối đa 5 file");
      event.target.value = "";
      return;
    }

    const maxFileSize = 10 * 1024 * 1024;
    const oversizedFile = files.find((file) => file.size > maxFileSize);

    if (oversizedFile) {
      toast.error(`File "${oversizedFile.name}" vượt quá 10 MB`);
      event.target.value = "";
      return;
    }

    setSelectedFiles((current) => [...current, ...files]);
    event.target.value = "";
  };

  const handleSubmit = async () => {
    const title = form.title.trim();

    if (!title) {
      toast.error("Vui lòng nhập tiêu đề tài liệu");
      return;
    }

    const normalizedLinks = normalizeLinks(form.links);

    if (!normalizedLinks) {
      toast.error("Có liên kết chưa nhập URL hoặc URL không hợp lệ");
      return;
    }

    try {
      let uploadedFiles: MaterialFile[] = [];

      if (selectedFiles.length > 0) {
        const uploadResponse =
          await uploadMaterialFiles(selectedFiles).unwrap();

        uploadedFiles = uploadResponse.files;
      }

      const body = {
        classIds: [classId],
        materialType: "supplementary" as const,
        title,
        description: form.description.trim(),
        status: form.status,
        links: normalizedLinks,
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
        toast.success("Tạo tài liệu thành công");
      }

      onClose();
    } catch (error) {
      toast.error(
        getErrorMessage(error) ??
          (material ? "Không thể cập nhật tài liệu" : "Không thể tạo tài liệu"),
      );
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
        aria-labelledby="material-form-title"
        className="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl sm:max-h-[90vh]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div>
            <h2
              id="material-form-title"
              className="text-lg font-semibold text-slate-900"
            >
              {material
                ? "Chỉnh sửa tài liệu bổ sung"
                : "Thêm tài liệu bổ sung"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{className}</p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
          <div>
            <label
              htmlFor="material-title"
              className="text-sm font-semibold text-slate-700"
            >
              Tiêu đề
            </label>
            <input
              id="material-title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="material-description"
              className="text-sm font-semibold text-slate-700"
            >
              Mô tả
            </label>
            <textarea
              id="material-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              disabled={isSubmitting}
              rows={4}
              className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="material-status"
              className="text-sm font-semibold text-slate-700"
            >
              Trạng thái
            </label>
            <select
              id="material-status"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as MaterialStatus,
                }))
              }
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              <option value="published">Công khai cho học sinh</option>
              <option value="hidden">Ẩn khỏi học sinh</option>
            </select>
          </div>

          <section>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">
                  Liên kết
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Thêm video, tài liệu trực tuyến hoặc website.
                </p>
              </div>

              <button
                type="button"
                onClick={addLinkField}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Thêm link
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {form.links.map((link, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <input
                      value={link.title ?? ""}
                      onChange={(event) =>
                        updateLinkField(index, "title", event.target.value)
                      }
                      placeholder="Tên liên kết"
                      disabled={isSubmitting}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(event) =>
                        updateLinkField(index, "url", event.target.value)
                      }
                      placeholder="https://..."
                      disabled={isSubmitting}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeLinkField(index)}
                      disabled={isSubmitting}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-700">
              Tệp đính kèm
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Tối đa 5 file, mỗi file không quá 10 MB.
            </p>

            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center hover:border-blue-400 hover:bg-blue-50">
              <Upload className="h-8 w-8 text-slate-400" />
              <span className="mt-2 text-sm font-semibold text-slate-700">
                Chọn file từ máy
              </span>
              <input
                type="file"
                multiple
                disabled={isSubmitting}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp"
                className="sr-only"
              />
            </label>

            {form.files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  File đã lưu
                </p>
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
                      disabled={isSubmitting}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  File mới chờ tải lên
                </p>
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
                          current.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                      disabled={isSubmitting}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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
                : "Tạo tài liệu"}
          </button>
        </footer>
      </div>
    </div>
  );
}
