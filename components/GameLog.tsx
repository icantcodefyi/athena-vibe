"use client";

import { useGame } from "@/lib/game-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

export function GameLog() {
  const { gameState } = useGame();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom when new messages come in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState.messages]);

  if (gameState.messages.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <h3 className="font-semibold mb-2">Game Log</h3>
      <ScrollArea className="h-[200px] rounded-md border p-4" ref={scrollRef}>
        <div className="space-y-2">
          {gameState.messages.map((message, index) => (
            <div key={index} className="text-sm">
              <span className="text-muted-foreground">[{index + 1}]</span> {message}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 