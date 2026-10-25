import { useState, type FormEvent } from "react";

type ChatComposerProps = {
    placeholder: string;
    disabled?: boolean;
    onSend: (text: string) => void;
};

export function ChatComposer({
    placeholder,
    disabled = false,
    onSend,
}: ChatComposerProps) {
    const [text, setText] = useState("");

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const value = text.trim();
        if (!value || disabled) return;

        onSend(value);
        setText("");
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <label htmlFor="guess" className="sr-only">
                Your guess
            </label>
            <input
                id="guess"
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={200}
                disabled={disabled}
                placeholder={placeholder}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-emerald-400 disabled:opacity-50"
            />
            <button
                type="submit"
                disabled={disabled || !text.trim()}
                className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Send
            </button>
        </form>
    );
}