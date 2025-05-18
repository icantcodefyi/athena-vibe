"use client";

import { useGame } from "@/lib/game-context";
import { Button } from "@/components/ui/button";
import { PlayerCard } from "@/components/PlayerCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GameLog } from "@/components/GameLog";
import { AlertCircle, Trophy } from "lucide-react";

export function ResultsPhase() {
  const { gameState, proceedToNextPhase } = useGame();
  
  const winner = gameState.winner;
  const isMafiaWin = winner === 'mafia';
  const totalDays = gameState.dayCount;
  
  // Get all players by team
  const mafiaTeam = gameState.players.filter(p => p.role === 'mafia');
  const villagerTeam = gameState.players.filter(p => p.role !== 'mafia');
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader className={isMafiaWin ? "bg-red-50 dark:bg-red-950" : "bg-green-50 dark:bg-green-950"}>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  Game Over - {isMafiaWin ? "Mafia Wins!" : "Villagers Win!"}
                </CardTitle>
                <CardDescription>
                  {isMafiaWin 
                    ? "The Mafia has outnumbered the innocent villagers." 
                    : "All Mafia members have been eliminated."
                  }
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Game lasted</div>
                <div className="text-lg font-semibold">{totalDays} days</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2">
              {/* Mafia Team */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Mafia Team
                </h3>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {mafiaTeam.map(player => (
                    <PlayerCard key={player.id} player={player} showRole />
                  ))}
                  {mafiaTeam.length === 0 && (
                    <p className="text-muted-foreground">No mafia members</p>
                  )}
                </div>
              </div>
              
              {/* Villager Team */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center text-green-600 dark:text-green-400">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Villager Team
                </h3>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {villagerTeam.map(player => (
                    <PlayerCard key={player.id} player={player} showRole />
                  ))}
                  {villagerTeam.length === 0 && (
                    <p className="text-muted-foreground">No villager members</p>
                  )}
                </div>
              </div>
            </div>

            <GameLog />
            
            <div className="flex justify-center pt-4">
              <Button 
                size="lg" 
                onClick={proceedToNextPhase}
              >
                Start New Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 