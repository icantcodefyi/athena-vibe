"use client";

import { useGame } from "@/lib/game-context";
import { LobbyPhase } from "./LobbyPhase";
import { RoleAssignmentPhase } from "./RoleAssignmentPhase";
import { DayPhase } from "./DayPhase";
import { VotingPhase } from "./VotingPhase";
import { NightPhase } from "./NightPhase";
import { ResultsPhase } from "./ResultsPhase";

export function Game() {
  const { gameState } = useGame();

  // Render the appropriate phase component based on current game state
  switch (gameState.phase) {
    case 'lobby':
      return <LobbyPhase />;
    case 'role-assignment':
      return <RoleAssignmentPhase />;
    case 'day':
      return <DayPhase />;
    case 'voting':
      return <VotingPhase />;
    case 'night':
      return <NightPhase />;
    case 'results':
      return <ResultsPhase />;
    default:
      return <div>Unknown game phase</div>;
  }
} 