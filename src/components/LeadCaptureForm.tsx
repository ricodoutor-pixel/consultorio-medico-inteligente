import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const leadSchema = z.object({
  name: z.string().min(3, 'Nome completo é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'WhatsApp inválido'),
  crm: z.string().min(4, 'CRM é obrigatório'),
});

type LeadFormData = z.infer<typeof leadSchema>;

export function LeadCaptureForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      // 1. Inserir no CRM do Supabase
      const { error } = await (supabase as any).from('leads_crm').insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        crm: data.crm,
        status: 'lead_inbound',
        source: 'landing_page_convite',
      });

      if (error) {
        // Se for erro de duplicidade, podemos tratar, mas por padrão avisamos
        if (error.code === '23505') {
           // Continua, pois o lead já existe
        } else {
           throw error;
        }
      }

      toast({
        title: "Inscrição confirmada! 🌿",
        description: "Enviamos um convite exclusivo para o seu e-mail.",
      });

      // 3. Redirecionar para cadastro completo ou mostrar sucesso
      navigate('/cadastro-profissional?inbound=true');
      
    } catch (err: any) {
      toast({
        title: "Erro na inscrição",
        description: "Ocorreu um problema ao processar seu cadastro. Tente novamente.",
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full mx-auto relative z-10">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Garanta sua Vaga</h3>
        <p className="text-slate-500 text-sm">Preencha os dados abaixo para receber acesso imediato à plataforma.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-slate-700">Nome Completo</Label>
          <Input id="name" placeholder="Dr. João Silva" {...register('name')} className={errors.name ? 'border-red-500' : 'bg-slate-50 border-slate-200 focus-visible:ring-emerald-500'} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-slate-700">E-mail Principal</Label>
          <Input id="email" type="email" placeholder="medico@exemplo.com" {...register('email')} className={errors.email ? 'border-red-500' : 'bg-slate-50 border-slate-200 focus-visible:ring-emerald-500'} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-slate-700">WhatsApp</Label>
            <Input id="phone" placeholder="(11) 99999-9999" {...register('phone')} className={errors.phone ? 'border-red-500' : 'bg-slate-50 border-slate-200 focus-visible:ring-emerald-500'} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="crm" className="text-slate-700">CRM/UF</Label>
            <Input id="crm" placeholder="123456-SP" {...register('crm')} className={errors.crm ? 'border-red-500' : 'bg-slate-50 border-slate-200 focus-visible:ring-emerald-500'} />
            {errors.crm && <p className="text-red-500 text-xs mt-1">{errors.crm.message}</p>}
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full h-12 mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.6)] text-base">
          {isSubmitting ? (
            <>Processando... <Loader2 className="ml-2 h-5 w-5 animate-spin" /></>
          ) : (
            <>Criar Conta Gratuita <ArrowRight className="ml-2 h-5 w-5" /></>
          )}
        </Button>
      </form>
      
      <p className="text-center text-xs text-slate-400 mt-6 px-4">
        Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade. Seus dados estão seguros.
      </p>
    </div>
  );
}
