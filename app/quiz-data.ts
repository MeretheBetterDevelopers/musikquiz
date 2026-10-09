// Ret hold og sange her.
// svar:        det der vises stort når svaret afsløres
// meta:        linjen under svaret (kunstner, sang, årstal …)
// spotify:     Spotify-link til sangen der afspilles som spørgsmål
//              (højreklik på sangen i Spotify → Del → Kopiér link til sang)
// start:       hvor mange sekunder inde i sangen afspilningen starter (virker også for lydfiler)
// spotifySvar: Spotify-link der afspilles når svaret er vist, med startSvar som starttid
// audio:       lydfil i public/lyd i stedet for Spotify (bruges til baglæns-klippene)
// audioSvar:   lydfil der afspilles når svaret er vist
// Er både Spotify-link og lydfil udfyldt, bruges Spotify.
export type Sang = {
  svar: string;
  meta?: string;
  spotify?: string;
  start?: number;
  spotifySvar?: string;
  startSvar?: number;
  audio?: string;
  audioSvar?: string;
};
export type Runde = {
  titel: string;
  regel: string;
  farve: string;
  ikon: string;
  sange: Sang[];
};

export const HOLD = [
  "Merge Konflikten",
  "Null Pointers",
  "Stack Overfloden",
  "Git Gud",
  "Tabs > Spaces",
];

