import React, { useMemo } from "react";
import { UnifiedFixture } from "../../types/chat";

function TeamDisplay({
  name,
  logo,
  score,
  isHome,
  showScore,
}: {
  name: string;
  logo?: string;
  score?: number;
  isHome: boolean;
  showScore: boolean;
}) {
  return (
    <div className="team-display">
      <img
        src={logo || "/placeholder.png"}
        alt={name}
        className="logo"
        onError={(e) => {
          // Fallback if image fails
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <div className="name" title={name}>
        {name}
      </div>
    </div>
  );
}

function CarouselCard({ fixture }: { fixture: UnifiedFixture }) {
  const isKickedOff = fixture.status === "kicked-off";
  const isFinished = fixture.status === "finished";

  // Helpers
  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateLabel = (dateString: string) => {
    return new Date(dateString)
      .toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
      .toUpperCase();
  };

  return (
    <div className="carousel-card">
      <div className="card-header">
        <span>{fixture.league_name || "LEAGUE"}</span>
        <span>{formatDateLabel(fixture.event_start_date)}</span>
      </div>

      <div className="match-banner">
        <span className="upcoming-badge">
          {isFinished
            ? "FT"
            : `Kick Off: ${formatMatchTime(fixture.event_start_date)}`}
        </span>
      </div>

      <div className="main-row">
        <TeamDisplay
          name={fixture.home_team_name}
          logo={fixture.home_team_logo}
          isHome={true}
          showScore={isKickedOff || isFinished}
          score={fixture.home_score}
        />

        <div className="scoreboard">
          {isKickedOff || isFinished ? (
            <span>
              {fixture.home_score ?? 0} - {fixture.away_score ?? 0}
            </span>
          ) : (
            <span>VS</span>
          )}
        </div>

        <TeamDisplay
          name={fixture.away_team_name}
          logo={fixture.away_team_logo}
          isHome={false}
          showScore={isKickedOff || isFinished}
          score={fixture.away_score}
        />
      </div>

      <div className="odds-row">
        {fixture.bets.slice(0, 3).map((bet, idx) => (
          <div key={idx} className="odd-pill">
            <span className="odd-label">{bet.selection_name}</span>
            <span className="odd-value">{bet.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UnifiedFixtureTable({ data }: { data: UnifiedFixture[] }) {
  // Logic to separate Today, Upcoming, Finished similar to RN
  const { todayList, upcomingList, finishedList } = useMemo(() => {
    const today: UnifiedFixture[] = [];
    const upcoming: UnifiedFixture[] = [];
    const finished: UnifiedFixture[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    data.forEach((fixture) => {
      if (fixture.status === "finished") {
        finished.push(fixture);
      } else if (
        fixture.status === "kicked-off" ||
        fixture.status === "prematch"
      ) {
        today.push(fixture);
      } else {
        const fDate = new Date(fixture.event_start_date);
        if (fDate.toISOString().split("T")[0] === todayStr) {
          today.push(fixture);
        } else {
          upcoming.push(fixture);
        }
      }
    });

    // Sort logic omitted for brevity, but can be added
    return { todayList: today, upcomingList: upcoming, finishedList: finished };
  }, [data]);

  return (
    <div className="unified-fixture-table">
      {/* Today Section */}
      {todayList.length > 0 && (
        <div className="section">
          <h4
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              margin: "8px 0",
              color: "#333",
            }}>
            TODAY'S GAMES
          </h4>
          <div className="carousel-container">
            {todayList.map((f, i) => (
              <CarouselCard key={i} fixture={f} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Section */}
      {upcomingList.length > 0 && (
        <div className="section">
          <h4
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              margin: "8px 0",
              color: "#666",
            }}>
            UPCOMING GAMES
          </h4>
          <div className="carousel-container">
            {upcomingList.map((f, i) => (
              <CarouselCard key={i} fixture={f} />
            ))}
          </div>
        </div>
      )}

      {/* Finished Section */}
      {finishedList.length > 0 && (
        <div className="section">
          <h4
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              margin: "8px 0",
              color: "#666",
            }}>
            PAST RESULTS
          </h4>
          <div className="carousel-container">
            {finishedList.map((f, i) => (
              <CarouselCard key={i} fixture={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
