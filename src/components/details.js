import { useEffect, useState } from "react";
import data from "../assets/data.json";

export default function Details() {
  const innings = data.innings;

  const targetRuns = 176;

  const team1Deliveries =
    innings[0]?.overs?.flatMap((over) =>
      over.deliveries.map((delivery) => ({
        ...delivery,
        team: innings[0].team,
      }))
    ) || [];

  const team2Deliveries =
    innings[1]?.overs?.flatMap((over) =>
      over.deliveries.map((delivery) => ({
        ...delivery,
        team: innings[1].team,
      }))
    ) || [];

  const [currentBall, setCurrentBall] = useState(0);
  const [legalBalls, setLegalBalls] = useState(0);
  const [isTeam1, setIsTeam1] = useState(true);
  const [totalRuns, setTotalRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [overDisplay, setOverDisplay] = useState("0.0");
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [batsmanRuns, setBatsmanRuns] = useState({});
  const [fourRuns, setFourRuns] = useState({});
  const [sixRuns, setSixRuns] = useState({});
  const [ballsFaced, setBallsFaced] = useState({});
  const [runsPerBall, setRunsPerBall] = useState([]);
  const [boundaryAlert, setBoundaryAlert] = useState("");
  const [bowlerOvers, setBowlerOvers] = useState({});
  const [showScorecard, setShowScorecard] = useState(false);
  const [activeTeam, setActiveTeam] = useState('SRH');

  // Store data for both teams
  const [team1Score, setTeam1Score] = useState({ runs: 0, wickets: 0, overs: "0.0", legalBalls: 0 });
  const [team2Score, setTeam2Score] = useState({ runs: 0, wickets: 0, overs: "0.0", legalBalls: 0 });

  // Track all batsmen who have batted
  const [team1Batsmen, setTeam1Batsmen] = useState([]);
  const [team2Batsmen, setTeam2Batsmen] = useState([]);

  // Track all bowlers who have bowled
  const [team1Bowlers, setTeam1Bowlers] = useState({});
  const [team2Bowlers, setTeam2Bowlers] = useState({});

  // Track wickets taken by bowlers
  const [bowlerWickets, setBowlerWickets] = useState({});

  // Track runs conceded by bowlers
  const [bowlerRuns, setBowlerRuns] = useState({});

  // Track dismissal info
  const [dismissalInfo, setDismissalInfo] = useState({});

  const formatOvers = (balls) => {
    const overs = Math.floor(balls / 6);
    const ballsRemaining = balls % 6;
    return `${overs}.${ballsRemaining}`;
  };

  const deliveries = isTeam1 ? team1Deliveries : team2Deliveries;

  const ballsLeft = 120 - legalBalls;
  const wicketsLeft = 10 - wickets;
  const currentRunRate = legalBalls > 0 ? (totalRuns * 6) / legalBalls : 0;
  const runsNeeded = targetRuns - totalRuns > 0 ? targetRuns - totalRuns : 0;
  const requiredRunRate = ballsLeft > 0 ? (runsNeeded * 6) / ballsLeft : 0;

  let winningProbability = 50;
  if (runsNeeded === 0) {
    winningProbability = 100;
  } else if (ballsLeft === 0) {
    winningProbability = totalRuns >= targetRuns ? 100 : 0;
  } else {
    const rrrFactor = Math.max(0, Math.min(1, (currentRunRate - requiredRunRate + 2) / 4));
    const wicketFactor = Math.max(0, Math.min(1, wicketsLeft / 10));
    winningProbability = Math.round(100 * (0.7 * rrrFactor + 0.3 * wicketFactor));
  }

  useEffect(() => {
    if (currentBall < deliveries.length) {
      const timer = setTimeout(() => {
        const delivery = deliveries[currentBall];
        setCurrentDelivery(delivery);

        const runs = delivery.runs?.total || 0;
        const isWicket = delivery.wickets?.length > 0;
        const isWide = delivery.extras?.wides;
        const isNoBall = delivery.extras?.noballs;
        const legalDelivery = !isWide && !isNoBall;

        setTotalRuns((prev) => prev + runs);

        // Respective team's score
        if (isTeam1) {
          setTeam1Score(prev => ({
            ...prev,
            runs: prev.runs + runs,
            wickets: prev.wickets + (isWicket ? 1 : 0),
            legalBalls: legalDelivery ? prev.legalBalls + 1 : prev.legalBalls,
            overs: legalDelivery ? formatOvers(prev.legalBalls + 1) : prev.overs
          }));
        } else {
          setTeam2Score(prev => ({
            ...prev,
            runs: prev.runs + runs,
            wickets: prev.wickets + (isWicket ? 1 : 0),
            legalBalls: legalDelivery ? prev.legalBalls + 1 : prev.legalBalls,
            overs: legalDelivery ? formatOvers(prev.legalBalls + 1) : prev.overs
          }));
        }

        // Show alert for 4 or 6
        if (runs === 4 || runs === 6) {
          setBoundaryAlert(`${delivery.batter} hit a ${runs}! 🎉`);
          setTimeout(() => setBoundaryAlert(""), 1500);
        }
        if (runs === 4) {
          setFourRuns(prev => ({
            ...prev,
            [delivery.batter]: (prev[delivery.batter] || 0) + 1
          }))
        }
        if (runs === 6) {
          setSixRuns(prev => ({
            ...prev,
            [delivery.batter]: (prev[delivery.batter] || 0) + 1
          }))
        }

        if (isWicket) {
          setWickets((prev) => prev + 1);

          // Track dismissal info
          const wicketDetails = delivery.wickets[0];
          setDismissalInfo(prev => ({
            ...prev,
            [delivery.batter]: {
              kind: wicketDetails.kind,
              fielder: wicketDetails.fielders?.[0].name || "",
              bowler: delivery.bowler
            }
          }));

          // Update bowler wickets
          setBowlerWickets(prev => ({
            ...prev,
            [delivery.bowler]: (prev[delivery.bowler] || 0) + 1
          }));
        }

        // Update batsman runs
        const batter = delivery.batter;
        setBatsmanRuns((prev) => ({
          ...prev,
          [batter]: (prev[batter] || 0) + (delivery.runs?.batter || 0)
        }));

        // Track all players who have batted
        if (isTeam1) {
          setTeam1Batsmen(prev => {
            if (!prev.includes(batter)) {
              return [...prev, batter];
            }
            if (!prev.includes(delivery.non_striker)) {
              return [...prev, delivery.non_striker];
            }
            return prev;
          });
        } else {
          setTeam2Batsmen(prev => {
            if (!prev.includes(batter)) {
              return [...prev, batter];
            }
            if (!prev.includes(delivery.non_striker)) {
              return [...prev, delivery.non_striker];
            }
            return prev;
          });
        }

        // Update bowler runs
        setBowlerRuns(prev => ({
          ...prev,
          [delivery.bowler]: (prev[delivery.bowler] || 0) + runs
        }));

        if (legalDelivery) {
          setBallsFaced((prev) => ({
            ...prev,
            [batter]: (prev[batter] || 0) + 1,
          }));

          // Update bowler overs
          setBowlerOvers((prev) => {
            const bowler = delivery.bowler;
            const prevBalls = prev[bowler] || 0;
            return {
              ...prev,
              [bowler]: prevBalls + 1,
            };
          });

          // Track all bowlers
          if (isTeam1) {
            setTeam2Bowlers(prev => {
              if (!prev[delivery.bowler]) {
                return {
                  ...prev,
                  [delivery.bowler]: 1
                };
              }
              return prev;
            });
          } else {
            setTeam1Bowlers(prev => {
              if (!prev[delivery.bowler]) {
                return {
                  ...prev,
                  [delivery.bowler]: 1
                };
              }
              return prev;
            });
          }
        }

        setRunsPerBall((prev) => {
          const updated = [...prev, runs];
          return updated.length > 6 ? updated.slice(-6) : updated;
        });

        if (legalDelivery) {
          const nextLegal = legalBalls + 1;
          const over = Math.floor(nextLegal / 6);
          const ball = nextLegal % 6;
          setOverDisplay(`${over}.${ball}`);
          setLegalBalls(nextLegal);
        }

        setCurrentBall((prev) => prev + 1);
      }, 1400);

      return () => clearTimeout(timer);
    } else if (isTeam1) {
      setTimeout(() => {
        setIsTeam1(false);
        setCurrentBall(0);
        setLegalBalls(0);
        setTotalRuns(0);
        setWickets(0);
        setOverDisplay("0.0");
        setCurrentDelivery(null);
        setRunsPerBall([]);
      }, 5000);
    }
  }, [currentBall, deliveries, isTeam1, legalBalls]);

  // Function to calculate strike rate
  const calculateStrikeRate = (runs, balls) => {
    if (!balls) return 0;
    return ((runs / balls) * 100).toFixed(2);
  };

  // Function to calculate economy rate
  const calculateEconomy = (runs, balls) => {
    if (!balls) return 0;
    return ((runs / (Math.floor(balls / 6) + (balls % 6) / 10)) || 0).toFixed(2);
  };

  // Calculate run rates for both teams
  const team1RunRate = team1Score.legalBalls > 0 ? (team1Score.runs * 6) / team1Score.legalBalls : 0;
  const team2RunRate = team2Score.legalBalls > 0 ? (team2Score.runs * 6) / team2Score.legalBalls : 0;

  // Get the opposing team's bowlers
  const opposingTeamBowlers1 = Object.keys(team2Bowlers);
  const opposingTeamBowlers2 = Object.keys(team1Bowlers);

  return (
    <div className="row justify-content-center mt-3">
      <div className="col-md-10">
        <div className="card shadow-lg border border-dark rounded-4 p-4 bg-light">
          <div className="card-body">
            <div className="alert-container" style={{ height: "40px", marginBottom: "10px" }}>
              {boundaryAlert && (
                <div className="alert alert-success py-2 text-center fw-bold animate__animated animate__fadeIn">
                  {boundaryAlert}
                </div>
              )}
            </div>

            {/* Match Title and Rates */}
            <div className="d-flex flex-column mb-3">
              <h3 className="text-secondary mb-1 text-center">
                <span className={isTeam1 ? "fw-bold text-dark" : "text-muted"}>SRH</span>{" "}
                v{" "}
                <span className={!isTeam1 ? "fw-bold text-dark" : "text-muted"}>RR</span>
              </h3>

              {isTeam1 ? (
                <div className="d-flex justify-content-center gap-4">
                  <div><strong>CRR:</strong> {currentRunRate.toFixed(2)}</div>
                </div>
              ) : (
                <div className="d-flex justify-content-center gap-4">
                  <div><strong>RRR:</strong> {requiredRunRate.toFixed(2)}</div>
                  <div><strong>CRR:</strong> {currentRunRate.toFixed(2)}</div>
                  <div><strong>Target:</strong> {targetRuns} Runs</div>
                </div>
              )}

              {!isTeam1 && currentBall >= deliveries.length && (
                <div className="alert alert-success mt-2 text-center py-1">
                  <strong>
                    {totalRuns >= targetRuns
                      ? "RR won by " + wicketsLeft + " wickets"
                      : totalRuns < targetRuns
                        ? "SRH won by " + (targetRuns - totalRuns - 1) + " runs"
                        : "Match Tied"}
                  </strong>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-between align-items-start">
              <div className="text-start" style={{ width: "30%" }}>
                {currentDelivery && (
                  <>
                    <div className="mb-2">
                      <strong>{currentDelivery.batter}*</strong> {batsmanRuns[currentDelivery.batter] || 0}({ballsFaced[currentDelivery.batter] || 0})
                    </div>
                    <div>
                      <strong>{currentDelivery.non_striker}</strong> {batsmanRuns[currentDelivery.non_striker] || 0}({ballsFaced[currentDelivery.non_striker] || 0})
                    </div>
                    <div className="mt-3">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setShowScorecard(!showScorecard)}
                      >
                        {showScorecard ? "Hide Scoreboard" : "Show Scoreboard"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Score and Bowler */}
              <div className="text-center" style={{ width: "40%" }}>
                <div className="d-flex justify-content-center align-items-center gap-3">
                  <span className="fs-4 fw-bold text-primary">
                    {totalRuns}/{wickets}
                  </span>
                  <span className="text-secondary">
                    Overs: {overDisplay}
                  </span>
                </div>
                {currentDelivery && (
                  <div className="mt-2">
                    <span className="text-secondary">
                      Bowler: {currentDelivery.bowler}
                      {bowlerOvers[currentDelivery.bowler] !== undefined && (
                        <> ({formatOvers(bowlerOvers[currentDelivery.bowler])})</>
                      )}
                    </span>
                  </div>
                )}
                {!isTeam1 && (
                  <div className="d-flex justify-content-center gap-3 mt-2 text-secondary" style={{ fontSize: "0.9rem" }}>
                    <div><strong>Runs Left:</strong> {runsNeeded}</div>
                    <div><strong>Balls Left:</strong> {ballsLeft}</div>
                    <div><strong>Wickets Left:</strong> {wicketsLeft}</div>
                  </div>
                )}
              </div>

              {/* Balls and Win Probability */}
              <div className="text-end" style={{ width: "30%" }}>
                <div
                  className="fs-5 fw-bold mb-3"
                  style={{ letterSpacing: "0.3em" }}
                  title="Runs scored on last 6 balls"
                ><div className="d-flex flex-column text-end small">
                    <div className="fw-semibold">Last Six Balls:</div>
                    {runsPerBall.length > 0 ? runsPerBall.join(" ") : "-"}
                  </div>

                </div>
                {!isTeam1 && (
                  <div className="mt-2">
                    <div className="text-end mb-1 text-secondary" style={{ fontSize: "0.85rem" }}>
                      Winning Probability
                    </div>
                    <div style={{ display: "flex", alignItems: "center", fontSize: "0.9rem", color: "#555" }}>
                      <div style={{ flex: "0 0 40px", textAlign: "left", fontWeight: "600" }}>RR</div>
                      <div style={{ flex: "1", margin: "0 5px" }}>
                        <div className="progress" style={{ height: "1.25rem" }}>
                          <div
                            className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                            role="progressbar"
                            style={{ width: `${winningProbability}%` }}
                            aria-valuenow={winningProbability}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            {winningProbability}%
                          </div>
                        </div>
                      </div>
                      <div style={{ flex: "0 0 40px", textAlign: "right", fontWeight: "600" }}>SRH</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scorecard Section */}
            {showScorecard && (
              <div className="mt-4 scorecard-container">
                <h5 className="text-center fw-bold mb-3">Scoreboard</h5>

                {/* Team Selection Tabs */}
                <div className="team-selector mb-3">
                  <div className="d-flex justify-content-center">
                    <button
                      className={`btn ${activeTeam === 'SRH' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                      onClick={() => setActiveTeam('SRH')}
                    >
                      SRH
                    </button>
                    <button
                      className={`btn ${activeTeam === 'RR' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setActiveTeam('RR')}
                    >
                      RR
                    </button>
                  </div>
                </div>

                {/* SRH Batting & RR Bowling Details */}
                {activeTeam === 'SRH' && (
                  <>
                    {/* SRH Batting Scorecard */}
                    <div className="team-scorecard mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold text-primary mb-0">SRH Batting</h6>
                        <div className="d-flex align-items-center">
                          <span className="fw-bold me-2">
                            {team1Score.runs}/{team1Score.wickets}
                          </span>
                          <span className="text-secondary">{team1Score.overs} overs</span>
                          {team1Score.legalBalls > 0 && (
                            <span className="text-secondary ms-2">
                              CRR: {team1RunRate.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-sm table-striped">
                          <thead className="table-light">
                            <tr>
                              <th>Batter</th>
                              <th>Dismissal</th>
                              <th className="text-end">Runs</th>
                              <th className="text-end">Balls</th>
                              <th className="text-end">4s</th>
                              <th className="text-end">6s</th>
                              <th className="text-end">SR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {team1Batsmen.map((batter) => {
                              const runs = batsmanRuns[batter] || 0;
                              const balls = ballsFaced[batter] || 0;

                              return (
                                <tr key={batter}>
                                  <td>
                                    {batter}{" "}
                                    {isTeam1 && currentDelivery && (batter === currentDelivery.batter || batter === currentDelivery.non_striker) && "*"}
                                  </td>
                                  <td className="text-secondary" style={{ fontSize: "0.85rem" }}>
                                    {dismissalInfo[batter] ?
                                      (dismissalInfo[batter].kind === "caught" ?
                                        `c ${dismissalInfo[batter].fielder} b ${dismissalInfo[batter].bowler}` :
                                        `${dismissalInfo[batter].kind} b ${dismissalInfo[batter].bowler}`) :
                                      "not out"}
                                  </td>
                                  <td className="text-end">{runs}</td>
                                  <td className="text-end">{balls}</td>
                                  <td className="text-end">{fourRuns[batter] || 0}</td>
                                  <td className="text-end">{sixRuns[batter] || 0}</td>
                                  <td className="text-end">{calculateStrikeRate(runs, balls)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {team1Score.legalBalls > 0 && (
                            <tfoot>
                              <tr className="fw-bold">
                                <td colSpan="2">Total</td>
                                <td className="text-end">{team1Score.runs}</td>
                                <td className="text-end">{team1Score.legalBalls}</td>
                                <td colSpan="3" className="text-end">
                                  {team1Score.wickets} wickets, {team1Score.overs} overs
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>

                    {/* RR Bowling Scorecard */}
                    <div className="bowling-scorecard">
                      <h6 className="fw-bold mb-2 text-primary">RR Bowling</h6>
                      <div className="table-responsive">
                        <table className="table table-sm table-striped">
                          <thead className="table-light">
                            <tr>
                              <th>Bowler</th>
                              <th className="text-end">O</th>
                              <th className="text-end">R</th>
                              <th className="text-end">W</th>
                              <th className="text-end">Econ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Show RR bowlers against SRH batting */}
                            {opposingTeamBowlers1.map((bowler) => {
                              const balls = bowlerOvers[bowler] || 0;
                              const runs = bowlerRuns[bowler] || 0;
                              const wickets = bowlerWickets[bowler] || 0;


                              return (
                                <tr key={bowler}>
                                  <td>{bowler}</td>
                                  <td className="text-end">{formatOvers(balls)}</td>
                                  <td className="text-end">{runs}</td>
                                  <td className="text-end">{wickets}</td>
                                  <td className="text-end">{calculateEconomy(runs, balls)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* RR Batting & SRH Bowling Details */}
                {activeTeam === 'RR' && !isTeam1 && (
                  <>
                    {/* RR Batting Scorecard */}
                    <div className="team-scorecard mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold text-primary mb-0">RR Batting</h6>
                        <div className="d-flex align-items-center">
                          <span className="fw-bold me-2">
                            {team2Score.runs}/{team2Score.wickets}
                          </span>
                          <span className="text-secondary">{team2Score.overs} overs</span>
                          {team2Score.legalBalls > 0 && (
                            <span className="text-secondary ms-2">
                              CRR: {team2RunRate.toFixed(2)}
                            </span>
                          )}
                          {team1Score.runs > 0 && team2Score.legalBalls > 0 && (
                            <span className="text-secondary ms-2">
                              Target: {team1Score.runs + 1}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-sm table-striped">
                          <thead className="table-light">
                            <tr>
                              <th>Batter</th>
                              <th>Dismissal</th>
                              <th className="text-end">Runs</th>
                              <th className="text-end">Balls</th>
                              <th className="text-end">4s</th>
                              <th className="text-end">6s</th>
                              <th className="text-end">SR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {team2Batsmen.map((batter) => {
                              const runs = batsmanRuns[batter] || 0;
                              const balls = ballsFaced[batter] || 0;

                              const fours = fourRuns[batter] || 0
                              const sixes = sixRuns[batter] || 0

                              return (
                                <tr key={batter}>
                                  <td>
                                    {batter}{" "}
                                    {!isTeam1 && currentDelivery && (batter === currentDelivery.batter || batter === currentDelivery.non_striker) && "*"}
                                  </td>
                                  <td className="text-secondary" style={{ fontSize: "0.85rem" }}>
                                    {dismissalInfo[batter] ?
                                      (dismissalInfo[batter].kind === "caught" ?
                                        `c ${dismissalInfo[batter].fielder} b ${dismissalInfo[batter].bowler}` :
                                        `${dismissalInfo[batter].kind} b ${dismissalInfo[batter].bowler}`) :
                                      "not out"}
                                  </td>
                                  <td className="text-end">{runs}</td>
                                  <td className="text-end">{balls}</td>
                                  <td className="text-end">{fours}</td>
                                  <td className="text-end">{sixes}</td>
                                  <td className="text-end">{calculateStrikeRate(runs, balls)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {team2Score.legalBalls > 0 && (
                            <tfoot>
                              <tr className="fw-bold">
                                <td colSpan="2">Total</td>
                                <td className="text-end">{team2Score.runs}</td>
                                <td className="text-end">{team2Score.legalBalls}</td>
                                <td colSpan="3" className="text-end">
                                  {team2Score.wickets} wickets, {team2Score.overs} overs
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>

                    {/* SRH Bowling Scorecard */}
                    <div className="bowling-scorecard">
                      <h6 className="fw-bold mb-2 text-primary">SRH Bowling</h6>
                      <div className="table-responsive">
                        <table className="table table-sm table-striped">
                          <thead className="table-light">
                            <tr>
                              <th>Bowler</th>
                              <th className="text-end">O</th>
                              <th className="text-end">R</th>
                              <th className="text-end">W</th>
                              <th className="text-end">Econ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Show SRH bowlers against RR batting */}
                            {opposingTeamBowlers2.map((bowler) => {
                              const balls = bowlerOvers[bowler] || 0;
                              const runs = bowlerRuns[bowler] || 0;
                              const wickets = bowlerWickets[bowler] || 0;

                              return (
                                <tr key={bowler}>
                                  <td>{bowler}</td>
                                  <td className="text-end">{formatOvers(balls)}</td>
                                  <td className="text-end">{runs}</td>
                                  <td className="text-end">{wickets}</td>
                                  <td className="text-end">{calculateEconomy(runs, balls)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}