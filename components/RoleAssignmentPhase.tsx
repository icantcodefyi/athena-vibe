"use client";

import { useGame } from "@/lib/game-context";
import { Button } from "@/components/ui/button";
import { PlayerCard } from "@/components/PlayerCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GameLog } from "@/components/GameLog";

export function RoleAssignmentPhase() {
  const { gameState, currentPlayer, proceedToNextPhase } = useGame();
  
  if (!currentPlayer) {
    return <div>Loading...</div>;
  }

  const isHost = currentPlayer.isHost;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Role Assignment</CardTitle>
            <CardDescription>
              Your role has been assigned! Remember to keep it secret from other players.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border rounded-lg p-6 bg-muted/30 flex flex-col items-center">
              <div className="w-24 h-24 md:w-32 md:h-32 mb-4">
                <PlayerCard player={currentPlayer} showRole />
              </div>
              
              <h3 className="text-xl font-bold">Your Role: {currentPlayer.role.charAt(0).toUpperCase() + currentPlayer.role.slice(1)}</h3>
              
              <p className="text-center mt-2 max-w-md">
                {currentPlayer.role === 'mafia' && (
                  "Your goal is to eliminate the innocent players until the Mafia equals or outnumbers them. You can eliminate one player each night."
                )}
                {currentPlayer.role === 'detective' && (
                  "Your goal is to help the Villagers win by identifying the Mafia. Each night, you can investigate one player to determine if they are Mafia."
                )}
                {currentPlayer.role === 'doctor' && (
                  "Your goal is to help the Villagers win by protecting them from the Mafia. Each night, you can choose one player to protect from elimination."
                )}
                {currentPlayer.role === 'villager' && (
                  "Your goal is to identify and eliminate all Mafia members through voting. You have no special night abilities."
                )}
              </p>
            </div>

            <GameLog />
            
            <div className="flex justify-center">
              {isHost ? (
                <Button size="lg" onClick={proceedToNextPhase}>
                  Start Day 1
                </Button>
              ) : (
                <p className="text-center text-muted-foreground">
                  Waiting for host to start the day...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 