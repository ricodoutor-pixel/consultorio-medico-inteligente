import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Share2, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

export default function Referrals() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);

  const { data: affiliateData } = trpc.affiliates.getStats.useQuery();
  const { data: linkData } = trpc.affiliates.generateLink.useQuery({});

  const affiliate = affiliateData?.data;
  const referralLink = linkData?.data?.link;

  const handleCopyCode = () => {
    if (affiliate?.referralCode) {
      navigator.clipboard.writeText(affiliate.referralCode);
      setCopied(true);
      toast.success('Codigo copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast.success('Link copiado!');
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator && referralLink) {
      try {
        await navigator.share({
          title: 'Planta & Raiz',
          text: 'Venha investir em cannabis medicinal comigo!',
          url: referralLink,
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Voce precisa estar logado</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Programa de Afiliados</h1>
          <p className="text-muted-foreground">
            Ganhe comissoes indicando novos usuarios
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Indicacoes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{affiliate?.totalReferrals || 0}</div>
              <p className="text-xs text-muted-foreground">Usuarios indicados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissoes Ganhas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                R$ {affiliate ? (affiliate.totalCommissions / 100).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Taxa: {affiliate?.commissionRate || 10}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code */}
        <Card>
          <CardHeader>
            <CardTitle>Seu Codigo de Referencia</CardTitle>
            <CardDescription>Compartilhe para ganhar comissoes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={affiliate?.referralCode || ''}
                className="font-mono font-bold text-center"
              />
              <Button onClick={handleCopyCode} size="icon" variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Link de Referencia</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={referralLink || ''}
                  className="text-sm"
                />
                <Button onClick={handleCopyLink} size="icon" variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <Button onClick={handleShare} size="icon" variant="outline">
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Indicados</CardTitle>
            <CardDescription>Historico de usuarios indicados</CardDescription>
          </CardHeader>
          <CardContent>
            {!affiliate?.referrals || affiliate.referrals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Voce ainda nao tem indicacoes</p>
                <p className="text-sm text-muted-foreground">
                  Comece a compartilhar seu codigo para ganhar comissoes
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {affiliate.referrals.map((ref) => (
                  <div key={ref.id} className="flex justify-between items-center py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">Usuario #{ref.referredId}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(ref.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">R$ {(ref.depositAmount / 100).toFixed(2)}</p>
                      <p className="text-sm text-green-600">
                        +R$ {(ref.commissionEarned / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { step: 1, title: 'Compartilhe seu codigo', desc: 'Envie para amigos e familia' },
                { step: 2, title: 'Eles se cadastram', desc: 'Usando seu codigo de referencia' },
                { step: 3, title: 'Eles fazem deposito', desc: 'Quando depositam, voce ganha comissao' },
                { step: 4, title: 'Receba suas comissoes', desc: 'Creditadas automaticamente' },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
