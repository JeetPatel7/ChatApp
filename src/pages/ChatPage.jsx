import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'
import { useRooms } from '../hooks/useRooms'

export default function ChatPage() {
  const [activeRoomId, setActiveRoomId] = useState(null)
  const { rooms, loading, error, createRoom, joinRoom, leaveRoom, fetchAllRooms } = useRooms()

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
      background: '#111827',
    }}>
      <Sidebar
        activeRoomId={activeRoomId}
        onSelectRoom={setActiveRoomId}
        rooms={rooms}
        roomsLoading={loading}
        roomsError={error}
        createRoom={createRoom}
        joinRoom={joinRoom}
        fetchAllRooms={fetchAllRooms}
      />
      <ChatArea
        roomId={activeRoomId}
        rooms={rooms}
      />
    </div>
  )
}
