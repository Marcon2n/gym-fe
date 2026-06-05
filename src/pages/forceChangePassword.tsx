import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import api from "../api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function ForceChangePassword() {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Nếu không có tempToken thì không có lý do gì ở trang này
  useEffect(() => {
    const tempToken = localStorage.getItem("tempToken");
    if (!tempToken) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword === "123456") {
      toast.error("Không được dùng lại mật khẩu mặc định");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      // api.ts interceptor tự đính kèm tempToken từ localStorage vào header
      const res = (await api.post("/auth/change-password", {
        new_password: newPassword,
      })) as unknown as ApiResponse<{ accessToken: string; message: string }>;

      const newAccessToken = res.data?.accessToken;
      if (newAccessToken) {
        localStorage.setItem("accessToken", newAccessToken);
      }
      localStorage.removeItem("tempToken");

      toast.success("Đổi mật khẩu thành công! Đang chuyển hướng...");
      // Full reload để authContext re-initialize với accessToken mới
      window.location.href = "/admin/dashboard";
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <img src="/favicon.svg" alt="GYM SIX" className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">GYM SIX</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Đổi mật khẩu lần đầu
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border bg-card p-8 shadow-lg">
          {/* Notice */}
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <KeyRound className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Bắt buộc đổi mật khẩu
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Tài khoản của bạn đang dùng mật khẩu mặc định. Vui lòng đặt
                mật khẩu mới trước khi tiếp tục sử dụng hệ thống.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Mật khẩu mới <span className="text-destructive">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự, không phải 123456"
                className={inputClass}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Xác nhận mật khẩu mới <span className="text-destructive">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className={inputClass}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-base font-semibold"
            >
              {loading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            <p>© 2026 Gym Six System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
