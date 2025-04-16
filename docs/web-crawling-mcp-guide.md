# 웹 크롤링 MCP 사용 가이드

웹 크롤링 MCP는 웹사이트의 콘텐츠를 수집하고 분석하는 데 사용되는 강력한 도구입니다. 이 가이드에서는 주요 기능과 사용 예시를 설명합니다.

## 목차
1. [단일 페이지 스크래핑](#단일-페이지-스크래핑)
2. [URL 발견](#url-발견)
3. [대량 크롤링](#대량-크롤링)
4. [검색 및 추출](#검색-및-추출)
5. [심층 연구](#심층-연구)

## 단일 페이지 스크래핑

### 기본 스크래핑
```javascript
mcp_mcp_server_firecrawl_firecrawl_scrape({
    "url": "https://example.com",
    "formats": ["markdown"],  // markdown, html, rawHtml, screenshot, links
    "onlyMainContent": true   // 메인 콘텐츠만 추출
})
```

### 고급 스크래핑 옵션
```javascript
mcp_mcp_server_firecrawl_firecrawl_scrape({
    "url": "https://example.com",
    "formats": ["markdown", "screenshot"],
    "mobile": true,           // 모바일 뷰포트 사용
    "waitFor": 5000,         // 페이지 로딩 대기 시간 (ms)
    "includeTags": ["article", "main"],
    "excludeTags": ["nav", "footer"],
    "removeBase64Images": true
})
```

### 동적 콘텐츠 처리
```javascript
mcp_mcp_server_firecrawl_firecrawl_scrape({
    "url": "https://example.com",
    "actions": [
        {
            "type": "wait",
            "milliseconds": 2000
        },
        {
            "type": "click",
            "selector": ".load-more-button"
        },
        {
            "type": "scroll",
            "direction": "down"
        }
    ],
    "formats": ["markdown", "screenshot"]
})
```

## URL 발견

### 사이트맵 기반 URL 발견
```javascript
mcp_mcp_server_firecrawl_firecrawl_map({
    "url": "https://example.com",
    "sitemapOnly": true,
    "limit": 100
})
```

### HTML 링크 기반 URL 발견
```javascript
mcp_mcp_server_firecrawl_firecrawl_map({
    "url": "https://example.com",
    "ignoreSitemap": true,
    "includeSubdomains": true,
    "search": "blog"  // 특정 키워드 포함 URL만 검색
})
```

## 대량 크롤링

### 기본 크롤링
```javascript
mcp_mcp_server_firecrawl_firecrawl_crawl({
    "url": "https://example.com",
    "maxDepth": 2,
    "limit": 100,
    "scrapeOptions": {
        "formats": ["markdown"],
        "onlyMainContent": true
    }
})
```

### 고급 크롤링 설정
```javascript
mcp_mcp_server_firecrawl_firecrawl_crawl({
    "url": "https://example.com",
    "maxDepth": 3,
    "includePaths": ["/blog/", "/news/"],
    "excludePaths": ["/admin/", "/private/"],
    "allowExternalLinks": false,
    "deduplicateSimilarURLs": true,
    "ignoreQueryParameters": true,
    "scrapeOptions": {
        "formats": ["markdown", "links"],
        "waitFor": 2000
    }
})
```

### 배치 스크래핑
```javascript
mcp_mcp_server_firecrawl_firecrawl_batch_scrape({
    "urls": [
        "https://example.com/page1",
        "https://example.com/page2",
        "https://example.com/page3"
    ],
    "options": {
        "formats": ["markdown"],
        "onlyMainContent": true
    }
})
```

## 검색 및 추출

### 웹 검색
```javascript
mcp_mcp_server_firecrawl_firecrawl_search({
    "query": "검색어",
    "limit": 10,
    "country": "kr",
    "lang": "ko",
    "scrapeOptions": {
        "formats": ["markdown"],
        "onlyMainContent": true
    }
})
```

### 구조화된 데이터 추출
```javascript
mcp_mcp_server_firecrawl_firecrawl_extract({
    "urls": ["https://example.com/product"],
    "schema": {
        "type": "object",
        "properties": {
            "title": { "type": "string" },
            "price": { "type": "number" },
            "description": { "type": "string" }
        }
    },
    "prompt": "제품 정보를 추출해주세요"
})
```

## 심층 연구

### 심층 연구 수행
```javascript
mcp_mcp_server_firecrawl_firecrawl_deep_research({
    "query": "연구 주제",
    "maxDepth": 5,
    "maxUrls": 100,
    "timeLimit": 300  // 초 단위
})
```

## 모범 사례

1. 크롤링 에티켓
   - robots.txt 준수
   - 적절한 요청 간격 유지
   - 서버 부하 고려

2. 성능 최적화
   - 필요한 데이터만 수집
   - 병렬 처리 활용
   - 캐싱 전략 수립

3. 데이터 품질
   - 적절한 대기 시간 설정
   - 동적 콘텐츠 처리
   - 데이터 검증

## 문제 해결

1. 페이지 로딩 실패
   - 대기 시간 조정
   - 네트워크 상태 확인
   - User-Agent 설정

2. 콘텐츠 추출 실패
   - 선택자 확인
   - JavaScript 렌더링 대기
   - 동적 로딩 처리

3. 차단 방지
   - 요청 간격 조정
   - IP 로테이션 고려
   - 인증 처리

## 참고 자료

- [웹 크롤링 모범 사례](https://www.robotstxt.org/robotstxt.html)
- [동적 웹페이지 크롤링 가이드](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) 