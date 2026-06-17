export type PlayerRole = "RIFLER" | "AWPER" | "IGL" | "SUPPORT" | "LURKER";
export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export type User = {
  id: string;
  email: string;
};

export type FaceitStats = {
  id: string;
  nickname: string;
  level: number;
  elo: number;
  matches: number;
  winRate: number;
  averageKd: number;
  headshotRate: number;
  recentForm: string;
  source: string;
  updatedAt: string;
};

export type Profile = {
  id: string;
  userId: string;
  nickname: string;
  faceitNickname?: string | null;
  role: PlayerRole;
  rank: string;
  faceitLevel?: number | null;
  hours: number;
  maps: string;
  languages: string;
  primeTime: string;
  hasMicrophone: boolean;
  description: string;
  user?: User;
  faceitStats?: FaceitStats | null;
};

export type Invite = {
  id: string;
  message: string;
  status: InviteStatus;
  createdAt: string;
  sender?: User & { profile?: Profile | null };
  receiver?: User & { profile?: Profile | null };
};
