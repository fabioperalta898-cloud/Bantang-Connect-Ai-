import { Link, useLocation } from "wouter";
import { Plus, MessageSquare, Trash2, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useConversations, useCreateConversation, useDeleteConversation } from "@/hooks/use-conversations";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { data: conversations = [], isLoading } = useConversations();
  const createMutation = useCreateConversation();
  const deleteMutation = useDeleteConversation();

  const handleNewChat = async () => {
    const newConv = await createMutation.mutateAsync("New Conversation");
    if (newConv) {
      setLocation(`/c/${newConv.id}`);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      deleteMutation.mutate(id);
      if (location === `/c/${id}`) {
        setLocation("/");
      }
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 pt-6">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-display font-bold text-lg text-foreground tracking-tight">
            Bangtan Connect
          </h1>
        </div>
        
        <Button 
          onClick={handleNewChat} 
          disabled={createMutation.isPending}
          className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl h-11"
        >
          <Plus className="w-4 h-4" />
          {createMutation.isPending ? "Starting..." : "New Chat"}
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4">
            Recent Conversations
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground italic">No conversations yet.</div>
            ) : (
              <SidebarMenu className="gap-1 px-2">
                {conversations.map((conv) => {
                  const isActive = location === `/c/${conv.id}`;
                  return (
                    <SidebarMenuItem key={conv.id}>
                      <SidebarMenuButton asChild tooltip={conv.title}>
                        <Link 
                          href={`/c/${conv.id}`}
                          className={cn(
                            "flex items-center justify-between w-full p-3 rounded-xl transition-all duration-200 group",
                            isActive 
                              ? "bg-secondary text-foreground shadow-sm" 
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <MessageSquare className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70")} />
                            <div className="flex flex-col truncate">
                              <span className="truncate text-sm font-medium">{conv.title || "New Chat"}</span>
                              {conv.createdAt && (
                                <span className="text-[10px] opacity-60">
                                  {format(new Date(conv.createdAt), "MMM d, h:mm a")}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => handleDelete(e, conv.id)}
                            className={cn(
                              "p-1.5 rounded-md hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-colors",
                              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        <div className="text-xs text-muted-foreground/60 text-center font-medium">
          Rían Minjae AI System
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
