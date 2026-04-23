import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Features from "./pages/Features";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./layouts/DashboardLayout";
import TextToSpeech from "./pages/dashboard/TextToSpeech";
import VoiceCloning from "./pages/dashboard/VoiceCloning";
import HistoryPage from "./pages/dashboard/History";
import SettingsPage from "./pages/dashboard/Settings";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppContent() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <>
          <Header />
          <Home />
          <Footer />
        </>
      } />
      <Route path="/features" element={
        <>
          <Header />
          <Features />
          <Footer />
        </>
      } />
      <Route path="/about" element={
        <>
          <Header />
          <About />
          <Footer />
        </>
      } />
      <Route path="/login" element={
        <>
          <Header />
          <Login />
          <Footer />
        </>
      } />
      <Route path="/register" element={
        <>
          <Header />
          <Register />
          <Footer />
        </>
      } />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard/tts" replace />} />
        <Route path="tts" element={<TextToSpeech />} />
        <Route path="clone" element={<VoiceCloning />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
