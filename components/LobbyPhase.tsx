"use client";

import { useState } from "react";
import { useGame } from "@/lib/game-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayerCard } from "@/components/PlayerCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GameSettings } from "@/lib/game-types";

export function LobbyPhase() {
  const { gameState, currentPlayer, gameSettings, joinGame, startGame, updateSettings } = useGame();
  const [playerName, setPlayerName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [tempSettings, setTempSettings] = useState<GameSettings>(gameSettings);
  
  const handleJoinGame = () => {
    if (playerName.trim()) {
      joinGame(playerName.trim(), gender);
      setPlayerName("");
    }
  };

  const handleStartGame = () => {
    updateSettings(tempSettings);
    startGame();
  };

  const canStart = gameState.players.length >= 4 && currentPlayer?.isHost;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Mafia Game - Lobby</CardTitle>
            <CardDescription>
              Join the game and wait for other players. Minimum 4 players required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!currentPlayer ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Select Gender</Label>
                  <RadioGroup defaultValue="male" onValueChange={(v) => setGender(v as "male" | "female")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button onClick={handleJoinGame}>
                  Join Game
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div>
                    <h3 className="font-medium mb-2">Players ({gameState.players.length})</h3>
                    {gameState.players.length === 0 ? (
                      <p className="text-muted-foreground">No players yet</p>
                    ) : (
                      <div className="grid gap-4 grid-cols-1">
                        {gameState.players.map((player) => (
                          <PlayerCard key={player.id} player={player} />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {currentPlayer.isHost && (
                    <div>
                      <h3 className="font-medium mb-2">Game Settings</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="mafia">Mafia Count</Label>
                          <Input
                            id="mafia"
                            type="number"
                            min={1}
                            max={gameState.players.length - 3}
                            value={tempSettings.mafiaCount}
                            onChange={(e) => setTempSettings({
                              ...tempSettings,
                              mafiaCount: Math.max(1, Math.min(parseInt(e.target.value) || 1, gameState.players.length - 3))
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="detective">Detective Count</Label>
                          <Input
                            id="detective"
                            type="number"
                            min={0}
                            max={gameState.players.length - tempSettings.mafiaCount - 1}
                            value={tempSettings.detectiveCount}
                            onChange={(e) => setTempSettings({
                              ...tempSettings,
                              detectiveCount: Math.max(0, Math.min(parseInt(e.target.value) || 0, gameState.players.length - tempSettings.mafiaCount - 1))
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="doctor">Doctor Count</Label>
                          <Input
                            id="doctor"
                            type="number"
                            min={0}
                            max={gameState.players.length - tempSettings.mafiaCount - tempSettings.detectiveCount}
                            value={tempSettings.doctorCount}
                            onChange={(e) => setTempSettings({
                              ...tempSettings,
                              doctorCount: Math.max(0, Math.min(parseInt(e.target.value) || 0, gameState.players.length - tempSettings.mafiaCount - tempSettings.detectiveCount))
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center">
                  {canStart ? (
                    <Button
                      size="lg"
                      onClick={handleStartGame}
                      disabled={gameState.players.length < 4}
                    >
                      Start Game ({gameState.players.length}/4+ players)
                    </Button>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      Waiting for host to start the game...
                      {gameState.players.length < 4 && ` (Need ${4 - gameState.players.length} more players)`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 