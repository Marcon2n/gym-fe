import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { useAuth } from "../../context/authContext";
import {
  CalendarDays,
  Clock,
  ChevronLeft,
  Check,
  Dumbbell,
} from "lucide-react";
import { toast } from "sonner";

interface TimeSlot {
  id: string;
  label: string;
}

interface BookingRecord {
  id: string;
  date: string;
  time: string;
  notes: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

const TIME_SLOTS: TimeSlot[] = [
  { id: "06:00", label: "06:00 - 07:00" },
  { id: "07:00", label: "07:00 - 08:00" },
  { id: "08:00", label: "08:00 - 09:00" },
  { id: "09:00", label: "09:00 - 10:00" },
  { id: "15:00", label: "15:00 - 16:00" },
  { id: "16:00", label: "16:00 - 17:00" },
  { id: "17:00", label: "17:00 - 18:00" },
  { id: "18:00", label: "18:00 - 19:00" },
  { id: "19:00", label: "19:00 - 20:00" },
  { id: "20:00", label: "20:00 - 21:00" },
];

const STATUS_LABEL: Record<BookingRecord["status"], string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã huỷ",
};

const STATUS_COLOR: Record<BookingRecord["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const inputClass =
  "w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function MemberBooking() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Danh sách lịch đã đặt (local state — chưa có backend)
  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  // Form state
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [tab, setTab] = useState<"new" | "history">("new");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!date || !time) {
      toast.error("Vui lòng chọn ngày và khung giờ");
      return;
    }
    if (date < getTodayStr()) {
      toast.error("Không thể đặt lịch cho ngày trong quá khứ");
      return;
    }

    setSubmitting(true);
    // Simulate async (thay bằng api.post khi có BE)
    await new Promise((r) => setTimeout(r, 800));

    const newBooking: BookingRecord = {
      id: `BK${Date.now()}`,
      date,
      time,
      notes: notes.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);
    toast.success("Đặt lịch thành công! Lễ tân sẽ xác nhận sớm.");
    setDate("");
    setTime("");
    setNotes("");
    setTab("history");
    setSubmitting(false);
  };

  const handleCancel = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
    );
    toast.success("Đã huỷ lịch tập");
  };

  const upcomingCount = bookings.filter(
    (b) => b.status !== "cancelled" && b.date >= getTodayStr(),
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Sub-header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Về trang chủ
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Quản lý lịch tập
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Xin chào,{" "}
                <span className="font-semibold text-foreground">
                  {user?.name}
                </span>{" "}
                — {upcomingCount > 0 ? (
                  <span>
                    Bạn có{" "}
                    <span className="text-primary font-semibold">
                      {upcomingCount}
                    </span>{" "}
                    lịch sắp tới
                  </span>
                ) : (
                  "Chưa có lịch tập nào sắp tới"
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
          {(["new", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                tab === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "new" ? "Đặt lịch mới" : `Lịch sử (${bookings.length})`}
            </button>
          ))}
        </div>

        {/* ====== TAB: ĐẶT LỊCH MỚI ====== */}
        {tab === "new" && (
          <Card className="p-6">
            <h2 className="mb-1 text-base font-semibold text-foreground">
              Đặt lịch tập với PT
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Chọn ngày và khung giờ bạn muốn tập. Lễ tân sẽ phân công PT phù hợp.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Ngày */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Ngày tập <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  min={getTodayStr()}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>

              {/* Khung giờ */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Khung giờ <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TIME_SLOTS.map((slot) => {
                    const selected = time === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setTime(slot.id)}
                        disabled={submitting}
                        className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                          selected
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-foreground hover:border-primary/50 hover:bg-muted/40"
                        }`}
                      >
                        {selected && (
                          <Check className="inline mr-1 h-3 w-3" />
                        )}
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ghi chú */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Ghi chú <span className="text-muted-foreground font-normal">(tuỳ chọn)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Muốn tập tay, nhờ PT hướng dẫn bài squat..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                  disabled={submitting}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !date || !time}
                className="w-full py-6 text-base font-semibold gap-2"
              >
                <CalendarDays className="h-4 w-4" />
                {submitting ? "Đang đặt lịch..." : "Xác nhận đặt lịch"}
              </Button>
            </form>
          </Card>
        )}

        {/* ====== TAB: LỊCH SỬ ====== */}
        {tab === "history" && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <Card className="p-12 text-center">
                <CalendarDays className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p className="font-medium text-muted-foreground">
                  Chưa có lịch tập nào
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chuyển sang tab "Đặt lịch mới" để đặt lịch đầu tiên
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setTab("new")}
                >
                  Đặt lịch ngay
                </Button>
              </Card>
            ) : (
              bookings.map((b) => {
                const dateObj = new Date(b.date + "T00:00:00");
                const dateLabel = dateObj.toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
                const slot = TIME_SLOTS.find((s) => s.id === b.time);
                const canCancel =
                  b.status === "pending" && b.date >= getTodayStr();

                return (
                  <Card key={b.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground capitalize">
                            {dateLabel}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {slot?.label ?? b.time}
                          </p>
                          {b.notes && (
                            <p className="mt-1.5 text-xs text-muted-foreground italic">
                              "{b.notes}"
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            Mã: {b.id}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[b.status]}`}
                        >
                          {STATUS_LABEL[b.status]}
                        </span>
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive transition-colors"
                          >
                            Huỷ lịch
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
