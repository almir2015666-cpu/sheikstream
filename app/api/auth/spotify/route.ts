import { NextRequest, NextResponse } from 'next/server'

const REDIRECT_URI = 'https://sheikstream.com.br/api/auth/spotify/callback'

export async function GET(req: NextRequest) {
  const popup = req.nextUrl.searchParams.get('popup')
  const params = new URLSearchParams({
    client_id:     process.env.SPOTIFY_CLIENT_ID!,
    redirect_uri:  REDIRECT_URI,
    response_type: 'code',
    scope:         'user-read-currently-playing user-read-playback-state user-read-email user-modify-playback-state',
    state:         popup ? 'popup' : 'normal',
    show_dialog:   'true',
  })
  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`)
}
