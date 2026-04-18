import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import MovieInfo from "./pages/MovieInfo";
<<<<<<< HEAD
<<<<<<< HEAD
import AiPage from "./pages/AiPage";
=======
>>>>>>> abc829b (Connecting the workflow)
=======
import AiPage from "./pages/AiPage";
>>>>>>> 6061ee5 (That's some optmisation)
import AvatarSelection from "./pages/AvatarSelection";
import RoomsPage from "./pages/RoomsPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppShellProvider } from "./context/AppShellContext";
import LoadingScreen from "./components/common/LoadingScreen";

function ProtectedRoutes() {
  const { user, loading, hasSelectedAvatar } = useAuth();

  if (loading) {
    return <LoadingScreen label="Checking your session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasSelectedAvatar) {
    return <Navigate to="/avatar" replace />;
  }

  return (
    <AppShellProvider>
      <Outlet />
    </AppShellProvider>
  );
}

function AvatarRoute() {
  const { user, loading, hasSelectedAvatar } = useAuth();

  if (loading) {
    return <LoadingScreen label="Preparing avatar selection..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (hasSelectedAvatar) {
    return <Navigate to="/home" replace />;
  }

  return <AvatarSelection />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, hasSelectedAvatar } = useAuth();

  if (loading) {
    return <LoadingScreen label="Loading..." />;
  }

  if (user) {
    return <Navigate to={hasSelectedAvatar ? "/home" : "/avatar"} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <SignupPage />
              </GuestRoute>
            }
          />
          <Route path="/avatar" element={<AvatarRoute />} />

          <Route element={<ProtectedRoutes />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/movies/:movieId" element={<MovieInfo />} />
<<<<<<< HEAD
<<<<<<< HEAD
            <Route path="/movies/:movieId/ai" element={<AiPage />} />
=======
>>>>>>> abc829b (Connecting the workflow)
=======
            <Route path="/movies/:movieId/ai" element={<AiPage />} />
>>>>>>> 6061ee5 (That's some optmisation)
            <Route path="/rooms" element={<RoomsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
