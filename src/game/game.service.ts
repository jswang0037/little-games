export enum GameName {
  GENERAL_KNOWLEDGE = 'GeneralKnowledge',
  COLOR_CHALLENGE = 'ColorChallenge',
}

export enum InstructionType {
  TextColor = 'TextColor', // Match the color of the text
  TextMeaning = 'TextMeaning', // Match the meaning of the text
}

export interface ColorChallengeConfig {
  rounds: number;
  timeLimitPerRound: number;
  pointCorrect: number;
  pointIncorrect: number;
  pointFastestBonus: number;
  instructionChangePerRound: boolean;
  initialInstructionType: InstructionType; // Updated
}

export interface GeneralKnowledgeConfig {
  questions: number;
  timeLimitPerQuestion: number;
  pointCorrect: number;
  pointIncorrect: number;
}

export interface GameCreateAttr {
  name: GameName;
  config: GeneralKnowledgeConfig | ColorChallengeConfig; // Add other config types here
  hostId: string;
}

// Define GameResult here as per subtask instructions
// This might need to be reconciled if GameResult is defined elsewhere in a more complex way
export interface GameResult {
  playerId: string; // Assuming this is the user's ID
  score?: number;
  // If UserAttr is available and needed:
  // player?: UserAttr; // To store player details if needed for results display
  // Add other fields that might be part of a result, e.g. specific answers, times per round etc.
  // For ColorChallenge, detailed round submissions could be:
  // roundSubmissions?: Array<{ round: number, choice: string, time: number, correct: boolean }>;
}

export interface GameAttr extends GameCreateAttr {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'active' | 'completed' | 'archived';
  round?: number; // Add round to GameAttr for Color Challenge
  results?: GameResult[]; // Add results to GameAttr
  // Or, if scores are stored in a map within GameAttr:
  // playerScores?: { [playerId: string]: number };
}
