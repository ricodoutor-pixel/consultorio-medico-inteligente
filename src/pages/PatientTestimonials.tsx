/**
 * Patient Testimonials & Reviews Page
 * Showcase real patient experiences and success stories
 */

import React, { useState } from "react";
import { Star, MessageCircle, ThumbsUp, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Testimonial {
  id: string;
  patientName: string;
  patientInitials: string;
  condition: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verified: boolean;
  helpful: number;
  specialist: string;
  strain: string;
  avatar: string;
  image?: string;
}

const mockTestimonials: Testimonial[] = [
  {
    id: "1",
    patientName: "Maria Silva",
    patientInitials: "MS",
    condition: "Ansiedade Crônica",
    rating: 5,
    title: "Mudou completamente minha vida!",
    content:
      "Sofria com ansiedade há 10 anos. Depois de consultar com a Dra. Ana, recebi a receita perfeita. Em 2 semanas já sentia a diferença. Agora durmo bem e consigo trabalhar sem pânico. Muito grato!",
    date: "2026-02-20",
    verified: true,
    helpful: 342,
    specialist: "Dra. Ana Costa",
    strain: "Charlotte's Web",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
  },
  {
    id: "2",
    patientName: "João Santos",
    patientInitials: "JS",
    condition: "Dor Crônica",
    rating: 5,
    title: "Finalmente consegui dormir sem dor",
    content:
      "Tenho artrite reumatoide e a dor era insuportável. O Dr. Carlos recomendou um óleo específico. Resultado? Reduzi 80% da medicação convencional e durmo a noite toda. Recomendo para todos!",
    date: "2026-02-18",
    verified: true,
    helpful: 287,
    specialist: "Dr. Carlos Mendes",
    strain: "Cannatonic",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joao",
  },
  {
    id: "3",
    patientName: "Ana Costa",
    patientInitials: "AC",
    condition: "Insônia",
    rating: 5,
    title: "Voltei a dormir como antes",
    content:
      "Insônia há 5 anos, testei tudo. A Dra. Fernanda foi incrível, explicou tudo sobre cannabis medicinal. Agora durmo 8 horas direto. Qualidade de vida voltou 100%!",
    date: "2026-02-15",
    verified: true,
    helpful: 425,
    specialist: "Dra. Fernanda Lima",
    strain: "Indica Blend",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
  },
  {
    id: "4",
    patientName: "Pedro Oliveira",
    patientInitials: "PO",
    condition: "Epilepsia",
    rating: 5,
    title: "Redução de 70% nas crises",
    content:
      "Meu filho tinha 15 crises por semana. Depois da consulta e prescrição, caiu para 4-5. Medicamento convencional não funcionava. Cannabis foi a solução!",
    date: "2026-02-12",
    verified: true,
    helpful: 512,
    specialist: "Dr. Roberto Alves",
    strain: "High-CBD",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro",
  },
  {
    id: "5",
    patientName: "Carla Mendes",
    patientInitials: "CM",
    condition: "Depressão",
    rating: 5,
    title: "Recuperei minha vontade de viver",
    content:
      "Depressão profunda, antidepressivos não funcionavam. A Dra. Mariana foi atenciosa e prescreveu a cepa certa. Voltei a sorrir, a sair de casa, a viver!",
    date: "2026-02-10",
    verified: true,
    helpful: 398,
    specialist: "Dra. Mariana Rocha",
    strain: "Sativa Blend",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carla",
  },
];

export default function PatientTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(mockTestimonials);
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    condition: "",
    rating: 5,
    title: "",
    content: "",
  });

  const conditions = [
    "Todos",
    "Ansiedade",
    "Dor Crônica",
    "Insônia",
    "Epilepsia",
    "Depressão",
    "Outro",
  ];

  const filteredTestimonials =
    filter === "all"
      ? testimonials
      : testimonials.filter((t) => t.condition.includes(filter));

  const handleSubmitTestimonial = (e: React.FormEvent) => {
    e.preventDefault();

    const newTestimonial: Testimonial = {
      id: String(testimonials.length + 1),
      patientName: formData.name,
      patientInitials: formData.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
      condition: formData.condition,
      rating: formData.rating,
      title: formData.title,
      content: formData.content,
      date: new Date().toISOString().split("T")[0],
      verified: false,
      helpful: 0,
      specialist: "Aguardando verificação",
      strain: "Não especificada",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
    };

    setTestimonials([newTestimonial, ...testimonials]);
    setFormData({ name: "", condition: "", rating: 5, title: "", content: "" });
    setShowForm(false);
  };

  const handleHelpful = (id: string) => {
    setTestimonials(
      testimonials.map((t) =>
        t.id === id ? { ...t, helpful: t.helpful + 1 } : t
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Depoimentos de Pacientes</h1>
          <p className="text-lg opacity-90">
            Histórias reais de transformação e esperança
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {testimonials.length}+
            </div>
            <p className="text-muted-foreground">Depoimentos Verificados</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">4.9★</div>
            <p className="text-muted-foreground">Avaliação Média</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">98%</div>
            <p className="text-muted-foreground">Recomendariam</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {testimonials.reduce((sum, t) => sum + t.helpful, 0)}+
            </div>
            <p className="text-muted-foreground">Pessoas Ajudadas</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {conditions.map((condition) => (
              <Button
                key={condition}
                variant={
                  (filter === "all" && condition === "Todos") ||
                  filter === condition
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  setFilter(condition === "Todos" ? "all" : condition)
                }
              >
                {condition}
              </Button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mb-12">
          <Button
            size="lg"
            onClick={() => setShowForm(!showForm)}
            className="w-full md:w-auto"
          >
            {showForm ? "Cancelar" : "Compartilhe seu Depoimento"}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">Seu Depoimento Importa</h2>
            <form onSubmit={handleSubmitTestimonial} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome</label>
                  <Input
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Condição de Saúde
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Ansiedade, Dor Crônica"
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Avaliação: {formData.rating} ★
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rating: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Título</label>
                <Input
                  type="text"
                  placeholder="Ex: Mudou minha vida"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Seu Depoimento
                </label>
                <Textarea
                  placeholder="Conte sua história de transformação..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={6}
                  required
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Publicar Depoimento
              </Button>
            </form>
          </Card>
        )}

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTestimonials.map((testimonial) => (
            <Card key={testimonial.id} className="p-6 hover:shadow-lg transition">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-bold text-primary">
                      {testimonial.patientInitials}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold">{testimonial.patientName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.condition}
                    </p>
                  </div>
                </div>
                {testimonial.verified && (
                  <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                    ✓ Verificado
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < testimonial.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }
                  />
                ))}
              </div>

              {/* Title and Content */}
              <h4 className="font-bold text-lg mb-2">{testimonial.title}</h4>
              <p className="text-muted-foreground mb-4 line-clamp-4">
                {testimonial.content}
              </p>

              {/* Specialist & Strain */}
              <div className="bg-muted/50 p-3 rounded mb-4 text-sm">
                <p>
                  <span className="font-semibold">Especialista:</span>{" "}
                  {testimonial.specialist}
                </p>
                <p>
                  <span className="font-semibold">Cepa:</span> {testimonial.strain}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{testimonial.date}</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleHelpful(testimonial.id)}
                    className="flex items-center gap-1 hover:text-primary transition"
                  >
                    <ThumbsUp size={16} />
                    {testimonial.helpful}
                  </button>
                  <button className="flex items-center gap-1 hover:text-primary transition">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Sua história pode inspirar outros
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Compartilhe sua experiência e ajude pacientes a encontrar esperança
          </p>
          <Button size="lg" onClick={() => setShowForm(true)}>
            Deixar Depoimento Agora
          </Button>
        </div>
      </div>
    </div>
  );
}
