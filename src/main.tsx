import { createRoot } from "react-dom/client";
import { initAntiClone } from "./lib/anti-clone";
import App from "./App.tsx";
import { CustomLoader } from "./components/CustomLoader";
import "./index.css";

// Inicializa proteções anti-clonagem ANTES do React
initAntiClone();

createRoot(document.getElementById("root")!).render(
  <>
    <CustomLoader />
    <App />
  </>
);
