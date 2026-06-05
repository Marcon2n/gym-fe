import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  Users,
  Plus,
  Pencil,
  ShieldOff,
  X,
  Search,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../api";

interface Staff {
  id: number;
  username: string;
  name: string;
  cccd: string;
  phone: string;
  role: "ADMIN" | "PT" | "RECEPTIONIST";
  is_active: boolean;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface CreateForm {
  username: string;
  password: string;
  name: string;
  cccd: string;
  phone: string;
  role: string;
}

interface EditForm {
  name: string;
  cccd: string;
  phone: string;
  role: string;
  is_active: boolean;
}

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

const EMPTY_CREATE: CreateForm = {
  username: "",
  password: "",
  name: "",
  cccd: "",
  phone: "",
  role: "PT",
};

const inputClass =
  "w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function AdminStaffs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal create
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [creating, setCreating] = useState(false);

  // Modal edit
  const [editTarget, setEditTarget] = useState<Staff | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    cccd: "",
    phone: "",
    role: "PT",
    is_active: true,
  });
  const [editing, setEditing] = useState(false);

  // Modal deactivate confirm
  const [deactivateTarget, setDeactivateTarget] = useState<Staff | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  // Reset password loading per row
  const [resettingId, setResettingId] = useState<number | null>(null);

  async function fetchStaffs() {
    setLoading(true);
    try {
      const res = (await api.get("/admin/staffs")) as unknown as ApiResponse<
        Staff[]
      >;
      setStaffs(res.data ?? []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStaffs();
  }, []);

  function openEdit(s: Staff) {
    setEditTarget(s);
    setEditForm({
      name: s.name,
      cccd: s.cccd ?? "",
      phone: s.phone ?? "",
      role: s.role,
      is_active: s.is_active,
    });
  }

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !createForm.username ||
      !createForm.name ||
      !createForm.cccd ||
      !createForm.role
    ) {
      toast.error("Vui lòng điền đầy đủ username, tên, CCCD và vai trò");
      return;
    }
    setCreating(true);
    try {
      await api.post("/admin/create-staff", {
        username: createForm.username.trim(),
        password: createForm.password || undefined,
        name: createForm.name.trim(),
        cccd: createForm.cccd.trim(),
        phone: createForm.phone.trim(),
        role: createForm.role,
      });
      toast.success("Tạo tài khoản nhân viên thành công!");
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE);
      fetchStaffs();
    } catch {
      //
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget) return;
    setEditing(true);
    try {
      await api.put(`/admin/staffs/${editTarget.id}`, {
        name: editForm.name.trim(),
        cccd: editForm.cccd.trim() || undefined,
        phone: editForm.phone.trim(),
        role: editForm.role,
        is_active: editForm.is_active,
      });
      toast.success("Cập nhật thông tin nhân viên thành công!");
      setEditTarget(null);
      fetchStaffs();
    } catch {
      //
    } finally {
      setEditing(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await api.delete(`/admin/staffs/${deactivateTarget.id}`);
      toast.success("Đã vô hiệu hóa tài khoản nhân viên!");
      setDeactivateTarget(null);
      fetchStaffs();
    } catch {
      //
    } finally {
      setDeactivating(false);
    }
  }

  async function handleResetPassword(staff: Staff) {
    setResettingId(staff.id);
    try {
      await api.post("/auth/reset-password-by-admin", {
        userId: staff.id,
        type: "staff",
      });
      toast.success(`Đã reset mật khẩu của ${staff.name} về 123456`);
    } catch {
      //
    } finally {
      setResettingId(null);
    }
  }

  const filtered = staffs.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nhân viên</h1>
          <p className="mt-1 text-muted-foreground">
            Quản lý tài khoản nhân viên hệ thống
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm nhân viên
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length} nhân viên
        </span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-10 px-4 py-3 text-left font-medium text-muted-foreground">
                  #
                </th>
                <th className="w-32 px-4 py-3 text-left font-medium text-muted-foreground">
                  Username
                </th>
                <th className="w-50 px-4 py-3 text-left font-medium text-muted-foreground">
                  Họ tên
                </th>
                <th className="w-36 px-4 py-3 text-left font-medium text-muted-foreground">
                  CCCD/CMND
                </th>
                <th className="w-40 px-4 py-3 text-left font-medium text-muted-foreground">
                  Số điện thoại
                </th>
                <th className="w-28 px-4 py-3 text-left font-medium text-muted-foreground">
                  Vai trò
                </th>
                <th className="w-28 px-4 py-3 text-left font-medium text-muted-foreground">
                  Trạng thái
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
                    colSpan={isAdmin ? 8 : 7}
                    className="px-4 py-16 text-center text-muted-foreground"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-muted-foreground"
                  >
                    <Users className="mx-auto mb-3 h-12 w-12 opacity-20" />
                    <p className="font-medium">
                      {search
                        ? "Không tìm thấy nhân viên phù hợp"
                        : "Chưa có nhân viên nào"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    className="border-b border-border transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td
                      className="truncate px-4 py-3 font-mono text-sm text-foreground"
                      title={s.username}
                    >
                      {s.username}
                    </td>
                    <td
                      className="truncate px-4 py-3 font-semibold text-foreground cursor-pointer hover:text-primary hover:underline"
                      title={s.name}
                      onClick={() => navigate(`/admin/profile?kind=staff&id=${s.id}`)}
                    >
                      {s.name}
                    </td>
                    <td
                      className="truncate px-4 py-3 font-mono text-sm text-muted-foreground"
                      title={s.cccd || ""}
                    >
                      {s.cccd || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {s.phone || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_COLOR[s.role] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {ROLE_LABEL[s.role] ?? s.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {s.is_active ? "Đang làm" : "Nghỉ việc"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleResetPassword(s)}
                              disabled={resettingId === s.id}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-amber-50 hover:text-amber-600"
                              title="Reset mật khẩu về 123456"
                            >
                              <KeyRound className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEdit(s)}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600"
                              title="Chỉnh sửa"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {s.is_active && s.id !== user?.id && (
                              <button
                                onClick={() => setDeactivateTarget(s)}
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Vô hiệu hóa"
                              >
                                <ShieldOff className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ===== MODAL: TẠO NHÂN VIÊN ===== */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !creating && setCreateOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Thêm nhân viên mới
              </h2>
              <button
                onClick={() => setCreateOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Username <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, username: e.target.value }))
                    }
                    placeholder="vd: nhanvien01"
                    className={inputClass}
                    disabled={creating}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, password: e.target.value }))
                    }
                    placeholder="Mặc định: 123456"
                    className={inputClass}
                    disabled={creating}
                  />
                </div>
              </div>
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
                  disabled={creating}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  CCCD/CMND <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.cccd}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, cccd: e.target.value }))
                  }
                  placeholder="Số căn cước công dân hoặc CMND"
                  maxLength={15}
                  className={inputClass}
                  disabled={creating}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="0xxxxxxxxx"
                    className={inputClass}
                    disabled={creating}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Vai trò <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, role: e.target.value }))
                    }
                    className={inputClass}
                    disabled={creating}
                  >
                    <option value="PT">Huấn luyện viên (PT)</option>
                    <option value="RECEPTIONIST">Lễ tân</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Nếu để trống mật khẩu, hệ thống sẽ gán mặc định{" "}
                <strong>123456</strong> và yêu cầu đổi lần đầu đăng nhập.
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={creating}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={creating} className="flex-1">
                  {creating ? "Đang tạo..." : "Tạo tài khoản"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: CHỈNH SỬA NHÂN VIÊN ===== */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !editing && setEditTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Chỉnh sửa —{" "}
                <span className="text-muted-foreground">
                  {editTarget.username}
                </span>
              </h2>
              <button
                onClick={() => setEditTarget(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={inputClass}
                  disabled={editing}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  CCCD/CMND
                </label>
                <input
                  type="text"
                  value={editForm.cccd}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, cccd: e.target.value }))
                  }
                  maxLength={15}
                  className={inputClass}
                  disabled={editing}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                    className={inputClass}
                    disabled={editing}
                  />
                </div>
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
                    disabled={editing}
                  >
                    <option value="PT">Huấn luyện viên (PT)</option>
                    <option value="RECEPTIONIST">Lễ tân</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
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
                  disabled={editing}
                >
                  <option value="true">Đang làm việc</option>
                  <option value="false">Nghỉ việc</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditTarget(null)}
                  disabled={editing}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={editing} className="flex-1">
                  {editing ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: XÁC NHẬN VÔ HIỆU HÓA ===== */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !deactivating && setDeactivateTarget(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <ShieldOff className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  Vô hiệu hóa tài khoản
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tài khoản của{" "}
                  <span className="font-semibold text-foreground">
                    {deactivateTarget.name}
                  </span>{" "}
                  sẽ bị đánh dấu nghỉ việc và không thể đăng nhập. Có thể kích
                  hoạt lại qua chức năng chỉnh sửa.
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeactivateTarget(null)}
                disabled={deactivating}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleDeactivate}
                disabled={deactivating}
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deactivating ? "Đang xử lý..." : "Vô hiệu hóa"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
