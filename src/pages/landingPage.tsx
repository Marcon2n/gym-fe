import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/header";
import { Button } from "../../components/ui/button";
import api from "../api";
import {
  Dumbbell,
  Users,
  Clock,
  ShieldCheck,
  Zap,
  Trophy,
  ChevronRight,
  Star,
  MapPin,
  Phone,
  Mail,
  Check,
} from "lucide-react";

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

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

const STATS = [
  { value: "500+", label: "Hội viên đang hoạt động", icon: Users },
  { value: "15+", label: "Huấn luyện viên chuyên nghiệp", icon: Trophy },
  { value: "200+", label: "Thiết bị hiện đại", icon: Dumbbell },
  { value: "18/7", label: "Giờ mở cửa mỗi ngày", icon: Clock },
];

const FEATURES = [
  {
    icon: Dumbbell,
    title: "Thiết bị hiện đại",
    desc: "Hệ thống máy tập nhập khẩu cao cấp, đầy đủ các nhóm cơ từ cardio đến strength training.",
  },
  {
    icon: Users,
    title: "HLV chuyên nghiệp",
    desc: "Đội ngũ PT được đào tạo bài bản, lên giáo án cá nhân hóa theo mục tiêu của bạn.",
  },
  {
    icon: Zap,
    title: "Lớp học đa dạng",
    desc: "Yoga, Zumba, Boxing, CrossFit… hơn 20 lớp nhóm mỗi tuần cho mọi trình độ.",
  },
  {
    icon: ShieldCheck,
    title: "An toàn & vệ sinh",
    desc: "Không gian tập luyện sạch sẽ, thông thoáng. Khử khuẩn thiết bị sau mỗi buổi tập.",
  },
  {
    icon: Clock,
    title: "Linh hoạt thời gian",
    desc: "Mở cửa từ 5:00 – 23:00 mỗi ngày, kể cả cuối tuần và ngày lễ.",
  },
  {
    icon: Trophy,
    title: "Cộng đồng năng động",
    desc: "Tham gia cộng đồng hội viên tích cực, tổ chức thách thức và giải đấu hàng tháng.",
  },
];

