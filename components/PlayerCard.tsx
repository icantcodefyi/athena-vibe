"use client";

import Image from "next/image";
import { Player } from "@/lib/game-types";
import { useGame } from "@/lib/game-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlayerCardProps {
  player: Player;
  showRole?: boolean;
  canVote?: boolean;
  canTarget?: boolean;
  onVote?: () => void;
  onTarget?: () => void;
}

export function PlayerCard({
  player,
  showRole = false,
  canVote = false,
  canTarget = false,
  onVote,
  onTarget
}: PlayerCardProps) {
  const { gameState, currentPlayer } = useGame();
  const isCurrentPlayer = currentPlayer?.id === player.id;
  
  // Determine the role image
  const getRoleImage = () => {
    if (showRole || isCurrentPlayer) {
      switch (player.role) {
        case 'mafia': return '/mafia.jpeg';
        case 'detective': return '/detective.jpeg';
        case 'doctor': return '/doctor.jpeg';
        case 'villager': return player.gender === 'male' ? '/villager-boy.jpeg' : '/villager-girl.jpeg';
        default: return player.gender === 'male' ? '/villager-boy.jpeg' : '/villager-girl.jpeg';
      }
    } else {
      // If not showing role, show generic villager image based on gender
      return player.gender === 'male' ? '/villager-boy.jpeg' : '/villager-girl.jpeg';
    }
  };
  
  // Count votes for this player (during voting phase)
  const voteCount = gameState.votingResults[player.id]?.length || 0;

  return (
    <div className={cn(
      "border rounded-lg p-4 flex flex-col items-center gap-2 transition-all",
      !player.isAlive && "opacity-50",
      isCurrentPlayer && "border-blue-500 bg-blue-50 dark:bg-blue-950",
    )}>
      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden">
        <Image
          src={getRoleImage()}
          alt={`${player.name}'s avatar`}
          fill
          className={cn(
            "object-cover",
            !player.isAlive && "grayscale"
          )}
        />
      </div>
      
      <h3 className="font-bold text-lg">{player.name}</h3>
      
      {/* Show role if allowed */}
      {(showRole || isCurrentPlayer) && (
        <Badge variant="outline" className="capitalize">
          {player.role}
        </Badge>
      )}
      
      {/* Host indicator */}
      {player.isHost && (
        <Badge variant="secondary">Host</Badge>
      )}
      
      {/* Eliminated indicator */}
      {!player.isAlive && (
        <Badge variant="destructive">Eliminated</Badge>
      )}
      
      {/* Vote count during voting */}
      {gameState.phase === 'voting' && voteCount > 0 && (
        <div className="text-sm font-medium">
          Votes: {voteCount}
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex gap-2 mt-2">
        {canVote && player.isAlive && player.id !== currentPlayer?.id && (
          <Button size="sm" variant="destructive" onClick={onVote}>
            Vote
          </Button>
        )}
        
        {canTarget && player.isAlive && player.id !== currentPlayer?.id && (
          <Button size="sm" variant="secondary" onClick={onTarget}>
            Target
          </Button>
        )}
      </div>
    </div>
  );
} 