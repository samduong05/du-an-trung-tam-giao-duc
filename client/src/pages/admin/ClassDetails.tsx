import { useState } from "react";
import { CalendarDays, Loader2, Plus, UserRound, Users, X } from "lucide-react";
import toast from "react-hot-toast";
import ScheduleConflictModal from "./ScheduleConflictModal";
import {
  // useGetStudentsQuery,
  useGetTeachersQuery,
} from "../../store/api/endpoints";

import {
  useAddStudentToClassMutation,
  useAssignTeacherToClassMutation,
  useGetAvailableStudentsQuery,
  useRemoveStudentFromClassMutation,
  type ClassItem,
  type DayOfWeek,
  type ScheduleConflictResponse,
} from "../../store/api/classesApi";

interface ClassDetailsProps {
  classItem: ClassItem;
}
type PendingConflictAction =
  | {
      type: "assignTeacher";
      teacherId: string;
    }
  | {
      type: "addStudent";
      studentId: string;
    };

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Thứ 2",
  tuesday: "Thứ 3",
  wednesday: "Thứ 4",
  thursday: "Thứ 5",
  friday: "Thứ 6",
  saturday: "Thứ 7",
  sunday: "Chủ nhật",
};

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

const getScheduleConflictResponse = (
  error: unknown,
): ScheduleConflictResponse | null => {
  if (
    typeof error !== "object" ||
    error === null ||
    !("status" in error) ||
    !("data" in error)
  ) {
    return null;
  }

  const apiError = error as {
    status?: number;
    data?: Partial<ScheduleConflictResponse>;
  };

  if (
    apiError.status !== 409 ||
    apiError.data?.requiresConfirmation !== true ||
    !Array.isArray(apiError.data.conflicts)
  ) {
    return null;
  }

  return apiError.data as ScheduleConflictResponse;
};

const formatDate = (date?: string) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("vi-VN");
};

