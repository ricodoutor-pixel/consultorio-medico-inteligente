import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isPaymentConfirmed } from "@/lib/payment-confirmation";
import { setVisibleInterval } from "@/lib/visible-interval";

export function usePaymentConfirmation(reference: string, paymentId = "") {
  const [status, setStatus] = useState<"checking" | "approved" | "pending" | "error">("pending");
  const [method, setMethod] = useState<"pix" | "other">("other");
  const [confirmedReference, setConfirmedReference] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    let busy = false;
    let finished = false;
    setConfirmedReference("");
    setMethod("other");
    if (!reference && !paymentId) { setStatus("pending"); return; }
    setStatus("checking");
    const check = async () => {
      if (busy || finished) return;
      busy = true;
      try {
        const { data, error } = await supabase.functions.invoke("payment-confirmation", {
          body: { external_reference: reference || undefined, payment_id: paymentId || undefined },
        });
        if (!alive) return;
        if (error || data?.error) { setStatus("error"); return; }
        if (isPaymentConfirmed(data?.status)) {
          finished = true;
          setStatus("approved");
          setMethod(data.payment_method === "pix" ? "pix" : "other");
          setConfirmedReference(typeof data.external_reference === "string" ? data.external_reference : "");
        } else setStatus("pending");
      } catch { if (alive) setStatus("error"); }
      finally { busy = false; }
    };
    void check();
    const stop = setVisibleInterval(() => void check(), 5000);
    return () => { alive = false; stop(); };
  }, [reference, paymentId, retry]);
  const recheck = useCallback(() => setRetry(value => value + 1), []);
  return { status, method, confirmedReference, recheck };
}