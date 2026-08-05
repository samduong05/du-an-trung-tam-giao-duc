import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Paperclip,
  RefreshCw,
  Send,
  Upload,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";

import {
  type AssignmentFile,
  type AssignmentSubmission,
  type AssignmentType,
  type SubmissionStatus,
  useGetAssignmentByIdQuery,
  useSubmitAssignmentMutation,
  useUploadAssignmentSubmissionFilesMutation,
} from "../../store/api/assignmentsApi";

const assignmentTypeLabels: Record<AssignmentType, string> = {
  homework: "Bài tập về nhà",
  classwork: "Bài tập trên lớp",
  essay: "Bài luận",
  project: "Dự án",
};

const submissionStatusLabels: Record<SubmissionStatus, string> = {
  submitted: "Đã nộp",
  late: "Nộp muộn",
  graded: "Đã chấm",
  returned: "Đã trả bài",
};

const submissionStatusClassNames: Record<SubmissionStatus, string> = {
  submitted: "bg-blue-50 text-blue-700",
  late: "bg-amber-50 text-amber-700",
  graded: "bg-emerald-50 text-emerald-700",
  returned: "bg-violet-50 text-violet-700",
};

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const allowedExtensions = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "txt",
  "jpg",
  "jpeg",
  "png",
  "webp",
];

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

const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() ?? "";
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

const getFileUrl = (url: string): string => {
  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  const backendUrl = import.meta.env.VITE_API_URL;

  if (backendUrl) {
    return `${backendUrl}${url}`;
  }

  return url;
};

