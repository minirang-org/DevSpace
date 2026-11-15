import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import "../css/workspace.css"

function Workspace() {
  const navigate = useNavigate()
  const [currentUserId, setCurrentUserId] = useState(import.meta.env.VITE_DEV_USER_ID || '')
  const [myWorkspaces, setMyWorkspaces] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadSessionUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (data?.user?.id) {
        setCurrentUserId(data.user.id)
      } else {
        setLoading(false)
      }
    }

    loadSessionUser()
  }, [])

  const fetchMyWorkspaces = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        workspaces (
          id,
          name,
          icon_name,
          invite_code
        )
      `)
      .eq('user_id', currentUserId)

    if (error) {
      console.error('내 워크스페이스 로딩 에러:', error.message)
      setErrorMessage('워크스페이스 목록을 불러오지 못했습니다.')
      setMyWorkspaces([])
    } else {
      const list = (data || [])
        .filter((item) => item.workspaces)
        .map((item) => ({
          ...item.workspaces,
          role: item.role,
        }))

      setMyWorkspaces(list)
    }

    setLoading(false)
  }, [currentUserId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMyWorkspaces()
  }, [fetchMyWorkspaces])

  const filteredWorkspaces = myWorkspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  )

  const createInviteCode = () =>
    `dev-${Math.random().toString(36).slice(2, 8)}`

  const handleCreateWorkspace = async (event) => {
    event.preventDefault()

    const name = workspaceName.trim()
    if (!currentUserId || !name) return

    setSubmitting(true)
    setErrorMessage('')

    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name,
        owner_id: currentUserId,
        icon_name: name.slice(0, 2).toUpperCase(),
        invite_code: createInviteCode(),
      })
      .select('id')
      .single()

    if (workspaceError) {
      console.error('워크스페이스 생성 에러:', workspaceError.message)
      setErrorMessage('워크스페이스를 만들지 못했습니다.')
      setSubmitting(false)
      return
    }

    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: currentUserId,
        role: 'owner',
      })

    if (memberError) {
      console.error('워크스페이스 멤버 등록 에러:', memberError.message)
      setErrorMessage('워크스페이스는 생성됐지만 멤버 등록에 실패했습니다.')
    } else {
      setWorkspaceName('')
      await fetchMyWorkspaces()
    }

    setSubmitting(false)
  }

  const handleJoinWorkspace = async (event) => {
    event.preventDefault()

    const code = inviteCode.trim()
    if (!currentUserId || !code) return

    setSubmitting(true)
    setErrorMessage('')

    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('invite_code', code)
      .single()

    if (workspaceError || !workspace) {
      setErrorMessage('초대 코드와 일치하는 워크스페이스를 찾지 못했습니다.')
      setSubmitting(false)
      return
    }

    const { error: memberError } = await supabase
      .from('workspace_members')
      .upsert({
        workspace_id: workspace.id,
        user_id: currentUserId,
        role: 'member',
      }, {
        onConflict: 'workspace_id,user_id',
      })

    if (memberError) {
      console.error('워크스페이스 참여 에러:', memberError.message)
      setErrorMessage('워크스페이스에 참여하지 못했습니다.')
    } else {
      setInviteCode('')
      await fetchMyWorkspaces()
    }

    setSubmitting(false)
  }

  return (
    <div className="workspace-lobby-container">
        <div className="lobby-content">
        <header className="lobby-header">
            <p className="eyebrow">DevSpace</p>
            <h1>Welcome back, Developer 👋</h1>
            <p>참여할 워크스페이스를 선택하거나 새로운 공간을 만들어보세요.</p>
        </header>

        <div className="lobby-grid">
            {/* 왼쪽: 검색창 + 워크스페이스 목록 영역 */}
            <section className="my-workspaces">
            <h2>내 워크스페이스</h2>

            {/* 검색창 */}
            <div className="search-box">
                <input 
                type="text" 
                placeholder="워크스페이스 이름 검색..." 
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                />
            </div>
            
            {/* 워크스페이스 목록 */}
            <div className="workspace-card-list scrollable">
                {loading ? (
                  <p className="system-text">로딩 중...</p>
                ) : errorMessage ? (
                  <p className="system-text">{errorMessage}</p>
                ) : !currentUserId ? (
                  <div className="empty-state">
                    <p>사용자 정보를 기다리고 있습니다.</p>
                    <small>로그인 기능이 연결되면 내 워크스페이스가 표시됩니다.</small>
                  </div>
                ) : filteredWorkspaces.length > 0 ? (
                  filteredWorkspaces.map((ws) => (
                    <div key={ws.id} className="workspace-card">
                      <div className="ws-icon">
                        {ws.icon_name || ws.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="ws-info">
                        <h3>{ws.name}</h3>
                        <span>{ws.role === 'owner' ? '방장' : '멤버'}</span>
                      </div>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => navigate('/app')}
                      >
                        입장
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>참여 중인 워크스페이스가 없습니다.</p>
                    <small>오른쪽 메뉴에서 코드로 참여하거나 새로 만들어보세요!</small>
                  </div>
                )}
            </div>
            </section>

            {/* 오른쪽: 워크스페이스 참여 / 생성 액션 */}
            <aside className="lobby-actions">
            {/* 참여하기 폼 */}
            <div className="action-card">
                <h3>🤝 초대 코드로 참여하기</h3>
                <p>팀원에게 받은 초대 코드를 입력하세요.</p>
                <form className="input-group" onSubmit={handleJoinWorkspace}>
                  <input
                    type="text"
                    placeholder="예: dev-xyz123"
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                    disabled={!currentUserId || submitting}
                  />
                  <button className="primary-btn" disabled={!currentUserId || submitting}>
                    참여
                  </button>
                </form>
            </div>

            {/* 생성하기 폼 */}
            <div className="action-card alt">
                <h3>🚀 새 워크스페이스 만들기</h3>
                <p>새로운 프로젝트나 팀을 위한 공간을 개설합니다.</p>
                <form className="input-group vertical" onSubmit={handleCreateWorkspace}>
                  <input
                    type="text"
                    placeholder="워크스페이스 이름"
                    value={workspaceName}
                    onChange={(event) => setWorkspaceName(event.target.value)}
                    disabled={!currentUserId || submitting}
                  />
                  <button className="primary-btn outline" disabled={!currentUserId || submitting}>
                    개설하기
                  </button>
                </form>
            </div>
            </aside>
        </div>
        </div>
    </div>
    )
}

export default Workspace
