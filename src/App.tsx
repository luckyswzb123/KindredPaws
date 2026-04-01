import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Home from './pages/Home';
import Messages from './pages/Messages';
import PetDetail from './pages/PetDetail';
import Profile from './pages/Profile';
import ApplicationForm from './pages/ApplicationForm';
import About from './pages/About';
import Settings from './pages/Settings';
import Applications from './pages/Applications';
import Chat from './pages/Chat';
import BottomNav from './components/BottomNav';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ApplicationProvider } from './context/ApplicationContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthChecked } = useAuth();

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-on-surface-variant text-sm font-medium animate-pulse">正在进入系统...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />

        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/chat/:id" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/favorites" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/pet/:id" element={<PrivateRoute><PetDetail /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/apply" element={<PrivateRoute><ApplicationForm /></PrivateRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/applications" element={<PrivateRoute><Applications /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <FavoritesProvider>
          <ApplicationProvider>
            <AppRoutes />
          </ApplicationProvider>
        </FavoritesProvider>
      </AuthProvider>
    </Router>
  );
}
