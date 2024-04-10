const { Octokit } = require("@octokit/rest");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const GITHUB_ORG = process.env.GITHUB_ORG;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

(async () => {
  try {
    // Get the list of secrets for the repository
    const { data: secrets } = await octokit.actions.listRepoSecrets({
      owner: GITHUB_ORG,
      repo: GITHUB_REPO,
    });

    // Loop through the secrets and delete each one
    for (const secret of secrets.secrets) {
      await octokit.actions.deleteRepoSecret({
        owner: GITHUB_ORG,
        repo: GITHUB_REPO,
        secret_name: secret.name,
      });
      console.log(`Deleted secret: ${secret.name}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
})();
