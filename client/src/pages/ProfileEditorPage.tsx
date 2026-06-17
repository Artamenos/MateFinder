import { RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { PlayerRole, Profile } from "../types";

const roles: PlayerRole[] = ["RIFLER", "AWPER", "IGL", "SUPPORT", "LURKER"];

const defaultForm = {
  nickname: "",
  faceitNickname: "",
  role: "RIFLER" as PlayerRole,
  rank: "Master Guardian",
  faceitLevel: 5,
  hours: 1000,
  maps: "Mirage, Inferno",
  languages: "RU",
  primeTime: "19:00-23:00 MSK",
  hasMicrophone: true,
  description: "Ищу тиммейтов для регулярной игры и развития командного взаимодействия."
};

export function ProfileEditorPage() {
  const { profile, refresh } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        nickname: profile.nickname,
        faceitNickname: profile.faceitNickname ?? "",
        role: profile.role,
        rank: profile.rank,
        faceitLevel: profile.faceitLevel ?? 5,
        hours: profile.hours,
        maps: profile.maps,
        languages: profile.languages,
        primeTime: profile.primeTime,
        hasMicrophone: profile.hasMicrophone,
        description: profile.description
      });
    }
  }, [profile]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api<{ profile: Profile }>("/profiles/me", {
        method: "PUT",
        body: JSON.stringify(form)
      });
      await refresh();
      setMessage("Анкета сохранена");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить анкету");
    }
  }

  async function syncFaceit() {
    setError("");
    setMessage("");

    try {
      await api("/faceit/sync", {
        method: "POST",
        body: JSON.stringify({ nickname: form.faceitNickname || form.nickname })
      });
      await refresh();
      setMessage("Faceit-статистика обновлена");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось обновить статистику");
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Профиль</p>
          <h1>Анкета игрока</h1>
        </div>
      </header>

      <form className="form-grid panel" onSubmit={save}>
        <label>
          Никнейм
          <input value={form.nickname} onChange={(event) => update("nickname", event.target.value)} required />
        </label>
        <label>
          Faceit nickname
          <input value={form.faceitNickname} onChange={(event) => update("faceitNickname", event.target.value)} />
        </label>
        <label>
          Роль
          <select value={form.role} onChange={(event) => update("role", event.target.value as PlayerRole)}>
            {roles.map((role) => <option key={role}>{role}</option>)}
          </select>
        </label>
        <label>
          Ранг
          <input value={form.rank} onChange={(event) => update("rank", event.target.value)} required />
        </label>
        <label>
          Faceit level
          <input type="number" min="1" max="10" value={form.faceitLevel} onChange={(event) => update("faceitLevel", Number(event.target.value))} />
        </label>
        <label>
          Часы в CS2
          <input type="number" min="0" value={form.hours} onChange={(event) => update("hours", Number(event.target.value))} />
        </label>
        <label>
          Карты
          <input value={form.maps} onChange={(event) => update("maps", event.target.value)} required />
        </label>
        <label>
          Языки
          <input value={form.languages} onChange={(event) => update("languages", event.target.value)} required />
        </label>
        <label>
          Время игры
          <input value={form.primeTime} onChange={(event) => update("primeTime", event.target.value)} required />
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.hasMicrophone} onChange={(event) => update("hasMicrophone", event.target.checked)} />
          Есть микрофон
        </label>
        <label className="full">
          Описание
          <textarea value={form.description} onChange={(event) => update("description", event.target.value)} rows={5} required />
        </label>

        {message && <p className="success full">{message}</p>}
        {error && <p className="error full">{error}</p>}

        <div className="form-actions full">
          <button className="button primary" type="submit"><Save size={16} /> Сохранить</button>
          <button className="button secondary" type="button" onClick={syncFaceit}><RefreshCw size={16} /> Обновить Faceit</button>
        </div>
      </form>
    </div>
  );
}
