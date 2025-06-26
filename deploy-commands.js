import "dotenv/config";
import commands from "./src/commands.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log(`⏳ Refreshing ${commands.length} commands…`);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("✅ Commands reloaded successfully.");
  } catch (err) {
    console.error("❌ Error reloading commands:", err);
  }
})();
