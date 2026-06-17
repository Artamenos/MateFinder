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

function hashNickname(nickname: string) {
  return nickname.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
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
