import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export interface StreamMessage extends Partial<Message> {
  id: number | string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function useChatStream(conversationId: number | null) {
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize local state from DB when conversation changes
  const initMessages = useCallback((dbMessages: Message[]) => {
    setMessages(dbMessages.map(m => ({ ...m })));
  }, []);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !content.trim()) return;

    // Optimistically add user message
    const userMsgId = `temp-user-${Date.now()}`;
    const assistantMsgId = `temp-ast-${Date.now()}`;
    
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: "user", content, conversationId },
      { id: assistantMsgId, role: "assistant", content: "", conversationId, isStreaming: true }
    ]);

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      const url = buildUrl(api.messages.create.path, { id: conversationId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error("Failed to send message");
      
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          
          try {
            const dataStr = line.slice(6);
            if (!dataStr.trim()) continue;
            
            const event = JSON.parse(dataStr);
            
            if (event.error) {
              throw new Error(event.error);
            }

            if (event.content) {
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMsgId 
                  ? { ...msg, content: msg.content + event.content }
                  : msg
              ));
            }

            if (event.done) {
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMsgId 
                  ? { ...msg, isStreaming: false }
                  : msg
              ));
              break;
            }
          } catch (e) {
            console.error("Failed to parse SSE chunk:", line, e);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        toast({
          title: "Message failed",
          description: error.message || "An error occurred while sending the message.",
          variant: "destructive"
        });
        // Remove the temporary assistant message on error
        setMessages(prev => prev.filter(msg => msg.id !== assistantMsgId));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      // Invalidate to fetch final saved messages with real DB IDs
      queryClient.invalidateQueries({ queryKey: [api.conversations.get.path, conversationId] });
    }
  }, [conversationId, queryClient, toast]);

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStream,
    initMessages,
    setMessages
  };
}
