export class AligoClient {
  private apiKey: string;
  private userId: string;
  private baseUrl = 'https://apis.aligo.in';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ALIGO_API_KEY || '';
    this.userId = process.env.NEXT_PUBLIC_ALIGO_USER_ID || '';

    if (!this.apiKey || !this.userId) {
      console.error('API 설정 오류: API 키 또는 사용자 ID가 설정되지 않았습니다.');
    }
  }

  private async handleResponse(response: Response) {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('서버에서 JSON 응답을 받지 못했습니다.');
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('JSON 파싱 오류:', text);
      throw new Error('서버 응답을 처리할 수 없습니다.');
    }
  }

  async sendSMS(params: {
    receiver: string;
    msg: string;
    msg_type?: 'SMS' | 'LMS';
    title?: string;
  }) {
    const body = new URLSearchParams({
      key: this.apiKey,
      user_id: this.userId,
      sender: process.env.NEXT_PUBLIC_ALIGO_SENDER || '',
      receiver: params.receiver,
      msg: params.msg,
      msg_type: params.msg_type || 'SMS',
      ...(params.title && { title: params.title }),
    } as Record<string, string>);

    console.log('SMS 발송 요청:', {
      receiver: params.receiver,
      msg_type: params.msg_type || 'SMS',
    });

    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      body,
    });

    const result = await this.handleResponse(response);
    console.log('SMS 발송 응답:', result);

    if (result.result_code !== '1') {
      throw new Error(result.message || 'SMS 발송에 실패했습니다.');
    }

    return result;
  }

  async sendMassSMS(params: {
    rec_1: string;
    msg_1: string;
    rec_2?: string;
    msg_2?: string;
    cnt: number;
    msg_type?: 'SMS' | 'LMS';
    title?: string;
    rdate?: string;
    rtime?: string;
  }) {
    const body = new URLSearchParams({
      key: this.apiKey,
      user_id: this.userId,
      sender: process.env.NEXT_PUBLIC_ALIGO_SENDER || '',
      rec_1: params.rec_1,
      msg_1: params.msg_1,
      cnt: params.cnt.toString(),
      msg_type: params.msg_type || 'SMS',
      ...(params.rec_2 && { rec_2: params.rec_2 }),
      ...(params.msg_2 && { msg_2: params.msg_2 }),
      ...(params.title && { title: params.title }),
      ...(params.rdate && { rdate: params.rdate }),
      ...(params.rtime && { rtime: params.rtime }),
    } as Record<string, string>);

    console.log('단체 SMS 발송 요청:', {
      rec_1: params.rec_1,
      cnt: params.cnt,
      msg_type: params.msg_type || 'SMS',
    });

    const response = await fetch('https://apis.aligo.in/send_mass/', {
      method: 'POST',
      body,
    });

    const result = await this.handleResponse(response);
    console.log('단체 SMS 발송 응답:', result);

    if (result.result_code !== '1') {
      throw new Error(result.message || '단체 SMS 발송에 실패했습니다.');
    }

    return result;
  }

  async sendBulkSMS(params: {
    contacts: Array<{ phone: string; message: string }>;
    msg_type?: 'SMS' | 'LMS';
    title?: string;
    rdate?: string;
    rtime?: string;
  }) {
    if (params.contacts.length < 2) {
      throw new Error('대량 전송은 2명 이상부터 가능합니다.');
    }

    if (params.contacts.length > 500) {
      throw new Error('대량 전송은 최대 500명까지만 가능합니다.');
    }

    const body = new URLSearchParams({
      key: this.apiKey,
      user_id: this.userId,
      sender: process.env.NEXT_PUBLIC_ALIGO_SENDER || '',
      cnt: params.contacts.length.toString(),
      msg_type: params.msg_type || 'SMS',
      ...(params.title && { title: params.title }),
      ...(params.rdate && { rdate: params.rdate }),
      ...(params.rtime && { rtime: params.rtime }),
    } as Record<string, string>);

    // 각 연락처의 정보를 파라미터에 추가
    params.contacts.forEach((contact, index) => {
      const contactIndex = index + 1;
      body.append(`rec_${contactIndex}`, contact.phone);
      body.append(`msg_${contactIndex}`, contact.message);
    });

    console.log('대량 SMS 발송 요청:', {
      cnt: params.contacts.length,
      msg_type: params.msg_type || 'SMS',
      rdate: params.rdate,
      rtime: params.rtime,
    });

    const response = await fetch('https://apis.aligo.in/send_mass/', {
      method: 'POST',
      body,
    });

    const result = await this.handleResponse(response);
    console.log('대량 SMS 발송 응답:', result);

    if (result.result_code !== '1') {
      throw new Error(result.message || '대량 SMS 발송에 실패했습니다.');
    }

    return result;
  }

  async getRemainingCount() {
    const body = new URLSearchParams({
      key: this.apiKey,
      user_id: this.userId,
    } as Record<string, string>);

    console.log('잔여 건수 조회 요청');

    const response = await fetch('https://apis.aligo.in/remain/', {
      method: 'POST',
      body,
    });

    const result = await this.handleResponse(response);
    console.log('잔여 건수 조회 응답:', result);

    if (result.result_code !== '1') {
      throw new Error(result.message || '잔여 건수 조회에 실패했습니다.');
    }

    return {
      SMS_CNT: parseInt(result.SMS_CNT),
      LMS_CNT: parseInt(result.LMS_CNT),
      MMS_CNT: parseInt(result.MMS_CNT),
    };
  }

  async getSmsList(params: {
    page: string;
    page_size: string;
    start_date?: string;
    end_date?: string;
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/sms_list/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          key: this.apiKey,
          userid: this.userId,
          page: params.page,
          page_size: params.page_size,
          ...(params.start_date && { start_date: params.start_date }),
          ...(params.end_date && { end_date: params.end_date })
        })
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.result_code <= 0) {
        throw new Error(result.message || 'API 요청이 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('전송내역 조회 실패:', error);
      throw error;
    }
  }

  async getMessageDetail(mid: string) {
    try {
      console.log('상세 조회 요청:', {
        url: `${this.baseUrl}/detail/`,
        mid,
        apiKey: this.apiKey,
        userId: this.userId
      });

      const response = await fetch(`${this.baseUrl}/detail/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          key: this.apiKey,
          user_id: this.userId,
          mid: mid
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 요청 실패:', {
          status: response.status,
          statusText: response.statusText,
          response: errorText
        });
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('상세 조회 응답:', result);
      
      if (result.result_code <= 0) {
        throw new Error(result.message || 'API 요청이 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('메시지 상세 조회 실패:', error);
      throw error;
    }
  }
}