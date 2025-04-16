# GitHub MCP 사용 가이드

GitHub MCP(Multi-Cursor Plugin)는 GitHub API를 쉽게 사용할 수 있게 해주는 도구입니다. 이 가이드에서는 주요 기능과 사용 예시를 설명합니다.

## 목차
1. [저장소 관리](#저장소-관리)
2. [파일 관리](#파일-관리)
3. [이슈 관리](#이슈-관리)
4. [풀 리퀘스트 관리](#풀-리퀘스트-관리)
5. [코드 검색](#코드-검색)

## 저장소 관리

### 저장소 검색
```javascript
mcp_github_search_repositories({
    "query": "test",  // 검색어
    "page": 1,        // 페이지 번호 (선택사항)
    "perPage": 30     // 페이지당 결과 수 (선택사항)
})
```

### 새 저장소 생성
```javascript
mcp_github_create_repository({
    "name": "my-new-repo",
    "description": "새로운 저장소 설명",
    "private": false,
    "autoInit": true  // README.md 자동 생성
})
```

### 저장소 포크
```javascript
mcp_github_fork_repository({
    "owner": "original-owner",
    "repo": "original-repo",
    "organization": "my-org"  // 선택사항
})
```

## 파일 관리

### 파일 내용 가져오기
```javascript
mcp_github_get_file_contents({
    "owner": "user",
    "repo": "repository",
    "path": "path/to/file.txt",
    "branch": "main"  // 선택사항
})
```

### 파일 생성/수정
```javascript
mcp_github_create_or_update_file({
    "owner": "user",
    "repo": "repository",
    "path": "path/to/file.txt",
    "message": "커밋 메시지",
    "content": "파일 내용",
    "branch": "main",
    "sha": "현재_파일_SHA"  // 파일 수정 시 필요
})
```

### 여러 파일 한번에 푸시
```javascript
mcp_github_push_files({
    "owner": "user",
    "repo": "repository",
    "branch": "main",
    "message": "커밋 메시지",
    "files": [
        {
            "path": "file1.txt",
            "content": "내용 1"
        },
        {
            "path": "file2.txt",
            "content": "내용 2"
        }
    ]
})
```

## 이슈 관리

### 이슈 생성
```javascript
mcp_github_create_issue({
    "owner": "user",
    "repo": "repository",
    "title": "이슈 제목",
    "body": "이슈 내용",
    "labels": ["bug", "help wanted"],
    "assignees": ["username"]
})
```

### 이슈 조회
```javascript
mcp_github_get_issue({
    "owner": "user",
    "repo": "repository",
    "issue_number": 1
})
```

### 이슈 목록 조회
```javascript
mcp_github_list_issues({
    "owner": "user",
    "repo": "repository",
    "state": "open",  // open, closed, all
    "labels": ["bug"],
    "sort": "created",  // created, updated, comments
    "direction": "desc"
})
```

### 이슈 업데이트
```javascript
mcp_github_update_issue({
    "owner": "user",
    "repo": "repository",
    "issue_number": 1,
    "title": "수정된 제목",
    "body": "수정된 내용",
    "state": "closed",
    "labels": ["fixed"]
})
```

### 이슈에 댓글 추가
```javascript
mcp_github_add_issue_comment({
    "owner": "user",
    "repo": "repository",
    "issue_number": 1,
    "body": "댓글 내용"
})
```

## 풀 리퀘스트 관리

### 풀 리퀘스트 생성
```javascript
mcp_github_create_pull_request({
    "owner": "user",
    "repo": "repository",
    "title": "PR 제목",
    "body": "PR 설명",
    "head": "feature-branch",
    "base": "main",
    "draft": false
})
```

## 코드 검색

### 코드 검색
```javascript
mcp_github_search_code({
    "q": "filename:package.json express",
    "page": 1,
    "per_page": 30,
    "order": "desc"
})
```

### 브랜치 생성
```javascript
mcp_github_create_branch({
    "owner": "user",
    "repo": "repository",
    "branch": "new-branch",
    "from_branch": "main"  // 선택사항
})
```

## 사용 팁

1. 모든 API 호출에서 에러 처리를 고려해야 합니다.
2. 대용량 데이터를 다룰 때는 페이지네이션을 활용하세요.
3. 민감한 정보는 환경 변수로 관리하는 것이 좋습니다.
4. API 호출 제한에 주의하세요.

## 자주 발생하는 문제

1. 인증 오류
   - GitHub 토큰이 올바르게 설정되어 있는지 확인
   - 토큰의 권한(scope) 확인

2. 파일 수정 실패
   - SHA 값이 필요한 경우 확인
   - 브랜치 보호 설정 확인

3. 검색 결과 제한
   - 검색 쿼리 최적화
   - 페이지네이션 활용

## 참고 자료

- [GitHub REST API 문서](https://docs.github.com/en/rest)
- [GitHub API 모범 사례](https://docs.github.com/en/rest/guides/best-practices-for-integrators) 