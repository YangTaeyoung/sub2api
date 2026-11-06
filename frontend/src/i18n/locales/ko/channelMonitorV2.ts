export default {
  "channelMonitorV2": {
    "title": "채널 모니터",
    "updating": "데이터 업데이트 중",
    "updatedTo": "{time} 기준으로 업데이트됨",
    "partialCoverage": "과거 데이터 일부만 포함됨",
    "bootstrap": {
      "title": "과거 모니터 데이터 구축 중",
      "description": "처음 사용 설정하면 백그라운드에서 수동 집계가 진행되어 90분, 24시간, 7일, 30일 구간의 데이터가 채워집니다. 집계가 끝나면 모든 기간의 데이터가 완성됩니다.",
      "progress": "{percent}% 완료",
      "working": "백그라운드에서 집계 중…"
    },
    "timeRange": "기간",
    "clearFilters": "초기화",
    "refreshingFilters": "필터가 변경되어 매트릭스, 추이 및 세부 정보를 새로고침하는 중…",
    "switchingData": "필터링된 데이터를 전환하는 중…",
    "summaryAria": "선택한 기간 요약",
    "loadFailed": "채널 모니터를 불러오지 못했습니다",
    "detailLoadFailed": "채널 모니터 세부 정보를 불러오지 못했습니다",
    "otherModels": "기타 모델",
    "ignored": "무시됨",
    "currentUser": "현재 사용자",
    "ranges": {
      "90m": "90분",
      "24h": "24시간",
      "7d": "7일",
      "30d": "30일"
    },
    "filters": {
      "platform": "플랫폼",
      "allPlatforms": "전체",
      "group": "그룹",
      "allGroups": "전체",
      "model": "모델",
      "allModels": "전체",
      "empty": "옵션 없음",
      "selectedCount": "{count}",
      "labelValue": "{label}: {value}"
    },
    "groupBy": {
      "label": "그룹 기준",
      "platform": "플랫폼",
      "platformGroup": "플랫폼 / 그룹",
      "platformModel": "플랫폼 / 모델",
      "platformGroupModel": "플랫폼 / 그룹 / 모델"
    },
    "trendView": {
      "label": "추세 보기",
      "pulse": "펄스 매트릭스",
      "line": "선형 차트"
    },
    "healthMode": {
      "label": "상태 표시",
      "overall": "전체",
      "success": "오류율",
      "ttft": "첫 토큰",
      "cache": "캐시율"
    },
    "tabs": {
      "aria": "상세 기준",
      "models": "모델",
      "errors": "오류 원인",
      "users": "사용자 순위"
    },
    "metrics": {
      "rpm": "RPM",
      "tpm": "TPM",
      "tps": "초당 토큰 수",
      "rpmDetail": "분당 요청 수",
      "tpmDetail": "분당 토큰 수",
      "tpsDetail": "TPM ÷ 60으로 계산",
      "errorRate": "오류율",
      "ttft": "첫 토큰",
      "ttftP50": "첫 토큰 P50",
      "durationP50": "소요 시간 P50",
      "cacheRate": "캐시율",
      "cacheDetail": "캐시 읽기 비율",
      "successRate": "성공률",
      "successRateValue": "성공률 {value}",
      "errorRateValue": "오류율 {value}",
      "rpmValue": "RPM {value}",
      "tpmValue": "TPM {value}",
      "tpsValue": "초당 토큰 수 {value}",
      "ttftValue": "첫 토큰 {value}",
      "durationValue": "소요 시간 {value}",
      "cacheRateValue": "캐시율 {value}"
    },
    "table": {
      "platformModel": "플랫폼 / 모델",
      "rank": "순위",
      "user": "사용자"
    },
    "empty": {
      "title": "표시할 데이터가 없습니다",
      "description": "기간이나 필터를 변경해 보세요"
    },
    "bucket": {
      "minutes": "{count}분 단위",
      "hours": "{count}시간 단위",
      "days": "{count}일 단위"
    },
    "matrix": {
      "title": "가용성 추세",
      "description": "각 행은 채널 기준을, 각 블록은 집계 구간을 나타냅니다. 자세한 내용을 보려면 마우스를 올리세요",
      "wheelZoom": "블록 위에서 스크롤하면 확대됩니다(기간은 좁아지고 블록은 넓어집니다)",
      "wheelZoomX": "블록 위에서 스크롤하면 확대됩니다(기간은 좁아지고 블록은 넓어집니다)",
      "dimension": "채널 기준",
      "emptyTitle": "선택한 기간에 매트릭스 데이터가 없습니다",
      "legendAria": "상태 점수 범례",
      "bad": "나쁨",
      "good": "좋음",
      "healthyLegend": "정상 (≥80)",
      "warningLegend": "주의 (50–79)",
      "criticalLegend": "위험 (<50)",
      "unknownLegend": "트래픽 없음 / 표본 부족",
      "noTraffic": "이 구간에 트래픽이 없습니다",
      "noTrafficAt": "{time} · 트래픽 없음",
      "scoreLine": "상태 점수 {score}",
      "resetZoom": "확대 초기화"
    },
    "chart": {
      "title": "가용성 추세",
      "description": "완화된 추세: 오류율 · 첫 토큰 P50 · 캐시율",
      "emptyTitle": "선택한 기간에 추세 데이터가 없습니다",
      "errorLegend": "오류율 (왼쪽 축 %)",
      "cacheLegend": "캐시율 (왼쪽 축 %)",
      "ttftLegend": "첫 토큰 P50 (오른쪽 축)",
      "errorDataset": "오류율 추세 %",
      "cacheDataset": "캐시율 추세 %",
      "ttftDataset": "첫 토큰 추세 P50 (ms)",
      "percentAxis": "비율 %",
      "resetZoom": "확대 초기화"
    },
    "errorDetail": {
      "http": "HTTP {code}",
      "upstream": "업스트림 {code}",
      "noMessage": "오류 메시지가 없습니다",
      "empty": "범주별 비율만 표시됩니다 (샘플 메시지는 관리자 전용)"
    },
    "errorCategories": {
      "content_policy": "콘텐츠 정책",
      "authentication": "인증",
      "context_limit": "컨텍스트 한도",
      "invalid_request": "잘못된 요청",
      "model_unsupported": "지원하지 않는 모델",
      "group_access": "그룹 액세스",
      "quota_or_balance": "할당량 또는 잔액",
      "account_pool_unavailable": "사용 가능한 계정 풀이 없습니다",
      "rate_or_capacity": "요청 제한 또는 용량",
      "timeout": "시간 초과",
      "transport_or_stream": "전송 또는 스트림",
      "upstream_forbidden": "업스트림 접근 거부",
      "not_found": "찾을 수 없음",
      "client_cancelled": "클라이언트 요청 취소",
      "upstream_5xx": "업스트림 5xx",
      "internal": "내부 오류",
      "other": "기타"
    },
    "rank": {
      "gold": "1위 금메달",
      "silver": "2위 은메달",
      "bronze": "3위 동메달",
      "place": "{n}위",
      "unranked": "순위 없음"
    },
    "settings": {
      "title": "V2 데이터 모니터 설정",
      "description": "수동 사용량 집계 기준(플랫폼 / 모델 / 그룹)과 새로고침 주기를 설정합니다. 사용자 /monitor 페이지의 상태 색상과 세부 정보에는 절대 요청량이 아닌 비율, RPM, TPM이 표시됩니다.",
      "save": "저장",
      "loading": "불러오는 중…",
      "loadFailed": "V2 설정을 불러오지 못했습니다",
      "saveSuccess": "V2 모니터 설정을 저장했습니다",
      "saveFailed": "V2 모니터 설정을 저장하지 못했습니다",
      "modeBanner": "현재 시스템 모드는 {mode}입니다. V2 분 단위 집계가 실행되지 않습니다. 지금 설정을 준비해 두면 {modeV2}(으)로 전환한 후 적용됩니다. 시스템 설정 → 기능 전환에서 모드를 변경하세요.",
      "modeClosed": "채널 모니터 사용 안 함",
      "modeV1": "V1 능동 프로브",
      "modeV2": "V2 수동 모니터링",
      "enableTitle": "V2 집계 사용",
      "enableHint": "시스템 모드가 V2일 때 적용됩니다. 이 설정을 끄면 이 설정의 집계만 중지되며, 시스템 모드는 기능 전환에서 변경할 수 있습니다.",
      "refreshTitle": "집계 간격",
      "refreshHint": "매트릭스의 시간 단위와 새로고침 주기에 영향을 줍니다",
      "refreshAria": "집계 간격",
      "selectPlatform": "플랫폼 선택",
      "addPlatform": "플랫폼 추가",
      "platformsTitle": "플랫폼 및 모델",
      "platformsHint": "비워 두면 모든 실제 모델 이름을 표시합니다. 입력하면 나열된 모델만 각 행에 표시되고 나머지는 '기타'로 합산됩니다.",
      "modelsPlaceholder": "비워 두면 모든 실제 모델을 표시합니다. 또는 주요 모델을 나열하세요 (나머지는 '기타'로 표시).",
      "badgeAllModels": "모든 모델",
      "badgeOther": "+ 기타",
      "groupsTitle": "모니터링 그룹",
      "groupsSelected": "그룹 {count}개 선택",
      "groupsAll": "모든 그룹",
      "groupsEmpty": "사용 가능한 그룹이 없습니다",
      "errorsTitle": "오류 범주 및 제외 설정",
      "errorsHint": "‘제외’로 선택한 범주는 오류율과 상태 점수에서 제외되지만, 오류 상세에는 흐리게 표시됩니다. 일치하지 않는 오류는 ‘기타’로 합산됩니다.",
      "ignoredSummary": "제외된 범주 {ignored}개 · 오류율에 포함된 범주 {counted}개",
      "healthTitle": "상태 임계값",
      "healthHint": "사용자에게 표시되는 상태 색상과 전체 점수를 설정합니다. 기본값은 허용 범위가 넓어 낮은 오류율이나 낮은 캐시율만으로 상태가 바로 나빠지지 않습니다.",
      "fields": {
        "minimumSample": "최소 샘플 수",
        "warningError": "오류율 주의 기준 %",
        "criticalError": "오류율 위험 기준 %",
        "targetTtft": "TTFT 목표 ms",
        "warningTtft": "TTFT 주의 기준 ms",
        "criticalTtft": "TTFT 위험 기준 ms",
        "warningCache": "캐시율 주의 기준 %",
        "criticalCache": "캐시율 위험 기준 %"
      },
      "namedModelsEmpty": "플랫폼별 모델 목록이 비어 있습니다. 실제 모델명이 모두 표시되며 ‘기타’로 묶이지 않습니다.",
      "namedModelsCount": "모델 차원 {count}개를 표시합니다. 목록에 없는 모델은 플랫폼별 ‘기타’로 묶입니다.",
      "userContractTitle": "사용자 표시 기준",
      "userContract": {
        "health": "상태 색상 가중치: 오류율 60% + 첫 토큰 P50 20% + 캐시율 20%(위 기준에서 설정 가능)",
        "trend": "추세는 펄스 매트릭스와 선형 차트 중에서 선택할 수 있습니다(오류 · 캐시 · 첫 토큰).",
        "latency": "지연 시간은 평균 · P50 · P90으로 표시하며, 요청 및 오류 건수는 표시하지 않습니다.",
        "models": "모델 목록이 비어 있으면 실제 모델명을 표시하며 모든 모델을 ‘기타’로 묶지 않습니다."
      }
    },
    "admin": {
      "descriptionV1": "시스템 모드는 V1 능동 프로브입니다. 프로브 모니터를 관리하고 검사를 실행할 수 있으며 V2 집계는 실행되지 않습니다.",
      "descriptionV2": "시스템 모드는 V2 수동 모니터링입니다. 집계 차원을 설정할 수 있으며 V1 능동 프로브는 실행되지 않습니다.",
      "tabAria": "모니터 관리",
      "tabV2": "V2 데이터 모니터 설정",
      "tabV1Active": "V1 능동 프로브",
      "tabV1History": "V1 기록(현재 모드에서는 프로브가 실행되지 않음)"
    }
  }
}
