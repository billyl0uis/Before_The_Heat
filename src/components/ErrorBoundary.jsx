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
      return (
        <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-6 text-center">
          <h2 className="text-sm font-medium text-neutral-100">
            Something went wrong
          </h2>
          <p className="text-sm text-neutral-400">
            This section hit an error it couldn't recover from. Try
            reloading the page — if it keeps happening, it may be a browser
            or device limitation (for example, no WebGL support).
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mx-auto rounded bg-purple-500 px-4 py-1.5 text-sm text-white hover:bg-purple-400"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
