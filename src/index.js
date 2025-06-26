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

// client.on("interactionCreate", async (interaction) => {
//   if (!interaction.isCommand()) return;
//   const { commandName } = interaction;
//   switch (commandName) {
//     case "wish": {
//       await interaction.deferReply({
//         flags: EPHEMERAL_FLAG,
//       });

//       const userId = interaction.user.id;
//       const username = interaction.user.username;

//       storage.getBirthday(userId, (err, row) => {
//         if (err) {
//           return interaction.editReply({
//             content: "Database error.",
//             flags: EPHEMERAL_FLAG,
//           });
//         }
//         if (row) {
//           return interaction.editReply({
//             content:
//               "You’ve already set your birthday—ask a mod to remove it if it’s wrong.",
//             flags: EPHEMERAL_FLAG,
//           });
//         }

//         const day = interaction.options.getInteger("day");
//         const monthName = interaction.options.getString("month");
//         const month = monthArr.indexOf(monthName);
//         const year = interaction.options.getInteger("year");

//         storage.addBirthday(userId, username, day, month, year, (err) => {
//           if (err) {
//             return interaction.editReply({
//               content: "Could not save your birthday.",
//               flags: EPHEMERAL_FLAG,
//             });
//           }

//           interaction.editReply({
//             content: `Your birthday is saved as **${day} ${monthName} ${year}**.`,
//             flags: EPHEMERAL_FLAG,
//           });
//         });
//       });

//       break;
//     }

//     case "remove": {
//       await interaction.deferReply({
//         flags: EPHEMERAL_FLAG,
//       });

//       const member = interaction.member;
//       const modRole = process.env.BARISTA_ID;
//       const adminOne = process.env.MEOW_ID;
//       const adminTwo = process.env.NOM_ID;
//       if (
//         !(
//           member.roles.cache.has(modRole) ||
//           member.roles.cache.has(adminOne) ||
//           member.roles.cache.has(adminTwo)
//         )
//       ) {
//         return interaction.editReply({
//           content: "You need the Admin or Moderator role to do that.",
//           flags: EPHEMERAL_FLAG,
//         });
//       }

//       const targetUser = interaction.options.getUser("user");

//       storage.deleteBirthday(targetUser.id, (err, changes) => {
//         if (err) {
//           return interaction.editReply({
//             content: "Could not delete birthday. Try again later.",
//             flags: EPHEMERAL_FLAG,
//           });
//         }
//         if (changes === 0) {
//           return interaction.editReply({
//             content: `No birthday found for <@${targetUser.id}>.`,
//             flags: EPHEMERAL_FLAG,
//           });
//         }
//         interaction.editReply({
//           content: `Removed birthday for <@${targetUser.id}>.`,
//           flags: EPHEMERAL_FLAG,
//         });
//       });

//       break;
//     }

//     case "month": {
//       await interaction.deferReply({
//         flags: EPHEMERAL_FLAG,
//       });

//       const inputMonth = interaction.options.getInteger("month");
//       const monthIndex =
//         inputMonth !== null ? inputMonth - 1 : new Date().getMonth();

//       storage.listByMonth(monthIndex, (err, rows) => {
//         if (err) {
//           return interaction.editReply({
//             content: "⚠️ Database error.",
//             flags: EPHEMERAL_FLAG,
//           });
//         }
//         if (rows.length === 0) {
//           return interaction.editReply({
//             content: `No birthdays found for ${
//               monthIndex + 1
//             }/${new Date().getFullYear()}.`,
//             flags: EPHEMERAL_FLAG,
//           });
//         }

//         const list = rows
//           .map((r) => `• ${r.day}/${monthArr[r.month]} — <@${r.user_id}>`)
//           .join("\n");

//         interaction.editReply({
//           content: `🎂 Birthdays in month ${monthArr[monthIndex]}:\n${list}`,
//           flags: EPHEMERAL_FLAG,
//         });
//       });

//       break;
//     }

