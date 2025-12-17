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
  Dimensions,
  Platform,
  useWindowDimensions,
} from "react-native";
import { UnifiedFixture, UnifiedFixtureTableProps } from "../types/chat";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.8; // Show peek of next card

// --- Helpers ---

function formatMatchTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatMatchDateTime(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  return date
    .toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toUpperCase();
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// --- Carousel Components ---

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
    <View style={styles.teamContainer}>
      <View style={styles.teamContent}>
        {/* Logo */}
        <View style={styles.logoWrapper}>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.logo} />
          ) : (
            <View style={styles.placeholderLogo}>
              <Text style={styles.placeholderText}>{name.charAt(0)}</Text>
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={styles.teamName} numberOfLines={2}>
          {name}
        </Text>
      </View>
    </View>
  );
}

function CarouselCard({
  fixture,
  index,
}: {
  fixture: UnifiedFixture;
  index: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isKickedOff = fixture.status === "kicked-off";
  const isFinished = fixture.status === "finished";
  const dateLabel = formatDateLabel(fixture.event_start_date);

  const todayStr = new Date().toISOString().split("T")[0];
  const fixtureDateStr = new Date(fixture.event_start_date)
    .toISOString()
    .split("T")[0];
  const isToday = todayStr === fixtureDateStr;

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}>
      {/* League Header (Internal to card now for Carousel) */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardLeagueText} numberOfLines={1}>
          {fixture.league_name || "LEAGUE"}
        </Text>
        <View style={styles.dateTag}>
          <Text style={styles.dateTagText}>{dateLabel}</Text>
        </View>
      </View>

      {/* Top Banner: Status/Time */}
      <View style={styles.matchBanner}>
        <View style={styles.upcomingBadge}>
          <Text style={styles.upcomingText}>
            {isFinished
              ? "FT"
              : `Kick Off: ${formatMatchTime(fixture.event_start_date)}`}
          </Text>
        </View>
      </View>

      {/* Main Match Info */}
      <View style={styles.mainRow}>
        {/* Left Team (Home) */}
        <TeamDisplay
          name={fixture.home_team_name}
          logo={fixture.home_team_logo}
          isHome={true}
          showScore={isKickedOff || isFinished}
          score={fixture.home_score}
        />

        {/* Center Scoreboard */}
        <View style={styles.scoreboardContainer}>
          {isKickedOff || isFinished ? (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreNum}>{fixture.home_score ?? 0}</Text>
              <View style={styles.scoreDivider} />
              <Text style={styles.scoreNum}>{fixture.away_score ?? 0}</Text>
            </View>
          ) : (
            <View style={styles.vsBadge}>
              <Text style={styles.vsText}>VS</Text>
            </View>
          )}
        </View>

        {/* Right Team (Away) */}
        <TeamDisplay
          name={fixture.away_team_name}
          logo={fixture.away_team_logo}
          isHome={false}
          showScore={isKickedOff || isFinished}
          score={fixture.away_score}
        />
      </View>

      {/* Odds Bottom Row */}
      <View style={styles.oddsRow}>
        {fixture.bets.slice(0, 3).map((bet, idx) => (
          <TouchableOpacity key={idx} style={styles.oddPill}>
            <Text style={styles.oddLabel}>{bet.selection_name}</Text>
            <Text style={styles.oddValue}>{bet.price}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

// --- Table Components ---

function UnifiedFixtureRow({
  fixture,
  index,
  teamsCellWidth,
  oddsCellWidth,
}: {
  fixture: UnifiedFixture;
  index: number;
  teamsCellWidth?: number;
  oddsCellWidth?: number;
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

  const isKickedOff = fixture.status === "kicked-off";
  const isFinished = fixture.status === "finished";

  const todayStr = new Date().toISOString().split("T")[0];
  const fixtureDateStr = new Date(fixture.event_start_date)
    .toISOString()
    .split("T")[0];
  const isToday = todayStr === fixtureDateStr;

  return (
    <Animated.View
      style={[
        styles.tableRow,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
      {/* Teams and Scores/Time Column */}
      <View
        style={[
          styles.teamsCell,
          teamsCellWidth ? { width: teamsCellWidth } : {},
        ]}>
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
          <Text
            style={[styles.tableTeamName, styles.flexGrow]}
            numberOfLines={1}>
            {fixture.home_team_name}
          </Text>
          {(isKickedOff || isFinished) && (
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
          <Text
            style={[styles.tableTeamName, styles.flexGrow]}
            numberOfLines={1}>
            {fixture.away_team_name}
          </Text>
          {(isKickedOff || isFinished) && (
            <View style={styles.scoreBox}>
              <Text style={styles.scoreText}>{fixture.away_score ?? 0}</Text>
            </View>
          )}
        </View>

        {/* Display Time or Match Status */}
        <View style={styles.timeContainer}>
          {isKickedOff ? (
            <>
              {isToday && (
                <View style={{ marginBottom: 4 }}>
                  <Text
                    style={{
                      color: "#FF3B30",
                      fontSize: 10,
                      fontWeight: "800",
                    }}>
                    LIVE
                  </Text>
                </View>
              )}
              {fixture.match_time && (
                <Text style={styles.elapsedTimeText}>{fixture.match_time}</Text>
              )}
              <Text style={styles.matchDateText}>
                {formatMatchDateTime(fixture.event_start_date)}
              </Text>
            </>
          ) : isFinished ? (
            <Text style={styles.matchTimeText}>FT</Text>
          ) : (
            <Text style={styles.matchTimeText}>
              KO: {formatMatchTime(fixture.event_start_date)}
            </Text>
          )}
        </View>
      </View>

      {/* Odds Columns */}
      {fixture.bets.slice(0, 3).map((bet, idx) => (
        <TouchableOpacity
          key={`${bet.selection_name}-${idx}`}
          style={[
            styles.oddsCell,
            oddsCellWidth ? { width: oddsCellWidth } : {},
          ]}
          activeOpacity={0.7}>
          <View style={styles.oddContainer}>
            <Text style={styles.priceText}>{bet.price}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
}

// --- Main Carousel Component ---
export function FixtureCardCarousel({
  data,
  isNewSession,
}: UnifiedFixtureTableProps) {
  const todayScrollRef = useRef<ScrollView>(null);
  const upcomingScrollRef = useRef<ScrollView>(null);
  const finishedScrollRef = useRef<ScrollView>(null);
  const animationActiveRef = useRef(false);
  const shouldStopAnimationRef = useRef(false);

  const { todayList, upcomingList, finishedList } = useMemo(() => {
    const today: UnifiedFixture[] = [];
    const upcoming: UnifiedFixture[] = [];
    const finished: UnifiedFixture[] = [];

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    data.forEach((fixture) => {
      const isStatusToday =
        fixture.status === "kicked-off" || fixture.status === "prematch";
      const isStatusUpcoming = fixture.status === "scheduled";
      const isStatusFinished = fixture.status === "finished";

      if (isStatusFinished) {
        finished.push(fixture);
      } else if (isStatusToday) {
        today.push(fixture);
      } else if (isStatusUpcoming) {
        upcoming.push(fixture);
      } else {
        const fDate = new Date(fixture.event_start_date);
        const fDateStr = fDate.toISOString().split("T")[0];
        if (fDateStr === todayStr) {
          today.push(fixture);
        } else {
          upcoming.push(fixture);
        }
      }
    });

    today.sort(
      (a, b) =>
        new Date(a.event_start_date).getTime() -
        new Date(b.event_start_date).getTime()
    );
    upcoming.sort(
      (a, b) =>
        new Date(a.event_start_date).getTime() -
        new Date(b.event_start_date).getTime()
    );
    finished.sort(
      (a, b) =>
        new Date(b.event_start_date).getTime() -
        new Date(a.event_start_date).getTime()
    );

    return { todayList: today, upcomingList: upcoming, finishedList: finished };
  }, [data]);

  useEffect(() => {
    const showScrollHint = (scrollRef: React.RefObject<ScrollView>) => {
      let count = 0;
      const maxRepeats = 3;
      animationActiveRef.current = true;
      shouldStopAnimationRef.current = false;

      const animateScroll = () => {
        if (count >= maxRepeats || shouldStopAnimationRef.current) {
          animationActiveRef.current = false;
          return;
        }

        setTimeout(
          () => {
            if (shouldStopAnimationRef.current) {
              animationActiveRef.current = false;
              return;
            }

            scrollRef.current?.scrollTo({ x: 80, animated: true });
            setTimeout(() => {
              if (shouldStopAnimationRef.current) {
                animationActiveRef.current = false;
                return;
              }

              scrollRef.current?.scrollTo({ x: 0, animated: true });
              count++;
              animateScroll();
            }, 1000);
          },
          count === 0 ? 500 : 800
        );
      };

      animateScroll();
    };

    if (todayScrollRef.current && todayList.length > 1) {
      showScrollHint(todayScrollRef);
    }
    if (upcomingScrollRef.current && upcomingList.length > 1) {
      showScrollHint(upcomingScrollRef);
    }
    if (finishedScrollRef.current && finishedList.length > 1) {
      showScrollHint(finishedScrollRef);
    }
  }, [todayList.length, upcomingList.length, finishedList.length]);

  const handleScrollBegin = () => {
    if (animationActiveRef.current) {
      shouldStopAnimationRef.current = true;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {todayList.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S GAMES</Text>
            <View style={styles.sectionLine} />
          </View>
          <ScrollView
            ref={todayScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + 12}
            onScrollBeginDrag={handleScrollBegin}>
            {todayList.map((fixture, idx) => (
              <CarouselCard key={idx} fixture={fixture} index={idx} />
            ))}
          </ScrollView>
        </View>
      )}

      {upcomingList.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>UPCOMING GAMES</Text>
            <View
              style={[styles.sectionLine, { backgroundColor: "#8F9BB3" }]}
            />
          </View>
          <ScrollView
            ref={upcomingScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + 12}
            onScrollBeginDrag={handleScrollBegin}>
            {upcomingList.map((fixture, idx) => (
              <CarouselCard key={idx} fixture={fixture} index={idx} />
            ))}
          </ScrollView>
        </View>
      )}

      {finishedList.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PAST RESULTS</Text>
            <View
              style={[styles.sectionLine, { backgroundColor: "#8F9BB3" }]}
            />
          </View>
          <ScrollView
            ref={finishedScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + 12}
            onScrollBeginDrag={handleScrollBegin}>
            {finishedList.map((fixture, idx) => (
              <CarouselCard key={idx} fixture={fixture} index={idx} />
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

// --- Table View Component ---
export function FixtureTableView({
  data,
  isNewSession,
}: UnifiedFixtureTableProps) {
  const { width } = useWindowDimensions();

  // Calculate responsive column widths with proper spacing
  // Account for 16px margin on each side (32px total)
  const availableWidth = width - 32; // Account for container padding
  const teamsCellWidth = availableWidth * 0.46; // 46% for teams
  const oddsCellWidth = availableWidth * 0.18; // 18% per odds column (3 columns = 54%)

  const organizedData = useMemo(() => {
    const result: Record<
      string,
      Record<
        string,
        {
          inPlay: UnifiedFixture[];
          upcoming: UnifiedFixture[];
          finished: UnifiedFixture[];
        }
      >
    > = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    data.forEach((fixture) => {
      const fixtureDateTime = new Date(fixture.event_start_date);
      const fixtureDate = new Date(fixtureDateTime);
      fixtureDate.setHours(0, 0, 0, 0);

      const dateKey = fixtureDate.toISOString().split("T")[0];
      const leagueKey = fixture.league_name || "Unknown League";

      if (!result[dateKey]) {
        result[dateKey] = {};
      }
      if (!result[dateKey][leagueKey]) {
        result[dateKey][leagueKey] = {
          inPlay: [],
          upcoming: [],
          finished: [],
        };
      }

      if (fixture.status === "kicked-off") {
        result[dateKey][leagueKey].inPlay.push(fixture);
      } else if (fixture.status === "finished") {
        result[dateKey][leagueKey].finished.push(fixture);
      } else {
        result[dateKey][leagueKey].upcoming.push(fixture);
      }
    });

    Object.keys(result).forEach((date) => {
      Object.keys(result[date]).forEach((league) => {
        result[date][league].inPlay.sort(
          (a, b) =>
            new Date(a.event_start_date).getTime() -
            new Date(b.event_start_date).getTime()
        );
        result[date][league].upcoming.sort(
          (a, b) =>
            new Date(a.event_start_date).getTime() -
            new Date(b.event_start_date).getTime()
        );
        result[date][league].finished.sort(
          (a, b) =>
            new Date(b.event_start_date).getTime() -
            new Date(a.event_start_date).getTime()
        );
      });
    });

    return result;
  }, [data]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDate = today.toISOString().split("T")[0];

  const pastDates = Object.keys(organizedData)
    .filter((date) => date < todayDate)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Most recent first

  const futureDates = Object.keys(organizedData)
    .filter((date) => date > todayDate)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()); // Nearest first

  const hasTodayMatches = !!organizedData[todayDate];

  return (
    <View style={styles.tableContainer}>
      {/* Today Games Section */}
      {hasTodayMatches && (
        <View style={styles.tableSection}>
          <Text style={styles.tableSectionTitle}>Today's Games</Text>

          {Object.entries(organizedData[todayDate]).map(
            ([league, leagueData]) => {
              const allMatches = [
                ...leagueData.inPlay,
                ...leagueData.upcoming,
                ...leagueData.finished,
              ];
              if (allMatches.length === 0) return null;

              return (
                <View key={league} style={styles.leagueGroup}>
                  {/* League Header */}
                  <View style={styles.tableHeader}>
                    <View
                      style={[
                        styles.leagueHeaderCell,
                        { width: teamsCellWidth },
                      ]}>
                      <Text style={styles.headerText} numberOfLines={1}>
                        {league}
                      </Text>
                    </View>
                    {allMatches[0].bets.slice(0, 3).map((bet, idx) => (
                      <View
                        key={idx}
                        style={[styles.oddsHeader, { width: oddsCellWidth }]}>
                        <Text style={styles.headerText}>
                          {bet.selection_name}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.headerDivider} />

                  {/* In-Play Matches */}
                  {leagueData.inPlay.map((fixture, idx) => (
                    <UnifiedFixtureRow
                      key={`inplay-${idx}`}
                      fixture={fixture}
                      index={idx}
                      teamsCellWidth={teamsCellWidth}
                      oddsCellWidth={oddsCellWidth}
                    />
                  ))}

                  {/* Divider */}
                  {(leagueData.inPlay.length > 0 ||
                    leagueData.finished.length > 0) &&
                    leagueData.upcoming.length > 0 && (
                      <View style={styles.sectionDivider} />
                    )}

                  {/* Upcoming Matches */}
                  {leagueData.upcoming.map((fixture, idx) => (
                    <UnifiedFixtureRow
                      key={`upcoming-${idx}`}
                      fixture={fixture}
                      index={
                        leagueData.inPlay.length +
                        leagueData.finished.length +
                        idx
                      }
                      teamsCellWidth={teamsCellWidth}
                      oddsCellWidth={oddsCellWidth}
                    />
                  ))}

                  {/* Finished Divider */}
                  {leagueData.upcoming.length > 0 &&
                    leagueData.finished.length > 0 && (
                      <View style={styles.sectionDivider} />
                    )}

                  {/* Finished Matches */}
                  {leagueData.finished.map((fixture, idx) => (
                    <UnifiedFixtureRow
                      key={`finished-${idx}`}
                      fixture={fixture}
                      index={
                        leagueData.inPlay.length +
                        leagueData.upcoming.length +
                        idx
                      }
                      teamsCellWidth={teamsCellWidth}
                      oddsCellWidth={oddsCellWidth}
                    />
                  ))}
                </View>
              );
            }
          )}
        </View>
      )}

      {/* Upcoming Games Section */}
      {futureDates.length > 0 && (
        <View style={styles.tableSection}>
          <Text style={styles.tableSectionTitle}>Upcoming Games</Text>
          {futureDates.map((date) =>
            Object.entries(organizedData[date]).map(([league, leagueData]) => {
              const allMatches = [
                ...leagueData.inPlay,
                ...leagueData.upcoming,
                ...leagueData.finished,
              ];
              if (allMatches.length === 0) return null;

              const displayDate = new Date(date + "T00:00:00");

              return (
                <View key={`${date}-${league}`} style={styles.leagueGroup}>
                  <View style={styles.tableHeader}>
                    <View
                      style={[
                        styles.leagueHeaderCell,
                        { width: teamsCellWidth },
                      ]}>
                      <Text style={styles.headerText} numberOfLines={1}>
                        {formatDateHeader(displayDate.toISOString())}
                      </Text>
                    </View>
                    {allMatches[0].bets.slice(0, 3).map((bet, idx) => (
                      <View
                        key={idx}
                        style={[styles.oddsHeader, { width: oddsCellWidth }]}>
                        <Text style={styles.headerText}>
                          {bet.selection_name}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.headerDivider} />
                  {allMatches.map((fixture, idx) => (
                    <UnifiedFixtureRow
                      key={`${date}-${league}-${idx}`}
                      fixture={fixture}
                      index={idx}
                      teamsCellWidth={teamsCellWidth}
                      oddsCellWidth={oddsCellWidth}
                    />
                  ))}
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Results Section */}
      {pastDates.length > 0 && (
        <View style={styles.tableSection}>
          <Text style={styles.tableSectionTitle}>Past Results</Text>
          {pastDates.map((date) =>
            Object.entries(organizedData[date]).map(([league, leagueData]) => {
              // For past dates, we only care about finished matches
              const finishedMatches = leagueData.finished;
              if (finishedMatches.length === 0) return null;

              return (
                <View key={`${date}-${league}`} style={styles.leagueGroup}>
                  <View style={styles.tableHeader}>
                    <View
                      style={[
                        styles.leagueHeaderCell,
                        { width: teamsCellWidth },
                      ]}>
                      <Text style={styles.headerText} numberOfLines={1}>
                        {formatDateHeader(date + "T00:00:00")}
                      </Text>
                    </View>
                    {finishedMatches[0].bets.slice(0, 3).map((bet, idx) => (
                      <View
                        key={idx}
                        style={[styles.oddsHeader, { width: oddsCellWidth }]}>
                        <Text style={styles.headerText}>
                          {bet.selection_name}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.headerDivider} />
                  {finishedMatches.map((fixture, idx) => (
                    <UnifiedFixtureRow
                      key={`${date}-${league}-${idx}`}
                      fixture={fixture}
                      index={idx}
                      teamsCellWidth={teamsCellWidth}
                      oddsCellWidth={oddsCellWidth}
                    />
                  ))}
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

// Main export - routes to correct component based on data
export function UnifiedFixtureTable({
  data,
  isNewSession,
}: UnifiedFixtureTableProps) {
  const hasTableComponent = (data as any[]).some(
    (f) => f.component === "fixture_table"
  );

  if (hasTableComponent) {
    return <FixtureTableView data={data} isNewSession={isNewSession} />;
  }

  return <FixtureCardCarousel data={data} isNewSession={isNewSession} />;
}

const styles = StyleSheet.create({
  // Carousel Styles
  container: {
    backgroundColor: "#F2F2F7",
  },
  contentContainer: {
    paddingVertical: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1C1C1E",
    letterSpacing: 0.5,
  },
  sectionLine: {
    height: 2,
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 1,
    opacity: 0.5,
  },
  carouselContainer: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },

  // CARD
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    backgroundColor: "#1A2138",
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeagueText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
    flex: 1,
    marginRight: 8,
  },
  dateTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dateTagText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },

  matchBanner: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 6,
    backgroundColor: "#F9F9F9",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  upcomingBadge: {},
  upcomingText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8E8E93",
    textTransform: "uppercase",
  },

  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },

  // Teams
  teamContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  teamContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  teamName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222B45",
    flex: 1,
  },
  logoWrapper: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logo: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  placeholderLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E4E9F2",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8F9BB3",
  },

  // Scoreboard
  scoreboardContainer: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  scoreBadge: {
    flexDirection: "row",
    backgroundColor: "#1A2138",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  scoreNum: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFF",
    fontVariant: ["tabular-nums"],
  },
  scoreDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 6,
  },
  vsBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
  },
  vsText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8E8E93",
  },

  // Odds Bottom Row
  oddsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 0,
  },
  oddPill: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  oddLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8E8E93",
    marginBottom: 0,
    textTransform: "uppercase",
  },
  oddValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#007AFF",
  },

  // Table View Styles
  scrollView: {
    borderRadius: 10,
  },
  tableContainer: {
    backgroundColor: "#FFFFFF",
    marginVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.08)",
        shadowOpacity: 1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tableSection: {
    marginBottom: 24,
  },
  tableSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#E5E5EA",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  leagueGroup: {
    marginBottom: 0,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E5E5EA",
    borderBottomWidth: 1,
    borderBottomColor: "#D5D5D7",
    paddingVertical: 10,
  },
  leagueHeaderCell: {
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
  sectionDivider: {
    height: 2,
    backgroundColor: "#C7C7CC",
    marginVertical: 0,
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
  flexGrow: {
    flexGrow: 1,
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
  tableTeamName: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#1C1C1E",
  },
  timeContainer: {
    marginTop: 6,
    gap: 2,
  },
  matchTimeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8E8E93",
  },
  elapsedTimeText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#8E8E93",
  },
  matchDateText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#8E8E93",
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
