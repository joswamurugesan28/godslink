import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '@/lib/s3';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    // 1. Authenticate user to ensure they are logged in
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the user's role to verify they are a developer
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'developer') {
      return NextResponse.json({ error: 'Forbidden: Only developers can upload games' }, { status: 403 });
    }

    // 3. Extract filename and contentType from the request body
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 });
    }

    // 4. Generate unique key based on user ID and a UUID to avoid conflicts
    const uniqueId = crypto.randomUUID();
    const key = `${user.id}/${uniqueId}/${filename}`;

    // 5. Generate presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour

    return NextResponse.json({ uploadUrl, key });
  } catch (err: any) {
    console.error('Error generating presigned URL:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
