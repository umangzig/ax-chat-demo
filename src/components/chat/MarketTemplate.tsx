import React from "react";
import { MarketTemplateData } from "../../types/chat";

type Props = {
  data: MarketTemplateData;
};

export function MarketTemplate({ data }: Props) {
  const getTeamNames = () => {
    if (data.sport_event_name.includes(" vs ")) {
      const parts = data.sport_event_name.split(" vs ");
      return { homeTeam: parts[0].trim(), awayTeam: parts[1].trim() };
    }
    return null;
  };

  const teamNames = getTeamNames();

  const formatOdds = (odds: string | number | null | undefined): string => {
    if (odds === null || odds === undefined) return "-";
    const oddsStr = String(odds).trim();
    return oddsStr === "" ? "-" : oddsStr;
  };

  const formattedOdds = formatOdds(data.odds);
  const hasBothLogos = data.home_team_logo_url && data.away_team_logo_url;
  const singleLogoUrl = data.home_team_logo_url || data.away_team_logo_url;
  const showScores = data.status === "kicked-off" || data.status === "finished";

  return (
    <div className="market-card">
      <div className="market-content">
        {/* Header */}
        <div className="market-header">
          {data.status === "prematch" && `${data.event_start_time} - `}
          {data.league_name && `${data.league_name}`}
        </div>

        {/* Main Teams Row */}
        <div className="teams-row">
          {/* Show logos on sides ONLY when both exist */}
          {hasBothLogos && (
            <div className="logo-box">
              <img
                src={data.home_team_logo_url}
                alt="Home Logo"
                className="team-logo"
              />
            </div>
          )}

          <div className="team-name home">{teamNames?.homeTeam || "Team"}</div>

          <div className="center-section">
            {showScores && (
              <div className="score-box">{data.home_team_score ?? "0"}</div>
            )}
            <div className="divider">{showScores ? " | " : " vs "}</div>
            {showScores && (
              <div className="score-box">{data.away_team_score ?? "0"}</div>
            )}
          </div>

          <div className="team-name away">{teamNames?.awayTeam || "Team"}</div>

          {hasBothLogos && (
            <div className="logo-box">
              <img
                src={data.away_team_logo_url}
                alt="Away Logo"
                className="team-logo"
              />
            </div>
          )}
        </div>

        {/* Match Time */}
        {showScores && data.match_time && (
          <div
            style={{
              textAlign: "center",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}>
            {data.match_time}
          </div>
        )}

        {/* Bet Narrative + Odds Row */}
        <div className="narrative-row">
          <div className="narrative-container">
            {/* Single logo appears here if only one exists */}
            {!hasBothLogos && singleLogoUrl && (
              <div className="logo-box" style={{ width: 28, height: 28 }}>
                <img
                  src={singleLogoUrl}
                  style={{ width: "80%", height: "80%" }}
                  alt="Logo"
                />
              </div>
            )}
            <div className="bet-narrative">{data.bet_display_narrative}</div>
          </div>

          <button
            className="odds-button"
            onClick={() => console.log("Bet placed")}>
            {formattedOdds}
          </button>
        </div>
      </div>

      {/* Insight Banner */}
      {data.insight?.trim() && (
        <div className="insight-banner">{data.insight}</div>
      )}
    </div>
  );
}
