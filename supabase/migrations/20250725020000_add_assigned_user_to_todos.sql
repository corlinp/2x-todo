-- Add assigned_user_id column to todos table
ALTER TABLE todos ADD COLUMN assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance on assigned user queries
CREATE INDEX idx_todos_assigned_user_id ON todos(assigned_user_id);

-- Update RLS policies to allow users to see todos assigned to them
CREATE POLICY "Users can see todos assigned to them" ON todos
  FOR SELECT USING (auth.uid() = assigned_user_id);

-- Allow users to update todos assigned to them
CREATE POLICY "Users can update todos assigned to them" ON todos
  FOR UPDATE USING (auth.uid() = assigned_user_id)
  WITH CHECK (auth.uid() = assigned_user_id); 