# LMS System Architecture

## 1. Model relationships

Models in `backend/models`:

- `User`
  - `name`, `email`, `password`, `role`
  - `role` = `student | teacher | admin`

- `Class`
  - `name`, `description`, `schedule`
  - `teacher` -> `User`
  - `students` -> `[User]`

- `Material`
  - `title`, `fileName`, `fileUrl`, `fileType`
  - `class` -> `Class`
  - `uploadedBy` -> `User`

- `Attendance`
  - `class` -> `Class`
  - `sessionDate`
  - `records` -> `[ { student -> User, status } ]`
  - `markedBy` -> `User`

- `Quiz`
  - `title`
  - `class` -> `Class`
  - `createdBy` -> `User`
  - `questions` -> `[ { questionText, options, correctOptionIndex } ]`

- `QuizSubmission`
  - `quiz` -> `Quiz`
  - `student` -> `User`
  - `answers` -> `[ { questionIndex, selectedOptionIndex, isCorrect } ]`
  - `score`, `totalQuestions`

- `EssayAssignment`
  - `title`, `prompt`, `maxScore`
  - `class` -> `Class`
  - `createdBy` -> `User`

- `EssaySubmission`
  - `assignment` -> `EssayAssignment`
  - `student` -> `User`
  - `answerText`, `score`, `feedback`
  - `status` = `submitted | graded`
  - `gradedBy` -> `User`

### Relationship diagram (text)

```
User
 ├─[teacher]─> Class.teacher
 ├─[student]─> Class.students
 ├─[teacher]─> Material.uploadedBy
 ├─[teacher]─> Attendance.markedBy
 ├─[student]─> Attendance.records.student
 ├─[teacher]─> Quiz.createdBy
 ├─[quiz]─> QuizSubmission.quiz
 └─[student]─> QuizSubmission.student

Class
 ├─> Material.class
 ├─> Attendance.class
 ├─> Quiz.class
 ├─> EssayAssignment.class
 └─> Class.students

Quiz
 └─> QuizSubmission.quiz

EssayAssignment
 └─> EssaySubmission.assignment
```

## 2. API list

All API endpoints are implemented in `backend/server.js`.

### Authentication & user
- `POST /login`
- `POST /forgot-password`
- `POST /register`

### Admin user management
- `GET /admin/teachers`
- `POST /admin/teachers`

### Class management
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

## 3. Login flow

### Frontend flow
- User enters `email` and `password`.
- App sends `POST /login` with JSON `{ email, password }`.
- Backend validates credentials and returns `user` info.
- Frontend stores `user` in state and sessionStorage.
- If `rememberMe` is checked, frontend also stores `user` in localStorage.

### Backend flow
- `POST /login` receives payload.
- Check MongoDB connection.
- Find user by `email.toLowerCase()`.
- Compare password with bcrypt.
- If valid, return `role` and `user` object.
- No JWT or token is generated.

## 4. Class flow

### Teacher creates/updates class
- `POST /classes` create class with `{ name, description, schedule, teacherEmail, studentEmails }`.
- Teacher must exist and have role `teacher`.
- Student emails are converted to `User` ids.
- `PUT /classes/:id` updates name, description, schedule, teacher, and student list.

### Class membership
- `POST /classes/:id/students` adds one student by email.
- `DELETE /classes/:id/students/:studentId` removes a student.
- `GET /classes` returns all classes with teacher and students populated.
- `GET /student-classes?studentEmail=...` returns classes where the student is enrolled.

### Data relationships
- Class contains a single `teacher` and multiple `students`.
- Materials, attendance, quizzes, and essays are linked to `Class`.

## 5. Material flow

### Upload material
- Endpoint: `POST /classes/:id/materials`
- Request includes `{ title, fileName, fileType, fileData, teacherEmail }`.
- Only the assigned teacher for the class can upload.
- Backend saves file data as base64 to `backend/uploads` and stores record in `Material`.

### View material
- Endpoint: `GET /classes/:id/materials?viewerEmail=...`
- Only class teacher or enrolled student may view materials.
- Backend uses `viewerEmail` to determine access.

### Download material
- Endpoint: `GET /materials/:id/download?viewerEmail=...`
- Backend verifies the viewer can access the related class before sending file.

## 6. Attendance flow

### Teacher marks attendance
- Endpoint: `POST /classes/:id/attendances`
- Request includes `{ sessionDate, records, teacherEmail }`.
- `records` are objects `{ student, status }`.
- Teacher must be the class teacher.
- Backend validates each student exists in the class and each status is `present` or `absent`.
- Attendance is upserted by `{ class, sessionDate }`.

### Teacher views attendance
- Endpoint: `GET /classes/:id/attendances?teacherEmail=...`
- Endpoint: `GET /classes/:id/attendance-summary?teacherEmail=...`
- Returned data includes attendance records and class-level attendance summary.
- Only the class teacher may request these.

### Student attendance summary
- Endpoint: `GET /student-attendance-summary?studentEmail=...`
- Backend builds per-class attendance status for the student.
- Shows `presentCount`, `absentCount`, `attendanceRate`, and sessions.

## 7. Quiz flow

### Teacher creates quiz
- Endpoint: `POST /classes/:id/quizzes`
- Payload contains `{ title, questions, teacherEmail }`.
- Teacher must belong to the class.
- Questions include `questionText`, `options`, `correctOptionIndex`.

### List quizzes
- Endpoint: `GET /classes/:id/quizzes?viewerEmail=...`
- If viewer is a student, backend removes correct answer index from response.
- Teacher receives full quiz details.

### Student submits quiz
- Endpoint: `POST /quizzes/:id/submit`
- Request includes `{ studentEmail, answers }`.
- Backend validates student is enrolled in the quiz class.
- Answers are graded automatically by comparing selected index to `correctOptionIndex`.
- A `QuizSubmission` record is created or updated.

### Quiz results for student
- Endpoint: `GET /student-quiz-submissions?studentEmail=...`
- Returns all quiz submissions by student.

## 8. Essay flow

### Teacher creates essay assignment
- Endpoint: `POST /classes/:id/essays`
- Payload includes `{ title, prompt, maxScore, teacherEmail }`.
- Teacher must be the class teacher.

### Student submits essay
- Endpoint: `POST /essays/:id/submit`
- Request includes `{ studentEmail, answerText }`.
- Backend validates enrollment and stores the submission.
- Status is `submitted`.

### Teacher grades essay
- Endpoint: `PUT /essay-submissions/:id/grade`
- Request includes `{ teacherEmail, score, feedback }`.
- Backend checks teacher owns the class and score is between `0` and `9`.
- Submission is updated with `score`, `feedback`, `gradedBy`, and `status=graded`.

### Student essay history
- Endpoint: `GET /student-essay-submissions?studentEmail=...`
- Returns student's essay submissions with assignment info and grading metadata.

## Notes for backend learning

- `backend/server.js` is a single-file Express app with all routes.
- Authentication is simple: no token, email/password only.
- Authorization is done by email and role checks per route.
- Files are stored locally under `backend/uploads` using base64 POST data.
- MongoDB connection is in `server.js` using `mongoose.connect(MONGO_URI)`.
- Most route permission checks use helper functions like `canAccessClass` and `canViewClassMaterials`.
