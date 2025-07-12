import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';

let client: MongoClient;
let isConnected = false;

async function connectToDatabase() {
  try {
    if (!isConnected) {
      client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      isConnected = true;
    }
    return client.db('travel-connect');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  let body: any = null;
  
  try {
    body = await request.json();
    console.log('Upload request body:', { ...body, file: body.file ? '[FILE_DATA]' : 'NO_FILE' });
    
    const { file, folder, userId, filename, mimeType } = body;

    if (!file || !folder || !userId || !filename) {
      console.error('Missing required fields:', { file: !!file, folder, userId, filename });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Connecting to database...');
    const db = await connectToDatabase();
    const bucket = new GridFSBucket(db, { bucketName: 'photos' });

    // Convert base64 to buffer
    console.log('Converting base64 to buffer...');
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    console.log('Buffer size:', buffer.length);

    // Create metadata
    const metadata = {
      folder,
      userId,
      originalName: filename,
      mimeType,
      uploadDate: new Date()
    };

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = filename.split('.').pop();
    const uniqueFilename = `${timestamp}_${randomString}.${extension}`;

    console.log('Starting GridFS upload...', { uniqueFilename, metadata });

    // Upload to GridFS
    const uploadStream = bucket.openUploadStream(uniqueFilename, {
      metadata
    });

    return new Promise((resolve, reject) => {
      uploadStream.on('finish', () => {
        console.log('Upload completed successfully:', uploadStream.id);
        resolve(NextResponse.json({
          fileId: uploadStream.id.toString(),
          url: `/api/files/${uploadStream.id}`,
          filename: uniqueFilename
        }));
      });

      uploadStream.on('error', (error) => {
        console.error('GridFS upload error:', error);
        reject(NextResponse.json(
          { error: `Upload failed: ${error.message}` },
          { status: 500 }
        ));
      });

      uploadStream.end(buffer);
    });

  } catch (error) {
    console.error('Upload API error:', error);
    console.error('Request body:', body);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const fileId = url.pathname.split('/').pop();

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const bucket = new GridFSBucket(db, { bucketName: 'photos' });

    await bucket.delete(new ObjectId(fileId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}