const TESTIMONIALS = [
  {
    name: "Nguyễn Văn Anh",
    role: "Hội viên 2 năm",
    text: "Gym Six thay đổi hoàn toàn thói quen tập luyện của mình. PT ở đây tận tâm lắm, chỉ sau 6 tháng mình đã đạt được mục tiêu giảm 12kg.",
    rating: 5,
  },
  {
    name: "Trần Thị Minh",
    role: "Hội viên 1 năm",
    text: "Thiết bị rất hiện đại và sạch sẽ. Các lớp Yoga buổi sáng giúp mình bắt đầu ngày mới thật tuyệt vời. Nhân viên thân thiện.",
    rating: 5,
  },
  {
    name: "Lê Hoàng Nam",
    role: "Hội viên 8 tháng",
    text: "Không gian rộng rãi, không bao giờ phải chờ máy. Giá cả hợp lý so với chất lượng dịch vụ. Mình đã giới thiệu cả nhóm bạn đến đây.",
    rating: 5,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<GymPackage[]>([]);

  useEffect(() => {
    (api.get("/gym/packages") as unknown as Promise<ApiResponse<GymPackage[]>>)
      .then((res) =>
        setPackages(
          (res.data ?? []).filter((p) => p.is_active !== false).slice(0, 3),
        ),
      )
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-36">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              Phòng gym số 1 tại thành phố
            </div>
            <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
              Bứt phá <span className="text-primary">giới hạn</span> của bản
              thân
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              GYM SIX — nơi bạn xây dựng thói quen, rèn luyện thể chất và tìm
              lại sức mạnh nội tâm. Đội ngũ HLV chuyên nghiệp, thiết bị hiện
              đại, không gian đẳng cấp.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="gap-2 px-8 py-6 text-base font-semibold"
                onClick={() => navigate("/register")}
              >
                Đăng ký ngay
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-base font-semibold"
                onClick={() =>
                  document
                    .getElementById("packages")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Xem gói tập
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-3 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-foreground">
                    {value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Tại sao chọn <span className="text-primary">GYM SIX</span>?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Chúng tôi cung cấp môi trường tập luyện tốt nhất để bạn đạt mục tiêu
            nhanh nhất.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PACKAGES ─────────────────────────────────────────────────────── */}
      <section id="packages" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Gói tập phù hợp với bạn
            </h2>
            <p className="mt-4 text-muted-foreground">
              Lựa chọn gói tập phù hợp với mục tiêu và ngân sách. Tất cả gói đều
              bao gồm quyền truy cập toàn bộ thiết bị.
            </p>
          </div>

          {packages.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Đang tải gói tập...
            </div>
          ) : (
            <div
              className={`grid gap-6 ${packages.length === 1 ? "max-w-sm mx-auto" : packages.length === 2 ? "max-w-2xl mx-auto md:grid-cols-2" : "md:grid-cols-3"}`}
            >
              {packages.map((pkg, i) => {
                const isHighlight = i === 1 && packages.length === 3;
                return (
                  <div
                    key={pkg.id}
                    className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                      isHighlight
                        ? "border-primary bg-primary shadow-lg shadow-primary/20 text-primary-foreground"
                        : "border-border bg-card hover:border-primary/40 hover:shadow-md"
                    }`}
                  >
                    {isHighlight && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-4 py-1 text-xs font-semibold text-background">
                        Phổ biến nhất
                      </div>
                    )}
                    <div>
                      <h3
                        className={`text-lg font-bold ${isHighlight ? "text-primary-foreground" : "text-foreground"}`}
                      >
                        {pkg.name}
                      </h3>
                      {pkg.description && (
                        <p
                          className={`mt-1.5 text-sm ${isHighlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                        >
                          {pkg.description}
                        </p>
                      )}
                    </div>

                    <div className="my-6">
                      <span
                        className={`text-4xl font-extrabold ${isHighlight ? "text-primary-foreground" : "text-foreground"}`}
                      >
                        {formatPrice(pkg.price)}
                      </span>
                      <span
                        className={`ml-1 text-sm ${isHighlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                      >
                        / {pkg.months} tháng
                      </span>
                    </div>

                    <ul className="mb-8 flex-1 space-y-2.5 text-sm">
                      <li className="flex items-center gap-2">
                        <Check
                          className={`h-4 w-4 shrink-0 ${isHighlight ? "text-primary-foreground" : "text-primary"}`}
                        />
                        <span
                          className={
                            isHighlight
                              ? "text-primary-foreground/90"
                              : "text-muted-foreground"
                          }
                        >
                          Truy cập toàn bộ thiết bị
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check
                          className={`h-4 w-4 shrink-0 ${isHighlight ? "text-primary-foreground" : "text-primary"}`}
                        />
                        <span
                          className={
                            isHighlight
                              ? "text-primary-foreground/90"
                              : "text-muted-foreground"
                          }
                        >
                          Tham gia tất cả lớp nhóm
                        </span>
                      </li>
                      {pkg.has_pt && (
                        <li className="flex items-center gap-2">
                          <Check
                            className={`h-4 w-4 shrink-0 ${isHighlight ? "text-primary-foreground" : "text-primary"}`}
                          />
                          <span
                            className={`font-medium ${isHighlight ? "text-primary-foreground" : "text-foreground"}`}
                          >
                            Kèm huấn luyện viên cá nhân
                          </span>
                        </li>
                      )}
                      <li className="flex items-center gap-2">
                        <Check
                          className={`h-4 w-4 shrink-0 ${isHighlight ? "text-primary-foreground" : "text-primary"}`}
                        />
                        <span
                          className={
                            isHighlight
                              ? "text-primary-foreground/90"
                              : "text-muted-foreground"
                          }
                        >
                          Tủ đồ & phòng thay quần áo
                        </span>
                      </li>
                    </ul>

                    <Button
                      onClick={() => navigate("/register")}
                      className={`w-full font-semibold ${
                        isHighlight
                          ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                          : ""
                      }`}
                      variant={isHighlight ? "outline" : "default"}
                    >
                      Đăng ký gói này
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Chưa chắc chắn? Liên hệ lễ tân để được tư vấn miễn phí.
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Hội viên nói gì về chúng tôi
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(({ name, role, text, rating }) => (
            <div
              key={name}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                "{text}"
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-semibold text-primary">
                    {name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {name}
                  </p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="bg-primary py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-extrabold text-primary-foreground md:text-4xl">
            Bắt đầu hành trình của bạn hôm nay
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Đăng ký tài khoản chỉ trong vài phút. Không cam kết dài hạn, huỷ bất
            cứ lúc nào.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="gap-2 bg-primary-foreground text-primary px-8 py-6 text-base font-semibold hover:bg-primary-foreground/90"
              onClick={() => navigate("/register")}
            >
              Tạo tài khoản
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="border-primary-foreground/40 text-primary-foreground px-8 py-6 text-base font-semibold hover:bg-primary-foreground/10"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-10 md:grid-cols-3">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2">
                <img src="/favicon.svg" alt="GYM SIX" className="h-8 w-8" />
                <span className="text-lg font-bold text-foreground">
                  GYM SIX
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Phòng gym cao cấp với thiết bị hiện đại và đội ngũ huấn luyện
                viên chuyên nghiệp. Đồng hành cùng bạn trên mọi hành trình.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-semibold text-foreground">Liên kết nhanh</h4>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  { label: "Đăng ký thành viên", path: "/register" },
                  { label: "Đăng nhập", path: "/login" },
                  { label: "Gói tập", id: "packages" },
                ].map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() =>
                        item.path
                          ? navigate(item.path)
                          : document
                              .getElementById(item.id!)
                              ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-foreground">Liên hệ</h4>
              <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  Số 1 Đại Cồ Việt, Phường Bạch Mai, Hà Nội
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  0909 123 456
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  contact@gymsix.vn
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            © 2026 GYM SIX. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
