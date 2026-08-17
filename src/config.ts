/**
 * Build-time configuration, read once so a missing variable surfaces as one clear
 * message rather than as a fetch to the string "undefined/latest".
 *
 * `VITE_` values are substituted into the bundle at build time, which means
 * `VITE_API_KEY` is readable by anyone who opens the deployed site. It raises the
 * bar against casual traffic and nothing more — see docs/REVIEW.md.
 */
const serverUrl = import.meta.env.VITE_SERVER_URL;

if (!serverUrl) {
  console.error(
    "VITE_SERVER_URL is not set. Set it and rebuild — the app cannot reach the API.",
  );
}

export const config = {
  /** Trailing slash trimmed so paths can be joined without doubling it. */
  serverUrl: (serverUrl ?? "").replace(/\/$/, ""),
  apiKey: import.meta.env.VITE_API_KEY,
} as const;

/** How long a request may run before it is abandoned. */
export const REQUEST_TIMEOUT_MS = 20_000;
