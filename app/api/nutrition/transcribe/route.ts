import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file') as Blob | null
    if (!file) return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })

    // Forward the multipart form to OpenAI Whisper endpoint
    const forwardForm = new FormData()
    forwardForm.append('file', file as any, 'recording.webm')
    forwardForm.append('model', 'gpt-4o-transcribe')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: forwardForm as any
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Transcription failed', details: text }, { status: res.status })
    }

    const data = await res.json()
    // OpenAI returns a `text` field with transcription
    return NextResponse.json({ text: data.text })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown' }, { status: 500 })
  }
}
