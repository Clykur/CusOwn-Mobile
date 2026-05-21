-- Add missing reservation columns to the slots table
-- These are required to implement the reservation lock so that two users cannot book the same slot simultaneously.

ALTER TABLE public.slots 
ADD COLUMN IF NOT EXISTS reserved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reserved_until timestamp with time zone;
