import {
  ChevronRight,
  Inbox,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Swords,
  UsersRound
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const routeMeta = [
  { match: (path: string) => path === "/", title: "Центр управления", kicker: "Community Center" },
  { match: (path: string) => path.startsWith("/teammates"), title: "Скаутинг игроков", kicker: "Roster scan" },
  { match: (path: string) => path.startsWith("/teams"), title: "Командные составы", kicker: "Squad builder" },
  { match: (path: string) => path.startsWith("/praccs"), title: "Тренировочные матчи", kicker: "Practice ops" },
  { match: (path: string) => path.startsWith("/invites"), title: "Приглашения", kicker: "Invite queue" },
  { match: (path: string) => path.startsWith("/profile"), title: "Личный профиль", kicker: "Player file" },
  { match: (path: string) => path.startsWith("/admin"), title: "Администрирование", kicker: "Admin console" }
];

const friends = [
  {
    name: "ludorolog",
    role: "RIFLER",
    avatar: "https://distribution.faceit-cdn.net/images/db7b3eb0-b466-47cf-b3a3-a83b92de91ad.jpeg"
  },
  {
    name: "hushgh",
    role: "SUPPORT",
    avatar: "https://og-images.faceit-cdn.net/v1/players/hushgh/profile"
  },
  {
    name: "MRAOF",
    role: "AWPER",
    avatar: "https://assets.faceit-cdn.net/avatars/e97850e3-8fef-449d-8edd-49874349bbc7_1569612160419.jpg"
  },
  {
    name: "Skvorets",
    role: "LURKER",
    avatar: "https://distribution.faceit-cdn.net/images/b14b04a6-bad5-41df-b197-6dd5c40a7c15.jpeg"
  }
];

export function AppLayout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = profile?.nickname ?? user?.email?.split("@")[0] ?? "Player";
  const avatarText = displayName.slice(0, 2).toUpperCase();
  const teamName = profile?.nickname === "Artamenos" || profile?.nickname === "Prikolist" ? "Arta Stack" : "";
  const currentRoute = routeMeta.find((item) => item.match(location.pathname)) ?? {
    title: "MateFinder",
    kicker: "Community Center"
  };

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  return (
    <div className="app-shell command-shell">
      <aside className="sidebar command-rail">
        <div className="brand command-brand">
          <img className="brand-logo" src="/logo-matefinder.png" alt="MateFinder" />
          <div>
            <strong>MateFinder</strong>
            <span>CS2 Community Center</span>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-group">
            <span className="nav-label">Навигация</span>
            <NavLink to="/">
              <LayoutDashboard size={18} /> Дашборд
            </NavLink>
            <NavLink to="/teammates">
              <Search size={18} /> Тиммейты
            </NavLink>
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
              <span className="nav-label">Система</span>
              <NavLink to="/admin">
                <Settings size={18} /> Администрирование
              </NavLink>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <span>{user?.email}</span>
          <button className="icon-button" onClick={handleLogout} title="Выйти">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="content command-content">
        <header className="topbar command-topbar">
          <div>
            <span className="topbar-kicker">{currentRoute.kicker}</span>
            <strong>{currentRoute.title}</strong>
          </div>
        </header>
        <Outlet />
      </main>

      <aside className="right-panel">
        <NavLink className="right-profile" to="/profile">
          {profile?.avatarUrl ? (
            <img className="profile-avatar image" src={profile.avatarUrl} alt={displayName} />
          ) : (
            <span className="profile-avatar">{avatarText}</span>
          )}
          <span>
            <b>{displayName}</b>
            <small>{profile ? `${profile.role} · LVL ${profile.faceitLevel ?? "-"}` : "Заполнить профиль"}</small>
          </span>
          <ChevronRight size={16} />
        </NavLink>

        <section className="right-widget">
          <span className="right-label">Команда</span>
          {teamName ? (
            <NavLink className="team-mini" to="/teams">
              <strong>{teamName}</strong>
              <small>5 игроков · 2 замены · тренер</small>
              <ChevronRight size={16} />
            </NavLink>
          ) : (
            <NavLink className="button secondary wide-button" to="/teams">
              Добавить команду
            </NavLink>
          )}
        </section>

        <section className="right-widget">
          <span className="right-label">Друзья</span>
          <div className="friend-list">
            {friends.map((friend) => (
              <div className="friend-row" key={friend.name}>
                <img src={friend.avatar} alt={friend.name} />
                <span>
                  <b>{friend.name}</b>
                  <small>{friend.role}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
