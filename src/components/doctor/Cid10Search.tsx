import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type Cid10Item, formatCid, loadCid10, searchCid10 } from "@/lib/cid10";

interface Props {
  value: string;
  onChange: (text: string) => void;
  onSelect: (item: Cid10Item) => void;
  placeholder?: string;
}

/** Campo de diagnóstico com busca no CID-10 oficial (código ou palavras, sem acento). */
export function Cid10Search({ value, onChange, onSelect, placeholder }: Props) {
  const [items, setItems] = useState<Cid10Item[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || items || loading) return;
    setLoading(true);
    loadCid10()
      .then(setItems)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [open, items, loading]);

  const results = useMemo(() => (items ? searchCid10(items, value, 15) : []), [items, value]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        className="pl-9"
        value={value}
        placeholder={placeholder ?? "Busque o CID-10 por código (G43.9) ou palavra (enxaqueca)"}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && value.trim().length >= 2 && (
        <div className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {loading && (
            <p className="p-3 text-xs text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Carregando CID-10...
            </p>
          )}
          {failed && <p className="p-3 text-xs text-red-600">Não foi possível carregar o CID-10. Digite o diagnóstico livremente.</p>}
          {items && results.length === 0 && <p className="p-3 text-xs text-muted-foreground">Nenhum código encontrado.</p>}
          {results.map((item) => (
            <button
              key={item[0]}
              type="button"
              className="block w-full text-left px-3 py-2 text-sm hover:bg-muted"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(item);
                onChange(formatCid(item));
                setOpen(false);
              }}
            >
              <span className="font-mono font-bold text-emerald-700 mr-2">{item[0]}</span>
              {item[1]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
