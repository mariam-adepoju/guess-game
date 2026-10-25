type RouteMessageProps = {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

export function RouteMessage({ title, message, actionLabel, onAction }: RouteMessageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-slate-400">{message}</p>
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400"
        >
          {actionLabel}
        </button>
      </section>
    </main>
  );
}
