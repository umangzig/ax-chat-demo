export type Role = "user" | "assistant" | "system";

export interface UnifiedBet {
  selection_name: string;
  price_format: string;
  price: string;
}

export interface UnifiedFixture {
  component: "fixture";
  league_name: string;
  league_id?: string;
  home_team_name: string;
  away_team_name: string;
  home_team_logo?: string;
  away_team_logo?: string;
  home_score?: number;
  away_score?: number;
  status: "kicked-off" | "prematch" | "scheduled" | "finished";
  event_start_date: string;
  match_time?: string;
  bets: UnifiedBet[];
}

export interface MarketTemplateData {
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
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  createdAt: number; // epoch ms
  isNewSession?: boolean;
  rawData?: {
    components?: Array<MarketTemplateData | UnifiedFixture | any>;
  };
}

export interface Session {
  sessionId: string;
  websocketUrl: string;
  websocketToken: string;
  expiresIn: number; // seconds
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error"
  | "closed";
