# PROJECT LOG - English Center LMS

## 1. Current Status

- **Phase**: Teacher Class Detail Implementation
- **Main Flow**: TeacherClassesPage → View Details → ClassDetailPage → Section Navigation
- **State Management**: AppShell manages `selectedClass` and `teacherView` for class detail flow
- **Class Detail Page**: Receives `classItem` and `onBack` props
- **Navigation**: Back button successfully returns to Classes list
- **Section Switching**: `activeSection` state controls display of Students / Materials / Attendance / Quizzes / Essays

## 2. Recently Completed

### Code Structure

- Extracted ClassDetailPage into modular section components:
  - `ClassStudentsSection.jsx` - displays students from `classItem.students`
  - `ClassMaterialsSection.jsx` - **IMPLEMENTED** with fetch + upload
  - `ClassAttendanceSection.jsx` - placeholder only
  - `ClassQuizzesSection.jsx` - placeholder only
  - `ClassEssaysSection.jsx` - placeholder only

### Materials Section Implementation (DONE)

- Fetches materials via `GET /classes/:id/materials?viewerEmail=...`
- Displays loading/error/empty states with proper messaging
- Shows material list with title, file link, uploader name, upload timestamp
- Upload form with title input, file picker
- POST upload via `POST /classes/:id/materials`
- Auto-reload materials list after successful upload
- Payload includes: title, fileName, fileType, fileData (base64), teacherEmail

## 3. Important Rules for Next Work

- **Backend**: No changes unless absolutely necessary
- **Data Loading**: Do NOT fetch all class details when opening ClassDetailPage
- **Lazy Loading**: Each section should fetch data only when opened
- **Focus**: Make small, focused changes that are easy to review
- **Credits**: Prioritize efficient implementations to save Codex usage

## 4. Current Implementation Details

### ClassMaterialsSection Behavior

- **Trigger**: Fetches when component renders with valid `classItem._id` and `teacherEmail`
- **Source**: Uses `classItem.teacher.email` from the class object
- **API**: GET endpoint with viewerEmail query param
- **Cache**: Stores fetched materials in local component state
- **Reload**: After upload, prepends new material to existing list without full refetch

### Why This Saves Load

- Materials only fetch when Materials section tab is clicked
- No pre-loading all class materials when viewing class list
- Each section independent - opening one section doesn't load others
- Reduces initial page load time and bandwidth usage

## 5. Next Recommended Steps

### Priority 1 - Attendance Section (Similar to Materials)

- Implement lazy fetch for `GET /classes/:id/attendances`
- Show attendance history list with student name, date, status
- Add simple mark attendance form if backend supports

### Priority 2 - Quizzes Section

- Implement lazy fetch for `GET /classes/:id/quizzes`
- Show quiz list with title, question count, submission count
- Add create quiz form if backend supports

### Priority 3 - Essays Section

- Implement lazy fetch for `GET /classes/:id/essays`
- Show essay list with title, prompt, submission count
- Add create essay form if backend supports

### Priority 4 - Refinements

- Add delete/edit for materials if needed
- Add attendance summary view
- Add quiz grading interface

## 6. Files Modified This Session

- `src/pages/teacher/ClassMaterialsSection.jsx` - full implementation with fetch + upload
- `src/pages/teacher/ClassDetailPage.jsx` - updated to pass `classItem` prop to materials section
- No backend changes
- No other frontend refactoring

## 7. Files to Check on Next Session

**Core Teacher Class Detail Files**:

- `src/components/layout/AppShell.jsx` - state management
- `src/pages/teacher/TeacherClassesPage.jsx` - class list view
- `src/pages/teacher/ClassDetailPage.jsx` - section routing
- `src/pages/teacher/ClassStudentsSection.jsx` - student display
- `src/pages/teacher/ClassMaterialsSection.jsx` - materials (IMPLEMENTED)
- `src/pages/teacher/ClassAttendanceSection.jsx` - next to implement
- `src/pages/teacher/ClassQuizzesSection.jsx` - future implementation
- `src/pages/teacher/ClassEssaysSection.jsx` - future implementation

**Backend Reference** (do not modify without review):

- `backend/server.js` - check endpoints before implementing sections
- `backend/models/Material.js` - understand data structure

## 8. Known API Endpoints

```
GET /classes/:id/materials?viewerEmail=...
POST /classes/:id/materials
  {
    title: string,
    fileName: string,
    fileType: string,
    fileData: base64,
    teacherEmail: string
  }

GET /classes/:id/attendances?teacherEmail=...
POST /classes/:id/attendances

GET /classes/:id/quizzes?viewerEmail=...
POST /classes/:id/quizzes

GET /classes/:id/essays?viewerEmail=...
POST /classes/:id/essays
```

## 9. Notes for Next Developer (Codex)

**Before Starting**:

1. Read this PROJECT_LOG.md completely
2. Check the "Next Recommended Steps" section
3. Only inspect files directly related to your task

**When Implementing New Section**:

1. Follow the ClassMaterialsSection pattern (useEffect + lazy fetch)
2. Use the same API_URL constant and readFileAsDataUrl utility if needed
3. Add `classItem` prop to the new section component
4. Update ClassDetailPage.jsx to pass `classItem` prop
5. Do NOT modify other sections or AppShell logic

**Commit Convention**:

- Small feature: `feat: implement [section]Section`
- Bug fix: `fix: [brief description]`
- Docs: `docs: [brief description]`
- Always include what was changed, not implementation details

**Avoid**:

- Refactoring unrelated files
- Changing the flow/state management without discussion
- Modifying backend without confirming it doesn't break other features
- Creating multiple PRs for one feature

## 10. Build Status

- Latest build: **PASSING** ✓
- Build command: `npm run build`
- No compilation errors
- Ready for development server testing

---

**Last Updated**: June 4, 2026 - ClassMaterialsSection implementation complete
