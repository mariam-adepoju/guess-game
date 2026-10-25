import { useEffect, useRef } from "react";
import type { ChatMessage, GameEnded } from "../types/game.types";

type ChatFeedProps = {
    messages: ChatMessage[];
    currentPlayerId: string;
};

export function ChatFeed({ messages, currentPlayerId }: ChatFeedProps) {
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const list = listRef.current;
        if (list) list.scrollTop = list.scrollHeight;
    }, [messages.length]);

    return (
        <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-label="Game chat"
            className="h-96 space-y-3 overflow-y-auto p-4 sm:p-6"
        >
            {messages.map((message) => (
                <MessageRow
                    key={message.id}
                    message={message}
                    currentPlayerId={currentPlayerId}
                />
            ))}
        </div>
    );
}

function MessageRow({
    message,
    currentPlayerId,
}: {
    message: ChatMessage;
    currentPlayerId: string;
}) {
    switch (message.kind) {
        case "system":
            return <p className="text-center text-xs text-slate-500">{message.text}</p>;

        case "question":
            return (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                        Question
                    </p>
                    <p className="mt-1 text-lg font-semibold">{message.text}</p>
                </div>
            );

        case "guess": {
            const isMine = message.playerId === currentPlayerId;

            return (
                <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMine ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-100"
                            }`}
                    >
                        {!isMine && (
                            <p className="text-xs font-semibold text-emerald-400">
                                {message.displayName}
                            </p>
                        )}
                        <p className="wrap-break-word">{message.text}</p>
                        <p
                            className={`mt-0.5 text-xs ${isMine ? "text-slate-900/70" : "text-slate-400"
                                }`}
                        >
                            {message.correct ? "✓ Correct" : "✗ Not it"}
                        </p>
                    </div>
                </div>
            );
        }

        case "result":
            return (
                <ResultCard result={message.result} currentPlayerId={currentPlayerId} />
            );
    }
}

function ResultCard({
    result,
    currentPlayerId,
}: {
    result: GameEnded;
    currentPlayerId: string;
}) {
    const { winner } = result;
    const iWon = winner?.playerId === currentPlayerId;

    let headline = "Time's up! Nobody guessed it in time.";
    if (winner) {
        headline = iWon ? "You have won!" : `${winner.displayName} won this round!`;
    }

    return (
        <div
            role="status"
            className={`rounded-xl border p-4 ${winner
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-amber-500/40 bg-amber-500/10"
                }`}
        >
            <p className="text-lg font-semibold">{headline}</p>
            <p className="mt-2 text-sm text-slate-300">
                Correct answer:{" "}
                <span className="font-semibold text-white">{result.answer}</span>
            </p>
            {winner && result.pointsAwarded > 0 && (
                <p className="mt-1 text-sm text-slate-300">
                    {iWon ? "You earned" : `${winner.displayName} earned`}
                    {result.pointsAwarded} points.
                </p>
            )}
        </div>
    );
}