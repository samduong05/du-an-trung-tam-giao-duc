import { useState } from "react";
import toast from "react-hot-toast";
import type { Teacher } from "../../store/api/endpoints";
import {
  useGetTeachersQuery,
  useUpdateTeacherStatusMutation,
  useDeleteTeacherMutation,
} from "../../store/api/endpoints";
import TeacherFormModal from "./TeacherFormModal";

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

export default function TeachersPage() {
  const { data, error, isLoading, refetch } = useGetTeachersQuery();
  const [updateTeacherStatus, { isLoading: isUpdatingStatus }] =
    useUpdateTeacherStatusMutation();
  const [deleteTeacher] = useDeleteTeacherMutation();
  const currentTeachers = data?.users ?? [];

  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [updatingTeacherId, setUpdatingTeacherId] = useState<string | null>(
    null,
  );
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(
    null,
  );

  const openCreateModal = () => {
    setSelectedTeacher(null);
    setIsOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsOpen(true);
  };

  const closeModal = () => {
    setSelectedTeacher(null);
    setIsOpen(false);
    refetch();
  };

  const handleToggleStatus = async (
    teacherId: string,
    currentStatus: boolean,
  ) => {
    if (currentStatus) {
      const confirmed = window.confirm(
        "Bạn có chắc muốn khóa tài khoản giáo viên này không?",
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setUpdatingTeacherId(teacherId);

      const response = await updateTeacherStatus({
        id: teacherId,
        isActive: !currentStatus,
      }).unwrap();

      toast.success(
        response?.message ||
          (currentStatus
            ? "Khóa tài khoản giáo viên thành công"
            : "Mở khóa tài khoản giáo viên thành công"),
      );
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error) ||
          (currentStatus
            ? "Khóa tài khoản giáo viên thất bại"
            : "Mở khóa tài khoản giáo viên thất bại"),
      );
    } finally {
      setUpdatingTeacherId(null);
    }
  };

  const handleDeleteTeacher = async (teacher: {
    _id: string;
    name: string;
  }) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa giáo viên ${teacher.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTeacherId(teacher._id);
      await deleteTeacher(teacher._id).unwrap();
      toast.success("Đã xóa giáo viên");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Xóa giáo viên thất bại");
    } finally {
      setDeletingTeacherId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
            Danh sách giáo viên
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Quản lý thông tin giáo viên
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={openCreateModal}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
          >
            Thêm giáo viên
          </button>
        </div>
      </div>
      <TeacherFormModal
        isOpen={isOpen}
        teacher={selectedTeacher}
        onClose={closeModal}
      />

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        {isLoading ? (
          <div className="py-8 text-center text-slate-600">
            Đang tải dữ liệu...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">
            Có lỗi xảy ra khi tải dữ liệu.
          </div>
        ) : !data?.users?.length ? (
          <div className="py-8 text-center text-slate-600">
            Không có giáo viên.
          </div>
        ) : (
          <>
            <div className="space-y-3 xl:hidden">
              {currentTeachers.map((teacher) => (
                <div
                  key={teacher._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900">
                        {teacher.name}
                      </p>
                      <p className="text-sm text-slate-500 wrap-break-word">
                        {teacher.email}
                      </p>
                      <p className="text-sm text-slate-500">
                        {teacher.phone || "-"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {teacher.isActive ? (
                        <span className="shrink-0 inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                          Đã khóa
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => openEditModal(teacher)}
                        className="w-full rounded-md border border-blue-200 bg-white px-2.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(teacher._id, teacher.isActive)
                        }
                        disabled={
                          isUpdatingStatus && updatingTeacherId === teacher._id
                        }
                        className={`w-full rounded-md px-2.5 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                          teacher.isActive
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {teacher.isActive ? "Đóng" : "Mở"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeacher(teacher)}
                        disabled={deletingTeacherId === teacher._id}
                        className="w-full rounded-md bg-red-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[5%]" />
                  <col className="w-[20%]" />
                  <col className="w-[23%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[22%]" />
                </colgroup>
                <thead className="bg-slate-100">
                  <tr className="text-left text-sm font-semibold text-slate-700">
                    <th className="px-4 py-3">STT</th>
                    <th className="px-4 py-3">Họ và tên</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Số điện thoại</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-3 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {currentTeachers.map((teacher, index) => (
                    <tr
                      key={teacher._id}
                      className="border-t border-slate-200 even:bg-stone-100 hover:bg-stone-200"
                    >
                      <td className="px-4 py-3 text-slate-700 text-sm">
                        {index + 1}
                      </td>

                      <td
                        className="truncate px-4 py-3 text-sm font-medium text-slate-800"
                        title={teacher.name}
                      >
                        {teacher.name}
                      </td>

                      <td
                        className="truncate px-4 py-3 text-sm text-slate-700"
                        title={teacher.email}
                      >
                        {teacher.email}
                      </td>

                      <td
                        className="truncate px-4 py-3 text-sm text-slate-700"
                        title={teacher.phone || "-"}
                      >
                        {teacher.phone || "-"}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <div className="flex justify-start">
                          {teacher.isActive ? (
                            <span className="inline-flex whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                              Đang hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex whitespace-nowrap rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                              Đã khóa
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center text-sm">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditModal(teacher)}
                            className="w-20 rounded-md border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(teacher._id, teacher.isActive)
                            }
                            disabled={
                              isUpdatingStatus &&
                              updatingTeacherId === teacher._id
                            }
                            className={`w-12 rounded-md px-2 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                              teacher.isActive
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {teacher.isActive ? "Đóng" : "Mở"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(teacher)}
                            disabled={deletingTeacherId === teacher._id}
                            className="w-12 rounded-md bg-red-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}