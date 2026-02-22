import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MapPin, LogOut, User, LayoutDashboard } from "lucide-react";

const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = role === "admin" ? "/admin" : role === "owner" ? "/owner" : "/player";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">BookMyTurf</span>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(dashboardPath)}>
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
                <User className="mr-1.5 h-4 w-4" />
                Profile
              </Button>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="mr-1.5 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate("/auth?tab=signup")}>
                Get Started
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
