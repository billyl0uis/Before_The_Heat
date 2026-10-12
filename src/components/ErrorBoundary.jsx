import { Component } from 'react'

// Class component because React has no hook equivalent of
// componentDidCatch/getDerivedStateFromError — this is the only way to
// stop an uncaught render/effect error from unmounting the whole tree.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Before The Heat crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      // Work is autosaved as it's made, so neither way out loses it.
      return (
        <div role="alert" className="mx-auto my-12 flex max-w-xl flex-col items-start gap-3 rounded-xl border border-line bg-panel p-6">
          <h2 className="text-lg font-bold text-ink">This part of the app stopped working</h2>
          <p className="text-base leading-relaxed text-ink-soft">
            Your design is saved in this browser, so nothing is lost. Try this section again, or reload the page. If it
            keeps happening on the 3D views, this browser or device may not support WebGL.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="min-h-[44px] rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] rounded-lg bg-raise px-4 py-2 font-semibold text-ink"
            >
              Reload the page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
