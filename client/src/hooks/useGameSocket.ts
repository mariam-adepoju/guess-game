import { useEffect, useRef, useState } from "react";
import { EVENTS } from "../constants/event";
import type { Socket } from "socket.io-client";
import { createGameSocket } from "../services/socket.service";

import type {
  GameEnded,
  GameError,
  GameRoom,
  GameStarted,
  GuessMade,
  RoomResponse,
} from "../types/game.types";

export type GameSocketHandlers = {
  onRoomCreated: (data: RoomResponse) => void;
  onRoomJoined: (data: RoomResponse) => void;
  onRoomUpdate: (data: GameRoom) => void;
  onGameConfigured: () => void;
  onGameStarted: (data: GameStarted) => void;
  onGuessMade: (data: GuessMade) => void;
  onGameEnded: (data: GameEnded) => void;
  onGameCancelled: (data: GameError) => void;
  onGameError: (data: GameError) => void;
  onDisconnected: () => void;
};

/** Owns the Socket.IO connection and forwards server events to the latest handlers. */
export function useGameSocket(handlers: GameSocketHandlers) {
  // Created once, connected in the effect below (autoConnect off keeps StrictMode safe).
  const [socket] = useState<Socket>(createGameSocket);
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(handlers);

  // Keep callbacks current without reconnecting on every render.
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => {
      setConnected(false);
      handlersRef.current.onDisconnected();
    });

    socket.on(EVENTS.ROOM_CREATED, (data: RoomResponse) =>
      handlersRef.current.onRoomCreated(data),
    );
    socket.on(EVENTS.ROOM_JOINED, (data: RoomResponse) =>
      handlersRef.current.onRoomJoined(data),
    );
    socket.on(EVENTS.ROOM_UPDATE, (data: GameRoom) =>
      handlersRef.current.onRoomUpdate(data),
    );
    socket.on(EVENTS.GAME_CONFIGURED, () =>
      handlersRef.current.onGameConfigured(),
    );
    socket.on(EVENTS.GAME_STARTED, (data: GameStarted) =>
      handlersRef.current.onGameStarted(data),
    );
    socket.on(EVENTS.GAME_GUESS_MADE, (data: GuessMade) =>
      handlersRef.current.onGuessMade(data),
    );
    socket.on(EVENTS.GAME_ENDED, (data: GameEnded) =>
      handlersRef.current.onGameEnded(data),
    );
    socket.on(EVENTS.GAME_CANCELLED, (data: GameError) =>
      handlersRef.current.onGameCancelled(data),
    );
    socket.on(EVENTS.GAME_ERROR, (data: GameError) =>
      handlersRef.current.onGameError(data),
    );

    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [socket]);

  return { socket, connected };
}
