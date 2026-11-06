import { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export function AccountMenu({ bottom = false }: { bottom?: boolean }) {
  const { user, fullName, isAdmin, signingOut, logout } = useAccount();
  const [confirm, setConfirm] = useState(false);
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label={bottom ? "Perfil" : "Abrir menu da conta"} className={bottom ? "h-full w-full flex-col gap-0.5 rounded-none text-muted-foreground" : "min-w-0 max-w-[150px] gap-1 px-2 text-foreground"}>
          <User className="h-5 w-5 shrink-0" />
          <span className={bottom ? "text-[10px]" : "truncate text-xs"}>{bottom ? "Perfil" : user ? fullName : "Entrar"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={bottom ? "top" : "bottom"} className="z-[80] max-w-[calc(100vw-24px)]">
        {user ? <>
          <div className="px-2 py-2 text-sm font-semibold break-words">{fullName}</div>
          <DropdownMenuItem asChild><Link to="/dashboard"><User className="mr-2 h-4 w-4" />Meu painel</Link></DropdownMenuItem>
          <DropdownMenuItem disabled={signingOut} onClick={() => void logout()} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Sair da conta</DropdownMenuItem>
          {isAdmin && <DropdownMenuItem onClick={() => setConfirm(true)}>Sair de todos os aparelhos</DropdownMenuItem>}
        </> : <><DropdownMenuItem asChild><Link to="/login">Entrar</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/cadastro">Cadastro</Link></DropdownMenuItem></>}
      </DropdownMenuContent>
    </DropdownMenu>
    <AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Sair de todos os aparelhos?</AlertDialogTitle><AlertDialogDescription>As sessões abertas da sua conta serão encerradas. Será necessário entrar novamente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction disabled={signingOut} onClick={() => void logout(true)}>Sair de todos os aparelhos</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}