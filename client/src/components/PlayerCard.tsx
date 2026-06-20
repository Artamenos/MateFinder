import { Gauge, Mic, MicOff, Send } from "lucide-react";
import { Link } from "react-router-dom";
import type { Profile } from "../types";
import { faceitLevelClass } from "../utils/faceitLevel";

const roleLabels = {
  RIFLER: "Rifler",
  AWPER: "AWPer",
  IGL: "IGL",
  SUPPORT: "Support",
  LURKER: "Lurker"
};

export function PlayerCard({ profile }: { profile: Profile }) {
  const avatarText = profile.nickname.slice(0, 2).toUpperCase();

  return (
    <article className="player-card">
      <div className="player-card__top">
        <div className="player-identity">
          {profile.avatarUrl ? (
            <img className="player-avatar image" src={profile.avatarUrl} alt={profile.nickname} />
          ) : (
            <span className="player-avatar">{avatarText}</span>
          )}
          <div>
            <h3>{profile.nickname}</h3>
            <p>{roleLabels[profile.role]} • {profile.rank}</p>
          </div>
        </div>
        <div className={`level-badge ${faceitLevelClass(profile.faceitLevel)}`}>LVL {profile.faceitLevel ?? "-"}</div>
      </div>

      <p className="player-summary">{profile.description}</p>

      <div className="stats-grid">
        <span>Карты<b>{profile.maps}</b></span>
        <span>Языки<b>{profile.languages}</b></span>
        <span>Прайм<b>{profile.primeTime}</b></span>
        <span>Часы<b>{profile.hours}</b></span>
      </div>

      {profile.faceitStats && (
        <div className="mini-faceit">
          <span className="elo-chip"><Gauge size={14} /> ELO {profile.faceitStats.elo}</span>
          <span>WR {profile.faceitStats.winRate}%</span>
          <span>K/D {profile.faceitStats.averageKd}</span>
        </div>
      )}

      <div className="card-actions">
        <span className="mic-state">{profile.hasMicrophone ? <Mic size={16} /> : <MicOff size={16} />} Микрофон</span>
        <Link className="button secondary" to={`/players/${profile.id}`}>
          <Send size={16} /> Открыть
        </Link>
      </div>
    </article>
  );
}
