import { Game } from "@/components/Game";
import { GameProvider } from "@/lib/game-context";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <GameProvider>
        <Game />
      </GameProvider>
    </main>
  );
}
