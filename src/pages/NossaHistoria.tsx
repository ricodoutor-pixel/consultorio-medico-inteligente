import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Youtube, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/** Vídeo com poster (thumb do YouTube em alta) — evita a "janela preta" antes do play */
function VideoWithPoster({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const poster = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const fallback = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-[#22C55E]/20 shadow-[0_0_40px_rgba(34,197,94,0.12)] bg-black"
      style={{ paddingBottom: "56.25%" }}
    >
      {playing ? (
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="absolute inset-0 w-full h-full group"
          aria-label={`Reproduzir vídeo: ${title}`}
        >
          <img
            src={poster}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallback; }}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <span className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#22C55E] shadow-[0_0_40px_rgba(34,197,94,0.6)] group-hover:scale-110 transition-transform">
            <Play className="w-9 h-9 text-black fill-black ml-1" />
          </span>
        </button>
      )}
    </div>
  );
}


const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 1, transition: { duration: 0.6 } },
};
const stagger = {
  visible: { transition: { staggerChildren: 1.5 } },
};

export default function NossaHistoria() {
  return (
    <div className="min-h-dvh bg-[#04080F] text-foreground">
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-20">
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl"
        >
          {/* Título */}
          <motion.h1
            variants={fadeUp}
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-center mb-3 text-white tracking-tight"
          >
            Nossa História e <span className="text-[#22C55E]">DNA</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-center text-muted-foreground mb-12 text-sm sm:text-base"
          >
            Quem somos: Nossa História e DNA — Planta y Raiz Ltda.
          </motion.p>

          {/* Texto */}
          <motion.article
            variants={stagger}
            className="space-y-6 text-justify leading-[1.6] text-sm sm:text-base text-gray-200/90 mb-14"
          >
            <motion.p variants={fadeUp}>
              Olá, somos a <strong className="text-white">Planta y Raiz Ltda.</strong>, a plataforma de
              telemedicina canabinoide mais completa do mundo. Criada durante o auge da pandemia de
              COVID-19, a Planta y Raiz nasceu de uma grande tragédia: a morte prematura de três
              jovens médicos que, na linha de frente do combate ao vírus, perderam suas vidas após
              15 dias de luta, deixando famílias, amigos e pacientes em profundo pesar.
            </motion.p>

            <motion.p variants={fadeUp}>
              Impactado por esta perda irreparável de colegas queridos, o{" "}
              <strong className="text-white">Dra. Suelen Naves Rodrigues (CRM 49354/PR)</strong>, nossa atual Supervisora
              Técnica, concebeu uma ideia visionária para resolver, de uma vez por todas, o desafio
              da medicina à distância. Se aplicada com excelência no início da pandemia, esta
              tecnologia teria evitado a morte de milhares de profissionais e pacientes em todo o
              mundo, ao permitir o isolamento seguro de infectados e a triagem remota, reservando o
              atendimento presencial apenas para casos graves.
            </motion.p>

            <motion.p variants={fadeUp}>
              Unindo o esforço, o conhecimento e o empenho de um grupo multidisciplinar de
              profissionais de saúde, e utilizando o que há de melhor em tecnologia de ponta,
              somado às novas e assertivas resoluções do <strong className="text-white">CFM</strong>{" "}
              e da <strong className="text-white">Anvisa</strong>, surgiu a Mega Plataforma{" "}
              <strong className="text-white">Planta y Raiz Ltda.</strong>
            </motion.p>

            <motion.p variants={fadeUp}>
              Já nascemos com a personalidade e o DNA de levar telemedicina de qualidade a todos os
              seres humanos, disponibilizando acesso a uma plataforma moderna, integrada às melhores
              automações de segurança, auditoria e gestão administrativa. Com uma proposta ambiciosa
              de um sistema <strong className="text-white">100% autônomo</strong>, criado,
              administrado, auditado e autocorrigível, a Planta y Raiz conta com uma equipe
              especializada, garantindo aos nossos clientes agilidade, segurança e eficiência em todos
              os atendimentos realizados ao redor do mundo. <strong className="text-white">"Nós Realmente entendemos o valor da vida, porque sabemos a dor e o preço da ausência."</strong>
            </motion.p>
          </motion.article>

          {/* Vídeo YouTube — capa (poster) até o clique para evitar tela preta */}
          <motion.div variants={fadeUp} className="mb-14">
            <VideoWithPoster videoId="pgGSJnoO4nE" title="Nossa História — Planta y Raiz" />
          </motion.div>



          {/* CTA YouTube */}
          <motion.div variants={fadeUp} className="mt-14 flex justify-center">
            <a
              href="https://www.youtube.com/@PlantayRaizMegaClinica"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button className="bg-[#22C55E] hover:bg-[#16a34a] text-white px-8 py-6 rounded-xl font-bold text-base shadow-lg shadow-[#22C55E]/25 transition-all hover:scale-105 active:scale-95">
                <Youtube className="w-5 h-5 mr-2" />
                Siga-nos no YouTube
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </motion.div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}
