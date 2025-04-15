// index.js
import fetch from "node-fetch";
import sqlite3 from "sqlite3";
import { execSync } from "child_process";
import fs from "fs";

const DB_FILE = "dune_data.db";

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) console.error("DB connect error:", err);
    else console.log("DB connected.");
});

db.run(
    `CREATE TABLE IF NOT EXISTS peanut_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        all_time_peanut_count INTEGER,
        daily_peanut_count INTEGER,
        fid INTEGER,
        parent_fid INTEGER,
        rank INTEGER,
        sent_peanut_count INTEGER,
        total_peanut_count INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
);

async function fetchAndSaveData() {
    try {
        const response = await fetch("https://api.dune.com/api/v1/query/4837362/results?api_key=xTfUgOKOpG958K3MYFJ3ku9eGuP7wSVQ");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const jsonData = await response.json();
        const rows = jsonData.result?.rows || [];
        if (rows.length === 0) return console.log("No data found.");

        const stmt = db.prepare(
            `INSERT INTO peanut_data (
                all_time_peanut_count,
                daily_peanut_count,
                fid,
                parent_fid,
                rank,
                sent_peanut_count,
                total_peanut_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`
        );

        for (const row of rows) {
            stmt.run(
                row.all_time_peanut_count || null,
                row.daily_peanut_count || null,
                row.fid || null,
                row.parent_fid || null,
                row.rank || null,
                row.sent_peanut_count || null,
                row.total_peanut_count || null
            );
        }

        stmt.finalize();
        console.log(`Inserted ${rows.length} rows.`);
    } catch (err) {
        console.error("Fetch/save error:", err);
    }
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
    await fetchAndSaveData();
    pushToGitHub();
    db.close();
})();
