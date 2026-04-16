// lib/youtube/search.ts
// Búsqueda de videos en YouTube usando API oficial

interface YouTubeSearchResult {
  videoId: string
  title: string
  channelTitle: string
  thumbnail: string
}

export async function searchYouTubeVideo(
  query: string
): Promise<YouTubeSearchResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    console.error('YOUTUBE_API_KEY not configured')
    return null
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', query)
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', '10')
  url.searchParams.set('key', apiKey)

  try {
    const res = await fetch(url.toString())

    if (!res.ok) {
      console.error(`YouTube API error: ${res.status}`)
      return null
    }

    const data = await res.json()

    if (!data.items || data.items.length === 0) {
      return null
    }

    const items = data.items as Array<{
      id: { videoId: string }
      snippet: {
        title: string
        channelTitle: string
        thumbnails: { default: { url: string } }
      }
    }>

    // Priorizar videos oficiales
    for (const item of items) {
      const title = item.snippet.title.toLowerCase()
      const channel = item.snippet.channelTitle.toLowerCase()

      if (
        title.includes('official') ||
        title.includes('audio') ||
        title.includes('lyric') ||
        title.includes('music video') ||
        channel.includes('vevo') ||
        channel.includes('official') ||
        channel.includes('music')
      ) {
        return {
          videoId: item.id.videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.default.url,
        }
      }
    }

    // Si no hay oficial, devolver el primero
    const first = items[0]
    return {
      videoId: first.id.videoId,
      title: first.snippet.title,
      channelTitle: first.snippet.channelTitle,
      thumbnail: first.snippet.thumbnails.default.url,
    }
  } catch (err) {
    console.error('YouTube search error:', err)
    return null
  }
}

export async function findYouTubeForRelease(
  artist: string,
  title: string
): Promise<string | null> {
  const queries = [
    `${artist} ${title} official audio`,
    `${artist} ${title} audio`,
    `${artist} ${title}`,
    `${title} ${artist}`,
    title,
  ]

  for (const query of queries) {
    const result = await searchYouTubeVideo(query)
    if (result) {
      console.log(`Found: ${result.videoId} for query: "${query}"`)
      return result.videoId
    }
  }

  return null
}
