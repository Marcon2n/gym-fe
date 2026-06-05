// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";

// 1. Định nghĩa kiểu dữ liệu cho User trong hệ thống của bạn
export interface User {
  id: number;
  name: string;
  role: "ADMIN" | "RECEPTIONIST" | "PT" | "MEMBER";
}

// 2. Định nghĩa cấu trúc dữ liệu mã hóa bên trong chuỗi Token JWT
interface JWTPayload {
  id: number;
  role: string;
  iat: number;
  exp: number; // Thời gian hết hạn (tính bằng giây)
}

// 3. Định nghĩa các giá trị và hàm mà AuthContext sẽ cung cấp toàn cục
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

// Khởi tạo Context với giá trị mặc định là null nhưng ép kiểu AuthContextType
const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): ReactNode => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Dùng kiểu NodeJS.Timeout hoặc number tùy môi trường, để undefined cho lành tính với cả trình duyệt
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Hàm Đăng xuất
  const logout = (): void => {
    localStorage.removeItem("accessToken");
    setUser(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    navigate("/", { replace: true });
  };

  // Hàm thiết lập bộ đếm ngược tự động Logout khi Token hết hạn
  const setAutoLogoutTimer = (expTimeInSeconds: number): void => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const currentTimeInSeconds = Date.now() / 1000;
    const timeLeftInMilliseconds =
      (expTimeInSeconds - currentTimeInSeconds) * 1000;

    if (timeLeftInMilliseconds <= 0) {
      logout();
    } else {
      timerRef.current = setTimeout(() => {
        alert("⏰ Phiên đăng nhập đã hết hạn! Hệ thống tự động đăng xuất.");
        logout();
      }, timeLeftInMilliseconds);
    }
  };

  // Khôi phục phiên làm việc khi F5 trang
  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Giải mã token dạng generic ứng với interface JWTPayload
        const decoded = jwtDecode<JWTPayload>(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          logout();
          return;
        }

        setAutoLogoutTimer(decoded.exp);

        // Gọi API Backend check quyền và lấy thông tin user mới nhất
        const response = await api.get<{ data?: User } & User>("/auth/me");

        // Tùy thuộc cấu trúc Backend bọc data hay trả thẳng object
        const currentUser = response.data || response;
        setUser(currentUser as User);
      } catch (error) {
        console.error("Xác thực Token gốc thất bại:", error);
        localStorage.removeItem("accessToken");
        setUser(null);
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Hàm Xử lý Đăng nhập thành công
  const login = (token: string, userData: User): void => {
    localStorage.setItem("accessToken", token);
    setUser(userData);

    const decoded = jwtDecode<JWTPayload>(token);
    setAutoLogoutTimer(decoded.exp);
  };

  const value = { user, loading, isAuthenticated: !!user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook để xài ké dữ liệu Auth, có kiểm tra lỗi để tránh xài ngoài Provider
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth bắt buộc phải được đặt bên trong một AuthProvider!",
    );
  }
  return context;
};
