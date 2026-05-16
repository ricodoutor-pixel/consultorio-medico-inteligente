import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_COUNT = 40247;

const SAMPLE_STUDIES = [
  {
    title: "Cannabidiol in patients with treatment-resistant epilepsy: an open-label interventional trial",
    journal: "The Lancet Neurology",
    pubmedId: "26724101",
  },
  {
    title: "Cannabinoids in the Treatment of Chronic Pain: A Systematic Review and Meta-analysis",
    journal: "JAMA",
    pubmedId: "26103030",
  },
  {
    title: "Effects of Cannabidiol on Behavioral Symptoms in Autism Spectrum Disorder",
    journal: "Frontiers in Pharmacology",
    pubmedId: "30971924",
  },
];

export const ScientificBadge = () => {
  const [count, setCount] = useState<number>(FALLBACK_COUNT);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { count: c } = await supabase
          .from("scientific_articles" as any)
          .select("*", { count: "exact", head: true });
        if (active && typeof c === "number" && c > 0) setCount(c);
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="section-padding bg-background border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-8 md:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <FlaskConical size={16} className="text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Evidência científica
            </span>
          </div>
          <h2 className="font-display font-black mb-3 text-foreground">
            Baseado em{" "}
            <span className="text-gradient-green">
              {count.toLocaleString("pt-BR")}
            </span>{" "}
            estudos científicos
          </h2>
          <p className="text-muted-foreground font-medium">
            Nossa biblioteca integra publicações revisadas por pares do PubMed,
            atualizadas continuamente para fundamentar cada orientação técnica.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {SAMPLE_STUDIES.map((s, i) => (
            <motion.a
              key={s.pubmedId}
              href={`https://pubmed.ncbi.nlm.nih.gov/${s.pubmedId}/`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-5 rounded-2xl bg-card/40 border border-border hover:border-primary/40 transition-all backdrop-blur-sm"
            >
              <BookOpen size={20} className="text-primary mb-3" />
              <p className="text-sm font-bold text-foreground leading-snug mb-2 line-clamp-3 group-hover:text-primary transition-colors">
                {s.title}
              </p>
              <p className="text-[11px] text-muted-foreground italic mb-3">
                {s.journal}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                Ver no PubMed <ExternalLink size={11} />
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScientificBadge;
