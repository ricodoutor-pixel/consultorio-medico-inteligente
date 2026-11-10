import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LawyerDirectory } from "@/components/legal/LawyerDirectory";

export default function Advogados() {
  return <div className="min-h-dvh bg-background"><Helmet><title>Dr. Advogado — Assistência jurídica para habeas corpus | Planta y Raiz</title><meta name="description" content="Assistência jurídica independente para obtenção de habeas corpus para cultivo medicinal de uso próprio, com honorários definidos por cada advogado." /></Helmet><Navbar /><section className="container mx-auto px-4 pt-[calc(var(--site-header-height,176px)+24px)] pb-16"><LawyerDirectory /></section><Footer /></div>;
}