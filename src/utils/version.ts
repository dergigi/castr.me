/**
 * Get the current version and commit hash of the application
 * @returns An object containing the version and commit hash
 */
export function getVersionInfo(): { version: string; commitHash: string } {
  // Get version from package.json or environment variable
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';
  
  // Get commit hash from environment variable
  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || 'development';
  
  return {
    version,
    commitHash
  };
} 