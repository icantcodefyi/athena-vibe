"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ChatMessage, GameSettings, GameState, Player, PlayerGender } from "./game-types";
import { assignRoles, checkGameOver, generateId, getDefaultSettings, initGameState } from "./game-utils";
import { getAIMessage, getAINightAction, getAIVote } from "./ai-service";

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
  addChatMessage: (content: string) => void;
  generateAIPlayers: (count: number) => void;
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
  const [gameState, setGameState] = useState<GameState>({
    ...initGameState(),
    chatMessages: [],
    aiThinking: false
  });
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    mafiaCount: 1,
    detectiveCount: 1,
    doctorCount: 1,
    aiPlayerCount: 5, // Default to 5 AI players
  });

  // Join game as a human player
  const joinGame = (name: string, gender: PlayerGender) => {
    const newPlayer: Player = {
      id: generateId(),
      name,
      gender,
      role: 'villager', // Will be assigned during role assignment
      isAlive: true,
      isHost: true, // Human player is always the host
      isAI: false,
    };

    setCurrentPlayer(newPlayer);
    setGameState(prev => ({
      ...prev,
      players: [newPlayer] // Just add the human player initially
    }));

    // Update default settings based on player count
    setGameSettings(getDefaultSettings(1)); // Start with 1 human player
  };

  // Generate AI players
  const generateAIPlayers = (count: number) => {
    const aiNames = [
      "Alex", "Blake", "Charlie", "Dana", "Ellis", 
      "Frankie", "Gray", "Harper", "Indigo", "Jordan",
      "Kelly", "Lee", "Morgan", "Noah", "Parker",
      "Quinn", "Riley", "Sam", "Taylor", "Val"
    ];
    
    // Fisher-Yates shuffle to get random names
    const shuffledNames = [...aiNames];
    for (let i = shuffledNames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledNames[i], shuffledNames[j]] = [shuffledNames[j], shuffledNames[i]];
    }
    
    const aiPlayers: Player[] = [];
    
    for (let i = 0; i < Math.min(count, shuffledNames.length); i++) {
      const gender: PlayerGender = Math.random() > 0.5 ? 'male' : 'female';
      
      aiPlayers.push({
        id: generateId(),
        name: shuffledNames[i],
        gender,
        role: 'villager', // Will be assigned during role assignment
        isAlive: true,
        isHost: false,
        isAI: true,
      });
    }
    
    setGameState(prev => ({
      ...prev,
      players: [...prev.players, ...aiPlayers]
    }));
    
    // Update settings
    setGameSettings(prev => ({
      ...prev,
      aiPlayerCount: count
    }));
  };

  // Add a chat message
  const addChatMessage = (content: string) => {
    if (!currentPlayer) return;
    
    const newMessage: ChatMessage = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      content,
      timestamp: Date.now(),
    };
    
    setGameState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, newMessage]
    }));
  };

  // Process AI chat messages
  const processAIChatMessages = async () => {
    if (gameState.phase !== 'day' && gameState.phase !== 'voting') return;
    
    // Only process AI messages if there are AI players alive
    const aiPlayers = gameState.players.filter(p => p.isAI && p.isAlive);
    if (aiPlayers.length === 0) return;
    
    // Set AI thinking state
    setGameState(prev => ({ ...prev, aiThinking: true }));
    
    // Randomly select an AI player to speak
    const randomIndex = Math.floor(Math.random() * aiPlayers.length);
    const aiPlayer = aiPlayers[randomIndex];
    
    // Get another random player to discuss
    const otherPlayers = gameState.players.filter(p => p.id !== aiPlayer.id && p.isAlive);
    const targetPlayerIndex = Math.floor(Math.random() * otherPlayers.length);
    const targetPlayer = otherPlayers[targetPlayerIndex];
    
    try {
      // Get AI message
      const aiMessage = await getAIMessage(
        aiPlayer, 
        gameState, 
        gameState.dayCount, 
        targetPlayer
      );
      
      // Add the message to the chat
      const newMessage: ChatMessage = {
        playerId: aiPlayer.id,
        playerName: aiPlayer.name,
        content: aiMessage,
        timestamp: Date.now(),
      };
      
      // Update player's last message
      const updatedPlayers = gameState.players.map(p => 
        p.id === aiPlayer.id ? { ...p, lastMessage: aiMessage } : p
      );
      
      // Add to game state
      setGameState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, newMessage],
        players: updatedPlayers,
        aiThinking: false,
      }));
    } catch (error) {
      console.error("Error getting AI message:", error);
      setGameState(prev => ({ ...prev, aiThinking: false }));
    }
  };

  // Process AI votes
  const processAIVotes = async () => {
    if (gameState.phase !== 'voting') return;
    
    // Get all AI players that are alive
    const aiPlayers = gameState.players.filter(p => p.isAI && p.isAlive);
    if (aiPlayers.length === 0) return;
    
    // Set AI thinking state
    setGameState(prev => ({ ...prev, aiThinking: true }));
    
    // Make each AI player vote one at a time
    for (const aiPlayer of aiPlayers) {
      try {
        const targetId = await getAIVote(aiPlayer, gameState);
        
        if (targetId) {
          // Update voting results
          setGameState(prev => {
            const newVotingResults = { ...prev.votingResults };
            
            // Remove any existing vote by this player
            Object.keys(newVotingResults).forEach(key => {
              newVotingResults[key] = newVotingResults[key].filter(id => id !== aiPlayer.id);
            });
            
            // Add the new vote
            if (!newVotingResults[targetId]) {
              newVotingResults[targetId] = [];
            }
            newVotingResults[targetId].push(aiPlayer.id);
            
            return {
              ...prev,
              votingResults: newVotingResults
            };
          });
          
          // Add a short delay between AI votes
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error("Error processing AI vote:", error);
      }
    }
    
    // Turn off AI thinking state
    setGameState(prev => ({ ...prev, aiThinking: false }));
  };

  // Process AI night actions
  const processAINightActions = async () => {
    if (gameState.phase !== 'night') return;
    
    // Set AI thinking state
    setGameState(prev => ({ ...prev, aiThinking: true }));
    
    // Process mafia night actions
    const aiMafia = gameState.players.filter(p => p.isAI && p.isAlive && p.role === 'mafia');
    if (aiMafia.length > 0) {
      try {
        // Let the first mafia AI decide the target
        const targetId = await getAINightAction(aiMafia[0], gameState);
        
        if (targetId) {
          setGameState(prev => ({
            ...prev,
            nightActions: {
              ...prev.nightActions,
              mafiaTarget: targetId
            }
          }));
        }
      } catch (error) {
        console.error("Error processing AI mafia action:", error);
      }
    }
    
    // Process detective night actions
    const aiDetectives = gameState.players.filter(p => p.isAI && p.isAlive && p.role === 'detective');
    if (aiDetectives.length > 0) {
      try {
        // For each AI detective
        for (const detective of aiDetectives) {
          const targetId = await getAINightAction(detective, gameState);
          
          if (targetId) {
            setGameState(prev => ({
              ...prev,
              nightActions: {
                ...prev.nightActions,
                detectiveTarget: targetId
              }
            }));
          }
        }
      } catch (error) {
        console.error("Error processing AI detective action:", error);
      }
    }
    
    // Process doctor night actions
    const aiDoctors = gameState.players.filter(p => p.isAI && p.isAlive && p.role === 'doctor');
    if (aiDoctors.length > 0) {
      try {
        // For each AI doctor
        for (const doctor of aiDoctors) {
          const targetId = await getAINightAction(doctor, gameState);
          
          if (targetId) {
            setGameState(prev => ({
              ...prev,
              nightActions: {
                ...prev.nightActions,
                doctorTarget: targetId
              }
            }));
          }
        }
      } catch (error) {
        console.error("Error processing AI doctor action:", error);
      }
    }
    
    // Turn off AI thinking state
    setGameState(prev => ({ ...prev, aiThinking: false }));
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
    
    // After the player votes, trigger AI voting
    setTimeout(() => {
      processAIVotes();
    }, 1000);
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
    
    // After the player submits their night action, trigger AI night actions
    setTimeout(() => {
      processAINightActions();
    }, 1000);
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
        return {
          ...initGameState(),
          chatMessages: [],
          aiThinking: false
        };
      }
      
      return prev;
    });
  };

  // Reset the game if current player is eliminated
  useEffect(() => {
    if (currentPlayer && !currentPlayer.isAlive) {
      const updatedCurrentPlayer = gameState.players.find(p => p.id === currentPlayer.id);
      if (updatedCurrentPlayer) {
        setCurrentPlayer(updatedCurrentPlayer);
      }
    }
  }, [gameState.players, currentPlayer]);

  // Trigger AI chat messages at regular intervals during day phase
  useEffect(() => {
    let chatInterval: NodeJS.Timeout;
    
    if ((gameState.phase === 'day' || gameState.phase === 'voting') && !gameState.aiThinking) {
      chatInterval = setInterval(() => {
        processAIChatMessages();
      }, 5000); // AI players chat every 5 seconds
    }
    
    return () => {
      if (chatInterval) clearInterval(chatInterval);
    };
  }, [gameState.phase, gameState.aiThinking, gameState.players, gameState.chatMessages]);

  // When transitioning to night phase, process AI night actions
  useEffect(() => {
    if (gameState.phase === 'night' && currentPlayer?.role !== 'mafia' && 
        currentPlayer?.role !== 'detective' && currentPlayer?.role !== 'doctor') {
      // If player has no night action, process AI actions immediately
      processAINightActions();
    }
  }, [gameState.phase, currentPlayer?.role]);

  const value = {
    gameState,
    currentPlayer,
    gameSettings,
    joinGame,
    startGame,
    updateSettings,
    castVote,
    submitNightAction,
    proceedToNextPhase,
    addChatMessage,
    generateAIPlayers
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
} 