import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, CreditCard, QrCode, Bitcoin, Wallet, Lock, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GatewayHibridoCheckoutProps {
  amountBrl: number;
  productName: string;
  triggerComponent?: React.ReactNode;
}

export function GatewayHibridoCheckout({ amountBrl, productName, triggerComponent }: GatewayHibridoCheckoutProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock exchange rates
  const usdtAmount = (amountBrl / 5.20).toFixed(2);
  const btcAmount = (amountBrl / 350000).toFixed(6); // Simulando BTC a R$ 350k

  const handlePayment = (method: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsOpen(false);
      toast({
        title: "Pagamento Confirmado!",
        description: `Seu pagamento via ${method} foi aprovado com sucesso.`,
      });
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Endereço copiado para a área de transferência.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerComponent || (
          <Button className="w-full font-bold">Pagar R$ {amountBrl.toFixed(2)}</Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock className="text-primary h-5 w-5" /> 
            Checkout Seguro Sem Fronteiras
          </DialogTitle>
          <DialogDescription>
            Escolha como deseja pagar o seu {productName} no valor de R$ {amountBrl.toFixed(2)}.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pix" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pix" className="gap-2"><QrCode size={16} /> Pix</TabsTrigger>
            <TabsTrigger value="cartao" className="gap-2"><CreditCard size={16} /> Cartão</TabsTrigger>
            <TabsTrigger value="cripto" className="gap-2"><Bitcoin size={16} /> Cripto</TabsTrigger>
          </TabsList>

          {/* TAB: PIX */}
          <TabsContent value="pix">
            <Card className="border-border">
              <CardContent className="pt-6 space-y-4 flex flex-col items-center text-center">
                <div className="bg-white p-4 rounded-xl shadow-inner">
                  <QrCode className="h-40 w-40 text-black opacity-80" />
                </div>
                <div>
                  <p className="font-bold text-lg">R$ {amountBrl.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código abaixo</p>
                </div>
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input readOnly value="00020126360014br.gov.bcb.pix0114+5511999999999..." className="font-mono text-xs" />
                  <Button type="button" size="icon" onClick={() => copyToClipboard("00020126360014br.gov.bcb.pix0114+5511999999999")} variant="secondary">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="w-full mt-4" onClick={() => handlePayment("Pix")} disabled={isProcessing}>
                  {isProcessing ? "Processando..." : "Simular Pagamento Pix"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: CARTÃO */}
          <TabsContent value="cartao">
            <Card className="border-border">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Número do Cartão</Label>
                  <Input placeholder="0000 0000 0000 0000" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Validade</Label>
                    <Input placeholder="MM/AA" />
                  </div>
                  <div className="space-y-2">
                    <Label>CVC</Label>
                    <Input placeholder="123" type="password" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nome do Titular</Label>
                  <Input placeholder="NOME COMO NO CARTÃO" />
                </div>
                <Button className="w-full mt-4 font-bold" onClick={() => handlePayment("Cartão de Crédito")} disabled={isProcessing}>
                  {isProcessing ? "Processando..." : `Pagar R$ ${amountBrl.toFixed(2)}`}
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                  <ShieldCheck size={14} className="text-green-500" /> Pagamento 100% criptografado e seguro
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: CRIPTO */}
          <TabsContent value="cripto">
            <Card className="border-border border-purple-500/20 bg-purple-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="text-purple-500 h-5 w-5" /> 
                  Pagamento Descentralizado
                </CardTitle>
                <CardDescription>
                  Proteja sua privacidade médica e fuja de bloqueios bancários usando criptomoedas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="p-3 rounded-lg border border-border bg-background flex flex-col items-center justify-center gap-1">
                    <span className="text-xs text-muted-foreground">Tether (USDT - TRC20)</span>
                    <span className="font-bold text-green-500">{usdtAmount} USDT</span>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-background flex flex-col items-center justify-center gap-1">
                    <span className="text-xs text-muted-foreground">Bitcoin (BTC)</span>
                    <span className="font-bold text-orange-500">{btcAmount} BTC</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Endereço de Depósito (USDT TRC20)</Label>
                  <div className="flex w-full items-center space-x-2">
                    <Input readOnly value="TXYZ...endereco_cripto_privado" className="font-mono text-xs bg-background" />
                    <Button type="button" size="icon" onClick={() => copyToClipboard("TXYZ_endereco_cripto_privado")} variant="secondary">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button className="w-full mt-4 font-bold bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handlePayment("Criptomoeda")} disabled={isProcessing}>
                  {isProcessing ? "Verificando Blockchain..." : "Já realizei a transferência"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
