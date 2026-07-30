import { Fragment, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import ClassDetails from "./ClassDetails";
import ClassFormModal from "./ClassFormModal";
import {
  useDeleteClassMutation,
  useGetClassesQuery,
  useUpdateClassStatusMutation,
  type ClassItem,
  type ClassStatus,
} from "../../store/api/classesApi";

const STATUS_OPTIONS: {
  value: ClassStatus;
  label: string;
}[] = [
  {
    value: "active",
    label: "Đang hoạt động",
  },
  {
    value: "paused",
    label: "Tạm dừng",
  },
  {
    value: "completed",
    label: "Đã hoàn thành",
  },
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

const getStatusLabel = (status: ClassStatus) => {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    "Không xác định"
  );
};

const getStatusClassName = (status: ClassStatus) => {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "paused":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "completed":
      return "bg-slate-100 text-slate-600 ring-slate-500/20";

    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }
};

const getStatusSelectClassName = (status: ClassStatus) => {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "paused":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "completed":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-slate-300 bg-white text-slate-700";
  }
};

export default function ClassesPage() {
  const { data, isLoading, isError, refetch } = useGetClassesQuery();

  const [updateClassStatus] = useUpdateClassStatusMutation();
  const [deleteClass] = useDeleteClassMutation();

  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  const classes = data?.classes ?? [];

  const openCreateModal = () => {
    setSelectedClass(null);
    setIsFormOpen(true);
  };

  const openEditModal = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setSelectedClass(null);
    setIsFormOpen(false);
  };

  const toggleClassDetails = (classId: string) => {
    setExpandedClassId((currentId) => (currentId === classId ? null : classId));
  };

  const handleStatusChange = async (
    classItem: ClassItem,
    newStatus: ClassStatus,
  ) => {
    if (newStatus === classItem.status) {
      return;
    }

    try {
      setUpdatingStatusId(classItem._id);

      await updateClassStatus({
        id: classItem._id,
        status: newStatus,
      }).unwrap();

      toast.success("Cập nhật trạng thái lớp thành công");
    } catch (error) {
      toast.error(
        getErrorMessage(error) ?? "Không thể cập nhật trạng thái lớp học",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteClass = async (classItem: ClassItem) => {
    const confirmed = window.confirm(
      `Ông có chắc muốn xóa lớp "${classItem.name}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingClassId(classItem._id);

      await deleteClass(classItem._id).unwrap();

      toast.success("Xóa lớp học thành công");

      if (expandedClassId === classItem._id) {
        setExpandedClassId(null);
      }
    } catch (error) {
      toast.error(getErrorMessage(error) ?? "Không thể xóa lớp học");
    } finally {
      setDeletingClassId(null);
    }
  };

  const renderStatusBadge = (status: ClassStatus) => {
    return (
      <span
        className={`inline-flex min-w-[116px] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClassName(
          status,
        )}`}
      >
        {getStatusLabel(status)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="h-20 animate-pulse rounded-xl bg-slate-200" />

        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-80 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 font-semibold text-slate-900">
            Không thể tải danh sách lớp
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Có lỗi xảy ra khi lấy dữ liệu lớp học.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý lớp học</h1>

          <p className="mt-1 text-sm text-slate-500">
            Hiện có {classes.length} lớp học trong hệ thống
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Thêm lớp học
        </button>
      </header>


      {classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />

          <h2 className="mt-4 font-semibold text-slate-900">Chưa có lớp học</h2>

          <p className="mt-2 text-sm text-slate-500">
            Hãy tạo lớp học đầu tiên cho trung tâm.
          </p>

          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Thêm lớp học
          </button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
            <table className="w-full table-fixed">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="w-[24%] px-5 py-4">Lớp học</th>

                  <th className="w-[16%] px-5 py-4">Môn học</th>

                  <th className="w-[20%] px-5 py-4">Giáo viên</th>

                  <th className="w-[11%] px-5 py-4 text-center">Học sinh</th>

                  <th className="w-[17%] px-5 py-4 text-center">Trạng thái</th>

                  <th className="w-[12%] px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {classes.map((classItem) => {
                  const isExpanded = expandedClassId === classItem._id;

                  return (
                    <Fragment key={classItem._id}>
                      <tr className="border-t border-slate-200">
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => toggleClassDetails(classItem._id)}
                            className="flex min-w-0 items-center gap-3 text-left"
                          >
                            <span className="shrink-0 text-slate-400">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </span>

                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-slate-900">
                                {classItem.name}
                              </span>

                              <span className="mt-1 block truncate text-xs text-slate-500">
                                {classItem.description || "Không có mô tả"}
                              </span>
                            </span>
                          </button>
                        </td>

                        <td className="truncate px-5 py-4 text-sm text-slate-600">
                          {classItem.subject}
                        </td>

                        <td className="px-5 py-4">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {classItem.teacher?.name ?? "Chưa phân công"}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {classItem.teacher?.email ?? "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                            <Users className="h-4 w-4 text-slate-400" />
                            {classItem.students.length}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <div className="relative mx-auto w-[145px]">
                            <select
                              value={classItem.status}
                              disabled={updatingStatusId === classItem._id}
                              onChange={(event) =>
                                handleStatusChange(
                                  classItem,
                                  event.target.value as ClassStatus,
                                )
                              }
                              className={`w-full appearance-none rounded-lg border py-2 pl-3 pr-9 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${getStatusSelectClassName(
                                classItem.status,
                              )}`}
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>

                            <ChevronDown
                              className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${getStatusSelectClassName(
                                classItem.status,
                              )
                                .split(" ")
                                .find((className) => className.startsWith("text-"))}`}
                            />
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(classItem)}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                              title="Sửa lớp"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              disabled={deletingClassId === classItem._id}
                              onClick={() => handleDeleteClass(classItem)}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Xóa lớp"
                            >
                              {deletingClassId === classItem._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-t border-slate-200">
                          <td colSpan={6} className="p-0">
                            <ClassDetails classItem={classItem} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 lg:hidden">
            {classes.map((classItem) => {
              const isExpanded = expandedClassId === classItem._id;

              return (
                <article
                  key={classItem._id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-slate-900">
                          {classItem.name}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {classItem.subject}
                        </p>
                      </div>

                      {renderStatusBadge(classItem.status)}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Giáo viên
                        </p>

                        <p className="mt-1 truncate text-sm font-medium text-slate-700">
                          {classItem.teacher?.name ?? "Chưa phân công"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Học sinh
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {classItem.students.length} học sinh
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-1.5 block text-xs font-medium text-slate-500">
                        Trạng thái lớp
                      </label>

                      <div className="relative">
                        <select
                          value={classItem.status}
                          disabled={updatingStatusId === classItem._id}
                          onChange={(event) =>
                            handleStatusChange(
                              classItem,
                              event.target.value as ClassStatus,
                            )
                          }
                          className={`w-full appearance-none rounded-lg border py-2 pl-3 pr-10 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${getStatusSelectClassName(
                            classItem.status,
                          )}`}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>

                        <ChevronDown
                          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${getStatusSelectClassName(
                            classItem.status,
                          )
                            .split(" ")
                            .find((className) => className.startsWith("text-"))}`}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleClassDetails(classItem._id)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}

                        {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(classItem)}
                        className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                        title="Sửa lớp"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={deletingClassId === classItem._id}
                        onClick={() => handleDeleteClass(classItem)}
                        className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Xóa lớp"
                      >
                        {deletingClassId === classItem._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && <ClassDetails classItem={classItem} />}
                </article>
              );
            })}
          </div>
        </>
      )}

      <ClassFormModal
        isOpen={isFormOpen}
        selectedClass={selectedClass}
        onClose={closeFormModal}
      />
    </div>
  );
}