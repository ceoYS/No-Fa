/*
 * FutureDiaryScreen — 미래일기 tab (v13 screen 53 · future-diary-empty).
 *
 * The v13 Final Handoff bottom nav carries a 미래일기 tab, so the tab exists —
 * but the diary domain itself is P1 in the locked cutline
 * (docs/NOF_V13_P0_IMPLEMENTATION_CUTLINE.md §2: future diary = 구현하지 말 것
 * this round). HONESTY over polish (prime directive): this screen renders the
 * v13 empty-state layout and says plainly that writing is not ready yet. It
 * ships NO fake write CTA, saves nothing, and claims nothing it does not do.
 */
export default function FutureDiaryScreen({ onNavigate }) {
  return (
    <div className="screen v13-empty-screen">
      <div className="v13-appbar">
        <h1 className="v13-appbar-title">미래일기</h1>
        <span className="v13-appbar-right">준비 중</span>
      </div>

      <div className="v13-empty-body">
        <div className="v13-empty-glyph" aria-hidden="true" />
        <h2 className="v13-empty-title">아직 미래일기가 없어요</h2>
        <p className="v13-empty-lead">
          오늘의 절제가 어떤 미래와 연결되는지 적는 공간이에요. 쓰기 기능은 준비 중이라, 지금은 먼저
          오늘 기록으로 하루를 남겨보세요.
        </p>
      </div>

      <div className="v13-ctas">
        <button type="button" className="v13-cta" onClick={() => onNavigate?.('checkin')}>
          오늘 기록 남기기
        </button>
        <p className="hairline-note text-quiet" style={{ textAlign: 'center' }}>
          미래일기 쓰기는 준비 중이에요. 아직 저장되는 것은 없어요.
        </p>
      </div>
    </div>
  );
}