export default function StudentAssignmentDetailPage() {
  const { classId, assignmentId } = useParams<{
    classId: string;
    assignmentId: string;
  }>();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAssignmentByIdQuery(assignmentId ?? "", {
    skip: !assignmentId,
  });

  const [
    uploadAssignmentSubmissionFiles,
    { isLoading: isUploading },
  ] = useUploadAssignmentSubmissionFilesMutation();

  const [submitAssignment, { isLoading: isSubmitting }] =
    useSubmitAssignmentMutation();

  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<AssignmentFile[]>([]);
  const [loadedSubmissionId, setLoadedSubmissionId] = useState<string | null>(
    null,
  );

  const assignment = data?.assignment;
  const mySubmission = assignment?.mySubmission ?? null;

  useEffect(() => {
    if (!assignment) {
      return;
    }

    const submission = assignment.mySubmission;

    if (!submission) {
      if (loadedSubmissionId !== "NEW") {
        setText("");
        setExistingFiles([]);
        setSelectedFiles([]);
        setLoadedSubmissionId("NEW");
      }

      return;
    }

    if (loadedSubmissionId === submission._id) {
      return;
    }

    setText(submission.text ?? "");
    setExistingFiles(submission.files ?? []);
    setSelectedFiles([]);
    setLoadedSubmissionId(submission._id);
  }, [assignment, loadedSubmissionId]);

  if (!classId || !assignmentId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-700">
          Không tìm thấy lớp học hoặc bài tập cần xem.
        </p>

        <Link
          to="/student/classes"
          className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Quay lại lớp học của tôi
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-slate-500">
          Đang tải bài tập...
        </p>
      </div>
    );
  }

  if (isError || !assignment) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h1 className="font-semibold text-red-700">
          Không thể tải bài tập
        </h1>

        <p className="mt-1 text-sm text-red-600">
          Bài tập không tồn tại hoặc bạn không có quyền truy cập.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>

          <Link
            to={`/student/classes/${classId}/assignments`}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const isExpired =
    new Date(assignment.dueDate).getTime() < Date.now();

  const cannotSubmitLate =
    isExpired && !assignment.allowLateSubmission;

  const cannotResubmit =
    Boolean(mySubmission) && !assignment.allowResubmission;

  const canSubmit =
    !cannotSubmitLate &&
    !cannotResubmit &&
    !isUploading &&
    !isSubmitting;

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const newFiles = Array.from(event.target.files ?? []);

    if (newFiles.length === 0) {
      return;
    }

    const totalFiles =
      existingFiles.length +
      selectedFiles.length +
      newFiles.length;

    if (totalFiles > MAX_FILES) {
      toast.error(
        `Bài nộp chỉ được đính kèm tối đa ${MAX_FILES} file`,
      );

      event.target.value = "";
      return;
    }

    const invalidFile = newFiles.find(
      (file) =>
        !allowedExtensions.includes(
          getFileExtension(file.name),
        ),
    );

    if (invalidFile) {
      toast.error(
        `Định dạng file "${invalidFile.name}" không được hỗ trợ`,
      );

      event.target.value = "";
      return;
    }

    const oversizedFile = newFiles.find(
      (file) => file.size > MAX_FILE_SIZE,
    );

    if (oversizedFile) {
      toast.error(
        `File "${oversizedFile.name}" vượt quá 10 MB`,
      );

      event.target.value = "";
      return;
    }

    const duplicatedFile = newFiles.find((newFile) =>
      selectedFiles.some(
        (currentFile) =>
          currentFile.name === newFile.name &&
          currentFile.size === newFile.size,
      ),
    );

    if (duplicatedFile) {
      toast.error(
        `File "${duplicatedFile.name}" đã được chọn`,
      );

      event.target.value = "";
      return;
    }

    setSelectedFiles((currentFiles) => [
      ...currentFiles,
      ...newFiles,
    ]);

    event.target.value = "";
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter(
        (_, fileIndex) => fileIndex !== index,
      ),
    );
  };

  const handleRemoveExistingFile = (index: number) => {
    setExistingFiles((currentFiles) =>
      currentFiles.filter(
        (_, fileIndex) => fileIndex !== index,
      ),
    );
  };

  const handleSubmit = async () => {
    const normalizedText = text.trim();

    if (
      !normalizedText &&
      existingFiles.length === 0 &&
      selectedFiles.length === 0
    ) {
      toast.error(
        "Bài nộp phải có nội dung hoặc ít nhất một file",
      );

      return;
    }

    if (cannotSubmitLate) {
      toast.error(
        "Bài tập đã quá hạn và không cho phép nộp muộn",
      );

      return;
    }

    if (cannotResubmit) {
      toast.error(
        "Bài tập này không cho phép nộp lại",
      );

      return;
    }

    try {
      let uploadedFiles: AssignmentFile[] = [];

      if (selectedFiles.length > 0) {
        const uploadResponse =
          await uploadAssignmentSubmissionFiles(
            selectedFiles,
          ).unwrap();

        uploadedFiles = uploadResponse.files;
      }

      const files = [
        ...existingFiles,
        ...uploadedFiles,
      ];

      await submitAssignment({
        assignmentId: assignment._id,
        text: normalizedText,
        files,
      }).unwrap();

      toast.success(
        mySubmission
          ? "Nộp lại bài thành công"
          : "Nộp bài thành công",
      );

      setSelectedFiles([]);
    } catch (error) {
      toast.error(
        getErrorMessage(error) ?? "Nộp bài thất bại",
      );
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to={`/student/classes/${classId}/assignments`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách bài tập
      </Link>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {assignmentTypeLabels[assignment.type]}
              </span>

              {isExpired ? (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                  Đã hết hạn
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Đang nhận bài
                </span>
              )}

              {assignment.allowLateSubmission && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  Cho phép nộp muộn
                </span>
              )}

              {assignment.allowResubmission && (
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                  Cho phép nộp lại
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              {assignment.title}
            </h1>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {assignment.description}
            </p>
          </div>

          <div className="shrink-0 rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <p className="text-slate-500">
              Điểm tối đa
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {assignment.maxScore}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-slate-400" />
            Hạn nộp: {formatDateTime(assignment.dueDate)}
          </span>

          {isFetching && (
            <span className="inline-flex items-center gap-2 text-slate-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Đang cập nhật
            </span>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-blue-600" />

          <h2 className="text-lg font-bold text-slate-900">
            File giáo viên giao
          </h2>
        </div>

        {assignment.attachments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Bài tập này không có file đính kèm.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {assignment.attachments.map((file, index) => (
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
      </section>

      {mySubmission && (
        <SubmissionResult
          submission={mySubmission}
          maxScore={assignment.maxScore}
        />
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-600" />

          <h2 className="text-lg font-bold text-slate-900">
            {mySubmission ? "Bài làm của bạn" : "Nộp bài"}
          </h2>
        </div>

        {cannotSubmitLate && !mySubmission && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <p className="font-semibold text-red-700">
                Đã hết hạn nộp bài
              </p>

              <p className="mt-1 text-sm text-red-600">
                Giáo viên không cho phép nộp bài sau thời hạn.
              </p>
            </div>
          </div>
        )}

        {cannotResubmit && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

            <div>
              <p className="font-semibold text-blue-700">
                Bạn đã nộp bài
              </p>

              <p className="mt-1 text-sm text-blue-600">
                Bài tập này không cho phép nộp lại.
              </p>
            </div>
          </div>
        )}

        <div className="mt-5">
          <label
            htmlFor="submission-text"
            className="text-sm font-semibold text-slate-700"
          >
            Nội dung bài làm
          </label>

          <textarea
            id="submission-text"
            rows={6}
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={!canSubmit}
            placeholder="Nhập nội dung hoặc ghi chú cho giáo viên..."
            className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                File bài làm
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Tối đa 5 file, mỗi file không quá 10 MB.
              </p>
            </div>

            <label
              className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition ${
                canSubmit &&
                existingFiles.length + selectedFiles.length < MAX_FILES
                  ? "cursor-pointer hover:bg-slate-50"
                  : "cursor-not-allowed opacity-50"
              }`}
            >
              <Upload className="h-4 w-4" />
              Chọn file

              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                disabled={
                  !canSubmit ||
                  existingFiles.length + selectedFiles.length >= MAX_FILES
                }
                className="hidden"
              />
            </label>
          </div>

          {existingFiles.length === 0 &&
          selectedFiles.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">
              <Upload className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-2 text-sm text-slate-500">
                Chưa có file bài làm.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {existingFiles.map((file, index) => (
                <div
                  key={`${file.url}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <FileText className="h-5 w-5 shrink-0 text-slate-400" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {file.name}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      File đã nộp
                      {file.size !== undefined
                        ? ` · ${formatFileSize(file.size)}`
                        : ""}
                    </p>
                  </div>

                  {canSubmit && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveExistingFile(index)
                      }
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Xóa ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/40 p-3"
                >
                  <FileText className="h-5 w-5 shrink-0 text-blue-500" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {file.name}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Chờ tải lên · {formatFileSize(file.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveSelectedFile(index)
                    }
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Bỏ chọn ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {(isUploading || isSubmitting) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {isUploading
              ? "Đang tải file..."
              : isSubmitting
                ? "Đang nộp bài..."
                : mySubmission
                  ? "Nộp lại bài"
                  : "Nộp bài"}
          </button>
        </div>
      </section>
    </div>
  );
}

interface SubmissionResultProps {
  submission: AssignmentSubmission;
  maxScore: number;
}

function SubmissionResult({
  submission,
  maxScore,
}: SubmissionResultProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />

          <h2 className="text-lg font-bold text-slate-900">
            Trạng thái bài nộp
          </h2>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            submissionStatusClassNames[submission.status]
          }`}
        >
          {submissionStatusLabels[submission.status]}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-sm text-slate-500">
            Thời gian nộp
          </dt>

          <dd className="mt-1 font-semibold text-slate-900">
            {formatDateTime(submission.submittedAt)}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-slate-500">
            Số lần nộp lại
          </dt>

          <dd className="mt-1 font-semibold text-slate-900">
            {submission.resubmissionCount}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-slate-500">
            Điểm
          </dt>

          <dd className="mt-1 font-semibold text-slate-900">
            {submission.score === null
              ? "Chưa chấm"
              : `${submission.score}/${maxScore}`}
          </dd>
        </div>
      </dl>

      {submission.feedback && (
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">
            Nhận xét của giáo viên
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {submission.feedback}
          </p>
        </div>
      )}
    </section>
  );
}