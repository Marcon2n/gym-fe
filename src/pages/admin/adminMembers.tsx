import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  Users,
  Search,
  KeyRound,
  Lock,
  X,
  Plus,
  Check,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Member {
  id: number;
  name: string;
  phone: string;
  gender: string;
  dob: string;
  status: number;
  province_name: string;
  ward_name: string;
  created_at: string;
}

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

type CreateStep = 1 | 2 | 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function formatDob(dob: string) {
  if (!dob) return "—";
  return new Date(dob).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatAddress(ward: string, province: string) {
  if (!ward && !province) return "—";
  if (!ward) return province;
  if (!province) return ward;
  return `${ward}, ${province}`;
}

const GENDER_LABEL: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const inputClass =
  "w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const EMPTY_FORM = {
  name: "",
  phone: "",
  password: "",
  gender: "MALE",
  dob: "",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminMembers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = user?.role === "ADMIN" || user?.role === "RECEPTIONIST";
  const canResetPassword =
    user?.role === "ADMIN" || user?.role === "RECEPTIONIST";
  const canLock = user?.role === "ADMIN" || user?.role === "RECEPTIONIST";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Lock confirm
  const [lockTarget, setLockTarget] = useState<Member | null>(null);
  const [locking, setLocking] = useState(false);

  // Reset password loading per row
  const [resettingId, setResettingId] = useState<number | null>(null);

  // ── Create wizard state ──────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>(1);
  const [createForm, setCreateForm] = useState({ ...EMPTY_FORM });

  const [packages, setPackages] = useState<GymPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<GymPackage | null>(
    null,
  );

  const [txCode, setTxCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Keep latest txCode in a ref so the regenerate button always reads fresh
  const txCodeRef = useRef(txCode);
  txCodeRef.current = txCode;

  // Fetch packages when step 2 opens
  useEffect(() => {
    if (!createOpen || createStep !== 2) return;
    setPackagesLoading(true);
    (api.get("/gym/packages") as unknown as Promise<ApiResponse<GymPackage[]>>)
      .then((res) =>
        setPackages((res.data ?? []).filter((p) => p.is_active !== false)),
      )
      .catch(() => {})
      .finally(() => setPackagesLoading(false));
  }, [createOpen, createStep]);

  // Auto-generate transaction code when reaching step 3
  useEffect(() => {
    if (!createOpen || createStep !== 3) return;
    setTxCode(generateTransactionCode());
  }, [createOpen, createStep]);

  // ── Fetch members ────────────────────────────────────────────────────────
  async function fetchMembers() {
    setLoading(true);
    try {
      const res = (await api.get("/admin/members")) as unknown as ApiResponse<
        Member[]
      >;
      setMembers(res.data ?? []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  // ── Wizard helpers ───────────────────────────────────────────────────────
  function openCreateWizard() {
    setCreateForm({ ...EMPTY_FORM });
    setSelectedPackage(null);
    setTxCode("");
    setCreateStep(1);
    setCreateOpen(true);
  }

  function closeCreateWizard() {
    if (submitting) return;
    setCreateOpen(false);
  }

  function validateStep1() {
    const { name, phone, dob } = createForm;
    if (!name.trim() || !phone.trim() || !dob) {
      toast.error("Vui lòng điền đầy đủ họ tên, số điện thoại và ngày sinh");
      return false;
    }
    if (createForm.password && createForm.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    return true;
  }

  function goStep2() {
    if (validateStep1()) setCreateStep(2);
  }

  function goStep3() {
    if (!selectedPackage) {
      toast.error("Vui lòng chọn một gói tập");
      return;
    }
    setCreateStep(3);
  }

  async function handleCreateSubmit() {
    if (!txCode.trim()) {
      toast.error("Mã giao dịch không được để trống");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/gym/members/register", {
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        password: createForm.password || undefined,
        gender: createForm.gender,
        dob: createForm.dob,
        transaction_code: txCode.trim(),
      });
      toast.success(
        `Tạo tài khoản hội viên cho ${createForm.name} thành công!`,
      );
      setCreateOpen(false);
      fetchMembers();
    } catch {
      //
    } finally {
      setSubmitting(false);
    }
  }

  // ── Lock & Reset ─────────────────────────────────────────────────────────
  async function handleLock() {
    if (!lockTarget) return;
    setLocking(true);
    try {
      await api.delete(`/admin/members/${lockTarget.id}`);
      toast.success(`Đã khóa tài khoản của ${lockTarget.name}`);
      setLockTarget(null);
      fetchMembers();
    } catch {
      //
    } finally {
      setLocking(false);
    }
  }

  async function handleResetPassword(member: Member) {
    setResettingId(member.id);
    try {
      await api.post("/auth/reset-password-by-admin", {
        userId: member.id,
        type: "member",
      });
      toast.success(`Đã reset mật khẩu của ${member.name} về 123456`);
    } catch {
      //
    } finally {
      setResettingId(null);
    }
  }

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search),
  );

  const stepLabels = ["Thông tin", "Gói tập", "Hoàn tất"];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hội viên</h1>
          <p className="mt-1 text-muted-foreground">
            Danh sách tất cả hội viên đã đăng ký
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreateWizard} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm hội viên
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length} hội viên
        </span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-10 px-4 py-3 text-left font-medium text-muted-foreground">
                  #
                </th>
                <th className="w-50 px-4 py-3 text-left font-medium text-muted-foreground">
                  Họ tên
                </th>
                <th className="w-40 px-4 py-3 text-left font-medium text-muted-foreground">
                  Số điện thoại
                </th>
                <th className="w-25 px-4 py-3 text-left font-medium text-muted-foreground">
                  Giới tính
                </th>
                <th className="w-28 px-4 py-3 text-left font-medium text-muted-foreground">
                  Ngày sinh
                </th>
                <th className="w-44 px-4 py-3 text-left font-medium text-muted-foreground">
                  Địa chỉ
                </th>
                <th className="w-32 px-4 py-3 text-left font-medium text-muted-foreground">
                  Trạng thái
                </th>
                <th className="w-40 px-4 py-3 text-center font-medium text-muted-foreground">
                  Ngày đăng ký
                </th>
                <th className="w-30 px-4 py-3 text-center font-medium text-muted-foreground">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-16 text-center text-muted-foreground"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-16 text-center text-muted-foreground"
                  >
                    <Users className="mx-auto mb-3 h-12 w-12 opacity-20" />
                    <p className="font-medium">
                      {search
                        ? "Không tìm thấy hội viên phù hợp"
                        : "Chưa có hội viên nào"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((m, i) => {
                  const isActive = m.status === 0;
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-border transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td
                        className="truncate px-4 py-3 font-semibold text-foreground cursor-pointer hover:text-primary hover:underline"
                        title={m.name}
                        onClick={() => navigate(`/admin/profile?kind=member&id=${m.id}`)}
                      >
                        {m.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {m.phone}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {GENDER_LABEL[m.gender] ?? m.gender ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDob(m.dob)}
                      </td>
                      <td
                        className="truncate px-4 py-3 text-muted-foreground"
                        title={formatAddress(m.ward_name, m.province_name)}
                      >
                        {formatAddress(m.ward_name, m.province_name)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                        >
                          {isActive ? "Đang hoạt động" : "Bị khóa"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canResetPassword && (
                            <button
                              onClick={() => handleResetPassword(m)}
                              disabled={resettingId === m.id}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"
                              title="Reset mật khẩu về 123456"
                            >
                              <KeyRound className="h-4 w-4" />
                            </button>
                          )}
                          {canLock && isActive && (
                            <button
                              onClick={() => setLockTarget(m)}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Khóa tài khoản"
                            >
                              <Lock className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ===== MODAL: KHÓA TÀI KHOẢN ===== */}
      {lockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !locking && setLockTarget(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">
                Khóa tài khoản hội viên
              </h2>
              <button
                onClick={() => setLockTarget(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Tài khoản của{" "}
                <span className="font-semibold text-foreground">
                  {lockTarget.name}
                </span>{" "}
                ({lockTarget.phone}) sẽ bị khóa và không thể đăng nhập.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setLockTarget(null)}
                disabled={locking}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleLock}
                disabled={locking}
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {locking ? "Đang khóa..." : "Khóa tài khoản"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: TẠO HỘI VIÊN (3 BƯỚC) ===== */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeCreateWizard}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                Tạo tài khoản hội viên
              </h2>
              <button
                onClick={closeCreateWizard}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-0 border-b border-border px-6 py-4">
              {stepLabels.map((label, i) => {
                const s = (i + 1) as CreateStep;
                const done = createStep > s;
                const active = createStep === s;
                return (
                  <div key={s} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                          done
                            ? "bg-primary text-primary-foreground"
                            : active
                              ? "border-2 border-primary text-primary"
                              : "border-2 border-muted text-muted-foreground"
                        }`}
                      >
                        {done ? <Check className="h-3.5 w-3.5" /> : s}
                      </div>
                      <span
                        className={`text-xs font-medium ${active ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div
                        className={`mx-2 mb-5 h-0.5 w-14 transition-colors ${createStep > s ? "bg-primary" : "bg-muted"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step content */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {/* ── STEP 1: Thông tin cá nhân ── */}
              {createStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">
                      Họ và tên <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Nhập họ và tên"
                      className={inputClass}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">
                      Số điện thoại <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      placeholder="0xxxxxxxxx"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">
                        Giới tính
                      </label>
                      <select
                        value={createForm.gender}
                        onChange={(e) =>
                          setCreateForm((f) => ({
                            ...f,
                            gender: e.target.value,
                          }))
                        }
                        className={inputClass}
                      >
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">
                        Ngày sinh <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="date"
                        value={createForm.dob}
                        onChange={(e) =>
                          setCreateForm((f) => ({ ...f, dob: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">
                      Mật khẩu
                    </label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          password: e.target.value,
                        }))
                      }
                      placeholder="Mặc định: 123456"
                      className={inputClass}
                    />
                    <p className="text-xs text-muted-foreground">
                      Để trống để dùng mật khẩu mặc định <strong>123456</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Chọn gói tập ── */}
              {createStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Chọn gói tập để tham khảo mức thanh toán. Thông tin này sẽ
                    được ghi nhận trong mã giao dịch.
                  </p>
                  {packagesLoading ? (
                    <div className="py-10 text-center text-muted-foreground text-sm">
                      Đang tải gói tập...
                    </div>
                  ) : packages.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground text-sm">
                      <p className="font-medium">
                        Hiện chưa có gói tập nào đang hoạt động
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
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
                                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                    {pkg.description}
                                  </p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                    {pkg.months} tháng
                                  </span>
                                  {pkg.has_pt && (
                                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
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
                </div>
              )}

              {/* ── STEP 3: Xác nhận & mã giao dịch ── */}
              {createStep === 3 && (
                <div className="space-y-5">
                  {/* Tóm tắt */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Họ tên</span>
                      <span className="font-semibold text-foreground">
                        {createForm.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Số điện thoại
                      </span>
                      <span className="text-foreground">
                        {createForm.phone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngày sinh</span>
                      <span className="text-foreground">
                        {createForm.dob ? formatDob(createForm.dob) : "—"}
                      </span>
                    </div>
                    {selectedPackage && (
                      <>
                        <div className="border-t border-border pt-2 mt-2 flex justify-between">
                          <span className="text-muted-foreground">Gói tập</span>
                          <span className="font-semibold text-foreground">
                            {selectedPackage.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Giá</span>
                          <span className="font-bold text-green-600">
                            {formatPrice(selectedPackage.price)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Transaction code */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground">
                        Mã giao dịch <span className="text-destructive">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setTxCode(generateTransactionCode())}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-primary hover:bg-primary/10 transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Tạo mã mới
                      </button>
                    </div>
                    <input
                      type="text"
                      value={txCode}
                      onChange={(e) => setTxCode(e.target.value.toUpperCase())}
                      placeholder="GYMxxxxxxxx"
                      className={`${inputClass} font-mono text-base tracking-widest text-center`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Mã được tạo tự động. Có thể chỉnh sửa hoặc nhấn "Tạo mã
                      mới" để lấy mã khác.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer / navigation */}
            <div className="flex gap-3 border-t border-border px-6 py-4">
              {createStep === 1 && (
                <>
                  <Button
                    variant="outline"
                    onClick={closeCreateWizard}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button onClick={goStep2} className="flex-1 gap-2">
                    Tiếp theo <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              {createStep === 2 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setCreateStep(1)}
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
                </>
              )}
              {createStep === 3 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setCreateStep(2)}
                    disabled={submitting}
                    className="flex-1"
                  >
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleCreateSubmit}
                    disabled={submitting || !txCode.trim()}
                    className="flex-1 font-semibold"
                  >
                    {submitting ? "Đang tạo..." : "Hoàn tất đăng ký"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
