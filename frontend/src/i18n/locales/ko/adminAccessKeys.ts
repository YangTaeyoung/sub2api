export default {
  "title": "관리자 액세스 키",
  "authorizationHint": "리소스 범위별 작업 권한을 부여합니다. 선택하지 않은 작업은 거부됩니다.",
  "sharedAccountWarning": "공유 계정 변경 사항은 연결된 모든 그룹에 적용됩니다. 전역 권한은 그룹 범위와 별도로 적용됩니다.",
  "secretWarning": "전체 키는 한 번만 표시됩니다. 창을 닫기 전에 복사해 저장하세요.",
  "copySecret": "키 복사",
  "dismissSecret": "저장 완료, 닫기",
  "create": "관리자 키 만들기",
  "refresh": "새로고침",
  "loading": "키와 권한을 불러오는 중…",
  "noDescription": "설명 없음",
  "never": "없음",
  "neverUsed": "사용 기록 없음",
  "summaryLabel": "권한 요약",
  "editPermissions": "권한 수정",
  "disable": "사용 중지",
  "enable": "사용 설정",
  "rotate": "교체",
  "revoke": "영구 폐기",
  "deleteRecord": "기록 삭제",
  "editTitle": "키 수정",
  "createTitle": "키 만들기",
  "name": "이름",
  "description": "설명",
  "expiration": "만료(현지 시간, 만료일이 없으면 비워 두세요)",
  "allowedIps": "허용 IP / CIDR(한 줄에 하나씩, 비워 두면 모든 IP 허용)",
  "enabled": "키 사용 설정",
  "allGroups": "모든 그룹 및 향후 생성될 그룹",
  "groups": "그룹(여러 개 선택 가능)",
  "includeUngrouped": "그룹에 속하지 않은 계정 포함",
  "accountTypes": "계정 유형(계정 작업에만 적용, 선택하지 않으면 계정에 접근할 수 없음)",
  "platforms": "플랫폼(여러 개 선택 가능, 비워 두면 모두 허용)",
  "accountOperations": "허용된 계정 작업",
  "groupOperations": "허용된 그룹 작업(위의 그룹 및 플랫폼으로 제한됨)",
  "modelAllowlistHint": "그룹 모델 허용 목록에 따라 그룹에서 사용할 수 있는 모델이 제한됩니다.",
  "removeRule": "규칙 삭제",
  "addRule": "리소스 규칙 추가",
  "globalPermissions": "전역 권한(기본적으로 모두 사용 중지)",
  "processing": "처리 중…",
  "save": "키 저장",
  "cancel": "취소",
  "other": "기타",
  "allGroupsSummary": "모든 그룹 및 향후 생성될 그룹",
  "noGroups": "그룹 없음",
  "ungroupedSummary": ", 그룹에 속하지 않은 계정 포함",
  "noAccountTypes": "계정 유형을 선택하지 않음(계정에 접근할 수 없음)",
  "anyPlatform": "모든 플랫폼",
  "operationFailed": "작업에 실패했습니다. 다시 시도해 주세요.",
  "nameRequired": "키 이름을 입력하세요",
  "expirationInvalid": "유효한 만료일을 입력하세요",
  "saved": "키를 저장했습니다",
  "statusUpdated": "키 상태를 업데이트했습니다",
  "rotated": "키를 교체했습니다",
  "revoked": "키를 영구 폐기했습니다",
  "removed": "목록에서 키를 삭제했습니다. 과거 작업 기록은 보관됩니다.",
  "copied": "키를 복사했습니다",
  "copyFailed": "복사하지 못했습니다. 키를 직접 복사해 주세요.",
  "statusRevoked": "폐기됨",
  "statusDisabled": "사용 중지됨",
  "statusExpired": "만료됨",
  "statusEnabled": "사용 설정됨",
  "summary": "전역 권한: {globals} · 리소스 규칙: {rules}",
  "ruleLine": "규칙 {index}: {summary}",
  "expires": "만료일: {value}",
  "lastUsed": "마지막 사용: {value}",
  "ruleLegend": "계정 및 그룹 리소스 규칙 {index}",
  "groupFallback": "그룹 #{id}",
  "ruleSummary": "{groups}; 계정 유형: {types}(계정 작업만 해당); 플랫폼: {platforms}; 작업 수: {count}",
  "rotateConfirm": "“{name}”의 키를 교체하면 현재 키가 즉시 무효화됩니다. 계속하시겠습니까?",
  "revokeConfirm": "“{name}”을(를) 영구적으로 폐기하면 되돌릴 수 없습니다. 계속하시겠습니까?",
  "deleteConfirm": "키 기록 “{name}”을(를) 삭제하시겠습니까? 목록에서만 제거되며 과거 작업 기록은 유지됩니다.",
  "legacy": "기존 전체 액세스 키(범위 지정 키로 마이그레이션 권장)",
  "fullAccessLabel": "전체 액세스(기존 관리자 키 호환)",
  "fullAccessWarning": "이 키는 향후 추가될 관리 엔드포인트를 포함해 모든 관리 리소스에 접근하고, 민감한 데이터를 읽고, 계정 및 결제 설정을 변경할 수 있습니다. 그룹, 플랫폼, 계정 유형, 작업 규칙은 더 이상 이 키를 제한하지 않습니다. 관리자 브라우저 세션이나 추가 인증이 필요한 엔드포인트에는 해당 요구 사항이 그대로 적용됩니다.",
  "rulesSuspended": "리소스 규칙은 일시 중지되며 전체 액세스를 끄면 다시 적용됩니다. 만료, IP 제한, 속도 제한, 감사는 계속 적용됩니다.",
  "fullAccessConfirmTitle": "전체 액세스 확인",
  "fullAccessPhrase": "전체 액세스 사용 설정",
  "fullAccessPhraseHint": "확인하려면 “{phrase}”을(를) 입력하세요:",
  "unknownPermission": "알 수 없는 권한({id})",
  "permissions": {
    "accounts_didentity_dread": {
      "label": "계정 이메일, 요금제, 생성 시각 읽기(토큰 제외)",
      "category": "계정"
    },
    "accounts_dusage_dread": {
      "label": "권한이 있는 계정의 할당량 및 스냅샷 읽기·새로고침",
      "category": "계정"
    },
    "accounts_dstats_dread": {
      "label": "계정 사용량 및 비용 통계 읽기",
      "category": "계정"
    },
    "openai_dquota_dread": {
      "label": "OpenAI 업스트림 할당량 및 남은 초기화 횟수 읽기",
      "category": "OpenAI"
    },
    "openai_dquota_dreset": {
      "label": "OpenAI 초기화를 사용해 할당량 복구",
      "category": "OpenAI"
    },
    "openai_dreferrals_dread": {
      "label": "OpenAI 추천 자격 및 남은 초대 수 읽기",
      "category": "OpenAI"
    },
    "openai_dreferrals_dinvite": {
      "label": "OpenAI 초대 이메일 보내기",
      "category": "OpenAI"
    },
    "accounts_doptions_dwrite": {
      "label": "OpenAI OAuth ID 및 연결 옵션 쓰기",
      "category": "계정"
    },
    "accounts_drate_dwrite": {
      "label": "계정 과금 배율 설정",
      "category": "계정"
    },
    "groups_dlist_dread": {
      "label": "선택한 그룹 상세 정보 읽기(이름, 플랫폼, 상태)",
      "category": "그룹"
    },
    "groups_dcapacity_dread": {
      "label": "선택한 그룹 용량 읽기(계정 유형과 관계없이 그룹 전체)",
      "category": "그룹"
    },
    "openai_dtokens_drefresh": {
      "label": "호출자가 제공한 OpenAI 토큰 갱신(토큰 반환, 선택한 프록시 허용)",
      "category": "OAuth"
    },
    "accounts_dread": {
      "label": "계정 읽기(마스킹됨)",
      "category": "계정"
    },
    "accounts_dcreate": {
      "label": "계정 만들기",
      "category": "계정"
    },
    "accounts_dupdate": {
      "label": "계정 이름 및 메모 수정",
      "category": "계정"
    },
    "accounts_dcredentials": {
      "label": "자격 증명 쓰기(읽기 권한 없음)",
      "category": "계정"
    },
    "accounts_dmodels_dwrite": {
      "label": "계정 모델 허용 목록 ID 및 매핑 수정",
      "category": "계정"
    },
    "accounts_dnetwork": {
      "label": "엔드포인트, 프록시, 연결 옵션 변경",
      "category": "계정"
    },
    "accounts_dstatus": {
      "label": "계정 사용 설정·중지 및 스케줄링 전환",
      "category": "계정"
    },
    "accounts_dschedule": {
      "label": "동시 실행 수, 우선순위, 만료 변경",
      "category": "계정"
    },
    "accounts_drefresh": {
      "label": "OAuth 자격 증명 갱신",
      "category": "계정"
    },
    "accounts_drecover": {
      "label": "계정 오류 및 속도 제한 상태 해제",
      "category": "계정"
    },
    "accounts_ddelete": {
      "label": "계정 삭제(공유 그룹에 영향)",
      "category": "계정"
    },
    "accounts_dgroups": {
      "label": "권한이 있는 그룹 연결 변경",
      "category": "계정"
    },
    "groups_dmodels_dread": {
      "label": "선택한 그룹의 모델 허용 목록 및 후보 ID 읽기",
      "category": "그룹 모델"
    },
    "groups_dmodels_dwrite": {
      "label": "선택한 그룹의 모델 허용 목록 수정(그룹 전체에 영향)",
      "category": "그룹 모델"
    },
    "proxies_dread": {
      "label": "프록시 IP 후보 읽기(페이지 단위, 자격 증명 제외)",
      "category": "프록시"
    },
    "models_ddefaults_dread": {
      "label": "기본 모델 허용 목록 ID 및 매핑 읽기",
      "category": "모델"
    },
    "dashboard_dread": {
      "label": "사이트 전체 운영 보고서 읽기",
      "category": "보고서"
    },
    "users_dread": {
      "label": "모든 사용자 프로필 읽기(연락처 포함)",
      "category": "사용자"
    },
    "users_dbalance_dread": {
      "label": "모든 사용자 잔액 및 거래 내역 읽기",
      "category": "결제·정산"
    },
    "users_dbalance_dwrite": {
      "label": "모든 사용자 잔액 증감",
      "category": "결제·정산"
    },
    "users_dquotas_dread": {
      "label": "모든 사용자의 플랫폼 할당량 읽기",
      "category": "사용자"
    },
    "users_dquotas_dwrite": {
      "label": "모든 사용자의 플랫폼 할당량 변경 및 초기화",
      "category": "사용자"
    },
    "groups_dread": {
      "label": "모든 그룹 설정 읽기",
      "category": "그룹"
    },
    "usage_dread": {
      "label": "사이트 전체 사용 내역 및 사용자별 사용량 읽기",
      "category": "보고서"
    },
    "payment_dread": {
      "label": "모든 결제 주문 및 보고서 읽기",
      "category": "결제·정산"
    },
    "payment_dcancel": {
      "label": "결제 주문 취소",
      "category": "결제·정산"
    },
    "payment_dfulfill": {
      "label": "결제 주문 처리 재시도",
      "category": "결제·정산"
    },
    "payment_drefund": {
      "label": "환불 실행 및 환불 결과 확인",
      "category": "결제·정산"
    },
    "payment_dplans_dread": {
      "label": "모든 결제 요금제 읽기",
      "category": "결제·정산"
    },
    "payment_dplans_dwrite": {
      "label": "결제 요금제 생성, 수정, 삭제",
      "category": "결제·정산"
    },
    "subscriptions_dread": {
      "label": "모든 구독 기록 읽기",
      "category": "구독"
    },
    "subscriptions_dassign": {
      "label": "모든 사용자에게 구독 할당",
      "category": "구독"
    },
    "subscriptions_dextend": {
      "label": "구독 만료일 연장",
      "category": "구독"
    },
    "subscriptions_drevoke": {
      "label": "구독 회수",
      "category": "구독"
    },
    "subscriptions_drestore": {
      "label": "구독 복원",
      "category": "구독"
    },
    "subscriptions_dreset": {
      "label": "구독 할당량 초기화",
      "category": "구독"
    },
    "announcements_dread": {
      "label": "모든 공지 및 읽음 확인 읽기",
      "category": "콘텐츠"
    },
    "announcements_dwrite": {
      "label": "공지 생성, 게시, 수정",
      "category": "콘텐츠"
    },
    "announcements_ddelete": {
      "label": "공지 삭제",
      "category": "콘텐츠"
    },
    "promo_dread": {
      "label": "프로모션 코드 및 사용 기록 읽기",
      "category": "결제·정산"
    },
    "promo_dwrite": {
      "label": "프로모션 코드 혜택 생성 및 수정",
      "category": "결제·정산"
    },
    "promo_ddelete": {
      "label": "프로모션 코드 삭제",
      "category": "결제·정산"
    },
    "ops_dread": {
      "label": "사이트 전체 운영 지표 읽기",
      "category": "모니터링"
    },
    "ops_derrors_dread": {
      "label": "사이트 전체 요청 오류 상세 읽기(민감 정보)",
      "category": "모니터링"
    },
    "ops_derrors_dresolve": {
      "label": "요청 오류 해결 상태 표시",
      "category": "모니터링"
    },
    "ops_dalerts_dread": {
      "label": "사이트 전체 알림 규칙 및 이벤트 읽기",
      "category": "모니터링"
    },
    "ops_dalerts_dwrite": {
      "label": "알림 규칙, 상태, 음소거 변경",
      "category": "모니터링"
    },
    "system_dread": {
      "label": "현재 및 사용 가능한 시스템 버전 읽기",
      "category": "시스템"
    }
  },
  "listSeparator": ", "
}
