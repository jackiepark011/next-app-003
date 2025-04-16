import { NextResponse } from 'next/server';

const REMAIN_URL = 'https://apis.aligo.in/remain/';

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_ALIGO_API_KEY || !process.env.NEXT_PUBLIC_ALIGO_USER_ID) {
      return NextResponse.json(
        { 
          result_code: -1,
          message: 'API 키 또는 사용자 ID가 설정되지 않았습니다.' 
        },
        { status: 400 }
      );
    }

    const response = await fetch(REMAIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        key: process.env.NEXT_PUBLIC_ALIGO_API_KEY,
        userid: process.env.NEXT_PUBLIC_ALIGO_USER_ID,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('잔여 메시지 수량 조회 실패:', error);
    return NextResponse.json(
      { 
        result_code: -1,
        message: '잔여 메시지 수량 조회에 실패했습니다.' 
      },
      { status: 500 }
    );
  }
} 