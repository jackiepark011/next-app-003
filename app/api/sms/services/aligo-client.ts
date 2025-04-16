import axios from 'axios';

export class AligoClient {
  private apiKey: string;
  private userId: string;
  private sender: string;

  constructor(apiKey: string, userId: string, sender: string) {
    this.apiKey = apiKey;
    this.userId = userId;
    this.sender = sender;
  }

  async sendMassSMS(params: {
    msg: string;
    receiver: string;
    sender?: string;
    testmode_yn?: string;
  }) {
    const response = await axios.post(
      'https://apis.aligo.in/send/',
      {
        key: this.apiKey,
        userid: this.userId,
        sender: params.sender || this.sender,
        msg: params.msg,
        receiver: params.receiver,
        testmode_yn: params.testmode_yn || 'N',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.data || response.data.result_code <= 0) {
      throw new Error(response.data?.message || '메시지 전송 중 오류가 발생했습니다.');
    }

    return response.data;
  }

  async getHistory(params: {
    page: string;
    page_size: string;
    start_date?: string;
    limit_day?: string;
  }) {
    const response = await axios.post(
      'https://apis.aligo.in/list/',
      {
        key: this.apiKey,
        userid: this.userId,
        ...params,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.data || response.data.result_code <= 0) {
      throw new Error(response.data?.message || '전송내역을 가져오는 중 오류가 발생했습니다.');
    }

    return response.data;
  }

  async getMessageDetail(mid: string) {
    const response = await axios.post(
      'https://apis.aligo.in/detail/',
      {
        key: this.apiKey,
        userid: this.userId,
        mid,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.data || response.data.result_code <= 0) {
      throw new Error(response.data?.message || '상세 정보를 가져오는 중 오류가 발생했습니다.');
    }

    return response.data;
  }
} 