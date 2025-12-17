import React, { useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  ScrollView,
  TouchableOpacity,
} from "react-native";

export interface KickoffBet {
  selection_name: string;
  price_format: string;
  price: string;
}

export interface KickoffFixture {
  component: "fixture";
  league_name: string;
  league_id?: string;
  home_team_name: string;
  away_team_name: string;
  home_team_logo?: string;
  away_team_logo?: string;
  home_score?: number;
  away_score?: number;
  status: "kicked-off" | "scheduled" | "finished";
  event_start_date: string;
  match_time?: string;
  bets: KickoffBet[];
}

type Props = {
  data: KickoffFixture[];
  isNewSession?: boolean;
};

function formatMatchTime(dateString: string) {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatLeagueHeader(league: string) {
  return league;
}

function KickoffRow({
  fixture,
  index,
}: {
  fixture: KickoffFixture;
  index: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const matchTime =
    fixture.match_time || formatMatchTime(fixture.event_start_date);
  const isKickedOff = fixture.status === "kicked-off";

  return (
    <Animated.View
      style={[
        styles.tableRow,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
      {/* Teams and Scores Column */}
      <View style={styles.teamsCell}>
        {/* Home Team */}
        <View style={styles.teamRowHorizontal}>
          <View style={styles.logoPlaceholder}>
            {fixture.home_team_logo ? (
              <Image
                source={{ uri: fixture.home_team_logo }}
                style={styles.teamLogo}
              />
            ) : (
              <Text style={styles.logoText}>
                {fixture.home_team_name.charAt(0)}
              </Text>
            )}
          </View>
          <Text style={[styles.teamName, styles.flexGrow]}>
            {fixture.home_team_name}
          </Text>
          {isKickedOff && (
            <View style={styles.scoreBox}>
              <Text style={styles.scoreText}>{fixture.home_score ?? 0}</Text>
            </View>
          )}
        </View>

        {/* Away Team */}
        <View style={styles.teamRowHorizontal}>
          <View style={styles.logoPlaceholder}>
            {fixture.away_team_logo ? (
              <Image
                source={{ uri: fixture.away_team_logo }}
                style={styles.teamLogo}
              />
            ) : (
              <Text style={styles.logoText}>
                {fixture.away_team_name.charAt(0)}
              </Text>
            )}
          </View>
          <Text style={[styles.teamName, styles.flexGrow]}>
            {fixture.away_team_name}
          </Text>
          {isKickedOff && (
            <View style={styles.scoreBox}>
              <Text style={styles.scoreText}>{fixture.away_score ?? 0}</Text>
            </View>
          )}
        </View>

        {/* Match Time */}
        <Text style={styles.matchTimeText}>{matchTime}</Text>
      </View>

      {/* Odds Columns */}
      {fixture.bets.map((bet, idx) => (
        <TouchableOpacity
          key={`${bet.selection_name}-${idx}`}
          style={styles.oddsCell}
          activeOpacity={0.7}>
          <View style={styles.oddContainer}>
            <Text style={styles.priceText}>{bet.price}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
}

export function KickoffTable({ data, isNewSession }: Props) {
  // Group fixtures by league
  const groupedFixtures = useMemo(() => {
    const map: Record<string, KickoffFixture[]> = {};
    data.forEach((f) => {
      const leagueKey = f.league_name || "Unknown League";
      if (!map[leagueKey]) map[leagueKey] = [];
      map[leagueKey].push(f);
    });
    return map;
  }, [data]);

  return (
    <>

      <ScrollView
        style={styles.scrollView}
        horizontal
        showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Iterate over grouped leagues */}
          {Object.entries(groupedFixtures).map(([league, fixtures]) => (
            <View key={league}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={styles.leagueHeader}>
                  <Text style={styles.headerText}>
                    {formatLeagueHeader(league)}
                  </Text>
                </View>
                {fixtures[0].bets.map((bet, idx) => (
                  <View key={idx} style={styles.oddsHeader}>
                    <Text style={styles.headerText}>{bet.selection_name}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.headerDivider} />

              {/* Table Rows */}
              {fixtures.map((fixture, idx) => (
                <KickoffRow key={idx} fixture={fixture} index={idx} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    borderRadius: 10,
  },

  table: {
    minWidth: "100%",
    backgroundColor: "#F2F2F7",
  },

  flexGrow: {
    flexGrow: 1,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E5E5EA",
    borderBottomWidth: 1,
    borderBottomColor: "#D5D5D7",
    paddingVertical: 10, 
  },

  leagueHeader: {
    width: 170,
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  oddsHeader: {
    width: 70, 
    justifyContent: "center",
    alignItems: "center",
  },

  headerText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1C1C1E",
    textTransform: "uppercase",
  },

  headerDivider: {
    height: 1,
    backgroundColor: "#D5D5D7",
  },

 
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#D5D5D7",
    backgroundColor: "#FFF",
    paddingVertical: 12, 
  },


  teamsCell: {
    width: 170, 
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  teamRowHorizontal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },

  logoPlaceholder: {
    width: 26, 
    height: 26,
    borderRadius: 4,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  teamLogo: {
    width: 26,
    height: 26,
    borderRadius: 4,
    resizeMode: "contain",
  },

  logoText: {
    fontSize: 12,
    fontWeight: "700",
  },

  teamName: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#1C1C1E",
  },

  matchTimeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 6,
  },


  scoreBox: {
    width: 23,
    height: 21,
    borderWidth: 1,
    borderColor: "#D5D5D7",
    borderRadius: 4,
    backgroundColor: "#f2f2f2ff",
    justifyContent: "center",
    alignItems: "center",
  },

  scoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1C1E",
  },


  oddsCell: {
    width: 70,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: "8%",
  },

  oddContainer: {
    alignItems: "center",
    gap: 3,
  },

  priceText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#007AFF",
  },
});
