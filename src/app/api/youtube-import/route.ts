import { NextRequest, NextResponse } from "next/server";

interface VideoItem {
  title: string;
  url: string;
  position: number;
}

function extractPlaylistId(raw: string): string | null {
  try {
    const parsed = new URL(raw.trim());
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("list");
    }
  } catch {
    // fall through
  }
  return null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "YouTube API key is not configured on the server." },
      { status: 500 },
    );
  }

  let body: { playlistUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const playlistId = extractPlaylistId(body.playlistUrl ?? "");
  if (!playlistId) {
    return NextResponse.json(
      { error: "Invalid YouTube playlist URL. It must contain ?list=… (e.g. youtube.com/playlist?list=PLxxx)." },
      { status: 400 },
    );
  }

  const videos: VideoItem[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const params = new URLSearchParams({
        part: "snippet",
        playlistId,
        maxResults: "50",
        key: apiKey,
        ...(pageToken ? { pageToken } : {}),
      });

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${params}`,
        { next: { revalidate: 0 } },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message: string =
          err?.error?.errors?.[0]?.reason === "playlistNotFound"
            ? "Playlist not found. Check that the URL is correct and the playlist is public."
            : (err?.error?.message ?? `YouTube API error (${res.status}).`);
        return NextResponse.json({ error: message }, { status: 400 });
      }

      const data = await res.json();

      for (const item of data.items ?? []) {
        const snippet = item.snippet;
        const videoId: string | undefined = snippet?.resourceId?.videoId;
        if (!videoId) continue;
        if (snippet.title === "Deleted video" || snippet.title === "Private video") continue;
        videos.push({
          title: snippet.title as string,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          position: snippet.position as number,
        });
      }

      pageToken = data.nextPageToken as string | undefined;
    } while (pageToken);
  } catch (err) {
    console.error("[youtube-import] fetch error:", err);
    return NextResponse.json(
      { error: "Failed to reach YouTube. Please try again." },
      { status: 500 },
    );
  }

  if (videos.length === 0) {
    return NextResponse.json(
      { error: "No public videos found in this playlist." },
      { status: 400 },
    );
  }

  videos.sort((a, b) => a.position - b.position);

  return NextResponse.json({ videos });
}
