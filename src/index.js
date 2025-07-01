import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import commands from "./commands.js";
import * as storage from "./storage.js";
import cron from "node-cron";

import express from "express";

const app = express();
app.get("/", (_req, res) => res.send("OK"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webserver listening on ${PORT}`));

const EPHEMERAL_FLAG = 1 << 6;

const monthArr = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  try {
    await interaction.deferReply({ flags: EPHEMERAL_FLAG });

    switch (commandName) {
      case "wish": {
        const userId = interaction.user.id;
        const username = interaction.user.username;

        const existing = await storage.getBirthday(userId);
        if (existing) {
          return interaction.editReply({
            content:
              "You’ve already set your birthday—ask a mod to remove it if it’s wrong.",
            flags: EPHEMERAL_FLAG,
          });
        }

        const day = interaction.options.getInteger("day");
        const monthName = interaction.options.getString("month");
        const year = interaction.options.getInteger("year");
        const month = monthArr.indexOf(monthName);

        await storage.addBirthday(userId, username, day, month, year);

        return interaction.editReply({
          content: `Your birthday is saved as **${day} ${monthName} ${year}**.`,
          flags: EPHEMERAL_FLAG,
        });
      }

      case "remove": {
        const member = interaction.member;
        const modRole = process.env.BARISTA_ID;
        const adminOne = process.env.MEOW_ID;
        const adminTwo = process.env.NOM_ID;

        if (
          !(
            member.roles.cache.has(modRole) ||
            member.roles.cache.has(adminOne) ||
            member.roles.cache.has(adminTwo)
          )
        ) {
          return interaction.editReply({
            content: "You need the Admin or Moderator role to do that.",
            flags: EPHEMERAL_FLAG,
          });
        }

        const targetUser = interaction.options.getUser("user");
        const changes = await storage.deleteBirthday(targetUser.id);

        if (changes === 0) {
          return interaction.editReply({
            content: `No birthday found for <@${targetUser.id}>.`,
            flags: EPHEMERAL_FLAG,
          });
        }

        return interaction.editReply({
          content: `Removed birthday for <@${targetUser.id}>.`,
          flags: EPHEMERAL_FLAG,
        });
      }

      case "month": {
        const inputMonth = interaction.options.getInteger("month");
        const monthIndex =
          inputMonth !== null ? inputMonth - 1 : new Date().getMonth();

        const rows = await storage.listByMonth(monthIndex);

        if (rows.length === 0) {
          return interaction.editReply({
            content: `No birthdays found for ${monthArr[monthIndex]}.`,
            flags: EPHEMERAL_FLAG,
          });
        }

        const list = rows
          .map((r) => `• ${r.day}/${monthArr[r.month]} — <@${r.user_id}>`)
          .join("\n");

        return interaction.editReply({
          content: `🎂 Birthdays in ${monthArr[monthIndex]}:\n${list}`,
          flags: EPHEMERAL_FLAG,
        });
      }

      case "upcoming": {
        const rows = await storage.listUpcoming(7);

        if (rows.length === 0) {
          return interaction.editReply({
            content: "No birthdays upcoming in the next 7 days.",
            flags: EPHEMERAL_FLAG,
          });
        }

        const list = rows
          .map((r) => `• ${r.day}/${monthArr[r.month]} — <@${r.user_id}>`)
          .join("\n");

        return interaction.editReply({
          content: `🎉 Upcoming birthdays:\n${list}`,
          flags: EPHEMERAL_FLAG,
        });
      }

      default:
        return interaction.editReply({
          content: "❓ Unknown command.",
          flags: EPHEMERAL_FLAG,
        });
    }
  } catch (err) {
    console.error(`⚠️ Error handling command "${commandName}":`, err);
    return interaction.editReply({
      content: "Something went wrong. Please try again later.",
      flags: EPHEMERAL_FLAG,
    });
  }
});

client.login(process.env.BOT_TOKEN);

async function fetchBirthdaysFor(day, monthIndex) {
  const rows = await storage.listByMonth(monthIndex);
  return rows.filter((r) => r.day === day);
}

// Midnight DMs
cron.schedule(
  "50 10 * * *",
  async () => {
    const now = new Date();
    const day = now.getDate();
    const monthIndex = now.getMonth();

    try {
      const list = await fetchBirthdaysFor(day, monthIndex);
      if (list.length === 0) return;

      for (const r of list) {
        const user = await client.users.fetch(r.user_id);
        const msg = `🐾 taptap... you there?


**Mrow~! Whisker here!**  
Reporting straight from the cozy corners of Cake au Café...

🎉 It’s your birthday! 🎂 That means extra sprinkles, warm café vibes,  
and a day full of your favorite things.  
May your year ahead be filled with soft sunlight, sweet surprises,  
and everything comforting — just like a perfect café morning.

Enjoy every moment. You’ve earned it. ☕🍰  
**Happy Birthday!** 🎈!`;

        await user.send(msg);
      }
    } catch (err) {
      console.error("Cron error:", err);
    }
  },
  { timezone: "Asia/Kolkata" }
);

// 9 AM summary of yesterday’s birthdays
cron.schedule(
  "50 10 * * *",
  async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const day = yesterday.getDate();
    const monthIndex = yesterday.getMonth();
    const currentYear = yesterday.getFullYear();

    try {
      // fetch all entries for that month, then filter by day
      const rows = await storage.listByMonth(monthIndex);
      const list = rows.filter((r) => r.day === day);
      if (!list.length) return;

      const channel = client.channels.cache.get(
        process.env.ANNOUNCE_CHANNEL_ID
      );
      if (!channel) throw new Error("Invalid announce channel");

      for (const r of list) {
        const yearsOld = currentYear - r.year;
        const message = `🎉 It's birthday time! 🎂

Please join us in wishing <@${r.user_id}> a fantastic day as they turn **${yearsOld}** today!

May the year ahead be filled with joy, warmth, and plenty of cake. 🍰☕

— From everyone at **Cake au Café** 💫`;

        await channel.send(message);
      }
    } catch (err) {
      console.error("9 AM Cron error:", err);
    }
  },
  { timezone: "Asia/Kolkata" }
);

// Daily cleanup of departed users at 00:05
cron.schedule(
  "5 0 * * *",
  async () => {
    try {
      const guild = await client.guilds.fetch(process.env.GUILD_ID);
      const rows = await storage.listAll();
      for (const r of rows) {
        try {
          await guild.members.fetch(r.user_id);
        } catch (error) {
          if (error.code === 10007) {
            const changes = await storage.deleteBirthday(r.user_id);
            if (changes) {
              console.log(`Cleaned up birthday for departed user ${r.user_id}`);
            }
          } else {
            console.error("Cleanup fetch error:", error);
          }
        }
      }
    } catch (err) {
      console.error("Cleanup Cron error:", err);
    }
  },
  { timezone: "Asia/Kolkata" }
);
