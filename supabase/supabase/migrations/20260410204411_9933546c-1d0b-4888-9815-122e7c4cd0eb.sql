-- Fix 1: Remove overly permissive SELECT policy on gamification_achievements
-- Keep only the professional's own view and admin access
DROP POLICY IF EXISTS "Authenticated can view all achievements" ON public.gamification_achievements;
