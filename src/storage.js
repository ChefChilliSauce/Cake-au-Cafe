import sqlite3 from "sqlite3";
const db = new sqlite3.Database("./birthdays.sqlite");

db.run(`
  CREATE TABLE IF NOT EXISTS birthdays (
    user_id    TEXT PRIMARY KEY,
    username   TEXT,
    day        INTEGER,
    month      INTEGER,
    year       INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function getBirthday(userId, cb) {
  db.get("SELECT * FROM birthdays WHERE user_id = ?", [userId], (err, row) =>
    cb(err, row)
  );
}

export function addBirthday(userId, username, day, month, year, cb) {
  db.run(
    "INSERT INTO birthdays (user_id, username, day, month, year) VALUES (?, ?, ?, ?, ?)",
    [userId, username, day, month, year],
    (err) => cb(err)
  );
}

export function deleteBirthday(userId, cb) {
  db.run("DELETE FROM birthdays WHERE user_id = ?", [userId], function (err) {
    cb(err, this.changes);
  });
}

export function listByMonth(month, cb) {
  db.all("SELECT * FROM birthdays WHERE month = ?", [month], (err, rows) =>
    cb(err, rows)
  );
}

export function listUpcoming(daysAhead, cb) {
  db.all("SELECT * FROM birthdays", [], (err, rows) => {
    if (err) return cb(err);

    const today = new Date();
    const upcomingSet = new Set();
    for (let i = 0; i < daysAhead; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      upcomingSet.add(`${d.getMonth() + 1}-${d.getDate()}`);
    }

    const result = rows.filter((r) => upcomingSet.has(`${r.month}-${r.day}`));
    cb(null, result);
  });
}

export function listAll(cb) {
  db.all("SELECT * FROM birthdays", [], (err, rows) => cb(err, rows));
}
