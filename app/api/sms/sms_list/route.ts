import { NextResponse } from 'next/server';
import { AligoClient } from '@/lib/api/aligo-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('page_size') || '10';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    const aligoClient = new AligoClient();
    const result = await aligoClient.getSmsList({
      page,
      page_size: pageSize,
      start_date: startDate,
      end_date: endDate
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('전송내역 조회 실패:', error);
    return NextResponse.json(
      { 
        result_code: -1,
        message: error instanceof Error ? error.message : '전송내역을 가져오는 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
} 