import { GameSettings, GameState, Player, PlayerRole } from "./game-types";

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Initialize game state
export function initGameState(): GameState {
  return {
    phase: 'lobby',
    players: [],
    dayCount: 0,
    votingResults: {},
    nightActions: {},
    gameOver: false,
    messages: []
  };
}

// Assign roles randomly to players
export function assignRoles(players: Player[], settings: GameSettings): Player[] {
  const playersCopy = [...players];
  const shuffledPlayers = shuffleArray(playersCopy);
  
  const roleCount = {
    mafia: settings.mafiaCount,
    detective: settings.detectiveCount,
    doctor: settings.doctorCount
  };
  
  return shuffledPlayers.map((player) => {
    let role: PlayerRole = 'villager';
    
    if (roleCount.mafia > 0) {
      role = 'mafia';
      roleCount.mafia--;
    } else if (roleCount.detective > 0) {
      role = 'detective';
      roleCount.detective--;
    } else if (roleCount.doctor > 0) {
      role = 'doctor';
      roleCount.doctor--;
    }
    
    return {
      ...player,
      role,
      isAlive: true
    };
  });
}

// Check if game is over and determine winner
export function checkGameOver(players: Player[]): { gameOver: boolean; winner?: 'villagers' | 'mafia' } {
  const alivePlayers = players.filter(p => p.isAlive);
  const aliveMafia = alivePlayers.filter(p => p.role === 'mafia');
  const aliveVillagers = alivePlayers.filter(p => p.role !== 'mafia');
  
  // Mafia wins if they equal or outnumber the innocent players
  if (aliveMafia.length >= aliveVillagers.length) {
    return { gameOver: true, winner: 'mafia' };
  }
  
  // Villagers win if all mafia are eliminated
  if (aliveMafia.length === 0) {
    return { gameOver: true, winner: 'villagers' };
  }
  
  return { gameOver: false };
}

// Shuffle array (Fisher-Yates algorithm)
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Get default game settings based on player count
export function getDefaultSettings(playerCount: number): GameSettings {
  if (playerCount <= 5) {
    return {
      mafiaCount: 1,
      detectiveCount: 1,
      doctorCount: 1
    };
  } else if (playerCount <= 7) {
    return {
      mafiaCount: 2,
      detectiveCount: 1,
      doctorCount: 1
    };
  } else {
    // Scale for 8+ players
    return {
      mafiaCount: Math.floor(playerCount / 4),
      detectiveCount: 1,
      doctorCount: 1
    };
  }
} 