
export interface Team {
  id: number;
  name: string;
  email: string;
  coins: number;
  user_id: string; 
  domain: string;
}

export interface Clue {
  id: number;
  text: string;
  answer: string;
  image_url?: string;
  link_url?: string;
  video_url?: string;
  domain: string;
}

export interface TeamProgress {
    team_id: number;
    clue_id: number;
    solved_at: string;
}

export interface LeaderboardEntry {
  id: number;
  rank: number;
  team: string;
  coins: number;
  cluesSolved: number;
  lastSolveTime: string | null;
}

export interface Message {
  id: number;
  sender: string;
  text: string;
  created_at: string;
}

// --- NEW: Types for the Marketplace Feature ---
export interface ProblemStatement {
  id: number;
  created_at: string;
  title: string;
  description: string;
  cost: number;
  domain: string;
  // This allows us to join the data easily in the Team Dashboard
  problem_statement_purchases?: ProblemStatementPurchase[];
}

export interface ProblemStatementPurchase {
  id: number;
  created_at: string;
  team_id: number;
  problem_statement_id: number;
  // This allows us to join the data easily in the Team Dashboard
  problem_statements?: ProblemStatement;
}
