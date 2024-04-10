const { Octokit } = require("@octokit/rest");
const sodium = require("libsodium-wrappers");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const GITHUB_ORG = process.env.GITHUB_ORG;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Define a list of default secrets provided by GitHub that you don't want to override
const DEFAULT_SECRETS = [
  "COLORTERM",
  "COMMAND_MODE",
  "GIT_ASKPASS",
  "HOME",
  "LANG",
  "LOGNAME",
  "MALLOCNANOZONE",
  "OLDPWD",
  "ORIGINAL_XDG_CURRENT_DESKTOP",
  "PATH",
  "PWD",
  "SHELL",
  "SHLVL",
  "SSH_AUTH_SOCK",
  "TERM",
  "TERM_PROGRAM",
  "TERM_PROGRAM_VERSION",
  "TMPDIR",
  "USER",
  "USER_ZDOTDIR",
  "VSCODE_GIT_ASKPASS_EXTRA_ARGS",
  "VSCODE_GIT_ASKPASS_MAIN",
  "VSCODE_GIT_ASKPASS_NODE",
  "VSCODE_GIT_IPC_HANDLE",
  "VSCODE_INJECTION",
  "XPC_FLAGS",
  "XPC_SERVICE_NAME",
  "ZDOTDIR",
  "_",
  "__CFBUNDLEIDENTIFIER",
  "__CF_USER_TEXT_ENCODING",
];

// Get all environment variables as secrets, excluding the default secrets
const arrSecrets = Object.entries(process.env).filter(
  ([key]) =>
    key !== "GITHUB_ORG" &&
    key !== "GITHUB_REPO" &&
    key !== "GITHUB_TOKEN" &&
    !DEFAULT_SECRETS.includes(key)
);

// Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

(async () => {
  const {
    data: { key, key_id },
  } = await octokit.actions.getRepoPublicKey({
    owner: GITHUB_ORG,
    repo: GITHUB_REPO,
  });

  // Loop through the key/value arrays
  arrSecrets.forEach(async ([secretKey, secretValue]) => {
    // Encrypt secret value
    await sodium.ready;
    const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
    const binsec = sodium.from_string(secretValue);
    const encBytes = sodium.crypto_box_seal(binsec, binkey);
    const secretValueEncrypted = sodium.to_base64(
      encBytes,
      sodium.base64_variants.ORIGINAL
    );

    // Set secret
    await octokit.request(
      `PUT /repos/${GITHUB_ORG}/${GITHUB_REPO}/actions/secrets/${secretKey}`,
      {
        owner: GITHUB_ORG,
        repo: GITHUB_REPO,
        secret_name: secretKey,
        encrypted_value: secretValueEncrypted,
        key_id: key_id,
      }
    );
  });
})();
