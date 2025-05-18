"use client";

import { useGame } from "@/lib/game-context";
import { Button } from "@/components/ui/button";
import { PlayerCard } from "@/components/PlayerCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GameLog } from "@/components/GameLog";
import Image from "next/image";

export function DayPhase() {
  const { gameState, currentPlayer, proceedToNextPhase } = useGame();
  
  if (!currentPlayer) {
    return <div>Loading...</div>;
  }

  const isHost = currentPlayer.isHost;
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const dayCount = gameState.dayCount;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader className="bg-yellow-50 dark:bg-yellow-950">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <div className="relative w-8 h-8">
                    <Image
                      src="/day.jpeg"
                      alt="Day"
                      fill
                      className="object-contain"
                    />
                  </div>
                  Day {dayCount}
                </CardTitle>
                <CardDescription>
                  Discuss with other players to identify the Mafia.
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Players alive</div>
                <div className="text-lg font-semibold">{alivePlayers.length}/{gameState.players.length}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {gameState.players.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>

            <GameLog />
            
            <div className="flex justify-center">
              {isHost ? (
                <Button 
                  size="lg" 
                  variant="default" 
                  onClick={proceedToNextPhase}
                >
                  Proceed to Voting
                </Button>
              ) : (
                <p className="text-center text-muted-foreground">
                  Waiting for host to start voting...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 