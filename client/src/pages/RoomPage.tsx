import type { ReactNode } from "react";
import { ChatComposer } from "../components/ChatComposer";
import { ChatFeed } from "../components/ChatFeed";
import { GameMasterPanel } from "../components/GameMasterPanel";
import { PlayerList } from "../components/PlayerList";
import { RoundStatus } from "../components/RoundStatus";
import type { GameController } from "../hooks/useGameController";

type RoomPageProps = {
  game: GameController;
  onLeave: () => void;
};

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
      {children}
    </p>
  );
}

export function RoomPage({ game, onLeave }: RoomPageProps) {
  const {
    room,
    playerId,
    round,
    attemptsLeft,
    questionSaved,
    messages,
    isGameMaster,
    gameMasterName,
  } = game;

  if (!room) return null;

  const outOfAttempts = attemptsLeft === 0;

  let composer: ReactNode;
  if (round) {
    composer = isGameMaster ? (
      <Notice>You are the Game Master. Watch the guesses roll in.</Notice>
    ) : (
      <ChatComposer
        disabled={outOfAttempts}
        placeholder={
          outOfAttempts ? "You have used all your attempts" : "Type your guess…"
        }
        onSend={game.submitGuess}
      />
    );
  } else if (isGameMaster) {
    composer = (
      <GameMasterPanel
        playerCount={room.playerCount}
        questionSaved={questionSaved}
        onSave={game.saveQuestion}
        onStart={game.startGame}
      />
    );
  } else {
    composer = (
      <Notice>
        Waiting for {gameMasterName ?? "the Game Master"} to set a question…
      </Notice>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4 sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">
            Room code
          </p>
          <p className="text-2xl font-bold tracking-[0.2em] text-emerald-400">
            {room.roomCode}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-sm">
            {room.playerCount} {room.playerCount === 1 ? "player" : "players"}
          </span>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            Leave room
          </button>
        </div>
      </header>

      <RoundStatus
        round={round}
        attemptsLeft={attemptsLeft}
        isGameMaster={isGameMaster}
      />

      <div className="grid lg:grid-cols-[1fr_16rem]">
        <div>
          <ChatFeed messages={messages} currentPlayerId={playerId} />
          <div className="border-t border-slate-800 p-4">{composer}</div>
        </div>

        <aside className="border-t border-slate-800 p-4 lg:border-l lg:border-t-0">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
            Scoreboard
          </h2>
          <PlayerList players={room.players} currentPlayerId={playerId} />
        </aside>
      </div>
    </section>
  );
}