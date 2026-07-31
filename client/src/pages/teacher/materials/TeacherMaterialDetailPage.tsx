import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { useGetClassByIdQuery } from "../../../store/api/classesApi";
import {
  useDeleteMaterialMutation,
  useGetMaterialsQuery,
  type MaterialItem,
  type MaterialStatus,
  type MaterialType,
} from "../../../store/api/materialsApi";
import MaterialList from "./MaterialList";
import SupplementaryMaterialFormModal from "./SupplementaryMaterialFormModal";
import TeacherMaterialTabs from "./TeacherMaterialTabs";
import { getErrorMessage } from "./material.utils";

export default function TeacherMaterialDetailPage() {
  const { classId } = useParams<{ classId: string }>();

  const [activeTab, setActiveTab] =
    useState<MaterialType>("curriculum");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<MaterialStatus | "all">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<MaterialItem | null>(null);

  const {
    data: classData,
    isLoading: isLoadingClass,
    isError: isClassError,
    refetch: refetchClass,
  } = useGetClassByIdQuery(classId ?? "", {
    skip: !classId,
  });

  const {
    data: allMaterialsData,
  } = useGetMaterialsQuery(
    { classId },
    { skip: !classId },
  );

  const {
    data: materialsData,
    error: materialsError,
    isLoading: isLoadingMaterials,
    isFetching: isFetchingMaterials,
    refetch: refetchMaterials,
  } = useGetMaterialsQuery(
    {
      classId,
      materialType: activeTab,
      search: search.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    },
    {
      skip: !classId,
    },
  );

  const [deleteMaterial, { isLoading: isDeleting }] =
    useDeleteMaterialMutation();

  const classItem = classData?.class;
  const materials = materialsData?.materials ?? [];

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
    setIsFormOpen(false);
    setSelectedMaterial(null);
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
    } catch (error) {
      toast.error(getErrorMessage(error) ?? "Không thể xóa tài liệu");
    }
  };

  if (!classId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-700">
          Không tìm thấy mã lớp học.
        </p>
        <Link
          to="/teacher/materials"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách lớp
        </Link>
      </div>
    );
  }

  if (isLoadingClass) {
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-80 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (isClassError || !classItem) {
    return (
      <div className="flex min-h-80 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-4 font-semibold text-slate-900">
            Không thể tải thông tin lớp
          </h2>
          <button
            type="button"
            onClick={() => refetchClass()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 p-4 sm:p-6">
        <header>
          <Link
            to="/teacher/materials"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Danh sách lớp tài liệu
          </Link>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-slate-900">
                {classItem.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {classItem.subject} · Tài liệu học tập
              </p>
            </div>

            {activeTab === "supplementary" && (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-fit"
              >
                <Plus className="h-4 w-4" />
                Thêm tài liệu bổ sung
              </button>
            )}
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5">
          <TeacherMaterialTabs
            activeTab={activeTab}
            curriculumCount={counts.curriculum}
            supplementaryCount={counts.supplementary}
            onChange={(tab) => {
              setActiveTab(tab);
              setStatusFilter("all");
            }}
          />
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
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as MaterialStatus | "all",
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="published">Đã công khai</option>
              <option value="hidden">Đang ẩn</option>
            </select>

            <button
              type="button"
              onClick={() => refetchMaterials()}
              disabled={isFetchingMaterials}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isFetchingMaterials ? "animate-spin" : ""
                }`}
              />
              Tải lại
            </button>
          </div>
        </section>

        {materialsError ? (
          <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <FileText className="mx-auto h-10 w-10 text-red-400" />
            <h2 className="mt-3 font-semibold text-red-800">
              Không thể tải danh sách tài liệu
            </h2>
            <p className="mt-2 text-sm text-red-700">
              {getErrorMessage(materialsError) ??
                "Có lỗi xảy ra khi lấy dữ liệu tài liệu."}
            </p>
          </section>
        ) : (
          <MaterialList
            materials={materials}
            materialType={activeTab}
            isLoading={isLoadingMaterials}
            canManage={activeTab === "supplementary"}
            isDeleting={isDeleting}
            onCreate={openCreateForm}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
        )}
      </div>

      {isFormOpen && activeTab === "supplementary" && (
        <SupplementaryMaterialFormModal
          classId={classId}
          className={classItem.name}
          material={selectedMaterial}
          onClose={closeForm}
        />
      )}
    </>
  );
}
