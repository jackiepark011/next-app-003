import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    // 요청에서 JSON 데이터 가져오기
    const newData = await req.json();

    // 데이터 처리 로깅
    console.log('Received data:', JSON.stringify(newData, null, 2));

    // 데이터 유효성 검사 강화
    if (!Array.isArray(newData) || newData.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format or empty array' },
        { status: 400 }
      );
    }

    // sender_list.json 파일 경로 수정
    const filePath = path.join(process.cwd(), 'public', 'data', 'sender_list.json');

    // 디렉토리가 없으면 생성
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // 기존 파일 백업 (선택사항)
    if (fs.existsSync(filePath)) {
      const backupPath = filePath + '.backup';
      fs.copyFileSync(filePath, backupPath);
      console.log('Backup created at:', backupPath);
    }

    // JSON 데이터를 파일에 쓰기
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 4), 'utf8');
    console.log('Data successfully written to:', filePath);

    // 성공 응답
    return NextResponse.json({ 
      message: '데이터가 성공적으로 업데이트되었습니다.',
      timestamp: new Date().toISOString(),
      dataCount: newData.length
    });

  } catch (error) {
    console.error('데이터 업데이트 중 오류 발생:', error);
    return NextResponse.json(
      { 
        error: '데이터 업데이트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 