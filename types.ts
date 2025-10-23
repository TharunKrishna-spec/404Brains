

export interface Team {
  id: number;
  name: string;
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

// FIX: Added the missing 'Message' type definition, which is used in ChatBox.tsx.
export interface Message {
  id: number;
  sender: string;
  text: string;
  created_at: string;
}