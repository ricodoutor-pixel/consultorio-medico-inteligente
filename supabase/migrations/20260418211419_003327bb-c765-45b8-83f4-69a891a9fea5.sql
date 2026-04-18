-- Allow professionals to read their own NPS feedback analysis
CREATE POLICY "Professionals can view their own feedback analysis"
ON public.nps_feedback_analysis
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.nps_responses r
    WHERE r.id = nps_feedback_analysis.response_id
      AND r.professional_id = auth.uid()
  )
);