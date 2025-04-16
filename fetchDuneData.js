function pushToGitHub() {
  const GIT_USER = 'Jaberkh';
  const GIT_REPO = 'Job';
  const GH_TOKEN = process.env.GH_TOKEN;
  const GIT_REPO_URL = `https://${GIT_USER}:${GH_TOKEN}@github.com/${GIT_USER}/${GIT_REPO}.git`;

  try {
      if (!fs.existsSync(DB_FILE)) {
          console.log("DB file not found, skipping Git push.");
          return;
      }

      if (!fs.existsSync(".git")) {
          console.log("Git directory not found. Initializing Git repository...");
          execSync("git init");
          execSync("git branch -m main");
          execSync(`git remote add origin ${GIT_REPO_URL}`);
      }

      // افزودن فایل به staging
      execSync("git add -f dune_data.db");

      // بررسی اینکه چیزی برای کامیت وجود داره یا نه
      const status = execSync("git status --porcelain").toString().trim();
      if (status === "") {
          console.log("No changes to commit.");
          return;
      }

      // Commit و Push
      console.log("Committing dune_data.db...");
      execSync("git commit -m 'update dune_data.db'");
      console.log("Pushing to GitHub...");
      execSync("git push -u origin main");

      console.log("✅ Git push done.");
  } catch (err) {
      console.error("❌ Git push error:", err);
  }
}
