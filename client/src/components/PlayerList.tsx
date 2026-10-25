import type { RoomPlayer } from "../types/game.types";

type PlayerListProps = {
    players: RoomPlayer[];
    currentPlayerId: string;
};

export function PlayerList({ players, currentPlayerId }: PlayerListProps) {
    const ranked = [...players].sort(
        (a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName),
    );

    return (
        <ul className="space-y-2">
            {ranked.map((player) => (
                <li
                    key={player.playerId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                    <div className="min-w-0">
                        <p className="truncate font-medium">
                            {player.displayName}
                            {player.playerId === currentPlayerId && (
                                <span className="ml-2 text-xs text-slate-400">(You)</span>
                            )}
                        </p>
                        {player.isGameMaster && (
                            <span className="text-xs font-medium text-emerald-400">
                                Game Master
                            </span>
                        )}
                    </div>
                    <p className="shrink-0 text-sm text-slate-300">{player.score} pts</p>
                </li>
            ))}
        </ul>
    );
}