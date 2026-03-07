import { memo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StreamMessage } from "@/hooks/use-chat-stream";

interface ChatMessageProps {
  message: StreamMessage;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex w-full mb-6 group",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("flex max-w-[85%] md:max-w-[75%] gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
        
        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          <div className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105",
            isUser 
              ? "bg-secondary/50 border border-white/10" 
              : "bg-gradient-to-br from-primary to-accent shadow-primary/25 border border-white/20"
          )}>
            {isUser ? (
              <User className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col gap-1 min-w-0">
          <span className={cn(
            "text-xs font-medium tracking-wide uppercase px-1",
            isUser ? "text-right text-muted-foreground" : "text-left text-primary/80"
          )}>
            {isUser ? "You" : "Rían Minjae"}
          </span>
          
          <div className={cn(
            "px-5 py-4 rounded-3xl relative overflow-hidden",
            isUser 
              ? "glass-bubble-user rounded-tr-sm" 
              : "glass-bubble-ai rounded-tl-sm",
            message.isStreaming && !isUser && "animate-pulse"
          )}>
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed break-words">
                {message.content}
              </p>
            ) : (
              <div className="prose prose-invert max-w-none text-sm md:text-base break-words">
                {message.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <span className="flex gap-1 items-center h-6">
                    <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
});