export const RUNDER: Runde[] = [
  {
    titel: "Filmmusik",
    regel: "Hør temaet – lav jeres lyd, og gæt filmen.",
    farve: "#FFB547",
    ikon: "[ ▶ ]",
    sange: [
      {
        svar: "Star Wars",
        meta: "John Williams · 1977",
        spotify: "https://open.spotify.com/track/7a9UUo3zfID7Ik2fTQjRLi",
        start: 0,
      },
      {
        svar: "Harry Potter",
        meta: "John Williams · 2001",
        spotify: "https://open.spotify.com/track/1n8NKQRg8LVHy7oUhUgbFF",
        start: 0,
      },
      {
        svar: "Pirates of the Caribbean",
        meta: "Klaus Badelt & Hans Zimmer · 2003",
        spotify: "https://open.spotify.com/track/4AD2dterIUjNt1LFNI9Bvi",
        start: 0,
      },
      {
        svar: "Olsen Banden",
        meta: "Bent Fabricius-Bjerre · 1968",
        spotify: "https://open.spotify.com/track/6Ab2qzSyYdrcEzKtPa7dg2",
        start: 0,
      },
    ],
  },
  {
    titel: "Gæt sangen baglæns",
    regel: "Sangen spilles baglæns – lav jeres lyd, og gæt sangen.",
    farve: "#FF5CA8",
    ikon: "[ ◀◀ ]",
    sange: [
      {
        svar: "Lose Yourself",
        meta: "Eminem",
        audio: "/lyd/b1.mp3",
        start: 20,
        spotifySvar: "https://open.spotify.com/track/5Z01UMMf7V1o0MzF86s6WJ",
        startSvar: 98,
      },
      {
        svar: "Old Town Road",
        meta: "Lil Nas X feat. Billy Ray Cyrus",
        audio: "/lyd/b2.mp3",
        start: 60,
        spotifySvar: "https://open.spotify.com/track/2YpeDb67231RjR0MgVLzsG",
        startSvar: 11,
      },
      {
        svar: "Hey Brother",
        meta: "Avicii",
        audio: "/lyd/b3.mp3",
        start: 60,
        spotifySvar: "https://open.spotify.com/track/4lhqb6JvbHId48OUJGwymk",
        startSvar: 50,
      },
      {
        svar: "Bohemian Rhapsody",
        meta: "Queen",
        audio: "/lyd/b4.mp3",
        start: 30,
        spotifySvar: "https://open.spotify.com/track/2JiDi0qAXsPwhPqA2qaKGt",
        startSvar: 54,
      },
      {
        svar: "The Bad Touch",
        meta: "Bloodhound Gang",
        audio: "/lyd/b5.mp3",
        start: 87,
        spotifySvar: "https://open.spotify.com/track/5EYdTPdJD74r9EVZBztqGG",
        startSvar: 72,
      },
    ],
  },
  {
    titel: "Aarhus-gadenavne",
    regel: "Sangen gemmer på et gadenavn – lav jeres lyd, og gæt gaden.",
    farve: "#5CC8FF",
    ikon: "[ 8000 ]",
    sange: [
      {
        svar: "Tordenskjoldsgade",
        meta: "Thunderstruck – AC/DC",
        spotify: "https://open.spotify.com/track/57bgtoPSgt236HzfBOd8kj",
        start: 0,
      },
      {
        svar: "Paradisgade",
        meta: "Paradise – Coldplay",
        spotify: "https://open.spotify.com/track/6nek1Nin9q48AVZcWs9e9D",
        start: 0,
      },
      {
        svar: "Rosensgade / Rosenkrantzgade",
        meta: "Kiss from a Rose – Seal",
        spotify: "https://open.spotify.com/track/3YKptz29AsOlm7WAVnztBh",
        start: 0,
      },
      {
        svar: "M.P. Bruuns Gade",
        meta: "Uptown Funk – Mark Ronson feat. Bruno Mars",
        spotify: "https://open.spotify.com/track/32OlwWuMpZ6b0aN2RZOeMS",
        start: 0,
      },
      {
        svar: "Grønnegade",
        meta: "American Idiot – Green Day",
        spotify: "https://open.spotify.com/track/6nTiIhLmQ3FWhvrGafw2zj",
        start: 0,
      },
      {
        svar: "Langelandsgade",
        meta: "Langebro – Gasolin'",
        spotify: "https://open.spotify.com/track/0RzhNfAvAjWGVpjGqPQ9yF",
        start: 0,
      },
      {
        svar: "Telefontorvet / Telefonsmøgen",
        meta: "Call Me Maybe – Carly Rae Jepsen",
        spotify: "https://open.spotify.com/track/20I6sIOMTCkB6w7ryavxtO",
        start: 0,
      },
      {
        svar: "Ringgaden",
        meta: "Single Ladies (Put a Ring on It) – Beyoncé",
        spotify: "https://open.spotify.com/track/5R9a4t5t5O0IsznsrKPVro",
        start: 0,
      },
    ],
  },
  {
    titel: "Kodesprog",
    regel: "Sangen gemmer på et sprog eller framework – lav jeres lyd, og gæt det.",
    farve: "#5BF29B",
    ikon: "{ </> }",
    sange: [
      {
        svar: "Python",
        meta: "Anaconda – Nicki Minaj",
        spotify: "https://open.spotify.com/track/5eqiMMbaeUZ32Q7sS00H35",
        start: 0,
      },
      {
        svar: "Ruby",
        meta: "Ruby – Kaiser Chiefs",
        spotify: "https://open.spotify.com/track/2sgBTNHz9ckmqj3rx3ez4M",
        start: 0,
      },
      {
        svar: "Swift",
        meta: "Shake It Off – Taylor Swift",
        spotify: "https://open.spotify.com/track/0cqRj7pUJDkTCEsJkx8snD",
        start: 0,
      },
      {
        svar: "Go",
        meta: "Wake Me Up Before You Go-Go – Wham!",
        spotify: "https://open.spotify.com/track/0ikz6tENMONtK6qGkOrU3c",
        start: 0,
      },
      {
        svar: "C / C#",
        meta: "Under the Sea – Samuel E. Wright (Den lille havfrue)",
        spotify: "https://open.spotify.com/track/4qqfI5oNO53a6W7nWfutKH",
        start: 0,
      },
      {
        svar: "Java",
        meta: "Espresso – Sabrina Carpenter",
        spotify: "https://open.spotify.com/track/1vLqigPHwiFnXsfrLMehV1",
        start: 0,
      },
      {
        svar: "Next.js",
        meta: "thank u, next – Ariana Grande",
        spotify: "https://open.spotify.com/track/3e9HZxeyfWwjeyPAMmWSSQ",
        start: 0,
      },
      {
        svar: "JavaScript / TypeScript",
        meta: "Hall of Fame – The Script feat. will.i.am",
        spotify: "https://open.spotify.com/track/7wMq5n8mYSKlQIGECKUgTX",
        start: 0,
      },
    ],
  },
];
