import { useCountdown } from "../hooks/useCountdown";
import type { ActiveRound } from "../types/game.types";

type RoundStatusProps = {
    round: ActiveRound | null;
    attemptsLeft: number | null;
    isGameMaster: boolean;
};

export function RoundStatus({ round, attemptsLeft, isGameMaster }: RoundStatusProps) {
    if (!round) {
        return (
            <div className="border-b border-slate-800 px-4 py-3 text-sm text-slate-400 sm:px-6">
                No round in progress.
            </div>
        );
    }

    return (
        <div className="flex items-center gap-6 border-b border-slate-800 px-4 py-3 sm:px-6">
            {/* key remounts the countdown for every new round */}
            <Countdown key={round.endsAt} round={round} />
            <p className="shrink-0 text-sm text-slate-300">
                {isGameMaster
                    ? "You set this question"
                    : attemptsLeft !== null && `Attempts left: ${attemptsLeft}`}
            </p>
        </div>
    );
}

function Countdown({ round }: { round: ActiveRound }) {
    const secondsLeft = useCountdown(round.endsAt, round.clockOffset);
    const percent = Math.min(100, (secondsLeft / round.durationSeconds) * 100);
    const isUrgent = secondsLeft <= 10;

    return (
        <div className="flex-1">
            <p className="text-sm text-slate-300">
                <span
                    className={`font-mono text-lg font-bold ${isUrgent ? "text-red-400" : "text-emerald-400"
                        }`}
                >
                    {secondsLeft}s
                </span>{" "}
                left
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                    className={`h-full rounded-full transition-[width] duration-300 ${isUrgent ? "bg-red-400" : "bg-emerald-400"
                        }`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}