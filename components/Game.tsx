"use client";

import { useGame } from "@/lib/game-context";
import { LobbyPhase } from "./LobbyPhase";
import { RoleAssignmentPhase } from "./RoleAssignmentPhase";
import { DayPhase } from "./DayPhase";
import { VotingPhase } from "./VotingPhase";
import { NightPhase } from "./NightPhase";
import { ResultsPhase } from "./ResultsPhase";
import { PhaseTransition } from "./PhaseTransition";

export function Game() {
  const { gameState } = useGame();

  return (
    <>
      {/* Phase transition animation overlay */}
      <PhaseTransition
        phase={gameState.phase}
        dayCount={gameState.dayCount}
      />
      
      {/* Render the appropriate phase component based on current game state */}
      {gameState.phase === 'lobby' && <LobbyPhase />}
      {gameState.phase === 'role-assignment' && <RoleAssignmentPhase />}
      {gameState.phase === 'day' && <DayPhase />}
      {gameState.phase === 'voting' && <VotingPhase />}
      {gameState.phase === 'night' && <NightPhase />}
      {gameState.phase === 'results' && <ResultsPhase />}
    </>
  );
} 