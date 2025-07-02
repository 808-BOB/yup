import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase-server";
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