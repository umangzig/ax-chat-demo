import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";

export type MarketTemplateData = {
  component: "market_template";
  odds: number | string;
  sport_event_name: string;
  bet_display_narrative: string;
  event_start_time: string;
  league_name?: string;
  home_team_logo_url?: string;
  away_team_logo_url?: string;
  insight?: string;
  status?: "prematch" | "kicked-off" | "scheduled" | "finished";
  home_team_score?: number | string;
  away_team_score?: number | string;
  match_time?: string;
};

type Props = {
  data: MarketTemplateData;
};

export function MarketTemplate({ data }: Props) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 32, 400);

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
  const hasSingleLogo =
    (data.home_team_logo_url || data.away_team_logo_url) && !hasBothLogos;
  const singleLogoUrl = data.home_team_logo_url || data.away_team_logo_url;
  const showScores = data.status === "kicked-off" || data.status === "finished";

  return (
    <View style={[styles.cardContainer, { width: cardWidth }]}>
      <View style={styles.cardContent}>
        {/* Header */}
        <Text style={styles.headerText}>
          {data.status === "prematch" && `${data.event_start_time} - `}
          {data.league_name && `${data.league_name}`}
        </Text>

        {/* Main Teams Row */}
        <View style={styles.teamsRow}>
          {/* Show logos on sides ONLY when both exist */}
          {hasBothLogos && (
            <View style={styles.logoBox}>
              <Image
                source={{ uri: data.home_team_logo_url }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          )}

          <Text style={styles.homeTeamName} numberOfLines={1}>
            {teamNames?.homeTeam || "Team"}
          </Text>

          <View style={styles.centerSection}>
            {showScores && (
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>
                  {data.home_team_score ?? "0"}
                </Text>
              </View>
            )}
            <Text style={styles.divider}>{showScores ? " | " : " vs "}</Text>
            {showScores && (
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>
                  {data.away_team_score ?? "0"}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.awayTeamName} numberOfLines={1}>
            {teamNames?.awayTeam || "Team"}
          </Text>

          {hasBothLogos && (
            <View style={styles.logoBox}>
              <Image
                source={{ uri: data.away_team_logo_url }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        {/* Match Time */}
        {showScores && data.match_time && (
          <View style={styles.matchStatusCenterContainer}>
            <Text style={styles.matchStatusText}>{data.match_time}</Text>
          </View>
        )}

        {/* Bet Narrative + Odds Row */}
        <View style={styles.narrativeOddsRow}>
          <View style={styles.narrativeContainer}>
            {/* Single logo appears here if only one exists */}
            {hasSingleLogo && singleLogoUrl && (
              <View style={styles.singleLogoBox}>
                <Image
                  source={{ uri: singleLogoUrl }}
                  style={styles.singleLogo}
                  resizeMode="contain"
                />
              </View>
            )}
            <Text style={styles.betNarrative}>
              {data.bet_display_narrative}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.oddsButton}
            onPress={() => console.log("Bet placed")}
            activeOpacity={0.7}>
            <Text style={styles.oddsValue}>{formattedOdds}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Insight Banner */}
      {data.insight?.trim() && (
        <View style={styles.insightBanner}>
          <Text style={styles.insightText}>{data.insight}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOpacity: 1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },

  cardContent: { padding: 12, gap: 8 },

  headerText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 4,
  },

  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },

  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  logo: { width: "80%", height: "80%" },

  homeTeamName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1F2937",
    flex: 1,
    textAlign: "left",
    marginLeft: 8,
  },
  awayTeamName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1F2937",
    flex: 1,
    textAlign: "right",
    marginRight: 8,
  },

  centerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  scoreBox: {
    minWidth: 32,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  divider: { fontSize: 14, fontWeight: "700", color: "#9CA3AF" },

  matchStatusCenterContainer: { alignItems: "center", marginTop: 4 },
  matchStatusText: { fontSize: 14, fontWeight: "700", color: "#1F2937" },

  narrativeOddsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },

  narrativeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },

  // Single logo in front of bet narrative
  singleLogoBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  singleLogo: {
    width: "80%",
    height: "80%",
  },

  betNarrative: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: 18,
    flex: 1,
  },

  oddsButton: {
    minWidth: 60,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#155E75",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  oddsValue: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  insightBanner: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E9D5FF",
  },
  insightText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000000ff",
    lineHeight: 16,
  },
});
