import Database from 'better-sqlite3';
import fetch from 'node-fetch';
import { execSync } from 'child_process';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const DB_FILE = 'dune_data.db';
const DUNE_API_KEY = process.env.DUNE_API_KEY;

function createTableIfNotExists(db) {
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
}

async function fetchAndSaveData() {
  const db = new Database(DB_FILE);

  createTableIfNotExists(db);

  try {
    const response = await fetch(`https://api.dune.com/api/v1/query/4988636/results?api_key=${DUNE_API_KEY}`);
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
    const GIT_USER = 'Jaberkh';
    const GIT_REPO = 'Job';
    const GH_TOKEN = process.env.GH_TOKEN;  // توکن از متغیر محیطی گرفته می‌شود
    const GIT_REPO_URL = `https://${GIT_USER}:${GH_TOKEN}@github.com/${GIT_USER}/${GIT_REPO}.git`;

    try {
        // بررسی وجود فایل DB
        if (!fs.existsSync(DB_FILE)) {
            console.log("DB file not found, skipping Git push.");
            return;
        }

        // بررسی وجود پوشه git
        if (!fs.existsSync(".git")) {
            console.log("Git directory not found. Initializing Git repository...");
            execSync("git init");
            execSync("git branch -m main");  // تغییر نام branch به main
            execSync(`git remote add origin ${GIT_REPO_URL}`);  // اضافه کردن remote
        } else {
            console.log("Git directory found. Syncing with remote...");
            // همگام‌سازی با ریموت
            execSync("git fetch origin main");
            execSync("git pull origin main --rebase");  // همگام‌سازی و جلوگیری از ایجاد تاریخچه پیچیده
        }

        // تنظیمات گیت
        execSync("git config user.name 'Jaberkh'");
        execSync("git config user.email 'khodadadi.jaber@live.com'");

        // اضافه کردن فایل DB به staging area
        execSync("git add -f dune_data.db");  // -f برای اطمینان از اضافه کردن فایل حتی اگر .gitignore باشد

        // انجام commit (با پیامی شامل تاریخ و زمان)
        execSync(`git commit -m 'update dune_data.db' || true`);  // || true برای جلوگیری از ارور در صورت عدم تغییر

        // push به ریموت
        execSync("git push origin main");  // push به branch اصلی (main)

        console.log("✅ Git push done.");
    } catch (err) {
        console.error("❌ Git push error:", err);
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
