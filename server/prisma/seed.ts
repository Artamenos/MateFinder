import bcrypt from "bcryptjs";
import { PlayerRole, PrismaClient } from "@prisma/client";
import { loadFaceitStats } from "../src/services/faceit.js";

const prisma = new PrismaClient();

const players = [
  {
    email: "s1mple@example.com",
    nickname: "s1mple_vibes",
    faceitNickname: "s1mple",
    role: PlayerRole.AWPER,
    rank: "Global Elite",
    hours: 7200,
    maps: "Mirage, Nuke, Ancient",
    languages: "RU, EN",
    primeTime: "19:00-23:00 MSK",
    hasMicrophone: true,
    description: "Ищу стабильный стак для вечерних тренировок, играю AWP и могу коллить mid-round."
  },
  {
    email: "m0nesy@example.com",
    nickname: "m0nesy_style",
    faceitNickname: "m0nesy",
    role: PlayerRole.RIFLER,
    rank: "Supreme",
    hours: 4100,
    maps: "Inferno, Mirage, Dust2",
    languages: "RU",
    primeTime: "18:00-22:00 MSK",
    hasMicrophone: true,
    description: "Entry/rifler, люблю быстрые раунды, ищу тиммейтов для Faceit grind."
  },
  {
    email: "support@example.com",
    nickname: "flash_master",
    faceitNickname: "flashmaster",
    role: PlayerRole.SUPPORT,
    rank: "LEM",
    hours: 2600,
    maps: "Ancient, Anubis, Overpass",
    languages: "RU, EN",
    primeTime: "20:00-00:00 MSK",
    hasMicrophone: true,
    description: "Support player, знаю раскидки и люблю структурную командную игру."
  },
  {
    email: "ludorolog@faceit.local",
    nickname: "ludorolog",
    faceitNickname: "ludorolog",
    role: PlayerRole.RIFLER,
    rank: "Faceit profile",
    hours: 1800,
    maps: "Mirage, Ancient, Anubis",
    languages: "RU",
    primeTime: "19:00-23:00 MSK",
    hasMicrophone: true,
    description: "Imported Faceit profile. Rifler candidate for regular CS2 team games and practice matches."
  },
  {
    email: "hushgh@faceit.local",
    nickname: "hushgh",
    faceitNickname: "hushgh",
    role: PlayerRole.SUPPORT,
    rank: "Faceit profile",
    hours: 1600,
    maps: "Inferno, Nuke, Mirage",
    languages: "RU",
    primeTime: "20:00-00:00 MSK",
    hasMicrophone: true,
    description: "Imported Faceit profile. Support player focused on utility, trades and structured rounds."
  },
  {
    email: "artamenos@faceit.local",
    nickname: "Artamenos",
    faceitNickname: "Artamenos",
    role: PlayerRole.IGL,
    rank: "Faceit profile",
    hours: 2200,
    maps: "Mirage, Ancient, Nuke",
    languages: "RU",
    primeTime: "18:00-23:00 MSK",
    hasMicrophone: true,
    description: "Imported Faceit profile. Captain style player for team coordination and practice planning."
  },
  {
    email: "skvorets@faceit.local",
    nickname: "Skvorets",
    faceitNickname: "Skvorets",
    role: PlayerRole.LURKER,
    rank: "Faceit profile",
    hours: 2000,
    maps: "Anubis, Ancient, Inferno",
    languages: "RU",
    primeTime: "19:30-23:30 MSK",
    hasMicrophone: true,
    description: "Imported Faceit profile. Lurker candidate who can play late-round situations and map control."
  },
  {
    email: "mraof@faceit.local",
    nickname: "MRAOF",
    faceitNickname: "MRAOF",
    role: PlayerRole.AWPER,
    rank: "Faceit profile",
    hours: 2400,
    maps: "Dust2, Mirage, Nuke",
    languages: "RU",
    primeTime: "21:00-01:00 MSK",
    hasMicrophone: true,
    description: "Imported Faceit profile. AWPer candidate for evening stacks, praccs and team matchmaking."
  }
];

const admin = {
  email: "prikolist@matefinder.local",
  password: "12345",
  nickname: "Prikolist"
};

function profilePayload(player: (typeof players)[number], userId: string, faceitLevel: number) {
  return {
    userId,
    nickname: player.nickname,
    faceitNickname: player.faceitNickname,
    role: player.role,
    rank: player.rank,
    faceitLevel,
    hours: player.hours,
    maps: player.maps,
    languages: player.languages,
    primeTime: player.primeTime,
    hasMicrophone: player.hasMicrophone,
    description: player.description
  };
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const adminPasswordHash = await bcrypt.hash(admin.password, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: admin.email },
    update: {
      passwordHash: adminPasswordHash,
      isAdmin: true
    },
    create: {
      email: admin.email,
      passwordHash: adminPasswordHash,
      isAdmin: true
    }
  });

  await prisma.profile.upsert({
    where: { userId: adminUser.id },
    update: {
      nickname: admin.nickname,
      role: PlayerRole.IGL,
      rank: "Admin",
      faceitLevel: 10,
      hours: 0,
      maps: "Mirage, Ancient, Nuke",
      languages: "RU",
      primeTime: "19:00-23:00 MSK",
      hasMicrophone: true,
      description: "Администратор MateFinder. Управляет импортом Faceit-профилей и данными платформы."
    },
    create: {
      userId: adminUser.id,
      nickname: admin.nickname,
      role: PlayerRole.IGL,
      rank: "Admin",
      faceitLevel: 10,
      hours: 0,
      maps: "Mirage, Ancient, Nuke",
      languages: "RU",
      primeTime: "19:00-23:00 MSK",
      hasMicrophone: true,
      description: "Администратор MateFinder. Управляет импортом Faceit-профилей и данными платформы."
    }
  });

  for (const player of players) {
    const user = await prisma.user.upsert({
      where: { email: player.email },
      update: {},
      create: {
        email: player.email,
        passwordHash
      }
    });

    const stats = await loadFaceitStats(player.faceitNickname);

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: profilePayload(player, user.id, stats.level),
      create: profilePayload(player, user.id, stats.level)
    });

    await prisma.faceitStats.upsert({
      where: { profileId: profile.id },
      update: stats,
      create: {
        ...stats,
        profileId: profile.id
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
