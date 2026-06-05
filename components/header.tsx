import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import iconImg from "../public/favicon.svg";
import { Button } from "./ui/button";
import { useAuth } from "../src/context/authContext";
import { CalendarDays, LogOut, User, ChevronDown } from "lucide-react";
import MemberProfileDialog from "./MemberProfileDialog";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const isMember = user?.role === "MEMBER";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  function handleLogout() {
    setDropdownOpen(false);
    logout();
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src={iconImg} alt="Gym Six Icon" className="h-8 w-8" />
            <h1 className="text-lg font-bold text-primary">GYM SIX</h1>
            {isAuthenticated && isMember && (
              <nav className="hidden md:flex items-center gap-1">
                <button
                  // onClick={() => navigate("/member/booking")}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
                >
                  {/* <CalendarDays className="h-4 w-4" /> */}
                  Quản lý lịch tập
                </button>
              </nav>
            )}
          </button>

          {/* Nav — member only */}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated && isMember ? (
              /* Member dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors outline-none"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <span className="text-sm font-semibold text-primary">
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

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-card shadow-lg z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-semibold text-foreground text-sm">
                        {user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Hội viên
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="p-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate("/member/booking");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        Quản lý lịch tập
                      </button>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setProfileDialogOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        Hồ sơ của tôi
                      </button>
                      <div className="my-1 border-t border-border" />
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
            ) : !isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  className="px-4"
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </Button>
                <Button className="px-4" onClick={() => navigate("/register")}>
                  Đăng ký
                </Button>
              </>
            ) : (
              /* Staff */
              <Button
                variant="outline"
                className="px-4"
                onClick={() => navigate("/admin/dashboard")}
              >
                Vào trang quản lý
              </Button>
            )}
          </div>
        </div>
      </header>
      <MemberProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </>
  );
}
