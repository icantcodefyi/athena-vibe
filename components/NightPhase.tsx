"use client";

import { useGame } from "@/lib/game-context";
import { Button } from "@/components/ui/button";
import { PlayerCard } from "@/components/PlayerCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GameLog } from "@/components/GameLog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export function NightPhase() {
  const { gameState, currentPlayer, submitNightAction, proceedToNextPhase } = useGame();
  
  if (!currentPlayer) {
    return <div>Loading...</div>;
  }

  const isHost = currentPlayer.isHost;
  const isMafia = currentPlayer.role === 'mafia' && currentPlayer.isAlive;
  const isDetective = currentPlayer.role === 'detective' && currentPlayer.isAlive;
  const isDoctor = currentPlayer.role === 'doctor' && currentPlayer.isAlive;
  
  // Check if player has already submitted a night action
  const hasMafiaAction = !!gameState.nightActions.mafiaTarget;
  const hasDetectiveAction = !!gameState.nightActions.detectiveTarget;
  const hasDoctorAction = !!gameState.nightActions.doctorTarget;
  
  // Get night action target if exists
  const mafiaTarget = gameState.players.find(p => p.id === gameState.nightActions.mafiaTarget);
  const detectiveTarget = gameState.players.find(p => p.id === gameState.nightActions.detectiveTarget);
  const doctorTarget = gameState.players.find(p => p.id === gameState.nightActions.doctorTarget);
  
  // Determine if detective has investigated a mafia member
  const detectiveResult = detectiveTarget ? detectiveTarget.role === 'mafia' : null;
  
  // Count AI players by role that are alive
  const aiMafia = gameState.players.filter(p => p.isAI && p.isAlive && p.role === 'mafia').length;
  const aiDetectives = gameState.players.filter(p => p.isAI && p.isAlive && p.role === 'detective').length;
  const aiDoctors = gameState.players.filter(p => p.isAI && p.isAlive && p.role === 'doctor').length;
  
  // Count required player actions
  const humanActionRequired = (
    (isMafia && !hasMafiaAction) || 
    (isDetective && !hasDetectiveAction) || 
    (isDoctor && !hasDoctorAction)
  );
  
  // AI actions are considered "completed" if the corresponding action exists
  const aiActionsNeeded = aiMafia + aiDetectives + aiDoctors;
  const aiActionsCompleted = (
    (aiMafia > 0 && hasMafiaAction ? 1 : 0) + 
    (aiDetectives > 0 && hasDetectiveAction ? 1 : 0) + 
    (aiDoctors > 0 && hasDoctorAction ? 1 : 0)
  );
  
  // Night is complete when human and AI actions are done
  const isNightComplete = !humanActionRequired && (aiActionsCompleted >= aiActionsNeeded || !gameState.aiThinking);
  
  // Host can force proceed to next day
  const canProceed = isHost && (isNightComplete || (!humanActionRequired && !gameState.aiThinking));

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader className="bg-blue-950 text-white dark:bg-blue-900">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <div className="relative w-8 h-8">
                    <Image
                      src="/night.svg"
                      alt="Night"
                      fill
                      className="object-contain"
                    />
                  </div>
                  Night {gameState.dayCount}
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Night has fallen. Special roles perform their night actions.
                </CardDescription>
              </div>
              <div className="text-right">
                {gameState.aiThinking ? (
                  <div className="flex items-center gap-2 text-blue-200">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI thinking...
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-blue-300">Night actions</div>
                    <div className="text-lg font-semibold">
                      {humanActionRequired ? "Waiting for you" : "Complete"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Night action UI for Mafia */}
            {isMafia && (
              <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950 space-y-4">
                <h3 className="font-semibold">Mafia Action: Choose a player to eliminate</h3>
                {hasMafiaAction ? (
                  <Alert>
                    <AlertTitle>Target selected</AlertTitle>
                    <AlertDescription>
                      You have chosen to eliminate {mafiaTarget?.name}.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {gameState.players
                      .filter(p => p.isAlive && p.id !== currentPlayer.id)
                      .map(player => (
                        <PlayerCard
                          key={player.id}
                          player={player}
                          canTarget={!hasMafiaAction}
                          onTarget={() => submitNightAction('mafia', player.id)}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Night action UI for Detective */}
            {isDetective && (
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 space-y-4">
                <h3 className="font-semibold">Detective Action: Choose a player to investigate</h3>
                {hasDetectiveAction ? (
                  <Alert>
                    <AlertTitle>Investigation result</AlertTitle>
                    <AlertDescription>
                      {detectiveResult 
                        ? `${detectiveTarget?.name} is a member of the Mafia!` 
                        : `${detectiveTarget?.name} is NOT a member of the Mafia.`
                      }
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {gameState.players
                      .filter(p => p.isAlive && p.id !== currentPlayer.id)
                      .map(player => (
                        <PlayerCard
                          key={player.id}
                          player={player}
                          canTarget={!hasDetectiveAction}
                          onTarget={() => submitNightAction('detective', player.id)}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Night action UI for Doctor */}
            {isDoctor && (
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950 space-y-4">
                <h3 className="font-semibold">Doctor Action: Choose a player to protect</h3>
                {hasDoctorAction ? (
                  <Alert>
                    <AlertTitle>Protection active</AlertTitle>
                    <AlertDescription>
                      You have chosen to protect {doctorTarget?.name} tonight.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {gameState.players
                      .filter(p => p.isAlive)
                      .map(player => (
                        <PlayerCard
                          key={player.id}
                          player={player}
                          canTarget={!hasDoctorAction}
                          onTarget={() => submitNightAction('doctor', player.id)}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}
            
            {/* If player has no night action */}
            {!isMafia && !isDetective && !isDoctor && currentPlayer.isAlive && (
              <Alert>
                <AlertTitle>Night time</AlertTitle>
                <AlertDescription>
                  You have no special night actions. Wait for the night to end.
                  {gameState.aiThinking && (
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      AI players are performing their actions...
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {/* If player is eliminated */}
            {!currentPlayer.isAlive && (
              <Alert>
                <AlertTitle>You are eliminated</AlertTitle>
                <AlertDescription>
                  You can observe the game but cannot participate.
                </AlertDescription>
              </Alert>
            )}

            <GameLog />
            
            <div className="flex justify-center">
              {isHost ? (
                <Button 
                  size="lg" 
                  variant="default" 
                  onClick={proceedToNextPhase}
                  disabled={!canProceed}
                >
                  {isNightComplete 
                    ? "Proceed to Morning" 
                    : "Wait for Night Actions"
                  }
                </Button>
              ) : (
                <p className="text-center text-muted-foreground">
                  {humanActionRequired
                    ? "Please complete your night action"
                    : "Waiting for night to end..."
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