//     case "upcoming": {
//       await interaction.deferReply({
//         flags: EPHEMERAL_FLAG,
//       });

//       storage.listUpcoming(7, (err, rows) => {
//         if (err) {
//           return interaction.editReply({
//             content: "Database error.",
//             flags: EPHEMERAL_FLAG,
//           });
//         }
//         if (rows.length === 0) {
//           return interaction.editReply({
//             content: "No birthdays upcoming in the next 7 days.",
//             flags: EPHEMERAL_FLAG,
//           });
//         }
//         const list = rows
//           .map((r) => `• ${r.day}/${monthArr[r.month]} — <@${r.user_id}>`)
//           .join("\n");
//         interaction.editReply({
//           content: `Upcoming birthdays:\n${list}`,
//           flags: EPHEMERAL_FLAG,
//         });
//       });

//       break;
//     }
//   }
// });

client.login(process.env.BOT_TOKEN);

function fetchBirthdaysFor(day, monthIndex, cb) {
  storage.listByMonth(monthIndex, (err, rows) => {
    if (err) return cb(err);
    const matched = rows.filter((r) => r.day === day);
    cb(null, matched);
  });
}

cron.schedule(
  "0 0 * * *",
  () => {
    const now = new Date();
    const day = now.getDate();
    const monthIndex = now.getMonth();

    fetchBirthdaysFor(day, monthIndex, (err, list) => {
      if (err) return console.error("Cron DB error:", err);
      if (!list.length) return;

      list.forEach((r) => {
        client.users
          .fetch(r.user_id)
          .then((user) => {
            const birthdayMsg = `🐾 taptap... you there?

**Mrow~! Whisker here!**  
Reporting straight from the cozy corners of Cake au Café...

🎉 It’s your birthday! 🎂 That means extra sprinkles, warm café vibes,  
and a day full of your favorite things.  
May your year ahead be filled with soft sunlight, sweet surprises,  
and everything comforting — just like a perfect café morning.

Enjoy every moment. You’ve earned it. ☕🍰  
**Happy Birthday!** 🎈!`;

            return user.send(birthdayMsg);
          })
          .catch(console.error);
      });
    });
  },
  { timezone: "Asia/Kolkata" }
);

cron.schedule(
  "0 9 * * *",
  () => {
    const now = new Date();
    const day = now.getDate();
    const monthIndex = now.getMonth();
    const currentYear = now.getFullYear();

    fetchBirthdaysFor(day, monthIndex, (err, list) => {
      if (err) return console.error("Cron DB error:", err);
      if (!list.length) return;

      const channel = client.channels.cache.get(
        process.env.ANNOUNCE_CHANNEL_ID
      );
      if (!channel) return console.error("Invalid announce channel");

      list.forEach((r) => {
        const yearsOld = currentYear - r.year;
        const message = `🎉 It's birthday time! 🎂

Please join us in wishing <@${r.user_id}> a fantastic day as they turn **${yearsOld}** today!

May the year ahead be filled with joy, warmth, and plenty of cake. 🍰☕

— From everyone at **Cake au Café** 💫`;

        channel.send(message);
      });
    });
  },
  {
    timezone: "Asia/Kolkata",
  }
);

cron.schedule(
  "5 0 * * *",
  async () => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return console.error("Cleanup: guild not found");

    storage.listAll((err, rows) => {
      if (err) return console.error("Cleanup DB error:", err);

      rows.forEach((r) => {
        guild.members
          .fetch(r.user_id)
          .then(() => {})
          .catch((error) => {
            if (error.code === 10007) {
              storage.deleteBirthday(r.user_id, (err, changes) => {
                if (err) return console.error("Cleanup delete error:", err);
                if (changes)
                  console.log(
                    `Cleaned up birthday for departed user ${r.user_id}`
                  );
              });
            } else {
              console.error("Cleanup fetch error:", error);
            }
          });
      });
    });
  },
  {
    timezone: "Asia/Kolkata",
  }
);
