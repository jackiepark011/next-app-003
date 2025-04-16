import axios from 'axios';

// 전송내역 조회 인터페이스
export interface SmsHistoryItem {
  mid: string;           // 메시지 고유ID
  type: string;          // 문자구분
  sender: string;        // 발신번호
  sms_count: string;     // 전송요청수
  reserve_state: string; // 예약상태
  msg: string;          // 메시지 내용
  fail_count: string;   // 처리실패건수
  reg_date: string;     // 등록일
  reserve: string;      // 예약일자
}

// 상세 조회 인터페이스
export interface SmsDetailItem {
  mdid: string;         // 메시지 상세ID
  type: string;         // 문자구분
  sender: string;       // 발신번호
  receiver: string;     // 수신번호
  sms_state: string;    // 전송상태
  reg_date: string;     // 등록일
  send_date: string;    // 전송일
  reserve_date: string; // 예약일
}

// 통합된 메시지 정보 인터페이스
export interface CombinedSmsItem extends SmsHistoryItem {
  detail?: SmsDetailItem;
}

// API 응답 인터페이스
interface ApiResponse<T> {
  result_code: number;
  message: string;
  list: T[];
  next_yn: string;
}

export type SmsHistoryResponse = ApiResponse<SmsHistoryItem>;
export type SmsDetailResponse = ApiResponse<SmsDetailItem>;

// 전송내역 조회
export const getSmsHistory = async (params: {
  page?: string;
  page_size?: string;
  start_date?: string;
  limit_day?: string;
}): Promise<SmsHistoryResponse> => {
  const response = await axios.post('/api/sms', {
    page: params.page || '1',
    page_size: params.page_size || '30',
    start_date: params.start_date || '',
    limit_day: params.limit_day || ''
  });
  return response.data;
};

// 상세 조회
export const getSmsDetail = async (mid: string): Promise<SmsDetailResponse> => {
  const response = await axios.post('/api/sms/detail', {
    mid
  });
  return response.data;
};

// 전송내역 및 상세정보 통합 조회
export const getCombinedSmsHistory = async (params: {
  page?: string;
  page_size?: string;
  start_date?: string;
  limit_day?: string;
}): Promise<SmsHistoryResponse> => {
  const history = await getSmsHistory(params);
  
  // 각 메시지에 대한 상세 정보 조회
  const historyWithDetails = await Promise.all(
    history.list.map(async (item: SmsHistoryItem) => {
      try {
        const detail = await getSmsDetail(item.mid);
        return {
          ...item,
          detail: detail.list[0]
        };
      } catch (error) {
        console.error(`Failed to fetch details for message ${item.mid}:`, error);
        return item;
      }
    })
  );

  return {
    ...history,
    list: historyWithDetails
  };
};