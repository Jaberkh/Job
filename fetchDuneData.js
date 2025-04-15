import Database from '@jlongster/sqlite';
import fetch from 'node-fetch';
import { execSync } from 'child_process';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_FILE = 'dune_data.db';
const DUNE_API_KEY = process.env.DUNE_API_KEY;

async function fetchAndSaveData() {
  const db = new Database(DB_FILE);

  db.exec(`
    CREATE TABLE IF NOT EXISTS peanut_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      all_time_peanut_count INTEGER,
      daily_peanut_count INTEGER,
      fid INTEGER,
      parent_fid INTEGER,
      rank INTEGER,
      sent_peanut_count INTEGER,
      total_peanut_count INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    const response = await fetch(`https://api.dune.com/api/v1/query/4837362/results?api_key=${DUNE_API_KEY}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const jsonData = await response.json();
    const rows = jsonData.result?.rows || [];
    if (rows.length === 0) return console.log("No data found.");

    const stmt = db.prepare(`
      INSERT INTO peanut_data (
        all_time_peanut_count,
        daily_peanut_count,
        fid,
        parent_fid,
        rank,
        sent_peanut_count,
        total_peanut_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insert = db.transaction((rows) => {
      for (const row of rows) {
        stmt.run([
          row.all_time_peanut_count ?? null,
          row.daily_peanut_count ?? null,
          row.fid ?? null,
          row.parent_fid ?? null,
          row.rank ?? null,
          row.sent_peanut_count ?? null,
          row.total_peanut_count ?? null
        ]);
      }
    });

    insert(rows);
    console.log(`Inserted ${rows.length} rows.`);
  } catch (err) {
    console.error("Fetch/save error:", err);
  }

  db.close();
}

function pushToGitHub() {
  try {
    if (!fs.existsSync(DB_FILE)) return;

    execSync("git config user.name 'railway-bot'");
    execSync("git config user.email 'railway@users.noreply.github.com'");
    execSync("git add dune_data.db");
    execSync(`git commit -m 'daily update: ${new Date().toISOString()}' || true`);
    execSync("git push");

    console.log("Git push done.");
  } catch (err) {
    console.error("Git push error:", err);
  }
}

(async () => {
  try {
    await fetchAndSaveData();
    pushToGitHub();
  } catch (err) {
    console.error("Fatal cron error:", err);
  }
})();
