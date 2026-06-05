import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { useAuth } from "../context/authContext";
import { toast } from "sonner";
import api from "../api";

interface LoginResponse {
  code?: string;
  temporaryToken?: string;
  data: {
    accessToken: string;
    name: string;
    role: "ADMIN" | "RECEPTIONIST" | "PT" | "MEMBER";
  } | null;
  message?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [accountType, setAccountType] = useState<"staff" | "member">("member");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier || !password) {
      toast.error(
        accountType === "staff"
          ? "Vui lòng nhập username và mật khẩu"
          : "Vui lòng nhập số điện thoại và mật khẩu",
      );
      return;
    }

    setLoading(true);

    try {
      const response = (await api.post("/auth/login", {
        username_or_phone: identifier,
        password,
        type: accountType,
      })) as LoginResponse;

      // Đăng nhập thành công
      if (response.data) {
        login(response.data.accessToken, {
          name: response.data.name,
          role: response.data.role,
        });
        toast.success("Đăng nhập thành công!");
        if (response.data.role === "MEMBER") {
          navigate("/");
        } else {
          navigate("/admin/dashboard");
        }
      } else {
        toast.error("Lỗi: Không nhận được token hoặc thông tin user");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(
        error?.details ||
          error?.message ||
          "Đăng nhập thất bại, vui lòng thử lại",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <img src="/favicon.svg" alt="GYM SIX" className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">GYM SIX</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Màn hình đăng nhập hệ thống
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border bg-card p-8 shadow-lg">
          <Tabs
            value={accountType}
            onValueChange={(value) => {
              setAccountType(value as "staff" | "member");
              setIdentifier("");
              setPassword("");
            }}
            className="w-full"
          >
            {/* Tab List */}
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="member">Thành viên</TabsTrigger>
              <TabsTrigger value="staff">Nhân viên</TabsTrigger>
            </TabsList>

            {/* Tab Content - Member */}
            <TabsContent value="member">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Nhập số điện thoại của bạn"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 text-base font-semibold"
                >
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>
            </TabsContent>

            {/* Tab Content - Staff */}
            <TabsContent value="staff">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Username
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Nhập username của bạn"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 text-base font-semibold"
                >
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            <p>© 2026 Gym Six System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
