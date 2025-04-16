import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { kakaoList } = data

    // 저장할 디렉토리 경로
    const saveDir = path.join(process.cwd(), 'public', 'data')
    
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true })
    }

    // 파일 저장 경로
    const filePath = path.join(saveDir, 'make_list.json')

    // JSON 데이터를 파일로 저장
    fs.writeFileSync(filePath, JSON.stringify(kakaoList, null, 2), 'utf-8')

    return NextResponse.json({ 
      success: true, 
      message: '카카오톡 친구 추가 목록이 성공적으로 저장되었습니다.',
      filePath: filePath
    })
  } catch (error) {
    console.error('Error saving kakao list:', error)
    return NextResponse.json({ 
      success: false, 
      message: '카카오톡 친구 추가 목록 저장 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
} 