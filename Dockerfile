# Node.js 베이스 이미지 사용
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (legacy-peer-deps 옵션 추가)
RUN npm install --legacy-peer-deps axios

# 프로젝트 파일 복사
COPY . .

# 빌드
RUN npm run build

# 포트 노출
EXPOSE 3000

# 애플리케이션 실행
CMD ["npm", "start"] 