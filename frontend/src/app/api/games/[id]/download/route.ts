import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '@/lib/s3';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Authenticate user to ensure they are logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // Redirect to login if user tries to download anonymously
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. Fetch the game details from the database
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('file_url')
      .eq('id', id)
      .single();

    if (gameError || !game || !game.file_url) {
      return NextResponse.json({ error: 'Game not found or has no download link' }, { status: 404 });
    }

    const key = game.file_url;

    // 3. Generate presigned GET URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // URL expires in 15 minutes (900 seconds)
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    // 4. Redirect to the presigned URL
    return NextResponse.redirect(downloadUrl);
  } catch (err: any) {
    console.error('Error generating download URL:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
