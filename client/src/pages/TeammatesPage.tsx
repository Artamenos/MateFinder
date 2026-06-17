import { Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { PlayerCard } from "../components/PlayerCard";
import type { PlayerRole, Profile } from "../types";

const roles: Array<"" | PlayerRole> = ["", "RIFLER", "AWPER", "IGL", "SUPPORT", "LURKER"];

export function TeammatesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [minLevel, setMinLevel] = useState("");
  const [map, setMap] = useState("");
  const [language, setLanguage] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    if (minLevel) params.set("minLevel", minLevel);
    if (map) params.set("map", map);
    if (language) params.set("language", language);
    return params.toString();
  }, [q, role, minLevel, map, language]);

  useEffect(() => {
    api<{ profiles: Profile[] }>(`/profiles?${query}`).then((data) => setProfiles(data.profiles));
  }, [query]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Каталог</p>
          <h1>Поиск тиммейтов</h1>
        </div>
      </header>

      <section className="filters">
        <Filter size={18} />
        <input placeholder="Никнейм" value={q} onChange={(event) => setQ(event.target.value)} />
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          {roles.map((item) => <option key={item} value={item}>{item || "Любая роль"}</option>)}
        </select>
        <input placeholder="Мин. Faceit level" type="number" min="1" max="10" value={minLevel} onChange={(event) => setMinLevel(event.target.value)} />
        <input placeholder="Карта" value={map} onChange={(event) => setMap(event.target.value)} />
        <input placeholder="Язык" value={language} onChange={(event) => setLanguage(event.target.value)} />
      </section>

      <section className="cards-grid">
        {profiles.map((profile) => <PlayerCard key={profile.id} profile={profile} />)}
      </section>
    </div>
  );
}
