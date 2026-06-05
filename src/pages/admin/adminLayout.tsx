import { useState, useRef, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import {
  LayoutDashboard,
  Users,
  Package,
  LogOut,
  Menu,
  ChevronDown,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: Array<"ADMIN" | "RECEPTIONIST" | "PT" | "MEMBER">;
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ["ADMIN", "RECEPTIONIST", "PT"],
    },
    {
      label: "Quản lý hội viên",
      path: "/admin/members",
      icon: <Users className="h-5 w-5" />,
      roles: ["ADMIN", "RECEPTIONIST"],
    },
    {
      label: "Quản lý gói tập",
      path: "/admin/packages",
      icon: <Package className="h-5 w-5" />,
      roles: ["ADMIN", "RECEPTIONIST"],
    },
    {
      label: "Quản lý nhân viên",
      path: "/admin/staffs",
      icon: <Users className="h-5 w-5" />,
      roles: ["ADMIN"],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  const handleLogout = () => {
    setDropdownOpen(false);
    toast.success("Đã đăng xuất");
    navigate("/", { replace: true });
    logout();
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      ADMIN: "Quản trị viên",
      RECEPTIONIST: "Lễ tân",
      PT: "Huấn luyện viên",
      MEMBER: "Thành viên",
    };
    return roleLabels[role] || role;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } flex flex-col border-r border-border bg-card transition-all duration-300 overflow-hidden shrink-0`}
      >
        {/* Sidebar Header */}
        <button
          onClick={() => navigate("/")}
          className="flex h-16 items-center hover:opacity-80 transition-opacity border-b border-border"
        >
          <img src="/favicon.svg" alt="Logo" className="h-8 w-8" />
          <h1 className="ml-2 font-bold text-primary">GYM SIX</h1>
        </button>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        {/* <div className="shrink-0 border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-destructive transition-all hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div> */}
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Account dropdown — relative container ensures menu anchors here */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors outline-none"
            >
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="font-semibold text-primary text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-foreground">
                {user?.name}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-semibold text-foreground text-sm">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getRoleLabel(user?.role || "")}
                  </p>
                </div>
                {/* Actions */}
                <div className="p-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/admin/profile");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <UserCircle className="h-4 w-4" />
                    Hồ sơ của tôi
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
