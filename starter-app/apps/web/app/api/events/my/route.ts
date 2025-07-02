import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase-server";

export async function GET() {
  // Create client tied to user cookies so RLS applies
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  const { data, error } = await supabase
    .from("events")
    .select("id,title,slug,date,location")
    .eq("host_id", user.id)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
} 