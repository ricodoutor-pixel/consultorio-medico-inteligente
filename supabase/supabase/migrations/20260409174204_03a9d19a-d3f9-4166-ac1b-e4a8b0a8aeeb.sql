
DROP POLICY "System can insert transactions" ON public.vendor_transactions;
CREATE POLICY "Authenticated users can create transactions" ON public.vendor_transactions FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
