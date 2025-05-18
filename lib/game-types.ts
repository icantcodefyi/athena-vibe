export type PlayerRole = 'villager' | 'mafia' | 'detective' | 'doctor';

export type PlayerGender = 'male' | 'female';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  gender: PlayerGender;
  isAlive: boolean;
  isHost?: boolean;
  isAI: boolean;  // Flag to indicate if this is an AI-controlled player
  lastMessage?: string; // Last message from this player
}

export type GamePhase = 'lobby' | 'role-assignment' | 'day' | 'voting' | 'night' | 'results';

export interface ChatMessage {
  playerId: string;
  playerName: string;
  content: string;
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  dayCount: number;
  votingResults: Record<string, string[]>; // playerId -> [voterIds]
  nightActions: {
    mafiaTarget?: string;
    detectiveTarget?: string;
    doctorTarget?: string;
  };
  lastEliminated?: Player;
  gameOver: boolean;
  winner?: 'villagers' | 'mafia';
  messages: string[];
  chatMessages: ChatMessage[]; // New field for player chat messages
  aiThinking: boolean; // Flag to indicate AI players are "thinking"
}

export interface GameSettings {
  mafiaCount: number;
  detectiveCount: number;
  doctorCount: number;
  aiPlayerCount: number; // New setting for AI player count
} 