import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './login.css'

function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        navigate('/', { replace: true })
      }
    }

    checkSession()
  }, [navigate])

  const handleGitHubLogin = async () => {
    setLoading(true)
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      setErrorMessage('GitHub 로그인에 실패했습니다. Supabase 설정을 확인해주세요.')
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <p className="login-eyebrow">DevSpace</p>
        <h1 id="login-title">개발을 위한 공간에<br />로그인하세요</h1>
        <p className="login-description">
          GitHub 계정으로 로그인하고 워크스페이스에서 협업을 시작하세요.
        </p>

        <button
          type="button"
          className="github-login-button"
          onClick={handleGitHubLogin}
          disabled={loading}
        >
          <svg
            className="github-mark"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.05c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.48.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.6-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
          </svg>
          {loading ? 'GitHub로 이동 중...' : 'GitHub로 로그인'}
        </button>

        {errorMessage && (
          <p className="login-error" role="alert">{errorMessage}</p>
        )}
      </section>
    </main>
  )
}

export default Login
