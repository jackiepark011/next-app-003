import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 알리고 API 요청 파라미터
    const apiParams = {
      key: process.env.NEXT_PUBLIC_ALIGO_API_KEY,
      userid: process.env.NEXT_PUBLIC_ALIGO_USER_ID,
      mid: body.mid
    };

    const response = await axios.post('https://apis.aligo.in/sms_list/', apiParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('SMS Detail API Error:', error);
    
    return NextResponse.json(
      { 
        result_code: -1,
        message: '메시지 상세 정보를 가져오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 