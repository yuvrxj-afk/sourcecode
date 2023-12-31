/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react'
import User from '../components/User'
import Editor from '../components/Editor'
import { initSocket } from '../socket'
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom'
import ACTIONS from '../actions'
import { toast } from 'react-hot-toast'
// import { reactNavigator } from ''

const EditorPage = () => {
  const socketRef = useRef(null);
  const location = useLocation();
  const reactNavigator = useNavigate();
  const { roomId } = useParams();
  const [clients, setClients] = useState([])
  const codeRef = useRef(null);

  function copyRoomId() {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard')
  }

  function exitRoom() {
    socketRef.current.disconnect();
    reactNavigator('/')
  }

  // console.log('roomId', roomId);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) => handleError(err));
      socketRef.current.on('connect_failed', (err) => handleError(err));

      function handleError(err) {
        console.log('socket error', err);
        toast.error('Something went wrong, please try again later');
        reactNavigator('/')
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username
      })
      // Listening for JOINED event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room`)
            // console.log(`${username} joined the room`);
          }
          setClients(clients)
          socketRef.current.emit(ACTIONS.SYNC_CODE, { code: codeRef.current , socketId});
        }
    )

  // Listening for DISCONNECTED event
  socketRef.current.on(
    ACTIONS.DISCONNECTED,
    ({ socketId, username }) => {
      toast.success(`${username} left the room`)
      setClients((prev) => {
        return prev.filter((client) => client.socketId !== socketId)
      })
    })
}
init();
return () => {
  socketRef.current.disconnect();
  socketRef.current.off(ACTIONS.JOINED);
  socketRef.current.off(ACTIONS.DISCONNECTED);
}
  }, [])




if (!location.state) {
  return <Navigate to='/' />
}

return (
  <div className="main-Wrapper">
    <div className="sidebar">
      <div className="sidebar-body">
        <div className="logo">
          <img src="/logo.png" className="logoImage" alt="" />
        </div>
        <div className="online">
          <h3>CONNECTED</h3>
          <img src="/online.png" alt="" />
        </div>
        <div className="users-list">
          {
            clients.map((client) => (
              <User
                key={client.socketId}
                username={client.username}
              />
            ))
          }
        </div>
      </div>
      <button className="btn copy" onClick={copyRoomId}>
        <img src="/copy.png" alt="" />
        <h4>ROOM ID</h4>
      </button>
      <button className="btn exit" onClick={exitRoom}>
        <img src="/exit.png" alt="" />
        <h4>EXIT</h4>
      </button>
    </div>
    <div className="editor-Wrapper"><Editor socketRef={socketRef}
      onCodeChange={(code) => {
        codeRef.current = code;
      }}
      roomId={roomId} /></div>
  </div>
)
}

export default EditorPage