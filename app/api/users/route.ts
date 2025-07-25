import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Verify the current user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get users from profiles table with Google profile data
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name, full_name, avatar_url')
      .limit(50);

    if (profilesError) {
      console.error('Error loading users from profiles:', profilesError);
      return NextResponse.json(
        { error: 'Could not load users' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ users: profilesData || [] });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 