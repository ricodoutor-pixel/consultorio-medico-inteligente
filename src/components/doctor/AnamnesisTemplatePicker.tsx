import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ANAMNESIS_TEMPLATES, applyTemplate } from "@/lib/anamnesis-templates";

/** Insere um modelo de anamnese/evolução nas notas sem apagar o que já foi escrito. */
export function AnamnesisTemplatePicker({ notes, onChange }: { notes: string; onChange: (text: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <FileText size={12} className="mr-1" /> Modelos
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ANAMNESIS_TEMPLATES.map((t) => (
          <DropdownMenuItem key={t.id} onSelect={() => onChange(applyTemplate(notes, t))}>
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
