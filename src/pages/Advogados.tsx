import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LawyerDirectory } from "@/components/legal/LawyerDirectory";

export default function Advogados() {
  return <div className="min-h-dvh bg-background"><Helmet><title>Advogados — Habeas corpus medicinal | Planta y Raiz</title><meta name="description" content="Assessoria jurídica independente sobre habeas corpus e cultivo medicinal, com advogados inscritos na OAB e agenda própria." /></Helmet><Navbar /><section className="container mx-auto px-4 pt-[calc(var(--site-header-height,176px)+24px)] pb-16"><LawyerDirectory /></section><Footer /></div>;
}