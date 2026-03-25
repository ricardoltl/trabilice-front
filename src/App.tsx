import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TutorialProvider } from "./contexts/TutorialContext";
import AliceTutorial from "./components/AliceTutorial";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentJoin from "./pages/student/StudentJoin";
import AcceptInvite from "./pages/student/AcceptInvite";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ClassroomView from "./pages/teacher/ClassroomView";
import CreateActivity from "./pages/teacher/CreateActivity";
import EditActivity from "./pages/teacher/EditActivity";
import ActivityResults from "./pages/teacher/ActivityResults";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentActivity from "./pages/student/StudentActivity";
import StudentResult from "./pages/student/StudentResult";
import "./App.css";

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} /> : <Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join" element={<StudentJoin />} />
      <Route path="/invite/:token" element={<AcceptInvite />} />

      <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/classroom/:id" element={<ProtectedRoute role="teacher"><ClassroomView /></ProtectedRoute>} />
      <Route path="/teacher/classroom/:classroomId/new-activity" element={<ProtectedRoute role="teacher"><CreateActivity /></ProtectedRoute>} />
      <Route path="/teacher/activity/:id/edit" element={<ProtectedRoute role="teacher"><EditActivity /></ProtectedRoute>} />
      <Route path="/teacher/activity/:id/results" element={<ProtectedRoute role="teacher"><ActivityResults /></ProtectedRoute>} />

      <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/activity/:id" element={<ProtectedRoute role="student"><StudentActivity /></ProtectedRoute>} />
      <Route path="/student/activity/:id/result" element={<ProtectedRoute role="student"><StudentResult /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TutorialProvider>
          <AppRoutes />
          <AliceTutorial />
        </TutorialProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
