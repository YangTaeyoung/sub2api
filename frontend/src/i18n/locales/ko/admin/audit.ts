export default {
  "audit": {
    "title": "감사 로그",
    "description": "관리자와 사용자의 관리 작업을 기록합니다. 헤더 인증 정보는 앞뒤 문자만 보존하며 요청 본문은 마스킹합니다. 로그 항목은 개별 삭제할 수 없으며, 전체 삭제에는 2단계 인증이 필요합니다.",
    "clearAll": "전체 삭제",
    "empty": "감사 로그가 없습니다",
    "loadFailed": "감사 로그를 불러오지 못했습니다",
    "filters": {
      "all": "전체",
      "q": "키워드",
      "qPlaceholder": "경로 / 작업 / 실행자 이메일",
      "actorEmail": "실행자 이메일",
      "action": "작업",
      "clientIp": "클라이언트 IP",
      "method": "메서드",
      "authMethod": "인증 방식",
      "result": "결과",
      "resultSuccess": "성공",
      "resultFailure": "실패",
      "startTime": "시작 시각",
      "endTime": "종료 시각"
    },
    "columns": {
      "time": "시간",
      "actor": "실행자",
      "action": "작업",
      "method": "메서드",
      "result": "결과",
      "clientIp": "클라이언트 IP",
      "detail": "세부 정보"
    },
    "detail": {
      "title": "감사 로그 상세 정보",
      "actorRole": "역할",
      "methodPath": "메서드 / 경로",
      "latency": "지연 시간",
      "requestId": "요청 ID",
      "credential": "인증 정보 (마스킹됨)",
      "userAgent": "User-Agent",
      "requestBody": "요청 본문 (비식별 처리됨)",
      "extra": "추가 정보"
    },
    "clearConfirm": {
      "title": "감사 로그 전체 삭제",
      "message": "모든 감사 로그가 영구 삭제되며, 되돌릴 수 없습니다. 삭제 작업 자체는 기록됩니다. 계속하시겠습니까?",
      "totpTitle": "2단계 인증 코드 입력",
      "totpHint": "감사 로그를 삭제하려면 새 TOTP 인증이 필요합니다.",
      "success": "감사 로그 {count}개를 삭제했습니다",
      "failed": "감사 로그를 삭제하지 못했습니다"
    }
  }
}
