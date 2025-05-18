export type PlayerRole = 'villager' | 'mafia' | 'detective' | 'doctor';

export type PlayerGender = 'male' | 'female';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  gender: PlayerGender;
  isAlive: boolean;
  isHost?: boolean;
}

export type GamePhase = 'lobby' | 'role-assignment' | 'day' | 'voting' | 'night' | 'results';

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
}

export interface GameSettings {
  mafiaCount: number;
  detectiveCount: number;
  doctorCount: number;
} 