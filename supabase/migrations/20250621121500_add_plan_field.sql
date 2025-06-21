/*
  # Add plan field to projects table
  
  Add a plan field to store the PagePlan JSON data needed for edits
*/

ALTER TABLE projects 
ADD COLUMN plan jsonb DEFAULT NULL;

-- Add index for better performance when querying plans
CREATE INDEX IF NOT EXISTS projects_plan_idx ON projects USING gin(plan);