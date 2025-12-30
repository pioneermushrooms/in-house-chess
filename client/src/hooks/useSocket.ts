import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import { COOKIE_NAME } from "@shared/const";

// v2 - Enhanced logging for socket connection debugging
export function useSocket() {
  console.log("[useSocket] Hook called - initializing...");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log("[useSocket] useEffect running!");
    console.log("[useSocket] Creating socket connection with credentials...");
    
    // Use withCredentials to send httpOnly cookies automatically
    const newSocket = io(window.location.origin, {
      path: "/socket.io/",
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("[useSocket] Socket connected successfully");
      setConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[useSocket] Socket disconnected:", reason);
      setConnected(false);
    });

    newSocket.on("connect_error", (error: any) => {
      console.error("[useSocket] Connection error:", error.message);
    });

    newSocket.on("error", (error: any) => {
      const errorMsg = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
      console.error("[useSocket] Socket error:", errorMsg, error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, connected };
}
