import { CalendarClock, Inbox, LayoutDashboard, LogOut, Search, Settings, Swords, UsersRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AppLayout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = profile?.nickname ?? user?.email?.split("@")[0] ?? "Player";
  const avatarText = displayName.slice(0, 2).toUpperCase();

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">MF</div>
          <div>
            <strong>MateFinder</strong>
            <span>CS2 team platform</span>
          </div>
        </div>

        <NavLink className="profile-button" to="/profile">
          {profile?.avatarUrl ? (
            <img className="profile-avatar image" src={profile.avatarUrl} alt={displayName} />
          ) : (
            <span className="profile-avatar">{avatarText}</span>
          )}
          <span>
            <b>{displayName}</b>
            <small>{profile ? `${profile.role} · LVL ${profile.faceitLevel ?? "-"}` : "Заполнить анкету"}</small>
          </span>
        </NavLink>

        <nav className="nav">
          <div className="nav-group">
            <span className="nav-label">Главное</span>
            <NavLink to="/">
              <LayoutDashboard size={18} /> Дашборд
            </NavLink>
            <NavLink to="/teammates">
              <Search size={18} /> Тиммейты
            </NavLink>
          </div>

          <div className="nav-group">
            <span className="nav-label">Командная игра</span>
            <NavLink to="/teams">
              <UsersRound size={18} /> Команды
            </NavLink>
            <NavLink to="/praccs">
              <Swords size={18} /> Пракки
            </NavLink>
            <NavLink to="/invites">
              <Inbox size={18} /> Инвайты
            </NavLink>
          </div>

          {user?.isAdmin && (
            <div className="nav-group">
              <span className="nav-label">Управление</span>
              <NavLink to="/admin">
                <Settings size={18} /> Администрирование
              </NavLink>
            </div>
          )}

          <div className="nav-card">
            <CalendarClock size={18} />
            <span>
              <b>Prime time</b>
              <small>{profile?.primeTime ?? "Укажите время в профиле"}</small>
            </span>
          </div>
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
