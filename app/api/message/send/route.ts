import { NextResponse } from 'next/server';
import { AligoClient } from '@/lib/api/aligo-client';

export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_ALIGO_API_KEY || !process.env.NEXT_PUBLIC_ALIGO_USER_ID || !process.env.NEXT_PUBLIC_ALIGO_SENDER) {
      return NextResponse.json(
        { 
          result_code: -1,
          message: 'API 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.' 
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const apiClient = new AligoClient();
    const result = await apiClient.sendMassSMS({
      ...body,
      sender: process.env.NEXT_PUBLIC_ALIGO_SENDER
    });

    if (result.result_code > 0) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { 
          result_code: -1,
          message: result.message || '메시지 전송에 실패했습니다.' 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('메시지 전송 실패:', error);
    return NextResponse.json(
      { 
        result_code: -1,
        message: error instanceof Error ? error.message : '메시지 전송에 실패했습니다.' 
      },
      { status: 500 }
    );
  }
} 