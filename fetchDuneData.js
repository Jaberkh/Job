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
  
      execSync("git config user.name 'Jaberkh'");
      execSync("git config user.email 'khodadadi.jaber@live.com'");
  
      execSync("git add -f dune_data.db");
      execSync(`git commit -m 'daily update: ${new Date().toISOString()}' || true`);
      execSync("git push -u origin main");
  
      console.log("✅ Git push done.");
    } catch (err) {
      console.error("❌ Git push error:", err);
    }
  }
  pushToGitHub();
