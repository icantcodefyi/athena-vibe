"use client";

import { useGame } from "@/lib/game-context";
import { Button } from "@/components/ui/button";
import { PlayerCard } from "@/components/PlayerCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GameLog } from "@/components/GameLog";
import { Vote } from "lucide-react";

export function VotingPhase() {
  const { gameState, currentPlayer, castVote, proceedToNextPhase } = useGame();
  
  if (!currentPlayer) {
    return <div>Loading...</div>;
  }

  const isHost = currentPlayer.isHost;
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const dayCount = gameState.dayCount;
  
  // Check if current player has already voted
  const hasVoted = Object.values(gameState.votingResults).some(
    voterIds => voterIds.includes(currentPlayer.id)
  );

  // Calculate who current player voted for
  const votedForId = Object.entries(gameState.votingResults)
    .find(([, voterIds]) => voterIds.includes(currentPlayer.id))?.[0];
  
  // Count total votes
  const totalVotes = Object.values(gameState.votingResults)
    .reduce((sum, voters) => sum + voters.length, 0);
  
  // Can proceed if all alive players have voted or if host decides to force proceed
  const canProceed = isHost && (totalVotes >= alivePlayers.length || totalVotes > 0);

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader className="bg-orange-50 dark:bg-orange-950">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Vote className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  Day {dayCount} - Voting
                </CardTitle>
                <CardDescription>
                  Vote to eliminate a player. Player with most votes will be eliminated.
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Votes cast</div>
                <div className="text-lg font-semibold">{totalVotes}/{alivePlayers.length}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentPlayer.isAlive && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-2">
                  {hasVoted 
                    ? `You voted for ${gameState.players.find(p => p.id === votedForId)?.name}`
                    : "Cast your vote"
                  }
                </h3>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {gameState.players.map((player) => (
                <PlayerCard 
                  key={player.id}
                  player={player}
                  canVote={currentPlayer.isAlive && !hasVoted}
                  onVote={() => castVote(player.id)}
                />
              ))}
            </div>

            <GameLog />
            
            <div className="flex justify-center">
              {isHost ? (
                <Button 
                  size="lg" 
                  variant="destructive" 
                  onClick={proceedToNextPhase}
                  disabled={!canProceed}
                >
                  {totalVotes >= alivePlayers.length 
                    ? "Reveal Votes Result" 
                    : "Force End Voting"
                  }
                </Button>
              ) : (
                <p className="text-center text-muted-foreground">
                  {hasVoted 
                    ? "Waiting for other players to vote..." 
                    : "Please cast your vote"
                  }
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 