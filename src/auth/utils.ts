import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';

// Helper to get the project root directory reliably
function getProjectRoot(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // In build output (e.g., build/bundle.js), __dirname is .../build
  // Go up ONE level to get the project root
  const projectRoot = path.join(__dirname, ".."); // Corrected: Go up ONE level
  return path.resolve(projectRoot); // Ensure absolute path
}

// Returns the absolute path for the saved token file.
// Uses XDG Base Directory spec with fallback to home directory and legacy project root
export function getSecureTokenPath(): string {
  // Check for custom token path environment variable first
  const customTokenPath = process.env.GOOGLE_CALENDAR_MCP_TOKEN_PATH;
  if (customTokenPath) {
    return path.resolve(customTokenPath);
  }

  // Use XDG Base Directory spec or fallback to ~/.config
  const configHome = process.env.XDG_CONFIG_HOME || 
    path.join(os.homedir(), '.config');
  
  const tokenDir = path.join(configHome, 'google-calendar-mcp');
  return path.join(tokenDir, 'tokens.json');
}

// Returns the legacy token path for backward compatibility
export function getLegacyTokenPath(): string {
  const projectRoot = getProjectRoot();
  return path.join(projectRoot, ".gcp-saved-tokens.json");
}

// Returns the absolute path for the GCP OAuth keys file with priority:
// 1. Environment variable GOOGLE_OAUTH_CREDENTIALS (highest priority)
// 2. Default file path (lowest priority)
export function getKeysFilePath(): string {
  // Priority 1: Environment variable
  const envCredentialsPath = process.env.GOOGLE_OAUTH_CREDENTIALS;
  if (envCredentialsPath) {
    return path.resolve(envCredentialsPath);
  }
  
  // Priority 2: Default file path
  const projectRoot = getProjectRoot();
  const keysPath = path.join(projectRoot, "gcp-oauth.keys.json");
  return keysPath; // Already absolute from getProjectRoot
}

// Interface for OAuth credentials
export interface OAuthCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

// Generate helpful error message for missing credentials
export function generateCredentialsErrorMessage(): string {
  return `
OAuth credentials not found. Please provide credentials using one of these methods:

1. Direct environment variables (simplest - no JSON file needed!):
   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
   export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   export GOOGLE_CLIENT_SECRET="your-client-secret"

2. Credentials file via environment variable:
   Set GOOGLE_OAUTH_CREDENTIALS to the path of your credentials file:
   export GOOGLE_OAUTH_CREDENTIALS="/path/to/gcp-oauth.keys.json"

3. Default file path:
   Place your gcp-oauth.keys.json file in the package root directory.

Token storage:
- Tokens are saved to: ${getSecureTokenPath()}
- To use a custom token location, set GOOGLE_CALENDAR_MCP_TOKEN_PATH environment variable

To get OAuth credentials:
1. Go to the Google Cloud Console (https://console.cloud.google.com/)
2. Create or select a project
3. Enable these APIs:
   - Google Calendar API
   - Google People API
   - Gmail API
4. Create OAuth 2.0 credentials (Desktop app type)
5. Copy the Client ID and Client Secret
`.trim();
}