"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { HOLD, RUNDER } from "./quiz-data";
import { login, logud, pause, spil, spotifyAktiv, startSpotify } from "./spotify";

const HOLDFARVER = ["#FFB547", "#FF5CA8", "#5BF29B", "#5CC8FF", "#C9A2FF"];
const MEDALJER = ["#FFD54A", "#C9CED6", "#D08B5B"];
const KEY = "musikquiz-v2";

// Quizzen er én lineær række skærme: start → (intro → spørgsmål → stilling) pr. runde → vinder
type Skaerm =
  | { type: "start" }
  | { type: "intro"; r: number }
  | { type: "sp"; r: number; n: number; id: number }
  | { type: "stilling"; r: number }
  | { type: "vinder" };

const SKAERME: Skaerm[] = [{ type: "start" }];
RUNDER.forEach((runde, r) => {
  SKAERME.push({ type: "intro", r });
  runde.sange.forEach((_, n) => SKAERME.push({ type: "sp", r, n, id: r * 100 + n }));
  SKAERME.push({ type: "stilling", r });
});
SKAERME.push({ type: "vinder" });

// Rundetitler med designets særlige typografi; andre runder vises som almindelig tekst
const TITLER: Record<string, { node: ReactNode; size: number }> = {
  Filmmusik: { node: "Filmmusik", size: 180 },
  "Gæt sangen baglæns": { node: <>Gæt sangen <span className="spejl">baglæns</span></>, size: 160 },
  Kodesprog: { node: <>Kode<span className="monotitel">sprog</span></>, size: 180 },
  "Aarhus-gadenavne": { node: <>Aarhus-<br />gadenavne</>, size: 170 },
};

type State = {
  navne: string[];
  skaerm: number;
  vist: Record<number, boolean>;
  vindere: Record<number, number>;
};
const START: State = { navne: HOLD, skaerm: 0, vist: {}, vindere: {} };

const to = (n: number) => String(n).padStart(2, "0");
const tid = (sek: number) => `${Math.floor(sek / 60)}:${to(sek % 60)}`;
const svarStr = (len: number) => (len <= 10 ? 230 : len <= 14 ? 180 : len <= 20 ? 140 : 110);
const farve = (c: string) => ({ "--rc": c }) as CSSProperties;

