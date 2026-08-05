import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";

import {
  type AssignmentSubmission,
  type SubmissionStatus,
  useGetAssignmentByIdQuery,
  useGradeSubmissionMutation,
} from "../../store/api/assignmentsApi";

const statusLabels: Record<SubmissionStatus, string> = {
  submitted: "Đã nộp",
  late: "Nộp muộn",
  graded: "Đã chấm",
  returned: "Đã trả bài",
};

const statusClassNames: Record<SubmissionStatus, string> = {
  submitted: "bg-blue-50 text-blue-700",
  late: "bg-amber-50 text-amber-700",
  graded: "bg-emerald-50 text-emerald-700",
  returned: "bg-violet-50 text-violet-700",
};

const formatDateTime = (value?: string): string => {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

const getFileUrl = (url: string): string => {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const backendUrl = import.meta.env.VITE_API_URL;

  if (backendUrl) {
    return `${backendUrl}${url}`;
  }

  return url;
};

const getStudentId = (submission: AssignmentSubmission): string => {
  if (typeof submission.studentId === "string") {
    return submission.studentId;
  }

  return submission.studentId._id;
};

const getStudentName = (submission: AssignmentSubmission): string => {
  if (typeof submission.studentId === "string") {
    return "Học sinh";
  }

  return submission.studentId.name;
};

const getStudentEmail = (submission: AssignmentSubmission): string => {
  if (typeof submission.studentId === "string") {
    return "";
  }

  return submission.studentId.email;
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

interface GradeDraft {
  score: string;
  feedback: string;
}

export default function TeacherAssignmentSubmissionsPage() {
  const { assignmentId } = useParams<{
    assignmentId: string;
  }>();

  const { data, isLoading, isFetching, isError, refetch } =
    useGetAssignmentByIdQuery(assignmentId ?? "", {
      skip: !assignmentId,
    });

  const [gradeSubmission, { isLoading: isGrading }] =
    useGradeSubmissionMutation();

  const [drafts, setDrafts] = useState<Record<string, GradeDraft>>({});
  const [gradingStudentId, setGradingStudentId] = useState<string | null>(null);

  const assignment = data?.assignment;

  const submissions = useMemo(
    () => assignment?.submissions ?? [],
    [assignment?.submissions],
  );

  useEffect(() => {
    if (!assignment) {
      return;
    }

    const nextDrafts: Record<string, GradeDraft> = {};

    assignment.submissions?.forEach((submission) => {
      const studentId = getStudentId(submission);

      nextDrafts[studentId] = {
        score: submission.score === null ? "" : String(submission.score),
        feedback: submission.feedback ?? "",
      };
    });

    setDrafts(nextDrafts);
  }, [assignment]);

  if (!assignmentId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-700">Không tìm thấy mã bài tập.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Đang tải danh sách bài nộp...</p>
      </div>
    );
  }

  if (isError || !assignment) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h1 className="font-semibold text-red-700">Không thể tải bài nộp</h1>

        <p className="mt-1 text-sm text-red-600">
          Bài tập không tồn tại hoặc bạn không có quyền truy cập.
        </p>

        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    );
  }

  const classId =
    typeof assignment.classId === "string"
      ? assignment.classId
      : assignment.classId._id;

  const updateDraft = (
    studentId: string,
    field: keyof GradeDraft,
    value: string,
  ) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [studentId]: {
        score: currentDrafts[studentId]?.score ?? "",
        feedback: currentDrafts[studentId]?.feedback ?? "",
        [field]: value,
      },
    }));
  };

  const handleGrade = async (submission: AssignmentSubmission) => {
    const studentId = getStudentId(submission);
    const draft = drafts[studentId];

    if (!draft) {
      return;
    }

    const score = Number(draft.score);

    if (!Number.isFinite(score) || score < 0 || score > assignment.maxScore) {
      toast.error(`Điểm phải nằm trong khoảng từ 0 đến ${assignment.maxScore}`);
      return;
    }

    try {
      setGradingStudentId(studentId);

      await gradeSubmission({
        assignmentId: assignment._id,
        studentId,
        score,
        feedback: draft.feedback.trim(),
      }).unwrap();

      toast.success("Chấm bài thành công");
    } catch (error) {
      toast.error(getErrorMessage(error) ?? "Chấm bài thất bại");
    } finally {
      setGradingStudentId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to={`/teacher/classes/${classId}/assignments`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách bài tập
      </Link>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              Danh sách bài nộp
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {assignment.title}
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Điểm tối đa:{" "}
              <span className="font-semibold text-slate-900">
                {assignment.maxScore}
              </span>
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Đã nộp</p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {submissions.length}
            </p>
          </div>
        </div>

        {isFetching && (
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Đang cập nhật dữ liệu
          </div>
        )}
      </section>

      {submissions.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <UserRound className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-800">Chưa có bài nộp</h2>

          <p className="mt-1 text-sm text-slate-500">
            Chưa có học sinh nào nộp bài tập này.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {submissions.map((submission) => {
            const studentId = getStudentId(submission);
            const draft = drafts[studentId] ?? {
              score: "",
              feedback: "",
            };

            const isCurrentGrading = gradingStudentId === studentId;

            return (
              <article
                key={submission._id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold text-slate-900">
                        {getStudentName(submission)}
                      </h2>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusClassNames[submission.status]
                        }`}
                      >
                        {statusLabels[submission.status]}
                      </span>
                    </div>

                    {getStudentEmail(submission) && (
                      <p className="mt-1 text-sm text-slate-500">
                        {getStudentEmail(submission)}
                      </p>
                    )}

                    <p className="mt-3 text-sm text-slate-600">
                      Thời gian nộp:{" "}
                      <span className="font-medium text-slate-800">
                        {formatDateTime(submission.submittedAt)}
                      </span>
                    </p>

                    {submission.resubmissionCount > 0 && (
                      <p className="mt-1 text-sm text-violet-600">
                        Đã nộp lại {submission.resubmissionCount} lần
                      </p>
                    )}
                  </div>

                  {submission.score !== null && (
                    <div className="shrink-0 rounded-xl bg-emerald-50 px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase text-emerald-600">
                        Điểm
                      </p>

                      <p className="mt-1 text-2xl font-bold text-emerald-700">
                        {submission.score}/{assignment.maxScore}
                      </p>
                    </div>
                  )}
                </div>

                {submission.text && (
                  <div className="mt-5 rounded-lg bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700">
                      Nội dung bài làm
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {submission.text}
                    </p>
                  </div>
                )}

                <div className="mt-5">
                  <p className="text-sm font-semibold text-slate-700">
                    File bài làm
                  </p>

                  {submission.files.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">
                      Học sinh không đính kèm file.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {submission.files.map((file, index) => (
                        <div
                          key={`${file.url}-${index}`}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                        >
                          <FileText className="h-5 w-5 shrink-0 text-slate-400" />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {file.name}
                            </p>

                            {file.size !== undefined && (
                              <p className="mt-0.5 text-xs text-slate-400">
                                {formatFileSize(file.size)}
                              </p>
                            )}
                          </div>

                          <a
                            href={getFileUrl(file.url)}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Download className="h-4 w-4" />
                            Tải xuống
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-[180px_1fr_auto]">
                  <div>
                    <label
                      htmlFor={`score-${studentId}`}
                      className="text-sm font-semibold text-slate-700"
                    >
                      Điểm
                    </label>

                    <input
                      id={`score-${studentId}`}
                      type="number"
                      min={0}
                      max={assignment.maxScore}
                      step="0.5"
                      value={draft.score}
                      onChange={(event) =>
                        updateDraft(studentId, "score", event.target.value)
                      }
                      disabled={isCurrentGrading}
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`feedback-${studentId}`}
                      className="text-sm font-semibold text-slate-700"
                    >
                      Nhận xét
                    </label>

                    <textarea
                      id={`feedback-${studentId}`}
                      rows={3}
                      value={draft.feedback}
                      onChange={(event) =>
                        updateDraft(studentId, "feedback", event.target.value)
                      }
                      disabled={isCurrentGrading}
                      placeholder="Nhập nhận xét cho học sinh..."
                      className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => handleGrade(submission)}
                      disabled={isCurrentGrading || isGrading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
                    >
                      {isCurrentGrading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : submission.status === "graded" ? (
                        <Save className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}

                      {submission.status === "graded"
                        ? "Cập nhật điểm"
                        : "Chấm bài"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
