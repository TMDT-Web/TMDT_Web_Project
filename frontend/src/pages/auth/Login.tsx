import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to home and trigger auth modal via state
    navigate('/', { state: { openAuthModal: true, authTab: 'login' }, replace: true })
  }, [navigate])

  return null
}
