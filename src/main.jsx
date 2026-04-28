import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUp,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Database,
  Flag,
  Gauge,
  GitBranch,
  LineChart,
  Medal,
  Search,
  ShieldCheck,
  Table2,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { f1Data } from "./data/f1Data";
import "./styles.css";

const navItems = [
  ["overview", "Overview"],
  ["races", "Race Explorer"],
  ["analytics", "Analytics Lab"],
  ["story", "Story Mode"],
  ["database", "DBMS Brief"],
];

const teamColors = {
  "Red Bull": "#315cff",
  "Red Bull Racing": "#315cff",
  Mercedes: "#58d8ca",
  Ferrari: "#ef2f37",
  McLaren: "#ff8a24",
  Alpine: "#3c8cff",
  AlphaTauri: "#b7c6df",
  "Aston Martin": "#25b978",
  Williams: "#56a6ff",
  "Alfa Romeo": "#a52934",
  Haas: "#dadce2",
};

const storyCards = {
  2021: [
    ["Bahrain", "Hamilton starts the fight with a win, Max is immediately close."],
    ["Silverstone", "The rivalry turns physical and the championship tone changes."],
    ["Monza", "Another collision keeps the title fight unstable."],
    ["Saudi Arabia", "Hamilton wins and both contenders enter Abu Dhabi level on points."],
    ["Abu Dhabi", "Championship decider: Verstappen wins the race and the title."],
  ],
  2022: [
    ["Bahrain", "Ferrari opens with Leclerc winning and Red Bull reliability hurting."],
    ["Australia", "Leclerc wins again; Ferrari looks like the reference team."],
    ["Imola", "Verstappen answers Ferrari on Italian ground."],
    ["Spa", "Red Bull pace becomes overwhelming."],
    ["Japan", "Verstappen seals the second championship."],
  ],
};

function teamColor(name = "") {
  const key = Object.keys(teamColors).find((team) => name.includes(team));
  return teamColors[key] || "#f4c84b";
}

function lap(seconds) {
  if (!seconds && seconds !== 0) return "N/A";
  const min = Math.floor(seconds / 60);
  const sec = (seconds - min * 60).toFixed(3).padStart(6, "0");
  return `${min}:${sec}`;
}

function posClass(pos) {
  if (pos === 1) return "gold";
  if (pos === 2) return "silver";
  if (pos === 3) return "bronze";
  return "";
}

