import { Activity, Gauge, Inbox, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function DashboardPage() {
  const { profile } = useAuth();

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Рабочая область</p>
          <h1>Дашборд игрока</h1>
        </div>
        <Link className="button primary" to="/teammates">
          Найти тиммейтов
        </Link>
      </header>

      {!profile ? (
        <section className="empty-state">
          <h2>Сначала заполните анкету</h2>
          <p>Каталог и приглашения работают лучше, когда у игрока указаны роль, карты и Faceit-статистика.</p>
          <Link className="button primary" to="/profile">Заполнить анкету</Link>
        </section>
      ) : (
        <>
          <section className="dashboard-grid">
            <div className="metric"><Target /><span>Роль</span><b>{profile.role}</b></div>
            <div className="metric"><Gauge /><span>Faceit</span><b>LVL {profile.faceitLevel ?? "-"}</b></div>
            <div className="metric"><Activity /><span>Прайм-тайм</span><b>{profile.primeTime}</b></div>
            <div className="metric"><Inbox /><span>Статус</span><b>Готов к игре</b></div>
          </section>

          <section className="panel">
            <h2>{profile.nickname}</h2>
            <p>{profile.description}</p>
            <div className="stats-grid wide">
              <span>Ранг<b>{profile.rank}</b></span>
              <span>Карты<b>{profile.maps}</b></span>
              <span>Языки<b>{profile.languages}</b></span>
              <span>Часы<b>{profile.hours}</b></span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
