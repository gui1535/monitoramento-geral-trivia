import { useCallback, useEffect, useRef, useState } from 'react'
import Peer from 'peerjs'
import { isValidRoomCode, normalizeRoomCode, toPeerId } from './demoSyncMessages'

export const DEMO_PEER_ROLE = {
  HOST: 'host',
  GUEST: 'guest',
}

export const DEMO_PEER_STATUS = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
}

function getPeerErrorMessage(error) {
  if (!error) return 'Erro de conexão.'
  if (error.type === 'unavailable-id') {
    return 'Este código já está em uso. Gere outro ou entre como controle.'
  }
  if (error.type === 'peer-unavailable') {
    return 'Sala não encontrada. Confira o código no computador.'
  }
  return error.message || 'Erro de conexão.'
}

export function useDemoPeerSync({ onMessage } = {}) {
  const [role, setRole] = useState(null)
  const [roomCode, setRoomCode] = useState('')
  const [status, setStatus] = useState(DEMO_PEER_STATUS.IDLE)
  const [error, setError] = useState(null)
  const [guestCount, setGuestCount] = useState(0)

  const peerRef = useRef(null)
  const guestConnRef = useRef(null)
  const hostConnsRef = useRef(new Set())
  const onMessageRef = useRef(onMessage)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const cleanup = useCallback(() => {
    hostConnsRef.current.forEach((conn) => {
      try {
        conn.close()
      } catch {
        // ignore
      }
    })
    hostConnsRef.current.clear()

    if (guestConnRef.current) {
      try {
        guestConnRef.current.close()
      } catch {
        // ignore
      }
      guestConnRef.current = null
    }

    if (peerRef.current) {
      try {
        peerRef.current.destroy()
      } catch {
        // ignore
      }
      peerRef.current = null
    }

    setGuestCount(0)
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  const disconnect = useCallback(() => {
    cleanup()
    setRole(null)
    setStatus(DEMO_PEER_STATUS.IDLE)
    setError(null)
  }, [cleanup])

  const handleIncomingData = useCallback((data) => {
    onMessageRef.current?.(data)
  }, [])

  const trackHostConnection = useCallback(
    (conn) => {
      hostConnsRef.current.add(conn)
      setGuestCount(hostConnsRef.current.size)
      setStatus(DEMO_PEER_STATUS.CONNECTED)

      conn.on('data', handleIncomingData)
      conn.on('close', () => {
        hostConnsRef.current.delete(conn)
        setGuestCount(hostConnsRef.current.size)
        if (hostConnsRef.current.size === 0) {
          setStatus(DEMO_PEER_STATUS.CONNECTING)
        }
      })
    },
    [handleIncomingData],
  )

  const connectAsHost = useCallback(
    (code) => {
      const normalized = normalizeRoomCode(code)
      if (!isValidRoomCode(normalized)) {
        setError('Use um código com pelo menos 4 letras ou números.')
        setStatus(DEMO_PEER_STATUS.ERROR)
        return
      }

      disconnect()
      setRole(DEMO_PEER_ROLE.HOST)
      setRoomCode(normalized)
      setStatus(DEMO_PEER_STATUS.CONNECTING)
      setError(null)

      const peer = new Peer(toPeerId(normalized), { debug: 0 })
      peerRef.current = peer

      peer.on('open', () => {
        setStatus(DEMO_PEER_STATUS.CONNECTING)
      })

      peer.on('connection', (conn) => {
        conn.on('open', () => trackHostConnection(conn))
      })

      peer.on('error', (peerError) => {
        setError(getPeerErrorMessage(peerError))
        setStatus(DEMO_PEER_STATUS.ERROR)
      })
    },
    [disconnect, trackHostConnection],
  )

  const connectAsGuest = useCallback(
    (code) => {
      const normalized = normalizeRoomCode(code)
      if (!isValidRoomCode(normalized)) {
        setError('Use um código com pelo menos 4 letras ou números.')
        setStatus(DEMO_PEER_STATUS.ERROR)
        return
      }

      disconnect()
      setRole(DEMO_PEER_ROLE.GUEST)
      setRoomCode(normalized)
      setStatus(DEMO_PEER_STATUS.CONNECTING)
      setError(null)

      const peer = new Peer({ debug: 0 })
      peerRef.current = peer

      peer.on('open', () => {
        const conn = peer.connect(toPeerId(normalized), { reliable: true })
        guestConnRef.current = conn

        conn.on('open', () => {
          setStatus(DEMO_PEER_STATUS.CONNECTED)
        })

        conn.on('close', () => {
          setStatus(DEMO_PEER_STATUS.ERROR)
          setError('Conexão com o computador foi encerrada.')
        })

        conn.on('error', (connError) => {
          setError(getPeerErrorMessage(connError))
          setStatus(DEMO_PEER_STATUS.ERROR)
        })
      })

      peer.on('error', (peerError) => {
        setError(getPeerErrorMessage(peerError))
        setStatus(DEMO_PEER_STATUS.ERROR)
      })
    },
    [disconnect],
  )

  const send = useCallback(
    (message) => {
      if (role !== DEMO_PEER_ROLE.GUEST) return false
      const conn = guestConnRef.current
      if (!conn?.open) return false

      conn.send(message)
      return true
    },
    [role],
  )

  const canSend = role === DEMO_PEER_ROLE.GUEST && status === DEMO_PEER_STATUS.CONNECTED

  return {
    role,
    roomCode,
    status,
    error,
    guestCount,
    canSend,
    isConnected: status === DEMO_PEER_STATUS.CONNECTED,
    isHost: role === DEMO_PEER_ROLE.HOST,
    isGuest: role === DEMO_PEER_ROLE.GUEST,
    setRoomCode,
    connectAsHost,
    connectAsGuest,
    disconnect,
    send,
  }
}
