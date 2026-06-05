// src/App.tsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/authContext";

// Import Các Trang Giao Diện Công Cộng
import LandingPage from "./pages/landingPage"; // Thêm trang này
import Login from "./pages/login";
import Register from "./pages/register";
import ForceChangePassword from "./pages/forceChangePassword";

// Import Phân khu Member
import MemberBooking from "./pages/member/memberBooking";

// Import Phân khu Admin
import AdminLayout from "./pages/admin/adminLayout";
import Dashboard from "./pages/admin/adminDashboard";
import Profile from "./pages/admin/adminProfile";
import Members from "./pages/admin/adminMembers";
import Packages from "./pages/admin/adminPackages";
// import CheckIn from "@/pages/admin/CheckIn";
import Staffs from "./pages/admin/adminStaffs";

interface ProtectedRouteProps {
  allowedRoles?: Array<"ADMIN" | "RECEPTIONIST" | "PT" | "MEMBER">;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        🔄 Đang xác thực quyền truy cập...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    alert("Bạn không có quyền truy cập vào khu vực này!");
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ================= 🔓 1. VÙNG CÔNG CỘNG ================= */}
          <Route path="/" element={<LandingPage />} />{" "}
          {/* Bộ mặt phòng gym nằm ở đây */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/force-change-password"
            element={<ForceChangePassword />}
          />
          {/* ================= 👤 2. PHÂN KHU MEMBER ================= */}
          <Route element={<ProtectedRoute allowedRoles={["MEMBER"]} />}>
            <Route path="/member/booking" element={<MemberBooking />} />
          </Route>
          {/* ================= 🛡️ 3. PHÂN KHU BẢO VỆ CHUNG ================= */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "RECEPTIONIST", "PT"]} />
            }
          >
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/profile" element={<Profile />} />
              <Route path="/admin/members" element={<Members />} />

              {/* ================= 💰 3. PHÂN KHU NGHIỆP VỤ (ADMIN + LỄ TÂN) ================= */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["ADMIN", "RECEPTIONIST"]} />
                }
              >
                <Route path="/admin/packages" element={<Packages />} />
                {/* <Route path="/admin/checkin" element={<CheckIn />} /> */}
              </Route>

              {/* ================= 👑 4. PHÂN KHU TỐI CAO (CHỈ ADMIN) ================= */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/admin/staffs" element={<Staffs />} />
              </Route>
            </Route>
          </Route>
          {/* ================= 🚪 5. ROUTE BẪY CỨU HỘ ================= */}
          {/* Người dùng gõ bậy bạ URL thì đẩy thẳng về trang chủ Landing Page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      <Toaster />
    </BrowserRouter>
  );
};

export default App;
