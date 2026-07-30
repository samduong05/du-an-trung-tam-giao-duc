import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import type { Student } from "../../store/api/endpoints";
import {
  useDeleteStudentMutation,
  useGetStudentsQuery,
  useUpdateStudentStatusMutation,
} from "../../store/api/endpoints";
import StudentFormModal from "./StudentFormModal";

const PAGE_SIZE = 25;

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

export default function StudentsPage() {
  const { data, error, isLoading, refetch } = useGetStudentsQuery();
  const [deleteStudent] = useDeleteStudentMutation();
  const [updateStudentStatus, { isLoading: isUpdatingStatus }] =
    useUpdateStudentStatusMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(
    null,
  );
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(
    null,
  );

  const sortedStudents = [...(data?.users ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const totalStudents = sortedStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentStudents = sortedStudents.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  useEffect(() => {
    if (totalStudents === 0) {
      setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, totalStudents]);

  const openCreateModal = () => {
    setSelectedStudent(null);
    setIsOpen(true);
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setIsOpen(true);
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setIsOpen(false);
    refetch();
  };

  const handleDeleteStudent = async (student: Student) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa học sinh "${student.name}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingStudentId(student._id);
      await deleteStudent(student._id).unwrap();
      toast.success("Xóa học sinh thành công");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Không thể xóa học sinh");
    } finally {
      setDeletingStudentId(null);
    }
  };

  const handleToggleStatus = async (
    studentId: string,
    currentStatus: boolean,
  ) => {
    if (currentStatus) {
      const confirmed = window.confirm(
        "Bạn có chắc muốn khóa tài khoản học sinh này không?",
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setUpdatingStudentId(studentId);

      const response = await updateStudentStatus({
        id: studentId,
        isActive: !currentStatus,
      }).unwrap();

      toast.success(
        response?.message ||
          (currentStatus
            ? "Khóa tài khoản học sinh thành công"
            : "Mở khóa tài khoản học sinh thành công"),
      );
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error) ||
          (currentStatus
            ? "Khóa tài khoản học sinh thất bại"
            : "Mở khóa tài khoản học sinh thất bại"),
      );
    } finally {
      setUpdatingStudentId(null);
    }
  };

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-xl font-bold leading-tight text-slate-800 sm:text-2xl">
            Danh sách học sinh
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Quản lý thông tin học sinh
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={openCreateModal}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
          >
            Thêm học sinh
          </button>
        </div>
      </div>

      <StudentFormModal
        isOpen={isOpen}
        student={selectedStudent}
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
        ) : !sortedStudents.length ? (
          <div className="py-8 text-center text-slate-600">
            Không có học sinh.
          </div>
        ) : (
          <>
            <div className="w-full space-y-3 xl:hidden">
              {currentStudents.map((student, index) => (
                <div
                  key={student._id}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900">
                        {student.name}
                      </p>
                      <p className="text-sm text-slate-500 wrap-break-word">
                        {student.email}
                      </p>
                      <p className="text-sm text-slate-500">
                        {student.phone || "-"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {student.isActive ? (
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
                        onClick={() => openEditModal(student)}
                        className="w-full rounded-md border border-blue-200 bg-white px-2.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(student._id, student.isActive)
                        }
                        disabled={
                          isUpdatingStatus && updatingStudentId === student._id
                        }
                        className={`w-full rounded-md px-2.5 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                          student.isActive
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {student.isActive ? "Đóng" : "Mở"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(student)}
                        disabled={deletingStudentId === student._id}
                        className="w-full rounded-md bg-red-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden w-full overflow-x-auto xl:block">
              <table className="min-w-[1100px] w-full table-fixed">
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
                  {currentStudents.map((student, index) => (
                    <tr
                      key={student._id}
                      className="border-t border-slate-200 even:bg-stone-100 hover:bg-stone-200"
                    >
                      <td className="px-4 py-3 text-slate-700 text-sm">
                        {startIndex + index + 1}
                      </td>
                      <td
                        className="truncate px-4 py-3 text-sm font-medium text-slate-800"
                        title={student.name}
                      >
                        {student.name}
                      </td>
                      <td
                        className="truncate px-4 py-3 text-sm text-slate-700"
                        title={student.email}
                      >
                        {student.email}
                      </td>
                      <td
                        className="truncate px-4 py-3 text-sm text-slate-700"
                        title={student.phone || "-"}
                      >
                        {student.phone || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex justify-start">
                          {student.isActive ? (
                            <span className="inline-flex shrink-0 whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                              Đang hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex shrink-0 whitespace-nowrap rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                              Đã khóa
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-sm">
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditModal(student)}
                            className="w-24 rounded-md border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(student._id, student.isActive)
                            }
                            disabled={
                              isUpdatingStatus &&
                              updatingStudentId === student._id
                            }
                            className={`w-20 rounded-md px-2 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                              student.isActive
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {student.isActive ? "Đóng" : "Mở"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(student)}
                            disabled={deletingStudentId === student._id}
                            className="w-16 rounded-md bg-red-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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

      {totalStudents > PAGE_SIZE && (
        <div className="mt-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>

          <div className="text-center">
            Trang {currentPage} / {totalPages}
          </div>

          <button
            type="button"
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={currentPage === totalPages}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
