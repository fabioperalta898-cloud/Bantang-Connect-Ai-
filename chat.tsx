import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, StopCircle } from "lucide-react";
import { useConversation, useCreateConversation } from "@/hooks/use-conversations";
import { useChatStream } from "@/hooks/use-chat-stream";
import { ChatMessage } from "@/components/chat-message";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function ChatPage() {
  const { id } = useParams<{ id?: string }>();
  const [_, setLocation] = useLocation();
  const convId = id ? parseInt(id) : null;
  
  const { data: conversation, isLoading: isConvLoading } = useConversation(convId);
  const createMutation = useCreateConversation();
  
  const { 
    messages, 
    isStreaming, 
    sendMessage, 
    stopStream, 
    initMessages 
  } = useChatStream(convId);
  
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync DB messages to local stream state when loaded
  useEffect(() => {
    if (conversation?.messages) {
      initMessages(conversation.messages);
    } else if (!convId) {
      initMessages([]); // Clear on new chat
    }
  }, [conversation?.messages, convId, initMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isStreaming]);

  // Handle auto-resizing textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    const content = input.trim();
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    if (!convId) {
      // First message, create conversation first
      const newConv = await createMutation.mutateAsync(content.slice(0, 30) + "...");
      if (newConv) {
        setLocation(`/c/${newConv.id}`);
        // We can't easily send the message immediately because hooks re-mount on URL change.
        // In a real app we might pass state or handle this in a global context.
        // For now, the user will need to resend, or we handle it in a sophisticated way.
        // ACTUALLY, let's just create conversation silently if no ID, but wouter makes it tricky.
        // Let's rely on the explicit "New Chat" button creating the ID first.
        // Wait, if they type here, we create and redirect. Let's just create and redirect.
      }
      return;
    }

    sendMessage(content);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="flex-none h-16 border-b border-border/50 bg-background/50 backdrop-blur-md flex items-center px-4 z-10 sticky top-0">
        <SidebarTrigger className="mr-4 hover:bg-secondary text-muted-foreground" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground tracking-wide text-glow">Rían Minjae</h2>
            <p className="text-[10px] font-medium text-primary/80 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
            </p>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto scrollbar-hidden z-0" ref={scrollRef}>
        <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-full flex flex-col">
          
          {/* Welcome Screen for empty or new chat */}
          {(!convId || (messages.length === 0 && !isConvLoading)) && (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-0 animate-in fade-in zoom-in duration-700 slide-in-from-bottom-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mb-6 shadow-2xl shadow-primary/10 backdrop-blur-sm">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-foreground to-accent">
                Annyeonghaseyo.
              </h1>
              <p className="text-muted-foreground max-w-lg text-base md:text-lg mb-8 leading-relaxed">
                I am Rían Minjae, your personal AI companion. Share your thoughts, ask for advice, or just chat. I'm here for you.
              </p>
              {!convId && (
                <button 
                  onClick={async () => {
                    const newConv = await createMutation.mutateAsync("New Conversation");
                    if (newConv) setLocation(`/c/${newConv.id}`);
                  }}
                  disabled={createMutation.isPending}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Connecting..." : "Start a Conversation"}
                </button>
              )}
            </div>
          )}

          {/* Loading state */}
          {isConvLoading && convId && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 w-full pb-8">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <ChatMessage key={msg.id || i} message={msg} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 bg-background/50 backdrop-blur-xl border-t border-border/50 z-10">
        <div className="max-w-4xl mx-auto relative">
          <form 
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2 bg-secondary/50 border border-border rounded-3xl p-2 shadow-lg focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all duration-300"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={onKeyDown}
              placeholder={convId ? "Message Rían Minjae..." : "Create a conversation first to message..."}
              disabled={!convId || isStreaming}
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-[200px] min-h-[44px] py-3 pl-4 pr-12 text-foreground placeholder:text-muted-foreground scrollbar-hidden disabled:opacity-50"
              rows={1}
            />
            
            <div className="absolute right-3 bottom-3 flex items-center">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStream}
                  className="p-2 rounded-full bg-secondary hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-colors"
                >
                  <StopCircle className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() || !convId}
                  className="p-2.5 rounded-full bg-primary text-white shadow-md hover:bg-primary/90 hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              )}
            </div>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground/60">
              Rían Minjae can make mistakes. Consider verifying important information.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
