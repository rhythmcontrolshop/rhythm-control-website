// lib/spotify/client.ts
// Cliente para obtener previews de 30 segundos de Spotify.

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1'

interface SpotifyToken {
  access_token: string
  token_type: string
  expires_in: number
}

interface SpotifyTrack {
  id: string
  name: string
  preview_url: string | null
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
}

let cachedToken: SpotifyToken | null = null
let tokenExpiry = 0

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken.access_token
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET son requeridos')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    throw new Error(`Error obteniendo token de Spotify: ${res.status}`)
  }

  cachedToken = await res.json() as SpotifyToken
  tokenExpiry = Date.now() + (cachedToken.expires_in - 60) * 1000

  return cachedToken.access_token
}

export async function getTrackPreview(spotifyId: string): Promise<SpotifyTrack | null> {
  try {
    const token = await getAccessToken()

    const res = await fetch(`${SPOTIFY_API_URL}/tracks/${spotifyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      console.error(`Error obteniendo track ${spotifyId}: ${res.status}`)
      return null
    }

    return await res.json() as SpotifyTrack
  } catch (error) {
    console.error('Error en getTrackPreview:', error)
    return null
  }
}
