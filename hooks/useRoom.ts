"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PartySocket from "partysocket";
import { getPartyHost } from "@/lib/partyHost";
import { getClientId } from "@/lib/clientId";
import type { ClientMessage, ClientRoomState, ServerMessage } from "@/party/types";

interface UseRoomResult {
  state: ClientRoomState | null;
  error: string | null;
  connected: boolean;
  selfId: string;
  join: (name: string) => void;
  startGame: () => void;
  beginHints: () => void;
  submitHint: (text: string) => void;
  castVote: (targetId: string) => void;
  revealNow: () => void;
  playAgain: () => void;
}

export function useRoom(roomCode: string): UseRoomResult {
  const socketRef = useRef<PartySocket | null>(null);
  const [state, setState] = useState<ClientRoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [selfId] = useState(() => getClientId());

  useEffect(() => {
    if (!roomCode) return;

    const socket = new PartySocket({
      host: getPartyHost(),
      room: roomCode.toLowerCase(),
      id: selfId,
    });
    socketRef.current = socket;

    socket.addEventListener("open", () => setConnected(true));
    socket.addEventListener("close", () => setConnected(false));
    socket.addEventListener("message", (event) => {
      const message: ServerMessage = JSON.parse(event.data);
      if (message.type === "state") {
        setState(message.state);
        setError(null);
      } else if (message.type === "error") {
        setError(message.message);
      }
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [roomCode, selfId]);

  const send = useCallback((message: ClientMessage) => {
    socketRef.current?.send(JSON.stringify(message));
  }, []);

  return {
    state,
    error,
    connected,
    selfId,
    join: (name) => send({ type: "join", name }),
    startGame: () => send({ type: "start-game" }),
    beginHints: () => send({ type: "begin-hints" }),
    submitHint: (text) => send({ type: "submit-hint", text }),
    castVote: (targetId) => send({ type: "cast-vote", targetId }),
    revealNow: () => send({ type: "reveal-now" }),
    playAgain: () => send({ type: "play-again" }),
  };
}
