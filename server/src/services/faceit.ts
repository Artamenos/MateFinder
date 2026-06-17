export type FaceitSnapshot = {
  nickname: string;
  level: number;
  elo: number;
  matches: number;
  winRate: number;
  averageKd: number;
  headshotRate: number;
  recentForm: string;
  source: string;
};

type FaceitPlayerResponse = {
  player_id: string;
  nickname: string;
  avatar?: string;
  country?: string;
  games?: {
    cs2?: {
      faceit_elo?: number;
      skill_level?: number;
      region?: string;
    };
    csgo?: {
      faceit_elo?: number;
      skill_level?: number;
      region?: string;
    };
  };
};

type FaceitStatsResponse = {
  lifetime?: Record<string, string>;
};

export type ImportedFaceitProfile = {
  playerId: string;
  nickname: string;
  avatar?: string;
  country?: string;
  region?: string;
  stats: FaceitSnapshot;
};

function hashNickname(nickname: string) {
  return nickname.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function numberFromLifetime(lifetime: Record<string, string> | undefined, keys: string[], fallback: number) {
  if (!lifetime) return fallback;

  for (const key of keys) {
    const raw = lifetime[key];
    if (!raw) continue;

    const value = Number(String(raw).replace("%", "").replace(",", "."));
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return fallback;
}

export function extractFaceitNickname(input: string) {
  const value = input.trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const playersIndex = url.pathname.split("/").findIndex((part) => part.toLowerCase() === "players");
    if (playersIndex >= 0) {
      return decodeURIComponent(url.pathname.split("/")[playersIndex + 1] ?? "").trim();
    }
  } catch {
    // Not a URL, treat as nickname.
  }

  return value.replace(/^@/, "").trim();
}

async function faceitFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.FACEIT_API_KEY;

  if (!apiKey) {
    throw new Error("Не настроен FACEIT_API_KEY. Добавьте ключ Faceit Data API в server/.env и перезапустите backend.");
  }

  const response = await fetch(`https://open.faceit.com/data/v4${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Faceit API error ${response.status}: ${details || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function loadOfficialFaceitProfile(input: string): Promise<ImportedFaceitProfile> {
  const nickname = extractFaceitNickname(input);
  if (!nickname) {
    throw new Error("Faceit nickname is empty");
  }

  const player = await faceitFetch<FaceitPlayerResponse>(`/players?nickname=${encodeURIComponent(nickname)}&game=cs2`);
  const statsResponse = await faceitFetch<FaceitStatsResponse>(`/players/${player.player_id}/stats/cs2`);
  const cs2 = player.games?.cs2 ?? player.games?.csgo;
  const lifetime = statsResponse.lifetime;

  const matches = numberFromLifetime(lifetime, ["Matches"], 0);
  const winRate = numberFromLifetime(lifetime, ["Win Rate %", "Win Rate"], 0);
  const averageKd = numberFromLifetime(lifetime, ["Average K/D Ratio", "K/D Ratio"], 0);
  const headshotRate = numberFromLifetime(lifetime, ["Average Headshots %", "Headshots %"], 0);
  const wins = numberFromLifetime(lifetime, ["Wins"], 0);
  const recentForm = wins && matches ? `${wins} wins / ${matches} matches` : "No lifetime form data";

  return {
    playerId: player.player_id,
    nickname: player.nickname,
    avatar: player.avatar,
    country: player.country,
    region: cs2?.region,
    stats: {
      nickname: player.nickname,
      level: cs2?.skill_level ?? 1,
      elo: cs2?.faceit_elo ?? 0,
      matches,
      winRate,
      averageKd,
      headshotRate,
      recentForm,
      source: "Official Faceit Data API"
    }
  };
}

export async function loadFaceitStats(nickname: string): Promise<FaceitSnapshot> {
  const normalized = nickname.trim();
  const hash = hashNickname(normalized.toLowerCase());
  const level = Math.max(1, Math.min(10, (hash % 10) + 1));
  const elo = 500 + level * 175 + (hash % 120);
  const matches = 80 + (hash % 900);
  const winRate = 45 + (hash % 16);
  const averageKd = Number((0.85 + (hash % 70) / 100).toFixed(2));
  const headshotRate = 35 + (hash % 24);
  const forms = ["W-W-L-W-W", "L-W-W-W-L", "W-L-W-L-W", "W-W-W-L-W"];

  return {
    nickname: normalized,
    level,
    elo,
    matches,
    winRate,
    averageKd,
    headshotRate,
    recentForm: forms[hash % forms.length],
    source: "Mock Faceit parser"
  };
}
