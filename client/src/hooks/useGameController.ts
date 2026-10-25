import { useCallback, useReducer } from "react";
import { gameReducer, initialGameState } from "../lib/gameReducer";
import { useGameSocket } from "./useGameSocket";
import { EVENTS } from "../constants/event";
/** Wires socket events into the game reducer and exposes player actions. */
export function useGameController() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  const { socket, connected } = useGameSocket({
    onRoomCreated: ({ roomCode, playerId }) =>
      dispatch({ type: "room_entered", roomCode, playerId }),
    onRoomJoined: ({ roomCode, playerId }) =>
      dispatch({ type: "room_entered", roomCode, playerId }),
    onRoomUpdate: (room) => dispatch({ type: "room_updated", room }),
    onGameConfigured: () => dispatch({ type: "question_saved" }),
    onGameStarted: (round) =>
      dispatch({
        type: "round_started",
        round,
        clockOffset:
          round.serverTime === undefined ? 0 : round.serverTime - Date.now(),
      }),
    onGuessMade: (guess) => dispatch({ type: "guess_made", guess }),
    onGameEnded: (result) => dispatch({ type: "round_ended", result }),
    onGameCancelled: ({ message }) =>
      dispatch({ type: "round_cancelled", message }),
    onGameError: ({ message }) => dispatch({ type: "error_set", message }),
    onDisconnected: () => dispatch({ type: "disconnected" }),
  });

  const send = useCallback(
    (event: string, payload?: unknown) => {
      if (!socket.connected) {
        dispatch({
          type: "error_set",
          message: "Not connected to the game server.",
        });
        return;
      }

      dispatch({ type: "error_cleared" });

      if (payload === undefined) {
        socket.emit(event);
      } else {
        socket.emit(event, payload);
      }
    },
    [socket],
  );

  const createRoom = useCallback(
    (displayName: string) =>
      send(EVENTS.ROOM_CREATE, { displayName: displayName.trim() }),
    [send],
  );

  const joinRoom = useCallback(
    (displayName: string, roomCode: string) =>
      send(EVENTS.ROOM_JOIN, {
        displayName: displayName.trim(),
        roomCode: roomCode.trim().toUpperCase(),
      }),
    [send],
  );

  const saveQuestion = useCallback(
    (question: string, answer: string) =>
      send(EVENTS.GAME_CONFIGURE, { question, answer }),
    [send],
  );

  const startGame = useCallback(() => send(EVENTS.GAME_START), [send]);

  const submitGuess = useCallback(
    (guess: string) => send(EVENTS.GAME_GUESS, { guess }),
    [send],
  );

  const leaveRoom = useCallback(() => {
    if (socket.connected) socket.emit(EVENTS.ROOM_LEAVE);
    dispatch({ type: "reset" });
  }, [socket]);

  const dismissError = useCallback(
    () => dispatch({ type: "error_cleared" }),
    [],
  );

  const me = state.room?.players.find((p) => p.playerId === state.playerId);
  const gameMaster = state.room?.players.find((p) => p.isGameMaster);

  return {
    connected,
    room: state.room,
    playerId: state.playerId,
    round: state.round,
    attemptsLeft: state.attemptsLeft,
    questionSaved: state.questionSaved,
    messages: state.messages,
    error: state.error,
    isGameMaster: me?.isGameMaster ?? false,
    gameMasterName: gameMaster?.displayName,
    createRoom,
    joinRoom,
    saveQuestion,
    startGame,
    submitGuess,
    leaveRoom,
    dismissError,
  };
}

export type GameController = ReturnType<typeof useGameController>;
