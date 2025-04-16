import axios from 'axios';

export interface SmsHistoryItem {
  mid: string;
  type: string;
  sender: string;
  msg: string;
  sms_count: number;
  reg_date: string;
  reserve_state: string;
  fail_count: number;
}

export interface SmsDetailItem {
  mdid: string;
  type: string;
  sender: string;
  receiver: string;
  sms_state: string;
  reg_date: string;
  send_date: string;
  reserve_date: string;
  msg?: string;
}

export interface CombinedSmsItem extends SmsHistoryItem {
  detail?: SmsDetailItem;
}

export interface SmsDetailResponse {
  result_code: number;
  message: string;
  list: SmsDetailItem[];
  next_yn: string;
}

export async function getSmsHistory(params: {
  page: string;
  page_size: string;
  start_date?: string;
  limit_day?: string;
}) {
  const response = await fetch('/api/sms/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('전송내역을 가져오는 중 오류가 발생했습니다.');
  }

  return response.json();
}

export async function getSmsDetail(mid: string): Promise<SmsDetailResponse> {
  const response = await fetch('/api/sms/detail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mid }),
  });

  if (!response.ok) {
    throw new Error('상세 정보를 가져오는 중 오류가 발생했습니다.');
  }

  return response.json();
}