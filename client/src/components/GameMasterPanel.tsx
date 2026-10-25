import { useState, type FormEvent } from "react";
import { MIN_PLAYERS } from "../constants/game";

const FIELD =
    "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none transition focus:border-emerald-400";

type GameMasterPanelProps = {
    playerCount: number;
    questionSaved: boolean;
    onSave: (question: string, answer: string) => void;
    onStart: () => void;
};

export function GameMasterPanel({
    playerCount,
    questionSaved,
    onSave,
    onStart,
}: GameMasterPanelProps) {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [saved, setSaved] = useState<{ question: string; answer: string } | null>(
        null,
    );

    const trimmedQuestion = question.trim();
    const trimmedAnswer = answer.trim();

    const isValid =
        trimmedQuestion.length >= 5 &&
        trimmedQuestion.length <= 500 &&
        trimmedAnswer.length >= 1 &&
        trimmedAnswer.length <= 200;

    // Editing after a save means the server's draft is stale until saved again.
    const isDirty =
        saved === null ||
        saved.question !== trimmedQuestion ||
        saved.answer !== trimmedAnswer;

    const hasEnoughPlayers = playerCount >= MIN_PLAYERS;
    const canStart = questionSaved && !isDirty && hasEnoughPlayers;

    const handleSave = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isValid) return;

        setSaved({ question: trimmedQuestion, answer: trimmedAnswer });
        onSave(trimmedQuestion, trimmedAnswer);
    };

    return (
        <form onSubmit={handleSave} className="space-y-3">
            <p className="text-sm font-semibold text-slate-200">
                You are the Game Master. Set a question for the players.
            </p>

            <label className="block text-sm text-slate-300">
                Question
                <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="What is the capital of France?"
                    className={FIELD}
                />
            </label>

            <label className="block text-sm text-slate-300">
                Answer (hidden until the round ends)
                <input
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    maxLength={200}
                    placeholder="Paris"
                    className={FIELD}
                />
            </label>

            <p className="text-xs text-slate-400">
                {hasEnoughPlayers
                    ? `${playerCount} players in the room. Ready when you are.`
                    : `Waiting for players: ${playerCount} of ${MIN_PLAYERS} needed.`}
            </p>

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={!isValid || !isDirty}
                    className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 font-semibold transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isDirty ? "Save question" : "Saved"}
                </button>
                <button
                    type="button"
                    onClick={onStart}
                    disabled={!canStart}
                    className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Start game
                </button>
            </div>
        </form>
    );
}