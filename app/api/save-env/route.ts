import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content } = body;

    // .env.local 파일 경로
    const envPath = path.join(process.cwd(), '.env.local');

    // 파일에 내용 쓰기
    fs.writeFileSync(envPath, content);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('환경 변수 저장 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: '환경 변수 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 