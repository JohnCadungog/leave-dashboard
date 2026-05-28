import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const rootEl = document.getElementById('root')!

// Check env vars before importing anything that calls createClient,
// so a missing .env.local shows a readable error instead of a blank page.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  rootEl.innerHTML = `
    <div style="
      min-height:100vh;display:flex;align-items:center;justify-content:center;
      font-family:system-ui,sans-serif;background:#0f172a;color:#f1f5f9;padding:2rem;
    ">
      <div style="max-width:480px;text-align:center">
        <div style="font-size:2.5rem;margin-bottom:1rem">⚠️</div>
        <h1 style="font-size:1.25rem;font-weight:700;margin-bottom:.75rem;color:#f87171">
          Missing environment variables
        </h1>
        <p style="color:#94a3b8;margin-bottom:1.5rem;line-height:1.6">
          The app needs a <code style="background:#1e293b;padding:.15rem .4rem;border-radius:.25rem">.env.local</code>
          file with your Supabase credentials before it can start.
        </p>
        <ol style="text-align:left;color:#94a3b8;line-height:2;margin-bottom:1.5rem">
          <li>Copy <code style="background:#1e293b;padding:.15rem .4rem;border-radius:.25rem">.env.example</code>
              → <code style="background:#1e293b;padding:.15rem .4rem;border-radius:.25rem">.env.local</code></li>
          <li>Fill in <code style="background:#1e293b;padding:.15rem .4rem;border-radius:.25rem">VITE_SUPABASE_URL</code></li>
          <li>Fill in <code style="background:#1e293b;padding:.15rem .4rem;border-radius:.25rem">VITE_SUPABASE_ANON_KEY</code></li>
          <li>Restart the dev server (<code style="background:#1e293b;padding:.15rem .4rem;border-radius:.25rem">npm run dev</code>)</li>
        </ol>
        <p style="color:#64748b;font-size:.875rem">
          Find your keys in the Supabase dashboard → Project Settings → API.
        </p>
      </div>
    </div>
  `
} else {
  // Env vars present — dynamically import App so the Supabase client
  // is only instantiated after we've confirmed the vars exist.
  import('./App.tsx').then(({ default: App }) => {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  })
}
