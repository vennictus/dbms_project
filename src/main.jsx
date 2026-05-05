import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Database,
  Flag,
  Gauge,
  LineChart,
  Medal,
  Search,
  Table2,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { f1Data } from "./data/f1Data";
import "./styles.css";

const navItems = [
  ["overview", "Overview"],
  ["races", "Race Workspace"],
  ["standings", "Standings"],
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

function isTitleDecider(year, raceName) {
  return (year === 2021 && raceName === "Abu Dhabi Grand Prix")
    || (year === 2022 && raceName === "Japanese Grand Prix");
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

function RaceInsights({ race }) {
  const movers = race.results
    .filter((row) => row.grid && row.grid > 0)
    .map((row) => ({ ...row, delta: row.grid - row.position }))
    .sort((a, b) => b.delta - a.delta);
  const bestMover = movers.find((row) => row.delta > 0) || movers[0];
  const biggestDrop = [...movers].sort((a, b) => a.delta - b.delta)[0];
  const pointsFinishers = race.results.filter((row) => row.points > 0).length;
  const constructorHaul = Object.values(
    race.results.reduce((acc, row) => {
      acc[row.constructor] ??= { name: row.constructor, points: 0 };
      acc[row.constructor].points += row.points;
      return acc;
    }, {}),
  ).sort((a, b) => b.points - a.points)[0];

  const insightRows = [
    ["Winner", race.winner?.code || "N/A", race.winner?.constructor || "Race result"],
    ["Fastest lap", race.fastestLap ? `${race.fastestLap.code} ${lap(race.fastestLap.lapTime)}` : "N/A", race.fastestLap ? `Lap ${race.fastestLap.lap}` : "Telemetry"],
    ["Best grid gain", bestMover ? `${bestMover.code} ${bestMover.delta > 0 ? "+" : ""}${bestMover.delta}` : "N/A", bestMover ? `${bestMover.grid} to ${bestMover.position}` : "Classified result"],
    ["Top team haul", constructorHaul ? `${constructorHaul.name}` : "N/A", constructorHaul ? `${constructorHaul.points} pts; ${pointsFinishers} points finishers` : "Race points"],
  ];

  return (
    <article className="panel raceInsights">
      <div className="panelHead"><h3>Selected race intelligence</h3><Gauge size={18} /></div>
      <div className="insightGrid">
        {insightRows.map(([label, value, detail]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </div>
        ))}
      </div>
      {biggestDrop && biggestDrop.delta < 0 && (
        <p className="quietNote">Largest loss: {biggestDrop.code} {biggestDrop.delta} places from grid to finish.</p>
      )}
    </article>
  );
}

function ResultSummary({ race }) {
  const pointsRows = race.results.filter((row) => row.points > 0);
  const podiumRows = race.results.filter((row) => row.position <= 3).length;
  const outsidePoints = race.results.length - pointsRows.length;
  const movers = race.results
    .filter((row) => row.grid && row.grid > 0)
    .map((row) => ({ ...row, delta: row.grid - row.position }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4);

  return (
    <article className="panel resultSummary">
      <div className="panelHead"><h3>Race summary</h3><Flag size={18} /></div>
      <div className="summaryStack">
        <div>
          <span>Result rows</span>
          <strong>{race.results.length}</strong>
          <small>Full classified race sheet</small>
        </div>
        <div>
          <span>Points finishers</span>
          <strong>{pointsRows.length}</strong>
          <small>{pointsRows.reduce((sum, row) => sum + row.points, 0)} total points</small>
        </div>
      </div>
      <div className="miniBreakdown">
        <div><span>Podium</span><strong>{podiumRows}</strong></div>
        <div><span>Points</span><strong>{pointsRows.length}</strong></div>
        <div><span>No points</span><strong>{outsidePoints}</strong></div>
      </div>
      <div className="movementList">
        <span>Grid movement</span>
        {movers.map((row) => (
          <div key={row.driverId}>
            <strong>{row.code}</strong>
            <em className={row.delta > 0 ? "gain" : row.delta < 0 ? "loss" : ""}>
              {row.delta > 0 ? `+${row.delta}` : row.delta}
            </em>
          </div>
        ))}
      </div>
    </article>
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
  const activeRaceIndex = season.races.findIndex((race) => race.id === activeRace.id);
  const previousRace = season.races[(activeRaceIndex - 1 + season.races.length) % season.races.length];
  const nextRace = season.races[(activeRaceIndex + 1) % season.races.length];

  function moveRace(direction) {
    const target = direction === "next" ? nextRace : previousRace;
    setActiveRaceId(target.id);
  }

  return (
    <section className="raceExplorer" id="races">
      <div className="sectionTitle">
        <p className="kicker">Race Management Module</p>
        <h2>Race workspace</h2>
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
          <div className="raceStepper">
            <button className="prev" type="button" onClick={() => moveRace("prev")} aria-label="Previous race">
              <ChevronLeft size={20} />
              <span>Previous race</span>
              <strong>R{previousRace.round}</strong>
              <small>{previousRace.name}</small>
            </button>
            <div className="raceNow" aria-live="polite">
              <span>Selected</span>
              <strong>Round {activeRace.round}</strong>
              <small>{activeRace.name}</small>
            </div>
            <button className="next" type="button" onClick={() => moveRace("next")} aria-label="Next race">
              <span>Next race</span>
              <strong>R{nextRace.round}</strong>
              <small>{nextRace.name}</small>
              <ChevronRight size={20} />
            </button>
          </div>
        </aside>
        <div className="workspaceFooter">
          <ResultSummary race={activeRace} />
          <div className="workspaceGroup" id="standings">
            <div className="groupTitle">
              <div>
                <p className="kicker">After Round {activeRace.round}</p>
                <h3>Championship state</h3>
              </div>
            </div>
            <div className="snapshots inWorkspace">
              <SnapshotBars title="Drivers after selected race" subtitle={`After ${activeRace.name}`} rows={activeRace.driverStandingsAfter} type="driver" />
              <SnapshotBars title="Constructors after selected race" subtitle={`After ${activeRace.name}`} rows={activeRace.constructorStandingsAfter} type="constructor" />
            </div>
          </div>
        </div>
        <div className="raceContent">
          <article className={`raceHero panel ${isTitleDecider(season.year, activeRace.name) ? "decider" : ""}`}>
            <div>
              <p className="kicker">Round {activeRace.round} · {activeRace.date}</p>
              <h2>{activeRace.name}</h2>
              <p>{activeRace.circuit.name} · {activeRace.circuit.location}, {activeRace.circuit.country}</p>
              {isTitleDecider(season.year, activeRace.name) && <span className="badge">Championship Decider</span>}
            </div>
            <div className="factGrid">
              <div><span>Winner</span><strong>{activeRace.winner?.driver}</strong><small>{activeRace.winner?.constructor}</small></div>
              <div><span>Pole</span><strong>{activeRace.pole?.driver || "N/A"}</strong><small>{activeRace.pole?.constructor || "Qualifying data"}</small></div>
              <div><span>Fastest lap</span><strong>{activeRace.fastestLap?.code} · {lap(activeRace.fastestLap?.lapTime)}</strong><small>Lap {activeRace.fastestLap?.lap}</small></div>
            </div>
          </article>
          <div className="detailGrid">
            <RaceInsights race={activeRace} />
            <article className="panel">
              <div className="panelHead"><h3>Podium</h3><Medal size={18} /></div>
              <Podium race={activeRace} />
            </article>
          </div>
          <div className="detailGrid balanced">
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
            <article className="panel">
              <div className="panelHead"><h3>Lap pace ranking</h3><Timer size={18} /></div>
              <div className="paceList compact">
                {paceRows.map((r, i) => (
                  <div key={r.driverId}>
                    <span>{i + 1}</span><strong>{r.code}</strong>
                    <p>{lap(r.lapSummary.avgLap)}<small>best {lap(r.lapSummary.bestLap)}</small></p>
                  </div>
                ))}
              </div>
            </article>
          </div>
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
        <section className="overviewShell" id="overview">
          <div className="hero">
            <div>
              <p className="kicker">Formula 1 Race Management & Performance Analytics</p>
              <h1><span>Formula 1</span> Race Intelligence System</h1>
              <p>Oracle SQL and PL/SQL project for race management, standings analysis, lap pace, and championship reporting, presented through a focused dashboard interface.</p>
              <div className="heroMeta">
                <span>Oracle SQL</span>
                <span>PL/SQL</span>
                <span>Race Workspace</span>
                <span>Performance Analytics</span>
              </div>
            </div>
          <div className="heroPanel summaryPanel">
            <div className="scanline" />
            <div className="datasetTopline">
              <span>{year} dataset scope</span>
              <em>{season.races.length} rounds</em>
            </div>
            <strong>{season.races.length} Grands Prix loaded</strong>
            <p>{year === "2021" ? "23,688" : "23,529"} lap records, classified results, race-level constructor points, and standings snapshots after every round.</p>
            <div className="datasetStats">
              <div><span>Results</span><strong>{season.races.length * 20}</strong></div>
              <div><span>Telemetry</span><strong>{year === "2021" ? "23.6k" : "23.5k"}</strong></div>
              <div><span>Views</span><strong>2</strong></div>
            </div>
          </div>
          </div>
          <div className="statsGrid">
            <Stat icon={Trophy} label="Champion" value={max.name} detail={`${max.points} points, ${max.wins} wins`} />
            <Stat icon={Flag} label="Main rival" value={rival.name} detail={`${rival.points} points`} />
            <Stat icon={Gauge} label="Title margin" value={`${margin} pts`} detail={year === "2021" ? "Final championship gap" : "Final gap to Leclerc"} />
            <Stat icon={Database} label="Backend records" value="47,217" detail="Lap-time rows across 2021-2022" />
          </div>
        </section>

        <RaceExplorer season={season} activeRace={activeRace} setActiveRaceId={setActiveRaceId} query={query} setQuery={setQuery} />

        <section className="standings">
          <div className="sectionTitle"><p className="kicker">Championship Management</p><h2>Final standings</h2></div>
          <div className="standGrid">
            <article className="panel"><div className="panelHead"><h3>Drivers' Championship</h3><LineChart size={18} /></div><Standings rows={season.driverStandings} type="driver" /></article>
            <article className="panel"><div className="panelHead"><h3>Constructors' Championship</h3><Users size={18} /></div><Standings rows={season.constructorStandings} type="constructor" /></article>
          </div>
        </section>

        <StoryMode year={year} />
        <DbmsBrief />
      </main>
      {showTop && <button className="backTop" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top"><ArrowUp size={18} /></button>}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
