import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Solucao = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate("/como-funciona", { replace: true }); }, [navigate]);
  return null;
};

export default Solucao;
