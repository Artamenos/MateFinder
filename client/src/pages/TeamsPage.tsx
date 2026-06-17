import { Plus, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

type Team = {
  id: number;
  name: string;
  level: string;
  region: string;
  captain: string;
  players: string[];
  coach: string;
  substitutes: string[];
  goals: string;
};

const initialTeams: Team[] = [
  {
    id: 1,
    name: "Purple Execute",
    level: "Faceit 7-10",
    region: "EU / RU",
    captain: "s1mple_vibes",
    players: ["s1mple_vibes", "flash_master", "m0nesy_style", "anchor_44", "midcaller"],
    coach: "demo_review",
    substitutes: ["late_lurker", "utility_plus"],
    goals: "Регулярные пракки, разбор демок и подготовка к открытым турнирам."
  }
];

const emptyRoster = ["", "", "", "", ""];
const emptySubs = ["", ""];

export function TeamsPage() {
  const [teams, setTeams] = useState(initialTeams);
  const [name, setName] = useState("Arta Stack");
  const [level, setLevel] = useState("Faceit 5-8");
  const [region, setRegion] = useState("RU / EU");
  const [captain, setCaptain] = useState("Artamenos");
  const [players, setPlayers] = useState(emptyRoster);
  const [coach, setCoach] = useState("");
  const [substitutes, setSubstitutes] = useState(emptySubs);
  const [goals, setGoals] = useState("Собрать стабильный состав для вечерних тренировок и матчей на Faceit.");

  const filledSlots = useMemo(
    () => players.filter(Boolean).length + substitutes.filter(Boolean).length + (coach ? 1 : 0),
    [players, substitutes, coach]
  );

  function updateRoster(index: number, value: string) {
    setPlayers((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function updateSubstitute(index: number, value: string) {
    setSubstitutes((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function createTeam(event: React.FormEvent) {
    event.preventDefault();
    setTeams((current) => [
      {
        id: Date.now(),
        name,
        level,
        region,
        captain,
        players: players.map((player, index) => player || `Игрок ${index + 1}`),
        coach: coach || "Тренер не назначен",
        substitutes: substitutes.map((player, index) => player || `Замена ${index + 1}`),
        goals
      },
      ...current
    ]);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Составы</p>
          <h1>Команды</h1>
        </div>
      </header>

      <section className="team-layout">
        <form className="panel team-builder" onSubmit={createTeam}>
          <div className="panel-title">
            <UsersRound size={20} />
            <div>
              <h2>Собрать команду</h2>
              <p className="muted">5 игроков, тренер и 2 запасных слота</p>
            </div>
          </div>

          <div className="form-grid compact">
            <label>
              Название
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Уровень
              <input value={level} onChange={(event) => setLevel(event.target.value)} />
            </label>
            <label>
              Регион
              <input value={region} onChange={(event) => setRegion(event.target.value)} />
            </label>
            <label>
              Капитан
              <input value={captain} onChange={(event) => setCaptain(event.target.value)} />
            </label>
          </div>

          <div className="slot-grid">
            {players.map((player, index) => (
              <label key={`player-${index}`} className="slot-field">
                Игрок {index + 1}
                <input value={player} onChange={(event) => updateRoster(index, event.target.value)} placeholder="Никнейм" />
              </label>
            ))}
            <label className="slot-field coach">
              Тренер
              <input value={coach} onChange={(event) => setCoach(event.target.value)} placeholder="Никнейм тренера" />
            </label>
            {substitutes.map((player, index) => (
              <label key={`sub-${index}`} className="slot-field substitute">
                Замена {index + 1}
                <input value={player} onChange={(event) => updateSubstitute(index, event.target.value)} placeholder="Никнейм" />
              </label>
            ))}
          </div>

          <label>
            Цель команды
            <textarea value={goals} onChange={(event) => setGoals(event.target.value)} rows={3} />
          </label>

          <div className="builder-footer">
            <span>{filledSlots}/8 слотов заполнено</span>
            <button className="button primary" type="submit">
              <Plus size={16} /> Добавить команду
            </button>
          </div>
        </form>

        <div className="team-list">
          {teams.map((team) => (
            <article className="panel team-card" key={team.id}>
              <div className="team-card__head">
                <div>
                  <h2>{team.name}</h2>
                  <p className="muted">{team.level} · {team.region}</p>
                </div>
                <span className="level-badge">5+3</span>
              </div>

              <p>{team.goals}</p>

              <div className="roster-slots">
                {team.players.map((player, index) => (
                  <span className="roster-slot" key={`${team.id}-p-${player}`}>
                    <b>{index + 1}</b>{player}
                  </span>
                ))}
                <span className="roster-slot coach"><ShieldCheck size={14} />{team.coach}</span>
                {team.substitutes.map((player) => (
                  <span className="roster-slot substitute" key={`${team.id}-s-${player}`}>
                    <UserPlus size={14} />{player}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
