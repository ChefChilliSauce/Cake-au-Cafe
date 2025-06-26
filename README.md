# 🎂 Birthday Bot for Discord - V1

A fun and reliable Discord bot that tracks users' birthdays and sends celebratory messages in your server!  
Built with **Node.js**, **PostgreSQL**, and **Discord.js**.

---

## ✨ Features

- 🎉 Automated birthday announcements at **9 AM IST** (configurable timezone)
- 🗓️ Users can **register, view, update, or remove** their birthdays
- 🛡️ Duplicate prevention and update-safe logic
- 🌍 Timezone-aware cron jobs (default: `Asia/Kolkata`)
- 📦 PostgreSQL for persistent, scalable storage
- 🔐 Uses `.env` for secure environment configuration
- 🧩 Modular project structure for future upgrades

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database
- Discord bot token

---

### 🛠 Installation

1. **Clone the repository**
git clone https://github.com/yourusername/birthday-bot.git
cd birthday-bot

2. **Install dependencies**
npm install

3. **Create a .env file in the root directory**
BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN_ID
CLIENT_ID=YOUR_DISCORD_BOT_CLIENT_ID
GUILD_ID=YOUR_DISCORD_SERVER_ID
MOD_ID=YOUR_DISCORD_MODERATOR_ROLE_ID
ANNOUNCE_CHANNEL_ID=YOUR_DISCORD_ANNOUNCEMENT_CHANNEL_ID

4. **Start the bot**
npm start


### 💬 Bot Commands
| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `/birthday add`    | Register your birthday               |
| `/birthday view`   | View your registered birthday        |
| `/birthday update` | Update your birthday                 |
| `/birthday remove` | Remove your birthday from the system |

### 🧠 Project Structure
-index.js → Main entry point (bot login and setup)
-storage.js → PostgreSQL connection and query logic
-commands.js → All command handlers

### 🧪 Database Schema
CREATE TABLE IF NOT EXISTS birthdays (
  user_id    TEXT PRIMARY KEY,
  username   TEXT,
  day        INTEGER NOT NULL,
  month      INTEGER NOT NULL,
  year       INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

### ⏰ Cron Job: Birthday Announcements
Every day at 12 AM IST, the bot:
-Fetches birthdays for that day
-Sends a celebratory direct message to the celebrant

Every day at 9 AM IST, the bot:
-Fetches birthdays for that day
-Sends a celebratory message in the configured channel

Every day at 12:05 AM IST, the bot:
-Fetches birthdays of all users
-Deletes the birthday data from the database of the user who left the server

### 🧩 TODO / Upcoming Features
-[ ]Per-user timezone support
-[ ]Birthday countdown reminders
-[ ]Web dashboard (view/edit birthdays)
-[ ]Auto-assign birthday roles
-[ ]Monthly birthday leaderboard

### 🙌 Contributions
Found a bug? Want to add a feature?
Feel free to open an Issue or submit a Pull Request.
You can also join [@CafeSauce](https://discord.gg/XkX8DGbN5d) on Discord for quick feedback or collabs.

### 📄 License
This project is open source under the MIT License.
