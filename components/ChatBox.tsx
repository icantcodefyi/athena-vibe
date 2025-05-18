"use client";

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/game-context";
import { Player } from "@/lib/game-types";
import { Bot, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatBox() {
  const { gameState, currentPlayer, addChatMessage } = useGame();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom when new messages come in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState.chatMessages]);

  const handleSendMessage = () => {
    if (message.trim() && currentPlayer?.isAlive) {
      addChatMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get player data by ID for display
  const getPlayerById = (id: string): Player | undefined => {
    return gameState.players.find(p => p.id === id);
  };

  const isActivePhase = gameState.phase === 'day' || gameState.phase === 'voting';
  const isDead = currentPlayer ? !currentPlayer.isAlive : false;

  if (!isActivePhase) {
    return null; // Don't display chat during non-discussion phases
  }

  return (
    <div className="rounded-lg border bg-background p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Chat</h3>
        {gameState.aiThinking && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            AI players are thinking...
          </div>
        )}
      </div>
      
      <ScrollArea className="h-[300px] rounded-md border p-4" ref={scrollRef}>
        <div className="space-y-4">
          {gameState.chatMessages.map((chatMsg, index) => {
            const player = getPlayerById(chatMsg.playerId);
            const isCurrentPlayer = player?.id === currentPlayer?.id;
            const isAI = player?.isAI;
            
            return (
              <div 
                key={index} 
                className={cn(
                  "flex gap-2",
                  isCurrentPlayer ? "justify-end" : "justify-start"
                )}
              >
                <div 
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                    isCurrentPlayer 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-1 mb-1 text-xs font-medium">
                    {isAI && <Bot className="h-3 w-3" />}
                    <span>{player?.name}</span>
                    {player && !player.isAlive && <span className="text-red-500">(Dead)</span>}
                  </div>
                  <p>{chatMsg.content}</p>
                </div>
              </div>
            );
          })}
          
          {gameState.chatMessages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          )}
        </div>
      </ScrollArea>
      
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isDead ? "You can't chat when dead" : "Type a message..."}
          disabled={isDead}
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={!message.trim() || isDead}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      {isDead && (
        <p className="text-xs text-center text-muted-foreground">
          You are dead. You can observe but not participate in the chat.
        </p>
      )}
    </div>
  );
} 