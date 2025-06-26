import pkg from "pg";
const { Pool } = pkg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.RAILWAY_POSTGRESQL_CONNECTION_URL ||
  process.env.RAILWAY_DATABASE_URL;

if (!connectionString) {
  console.error("🚨 No Postgres connection string found in env!");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS birthdays (
      user_id    TEXT PRIMARY KEY,
      username   TEXT,
      day        INTEGER NOT NULL,
      month      INTEGER NOT NULL,
      year       INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
})();

export async function getBirthday(userId) {
  const { rows } = await pool.query(
    "SELECT * FROM birthdays WHERE user_id = $1",
    [userId]
  );
  return rows[0] || null;
}

export async function addBirthday(userId, username, day, month, year) {
  await pool.query(
    `INSERT INTO birthdays(user_id, username, day, month, year)
     VALUES($1,$2,$3,$4,$5)
     ON CONFLICT(user_id) DO NOTHING`,
    [userId, username, day, month, year]
  );
}

export async function deleteBirthday(userId) {
  const res = await pool.query("DELETE FROM birthdays WHERE user_id = $1", [
    userId,
  ]);
  return res.rowCount;
}

export async function listByMonth(month) {
  const { rows } = await pool.query(
    "SELECT * FROM birthdays WHERE month = $1",
    [month]
  );
  return rows;
}

export async function listUpcoming(daysAhead) {
  const { rows } = await pool.query("SELECT * FROM birthdays");
  const today = new Date();
  const upcomingSet = new Set();
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    upcomingSet.add(`${d.getMonth()}-${d.getDate()}`);
  }
  return rows.filter((r) => upcomingSet.has(`${r.month}-${r.day}`));
}

export async function listAll() {
  const { rows } = await pool.query("SELECT * FROM birthdays");
  return rows;
}
