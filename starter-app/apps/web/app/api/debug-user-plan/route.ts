import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get user from server-side session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    // Get user's complete data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      return NextResponse.json({ 
        error: 'User not found in database',
        details: userError,
        authUser: {
          id: session.user.id,
          email: session.user.email,
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        display_name: userData.display_name,
        is_premium: userData.is_premium,
        is_pro: userData.is_pro,
        stripe_customer_id: userData.stripe_customer_id,
        stripe_subscription_id: userData.stripe_subscription_id,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      },
      currentPlan: userData.is_premium ? 'Premium' : userData.is_pro ? 'Pro' : 'Free',
      hasActiveSubscription: !!(userData.stripe_subscription_id),
    });

  } catch (error: any) {
    console.error('Error checking user plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check user plan' },
      { status: 500 }
    );
  }
}
