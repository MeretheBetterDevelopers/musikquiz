// Spotify-login (PKCE, uden client secret) og afspilning via Web Playback SDK.
// Kræver Spotify Premium og at siden åbnes på http://127.0.0.1:3000/.

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
const SCOPES = "streaming user-read-email user-read-private user-modify-playback-state";
const KEY = "musikquiz-spotify";
const VERIFIER = "musikquiz-spotify-verifier";

type Token = { access: string; refresh: string; udloeber: number };
type SpotifyPlayer = {
  connect(): Promise<boolean>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  activateElement(): Promise<void>;
  addListener(event: string, cb: (data: never) => void): void;
};
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: { Player: new (o: { name: string; getOAuthToken: (cb: (t: string) => void) => void }) => SpotifyPlayer };
  }
}

export const spotifyAktiv = CLIENT_ID !== "";
const redirectUri = () => `${location.origin}/`;

function laes(): Token | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}

async function hentToken(params: Record<string, string>) {
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...params }),
  });
  if (!r.ok) throw new Error(`Spotify-login fejlede (${r.status})`);
  const d = await r.json();
  const t: Token = {
    access: d.access_token,
    refresh: d.refresh_token ?? laes()?.refresh ?? "",
    udloeber: Date.now() + (d.expires_in - 60) * 1000,
  };
  localStorage.setItem(KEY, JSON.stringify(t));
  return t;
}

async function token() {
  let t = laes();
  if (!t) throw new Error("Ikke logget ind på Spotify");
  if (Date.now() > t.udloeber) t = await hentToken({ grant_type: "refresh_token", refresh_token: t.refresh });
  return t.access;
}

const b64 = (b: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export async function login() {
  const verifier = b64(crypto.getRandomValues(new Uint8Array(48)));
  sessionStorage.setItem(VERIFIER, verifier);
  const challenge = b64(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  location.href =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: redirectUri(),
      scope: SCOPES,
      code_challenge_method: "S256",
      code_challenge: challenge,
    });
}

export function logud() {
  localStorage.removeItem(KEY);
  location.reload();
}

let player: SpotifyPlayer | null = null;
let deviceId = "";
let aktuel = ""; // klippet der ligger på pause og kan fortsættes
let indlaest = false; // har vi sendt en sang til afspilleren? Ellers fejler pause()
let start: Promise<boolean> | null = null;

// Færdiggør et evt. login og starter afspilleren. Giver false hvis man ikke er logget ind.
export function startSpotify(on: { klar: () => void; spiller: (s: boolean) => void; fejl: (m: string) => void }) {
  start ??= (async () => {
    // Spotify accepterer kun 127.0.0.1 som redirect-adresse, ikke localhost
    if (location.hostname === "localhost") {
      location.replace(`http://127.0.0.1:${location.port}/`);
      return false;
    }
    const q = new URLSearchParams(location.search);
    const code = q.get("code");
    if (code || q.get("error")) history.replaceState(null, "", location.pathname);
    if (code) {
      await hentToken({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri(),
        code_verifier: sessionStorage.getItem(VERIFIER) ?? "",
      });
    }
    if (!laes()) return false;

    await new Promise<void>((ok) => {
      window.onSpotifyWebPlaybackSDKReady = ok;
      const s = document.createElement("script");
      s.src = "https://sdk.scdn.co/spotify-player.js";
      document.body.appendChild(s);
    });
    player = new window.Spotify!.Player({
      name: "Musikquiz",
      getOAuthToken: (cb) => token().then(cb, () => on.fejl("Spotify-login er udløbet – forbind igen")),
    });
    player.addListener("ready", (d: { device_id: string }) => {
      deviceId = d.device_id;
      on.klar();
    });
    player.addListener("player_state_changed", (s: { paused: boolean } | null) => on.spiller(!!s && !s.paused));
    for (const e of ["initialization_error", "authentication_error", "account_error", "playback_error"])
      player.addListener(e, (d: { message: string }) => on.fejl(`Spotify: ${d.message}`));
    await player.connect();
    return true;
  })();
  return start;
}

const trackUri = (link: string) => {
  const id = link.match(/track[/:]([A-Za-z0-9]+)/)?.[1];
  if (!id) throw new Error(`Ugyldigt Spotify-link: ${link}`);
  return `spotify:track:${id}`;
};

export async function spil(link: string, startSek = 0) {
  if (!player || !deviceId) throw new Error("Spotify er ikke forbundet endnu");
  player.activateElement();
  // Samme klip på pause: fortsæt hvor det slap i stedet for at starte forfra
  const klip = `${link}@${startSek}`;
  if (aktuel === klip) return player.resume();
  const r = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ uris: [trackUri(link)], position_ms: Math.round(startSek * 1000) }),
  });
  if (!r.ok) throw new Error(`Spotify kunne ikke afspille sangen (${r.status})`);
  indlaest = true;
  aktuel = klip;
}

// glem = true: næste afspilning starter forfra i stedet for at fortsætte
export const pause = (glem = false) => {
  if (glem) aktuel = "";
  if (indlaest) player?.pause().catch(() => {});
};
