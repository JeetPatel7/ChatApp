import { useState } from 'react'
import Avatar from './Avatar'
import { useAuth } from '../lib/AuthContext'

export default function Sidebar({ activeRoomId, onSelectRoom, rooms = [], roomsLoading, roomsError, createRoom, joinRoom, fetchAllRooms }) {
  const { profile, signOut } = useAuth()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [allRooms, setAllRooms] = useState([])
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate() {
    if (!newRoomName.trim()) return
    setCreating(true)
    try {
      const { room } = await createRoom(newRoomName, newRoomDesc)
      if (room) { onSelectRoom(room.id); setShowCreate(false); setNewRoomName(''); setNewRoomDesc('') }
    } catch (err) {
      console.error('Create room error:', err)
    }
    setCreating(false)
  }

  async function openJoin() {
    try {
      const all = await fetchAllRooms()
      const myIds = rooms.map(r => r.id)
      setAllRooms(all.filter(r => !myIds.includes(r.id)))
      setShowJoin(true)
    } catch (err) {
      console.error('Open join error:', err)
      setAllRooms([])
      setShowJoin(true)
    }
  }

  return (
    <div style={styles.sidebar}>
      {/* Header (WhatsApp style top bar) */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Avatar name={profile?.display_name || 'User'} color={profile?.avatar_color || '#00a884'} size={40} online={false} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#e9edef' }}>{profile?.display_name || 'Loading...'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.iconBtn} onClick={openJoin} title="Discover rooms">
            <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="#aebac1"><path d="M12,7a2,2,0,1,0-2-2A2,2,0,0,0,12,7Zm0,10a2,2,0,1,0,2,2A2,2,0,0,0,12,17Zm0-7a2,2,0,1,0,2,2A2,2,0,0,0,12,10Z"></path></svg>
          </button>
          <button style={styles.iconBtn} onClick={() => setShowCreate(true)} title="New chat">
            <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="#aebac1"><path d="M19.005,3.175H4.674C3.642,3.175,3,3.789,3,4.821V21.02l3.544-3.514h12.462c1.033,0,2.064-1.06,2.064-2.093V4.821C21.068,3.789,20.037,3.175,19.005,3.175Z"></path></svg>
          </button>
          <button style={styles.iconBtn} onClick={signOut} title="Sign out">
             <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="#aebac1"><path d="M16 13v-2H7V8l-5 4 5 4v-3z M20 3H9c-1.1 0-2 .9-2 2v3h2V5h11v14H9v-3H7v3c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <input
          style={styles.searchInput}
          placeholder="Search rooms..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Error banner */}
      {roomsError && (
        <div style={styles.errorBanner}>
          <div style={{ fontSize: '13px', fontWeight: '500' }}>⚠ Database not set up</div>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
            Run the SQL setup from supabase.js in your Supabase SQL Editor to create tables.
          </div>
        </div>
      )}

      {/* Rooms */}
      <div style={styles.roomList}>
        {roomsLoading ? (
          <div style={styles.emptyMsg}>Loading rooms...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyMsg}>
            {rooms.length === 0 ? 'Create or join a room to start chatting!' : 'No rooms match your search.'}
          </div>
        ) : (
          filtered.map(room => (
            <RoomItem
              key={room.id}
              room={room}
              active={room.id === activeRoomId}
              onClick={() => onSelectRoom(room.id)}
            />
          ))
        )}
      </div>

      {/* Create Room Modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Create a room">
          <input
            style={modalInput}
            placeholder="Room name (e.g. general, team-frontend)"
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <input
            style={{ ...modalInput, marginTop: '10px' }}
            placeholder="Description (optional)"
            value={newRoomDesc}
            onChange={e => setNewRoomDesc(e.target.value)}
          />
          <button style={modalBtn} onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create room'}
          </button>
        </Modal>
      )}

      {/* Join Room Modal */}
      {showJoin && (
        <Modal onClose={() => setShowJoin(false)} title="Discover rooms">
          {allRooms.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
              No other rooms available. Create one!
            </p>
          ) : (
            allRooms.map(room => (
              <div key={room.id} style={styles.joinRoomItem}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}># {room.name}</div>
                  {room.description && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{room.description}</div>}
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                    {room.room_members?.[0]?.count || 0} members
                  </div>
                </div>
                <button
                  style={{ ...modalBtn, padding: '6px 14px', marginTop: 0, fontSize: '13px' }}
                  onClick={async () => {
                    await joinRoom(room.id)
                    onSelectRoom(room.id)
                    setShowJoin(false)
                  }}
                >
                  Join
                </button>
              </div>
            ))
          )}
        </Modal>
      )}
    </div>
  )
}

function RoomItem({ room, active, onClick }) {
  // Use first 2 letters for avatar fallback
  const char = room.name.substring(0, 2).toUpperCase()
  return (
    <div onClick={onClick} style={{ ...styles.roomItem, background: active ? '#2a3942' : 'transparent' }}>
      <div style={{
        width: 49, height: 49, borderRadius: '50%',
        background: '#667781', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', color: '#fff', flexShrink: 0,
      }}>
        {char}
      </div>
      <div style={styles.roomItemContent}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '17px', color: '#e9edef' }}>
            {room.name}
          </div>
          <div style={{ fontSize: '12px', color: '#8696a0' }}>
            {/* Can put timestamp here later */}
          </div>
        </div>
        <div style={{ fontSize: '14px', color: '#8696a0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {room.description || 'Welcome to the room!'}
        </div>
      </div>
    </div>
  )
}

function Modal({ children, onClose, title }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: '20px',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px',
        maxHeight: '70vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: '600', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const modalInput = {
  width: '100%', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  padding: '10px 14px', fontSize: '14px', color: '#fff', outline: 'none',
  fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
}
const modalBtn = {
  width: '100%', background: '#185FA5', color: '#fff', border: 'none',
  borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: '500',
  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  marginTop: '14px',
}

const styles = {
  sidebar: {
    width: '30%', minWidth: '300px', maxWidth: '420px', height: '100%',
    background: '#111b21', borderRight: '1px solid #222d34',
    display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  header: {
    padding: '10px 16px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', background: '#202c33',
    minHeight: '59px',
  },
  iconBtn: {
    padding: '8px', background: 'transparent', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: { 
    padding: '7px 12px', background: '#111b21',
    borderBottom: '1px solid #222d34'
  },
  searchInput: {
    width: '100%', background: '#202c33', border: 'none',
    borderRadius: '8px', padding: '9px 12px 9px 32px', fontSize: '15px', color: '#d1d7db', outline: 'none',
    fontFamily: "inherit", boxSizing: 'border-box',
  },
  errorBanner: {
    margin: '8px 10px', padding: '10px 12px',
    background: '#2a3942', borderRadius: '8px', color: '#ef697a',
  },
  roomList: { flex: 1, overflowY: 'auto', background: '#111b21' },
  roomItem: {
    display: 'flex', alignItems: 'center', gap: '15px',
    padding: '0 12px 0 12px', cursor: 'pointer',
  },
  roomItemContent: {
    flex: 1, minWidth: 0, padding: '12px 0', borderBottom: '1px solid #222d34',
    display: 'flex', flexDirection: 'column', gap: '2px'
  },
  emptyMsg: { fontSize: '14px', color: '#8696a0', textAlign: 'center', padding: '32px 16px', lineHeight: '1.6' },
  joinRoomItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 0', borderBottom: '1px solid #222d34', gap: '12px',
  },
}
