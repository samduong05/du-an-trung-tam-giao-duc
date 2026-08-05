import { useState } from "react";
import { Link } from "react-router-dom";
import TeacherCreateStudentModal from "./TeacherCreateStudentModal";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Loader2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  useAddStudentToClassMutation,
  useGetAvailableStudentsQuery,
  useRemoveStudentFromClassMutation,
  type ClassItem,
  type DayOfWeek,
} from "../../store/api/classesApi";

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Thứ 2",
  tuesday: "Thứ 3",
  wednesday: "Thứ 4",
  thursday: "Thứ 5",
  friday: "Thứ 6",
  saturday: "Thứ 7",
  sunday: "Chủ nhật",
};

interface TeacherClassDetailsProps {
  classItem: ClassItem;
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

const formatDate = (date?: string): string => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("vi-VN");
};

export default function TeacherClassDetails({
  classItem,
}: TeacherClassDetailsProps) {
  const {
    data: availableStudentsData,
    isLoading: isLoadingStudents,
    isFetching: isFetchingStudents,
  } = useGetAvailableStudentsQuery(classItem._id);

  const [addStudentToClass, { isLoading: isAddingStudent }] =
    useAddStudentToClassMutation();

  const [removeStudentFromClass] = useRemoveStudentFromClassMutation();

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isCreateStudentModalOpen, setIsCreateStudentModalOpen] =
    useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(
    null,
  );

  const availableStudents = availableStudentsData?.students ?? [];

  const handleAddStudent = async () => {
    if (!selectedStudentId) {
      toast.error("Vui lòng chọn học sinh");
      return;
    }

    try {
      await addStudentToClass({
        classId: classItem._id,
        studentId: selectedStudentId,
      }).unwrap();

      setSelectedStudentId("");
      toast.success("Thêm học sinh vào lớp thành công");
    } catch (error) {
      toast.error(getErrorMessage(error) ?? "Không thể thêm học sinh vào lớp");
    }
  };

  const handleRemoveStudent = async (
    studentId: string,
    studentName: string,
  ) => {
    const confirmed = window.confirm(
      `Ông có chắc muốn gỡ "${studentName}" khỏi lớp không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingStudentId(studentId);

      await removeStudentFromClass({
        classId: classItem._id,
        studentId,
      }).unwrap();

      toast.success("Gỡ học sinh khỏi lớp thành công");
    } catch (error) {
      toast.error(getErrorMessage(error) ?? "Không thể gỡ học sinh khỏi lớp");
    } finally {
      setRemovingStudentId(null);
    }
  };

  return (
    <div className="space-y-6 border-t border-slate-200 bg-slate-50 p-4 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Lịch học</h3>
          </div>

          {classItem.schedule.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có lịch học</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-125 text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-2 font-medium">Thứ</th>
                    <th className="px-3 py-2 font-medium">Bắt đầu</th>
                    <th className="px-3 py-2 font-medium">Kết thúc</th>
                    <th className="px-3 py-2 font-medium">Phòng</th>
                  </tr>
                </thead>

                <tbody>
                  {classItem.schedule.map((scheduleItem, index) => (
                    <tr
                      key={`${scheduleItem.dayOfWeek}-${scheduleItem.startTime}-${index}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {DAY_LABELS[scheduleItem.dayOfWeek]}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {scheduleItem.startTime}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {scheduleItem.endTime}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {scheduleItem.room || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Ngày bắt đầu
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {formatDate(classItem.startedAt)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Ngày kết thúc
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {formatDate(classItem.endedAt)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Thông tin lớp</h3>
          </div>

          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Tên lớp
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {classItem.name}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Môn học
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {classItem.subject}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Mô tả
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {classItem.description || "Không có mô tả"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Danh sách học sinh</h3>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {classItem.students.length}
            </span>
          </div>

          <div className="flex min-w-0 flex-col gap-2 lg:w-2/3">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                disabled={
                  isLoadingStudents ||
                  isFetchingStudents ||
                  isAddingStudent ||
                  availableStudents.length === 0
                }
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">
                  {isLoadingStudents || isFetchingStudents
                    ? "Đang tải học sinh..."
                    : availableStudents.length === 0
                      ? "Không còn học sinh có sẵn"
                      : "Chọn học sinh có sẵn"}
                </option>

                {availableStudents.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} — {student.email}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddStudent}
                disabled={!selectedStudentId || isAddingStudent}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAddingStudent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Thêm học sinh
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateStudentModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-600 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
            >
              <UserPlus className="h-4 w-4" />
              Tạo học sinh mới
            </button>
          </div>
        </div>

        {classItem.students.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">Lớp chưa có học sinh</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="w-[24%] px-3 py-2 font-medium">Họ và tên</th>
                    <th className="w-[28%] px-3 py-2 font-medium">Email</th>
                    <th className="w-[18%] px-3 py-2 font-medium">
                      Số điện thoại
                    </th>
                    <th className="w-[30%] px-3 py-2 text-right font-medium">
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {classItem.students.map((student) => (
                    <tr
                      key={student._id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="truncate px-3 py-3 font-medium text-slate-900">
                        {student.name}
                      </td>
                      <td className="truncate px-3 py-3 text-slate-700">
                        {student.email}
                      </td>
                      <td className="truncate px-3 py-3 text-slate-700">
                        {student.phone || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            to={`/teacher/classes/${classItem._id}/students/${student._id}/attendance`}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-blue-600 transition hover:text-blue-700"
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            Xem chuyên cần
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveStudent(student._id, student.name)
                            }
                            disabled={removingStudentId === student._id}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {removingStudentId === student._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                            Gỡ khỏi lớp
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {classItem.students.map((student) => (
                <article
                  key={student._id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <p className="font-medium text-slate-900">{student.name}</p>
                  <p className="mt-1 break-all text-sm text-slate-500">
                    {student.email}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {student.phone || "Chưa có số điện thoại"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <Link
                      to={`/teacher/classes/${classItem._id}/students/${student._id}/attendance`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Xem chuyên cần
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveStudent(student._id, student.name)
                      }
                      disabled={removingStudentId === student._id}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {removingStudentId === student._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Gỡ khỏi lớp
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
      <TeacherCreateStudentModal
        isOpen={isCreateStudentModalOpen}
        classId={classItem._id}
        onClose={() => setIsCreateStudentModalOpen(false)}
      />
    </div>
  );
}
