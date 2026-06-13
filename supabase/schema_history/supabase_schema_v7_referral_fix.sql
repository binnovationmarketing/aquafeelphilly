-- Migration: Fix tasks_type_check to include 'REFERRAL'
-- Description: The RecommendationsPanel uses 'REFERRAL' as a task type, which was missing from the check constraint.

ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_type_check;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_type_check 
CHECK (type IN ('CALL', 'MESSAGE', 'EMAIL', 'VISIT', 'REFERRAL', 'FOLLOW_UP'));

-- Also ensured 'FOLLOW_UP' is included for future use in the proposal flow.
