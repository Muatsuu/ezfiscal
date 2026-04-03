import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  user_email: string | null;
  content: string;
  created_at: string;
  user_id: string;
}

const NotaComments = ({ notaId }: { notaId: string }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from("nota_comments")
      .select("*")
      .eq("nota_id", notaId)
      .order("created_at", { ascending: true });
    setComments((data as Comment[]) || []);
    setLoading(false);
  }, [notaId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("nota_comments").insert({
      nota_id: notaId,
      user_id: user.id,
      user_email: user.email || "",
      content: text.trim(),
    });
    if (error) {
      toast.error("Erro ao enviar comentário");
    } else {
      setText("");
      await fetchComments();
    }
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("nota_comments").delete().eq("id", id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
        <MessageSquare className="w-3.5 h-3.5 text-primary" />
        Comentários ({comments.length})
      </h4>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
          <Loader2 className="w-3 h-3 animate-spin" /> Carregando...
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Nenhum comentário ainda.</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {comments.map((c) => (
            <div key={c.id} className="group flex gap-2 px-3 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary uppercase">
                  {(c.user_email || "?")[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground truncate">
                    {c.user_email?.split("@")[0] || "Usuário"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{formatTime(c.created_at)}</span>
                </div>
                <p className="text-xs text-foreground/80 mt-0.5 break-words">{c.content}</p>
              </div>
              {user?.id === c.user_id && (
                <button onClick={() => handleDelete(c.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Adicionar comentário..."
          className="flex-1 px-3 py-2.5 rounded-xl bg-secondary text-foreground text-xs placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={handleSend} disabled={!text.trim() || sending}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:brightness-110 transition-all">
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

export default NotaComments;
