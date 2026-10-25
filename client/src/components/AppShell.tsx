import type { ReactNode } from "react";

type AppShellProps = {
    connected: boolean;
    error: string;
    onDismissError: () => void;
    children: ReactNode;
};

export function AppShell({
    connected,
    error,
    onDismissError,
    children,
}: AppShellProps) {
    return (
        <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
            <div className="mx-auto max-w-4xl">
                <header className="mb-8 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                            Multiplayer challenge
                        </p>
                        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Guessing Game</h1>
                        <p className="mt-2 text-slate-400">
                            Create a room or join your friends.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-sm">
                        <span
                            className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"
                                }`}
                        />
                        <span className="text-slate-300">
                            {connected ? "Connected" : "Offline"}
                        </span>
                    </div>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
                    >
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={onDismissError}
                            aria-label="Dismiss error"
                            className="text-red-300 transition hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {children}
            </div>
        </main>
    );
}