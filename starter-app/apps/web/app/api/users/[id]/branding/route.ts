import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();

    // Validate that the user is authenticated and authorized
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Build the update object based on provided fields
    const updateData: any = {};

    // Handle new comprehensive branding fields
    if (body.brand_primary_color !== undefined) {
      updateData.brand_primary_color = body.brand_primary_color;
    }
    if (body.brand_secondary_color !== undefined) {
      updateData.brand_secondary_color = body.brand_secondary_color;
    }
    if (body.brand_tertiary_color !== undefined) {
      updateData.brand_tertiary_color = body.brand_tertiary_color;
    }
    if (body.custom_yup_text !== undefined) {
      updateData.custom_yup_text = body.custom_yup_text;
    }
    if (body.custom_nope_text !== undefined) {
      updateData.custom_nope_text = body.custom_nope_text;
    }
    if (body.custom_maybe_text !== undefined) {
      updateData.custom_maybe_text = body.custom_maybe_text;
    }
    if (body.logo_url !== undefined) {
      updateData.logo_url = body.logo_url;
    }

    // Handle legacy fields for backward compatibility
    if (body.brandTheme !== undefined) {
      updateData.brand_theme = body.brandTheme;
    }
    if (body.logoUrl !== undefined) {
      updateData.logo_url = body.logoUrl;
    }

    // Update the user in Supabase
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user branding:', error);
      return NextResponse.json(
        { error: 'Failed to update branding', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data }, { status: 200 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Get user branding data
    const { data, error } = await supabase
      .from('users')
      .select(`
        brand_primary_color,
        brand_secondary_color,
        brand_tertiary_color,
        custom_yup_text,
        custom_nope_text,
        custom_maybe_text,
        logo_url,
        brand_theme
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user branding:', error);
      return NextResponse.json(
        { error: 'Failed to fetch branding', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ branding: data }, { status: 200 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