export default function ClassDetails({ classItem }: ClassDetailsProps) {
  const { data: teachersData, isLoading: isLoadingTeachers } =
    useGetTeachersQuery();

  const { data: availableStudentsData, isLoading: isLoadingStudents } =
    useGetAvailableStudentsQuery(classItem._id);

  const [assignTeacherToClass] = useAssignTeacherToClassMutation();

  const [addStudentToClass] = useAddStudentToClassMutation();

  const [removeStudentFromClass] = useRemoveStudentFromClassMutation();

  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [isAssigningTeacher, setIsAssigningTeacher] = useState(false);

  const [isAddingStudent, setIsAddingStudent] = useState(false);

  const [removingStudentId, setRemovingStudentId] = useState<string | null>(
  null,
);
  const [conflictResponse, setConflictResponse] =
    useState<ScheduleConflictResponse | null>(null);

  const [pendingConflictAction, setPendingConflictAction] =
    useState<PendingConflictAction | null>(null);

  const teachers = teachersData?.users ?? [];
  const availableStudents = availableStudentsData?.students ?? [];

  const handleAssignTeacher = async (
    forceSave = false,
    teacherId = selectedTeacherId,
  ) => {
    if (!teacherId) {
      toast.error("Vui lòng chọn giáo viên");
      return;
    }

    if (teacherId === classItem.teacher?._id) {
      toast.error("Giáo viên này đang phụ trách lớp");
      return;
    }

    try {
      setIsAssigningTeacher(true);

      await assignTeacherToClass({
        classId: classItem._id,
        teacherId,
        forceSave,
      }).unwrap();

      toast.success("Thay giáo viên phụ trách thành công");

      setSelectedTeacherId("");
      setConflictResponse(null);
      setPendingConflictAction(null);
    } catch (error) {
      const conflict = getScheduleConflictResponse(error);

      if (conflict) {
        setPendingConflictAction({
          type: "assignTeacher",
          teacherId,
        });

        setConflictResponse(conflict);
        return;
      }

      toast.error(
        getErrorMessage(error) ?? "Không thể thay giáo viên phụ trách",
      );
    } finally {
      setIsAssigningTeacher(false);
    }
  };

  const handleAddStudent = async (
    forceSave = false,
    studentId = selectedStudentId,
  ) => {
    if (!studentId) {
      toast.error("Vui lòng chọn học sinh");
      return;
    }

    try {
      setIsAddingStudent(true);

      await addStudentToClass({
        classId: classItem._id,
        studentId,
        forceSave,
      }).unwrap();

      toast.success("Thêm học sinh vào lớp thành công");

      setSelectedStudentId("");
      setConflictResponse(null);
      setPendingConflictAction(null);
    } catch (error) {
      const conflict = getScheduleConflictResponse(error);

      if (conflict) {
        setPendingConflictAction({
          type: "addStudent",
          studentId,
        });

        setConflictResponse(conflict);
        return;
      }

      toast.error(getErrorMessage(error) ?? "Không thể thêm học sinh vào lớp");
    } finally {
      setIsAddingStudent(false);
    }
  };
  const handleConfirmConflict = async () => {
    if (!pendingConflictAction) {
      return;
    }

    if (pendingConflictAction.type === "assignTeacher") {
      await handleAssignTeacher(true, pendingConflictAction.teacherId);

      return;
    }

    await handleAddStudent(true, pendingConflictAction.studentId);
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
    <>
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
            <UserRound className="h-5 w-5 text-blue-600" />

            <h3 className="font-semibold text-slate-900">
              Giáo viên phụ trách
            </h3>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="font-medium text-slate-900">
              {classItem.teacher?.name ?? "Chưa phân công"}
            </p>

            <p className="mt-1 break-all text-sm text-slate-500">
              {classItem.teacher?.email ?? "—"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {classItem.teacher?.phone ?? "Chưa có số điện thoại"}
            </p>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Thay giáo viên
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={selectedTeacherId}
                onChange={(event) => setSelectedTeacherId(event.target.value)}
                disabled={isLoadingTeachers}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">Chọn giáo viên</option>

                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} — {teacher.email}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleAssignTeacher()}
                disabled={isAssigningTeacher || isLoadingTeachers}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAssigningTeacher && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Cập nhật
              </button>
            </div>
          </div>
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

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              disabled={isLoadingStudents || availableStudents.length === 0}
              className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">
                {availableStudents.length === 0
                  ? "Không còn học sinh để thêm"
                  : "Chọn học sinh"}
              </option>

              {availableStudents.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} — {student.email}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleAddStudent()}
              disabled={
                isAddingStudent ||
                isLoadingStudents ||
                availableStudents.length === 0
              }
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAddingStudent ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Thêm học sinh
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
                    <th className="w-[30%] px-3 py-2 font-medium">Họ và tên</th>

                    <th className="w-[32%] px-3 py-2 font-medium">Email</th>

                    <th className="w-[22%] px-3 py-2 font-medium">
                      Số điện thoại
                    </th>

                    <th className="w-[16%] px-3 py-2 text-right font-medium">
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

                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveStudent(student._id, student.name)
                          }
                          disabled={removingStudentId === student._id}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {removingStudentId === student._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                          Gỡ khỏi lớp
                        </button>
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

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveStudent(student._id, student.name)
                    }
                    disabled={removingStudentId === student._id}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {removingStudentId === student._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    Gỡ khỏi lớp
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
    <ScheduleConflictModal
      isOpen={conflictResponse !== null}
      conflictResponse={conflictResponse}
      isConfirming={
        isAssigningTeacher || isAddingStudent
      }
      onClose={() => {
        if (
          !isAssigningTeacher &&
          !isAddingStudent
        ) {
          setConflictResponse(null);
          setPendingConflictAction(null);
        }
      }}
      onConfirm={handleConfirmConflict}
    />
  </>
);
}
 
