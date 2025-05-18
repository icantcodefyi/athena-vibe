"use client";

import { useState } from "react";
import { useGame } from "@/lib/game-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayerCard } from "@/components/PlayerCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GameSettings } from "@/lib/game-types";
import { Slider } from "@/components/ui/slider";
import { Bot, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LobbyPhase() {
  const { gameState, currentPlayer, gameSettings, joinGame, startGame, updateSettings, generateAIPlayers } = useGame();
  const [playerName, setPlayerName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [tempSettings, setTempSettings] = useState<GameSettings>(gameSettings);
  const [aiCount, setAiCount] = useState(5); // Default AI player count
  
  const handleJoinGame = () => {
    if (playerName.trim()) {
      joinGame(playerName.trim(), gender);
      setPlayerName("");
    }
  };

  const handleGenerateAI = () => {
    generateAIPlayers(aiCount);
  };

  const handleStartGame = () => {
    updateSettings(tempSettings);
    startGame();
  };

  const aiPlayers = gameState.players.filter(p => p.isAI);

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Mafia Game - Single Player</CardTitle>
            <CardDescription>
              Join the game and play with AI opponents. Minimum 4 players required (you + AI players).
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
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                  <div>
                    <h3 className="font-medium mb-4">
                      Players ({gameState.players.length})
                    </h3>
                    {gameState.players.length === 1 ? (
                      <div className="flex flex-col gap-4">
                        <PlayerCard key={currentPlayer.id} player={currentPlayer} />
                        <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                          <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-primary" />
                            <h4 className="font-medium">AI Players: {aiPlayers.length}</h4>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Number of AI Players</span>
                              <span className="font-medium">{aiCount}</span>
                            </div>
                            <Slider
                              value={[aiCount]}
                              min={3}
                              max={9}
                              step={1}
                              onValueChange={(value) => setAiCount(value[0])}
                            />
                          </div>
                          
                          <Button onClick={handleGenerateAI} disabled={aiPlayers.length > 0}>
                            Generate AI Players
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 grid-cols-1">
                        {gameState.players.map((player) => (
                          <PlayerCard key={player.id} player={player} />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Game Settings</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="mafia">Mafia Count</Label>
                        <Input
                          id="mafia"
                          type="number"
                          min={1}
                          max={Math.max(1, Math.floor(gameState.players.length / 3))}
                          value={tempSettings.mafiaCount}
                          onChange={(e) => setTempSettings({
                            ...tempSettings,
                            mafiaCount: Math.max(1, Math.min(parseInt(e.target.value) || 1, Math.floor(gameState.players.length / 3)))
                          })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="detective">Detective Count</Label>
                        <Input
                          id="detective"
                          type="number"
                          min={0}
                          max={Math.max(0, Math.floor(gameState.players.length / 4))}
                          value={tempSettings.detectiveCount}
                          onChange={(e) => setTempSettings({
                            ...tempSettings,
                            detectiveCount: Math.max(0, Math.min(parseInt(e.target.value) || 0, Math.floor(gameState.players.length / 4)))
                          })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="doctor">Doctor Count</Label>
                        <Input
                          id="doctor"
                          type="number"
                          min={0}
                          max={Math.max(0, Math.floor(gameState.players.length / 4))}
                          value={tempSettings.doctorCount}
                          onChange={(e) => setTempSettings({
                            ...tempSettings,
                            doctorCount: Math.max(0, Math.min(parseInt(e.target.value) || 0, Math.floor(gameState.players.length / 4)))
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    For AI chat to work properly, you need to set your OpenAI API key in the <code>.env.local</code> file. 
                    Without a key, AI players will use fallback messages.
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleStartGame}
                    disabled={gameState.players.length < 4 || aiPlayers.length === 0}
                  >
                    Start Game ({gameState.players.length}/4+ players)
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            <p>
              This game uses AI-powered players that respond dynamically based on the game state. For the best experience, set an OpenAI API key.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 