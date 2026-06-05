import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  User,
  Pencil,
  KeyRound,
  X,
  Check,
  Shield,
  Phone,
  CreditCard,
  Calendar,
  ArrowLeft,
  Lock,
  LockOpen,
  UserCircle,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffProfile {
  kind: "staff";
  id: number;
  username: string;
  name: string;
  cccd: string;
  phone: string;
  role: "ADMIN" | "PT" | "RECEPTIONIST";
  is_active: boolean;
  created_at: string;
}

interface MemberProfile {
  kind: "member";
  id: number;
  name: string;
  phone: string;
  gender: string;
  dob: string;
  status: number; // 0=active, 1=locked
  province_name: string;
  ward_name: string;
  created_at: string;
}

type Profile = StaffProfile | MemberProfile;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản trị viên",
  PT: "Huấn luyện viên",
  RECEPTIONIST: "Lễ tân",
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  PT: "bg-blue-100 text-blue-700",
  RECEPTIONIST: "bg-purple-100 text-purple-700",
};

const GENDER_LABEL: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const inputClass =
  "w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", {
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const paramId = searchParams.get("id");
  const paramKind = searchParams.get("kind") as "staff" | "member" | null;

  // viewing own profile when no params given
  const isSelf = !paramId;
  const isAdmin = user?.role === "ADMIN";
  const isAdminOrReceptionist =
    user?.role === "ADMIN" || user?.role === "RECEPTIONIST";

  // Can edit: own profile always, or admin editing anyone
  const canEdit = isSelf || isAdmin;
  // Can lock/unlock members: admin + receptionist
  const canLockMember = isAdminOrReceptionist && paramKind === "member";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit info modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    cccd: "",
    role: "PT",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // Change password (own profile only)
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPw, setChangingPw] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Lock confirm (members)
  const [lockConfirm, setLockConfirm] = useState(false);
  const [locking, setLocking] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  async function fetchProfile() {
    setLoading(true);
    try {
      if (isSelf) {
        // own profile
        const res = (await api.get("/auth/me")) as unknown as StaffProfile & {
          data?: StaffProfile;
        };
        const raw =
          (res as unknown as { data: StaffProfile }).data ??
          (res as unknown as StaffProfile);
        setProfile({ ...raw, kind: "staff" });
      } else if (paramKind === "staff") {
        const res = (await api.get(
          `/admin/staffs/${paramId}`,
        )) as unknown as { data?: StaffProfile } & StaffProfile;
        const raw =
          (res as unknown as { data: StaffProfile }).data ??
          (res as unknown as StaffProfile);
        setProfile({ ...raw, kind: "staff" });
      } else if (paramKind === "member") {
        const res = (await api.get(
          `/admin/members/${paramId}`,
        )) as unknown as { data?: MemberProfile } & MemberProfile;
        const raw =
          (res as unknown as { data: MemberProfile }).data ??
          (res as unknown as MemberProfile);
        setProfile({ ...raw, kind: "member" });
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId, paramKind]);

  // ── Edit info ──────────────────────────────────────────────────────────────
  function openEdit() {
    if (!profile) return;
    if (profile.kind === "staff") {
      setEditForm({
        name: profile.name ?? "",
        phone: profile.phone ?? "",
        cccd: profile.cccd ?? "",
        role: profile.role,
        is_active: profile.is_active,
      });
    } else {
      setEditForm({
        name: profile.name ?? "",
        phone: profile.phone ?? "",
        cccd: "",
        role: "PT",
        is_active: true,
      });
    }
    setEditOpen(true);
  }

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error("Họ tên không được để trống");
      return;
    }
    if (!profile) return;
    setSaving(true);
    try {
      if (profile.kind === "staff") {
        const targetId = isSelf ? user?.id : profile.id;
        const body: Record<string, unknown> = {
          name: editForm.name.trim(),
          phone: editForm.phone.trim() || undefined,
        };
        // Admin editing others can also change role, cccd, is_active
        if (isAdmin && !isSelf) {
          body.cccd = editForm.cccd.trim() || undefined;
          body.role = editForm.role;
          body.is_active = editForm.is_active;
        }
        await api.put(`/admin/staffs/${targetId}`, body);
      } else {
        await api.put(`/admin/members/${profile.id}`, {
          name: editForm.name.trim(),
          phone: editForm.phone.trim() || undefined,
        });
      }
      toast.success("Cập nhật thông tin thành công!");
      setEditOpen(false);
      fetchProfile();
    } catch {
      //
    } finally {
      setSaving(false);
    }
  }

  // ── Change password ────────────────────────────────────────────────────────
  function openChangePassword() {
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowCurrent(false);
    setShowNew(false);
    setPwOpen(true);
  }

  async function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setChangingPw(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setPwOpen(false);
    } catch {
      //
    } finally {
      setChangingPw(false);
    }
  }

  // ── Lock / Unlock member ───────────────────────────────────────────────────
  async function handleToggleLock() {
    if (!profile || profile.kind !== "member") return;
    setLocking(true);
    try {
      if (profile.status === 0) {
        // active → lock
        await api.delete(`/admin/members/${profile.id}`);
        toast.success(`Đã khóa tài khoản ${profile.name}`);
      } else {
        // locked → unlock (assuming PUT endpoint)
        await api.put(`/admin/members/${profile.id}/unlock`, {});
        toast.success(`Đã mở khóa tài khoản ${profile.name}`);
      }
      setLockConfirm(false);
      fetchProfile();
    } catch {
      //
    } finally {
      setLocking(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Đang tải thông tin...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <UserCircle className="h-12 w-12 opacity-20" />
        <p>Không tìm thấy thông tin</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>
    );
  }

  const displayName = profile.name ?? "—";
  const initial = displayName.charAt(0).toUpperCase();
  const isStaff = profile.kind === "staff";
  const isMember = profile.kind === "member";
  const memberIsActive = isMember && (profile as MemberProfile).status === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back button khi xem người khác */}
      {!isSelf && (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </button>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {isSelf ? "Hồ sơ của tôi" : displayName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isSelf
            ? "Thông tin tài khoản và cài đặt bảo mật"
            : isStaff
              ? "Thông tin nhân viên"
              : "Thông tin hội viên"}
        </p>
      </div>

      {/* Avatar card */}
      <Card className="p-6">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/20 text-3xl font-bold text-primary">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-xl font-bold text-foreground">
              {displayName}
            </h2>

            {/* Staff: username + role + active badge */}
            {isStaff && (
              <>
                {(profile as StaffProfile).username && (
                  <p className="mt-0.5 font-mono text-sm text-muted-foreground">
                    @{(profile as StaffProfile).username}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_COLOR[(profile as StaffProfile).role] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {ROLE_LABEL[(profile as StaffProfile).role] ??
                      (profile as StaffProfile).role}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${(profile as StaffProfile).is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {(profile as StaffProfile).is_active
                      ? "Đang làm việc"
                      : "Nghỉ việc"}
                  </span>
                </div>
              </>
            )}

            {/* Member: status badge */}
            {isMember && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                  Hội viên
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${memberIsActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                >
                  {memberIsActive ? "Đang hoạt động" : "Bị khóa"}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 flex-col gap-2">
            {canEdit && (
              <Button
                variant="outline"
                onClick={openEdit}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Chỉnh sửa
              </Button>
            )}
            {canLockMember && (
              <Button
                variant="outline"
                onClick={() => setLockConfirm(true)}
                className={`gap-2 ${memberIsActive ? "hover:border-red-300 hover:text-red-600" : "hover:border-green-300 hover:text-green-600"}`}
              >
                {memberIsActive ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Khóa TK
                  </>
                ) : (
                  <>
                    <LockOpen className="h-4 w-4" />
                    Mở khóa
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Chi tiết thông tin */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-foreground">
          Thông tin cá nhân
        </h3>
        <div className="space-y-4">
          {/* Staff fields */}
          {isStaff && (
            <>
              {(profile as StaffProfile).phone && (
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Số điện thoại"
                  value={(profile as StaffProfile).phone}
                />
              )}
              {(profile as StaffProfile).cccd && (
                <InfoRow
                  icon={<CreditCard className="h-4 w-4" />}
                  label="CCCD / CMND"
                  value={(profile as StaffProfile).cccd}
                  mono
                />
              )}
              {(profile as StaffProfile).username && (
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Tên đăng nhập"
                  value={(profile as StaffProfile).username}
                  mono
                />
              )}
              <InfoRow
                icon={<Shield className="h-4 w-4" />}
                label="Vai trò"
                value={
                  ROLE_LABEL[(profile as StaffProfile).role] ??
                  (profile as StaffProfile).role
                }
              />
            </>
          )}

          {/* Member fields */}
          {isMember && (
            <>
              {(profile as MemberProfile).phone && (
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Số điện thoại"
                  value={(profile as MemberProfile).phone}
                />
              )}
              {(profile as MemberProfile).gender && (
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Giới tính"
                  value={
                    GENDER_LABEL[(profile as MemberProfile).gender] ??
                    (profile as MemberProfile).gender
                  }
                />
              )}
              {(profile as MemberProfile).dob && (
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Ngày sinh"
                  value={formatDate((profile as MemberProfile).dob)}
                />
              )}
              {((profile as MemberProfile).province_name ||
                (profile as MemberProfile).ward_name) && (
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Địa chỉ"
                  value={formatAddress(
                    (profile as MemberProfile).ward_name,
                    (profile as MemberProfile).province_name,
                  )}
                />
              )}
            </>
          )}

          {/* Common */}
          {profile.created_at && (
            <InfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="Ngày tham gia"
              value={formatDate(profile.created_at)}
            />
          )}
        </div>
      </Card>

      {/* Bảo mật — chỉ hiện khi xem hồ sơ của chính mình */}
      {isSelf && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-foreground">Bảo mật</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Mật khẩu</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Thay đổi mật khẩu định kỳ để bảo vệ tài khoản
              </p>
            </div>
            <Button
              variant="outline"
              onClick={openChangePassword}
              className="gap-2"
            >
              <KeyRound className="h-4 w-4" />
              Đổi mật khẩu
            </Button>
          </div>
        </Card>
      )}

      {/* ===== MODAL: CHỈNH SỬA THÔNG TIN ===== */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !saving && setEditOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Chỉnh sửa thông tin
              </h2>
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Họ và tên <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={inputClass}
                  disabled={saving}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="0xxxxxxxxx"
                  className={inputClass}
                  disabled={saving}
                />
              </div>

              {/* Extra fields: Admin chỉnh sửa nhân viên khác */}
              {isAdmin && !isSelf && isStaff && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">
                      CCCD / CMND
                    </label>
                    <input
                      type="text"
                      value={editForm.cccd}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, cccd: e.target.value }))
                      }
                      maxLength={15}
                      className={inputClass}
                      disabled={saving}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">
                        Vai trò
                      </label>
                      <select
                        value={editForm.role}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, role: e.target.value }))
                        }
                        className={inputClass}
                        disabled={saving}
                      >
                        <option value="PT">Huấn luyện viên (PT)</option>
                        <option value="RECEPTIONIST">Lễ tân</option>
                        <option value="ADMIN">Quản trị viên</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">
                        Trạng thái
                      </label>
                      <select
                        value={editForm.is_active ? "true" : "false"}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            is_active: e.target.value === "true",
                          }))
                        }
                        className={inputClass}
                        disabled={saving}
                      >
                        <option value="true">Đang làm việc</option>
                        <option value="false">Nghỉ việc</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 gap-2"
                >
                  {saving ? (
                    "Đang lưu..."
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: ĐỔI MẬT KHẨU ===== */}
      {pwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !changingPw && setPwOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Đổi mật khẩu
              </h2>
              <button
                onClick={() => setPwOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleChangePw} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Mật khẩu hiện tại{" "}
                  <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={pwForm.currentPassword}
                    onChange={(e) =>
                      setPwForm((f) => ({
                        ...f,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Nhập mật khẩu hiện tại"
                    className={`${inputClass} pr-10`}
                    disabled={changingPw}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
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
                    onChange={(e) =>
                      setPwForm((f) => ({
                        ...f,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Tối thiểu 6 ký tự"
                    className={`${inputClass} pr-10`}
                    disabled={changingPw}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Xác nhận mật khẩu mới{" "}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({
                      ...f,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Nhập lại mật khẩu mới"
                  className={inputClass}
                  disabled={changingPw}
                />
                {pwForm.confirmPassword &&
                  pwForm.newPassword !== pwForm.confirmPassword && (
                    <p className="text-xs text-destructive">
                      Mật khẩu xác nhận chưa khớp
                    </p>
                  )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPwOpen(false)}
                  disabled={changingPw}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={changingPw}
                  className="flex-1"
                >
                  {changingPw ? "Đang đổi..." : "Đổi mật khẩu"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: XÁC NHẬN KHÓA / MỞ KHÓA HỘI VIÊN ===== */}
      {lockConfirm && profile.kind === "member" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !locking && setLockConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${memberIsActive ? "bg-red-100" : "bg-green-100"}`}
              >
                {memberIsActive ? (
                  <Lock
                    className={`h-5 w-5 ${memberIsActive ? "text-red-600" : "text-green-600"}`}
                  />
                ) : (
                  <LockOpen className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  {memberIsActive
                    ? "Khóa tài khoản hội viên"
                    : "Mở khóa tài khoản hội viên"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tài khoản của{" "}
                  <span className="font-semibold text-foreground">
                    {profile.name}
                  </span>{" "}
                  sẽ{" "}
                  {memberIsActive
                    ? "bị khóa và không thể đăng nhập"
                    : "được mở khóa và có thể đăng nhập lại"}
                  .
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setLockConfirm(false)}
                disabled={locking}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleToggleLock}
                disabled={locking}
                className={`flex-1 ${memberIsActive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-green-600 text-white hover:bg-green-700"}`}
              >
                {locking
                  ? "Đang xử lý..."
                  : memberIsActive
                    ? "Khóa tài khoản"
                    : "Mở khóa"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={`truncate text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function Eye({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
