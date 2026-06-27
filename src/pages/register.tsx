import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { Check, ChevronRight, Clock } from "lucide-react";
import api from "../api";

interface GymPackage {
  id: number;
  name: string;
  months: number;
  price: number;
  description: string;
  has_pt: boolean;
  is_active: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

type Step = 1 | 2 | 3;

const COUNTDOWN_SECONDS = 10;

function generateTransactionCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand = Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return `GYM${rand}`;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);

  // Step 1 — personal info
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    gender: "MALE",
    dob: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 — package selection
  const [packages, setPackages] = useState<GymPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<GymPackage | null>(
    null,
  );

  // Step 3 — payment
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [txCode, setTxCode] = useState("");
  const [paid, setPaid] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // Fetch packages when reaching step 2
  useEffect(() => {
    if (step !== 2) return;
    setPackagesLoading(true);
    (api.get("/gym/packages") as unknown as Promise<ApiResponse<GymPackage[]>>)
      .then((res) =>
        setPackages((res.data ?? []).filter((p) => p.is_active !== false)),
      )
      .catch(() => {})
      .finally(() => setPackagesLoading(false));
  }, [step]);

  // Start countdown when reaching step 3
  useEffect(() => {
    if (step !== 3) return;
    setCountdown(COUNTDOWN_SECONDS);
    setPaid(false);
    setTxCode("");

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPaid(true);
          setTxCode(generateTransactionCode());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  function validateStep1() {
    if (!form.name || !form.phone || !form.password || !form.dob) {
      toast.error("Vui lòng điền đầy đủ thông tin cá nhân");
      return false;
    }
    if (form.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    if (form.password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return false;
    }
    return true;
  }

  function goStep2() {
    if (validateStep1()) setStep(2);
  }

  function goStep3() {
    if (!selectedPackage) {
      toast.error("Vui lòng chọn một gói tập");
      return;
    }
    setStep(3);
  }

  async function handleSubmit() {
    if (!txCode) return;
    setSubmitting(true);
    try {
      await api.post("/gym/members/register", {
        ...form,
        transaction_code: txCode,
      });
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch {
      // handled by interceptor
    } finally {
      setSubmitting(false);
    }
  }

  const qrPayload = selectedPackage
    ? `GYM SIX|${selectedPackage.name}|${selectedPackage.price}VND|${form.phone}`
    : "";

  const stepLabels = ["Thông tin", "Gói tập", "Thanh toán"];
  const progressPct =
    ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <img src="/favicon.svg" alt="GYM SIX" className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">GYM SIX</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Đăng ký tài khoản hội viên
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center">
          {stepLabels.map((label, i) => {
            const s = (i + 1) as Step;
            const done = step > s;
            const active = step === s;
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : active
                          ? "border-2 border-primary text-primary"
                          : "border-2 border-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : s}
                  </div>
                  <span
                    className={`text-xs font-medium ${active ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={`mx-2 mb-5 h-0.5 w-16 transition-colors ${step > s ? "bg-primary" : "bg-muted"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card p-8 shadow-lg">
          {/* ===== STEP 1: PERSONAL INFO ===== */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Thông tin cá nhân
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Điền đầy đủ để tạo tài khoản hội viên
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Họ và tên <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Nhập họ và tên của bạn"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Số điện thoại <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="Nhập số điện thoại"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Giới tính <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, gender: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Ngày sinh <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dob: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Mật khẩu <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="Ít nhất 6 ký tự"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Xác nhận mật khẩu <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className={inputClass}
                />
              </div>

              <Button
                onClick={goStep2}
                className="w-full gap-2 py-6 text-base font-semibold"
              >
                Tiếp theo <ChevronRight className="h-4 w-4" />
              </Button>

              <div className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-primary hover:underline"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            </div>
          )}

          {/* ===== STEP 2: CHOOSE PACKAGE ===== */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Chọn gói tập
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Chọn gói tập phù hợp với nhu cầu của bạn
                </p>
              </div>

              {packagesLoading ? (
                <div className="py-12 text-center text-muted-foreground">
                  Đang tải gói tập...
                </div>
              ) : packages.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="font-medium">Hiện chưa có gói tập nào</p>
                  <p className="mt-1 text-xs">
                    Vui lòng liên hệ trực tiếp tại quầy lễ tân
                  </p>
                </div>
              ) : (
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {packages.map((pkg) => {
                    const selected = selectedPackage?.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">
                              {pkg.name}
                            </p>
                            {pkg.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {pkg.description}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                {pkg.months} tháng
                              </span>
                              {pkg.has_pt && (
                                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                                  Có PT
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-bold text-green-600">
                              {formatPrice(pkg.price)}
                            </p>
                            {selected && (
                              <div className="mt-1.5 flex justify-end">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Quay lại
                </Button>
                <Button
                  onClick={goStep3}
                  disabled={!selectedPackage}
                  className="flex-1 gap-2"
                >
                  Tiếp theo <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: PAYMENT ===== */}
          {step === 3 && selectedPackage && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Thanh toán
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quét mã QR để thanh toán, mã giao dịch sẽ được gửi tự động
                </p>
              </div>

              {/* Package summary */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {selectedPackage.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPackage.months} tháng
                    {selectedPackage.has_pt ? " · Có PT" : ""}
                  </p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatPrice(selectedPackage.price)}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-xl border-2 border-border bg-white p-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`}
                    alt="QR thanh toán"
                    className="h-48 w-48"
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Quét mã QR bằng ứng dụng ngân hàng của bạn
                </p>
              </div>

              {/* Countdown */}
              {!paid ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-center gap-2 text-amber-700">
                    <Clock className="h-5 w-5" />
                    <p className="font-medium">
                      Đang chờ xác nhận thanh toán...
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <div className="relative flex h-14 w-14 items-center justify-center">
                      <svg
                        className="absolute inset-0 -rotate-90"
                        viewBox="0 0 56 56"
                      >
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="#fde68a"
                          strokeWidth="4"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 24}`}
                          strokeDashoffset={`${2 * Math.PI * 24 * (1 - progressPct / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <span className="text-lg font-bold text-amber-700">
                        {countdown}
                      </span>
                    </div>
                    <p className="text-sm text-amber-600">
                      giây còn lại để nhận mã giao dịch
                    </p>
                  </div>
                </div>
              ) : (
                /* Transaction code reveal */
                <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <p className="font-semibold">
                      Xác nhận thanh toán thành công!
                    </p>
                  </div>
                  <p className="text-sm text-green-600">Mã giao dịch của bạn</p>
                  <code className="inline-block rounded-lg border-2 border-green-300 bg-white px-6 py-3 text-2xl font-bold tracking-[0.2em] text-green-700">
                    {txCode}
                  </code>
                  <p className="text-xs text-green-500">
                    Lưu lại mã này để sử dụng khi cần thiết
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="flex-1"
                >
                  Quay lại
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!paid || submitting}
                  className="flex-1 font-semibold"
                >
                  {submitting ? "Đang đăng ký..." : "Hoàn tất đăng ký"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          © 2026 Gym Six System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
