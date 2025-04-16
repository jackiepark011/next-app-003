import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "주소록 관리 시스템",
    template: "%s | 주소록 관리 시스템"
  },
  description: "효율적인 연락처 관리와 메시지 전송을 위한 통합 솔루션",
  keywords: ["주소록", "연락처 관리", "메시지 전송", "중복 확인"],
  authors: [{ name: "Your Name" }],
  creator: "Your Name",
  publisher: "Your Company",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://your-domain.com",
    siteName: "주소록 관리 시스템",
    title: "주소록 관리 시스템",
    description: "효율적인 연락처 관리와 메시지 전송을 위한 통합 솔루션",
  },
  twitter: {
    card: "summary_large_image",
    title: "주소록 관리 시스템",
    description: "효율적인 연락처 관리와 메시지 전송을 위한 통합 솔루션",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          forcedTheme="light"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'