function Equalizer({ seed, spiller }: { seed: number; spiller: boolean }) {
  return (
    <div className={`eq${spiller ? "" : " pause"}`}>
      {Array.from({ length: 14 }, (_, k) => (
        <span
          key={k}
          style={{
            height: 60 + ((k * 37 + seed * 13) % 140),
            animation: `mq-eq ${0.45 + ((k * 7 + seed) % 6) / 10}s ease-in-out ${((k * 3) % 7) / 10}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

export default function Quiz() {
  const [st, setSt] = useState<State>(START);
  const [hentet, setHentet] = useState(false);
  const [afspiller, setSpiller] = useState(false);
  const [sek, setSek] = useState(0);
  const [nu, setNu] = useState(""); // klippet der sidst blev startet
  // Tæller kun som afspilning, når skærmen selv har startet et klip – ellers kan en forsinket
  // besked fra Spotify få et nyt spørgsmål til at se ud som om det står på pause
  const spiller = afspiller && nu !== "";
  const [lydfejl, setLydfejl] = useState("");
  const lyd = useRef<HTMLAudioElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  // "nej" = ikke logget ind, "venter" = forbinder, "klar" = kan afspille
  const [spotify, setSpotify] = useState<"nej" | "venter" | "klar">("nej");

  useEffect(() => {
    if (!spotifyAktiv) return;
    startSpotify({ klar: () => setSpotify("klar"), spiller: setSpiller, fejl: setLydfejl }).then(
      (ok) => ok && setSpotify((s) => (s === "klar" ? s : "venter")),
      (e) => setLydfejl(e.message),
    );
  }, []);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (s?.navne?.length === HOLD.length && s.skaerm < SKAERME.length) setSt(s);
    } catch {}
    setHentet(true);
  }, []);

  useEffect(() => {
    if (!hentet) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch {}
  }, [st, hentet]);

  useEffect(() => {
    const skaler = () =>
      stage.current?.style.setProperty("--skala", String(Math.min(innerWidth / 1920, innerHeight / 1080)));
    skaler();
    addEventListener("resize", skaler);
    return () => removeEventListener("resize", skaler);
  }, []);

  useEffect(() => {
    if (!spiller) return;
    const t = setInterval(() => setSek((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [spiller]);

  const s = SKAERME[st.skaerm];
  const runde = "r" in s ? RUNDER[s.r] : null;
  const q = s.type === "sp" ? RUNDER[s.r].sange[s.n] : null;
  const qid = s.type === "sp" ? s.id : -1;
  const vist = !!st.vist[qid];
  // Klippet der hører til skærmen: spørgsmålets klip, eller originalen når svaret er vist
  const klipFor = (v: boolean) => {
    const svar = v && !!(q?.spotifySvar || q?.audioSvar);
    const sp = svar ? q?.spotifySvar : q?.spotify;
    const src = (svar ? q?.audioSvar : q?.audio) || "";
    return { svar, sp, start: svar ? q?.startSvar : q?.start, src, key: sp || src };
  };
  const klip = klipFor(vist);
  const svarklip = klip.svar;
  const harLyd = !!klip.key;
  const klipSpiller = spiller && nu === klip.key;

  const point = st.navne.map((_, h) => Object.values(st.vindere).filter((v) => v === h).length);
  const max = Math.max(...point);
  const orden = point.map((p, h) => ({ p, h })).sort((a, b) => b.p - a.p);
  const vinder = st.vindere[qid];

  function stop() {
    lyd.current?.pause();
    lyd.current?.removeAttribute("src");
    pause(true);
    setSek(0);
    setNu("");
    setLydfejl("");
  }

  // Starter klippet, eller pauser det hvis det allerede spiller (medmindre kunStart)
  function afspil(k = klip, kunStart = false) {
    if (!k.key) return;
    if (spiller && nu === k.key) {
      if (kunStart) return;
      lyd.current?.pause();
      pause();
      return;
    }
    if (k.sp) {
      lyd.current?.pause();
      spil(k.sp, k.start).catch((e) => setLydfejl(e.message));
    } else {
      pause();
      const a = lyd.current;
      if (!a) return;
      if (a.getAttribute("src") !== k.src) {
        a.src = k.src;
        a.currentTime = k.start ?? 0;
      }
      a.play().catch(() => {});
    }
    setNu(k.key);
  }

  function giv(h: number) {
    // Point gives først når svaret er vist; samme hold igen fortryder
    if (s.type !== "sp" || !vist) return;
    setSt((x) => {
      const vindere = { ...x.vindere };
      if (vindere[qid] === h) delete vindere[qid];
      else vindere[qid] = h;
      return { ...x, vindere };
    });
  }

  function skift(d: number) {
    const n = st.skaerm + d;
    if (n < 0 || n >= SKAERME.length) return;
    if (
      d > 0 &&
      s.type === "sp" &&
      vinder === undefined &&
      !confirm("Ingen har fået point for dette spørgsmål. Vil du gå videre alligevel?")
    )
      return;
    stop();
    setSt((x) => ({ ...x, skaerm: n }));
  }

  function vis() {
    // Musikken spiller videre, mens svaret vises (se dog originalen nedenfor)
    if (s.type !== "sp") return;
    setSt((x) => ({ ...x, vist: { ...x.vist, [qid]: !x.vist[qid] } }));
    // Har spørgsmålet en original (baglæns-runden), skifter musikken til den ved afsløring
    const original = klipFor(true);
    if (!vist && spiller && original.svar) afspil(original, true);
  }

  // Rigtigt gæt mens klippet er på pause: vis svaret og sæt musikken i gang igen
  function rigtigt() {
    if (s.type !== "sp") return;
    setSt((x) => ({ ...x, vist: { ...x.vist, [qid]: true } }));
    afspil(klipFor(true), true);
  }

  function forfra() {
    stop();
    setSt((x) => ({ ...x, skaerm: 0 }));
  }

  function nulstil() {
    if (!confirm("Nulstil alle point og start forfra?")) return;
    stop();
    setSt((x) => ({ ...START, navne: x.navne }));
  }

  const taster = useRef<(e: KeyboardEvent) => void>(() => {});
  taster.current = (e) => {
    if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return;
    if (e.key === "R") nulstil();
    else if (e.key === "ArrowRight") {
      // På et spørgsmål viser → først svaret; man kan ikke springe det over
      if (s.type === "sp" && !vist) vis();
      else skift(1);
    }
    else if (e.key === "ArrowLeft") skift(-1);
    else if (s.type !== "sp") {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        skift(1);
      }
    } else if (e.key >= "1" && e.key <= String(st.navne.length)) giv(+e.key - 1);
    else if (e.key === " " || e.key.toLowerCase() === "p") {
      e.preventDefault();
      afspil();
    } else if (e.key === "Enter") {
      e.preventDefault();
      vis();
    }
  };
  useEffect(() => {
    const f = (e: KeyboardEvent) => taster.current(e);
    document.addEventListener("keydown", f);
    return () => document.removeEventListener("keydown", f);
  }, []);

  let indhold: ReactNode;

  if (s.type === "start") {
    indhold = (
      <div className="skaerm start">
        <h1>
          Musik<em>quiz</em>
        </h1>
        <div className="gif">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://media.giphy.com/media/W8krmZSDxPIfm/giphy.gif" alt="Kat som DJ" />
        </div>
        <div className="holdinput">
          {st.navne.map((navn, h) => (
            <label key={h} className="mono" style={{ color: HOLDFARVER[h] }}>
              hold[{h}]
              <input
                value={navn}
                spellCheck={false}
                onChange={(e) =>
                  setSt((x) => ({ ...x, navne: x.navne.map((n, i) => (i === h ? e.target.value : n)) }))
                }
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              />
            </label>
          ))}
        </div>
        <div className="startrow">
          {spotifyAktiv && (
            <button className="spotify mono" onClick={spotify === "nej" ? login : logud}>
              {{ nej: "forbind spotify", venter: "forbinder…", klar: "spotify ✓" }[spotify]}
            </button>
          )}
          {lydfejl && <span className="fejl mono">{lydfejl}</span>}
          <div className="luft" />
          <button className="nulstil mono" onClick={nulstil}>
            nulstil point
          </button>
          <button className="startknap" onClick={() => skift(1)}>
            Start quiz ▶
          </button>
        </div>
      </div>
    );
  } else if (s.type === "intro" && runde) {
    const t = TITLER[runde.titel] ?? { node: runde.titel, size: 160 };
    indhold = (
      <div className="skaerm intro" style={farve(runde.farve)}>
        <div className="nr mono">{to(s.r + 1)}</div>
        <div className="tekst">
          <div className="top mono">
            runde {s.r + 1} af {RUNDER.length}
          </div>
          <h2 style={{ fontSize: t.size }}>{t.node}</h2>
          <div className="regel">{runde.regel}</div>
        </div>
      </div>
    );
  } else if (s.type === "sp" && runde && q) {
    indhold = (
      <div className={`skaerm sp${vist ? " vist" : ""}`} style={farve(runde.farve)}>
        <div className="topbar">
          <span className="rundepille mono">
            {to(s.r + 1)} · {runde.titel}
          </span>
          <div className="luft" />
          <span className="nr">
            Spørgsmål {s.n + 1} af {runde.sange.length}
          </span>
        </div>

        {vist ? (
          <div className="midte" style={{ gap: 28 }}>
            <div className="svar" style={{ fontSize: svarStr(q.svar.length) }}>
              {q.svar}
            </div>
            {q.meta && <div className="meta">{q.meta}</div>}
            <div className="fejl mono">{lydfejl}</div>
          </div>
        ) : (
          <div className="midte">
            <div className="afspiller">
              <Equalizer seed={1} spiller={spiller} />
              <div className="playwrap">
                <button className="play" onClick={() => afspil()}>
                  {spiller ? "❚❚" : "▶"}
                </button>
              </div>
              <Equalizer seed={5} spiller={spiller} />
            </div>
            <div className={`status mono${spiller ? " on" : ""}`}>
              {!harLyd
                ? "ingen lyd valgt til dette spørgsmål"
                : spiller
                  ? `♪ afspiller · ${tid(sek)}`
                  : nu === klip.key && sek > 0
                    ? `på pause · ${tid(sek)}`
                    : "tryk P for at afspille"}
            </div>
            {harLyd && !spiller && nu === klip.key && sek > 0 && (
              <div className="gaet">
                <button className="knap" onClick={() => afspil()}>
                  ✗ Forkert – spil videre
                </button>
                <button className="knap fyldt" onClick={rigtigt}>
                  ✓ Rigtigt – vis svar
                </button>
              </div>
            )}
            <div className="fejl mono">{lydfejl}</div>
          </div>
        )}

        {vist && <div className="hvem">Hvem fik pointet?</div>}
        {vist && (
          <div className="tavle">
            {st.navne.map((navn, h) => {
              const vandt = vinder === h;
                return (
                <div key={h} className={`kort${vandt ? " vandt" : ""}`} onClick={() => giv(h)}>
                  <span className="navn">{navn}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="svarrow">
          {vist && harLyd && (
            <button className="knap" onClick={() => afspil()}>
              {klipSpiller ? "❚❚" : "▶"} {svarklip ? "Spil originalen" : klipSpiller ? "Pause" : "Spil klippet"}
            </button>
          )}
          <div className="luft" />
          <button className="knap" onClick={() => skift(-1)}>
            ← Forrige
          </button>
          {vist ? (
            <>
              <button className="knap fyldt" onClick={() => skift(1)}>
                {s.n + 1 < runde.sange.length ? "Næste spørgsmål →" : "Se stillingen →"}
              </button>
            </>
          ) : (
            <button className="knap fyldt" onClick={vis}>
              Vis svar
            </button>
          )}
        </div>

      </div>
    );
  } else if (s.type === "stilling") {
    indhold = (
      <div className="skaerm stilling">
        <header>
          <h2>Stillingen</h2>
          <span className="mono">
            efter runde {s.r + 1} af {RUNDER.length}
          </span>
        </header>
        <div className="raekker">
          {orden.map(({ p, h }, i) => {
            // Guld, sølv og bronze til de tre første pladser; resten er neutrale
            const medalje = max > 0 ? MEDALJER[i] : undefined;
            return (
              <div key={h} className={`raekke${medalje ? " medalje" : ""}`} style={medalje ? farve(medalje) : undefined}>
                <span className="rang mono">#{i + 1}</span>
                <span className="navn">{st.navne[h]}</span>
                <div className="bar">
                  <i style={{ width: `${Math.round((p / Math.max(1, max)) * 100)}%` }} />
                </div>
                <span className="point mono">{p}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    // Ved pointlighed deler holdene sejren
    const vindere = orden.filter((o) => o.p === max);
    const navn = vindere.map((o) => st.navne[o.h]).join(" & ");
    indhold = (
      <div className="skaerm vinder">
        <div className="konfetti">
          {Array.from({ length: 70 }, (_, k) => (
            <span
              key={k}
              style={{
                left: (k * 137) % 1920,
                width: 14 + (k % 3) * 6,
                height: 26 - (k % 3) * 4,
                borderRadius: k % 4 === 0 ? 999 : 3,
                background: HOLDFARVER[k % 5],
                animation: `mq-fall ${4 + (k % 5)}s linear ${(k % 10) * 0.45}s infinite`,
              }}
            />
          ))}
        </div>
        <div className="krone">♛</div>
        <h2 style={{ fontSize: navn.length <= 16 ? 210 : navn.length <= 26 ? 150 : 100 }}>{navn}</h2>
        <div className="sum mono">{max} point</div>
        <div className="resten">
          {orden.slice(vindere.length).map(({ p, h }, i) => (
            <div key={h}>
              <span className="rang mono">#{vindere.length + i + 1}</span>
              {st.navne[h]}
              <span className="point mono">{p}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="viewport">
      <div className="stage" ref={stage} style={{ visibility: hentet ? "visible" : "hidden" }}>
        {indhold}
        {s.type !== "start" && (
          <button className="forfra mono" onClick={forfra}>
            ← forside
          </button>
        )}
      </div>
      <audio
        ref={lyd}
        onPlay={() => setSpiller(true)}
        onPause={() => setSpiller(false)}
        onError={(e) => {
          const a = e.currentTarget.getAttribute("src");
          if (a) setLydfejl(`Kunne ikke finde lydfilen: public${a}`);
        }}
      />
    </div>
  );
}