function Stat({ icon: Icon, label, value, detail }) {
  return (
    <article className="stat">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function useScrollUi() {
  const [hidden, setHidden] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [active, setActive] = useState("overview");

  useEffect(() => {
    let last = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      setHidden(y > 120 && y > last);
      setShowTop(y > 500);
      last = y;
      const current = navItems
        .map(([id]) => [id, document.getElementById(id)?.getBoundingClientRect().top ?? 9999])
        .filter(([, top]) => top < 180)
        .pop();
      if (current) setActive(current[0]);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { hidden, showTop, active };
}

function Standings({ rows, type, limit }) {
  const shownRows = limit ? rows.slice(0, limit) : rows;
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Pos</th>
            <th>{type === "driver" ? "Driver" : "Constructor"}</th>
            {type === "driver" && <th>Wins</th>}
            {type === "driver" && <th>Podiums</th>}
            {type === "constructor" && <th>Wins</th>}
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {shownRows.map((row) => (
            <tr key={row.id}>
              <td><span className={`pos ${posClass(row.position)}`}>{row.position}</span></td>
              <td><strong>{row.name}</strong><small>{type === "driver" ? row.code : row.nationality}</small></td>
              {type === "driver" && <td>{row.wins}</td>}
              {type === "driver" && <td>{row.podiums}</td>}
              {type === "constructor" && <td>{row.wins}</td>}
              <td className="points">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Podium({ race }) {
  const [first, second, third] = race.results.slice(0, 3);
  const blocks = [
    [second, "P2", "podium second"],
    [first, "P1", "podium first"],
    [third, "P3", "podium third"],
  ];
  return (
    <div className="podiumBox">
      {blocks.map(([driver, label, cls]) => (
        <div className={cls} key={label}>
          <span>{label}</span>
          <strong>{driver?.code}</strong>
          <small>{driver?.driver}</small>
          <em style={{ "--team": teamColor(driver?.constructor) }}>{driver?.constructor}</em>
        </div>
      ))}
    </div>
  );
}

function RaceExplorer({ season, activeRace, setActiveRaceId, query, setQuery }) {
  const races = useMemo(() => season.races.filter((race) => {
    const text = `${race.name} ${race.circuit.name} ${race.circuit.country} ${race.winner?.driver}`.toLowerCase();
    return text.includes(query.toLowerCase());
  }), [season.races, query]);
  const paceRows = useMemo(() => activeRace.results
    .filter((r) => r.lapSummary)
    .sort((a, b) => a.lapSummary.avgLap - b.lapSummary.avgLap)
    .slice(0, 8), [activeRace]);
  const constructorRacePoints = useMemo(() => Object.values(
    activeRace.results.reduce((acc, row) => {
      acc[row.constructor] ??= { name: row.constructor, points: 0 };
      acc[row.constructor].points += row.points;
      return acc;
    }, {}),
  ).sort((a, b) => b.points - a.points).slice(0, 6), [activeRace]);

  return (
    <section className="raceExplorer" id="races">
      <div className="sectionTitle">
        <p className="kicker">Race Management Module</p>
        <h2>Explore every Grand Prix</h2>
      </div>
      <div className="raceWorkbench">
        <aside className="raceIndex panel">
          <label className="search">
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search race, circuit, country, winner" />
          </label>
          <div className="raceCards">
            {races.map((race) => (
              <button key={race.id} className={race.id === activeRace.id ? "active" : ""} onClick={() => setActiveRaceId(race.id)} type="button">
                <span>Round {race.round}</span>
                <strong>{race.name}</strong>
                <small>{race.circuit.name}</small>
                <em style={{ "--team": teamColor(race.winner?.constructor) }}>{race.winner?.code} winner</em>
              </button>
            ))}
          </div>
        </aside>
        <div className="raceDetail">
          <article className={`raceHero panel ${activeRace.name === "Abu Dhabi Grand Prix" && season.year === 2021 ? "decider" : ""}`}>
            <div>
              <p className="kicker">Round {activeRace.round} · {activeRace.date}</p>
              <h2>{activeRace.name}</h2>
              <p>{activeRace.circuit.name} · {activeRace.circuit.location}, {activeRace.circuit.country}</p>
              {activeRace.name === "Abu Dhabi Grand Prix" && season.year === 2021 && <span className="badge">Championship Decider</span>}
            </div>
            <div className="factGrid">
              <div><span>Winner</span><strong>{activeRace.winner?.driver}</strong><small>{activeRace.winner?.constructor}</small></div>
              <div><span>Pole</span><strong>{activeRace.pole?.driver || "N/A"}</strong><small>{activeRace.pole?.constructor || "Qualifying data"}</small></div>
              <div><span>Fastest lap</span><strong>{activeRace.fastestLap?.code} · {lap(activeRace.fastestLap?.lapTime)}</strong><small>Lap {activeRace.fastestLap?.lap}</small></div>
            </div>
          </article>
          <div className="detailGrid">
            <article className="panel">
              <div className="panelHead"><h3>Podium</h3><Medal size={18} /></div>
              <Podium race={activeRace} />
            </article>
            <article className="panel">
              <div className="panelHead"><h3>Constructor points in race</h3><Users size={18} /></div>
              <div className="barList">
                {constructorRacePoints.map((team) => (
                  <div key={team.name}>
                    <span>{team.name}</span><strong>{team.points}</strong>
                    <i style={{ width: `${Math.max(5, team.points * 4)}%`, background: teamColor(team.name) }} />
                  </div>
                ))}
              </div>
            </article>
          </div>
          <div className="detailGrid wideLeft">
            <article className="panel">
              <div className="panelHead"><h3>Classified result</h3><Table2 size={18} /></div>
              <div className="tableWrap">
                <table>
                  <thead><tr><th>Pos</th><th>Driver</th><th>Constructor</th><th>Grid</th><th>Delta</th><th>Pts</th></tr></thead>
                  <tbody>
                    {activeRace.results.map((r) => {
                      const delta = r.grid === 0 || r.grid == null ? null : r.grid - r.position;
                      return (
                        <tr key={r.driverId}>
                          <td><span className={`pos ${posClass(r.position)}`}>{r.position}</span></td>
                          <td><strong>{r.code}</strong><small>{r.driver}</small></td>
                          <td><b className="dot" style={{ "--team": teamColor(r.constructor) }} />{r.constructor}</td>
                          <td>{r.grid ?? "PL"}</td>
                          <td className={delta > 0 ? "gain" : delta < 0 ? "loss" : ""}>{delta == null ? "N/A" : delta > 0 ? `+${delta}` : delta}</td>
                          <td className="points">{r.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="panel">
              <div className="panelHead"><h3>Lap pace ranking</h3><Timer size={18} /></div>
              <div className="paceList">
                {paceRows.map((r, i) => (
                  <div key={r.driverId}>
                    <span>{i + 1}</span><strong>{r.code}</strong>
                    <p>{lap(r.lapSummary.avgLap)}<small>best {lap(r.lapSummary.bestLap)}</small></p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

function SnapshotBars({ title, subtitle, rows, type }) {
  const topRows = rows.slice(0, 6);
  const max = Math.max(...topRows.map((row) => row.points), 1);
  return (
    <article className="panel snapshot">
      <div className="panelHead">
        <div>
          <p className="kicker">{subtitle}</p>
          <h3>{title}</h3>
        </div>
        {type === "driver" ? <Trophy size={18} /> : <Users size={18} />}
      </div>
      <div className="snapshotRows">
        {topRows.map((row) => (
          <div key={row.id}>
            <span className={`pos ${posClass(row.position)}`}>{row.position}</span>
            <strong>{type === "driver" ? row.code : row.name}</strong>
            <em>{row.points} pts</em>
            <i style={{ width: `${Math.max(4, (row.points / max) * 100)}%`, background: type === "driver" ? "#f3c84b" : teamColor(row.name) }} />
          </div>
        ))}
      </div>
    </article>
  );
}

function AnalyticsLab({ season }) {
  const winners = useMemo(() => Object.values(season.races.reduce((acc, race) => {
    const code = race.winner?.code || "N/A";
    acc[code] ??= { code, driver: race.winner?.driver, constructor: race.winner?.constructor, wins: 0 };
    acc[code].wins += 1;
    return acc;
  }, {})).sort((a, b) => b.wins - a.wins), [season.races]);
  const maxWins = Math.max(...winners.map((w) => w.wins));
  const fastest = useMemo(() => season.races
    .map((race) => ({ race: race.name, ...race.fastestLap }))
    .filter((r) => r.lapTime)
    .sort((a, b) => a.lapTime - b.lapTime)
    .slice(0, 8), [season.races]);

  return (
    <section id="analytics">
      <div className="sectionTitle"><p className="kicker">Performance Analytics Module</p><h2>Analytics Lab</h2></div>
      <div className="analyticsGrid">
        <article className="panel">
          <div className="panelHead"><h3>Win distribution</h3><BarChart3 size={18} /></div>
          <div className="barList">
            {winners.map((w) => (
              <div key={w.code}>
                <span>{w.code} · {w.driver}</span><strong>{w.wins}</strong>
                <i style={{ width: `${(w.wins / maxWins) * 100}%`, background: teamColor(w.constructor) }} />
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panelHead"><h3>Fastest lap board</h3><Gauge size={18} /></div>
          <div className="fastList">
            {fastest.map((row, index) => (
              <div key={`${row.race}-${row.code}`}>
                <span>{index + 1}</span><strong>{row.code}</strong><p>{lap(row.lapTime)}<small>{row.race}</small></p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function StoryMode({ year }) {
  return (
    <section id="story">
      <div className="sectionTitle"><p className="kicker">Story Mode</p><h2>{year === "2021" ? "The eight-point war" : "Ferrari starts, Max finishes"}</h2></div>
      <div className="timeline">
        {storyCards[year].map(([title, copy], i) => (
          <article key={title}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <strong>{title}</strong>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DbmsBrief() {
  const items = [
    ["Race Management Module", "Stores season, circuit, driver, constructor, race, and classified result data. This supports administrative tasks like loading race calendars, validating participants, and retrieving complete race result sheets."],
    ["Performance Analytics Module", "Uses lap-time records to compute best laps, average pace, race pace rankings, fastest-lap leaderboards, and performance comparisons across drivers and constructors."],
    ["PL/SQL Automation", "Includes procedures for result insertion and standings output, functions for average lap and fastest-lap lookup, triggers for lap validation and point automation, cursors, and exception handling."],
    ["Transaction Control", "Demonstrates SAVEPOINT, ROLLBACK, and COMMIT. The report explains how Oracle constraints and transaction isolation preserve consistency during updates."],
  ];
  return (
    <section id="database" className="dbPage">
      <div className="dbHero panel">
        <p className="kicker">Backend Implementation</p>
        <h2>DBMS Project Core</h2>
        <p>
          The React dashboard is the presentation layer. The project core is the Oracle SQL and PL/SQL implementation:
          normalized tables, referential integrity, views, stored procedures, functions, triggers, cursors, exception
          handling, transactions, and analytical SQL queries.
        </p>
      </div>
      <div className="dbGrid">
        {items.map(([title, copy]) => (
          <article className="panel" key={title}>
            <Database size={20} />
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
      <div className="dbDeepGrid">
        <article className="panel">
          <h3>Normalized Tables</h3>
          <p>
            `SEASON`, `CIRCUIT`, `TEAM`, `DRIVER`, `RACE`, `RESULT`, `LAP_DATA`, and `TYRE_DATA`
            separate master data from transactional race data. This avoids redundancy and keeps driver,
            constructor, race, and lap-time records queryable through foreign keys.
          </p>
        </article>
        <article className="panel">
          <h3>SQL Query Coverage</h3>
          <p>
            The query file demonstrates joins, aggregate functions, grouping, ordering, views, team points,
            lap pace, fastest laps, race results, and consistency analytics. This directly matches the DBMS
            implementation expectations.
          </p>
        </article>
        <article className="panel">
          <h3>Report Artifacts</h3>
          <p>
            `docs/report/final_report.md`, `er_model.md`, `relational_schema.md`, and `docs/normalization.md`
            document the project in the required synopsis/report format.
          </p>
        </article>
      </div>
      <div className="sqlStrip">
        {["00_run_all.sql", "01_schema.sql", "03_plsql.sql", "04_analytics_queries.sql", "05_transaction_demo.sql"].map((file) => <code key={file}>{file}</code>)}
      </div>
    </section>
  );
}

function App() {
  const [year, setYear] = useState("2021");
  const [query, setQuery] = useState("");
  const season = f1Data.seasons[year];
  const [activeRaceId, setActiveRaceId] = useState(season.races[season.races.length - 1].id);
  const { hidden, showTop, active } = useScrollUi();
  const activeRace = season.races.find((race) => race.id === activeRaceId) || season.races[0];
  const max = season.driverStandings.find((d) => d.name === "Max Verstappen");
  const rival = year === "2021"
    ? season.driverStandings.find((d) => d.name === "Lewis Hamilton")
    : season.driverStandings.find((d) => d.name === "Charles Leclerc");
  const margin = Math.abs(max.points - rival.points);

  function switchYear(next) {
    setYear(next);
    setQuery("");
    const races = f1Data.seasons[next].races;
    setActiveRaceId(races[races.length - 1].id);
  }

  return (
    <>
      <header className={`topNav ${hidden ? "hide" : ""}`}>
        <div className="brand"><span>F1</span><strong>Race Intelligence</strong></div>
        <nav>
          {navItems.map(([id, label]) => <a className={active === id ? "active" : ""} href={`#${id}`} key={id}>{label}</a>)}
        </nav>
        <div className="seasonSwitch">
          {["2021", "2022"].map((item) => <button className={year === item ? "active" : ""} onClick={() => switchYear(item)} key={item}>{item}</button>)}
        </div>
      </header>
      <main>
        <section className="hero" id="overview">
          <div>
            <p className="kicker">Formula 1 Race Management & Performance Analytics</p>
            <h1><span>Verstappen</span> Era Command Center</h1>
            <p>Race control style dashboard over an Oracle SQL/PL-SQL DBMS project: standings, race results, lap pace, story mode, and backend proof in one submission interface.</p>
            <div className="heroMeta">
              <span>Oracle SQL</span>
              <span>PL/SQL</span>
              <span>Race Explorer</span>
              <span>Telemetry Analytics</span>
            </div>
          </div>
          <div className="heroPanel">
            <div className="scanline" />
            <span>{year} focus</span>
            <strong>{year === "2021" ? "Max defeats Lewis by 8 points" : "Ferrari threatens, Red Bull takes control"}</strong>
            <p>{season.races.length} races · {year === "2021" ? "23,688" : "23,529"} lap records · final standings loaded from championship tables</p>
          </div>
        </section>

        <section className="statsGrid">
          <Stat icon={Trophy} label="Champion" value={max.name} detail={`${max.points} points, ${max.wins} wins`} />
          <Stat icon={Flag} label="Main rival" value={rival.name} detail={`${rival.points} points`} />
          <Stat icon={Gauge} label="Title margin" value={`${margin} pts`} detail={year === "2021" ? "Final championship gap" : "Final gap to Leclerc"} />
          <Stat icon={Database} label="Backend records" value="47,217" detail="Lap-time rows across 2021-2022" />
        </section>

        <RaceExplorer season={season} activeRace={activeRace} setActiveRaceId={setActiveRaceId} query={query} setQuery={setQuery} />

        <section className="snapshots" id="snapshots">
          <SnapshotBars title="Drivers after selected race" subtitle={`After round ${activeRace.round}`} rows={activeRace.driverStandingsAfter} type="driver" />
          <SnapshotBars title="Constructors after selected race" subtitle={`After round ${activeRace.round}`} rows={activeRace.constructorStandingsAfter} type="constructor" />
        </section>

        <section className="standings" id="standings">
          <div className="sectionTitle"><p className="kicker">Championship Management</p><h2>Final standings</h2></div>
          <div className="standGrid">
            <article className="panel"><div className="panelHead"><h3>Drivers' Championship</h3><LineChart size={18} /></div><Standings rows={season.driverStandings} type="driver" /></article>
            <article className="panel"><div className="panelHead"><h3>Constructors' Championship</h3><Users size={18} /></div><Standings rows={season.constructorStandings} type="constructor" /></article>
          </div>
        </section>

        <AnalyticsLab season={season} />
        <StoryMode year={year} />
        <DbmsBrief />
      </main>
      {showTop && <button className="backTop" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top"><ArrowUp size={18} /></button>}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
