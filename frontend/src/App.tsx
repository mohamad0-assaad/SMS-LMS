import { Component, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './layouts/DashboardLayout'
import { DashboardHome } from './pages/DashboardHome'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { AppSection } from './pages/AppSection'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#080808] px-6 text-center font-sans">
          <div className="rounded-2xl border border-rose-500/20 bg-[#111111] p-8 shadow-2xl max-w-lg w-full">
            <h1 className="text-lg font-bold text-rose-400 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-400 mb-4">
              The page crashed. Open DevTools (F12) → Console for details.
            </p>
            <pre className="rounded-xl bg-[#0a0a0a] border border-white/[0.06] p-4 text-left text-xs text-rose-300 overflow-auto max-h-48 mb-4">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack?.split('\n').slice(0, 6).join('\n')}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); window.location.href = '/login' }}
              className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app/:role" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="*" element={<AppSection />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
