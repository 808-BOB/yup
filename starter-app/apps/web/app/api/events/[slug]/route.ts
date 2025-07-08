import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase-server";
import { supabase } from "@/lib/supabase";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("events")
    .select("*, responses(count:yupCount)")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    console.log('PATCH /api/events/[slug] - Event slug/id:', slug);
    
    const body = await req.json();
    console.log('PATCH request body:', body);

    // Validate that we have a slug/id
    if (!slug) {
      console.error('No event slug/id provided');
      return NextResponse.json({ error: "Event slug/id is required" }, { status: 400 });
    }

    // For now, we'll only allow updating the image_url field for security
    const { image_url } = body;
    
    if (!image_url) {
      return NextResponse.json({ error: "image_url is required" }, { status: 400 });
    }

    // Update the event in the database (support both slug and ID lookup)
    const { data, error } = await supabase
      .from("events")
      .update({ image_url })
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      console.error('No event found with slug/id:', slug);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    console.log('Event updated successfully:', data);
    return NextResponse.json({ success: true, event: data });
  } catch (error: any) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 