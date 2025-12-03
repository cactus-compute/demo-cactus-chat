import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Message } from 'cactus-react-native';
import { deleteImagesForSession } from '../utils/imageHelpers';

export interface MessageWithMetrics extends Message {
  metrics?: {
    timeToFirstTokenMs: number;
    tokensPerSecond: number;
    decodeTokens: number;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: MessageWithMetrics[];
}

interface ChatState {
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  currentMessages: MessageWithMetrics[];
  addMessage: (message: MessageWithMetrics) => void;
  updateLastMessage: (content: string) => void;
  createNewSession: () => string;
  clearCurrentSession: () => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  getCurrentSession: () => ChatSession | null;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chatSessions: [],
      currentSessionId: null,
      currentMessages: [],

      addMessage: (message) =>
        set((state) => {
          const newMessages = [...state.currentMessages, message];
          const sessionId = state.currentSessionId;

          if (sessionId) {
            const updatedSessions = state.chatSessions.map((session) =>
              session.id === sessionId
                ? {
                    ...session,
                    messages: newMessages,
                    updatedAt: new Date(),
                    title:
                      newMessages.length === 1
                        ? newMessages[0]?.content?.slice(0, 50) || session.title
                        : session.title,
                  }
                : session
            );
            return {
              currentMessages: newMessages,
              chatSessions: updatedSessions,
            };
          }

          return { currentMessages: newMessages };
        }),

      updateLastMessage: (content) =>
        set((state) => {
          const newMessages = [...state.currentMessages];
          if (newMessages.length > 0) {
            const lastMessage = newMessages[newMessages.length - 1];
            newMessages[newMessages.length - 1] = {
              ...lastMessage,
              content,
            };
          }

          const sessionId = state.currentSessionId;
          if (sessionId) {
            const updatedSessions = state.chatSessions.map((session) =>
              session.id === sessionId
                ? {
                    ...session,
                    messages: newMessages,
                    updatedAt: new Date(),
                  }
                : session
            );
            return {
              currentMessages: newMessages,
              chatSessions: updatedSessions,
            };
          }

          return { currentMessages: newMessages };
        }),

      createNewSession: () => {
        const sessionId = `session-${Date.now()}-${Math.random()}`;
        const newSession: ChatSession = {
          id: sessionId,
          title: 'New Chat',
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
        };

        set((state) => ({
          chatSessions: [newSession, ...state.chatSessions],
          currentSessionId: sessionId,
          currentMessages: [],
        }));

        return sessionId;
      },

      clearCurrentSession: () =>
        set({
          currentSessionId: null,
          currentMessages: [],
        }),

      loadSession: (sessionId) =>
        set((state) => {
          const session = state.chatSessions.find((s) => s.id === sessionId);
          if (session) {
            return {
              currentSessionId: sessionId,
              currentMessages: session.messages,
            };
          }
          return state;
        }),

      deleteSession: (sessionId) =>
        set((state) => {
          const session = state.chatSessions.find((s) => s.id === sessionId);

          // Clean up images from deleted session
          if (session) {
            const imageUris = session.messages
              .filter((m) => m.images && m.images.length > 0)
              .flatMap((m) => m.images || []);

            if (imageUris.length > 0) {
              deleteImagesForSession(imageUris).catch((error) =>
                console.error('Error cleaning up session images:', error)
              );
            }
          }

          return {
            chatSessions: state.chatSessions.filter((s) => s.id !== sessionId),
            currentSessionId:
              state.currentSessionId === sessionId
                ? null
                : state.currentSessionId,
            currentMessages:
              state.currentSessionId === sessionId ? [] : state.currentMessages,
          };
        }),

      getCurrentSession: () => {
        const state = get();
        return (
          state.chatSessions.find((s) => s.id === state.currentSessionId) ||
          null
        );
      },
    }),
    {
      name: 'cactus-chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
