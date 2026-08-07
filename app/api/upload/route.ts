import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderRaw = (formData.get('folder') as string) || 'vehicles'

    // Whitelist allowed folders to avoid arbitrary paths
    const allowedFolders = ['vehicles', 'jobs']
    const folder = allowedFolders.includes(folderRaw) ? folderRaw : 'vehicles'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB). Clients should compress large phone photos first.
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

    const blob = await put(filename, file, {
      access: 'private',
    })

    // Return the pathname for private blobs (not the URL, which requires auth)
    return NextResponse.json({ url: blob.url, pathname: blob.pathname })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
