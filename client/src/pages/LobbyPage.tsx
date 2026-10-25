import { useState, type FormEvent } from "react";
import { validateDisplayName, validateRoomCode } from "../validations/lobby.validation";

type LobbyPageProps = {
  connected: boolean;
  initialRoomCode?: string;
  onCreateRoom: (displayName: string) => void;
  onJoinRoom: (displayName: string, roomCode: string) => void;
};

const FIELD =
  "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-emerald-400";

export function LobbyPage({
  connected,
  initialRoomCode = "",
  onCreateRoom,
  onJoinRoom,
}: LobbyPageProps) {
  const [displayName, setDisplayName] = useState("");
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [formError, setFormError] = useState("");

  const handleCreate = () => {
    const error = validateDisplayName(displayName);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");
    onCreateRoom(displayName);
  };

  const handleJoin = () => {
    const error = validateDisplayName(displayName) ?? validateRoomCode(roomCode);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");
    onJoinRoom(displayName, roomCode);
  };

  // Enter creates a room unless a room code was typed, in which case it joins.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (roomCode.trim()) handleJoin();
    else handleCreate();
  };

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
      <h2 className="text-xl font-semibold">Enter the game</h2>
      <p className="mt-2 text-sm text-slate-400">
        {initialRoomCode
          ? `You're joining room ${initialRoomCode}. Pick a display name to continue.`
          : "Choose a display name before creating or joining a room."}
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <label
          htmlFor="displayName"
          className="mt-6 block text-sm font-medium text-slate-300"
        >
          Your display name
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={30}
          placeholder="e.g. Mariam"
          autoComplete="nickname"
          className={FIELD}
        />

        <button
          type="button"
          onClick={handleCreate}
          disabled={!connected}
          className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create a room
        </button>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-sm text-slate-500">OR</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <label
          htmlFor="roomCode"
          className="block text-sm font-medium text-slate-300"
        >
          Room code
        </label>
        <input
          id="roomCode"
          value={roomCode}
          onChange={(event) =>
            setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
          }
          maxLength={6}
          placeholder="Enter 6-character code"
          autoComplete="off"
          className={`${FIELD} uppercase tracking-widest`}
        />

        <button
          type="submit"
          disabled={!connected}
          className="mt-3 w-full rounded-xl border border-slate-700 px-4 py-3 font-semibold transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Join a room
        </button>

        {formError && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {formError}
          </p>
        )}
      </form>
    </section>
  );
}