import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import commands from "./commands.js";
import * as storage from "./storage.js";
import cron from "node-cron";

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
  switch (commandName) {
    case "wish": {
      await interaction.deferReply({ ephemeral: true });

      const userId = interaction.user.id;
      const username = interaction.user.username;

      storage.getBirthday(userId, (err, row) => {
        if (err) {
          return interaction.editReply({
            content: "Database error.",
            ephemeral: true,
          });
        }
        if (row) {
          return interaction.editReply({
            content:
              "You’ve already set your birthday—ask a mod to remove it if it’s wrong.",
            ephemeral: true,
          });
        }

        const day = interaction.options.getInteger("day");
        const monthName = interaction.options.getString("month");
        const month = monthArr.indexOf(monthName);
        const year = interaction.options.getInteger("year");

        storage.addBirthday(userId, username, day, month, year, (err) => {
          if (err) {
            return interaction.editReply({
              content: "Could not save your birthday.",
              ephemeral: true,
            });
          }

          interaction.editReply({
            content: `Your birthday is saved as **${day} ${monthName} ${year}**.`,
            ephemeral: true,
          });
        });
      });

      break;
    }

    case "remove": {
      await interaction.deferReply({ ephemeral: true });

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
          ephemeral: true,
        });
      }

      const targetUser = interaction.options.getUser("user");

      storage.deleteBirthday(targetUser.id, (err, changes) => {
        if (err) {
          return interaction.editReply({
            content: "Could not delete birthday. Try again later.",
            ephemeral: true,
          });
        }
        if (changes === 0) {
          return interaction.editReply({
            content: `No birthday found for <@${targetUser.id}>.`,
            ephemeral: true,
          });
        }
        interaction.editReply({
          content: `Removed birthday for <@${targetUser.id}>.`,
          ephemeral: true,
        });
      });

      break;
    }

    case "month": {
      await interaction.deferReply({ ephemeral: true });

      const inputMonth = interaction.options.getInteger("month");
      const monthIndex =
        inputMonth !== null ? inputMonth - 1 : new Date().getMonth();

      storage.listByMonth(monthIndex, (err, rows) => {
        if (err) {
          return interaction.editReply({
            content: "⚠️ Database error.",
            ephemeral: true,
          });
        }
        if (rows.length === 0) {
          return interaction.editReply({
            content: `No birthdays found for ${
              monthIndex + 1
            }/${new Date().getFullYear()}.`,
            ephemeral: true,
          });
        }

        const list = rows
          .map((r) => `• ${r.day}/${r.month + 1} — <@${r.user_id}>`)
          .join("\n");

        interaction.editReply({
          content: `🎂 Birthdays in month ${monthIndex + 1}:\n${list}`,
          ephemeral: true,
        });
      });

      break;
    }

    case "upcoming": {
      await interaction.deferReply({ ephemeral: true });

      storage.listUpcoming(7, (err, rows) => {
        if (err) {
          return interaction.editReply({
            content: "Database error.",
            ephemeral: true,
          });
        }
        if (rows.length === 0) {
          return interaction.editReply({
            content: "No birthdays upcoming in the next 7 days.",
            ephemeral: true,
          });
        }
        const list = rows
          .map((r) => `• ${r.day}/${r.month} — <@${r.user_id}>`)
          .join("\n");
        interaction.editReply({
          content: `Upcoming birthdays:\n${list}`,
          ephemeral: true,
        });
      });

      break;
    }
  }
});

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
