import bcrypt from "bcryptjs";
import { PlayerRole, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const players = [
  {
    email: "ludorolog@faceit.local",
    nickname: "ludorolog",
    faceitNickname: "ludorolog",
    avatarUrl: "https://distribution.faceit-cdn.net/images/db7b3eb0-b466-47cf-b3a3-a83b92de91ad.jpeg",
    role: PlayerRole.RIFLER,
    country: "Россия",
    memberSince: "6 июн. 2021 г.",
    elo: 1317,
    matches: 2358,
    winRate: 49,
    averageKd: 0.83,
    headshotRate: 57,
    recentForm: "W 16 / L 14",
    adr: 71,
    maps: "Dust 2, Mirage, Ancient",
    description: "Faceit profile scraped from public page. Russia, member since 6 Jun 2021. Recent 30 matches: 53% wins, K/D 0.83, HS 57%, ADR 71."
  },
  {
    email: "hushgh@faceit.local",
    nickname: "hushgh",
    faceitNickname: "hushgh",
    avatarUrl: "https://og-images.faceit-cdn.net/v1/players/hushgh/profile",
    role: PlayerRole.SUPPORT,
    country: "Россия",
    memberSince: "29 мая 2023 г.",
    elo: 501,
    matches: 19,
    winRate: 37,
    averageKd: 0.47,
    headshotRate: 47,
    recentForm: "W 6 / L 8",
    adr: 23.1,
    maps: "Dust 2, Mirage, Ancient",
    description: "Faceit profile scraped from public page. Russia, member since 29 May 2023. Recent 30 matches: 42% wins, K/D 0.47, HS 47%, ADR 23.1."
  },
  {
    email: "artamenos@faceit.local",
    nickname: "Artamenos",
    faceitNickname: "Artamenos",
    avatarUrl: "https://distribution.faceit-cdn.net/images/019aa512-95ac-465e-a433-6e0110d66bca.jpeg",
    role: PlayerRole.IGL,
    country: "Россия",
    memberSince: "11 мар. 2019 г.",
    elo: 2069,
    matches: 2620,
    winRate: 50,
    averageKd: 1.08,
    headshotRate: 44,
    recentForm: "W 19 / L 11",
    adr: 82.4,
    maps: "Dust 2, Mirage, Ancient",
    description: "Faceit profile scraped from public page. Russia, member since 11 Mar 2019. Recent 30 matches: 63% wins, K/D 1.08, HS 44%, ADR 82.4."
  },
  {
    email: "skvorets@faceit.local",
    nickname: "Skvorets",
    faceitNickname: "Skvorets",
    avatarUrl: "https://distribution.faceit-cdn.net/images/b14b04a6-bad5-41df-b197-6dd5c40a7c15.jpeg",
    role: PlayerRole.LURKER,
    country: "Россия",
    memberSince: "21 авг. 2020 г.",
    elo: 516,
    matches: 25,
    winRate: 20,
    averageKd: 0.64,
    headshotRate: 41,
    recentForm: "W 5 / L 19",
    adr: 56,
    maps: "Inferno, Mirage, Anubis",
    description: "Faceit profile scraped from public page. Russia, member since 21 Aug 2020. Recent 30 matches: 20% wins, K/D 0.64, HS 41%, ADR 56."
  },
  {
    email: "mraof@faceit.local",
    nickname: "MRAOF",
    faceitNickname: "MRAOF",
    avatarUrl: "https://assets.faceit-cdn.net/avatars/e97850e3-8fef-449d-8edd-49874349bbc7_1569612160419.jpg",
    role: PlayerRole.AWPER,
    country: "Россия",
    memberSince: "21 янв. 2018 г.",
    elo: 2174,
    matches: 3430,
    winRate: 50,
    averageKd: 0.75,
    headshotRate: 46,
    recentForm: "W 15 / L 15",
    adr: 70.3,
    maps: "Ancient, Mirage, Dust 2",
    description: "Faceit profile scraped from public page. Russia, member since 21 Jan 2018. Recent 30 matches: 50% wins, K/D 0.75, HS 46%, ADR 70.3."
  }
];

function levelFromElo(elo: number) {
  if (elo >= 2001) return 10;
  if (elo >= 1751) return 9;
  if (elo >= 1531) return 8;
  if (elo >= 1351) return 7;
  if (elo >= 1201) return 6;
  if (elo >= 1051) return 5;
  if (elo >= 901) return 4;
  if (elo >= 751) return 3;
  if (elo >= 501) return 2;
  return 1;
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const artamenosPasswordHash = await bcrypt.hash("12345", 10);

  for (const player of players) {
    const user = await prisma.user.upsert({
      where: { email: player.email },
      update: player.nickname === "Artamenos" ? { passwordHash: artamenosPasswordHash } : {},
      create: {
        email: player.email,
        passwordHash: player.nickname === "Artamenos" ? artamenosPasswordHash : passwordHash
      }
    });

    const level = levelFromElo(player.elo);
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        nickname: player.nickname,
        faceitNickname: player.faceitNickname,
        role: player.role,
        rank: `Faceit Level ${level}`,
        faceitLevel: level,
        hours: 0,
        maps: player.maps,
        languages: player.country,
        primeTime: "Не указано",
        hasMicrophone: true,
        description: `${player.description} FACEIT member since: ${player.memberSince}.`,
        avatarUrl: player.avatarUrl
      },
      create: {
        userId: user.id,
        nickname: player.nickname,
        faceitNickname: player.faceitNickname,
        role: player.role,
        rank: `Faceit Level ${level}`,
        faceitLevel: level,
        hours: 0,
        maps: player.maps,
        languages: player.country,
        primeTime: "Не указано",
        hasMicrophone: true,
        description: `${player.description} FACEIT member since: ${player.memberSince}.`,
        avatarUrl: player.avatarUrl
      }
    });

    await prisma.faceitStats.upsert({
      where: { profileId: profile.id },
      update: {
        nickname: player.nickname,
        level,
        elo: player.elo,
        matches: player.matches,
        winRate: player.winRate,
        averageKd: player.averageKd,
        headshotRate: player.headshotRate,
        recentForm: `${player.recentForm}; ADR ${player.adr}`,
        source: "FACEIT public profile page"
      },
      create: {
        profileId: profile.id,
        nickname: player.nickname,
        level,
        elo: player.elo,
        matches: player.matches,
        winRate: player.winRate,
        averageKd: player.averageKd,
        headshotRate: player.headshotRate,
        recentForm: `${player.recentForm}; ADR ${player.adr}`,
        source: "FACEIT public profile page"
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
