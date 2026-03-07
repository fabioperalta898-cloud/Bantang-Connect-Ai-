import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Conversation, Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type ConversationWithMessages = Conversation & { messages: Message[] };

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: [api.conversations.list.path],
    queryFn: async () => {
      const res = await fetch(api.conversations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return api.conversations.list.responses[200].parse(await res.json());
    },
  });
}

export function useConversation(id: number | null) {
  return useQuery<ConversationWithMessages | null>({
    queryKey: [api.conversations.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.conversations.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return api.conversations.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (title?: string) => {
      const res = await fetch(api.conversations.create.path, {
        method: api.conversations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "New Conversation" }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return api.conversations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create conversation",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.conversations.delete.path, { id });
      const res = await fetch(url, {
        method: api.conversations.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete conversation");
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
      queryClient.removeQueries({ queryKey: [api.conversations.get.path, deletedId] });
      toast({
        title: "Deleted",
        description: "Conversation removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete conversation",
        variant: "destructive",
      });
    },
  });
}
