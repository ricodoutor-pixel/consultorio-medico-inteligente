import { Navigate, useLocation, useParams } from "react-router-dom";
import { resolvePaymentLink } from "@/lib/payment-links";

export default function PagarRedirect() {
  const { produto } = useParams<{ produto: string }>();
  const { search } = useLocation();
  return <Navigate to={resolvePaymentLink(produto, search)} replace />;
}
