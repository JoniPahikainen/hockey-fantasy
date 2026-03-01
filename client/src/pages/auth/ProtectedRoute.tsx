import { Navigate, Outlet } from "react-router-dom";

type ProtectedRouteProps = {
  adminOnly?: boolean;
};

const ProtectedRoute = ({ adminOnly }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly) {
    const userStr = localStorage.getItem("user");
    if (!userStr) return <Navigate to="/login" replace />;
    let user: { role?: string };
    try {
      user = JSON.parse(userStr);
    } catch {
      return <Navigate to="/login" replace />;
    }
    if (user.role !== "admin") {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;