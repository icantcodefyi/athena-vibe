"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GameSettings, GameState, Player, PlayerGender } from "./game-types";
import { assignRoles, checkGameOver, generateId, getDefaultSettings, initGameState } from "./game-utils";

interface GameContextType {
  gameState: GameState;
  currentPlayer: Player | null;
  gameSettings: GameSettings;
  joinGame: (name: string, gender: PlayerGender) => void;
  startGame: () => void;
  updateSettings: (settings: GameSettings) => void;
  castVote: (targetId: string) => void;
  submitNightAction: (action: 'mafia' | 'detective' | 'doctor', targetId: string) => void;
  proceedToNextPhase: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [gameState, setGameState] = useState<GameState>(initGameState());
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    mafiaCount: 1,
    detectiveCount: 1,
    doctorCount: 1,
  });

  // Join game as a player
  const joinGame = (name: string, gender: PlayerGender) => {
    const newPlayer: Player = {
      id: generateId(),
      name,
      gender,
      role: 'villager', // Will be assigned during role assignment
      isAlive: true,
      isHost: gameState.players.length === 0, // First player is host
    };

    setCurrentPlayer(newPlayer);
    setGameState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }));

    // Update default settings based on player count
    if (gameState.players.length === 0) {
      setGameSettings(getDefaultSettings(1));
    } else {
      setGameSettings(getDefaultSettings(gameState.players.length + 1));
    }
  };

  // Start the game and assign roles
  const startGame = () => {
    if (gameState.players.length < 4) {
      return; // Minimum 4 players required
    }

    const playersWithRoles = assignRoles(gameState.players, gameSettings);
    
    setGameState(prev => ({
      ...prev,
      phase: 'role-assignment',
      players: playersWithRoles,
      messages: [...prev.messages, "Game has started! Roles have been assigned."]
    }));

    // Update current player with their assigned role
    if (currentPlayer) {
      const updatedCurrentPlayer = playersWithRoles.find(p => p.id === currentPlayer.id);
      if (updatedCurrentPlayer) {
        setCurrentPlayer(updatedCurrentPlayer);
      }
    }
  };

  // Update game settings
  const updateSettings = (settings: GameSettings) => {
    setGameSettings(settings);
  };

  // Cast a vote during day phase
  const castVote = (targetId: string) => {
    if (!currentPlayer || gameState.phase !== 'voting') return;

    setGameState(prev => {
      const newVotingResults = { ...prev.votingResults };
      
      // Remove any existing vote by this player
      Object.keys(newVotingResults).forEach(key => {
        newVotingResults[key] = newVotingResults[key].filter(id => id !== currentPlayer.id);
      });

      // Add the new vote
      if (!newVotingResults[targetId]) {
        newVotingResults[targetId] = [];
      }
      newVotingResults[targetId].push(currentPlayer.id);

      return {
        ...prev,
        votingResults: newVotingResults
      };
    });
  };

  // Submit night action (mafia kill, detective investigate, doctor save)
  const submitNightAction = (action: 'mafia' | 'detective' | 'doctor', targetId: string) => {
    if (!currentPlayer || gameState.phase !== 'night') return;
    
    if ((action === 'mafia' && currentPlayer.role !== 'mafia') ||
        (action === 'detective' && currentPlayer.role !== 'detective') ||
        (action === 'doctor' && currentPlayer.role !== 'doctor')) {
      return; // Not authorized for this action
    }

    setGameState(prev => ({
      ...prev,
      nightActions: {
        ...prev.nightActions,
        [action + 'Target']: targetId
      }
    }));
  };

  // Proceed to the next game phase
  const proceedToNextPhase = () => {
    setGameState(prev => {
      // Current phase is lobby
      if (prev.phase === 'lobby') {
        return {
          ...prev,
          phase: 'role-assignment'
        };
      }
      
      // Current phase is role assignment
      if (prev.phase === 'role-assignment') {
        return {
          ...prev,
          phase: 'day',
          dayCount: 1,
          messages: [...prev.messages, "Day 1 has started. Discuss among yourselves to find the Mafia!"]
        };
      }
      
      // Current phase is day
      if (prev.phase === 'day') {
        return {
          ...prev,
          phase: 'voting',
          votingResults: {},
          messages: [...prev.messages, "Voting has started. Choose someone to eliminate!"]
        };
      }
      
      // Current phase is voting
      if (prev.phase === 'voting') {
        // Count votes and eliminate the player with most votes
        let maxVotes = 0;
        let eliminatedId: string | null = null;
        
        Object.entries(prev.votingResults).forEach(([playerId, voters]) => {
          if (voters.length > maxVotes) {
            maxVotes = voters.length;
            eliminatedId = playerId;
          }
        });
        
        // Update player status if someone was eliminated
        const updatedPlayers = [...prev.players];
        let eliminatedPlayer: Player | undefined;
        
        if (eliminatedId) {
          eliminatedPlayer = updatedPlayers.find(p => p.id === eliminatedId);
          if (eliminatedPlayer) {
            eliminatedPlayer.isAlive = false;
          }
        }
        
        // Check if game is over after elimination
        const gameStatus = checkGameOver(updatedPlayers);
        
        if (gameStatus.gameOver) {
          return {
            ...prev,
            phase: 'results',
            players: updatedPlayers,
            lastEliminated: eliminatedPlayer,
            gameOver: true,
            winner: gameStatus.winner,
            messages: [
              ...prev.messages, 
              eliminatedPlayer ? `${eliminatedPlayer.name} was eliminated. They were a ${eliminatedPlayer.role}.` : "No one was eliminated.",
              `Game over! ${gameStatus.winner === 'mafia' ? 'The Mafia' : 'The Villagers'} won!`
            ]
          };
        }
        
        return {
          ...prev,
          phase: 'night',
          players: updatedPlayers,
          lastEliminated: eliminatedPlayer,
          messages: [
            ...prev.messages, 
            eliminatedPlayer ? `${eliminatedPlayer.name} was eliminated. They were a ${eliminatedPlayer.role}.` : "No one was eliminated.",
            "Night has fallen. Everyone close your eyes..."
          ]
        };
      }
      
      // Current phase is night
      if (prev.phase === 'night') {
        const { mafiaTarget, doctorTarget } = prev.nightActions;
        const updatedPlayers = [...prev.players];
        let eliminatedPlayer: Player | undefined;
        
        // Resolve night actions
        if (mafiaTarget && mafiaTarget !== doctorTarget) {
          const targetPlayer = updatedPlayers.find(p => p.id === mafiaTarget);
          if (targetPlayer) {
            targetPlayer.isAlive = false;
            eliminatedPlayer = targetPlayer;
          }
        }
        
        // Check if game is over after night action
        const gameStatus = checkGameOver(updatedPlayers);
        
        if (gameStatus.gameOver) {
          return {
            ...prev,
            phase: 'results',
            dayCount: prev.dayCount,
            players: updatedPlayers,
            lastEliminated: eliminatedPlayer,
            nightActions: {},
            gameOver: true,
            winner: gameStatus.winner,
            messages: [
              ...prev.messages, 
              eliminatedPlayer ? `${eliminatedPlayer.name} was killed by the Mafia.` : "No one was killed during the night.",
              `Game over! ${gameStatus.winner === 'mafia' ? 'The Mafia' : 'The Villagers'} won!`
            ]
          };
        }
        
        return {
          ...prev,
          phase: 'day',
          dayCount: prev.dayCount + 1,
          players: updatedPlayers,
          lastEliminated: eliminatedPlayer,
          nightActions: {},
          messages: [
            ...prev.messages, 
            eliminatedPlayer ? `${eliminatedPlayer.name} was killed by the Mafia.` : "No one was killed during the night.",
            `Day ${prev.dayCount + 1} has started. Discuss among yourselves to find the Mafia!`
          ]
        };
      }
      
      // Current phase is results, reset the game
      if (prev.phase === 'results') {
        return initGameState();
      }
      
      return prev;
    });
  };

  // If player object changes (like role assignment), update current player
  useEffect(() => {
    if (currentPlayer) {
      const updatedPlayer = gameState.players.find(p => p.id === currentPlayer.id);
      if (updatedPlayer && updatedPlayer !== currentPlayer) {
        setCurrentPlayer(updatedPlayer);
      }
    }
  }, [gameState.players, currentPlayer]);

  const value = {
    gameState,
    currentPlayer,
    gameSettings,
    joinGame,
    startGame,
    updateSettings,
    castVote,
    submitNightAction,
    proceedToNextPhase
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
} 