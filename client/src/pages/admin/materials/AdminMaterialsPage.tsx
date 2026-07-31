import { useMemo, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Files,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  useDeleteMaterialMutation,
  useGetMaterialsQuery,
  type MaterialItem,
  type MaterialStatus,
  type MaterialType,
} from "../../../store/api/materialsApi";
import AdminMaterialFormModal from "./AdminMaterialFormModal";

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

const getFileUrl = (fileUrl: string): string => {
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

  const backendOrigin = apiUrl.replace(/\/api\/v1\/?$/, "");

  return `${backendOrigin}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
};

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function AdminMaterialsPage() {
  const [activeTab, setActiveTab] =
    useState<MaterialType>("curriculum");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<MaterialStatus | "all">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<MaterialItem | null>(null);

  const { data: allMaterialsData } = useGetMaterialsQuery();

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetMaterialsQuery({
    materialType: activeTab,
    search: search.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const [deleteMaterial, { isLoading: isDeleting }] =
    useDeleteMaterialMutation();

  const materials = data?.materials ?? [];

  const counts = useMemo(() => {
    const allMaterials = allMaterialsData?.materials ?? [];

    return {
      curriculum: allMaterials.filter(
        (material) => material.materialType === "curriculum",
      ).length,
      supplementary: allMaterials.filter(
        (material) => material.materialType === "supplementary",
      ).length,
    };
  }, [allMaterialsData]);

  const openCreateForm = () => {
    setSelectedMaterial(null);
    setIsFormOpen(true);
  };

  const openEditForm = (material: MaterialItem) => {
    setSelectedMaterial(material);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setSelectedMaterial(null);
    setIsFormOpen(false);
  };

  const handleDelete = async (material: MaterialItem) => {
    const confirmed = window.confirm(
      `Xóa tài liệu "${material.title}"? Hành động này không thể hoàn tác.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMaterial(material._id).unwrap();
      toast.success("Xóa tài liệu thành công");
    } catch (deleteError) {
      toast.error(
        getErrorMessage(deleteError) ?? "Không thể xóa tài liệu",
      );
    }
  };

  return (
    <>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Quản lý tài liệu
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Quản lý giáo trình chính thức và tài liệu bổ sung của toàn
              trung tâm.
            </p>
          </div>

          {activeTab === "curriculum" && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-fit"
            >
              <Plus className="h-4 w-4" />
              Thêm giáo trình
            </button>
          )}
        </header>

        <section className="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5">
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab("curriculum");
                setStatusFilter("all");
              }}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === "curriculum"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Giáo trình chính thức
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                {counts.curriculum}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("supplementary");
                setStatusFilter("all");
              }}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === "supplementary"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <Files className="h-4 w-4" />
              Tài liệu bổ sung
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                {counts.supplementary}
              </span>
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tiêu đề hoặc mô tả"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as MaterialStatus | "all",
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="published">Đã công khai</option>
              <option value="hidden">Đang ẩn</option>
            </select>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isFetching ? "animate-spin" : ""
                }`}
              />
              Tải lại
            </button>
          </div>
        </section>

        {error ? (
          <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <FileText className="mx-auto h-10 w-10 text-red-400" />
            <h2 className="mt-3 font-semibold text-red-800">
              Không thể tải danh sách tài liệu
            </h2>
            <p className="mt-2 text-sm text-red-700">
              {getErrorMessage(error) ??
                "Có lỗi xảy ra khi lấy dữ liệu tài liệu."}
            </p>
          </section>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>
        ) : materials.length === 0 ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-400" />
            <h2 className="mt-4 font-semibold text-slate-900">
              {activeTab === "curriculum"
                ? "Chưa có giáo trình chính thức"
                : "Chưa có tài liệu bổ sung"}
            </h2>

            {activeTab === "curriculum" && (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Thêm giáo trình
              </button>
            )}
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {materials.map((material) => (
              <article
                key={material._id}
                className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 font-semibold text-slate-900">
                      {material.title}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(material.createdAt)}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      Người đăng: {material.createdBy?.name ?? "—"}
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                      material.status === "published"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        : "bg-slate-100 text-slate-700 ring-slate-500/20"
                    }`}
                  >
                    {material.status === "published" ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}

                    {material.status === "published"
                      ? "Công khai"
                      : "Đang ẩn"}
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                  {material.description || "Không có mô tả."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {material.classIds.map((classItem) => (
                    <span
                      key={classItem._id}
                      className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                    >
                      {classItem.name}
                    </span>
                  ))}
                </div>

                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <Link2 className="h-4 w-4" />
                      Liên kết
                    </span>
                    <span className="font-semibold text-slate-700">
                      {material.links.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <FileText className="h-4 w-4" />
                      Tệp đính kèm
                    </span>
                    <span className="font-semibold text-slate-700">
                      {material.files.length}
                    </span>
                  </div>
                </div>

                {(material.links.length > 0 ||
                  material.files.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {material.links.slice(0, 1).map((link, index) => (
                      <a
                        key={`${link.url}-${index}`}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {link.title || link.url}
                        </span>
                      </a>
                    ))}

                    {material.files.slice(0, 1).map((file, index) => (
                      <a
                        key={`${file.url}-${index}`}
                        href={getFileUrl(file.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                  <button
                    type="button"
                    onClick={() => openEditForm(material)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" />
                    Chỉnh sửa
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(material)}
                    disabled={isDeleting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {isFormOpen && (
        <AdminMaterialFormModal
          material={selectedMaterial}
          defaultMaterialType={activeTab}
          onClose={closeForm}
        />
      )}
    </>
  );
}
