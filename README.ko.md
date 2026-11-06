# Sub2API 한국어 UI

기존 Sub2API의 계정 연결, API 키, 라우팅, 사용 기록을 유지하면서 한국어와 관리 화면을 다듬은 포크입니다. 구현은 `ui/korean-redesign` 브랜치에 있습니다.

- 한국어를 독립적인 기본 언어로 제공하고, 기존 영어·중국어 선택도 유지합니다.
- Pretendard Variable을 자체 호스팅합니다. 한국어·영문·숫자에 같은 서체를 쓰고 수치는 고정폭 숫자로 정렬합니다.
- 개요, 계정, API 키, 설정에 공통된 밝은 테마와 어두운 테마를 적용합니다.
- 차트는 실제 사용량만 표시합니다. 기간별 요약과 모델 표는 같은 스냅샷을 사용하고, 한 구간만 있으면 막대로 표시합니다. 툴팁, 범례, 캐시 적중률 전환, 표로 데이터 보기를 제공합니다.

디자인 기준과 실제 토큰은 [DESIGN.md](DESIGN.md)에 정리했습니다. 운영 화면의 밀도와 위계는 [Linear의 UI 개편](https://linear.app/now/how-we-redesigned-the-linear-ui)과 [대시보드](https://linear.app/docs/dashboards)를 참고했습니다. 서체 출처는 [Pretendard 공식 저장소](https://github.com/orioncactus/pretendard)이며, 동봉한 OFL 라이선스를 유지합니다.

## 개발 및 확인

기준 소스는 운영 이미지 0.2.19의 리비전 `dece26153621959ccd7635814f4b2d08304e681a`입니다. 백엔드 기능 업그레이드와 데이터 마이그레이션을 이 UI 변경에 섞지 않았습니다.

```sh
cd frontend
npx --yes pnpm@9 install --frozen-lockfile
npx --yes pnpm@9 build
npx --yes pnpm@9 test:run -- src/i18n/__tests__
```

루트 Dockerfile은 프런트엔드를 빌드한 뒤 Go 바이너리에 포함합니다. UI 변경도 새 앱 이미지를 만들어 배포합니다.

```sh
docker build --build-arg VERSION=0.2.19-ko --build-arg COMMIT="$(git rev-parse HEAD)" -t sub2api-korean:local .
```

## 기존 설치에 적용

먼저 PostgreSQL 덤프와 설정·데이터 디렉터리를 백업하고 복구 도구로 읽을 수 있는지 확인합니다. 기존 `.env`, 기본 Compose 파일, 데이터 볼륨을 유지한 채 별도 Compose override로 `sub2api` 서비스의 이미지 항목만 변경합니다. 병합된 설정을 확인한 뒤 앱 서비스만 교체합니다. 자세한 병합 규칙은 [Docker 공식 문서](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/)를 따릅니다.

기존 공식 이미지와 백업을 보관합니다. 되돌릴 때는 override의 이미지 선택을 원래 값으로 돌리고 앱 서비스를 다시 생성합니다. 이 포크의 UI를 유지하려면 공식 이미지로 단순 교체하는 대신 업스트림 변경을 별도 검토·병합한 뒤 포크 이미지를 다시 빌드합니다.

운영 비밀키, OAuth 토큰, DB 덤프, 개인 사용량 화면은 저장소에 넣지 않습니다. 원본 프로젝트의 설치·기능 문서는 [README](README.md)를 참고하세요.
