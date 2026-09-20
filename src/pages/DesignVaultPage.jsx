import { useState } from 'react'
import { renderElementsToCanvas } from '../engine/murrini/rasterize'
import { useDesignVault } from '../hooks/useDesignVault'

const THUMBNAIL_SIZE = 160

function NotConfiguredNotice() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <h2 className="text-sm font-medium text-neutral-100">
        Firebase isn't configured yet
      </h2>
      <p className="text-sm text-neutral-400">
        The Design Vault needs a real Firebase project (Firestore + Auth)
        to save and load designs. This app never crashes without one — it
        just skips initialization and shows this message instead.
      </p>
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-neutral-400">
        <li>
          Create a project at{' '}
          <a
            href="https://console.firebase.google.com/"
            target="_blank"
            rel="noreferrer"
            className="text-purple-400 hover:underline"
          >
            console.firebase.google.com
          </a>
          , then enable Firestore and Anonymous Authentication.
        </li>
        <li>
          Copy <code className="rounded bg-neutral-800 px-1">.env.example</code>{' '}
          to <code className="rounded bg-neutral-800 px-1">.env.local</code>{' '}
          and fill in your project's web app config values.
        </li>
        <li>Restart the dev server so the new env vars are picked up.</li>
      </ol>
    </div>
  )
}

export function DesignVaultPage({ design, onLoadDesign }) {
  const { isConfigured, user, savedDesigns, status, error, saveDesign, deleteDesign } =
    useDesignVault()
  const [designName, setDesignName] = useState('')

  const handleSave = (event) => {
    event.preventDefault()
    if (!designName.trim()) return

    // Thumbnail is the full pattern-repeated cross-section (what the
    // editor actually shows), not just the base cell — a thumbnail of an
    // unrepeated single shape wouldn't represent the saved design well.
    const thumbnailCanvas = renderElementsToCanvas(
      design.repeatedElements,
      design.canvas,
      undefined,
      THUMBNAIL_SIZE,
    )

    saveDesign(designName.trim(), {
      canvas: design.canvas,
      elements: design.elements,
      pattern: design.pattern,
      extrusion: design.extrusion,
      thumbnailUrl: thumbnailCanvas.toDataURL('image/png'),
    })
    setDesignName('')
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="max-w-xl text-center">
        <h1 className="text-2xl font-medium text-neutral-100">Design Vault</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Save the pattern you're working on and load it again later.
        </p>
      </div>

      {!isConfigured ? (
        <NotConfiguredNotice />
      ) : (
        <div className="flex w-full max-w-xl flex-col gap-6">
          <form
            onSubmit={handleSave}
            className="flex gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-4"
          >
            <input
              type="text"
              value={designName}
              onChange={(event) => setDesignName(event.target.value)}
              placeholder="Name this design"
              disabled={!user}
              className="flex-1 rounded border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-600"
            />
            <button
              type="submit"
              disabled={!user || !designName.trim() || status === 'saving'}
              className="rounded bg-purple-500 px-4 py-1.5 text-sm text-white transition-colors hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'saving' ? 'Saving…' : 'Save current design'}
            </button>
          </form>

          {error && (
            <p className="rounded border border-red-900/50 bg-red-950/30 p-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {savedDesigns.length === 0 ? (
              <p className="text-sm text-neutral-500">No saved designs yet.</p>
            ) : (
              savedDesigns.map((saved) => (
                <div
                  key={saved.id}
                  className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-3"
                >
                  {saved.thumbnailUrl ? (
                    <img
                      src={saved.thumbnailUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded border border-neutral-800 object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded border border-neutral-800 bg-neutral-950" />
                  )}
                  <span className="flex-1 text-sm text-neutral-200">{saved.name}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onLoadDesign(saved)}
                      className="rounded bg-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-700"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDesign(saved.id)}
                      className="rounded bg-neutral-800 px-3 py-1 text-xs text-red-300 hover:bg-red-950/50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
