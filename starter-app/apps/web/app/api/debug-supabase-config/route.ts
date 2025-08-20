import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase configuration',
        config: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 });
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Try to get auth configuration
    try {
      // Test if we can access auth admin functions
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });

      const configCheck = {
        supabaseUrl,
        hasServiceKey: true,
        canAccessAuthAdmin: !usersError,
        authAdminError: usersError?.message,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        nodeEnv: process.env.NODE_ENV,
        userCount: users?.users?.length || 0
      };

      return NextResponse.json({
        success: true,
        config: configCheck,
        recommendations: [
          'Check Supabase Dashboard → Authentication → Settings',
          'Verify "Enable email confirmations" is turned ON',
          'Check "Email Templates" are configured',
          'Verify SMTP settings if using custom email provider',
          'Check if emails are going to spam folder',
          'Try with a different email domain (Gmail, Yahoo, etc.)'
        ],
        nextSteps: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to Authentication → Settings',
          '3. Scroll to "Email Auth" section',
          '4. Ensure "Enable email confirmations" is enabled',
          '5. Check "Email Templates" tab for confirmation template',
          '6. If using custom SMTP, verify settings in "SMTP Settings"'
        ]
      });

    } catch (adminError: any) {
      return NextResponse.json({
        error: 'Cannot access Supabase auth admin',
        details: adminError.message,
        config: {
          supabaseUrl,
          hasServiceKey: true,
          canAccessAuthAdmin: false
        },
        possibleCauses: [
          'Service role key might be incorrect',
          'Service role key might not have auth.admin permissions',
          'Supabase project might be paused or deleted'
        ]
      });
    }

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Configuration check failed', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase configuration' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (action === 'test-email-template') {
      // Try to trigger a password reset email as a test
      const testEmail = 'test@example.com';
      
      const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
      });

      if (error) {
        return NextResponse.json({
          success: false,
          error: 'Email template test failed',
          details: error.message
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Password reset email triggered (this tests if email sending works)',
        note: 'If you receive a password reset email at test@example.com, email sending is working'
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
}
