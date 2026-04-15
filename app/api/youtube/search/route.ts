import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const releaseId = searchParams.get("releaseId")
  const trackPosition = searchParams.get("trackPosition")

  if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 })

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 })

  const supabase = createAdminClient()

  try {
    if (releaseId && trackPosition) {
      const { data: release } = await supabase.from("releases").select("youtube_track_ids").eq("id", releaseId).single()
      const cached = release?.youtube_track_ids?.[trackPosition]
      if (cached) return NextResponse.json({ videoId: cached, cached: true })
    }

    const url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + encodeURIComponent(query) + "&type=video&maxResults=3&key=" + apiKey
    const res = await fetch(url)
    const data = await res.json()

    if (data.error) return NextResponse.json({ error: data.error.message, quotaExceeded: data.error.code === 403 }, { status: data.error.code })

    const videoId: string | null = data.items?.[0]?.id?.videoId ?? null

    if (videoId && releaseId && trackPosition) {
      const { data: release } = await supabase.from("releases").select("youtube_track_ids").eq("id", releaseId).single()
      const currentCache = (release?.youtube_track_ids as Record<string, string>) || {}
      await supabase.from("releases").update({ youtube_track_ids: { ...currentCache, [trackPosition]: videoId } }).eq("id", releaseId)
    }

    return NextResponse.json({ videoId, cached: false })
  } catch (error) {
    console.error("YouTube search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
