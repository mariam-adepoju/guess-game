import { useEffect } from "react";
import { AppShell } from "./components/AppShell";
import { RouteMessage } from "./components/RouteMessage";
import { usePathname } from "./hooks/usePathname";
import { useGameController } from "./hooks/useGameController";
import { LobbyPage } from "./pages/LobbyPage";
import { RoomPage } from "./pages/RoomPage";

const ROOM_PATH = /^\/rooms\/([A-Za-z0-9]{6})\/?$/;
function App() {
  const { pathname, navigate } = usePathname();
  const game = useGameController();
  const { room, leaveRoom } = game;

  const roomCode = room?.roomCode ?? null;
  const urlRoomCode = ROOM_PATH.exec(pathname)?.[1]?.toUpperCase() ?? null;

  // State drives the URL: being in a room puts its code in the address bar.
  useEffect(() => {
    if (roomCode) navigate(`/rooms/${roomCode}`);
  }, [roomCode, navigate]);

  // Pressing the browser's Back button out of a room leaves it.
  useEffect(() => {
    if (!roomCode) return;

    const handlePopState = () => {
      if (window.location.pathname === "/") leaveRoom();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [roomCode, leaveRoom]);

  const handleLeave = () => {
    leaveRoom();
    navigate("/");
  };

  if (pathname !== "/" && !urlRoomCode) {
    return (
      <RouteMessage
        title="Page not found"
        message="That page does not exist."
        actionLabel="Back to lobby"
        onAction={() => navigate("/")}
      />
    );
  }

  return (
    <AppShell
      connected={game.connected}
      error={game.error}
      onDismissError={game.dismissError}
    >
      {room ? (
        <RoomPage game={game} onLeave={handleLeave} />
      ) : (
        <LobbyPage
          key={urlRoomCode ?? "lobby"}
          connected={game.connected}
          initialRoomCode={urlRoomCode ?? ""}
          onCreateRoom={game.createRoom}
          onJoinRoom={game.joinRoom}
        />
      )}
    </AppShell>
  );
}

export default App;