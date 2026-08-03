import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import SplashScreen from './pages/SplashScreen.jsx'
import AuthScreen from './pages/AuthScreen.jsx'
import GenderSelectScreen from './pages/GenderSelectScreen.jsx'
import DashboardScreen from './pages/DashboardScreen.jsx'
import UploadScreen from './pages/UploadScreen.jsx'
import ClosetScreen from './pages/ClosetScreen.jsx'
import ChatbotScreen from './pages/ChatbotScreen.jsx'
import VisualizeScreen from './pages/VisualizeScreen.jsx'

function AppRoutes() {
  const { user, loading } = useAuth()

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<SplashScreen />} />
      <Route
        path="/auth"
        element={
          !loading && user ? <Navigate to="/dashboard" replace /> : <AuthScreen />
        }
      />

      {/* Gender select — accessible if logged in but no gender set */}
      <Route
        path="/gender-select"
        element={
          !loading && !user ? (
            <Navigate to="/auth" replace />
          ) : (
            <GenderSelectScreen />
          )
        }
      />

      {/* Protected routes — require auth + gender */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/upload" element={<UploadScreen />} />
        <Route path="/closet" element={<ClosetScreen />} />
        <Route path="/chatbot" element={<ChatbotScreen />} />
        <Route path="/visualize" element={<VisualizeScreen />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
