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

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    const { searchParams } = new URL(request.url);
    const thumbnail = searchParams.get('thumbnail');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const bucket = new GridFSBucket(db, { bucketName: 'photos' });

    // Get file info
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const file = files[0];
    
    // Create download stream
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        
        // Set appropriate headers
        const headers = new Headers();
        headers.set('Content-Type', file.metadata?.mimeType || 'image/jpeg');
        headers.set('Content-Length', buffer.length.toString());
        headers.set('Cache-Control', 'public, max-age=31536000');
        
        resolve(new NextResponse(buffer, { headers }));
      });

      downloadStream.on('error', (error) => {
        console.error('GridFS download error:', error);
        reject(NextResponse.json(
          { error: 'Failed to download file' },
          { status: 500 }
        ));
      });
    });

  } catch (error) {
    console.error('File API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

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
    console.error('Delete file API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}