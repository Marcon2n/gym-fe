import { useState, useEffect } from "react";
import { useAuth } from "../src/context/authContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Pencil,
  KeyRound,
  Phone,
  Calendar,
  User,
  MapPin,
  ArrowLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import api from "../src/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberDetail {
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GENDER_LABEL: Record<string, string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };

const inputClass =
  "w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatAddress(ward: string, province: string) {
  if (!ward && !province) return "—";
  if (!ward) return province;
  if (!province) return ward;
  return `${ward}, ${province}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MemberProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type View = "info" | "edit" | "password";

export default function MemberProfileDialog({ open, onOpenChange }: MemberProfileDialogProps) {
  const { user } = useAuth();

  const [profile, setProfile] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("info");

  // Edit form
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [changingPw, setChangingPw] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  async function fetchProfile() {
    setLoading(true);
    try {
      const res = (await api.get("/auth/me")) as unknown as MemberDetail & { data?: MemberDetail };
      const raw = (res as unknown as { data: MemberDetail }).data ?? (res as unknown as MemberDetail);
      setProfile(raw);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setView("info");
      fetchProfile();
    }
  }, [open]);

  // ── Edit ───────────────────────────────────────────────────────────────────
  function openEdit() {
    setEditForm({ name: profile?.name ?? "", phone: profile?.phone ?? "" });
    setView("edit");
  }

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.name.trim()) { toast.error("Họ tên không được để trống"); return; }
    setSaving(true);
    try {
      await api.put("/member/profile", {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || undefined,
      });
      toast.success("Cập nhật thông tin thành công!");
      setView("info");
      fetchProfile();
    } catch {
      //
    } finally {
      setSaving(false);
    }
  }

  // ── Change password ────────────────────────────────────────────────────────
  function openChangePw() {
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowCurrent(false);
    setShowNew(false);
    setView("password");
  }

  async function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) { toast.error("Vui lòng điền đầy đủ thông tin"); return; }
    if (pwForm.newPassword.length < 6) { toast.error("Mật khẩu mới phải có ít nhất 6 ký tự"); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("Mật khẩu xác nhận không khớp"); return; }
    setChangingPw(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setView("info");
    } catch {
      //
    } finally {
      setChangingPw(false);
    }
  }

  const displayName = profile?.name ?? user?.name ?? "—";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0">
        {/* ── VIEW: THÔNG TIN ── */}
        {view === "info" && (
          <>
            <DialogHeader>
              <DialogTitle>Hồ sơ của tôi</DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-5">
              {loading ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  Đang tải...
                </div>
              ) : (
                <>
                  {/* Avatar + tên */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-bold text-foreground">{displayName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {profile?.status === 0 ? "Đang hoạt động" : "Hội viên"}
                      </p>
                    </div>
                  </div>

                  {/* Thông tin */}
                  <div className="space-y-3 rounded-lg border border-border p-4">
                    {profile?.phone && (
                      <InfoRow icon={<Phone className="h-4 w-4" />} label="Số điện thoại" value={profile.phone} />
                    )}
                    {profile?.gender && (
                      <InfoRow icon={<User className="h-4 w-4" />} label="Giới tính" value={GENDER_LABEL[profile.gender] ?? profile.gender} />
                    )}
                    {profile?.dob && (
                      <InfoRow icon={<Calendar className="h-4 w-4" />} label="Ngày sinh" value={formatDate(profile.dob)} />
                    )}
                    {(profile?.province_name || profile?.ward_name) && (
                      <InfoRow icon={<MapPin className="h-4 w-4" />} label="Địa chỉ" value={formatAddress(profile.ward_name ?? "", profile.province_name ?? "")} />
                    )}
                    {profile?.created_at && (
                      <InfoRow icon={<Calendar className="h-4 w-4" />} label="Ngày tham gia" value={formatDate(profile.created_at)} />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={openEdit} className="flex-1 gap-2">
                      <Pencil className="h-4 w-4" />
                      Chỉnh sửa
                    </Button>
                    <Button variant="outline" onClick={openChangePw} className="flex-1 gap-2">
                      <KeyRound className="h-4 w-4" />
                      Đổi mật khẩu
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── VIEW: CHỈNH SỬA ── */}
        {view === "edit" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView("info")}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <DialogTitle>Chỉnh sửa thông tin</DialogTitle>
              </div>
            </DialogHeader>

            <form onSubmit={handleSaveInfo} className="space-y-4 p-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Họ và tên <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                  disabled={saving}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Số điện thoại</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="0xxxxxxxxx"
                  className={inputClass}
                  disabled={saving}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setView("info")} disabled={saving} className="flex-1">
                  Hủy
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 gap-2">
                  {saving ? "Đang lưu..." : <><Check className="h-4 w-4" />Lưu thay đổi</>}
                </Button>
              </div>
            </form>
          </>
        )}

        {/* ── VIEW: ĐỔI MẬT KHẨU ── */}
        {view === "password" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView("info")}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <DialogTitle>Đổi mật khẩu</DialogTitle>
              </div>
            </DialogHeader>

            <form onSubmit={handleChangePw} className="space-y-4 p-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Mật khẩu hiện tại <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    placeholder="Nhập mật khẩu hiện tại"
                    className={`${inputClass} pr-10`}
                    disabled={changingPw}
                    autoFocus
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <EyeIcon show={showCurrent} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Mật khẩu mới <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                    placeholder="Tối thiểu 6 ký tự"
                    className={`${inputClass} pr-10`}
                    disabled={changingPw}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <EyeIcon show={showNew} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Xác nhận mật khẩu mới <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Nhập lại mật khẩu mới"
                  className={inputClass}
                  disabled={changingPw}
                />
                {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                  <p className="text-xs text-destructive">Mật khẩu xác nhận chưa khớp</p>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setView("info")} disabled={changingPw} className="flex-1">
                  Hủy
                </Button>
                <Button type="submit" disabled={changingPw} className="flex-1">
                  {changingPw ? "Đang đổi..." : "Đổi mật khẩu"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
