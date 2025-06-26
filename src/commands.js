import { SlashCommandBuilder } from "@discordjs/builders";

const wishCommand = new SlashCommandBuilder()
  .setName("wish")
  .setDescription("set your birthday")
  .addIntegerOption((option) =>
    option
      .setName("day")
      .setDescription("Day of the month (1–31)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(31)
  )
  .addStringOption((option) =>
    option
      .setName("month")
      .setDescription("Your birth month")
      .setRequired(true)
      .addChoices(
        { name: "January", value: "January" },
        { name: "February", value: "February" },
        { name: "March", value: "March" },
        { name: "April", value: "April" },
        { name: "May", value: "May" },
        { name: "June", value: "June" },
        { name: "July", value: "July" },
        { name: "August", value: "August" },
        { name: "September", value: "September" },
        { name: "October", value: "October" },
        { name: "November", value: "November" },
        { name: "December", value: "December" }
      )
  )
  .addIntegerOption((option) =>
    option
      .setName("year")
      .setDescription("Your birth year (e.g. 1997)")
      .setRequired(true)
      .setMinValue(1900)
      .setMaxValue(new Date().getFullYear())
  );

const removeDateCommand = new SlashCommandBuilder()
  .setName("remove")
  .setDescription("Remove a user's birthday entry")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user whose birthday to remove")
      .setRequired(true)
  );

const monthCommand = new SlashCommandBuilder()
  .setName("month")
  .setDescription(
    "List birthdays in the specified month (defaults to current month)"
  )
  .addIntegerOption((option) =>
    option
      .setName("month")
      .setDescription("Month number (1–12)")
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(12)
  );

const upcomingCommand = new SlashCommandBuilder()
  .setName("upcoming")
  .setDescription("List all birthdays in the next 7 days");

const commands = [
  wishCommand.toJSON(),
  removeDateCommand.toJSON(),
  monthCommand.toJSON(),
  upcomingCommand.toJSON(),
];

export default commands;
