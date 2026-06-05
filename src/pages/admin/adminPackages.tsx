import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Package, Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { toast } from "sonner";
import api from "../../api";

interface GymPackage {
  id: number;
  name: string;
  months: number;
  price: number;
  description: string;
  created_at?: string;
}

interface PackageFormState {
  name: string;
  months: string;
  price: string;
  description: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const EMPTY_FORM: PackageFormState = {
  name: "",
  months: "",
  price: "",
  description: "",
};

const inputClass =
  "w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export default function AdminPackages() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [packages, setPackages] = useState<GymPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GymPackage | null>(null);
  const [form, setForm] = useState<PackageFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Modal delete
  const [deleteTarget, setDeleteTarget] = useState<GymPackage | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchPackages() {
    setLoading(true);
    try {
      const res = (await api.get(
        "/gym/packages",
      )) as unknown as ApiResponse<GymPackage[]>;
      setPackages(res.data ?? []);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPackages();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(pkg: GymPackage) {
    setEditing(pkg);
    setForm({
      name: pkg.name,
      months: String(pkg.months),
      price: String(pkg.price),
      description: pkg.description ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim() || !form.months || !form.price) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    const payload = {
      name: form.name.trim(),
      months: Number(form.months),
      price: Number(form.price),
      description: form.description.trim(),
    };

    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/gym/packages/${editing.id}`, payload);
        toast.success("Cập nhật gói tập thành công!");
      } else {
        await api.post("/gym/packages", payload);
        toast.success("Thêm gói tập mới thành công!");
      }
      closeModal();
      fetchPackages();
    } catch {
      // error handled by interceptor
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/gym/packages/${deleteTarget.id}`);
      toast.success("Xóa gói tập thành công!");
      setDeleteTarget(null);
      fetchPackages();
    } catch {
      // error handled by interceptor
    } finally {
      setDeleting(false);
    }
  }

  const filtered = packages.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gói tập</h1>
          <p className="mt-1 text-muted-foreground">
            Quản lý các gói tập của phòng gym
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm gói tập
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên gói..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length} gói tập
        </span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[580px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-10 px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tên gói tập</th>
                <th className="w-24 px-4 py-3 text-left font-medium text-muted-foreground">Thời hạn</th>
                <th className="w-40 px-4 py-3 text-left font-medium text-muted-foreground">Giá</th>
                <th className="w-52 px-4 py-3 text-left font-medium text-muted-foreground">Mô tả</th>
                {isAdmin && (
                  <th className="w-24 px-4 py-3 text-right font-medium text-muted-foreground">Thao tác</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="px-4 py-16 text-center text-muted-foreground"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="px-4 py-16 text-center text-muted-foreground"
                  >
                    <Package className="mx-auto mb-3 h-12 w-12 opacity-20" />
                    <p className="font-medium">
                      {search
                        ? "Không tìm thấy gói tập phù hợp"
                        : "Chưa có gói tập nào"}
                    </p>
                    {!search && isAdmin && (
                      <p className="mt-1 text-xs">
                        Bấm "Thêm gói tập" để bắt đầu
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((pkg, i) => (
                  <tr
                    key={pkg.id}
                    className="border-b border-border transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="truncate px-4 py-3 font-semibold text-foreground" title={pkg.name}>{pkg.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {pkg.months} tháng
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-green-600">
                      {formatPrice(pkg.price)}
                    </td>
                    <td className="truncate px-4 py-3 text-muted-foreground" title={pkg.description || ""}>
                      {pkg.description || "—"}
                    </td>
                    {isAdmin && (
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(pkg)}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(pkg)}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* =================== MODAL: CREATE / EDIT =================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {editing ? "Chỉnh sửa gói tập" : "Thêm gói tập mới"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tên gói */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Tên gói tập <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="VD: Gói Tháng, Gói Quý, Gói Năm..."
                  className={inputClass}
                  disabled={submitting}
                  autoFocus
                />
              </div>

              {/* Thời hạn + Giá */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Thời hạn (tháng){" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.months}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        months: e.target.value,
                      }))
                    }
                    placeholder="VD: 1, 3, 6, 12"
                    className={inputClass}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Giá (VNĐ) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    placeholder="VD: 500000"
                    className={inputClass}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Preview giá */}
              {form.price && !isNaN(Number(form.price)) && (
                <p className="text-xs text-muted-foreground">
                  Hiển thị:{" "}
                  <span className="font-semibold text-green-600">
                    {formatPrice(Number(form.price))}
                  </span>
                </p>
              )}

              {/* Mô tả */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Mô tả
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Mô tả quyền lợi, dịch vụ đi kèm của gói tập..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting
                    ? "Đang lưu..."
                    : editing
                      ? "Lưu thay đổi"
                      : "Thêm gói tập"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== MODAL: DELETE CONFIRM =================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Xóa gói tập</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bạn có chắc muốn xóa gói{" "}
                  <span className="font-semibold text-foreground">
                    "{deleteTarget.name}"
                  </span>
                  ? Hành động này không thể hoàn tác và sẽ thất bại nếu đã có
                  hội viên đăng ký gói này.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Đang xóa..." : "Xóa"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
