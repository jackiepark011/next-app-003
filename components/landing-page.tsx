"use client"

import Image from "next/image"
import Link from "next/link"

export function LandingPage() {
  return (
    <main className="min-h-[80vh] bg-gradient-to-b from-white to-gray-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              효율적인 연락처 관리와<br />
              <span className="text-blue-600">메시지 전송</span> 솔루션
            </h1>
            <p className="text-lg text-gray-600">
              간편한 주소록 관리부터 메시지 전송까지, 모든 기능을 한 곳에서
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/contacts"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                주소록 관리
              </Link>
              <Link
                href="/message-sender"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                메시지 발송
              </Link>
              <Link
                href="/duplicate-remover"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center"
              >
                중복 제거
              </Link>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative w-full h-[300px]">
              <Image
                src="/placeholder.svg"
                alt="주소록 관리 시스템"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-8 bg-white">
        <h2 className="text-2xl font-bold text-center mb-8">주요 기능</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">주소록 관리</h3>
            <p className="text-sm text-gray-600">
              연락처를 쉽게 추가, 수정, 삭제하고 그룹으로 관리할 수 있습니다.
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">메시지 전송</h3>
            <p className="text-sm text-gray-600">
              선택한 연락처나 그룹에 한 번에 메시지를 전송할 수 있습니다.
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">중복 확인</h3>
            <p className="text-sm text-gray-600">
              연락처 중복을 자동으로 확인하고 관리할 수 있습니다.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}