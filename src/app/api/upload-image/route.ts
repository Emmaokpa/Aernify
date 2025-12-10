
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import ImageKit from 'imagekit';

// Instantiate ImageKit
// The SDK automatically reads the credentials from process.env
const imageKit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  try {
    // 1. Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Upload buffer to ImageKit
    const response = await imageKit.upload({
      file: buffer,
      fileName: file.name,
      // You can add more options here, like tags, folders, etc.
      // e.g., folder: "/games"
    });

    // 3. Return the URL from the service
    return NextResponse.json({ imageUrl: response.url });

  } catch (error) {
    console.error('Error uploading image to ImageKit:', error);
    return NextResponse.json({ error: 'Something went wrong during the upload.' }, { status: 500 });
  }
}
