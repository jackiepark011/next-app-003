import { NextResponse } from 'next/server';
import axios from 'axios';

const ALIGO_API_KEY = '8h5jv7208a1ndri54r3b1sxf6s2nv1wa';
const ALIGO_USER_ID = 'gluck';

export async function POST(request: Request) {
  try {
    if (!ALIGO_API_KEY || !ALIGO_USER_ID) {
      return NextResponse.json(
        { 
          result_code: -1,
          message: 'API 키 또는 사용자 ID가 설정되지 않았습니다. 관리자에게 문의해주세요.' 
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // 알리고 API 요청 파라미터
    const apiParams = {
      key: ALIGO_API_KEY,
      userid: ALIGO_USER_ID,
      page: body.page || '1',
      page_size: body.page_size || '30',
      start_date: body.start_date || '',
      limit_day: body.limit_day || ''
    };

    console.log('API Request Params:', apiParams);

    const response = await axios.post('https://apis.aligo.in/list/', apiParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('API Response:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('SMS API Error:', error);
    
    if (error.response?.data?.message) {
      return NextResponse.json(
        { 
          result_code: -1,
          message: `API 오류: ${error.response.data.message}` 
        },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { 
        result_code: -1,
        message: '발송결과를 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
      },
      { status: 500 }
    );
  }
}