import { LogOut, Search, Shield, UserRound, UsersRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CS</div>
          <div>
            <strong>Team Finder</strong>
            <span>CS2 teammates</span>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/">
            <Shield size={18} /> Дашборд
          </NavLink>
          <NavLink to="/teammates">
            <Search size={18} /> Поиск
          </NavLink>
          <NavLink to="/profile">
            <UserRound size={18} /> Анкета
          </NavLink>
          <NavLink to="/invites">
            <UsersRound size={18} /> Инвайты
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <span>{user?.email}</span>
          <button className="icon-button" onClick={handleLogout} title="Выйти">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
