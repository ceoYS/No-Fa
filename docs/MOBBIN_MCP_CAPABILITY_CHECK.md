# MOBBIN_MCP_CAPABILITY_CHECK.md

Mobbin MCP 능력 점검 (Capability probe) — 2026-05-26

상위 라운드: MOBBIN_BENCHMARK_PLAN.md / 산출: MOBBIN_MCP_REFERENCE_PLAN.md

---

## 1. 연결 상태 (Connection status)

- Mobbin MCP: **연결됨 (connected, authorized).**
- 확인 방법: `/mcp` → "Authentication successful. Connected to mobbin." + 실제 `search_screens` 호출 성공(iOS 결과 반환).

---

## 2. 노출된 도구 (Exposed tools)

단 1개 도구만 노출:

| 도구 | 입력 | 출력 |
|---|---|---|
| `mcp__mobbin__search_screens` | `query`(자연어, 필수), `platform`(ios/web, 필수), `limit`(1–30), `mode`(deep/fast), `image_format`(webp/jpg), `exclude_screen_ids` | 화면 이미지(inline base64) + 메타데이터 |

앱 목록 조회·flow 조회·태그 조회·컬렉션 저장·이미지 export 도구는 **없음.**

---

## 3. 능력 매트릭스 (Capability matrix)

| # | 질문 | 가능 여부 | 비고 |
|---|---|---|---|
| 1 | 앱 이름/카테고리로 앱 검색 | △ 부분 | 전용 필터 없음. `query`에 앱명 포함 가능하나 화면 단위 검색만. |
| 2 | UX 패턴 키워드로 화면 검색 | ✅ 가능 | 자연어 query 핵심 기능. |
| 3 | iPhone/iOS 화면 필터 | ✅ 가능 | `platform: "ios"`. |
| 4 | 화면 제목/앱명/flow/태그/URL 반환 | △ 부분 | 반환: `id`, `app_name`, `platform`, `image_url`, `mobbin_url`. **화면 제목/flow/태그는 반환 안 됨.** |
| 5 | 스크린샷/이미지 리소스 반환 | ✅ 가능 | inline base64 이미지(응답 안에). 파일 아님. |
| 6 | 스크린샷 로컬 export/저장 | ❌ 불가 | 디스크 저장 도구 없음. 이미지는 응답 컨텍스트에만 존재. |

---

## 4. 반환 메타데이터 형식 (Returned metadata shape)

```json
{
  "id": "<uuid>",
  "image_url": "https://mobbin.com/api/mcp/short/<token>",
  "mobbin_url": "https://mobbin.com/screens/<uuid>",
  "app_name": "<app>",
  "platform": "ios"
}
```

주의: `image_url`은 단축 토큰 URL(만료/인증 가능성). 영구 참조는 `mobbin_url`(screen UUID) 사용.

---

## 5. 결론 (Decision)

- Mobbin MCP는 **검색 + 메타데이터 + inline 이미지**만 제공. **로컬 파일 export 불가.**
- 따라서 이 라운드는 **메타데이터 인덱스 + 수동 캡처 큐(manual capture queue)** 방식으로 진행.
- 스크린샷 파일을 저장했다고 **주장하지 않는다.** `references/mobbin/**`에는 README/메타데이터만 생성.
- MOBBIN_BENCHMARK_PLAN §8 명명 규칙은 **수동 캡처 시 사람이 적용**하도록 큐에 기록.
