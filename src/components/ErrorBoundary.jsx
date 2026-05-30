import { Component } from 'react';

/*
 * ErrorBoundary — calm, honest crash fallback (commercial hardening).
 *
 * A render throw must never blank the device frame into a white screen. React
 * error boundaries must be class components, so this stays a small class. The
 * fallback copy is gentle (no shame / no blame), promises nothing it can't keep
 * (the prototype is in-memory, so it does NOT claim records survive a reload),
 * and offers a single 다시 불러오기 action. The thrown error is logged to the
 * console in dev only — never surfaced to the user.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] render error:', error, info);
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="app-shell">
        <div className="device-frame">
          <div className="screen" style={{ justifyContent: 'center', minHeight: '100%' }}>
            <section className="card">
              <span className="card-label">잠시 문제가 생겼어요</span>
              <p className="hairline-note">
                잠깐의 오류일 수 있어요. 다시 불러오면 처음 화면부터 차분히 다시 시작할 수 있어요.
              </p>
              <button type="button" className="btn btn-primary btn-block" onClick={this.handleReload}>
                다시 불러오기
              </button>
            </section>
          </div>
        </div>
      </div>
    );
  }
}
