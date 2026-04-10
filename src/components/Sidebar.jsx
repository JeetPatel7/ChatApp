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
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="#185FA5"/>
            <circle cx="11" cy="16" r="3" fill="white"/>
            <circle cx="18" cy="12" r="3" fill="white" opacity="0.8"/>
            <circle cx="25" cy="16" r="3" fill="white" opacity="0.6"/>
          </svg>
          <span style={styles.logoText}>Pulse</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button style={styles.iconBtn} onClick={() => setShowCreate(true)} title="New room">+</button>
          <button style={styles.iconBtn} onClick={openJoin} title="Discover rooms">🔍</button>
        </div>
      </div>

      {/* Profile strip */}
      <div style={styles.profile}>
        <Avatar name={profile?.display_name || 'User'} color={profile?.avatar_color || '#185FA5'} size={32} online />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.profileName}>{profile?.display_name || 'Loading...'}</div>
          <div style={styles.profileEmail}>{profile?.email}</div>
        </div>
        <button style={styles.iconBtn} onClick={signOut} title="Sign out">↩</button>
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
  return (
    <div onClick={onClick} style={{ ...styles.roomItem, background: active ? 'rgba(24,95,165,0.2)' : 'transparent' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '10px',
        background: active ? 'rgba(24,95,165,0.3)' : 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '15px', flexShrink: 0,
        border: active ? '1px solid rgba(24,95,165,0.5)' : '1px solid rgba(255,255,255,0.06)',
      }}>
        #
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: active ? '500' : '400', color: active ? '#fff' : 'rgba(255,255,255,0.7)' }}>
          {room.name}
        </div>
        {room.description && (
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {room.description}
          </div>
        )}
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
    width: '260px', minWidth: '260px', height: '100%',
    background: '#0e1523', borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    padding: '16px 14px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  logoText: { fontSize: '17px', fontWeight: '600', color: '#fff', letterSpacing: '-0.3px' },
  iconBtn: {
    width: '28px', height: '28px', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', background: 'transparent', color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
  },
  profile: {
    padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  profileName: { fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  profileEmail: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  searchWrap: { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  searchInput: {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '8px', padding: '7px 12px', fontSize: '13px', color: '#fff', outline: 'none',
    fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
  },
  errorBanner: {
    margin: '8px 10px', padding: '10px 12px',
    background: 'rgba(226,75,74,0.12)', border: '1px solid rgba(226,75,74,0.3)',
    borderRadius: '8px', color: '#F09595',
  },
  roomList: { flex: 1, overflowY: 'auto', padding: '6px 8px' },
  roomItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '8px 8px', borderRadius: '10px', cursor: 'pointer',
    transition: 'background 0.15s', marginBottom: '2px',
  },
  emptyMsg: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '32px 16px', lineHeight: '1.6' },
  joinRoomItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: '12px',
  },
}
