import { useEffect, useState } from "react";
import data from "../assets/data.json";

export default function Match() {
    const overs1 = data.innings[0].overs || [];
    const overs2 = data.innings[1].overs || [];

    const deliveries1 = overs1.flatMap(over => over.deliveries);
    const deliveries2 = overs2.flatMap(over => over.deliveries);

    const matchDate = data.info.dates[0] || "Unknown Date";
    const venue = data.info.venue || "Unknown Venue";

    const [currentBall, setCurrentBall] = useState(0);
    const [legalBalls, setLegalBalls] = useState(0);
    const [totalRuns, setTotalRuns] = useState(0);
    const [wickets, setWickets] = useState(0);
    const [overDisplay, setOverDisplay] = useState("0.0");
    const [isTeam1, setIsTeam1] = useState(true);

    const [team1Final, setTeam1Final] = useState({ runs: 0, wickets: 0, overs: "0.0" });
    const [result, setResult] = useState("1st Inning : SRH Batting");

    useEffect(() => {
        const deliveries = isTeam1 ? deliveries1 : deliveries2;

        if (currentBall < deliveries.length) {
            const timer = setTimeout(() => {
                const delivery = deliveries[currentBall];
                const runs = delivery.runs?.total || 0;
                const isWicket = delivery.wickets?.length > 0;
                const isWide = delivery.extras?.wides;
                const isNoBall = delivery.extras?.noballs;
                const isLegal = !isWide && !isNoBall;

                setTotalRuns(prev => prev + runs);
                if (isWicket) setWickets(prev => prev + 1);

                if (isLegal) {
                    const nextLegal = legalBalls + 1;
                    const over = Math.floor(nextLegal / 6);
                    const ball = nextLegal % 6;
                    setOverDisplay(`${over}.${ball}`);
                    setLegalBalls(nextLegal);
                }

                setCurrentBall(prev => prev + 1);
            }, 1500);

            return () => clearTimeout(timer);
        } else if (isTeam1) {
            setTeam1Final({ runs: totalRuns, wickets, overs: overDisplay });
            setTimeout(() => {
                setIsTeam1(false);
            }, 5000);
        } else {
            if (totalRuns > team1Final.runs) {
                setResult("RR won the match!");
            } else if (totalRuns < team1Final.runs) {
                setResult("SRH won the match!");
            } else {
                setResult("2nd Inning : RR Batting");
            }
        }
    }, [currentBall,
        isTeam1,
        deliveries1,
        deliveries2,
        legalBalls,
        totalRuns,
        wickets,
        overDisplay,
        team1Final.runs]);

    useEffect(() => {
        if (!isTeam1 && currentBall !== 0) {
            setCurrentBall(0);
            setLegalBalls(0);
            setTotalRuns(0);
            setWickets(0);
            setOverDisplay("0.0");
        }
    }, [isTeam1]);

    return (
        <div className="container mt-4 ">
    <div className="row justify-content-center">
        <div className="col-md-6"> 
            <div className="card shadow-sm border border-dark rounded-2 p-2 bg-light">
                <div className="card-body p-2">

                    {/* Date and Venue */}
                    <div className="d-flex justify-content-between mb-2 px-1">
                        <div className="d-flex flex-column text-start small">
                            <div className="fw-semibold">Date:</div>
                            <div>{matchDate}</div>
                        </div>
                        <div className="d-flex flex-column text-end small">
                            <div className="fw-semibold">Venue:</div>
                            <div>{venue}</div>
                        </div>
                    </div>

                    {/* Logos and Team Names */}
                    <div className="d-flex justify-content-between align-items-center mb-2 text-center">
                        <div>
                            <img src="/SRH.jpg" alt="SRH" style={{ height: "45px" }} />
                            <div className="fw-bold fs-6">SRH</div>
                            <div className="text-muted">{isTeam1 ? `${totalRuns}/${wickets}` : `${team1Final.runs}/${team1Final.wickets}`}</div>
                            <small className="text-muted">{isTeam1 ? `Overs: ${overDisplay}` : `Overs: ${team1Final.overs}`}</small>
                        </div>

                        <div className="fs-6 fw-semibold text-secondary">VS</div>

                        <div>
                            <img src="/RR.png" alt="RR" style={{ height: "45px" }} />
                            <div className="fw-bold fs-6">RR</div>
                            <div className="text-muted">{!isTeam1 ? `${totalRuns}/${wickets}` : "Yet to bat"}</div>
                            <small className="text-muted">{!isTeam1 ? `Overs: ${overDisplay}` : ""}</small>
                        </div>
                    </div>

                    {/* Live Score */}
                    <h3 className="fw-bold text-primary mb-1">{totalRuns} - {wickets}</h3>
                    <p className="fs-6 text-muted mb-2">Overs: {overDisplay}</p>

                    {/* Result */}
                    {result && (
                        <div className="alert alert-success py-1 px-2 fs-6 fw-semibold mb-0">
                            {result}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
</div>
    );
}
