# LMS Backend Summary

## 1. Các model MongoDB

Backend dùng 8 model Mongoose trong models:

- `User`
  - `name`, `email`, `password`, `role`
  - `role` là `student | teacher | admin`
  - `timestamps: true`

- `Class`
  - `name`, `description`, `schedule`
  - `teacher` tham chiếu `User`
  - `students` là mảng `User`

- `Material`
  - `title`, `fileName`, `fileUrl`, `fileType`
  - `class` tham chiếu `Class`
  - `uploadedBy` tham chiếu `User`

- `Attendance`
  - `class` tham chiếu `Class`
  - `sessionDate`
  - `records`: mỗi record chứa `student` tham chiếu `User` và `status` là `present | absent`
  - `markedBy` tham chiếu `User`
  - index `{ class: 1, sessionDate: 1 }` unique

- `Quiz`
  - `title`
  - `class` tham chiếu `Class`
  - `createdBy` tham chiếu `User`
  - `questions`: `questionText`, `options`, `correctOptionIndex`

- `QuizSubmission`
  - `quiz` tham chiếu `Quiz`
  - `student` tham chiếu `User`
  - `answers`: mỗi answer có `questionIndex`, `selectedOptionIndex`, `isCorrect`
  - `score`, `totalQuestions`
  - index `{ quiz: 1, student: 1 }` unique

- `EssayAssignment`
  - `title`, `prompt`
  - `class` tham chiếu `Class`
  - `createdBy` tham chiếu `User`
  - `maxScore`

- `EssaySubmission`
  - `assignment` tham chiếu `EssayAssignment`
  - `student` tham chiếu `User`
  - `answerText`, `score`, `feedback`
  - `status` là `submitted | graded`
  - `gradedBy` tham chiếu `User`
  - index `{ assignment: 1, student: 1 }` unique

---

## 2. Các API Express

Toàn bộ API nằm trong server.js.

### Auth / User
- `POST /login`
- `POST /forgot-password`
- `POST /register`

### User list
- `GET /students`
- `GET /admin/teachers`
- `POST /admin/teachers`

### Class
- `GET /classes`
- `GET /student-classes?studentEmail=...`
- `POST /classes`
- `PUT /classes/:id`
- `POST /classes/:id/students`
- `DELETE /classes/:id/students/:studentId`

### Material
- `GET /classes/:id/materials?viewerEmail=...`
- `GET /materials/:id/download?viewerEmail=...`
- `POST /classes/:id/materials`

### Attendance
- `GET /classes/:id/attendances?teacherEmail=...`
- `GET /classes/:id/attendance-summary?teacherEmail=...`
- `GET /student-attendance-summary?studentEmail=...`
- `POST /classes/:id/attendances`

### Quiz
- `GET /classes/:id/quizzes?viewerEmail=...`
- `POST /classes/:id/quizzes`
- `POST /quizzes/:id/submit`
- `GET /student-quiz-submissions?studentEmail=...`

### Essay
- `GET /classes/:id/essays?viewerEmail=...`
- `POST /classes/:id/essays`
- `POST /essays/:id/submit`
- `PUT /essay-submissions/:id/grade`
- `GET /student-essay-submissions?studentEmail=...`

### Progress
- `GET /student-progress-summary?studentEmail=...`

---

## 3. Luồng đăng nhập

### Frontend
- App.jsx
- Người dùng nhập `email` + `password`
- Gọi `POST ${API_URL}/login` với body JSON `{ email, password }`
- Nếu thành công:
  - lưu `user` vào state
  - lưu vào `sessionStorage`
  - nếu chọn `rememberMe` thì lưu vào `localStorage`

### Backend
- `POST /login`
- kiểm tra MongoDB
- tìm `User.findOne({ email: email.toLowerCase() })`
- so sánh bcrypt với `user.password`
- nếu đúng trả về:
  - `message: "Login thanh cong"`
  - `role`
  - `user: { id, name, email, role }`

### Ghi chú
- Không có JWT/token
- Xác thực dựa trên email/password mỗi request không bắt buộc, nhiều endpoint chỉ dùng `teacherEmail` / `studentEmail` query/body để kiểm tra quyền

---

## 4. Luồng Quiz

### Giáo viên tạo quiz
- Frontend:
  - `handleSaveQuiz` gọi `POST ${API_URL}/classes/${classId}/quizzes`
  - body: `{ title, questions, teacherEmail: user.email }`
- Backend:
  - `POST /classes/:id/quizzes`
  - kiểm tra `teacherEmail` có là teacher của lớp không
  - lưu `Quiz` với `questions` và `correctOptionIndex`

### Lấy danh sách quiz
- `GET /classes/:id/quizzes?viewerEmail=...`
- Nếu viewer là student: backend trả `sanitizeQuizForStudent`
  - ẩn `correctOptionIndex`
  - chỉ trả `questionText` và `options`
- Nếu viewer là teacher: trả đầy đủ quiz

### Học sinh nộp bài
- Frontend:
  - `handleSubmitQuiz(quiz)`
  - xây `answers` từ `quiz.questions`
  - gọi `POST ${API_URL}/quizzes/${quiz._id}/submit`
  - body: `{ studentEmail: user.email, answers }`
- Backend:
  - `POST /quizzes/:id/submit`
  - tìm quiz, tìm class, tìm student
  - kiểm tra student thuộc lớp bằng `canAccessClass`
  - với mỗi câu hỏi, so sánh `selectedOptionIndex === question.correctOptionIndex`
  - tính `score`
  - upsert `QuizSubmission` cho `(quiz, student)`
  - trả về submission đã graded

### Học sinh xem kết quả
- `GET /student-quiz-submissions?studentEmail=...`

---

## 5. Luồng Attendance

### Giáo viên xem attendance
- `GET /classes/:id/attendances?teacherEmail=...`
- `GET /classes/:id/attendance-summary?teacherEmail=...`

### Giáo viên chấm điểm danh
- Frontend:
  - `handleSaveAttendance(classItem)`
  - chuẩn bị `records` từ `attendanceRecordsByClass[classId]`
  - gọi `POST ${API_URL}/classes/${classItem._id}/attendances`
  - body: `{ sessionDate, records, teacherEmail: user.email }`
- Backend:
  - `POST /classes/:id/attendances`
  - kiểm tra class tồn tại
  - kiểm tra `teacherEmail` đúng teacher của lớp
  - xác thực mỗi record:
    - student phải thuộc class
    - status phải là `present` hoặc `absent`
  - upsert `Attendance` theo `{ class, sessionDate }`

### Học sinh xem chấm công
- `GET /student-attendance-summary?studentEmail=...`
- Backend trả summary theo từng lớp, tính `presentCount`, `absentCount`, `attendanceRate`

---

## 6. Tổng quan

- Backend dùng mô hình `User`-`Class` liên kết với `Attendance`, `Quiz`, `QuizSubmission`, `Material`, `EssayAssignment`, `EssaySubmission`
- Frontend `App.jsx` điều khiển toàn bộ: login/register, tạo lớp, upload tài liệu, điểm danh, quiz, essay
- Quyền truy cập dựa trên email và role, không dùng token phức tạp
