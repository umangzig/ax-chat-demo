export type Role = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: Role;
  text: string;
  createdAt: number; // epoch ms
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



  export interface FixtureBet {
    selection_name: string;
    price_format: string;
    price: string;
  }
  
  export interface FixtureData {
    component: "fixture";
    home_team_name: string;
    away_team_name: string;
    event_start_date: string;
    home_team_logo?: string;
    away_team_logo?: string;
    bets: FixtureBet[];
  }
  
  export interface FixtureTableProps {
    data: FixtureData[];
    isNewSession?: boolean;
  }
  
  export interface FixtureRowProps {
    fixture: FixtureData;
    index: number;
  }

  export interface RawDataWithComponents {
    components?: Array<{
      component: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  }
  
  export type MessageBubbleProps = {
    message: Message;
    isNewSession?: boolean;
    rawData?: RawDataWithComponents;
  };


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

export type UnifiedFixtureTableProps = {
  data: UnifiedFixture[];
  isNewSession?: boolean;
};

