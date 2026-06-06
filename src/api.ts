// src/api.ts
// Sửa dòng cũ thành dòng này:
import axios, {
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { toast } from "sonner"; // Cài sonner để thông báo cho đẹp, hoặc dùng alert nếu chưa có

// Định nghĩa kiểu dữ liệu cho cấu trúc lỗi của Backend
interface BackendErrorResponse {
  success?: boolean;
  message?: string;
  error?: {
    details?: string;
    code?: string;
    temporaryToken?: string;
  };
}

const api = axios.create({
  baseURL: "https://api-gym.devcode.sbs/api", // Cổng BE của bạn
  timeout: 10000, // Quá 10 giây không rep -> Ngắt
});

// ================= 🔄 1. INTERCEPTOR CHIỀU ĐI (REQUEST) =================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Ưu tiên dùng accessToken, nếu không có (đang ở luồng đổi pass) thì dùng tempToken
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("tempToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// ================= 🔄 2. INTERCEPTOR CHIỀU VỀ (RESPONSE) =================
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // BE trả về cấu trúc response.data, bóc tách lấy dữ liệu sạch bên trong luôn
    return response.data;
  },
  (error: AxiosError<BackendErrorResponse>) => {
    // Nếu Server có phản hồi lỗi về (Có Status Code rõ ràng)
    if (error.response) {
      const status = error.response.status;
      const backendData = error.response.data;

      // 🚨 CASE 1: Ép đổi mật khẩu mặc định (403 + Code chuẩn)
      // backendData.error chứa payload gốc từ BE sau khi responseFormatter wrap
      if (
        status === 403 &&
        backendData?.error?.code === "NEED_CHANGE_PASSWORD"
      ) {
        const tempToken = backendData.error?.temporaryToken;
        if (tempToken) {
          localStorage.setItem("tempToken", tempToken);
        }
        window.location.href = "/force-change-password";
        // Trả về promise không bao giờ resolve để tránh catch của caller chạy thêm
        return new Promise(() => {});
      }

      // 🚨 CASE 2: Token hết hạn hoặc không hợp lệ (401)
      if (status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("tempToken");
        // Chỉ chuyển hướng nếu người dùng không phải đang ở trang login sẵn
        if (window.location.pathname !== "/login") {
          toast.error("Phiên làm việc hết hạn, vui lòng đăng nhập lại!");
          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
        }
        return Promise.reject(backendData);
      }

      // 🚨 CASE 3: Sai quyền truy cập (403 thường - Ví dụ PT đòi vào sửa Staff)
      if (status === 403) {
        toast.error(
          backendData?.message || "Bạn không có quyền thực hiện hành động này!",
        );
        return Promise.reject(backendData);
      }

      // 🚨 CASE 4: Lỗi validate Form hoặc logic nghiệp vụ từ BE (400, 422, 404...)
      const errorMessage =
        backendData?.error?.details ||
        backendData?.message ||
        "Đã xảy ra lỗi hệ thống!";
      toast.error(errorMessage);
      return Promise.reject(backendData);
    }
    // Nếu gửi Request đi nhưng Server không phản hồi (Sập nguồn, mất mạng, sai cổng PORT)
    else if (error.request) {
      toast.error(
        "🔌 Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng!",
      );
      return Promise.reject(new Error("Network Error"));
    }
    // Các lỗi thiết lập khác phát sinh trong quá trình setup code FE
    else {
      toast.error("Cấu hình request xảy ra lỗi!");
      return Promise.reject(error);
    }
  },
);

export default api;
