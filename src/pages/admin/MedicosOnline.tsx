import { Navbar } from "@/components/Navbar";
import { DoctorsStatusBoard } from "@/components/doctors/DoctorsStatusBoard";
import { Activity } from "lucide-react";

const MedicosOnline = () => {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black">Médicos Online</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Status ao vivo de todos os médicos cadastrados (atualiza em tempo real).
            </p>
          </div>
        </div>

        <DoctorsStatusBoard variant="admin" title="Plantão em tempo real" />
      </div>
    </div>
  );
};

export default MedicosOnline;
