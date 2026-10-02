import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import Workspace from './pages/Workspace.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<ProtectedRoute><App /></ProtectedRoute>} />
        <Route path="/workspace" element={<ProtectedRoute><Navigate to="/" replace /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
