import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageCircle, Phone, RefreshCcw } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  category: string;
  first_message: string | null;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  utm_source: string | null;
}

interface ChatMsg {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

const CATEGORY_BADGE: Record<string, string> = {
  paciente: "bg-emerald-500/20 text-emerald-300",
  medico: "bg-blue-500/20 text-blue-300",
  lojista: "bg-amber-500/20 text-amber-300",
  afiliado: "bg-purple-500/20 text-purple-300",
  investidor: "bg-pink-500/20 text-pink-300",
  imprensa: "bg-cyan-500/20 text-cyan-300",
  geral: "bg-slate-500/20 text-slate-300",
};

export default function Contatos() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("platform_contacts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter !== "all") q = q.eq("category", filter);
    const { data } = await q;
    setContacts((data as Contact[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if (!selected) return setMessages([]);
    (supabase as any)
      .from("platform_contact_messages")
      .select("*")
      .eq("contact_id", selected.id)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => setMessages((data as ChatMsg[]) ?? []));
  }, [selected]);

  return (
    <div className="min-h-dvh bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-4 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Contatos — Chat Brisa Interno</h1>
          <p className="text-xs text-white/50">
            Leads capturados pelo modal de chat interno (por categoria).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">Todas categorias</option>
            <option value="paciente">Paciente</option>
            <option value="medico">Médico</option>
            <option value="lojista">Lojista</option>
            <option value="afiliado">Afiliado</option>
            <option value="investidor">Investidor</option>
            <option value="imprensa">Imprensa</option>
            <option value="geral">Geral</option>
          </select>
          <button
            onClick={load}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm flex items-center gap-1.5"
          >
            <RefreshCcw size={14} /> Atualizar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] min-h-[calc(100vh-80px)]">
        <aside className="border-r border-slate-800 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/50">
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-center text-sm text-white/50 py-10">Nenhum contato ainda.</p>
          ) : (
            contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-900 transition ${
                  selected?.id === c.id ? "bg-slate-900" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-sm truncate">{c.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      CATEGORY_BADGE[c.category] || CATEGORY_BADGE.geral
                    }`}
                  >
                    {c.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Phone size={11} /> {c.phone}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-white/40 mt-1">
                  <span className="flex items-center gap-1">
                    <MessageCircle size={10} /> {c.message_count} msgs
                  </span>
                  <span>{new Date(c.created_at).toLocaleString("pt-BR")}</span>
                </div>
              </button>
            ))
          )}
        </aside>

        <section className="p-4 sm:p-6 overflow-y-auto">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-white/40 text-sm">
              Selecione um contato para ver a conversa.
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <div className="mb-4">
                <h2 className="text-lg font-bold">{selected.name}</h2>
                <p className="text-sm text-white/60">
                  {selected.phone} · <span className="capitalize">{selected.category}</span>
                  {selected.utm_source && <> · UTM: {selected.utm_source}</>}
                </p>
                <div className="mt-2 flex gap-2">
                  <a
                    href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-900 font-semibold"
                  >
                    Abrir WhatsApp
                  </a>
                </div>
              </div>
              <div className="space-y-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-emerald-500 text-slate-900 rounded-br-sm"
                          : "bg-slate-800 text-white/90 rounded-bl-sm border border-slate-700/50"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-xs text-white/40 text-center py-6">Sem mensagens ainda.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
