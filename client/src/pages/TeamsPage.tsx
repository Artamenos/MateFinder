import { Check, ChevronDown, LogOut, Pencil, Plus, Search, Send, ShieldCheck, Trash2, UserPlus, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Profile } from "../types";
import { faceitLevelClass } from "../utils/faceitLevel";

type Team = {
  id: string;
  name: string;
  level: string;
  region: string;
  captain: string;
  members: string[];
  players: string[];
  coach: string;
  substitutes: string[];
  goals: string;
  pendingInvites: string[];
  pendingRequests: string[];
};

const emptyRoster = ["", "", "", "", ""];
const emptySubs = ["", ""];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function CustomMemberSelect({
  label,
  value,
  emptyLabel,
  options,
  openKey,
  activeKey,
  onOpen,
  onChange
}: {
  label: string;
  value: string;
  emptyLabel: string;
  options: string[];
  openKey: string;
  activeKey: string | null;
  onOpen: (key: string | null) => void;
  onChange: (value: string) => void;
}) {
  const isOpen = activeKey === openKey;
  const visibleOptions = ["", ...options.filter(Boolean)];

  return (
    <div className="custom-select">
      <span>{label}</span>
      <button type="button" className="custom-select__trigger" onClick={() => onOpen(isOpen ? null : openKey)}>
        <b>{value || emptyLabel}</b>
        <ChevronDown size={16} />
      </button>
      {isOpen && (
        <div className="custom-select__menu">
          {visibleOptions.map((option) => (
            <button
              type="button"
              className={option === value ? "active" : ""}
              key={`${openKey}-${option || "empty"}`}
              onClick={() => {
                onChange(option);
                onOpen(null);
              }}
            >
              {option || emptyLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TeamsPage() {
  const { profile } = useAuth();
  const currentNickname = profile?.nickname ?? "Artamenos";
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [name, setName] = useState("Arta Stack");
  const [level, setLevel] = useState("Faceit 8-10");
  const [region, setRegion] = useState("RU / EU");
  const [captain, setCaptain] = useState(currentNickname);
  const [teamMembers, setTeamMembers] = useState([currentNickname]);
  const [players, setPlayers] = useState([currentNickname, "", "", "", ""]);
  const [coach, setCoach] = useState("");
  const [substitutes, setSubstitutes] = useState(emptySubs);
  const [goals, setGoals] = useState("Stable evening roster for praccs, Faceit matches and team training.");
  const [teamQuery, setTeamQuery] = useState("");
  const [levelQuery, setLevelQuery] = useState("");
  const [inviteInputs, setInviteInputs] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [inviteStatus, setInviteStatus] = useState<Record<string, string>>({});
  const [activeSelect, setActiveSelect] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  async function loadTeams() {
    const data = await api<{ teams: Team[] }>("/teams");
    setTeams(data.teams);
    const current = editingTeamId ? data.teams.find((team) => team.id === editingTeamId) : data.teams.find((team) => team.captain === currentNickname);
    if (current) applyTeamToForm(current);
  }

  useEffect(() => {
    api<{ profiles: Profile[] }>("/profiles").then((data) => setProfiles(data.profiles)).catch(() => setProfiles([]));
    loadTeams().catch(() => setTeams([]));
  }, []);

  const filteredTeams = useMemo(() => {
    const q = normalize(teamQuery);
    const levelFilter = normalize(levelQuery);
    return teams.filter((team) => {
      const teamText = normalize(`${team.name} ${team.region} ${team.level} ${team.goals} ${team.players.join(" ")} ${team.members.join(" ")}`);
      return (!q || teamText.includes(q)) && (!levelFilter || normalize(team.level).includes(levelFilter));
    });
  }, [teams, teamQuery, levelQuery]);

  const filledSlots = useMemo(
    () => players.filter(Boolean).length + substitutes.filter(Boolean).length + (coach ? 1 : 0),
    [players, substitutes, coach]
  );

  const captainOptions = useMemo(() => {
    const names = new Set(teamMembers);
    if (captain) names.add(captain);
    return Array.from(names);
  }, [teamMembers, captain]);

  function applyTeamToForm(team: Team) {
    setEditingTeamId(team.id);
    setName(team.name);
    setLevel(team.level);
    setRegion(team.region);
    setCaptain(team.captain);
    setTeamMembers(team.members);
    setPlayers([...team.players, ...emptyRoster].slice(0, 5));
    setCoach(team.coach);
    setSubstitutes([...team.substitutes, ...emptySubs].slice(0, 2));
    setGoals(team.goals);
  }

  function resetForm() {
    setEditingTeamId(null);
    setName("Новая команда");
    setLevel("Faceit 5-8");
    setRegion("RU / EU");
    setCaptain(currentNickname);
    setTeamMembers([currentNickname]);
    setPlayers([currentNickname, "", "", "", ""]);
    setCoach("");
    setSubstitutes(emptySubs);
    setGoals("Описание целей команды, расписания и требований к игрокам.");
  }

  function slotOptions(currentValue: string) {
    const chosen = new Set([...players, coach, ...substitutes].filter(Boolean).map(normalize));
    return teamMembers.filter((nickname) => normalize(nickname) === normalize(currentValue) || !chosen.has(normalize(nickname)));
  }

  function updateRoster(index: number, value: string) {
    setPlayers((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function updateSubstitute(index: number, value: string) {
    setSubstitutes((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function payload() {
    return {
      name,
      level,
      region,
      captain: captain || currentNickname,
      members: Array.from(new Set([...teamMembers, captain, ...players, coach, ...substitutes].filter(Boolean))),
      players,
      coach,
      substitutes,
      goals
    };
  }

  async function saveTeam(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingTeamId) {
        const data = await api<{ team: Team }>(`/teams/${editingTeamId}`, {
          method: "PUT",
          body: JSON.stringify(payload())
        });
        setTeams((current) => current.map((team) => (team.id === editingTeamId ? data.team : team)));
        applyTeamToForm(data.team);
      } else {
        const data = await api<{ team: Team }>("/teams", {
          method: "POST",
          body: JSON.stringify(payload())
        });
        setTeams((current) => [data.team, ...current]);
        applyTeamToForm(data.team);
      }
    } finally {
      setIsSaving(false);
    }
  }

  function isMember(team: Team) {
    return team.members.some((member) => normalize(member) === normalize(currentNickname));
  }

  function hasJoinRequest(team: Team) {
    return team.pendingRequests.some((request) => normalize(request) === normalize(currentNickname));
  }

  async function updateTeamFromApi(request: Promise<{ team: Team }>) {
    const data = await request;
    setTeams((current) => current.map((team) => (team.id === data.team.id ? data.team : team)));
    if (editingTeamId === data.team.id) applyTeamToForm(data.team);
  }

  function requestToJoin(team: Team) {
    updateTeamFromApi(api<{ team: Team }>(`/teams/${team.id}/requests`, { method: "POST" })).catch(() => undefined);
  }

  function cancelJoinRequest(team: Team, nickname = currentNickname) {
    updateTeamFromApi(api<{ team: Team }>(`/teams/${team.id}/requests/${encodeURIComponent(nickname)}`, { method: "DELETE" })).catch(() => undefined);
  }

  function acceptJoinRequest(team: Team, nickname: string) {
    updateTeamFromApi(api<{ team: Team }>(`/teams/${team.id}/requests/${encodeURIComponent(nickname)}/accept`, { method: "POST" })).catch((error) => {
      setInviteStatus((current) => ({ ...current, [team.id]: error instanceof Error ? error.message : "Не удалось принять заявку" }));
    });
  }

  function declineJoinRequest(team: Team, nickname: string) {
    cancelJoinRequest(team, nickname);
  }

  function leaveTeam(team: Team) {
    if (team.captain === currentNickname) {
      setInviteStatus((current) => ({ ...current, [team.id]: "Капитан не может выйти, пока не назначит другого капитана" }));
    }
  }

  async function deleteTeam(team: Team) {
    await api(`/teams/${team.id}`, { method: "DELETE" });
    setTeams((current) => current.filter((item) => item.id !== team.id));
    if (editingTeamId === team.id) resetForm();
  }

  async function inviteToTeam(team: Team) {
    const nickname = inviteInputs[team.id]?.trim();
    if (!nickname) return;

    const receiver = profiles.find((profileItem) => normalize(profileItem.nickname) === normalize(nickname));
    if (!receiver?.user?.id) {
      setInviteStatus((current) => ({ ...current, [team.id]: "Игрок не найден в базе профилей" }));
      return;
    }

    await updateTeamFromApi(api<{ team: Team }>(`/teams/${team.id}/invites`, {
      method: "POST",
      body: JSON.stringify({ nickname })
    }));
    setInviteInputs((current) => ({ ...current, [team.id]: "" }));
    setInviteStatus((current) => ({ ...current, [team.id]: `Инвайт отправлен игроку ${nickname}` }));
  }

  function cancelInvite(team: Team, nickname: string) {
    updateTeamFromApi(api<{ team: Team }>(`/teams/${team.id}/invites/${encodeURIComponent(nickname)}`, { method: "DELETE" })).catch(() => undefined);
  }

  function inviteSuggestions(team: Team) {
    const query = normalize(inviteInputs[team.id] ?? "");
    const busyNicknames = new Set([...team.members, ...team.pendingInvites].filter(Boolean).map(normalize));
    return profiles
      .filter((profileItem) => {
        const nickname = normalize(profileItem.nickname);
        return nickname !== normalize(currentNickname) && !busyNicknames.has(nickname) && (!query || nickname.includes(query));
      })
      .slice(0, 5);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Составы</p>
          <h1>Команды</h1>
        </div>
        <button className="button secondary" type="button" onClick={resetForm}>
          <Plus size={16} /> Новая команда
        </button>
      </header>

      <section className="team-layout">
        <form className="panel team-builder" onSubmit={saveTeam}>
          <div className="panel-title">
            <UsersRound size={20} />
            <div>
              <h2>{editingTeamId ? "Редактировать команду" : "Создать команду"}</h2>
              <p className="muted">Сохранение идет в базу данных, состав не пропадет после сброса cookies</p>
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
            <CustomMemberSelect
              label="Капитан"
              value={captain}
              emptyLabel="Капитан не назначен"
              options={captainOptions}
              openKey="captain"
              activeKey={activeSelect}
              onOpen={setActiveSelect}
              onChange={setCaptain}
            />
          </div>

          <div className="slot-grid">
            {players.map((player, index) => (
              <CustomMemberSelect
                key={`player-${index}`}
                label={`Игрок ${index + 1}`}
                value={player}
                emptyLabel="Свободный слот"
                options={slotOptions(player)}
                openKey={`player-${index}`}
                activeKey={activeSelect}
                onOpen={setActiveSelect}
                onChange={(value) => updateRoster(index, value)}
              />
            ))}
            <CustomMemberSelect
              label="Тренер"
              value={coach}
              emptyLabel="Тренер не назначен"
              options={slotOptions(coach)}
              openKey="coach"
              activeKey={activeSelect}
              onOpen={setActiveSelect}
              onChange={setCoach}
            />
            {substitutes.map((player, index) => (
              <CustomMemberSelect
                key={`sub-${index}`}
                label={`Замена ${index + 1}`}
                value={player}
                emptyLabel="Свободная замена"
                options={slotOptions(player)}
                openKey={`sub-${index}`}
                activeKey={activeSelect}
                onOpen={setActiveSelect}
                onChange={(value) => updateSubstitute(index, value)}
              />
            ))}
          </div>

          <label>
            Цель команды
            <textarea value={goals} onChange={(event) => setGoals(event.target.value)} rows={3} />
          </label>

          <div className="builder-footer">
            <span>{filledSlots}/8 слотов заполнено</span>
            <button className="button primary" type="submit" disabled={isSaving}>
              <Plus size={16} /> {editingTeamId ? "Сохранить состав" : "Создать команду"}
            </button>
          </div>
        </form>

        <div className="team-list">
          <section className="team-search panel">
            <Search size={18} />
            <input placeholder="Поиск по названию, региону или игрокам" value={teamQuery} onChange={(event) => setTeamQuery(event.target.value)} />
            <input placeholder="Уровень, например Faceit 8" value={levelQuery} onChange={(event) => setLevelQuery(event.target.value)} />
          </section>

          {filteredTeams.map((team) => {
            const member = isMember(team);
            const captainAccess = normalize(team.captain) === normalize(currentNickname);
            const requestSent = hasJoinRequest(team);
            const suggestions = inviteSuggestions(team);
            const expanded = expandedTeamId === team.id;
            return (
              <article className="panel team-card" key={team.id}>
                <div className="team-card__head">
                  <div>
                    <h2>{team.name}</h2>
                    <p className="muted">{team.region} · капитан {team.captain}</p>
                  </div>
                  <span className="roster-count-badge">{team.members.length}/8</span>
                </div>

                <div className="team-brief">
                  <span>Участники<b>{team.members.length}/8</b></span>
                  <span>Средний уровень<b className={`faceit-level-text ${faceitLevelClass(team.level)}`}>{team.level}</b></span>
                  <span>Основа<b>{team.players.filter(Boolean).length}/5</b></span>
                </div>

                <p>{team.goals}</p>

                <div className="card-actions">
                  <button className="button secondary" type="button" onClick={() => setExpandedTeamId(expanded ? null : team.id)}>
                    <ChevronDown size={16} /> {expanded ? "Свернуть" : "Раскрыть"}
                  </button>
                  {captainAccess ? (
                    <>
                      <button className="button secondary" type="button" onClick={() => applyTeamToForm(team)}>
                        <Pencil size={16} /> Редактировать
                      </button>
                      <button className="button danger" type="button" onClick={() => deleteTeam(team)}>
                        <Trash2 size={16} /> Удалить
                      </button>
                    </>
                  ) : (
                    <span className="status">Редактирует капитан</span>
                  )}
                </div>

                {expanded && (
                  <div className="team-details">
                    <div className="roster-slots">
                      {team.players.map((player, index) => (
                        <span className={`roster-slot ${player ? "" : "empty"}`} key={`${team.id}-p-${index}`}>
                          <b>{index + 1}</b>{player || "Свободный слот"}
                        </span>
                      ))}
                      <span className={`roster-slot coach ${team.coach ? "" : "empty"}`}>
                        <ShieldCheck size={14} />{team.coach || "Тренер не назначен"}
                      </span>
                      {team.substitutes.map((player, index) => (
                        <span className={`roster-slot substitute ${player ? "" : "empty"}`} key={`${team.id}-s-${index}`}>
                          <UserPlus size={14} />{player || `Замена ${index + 1}`}
                        </span>
                      ))}
                    </div>

                    <div className="team-members">
                      <span className="right-label">Игроки в команде</span>
                      <div>
                        {team.members.map((memberName) => (
                          <span className="status" key={`${team.id}-member-${memberName}`}>{memberName}</span>
                        ))}
                      </div>
                    </div>

                    {captainAccess && (
                      <>
                        <div className="team-invite-row">
                          <input
                            placeholder="Никнейм для приглашения"
                            value={inviteInputs[team.id] ?? ""}
                            onChange={(event) => setInviteInputs((current) => ({ ...current, [team.id]: event.target.value }))}
                          />
                          <button className="button secondary" type="button" onClick={() => inviteToTeam(team)}>
                            <Send size={16} /> Пригласить
                          </button>
                        </div>

                        {suggestions.length > 0 && (
                          <div className="nickname-suggestions">
                            {suggestions.map((profileItem) => (
                              <button
                                type="button"
                                key={profileItem.id}
                                onClick={() => setInviteInputs((current) => ({ ...current, [team.id]: profileItem.nickname }))}
                              >
                                {profileItem.nickname}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {inviteStatus[team.id] && <p className="muted team-action-note">{inviteStatus[team.id]}</p>}

                    {team.pendingInvites.length > 0 && (
                      <div className="pending-invites">
                        {team.pendingInvites.map((invite) => (
                          <span className="status pending removable-status" key={`${team.id}-${invite}`}>
                            Инвайт: {invite}
                            {captainAccess && (
                              <button type="button" onClick={() => cancelInvite(team, invite)} title="Отменить инвайт">
                                <X size={12} />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {team.pendingRequests.length > 0 && (
                      <div className="pending-invites">
                        {team.pendingRequests.map((request) => (
                          <span className="status pending removable-status" key={`${team.id}-request-${request}`}>
                            Заявка: {request}
                            {captainAccess && (
                              <>
                                <button className="accept-action" type="button" onClick={() => acceptJoinRequest(team, request)} title="Принять заявку">
                                  <Check size={12} />
                                </button>
                                <button type="button" onClick={() => declineJoinRequest(team, request)} title="Отклонить заявку">
                                  <X size={12} />
                                </button>
                              </>
                            )}
                            {!captainAccess && normalize(request) === normalize(currentNickname) && (
                              <button type="button" onClick={() => cancelJoinRequest(team)} title="Отменить заявку">
                                <X size={12} />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="card-actions">
                      {member ? (
                        <button className="button danger" type="button" onClick={() => leaveTeam(team)}>
                          <LogOut size={16} /> Выйти из команды
                        </button>
                      ) : requestSent ? (
                        <button className="button secondary" type="button" onClick={() => cancelJoinRequest(team)}>
                          <X size={16} /> Отменить заявку
                        </button>
                      ) : (
                        <button className="button primary" type="button" onClick={() => requestToJoin(team)}>
                          <Send size={16} /> Оставить заявку
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
