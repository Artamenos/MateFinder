import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Profile } from "../types";

export function PlayerPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("Привет! Предлагаю сыграть вместе и проверить командную химию.");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (id) {
      api<{ profile: Profile }>(`/profiles/${id}`).then((data) => setProfile(data.profile));
    }
  }, [id]);

  async function invite() {
    if (!profile?.userId) return;
    setStatus("");

    try {
      await api("/invites", {
        method: "POST",
        body: JSON.stringify({ receiverId: profile.userId, message })
      });
      setStatus("Приглашение отправлено");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Не удалось отправить приглашение");
    }
  }

  if (!profile) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Игрок</p>
          <h1>{profile.nickname}</h1>
        </div>
        <Link className="button secondary" to="/teammates">Назад к поиску</Link>
      </header>

      <section className="profile-layout">
        <article className="panel">
          <h2>Анкета</h2>
          <p>{profile.description}</p>
          <div className="stats-grid wide">
            <span>Роль<b>{profile.role}</b></span>
            <span>Ранг<b>{profile.rank}</b></span>
            <span>Faceit<b>LVL {profile.faceitLevel ?? "-"}</b></span>
            <span>Часы<b>{profile.hours}</b></span>
            <span>Карты<b>{profile.maps}</b></span>
            <span>Языки<b>{profile.languages}</b></span>
            <span>Время<b>{profile.primeTime}</b></span>
            <span>Микрофон<b>{profile.hasMicrophone ? "Да" : "Нет"}</b></span>
          </div>
        </article>

        <aside className="panel">
          <h2>Faceit</h2>
          {profile.faceitStats ? (
            <div className="faceit-panel">
              <div className="level-badge big">LVL {profile.faceitStats.level}</div>
              <span>ELO <b>{profile.faceitStats.elo}</b></span>
              <span>Матчи <b>{profile.faceitStats.matches}</b></span>
              <span>Winrate <b>{profile.faceitStats.winRate}%</b></span>
              <span>K/D <b>{profile.faceitStats.averageKd}</b></span>
              <span>HS <b>{profile.faceitStats.headshotRate}%</b></span>
              <span>Форма <b>{profile.faceitStats.recentForm}</b></span>
            </div>
          ) : (
            <p className="muted">Статистика пока не загружена.</p>
          )}
        </aside>
      </section>

      <section className="panel">
        <h2>Пригласить в команду</h2>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} />
        <div className="form-actions">
          <button className="button primary" onClick={invite}><Send size={16} /> Отправить инвайт</button>
          {status && <span className="muted">{status}</span>}
        </div>
      </section>
    </div>
  );
}
