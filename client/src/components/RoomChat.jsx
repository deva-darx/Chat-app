import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getMessages, getCurrentUser, getUserById } from "../api";
import Logout from "./Logout";
import { useNavigate } from "react-router-dom";

const socket = io("http://localhost:5000", { withCredentials: true });

function RoomChat() {
  const [room, setRoom] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(
    sessionStorage.getItem("joinedRoom") || ""
  );
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [usernames, setUsernames] = useState({});

  const navigate = useNavigate();

  // ✅ Fetch authenticated user
  useEffect(() => {
    async function fetchUser() {
      try {
        const { data } = await getCurrentUser();
        setUserId(data._id);
        socket.emit("setup", data._id); // Setup socket with user ID
      } catch (error) {
        console.error("User not authenticated:", error);
        navigate("/login");
      }
    }
    fetchUser();
  }, []);

  // ✅ Fetch usernames in the room
  useEffect(() => {
    async function fetchUsernames() {
      const newUsernames = { ...usernames };

      for (const userId of users) {
        if (!userId || newUsernames[userId]) continue;

        try {
          const { data } = await getUserById(userId);
          if (data?.fullName) {
            newUsernames[userId] = data.fullName;
          }
        } catch (error) {
          console.error("Error fetching username for ID:", error);
        }
      }

      setUsernames((prev) => ({ ...prev, ...newUsernames }));
    }

    if (users.length > 0) {
      fetchUsernames();
    }
  }, [users]);

  // ✅ Fetch messages when user joins a room (even after refresh)
  useEffect(() => {
    if (userId && joinedRoom) {
      socket.emit("joinRoom", { room: joinedRoom, userId });
      if (messages.length === 0) {
        fetchMessages(joinedRoom);
      }
    }
  }, [userId, joinedRoom]);

  useEffect(() => {
    socket.on("roomMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("newMessage", (msg) => {
      if (msg.receiverId === userId || msg.senderId === userId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("roomUsers", (users) => {
      setUsers(users);
    });

    return () => {
      socket.off("roomMessage");
      socket.off("newMessage");
      socket.off("roomUsers");
    };
  }, [userId]);

  // ✅ Fetch messages from backend (persist after refresh)
  const fetchMessages = async (roomName) => {
    try {
      const { data } = await getMessages(roomName);
      setMessages(data);
    } catch (err) {
      console.error("Error fetching room messages:", err);
    }
  };

  const handleJoinRoom = () => {
    if (!userId) {
      console.error("User ID is missing, cannot join room.");
      return;
    }

    if (room.trim()) {
      const normalizedRoom = room.toLowerCase();
      socket.emit("joinRoom", { room: normalizedRoom, userId });
      setJoinedRoom(normalizedRoom);
      sessionStorage.setItem("joinedRoom", normalizedRoom);
      fetchMessages(normalizedRoom);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      if (joinedRoom) {
        const msgData = { room: joinedRoom, text: message, senderId: userId };
        socket.emit("sendRoomMessage", msgData);
      } else {
        const msgData = {
          receiverId: selectedUserId,
          text: message,
          senderId: userId,
        };
        socket.emit("sendPrivateMessage", msgData);
      }
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100">
      <h2 className="text-2xl font-bold mt-6">Room Chat</h2>
      <Logout />

      <div className="mt-4 flex space-x-2">
        <input
          type="text"
          placeholder="Enter room name"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none"
        />
        <button
          onClick={handleJoinRoom}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Join Room
        </button>
      </div>

      {joinedRoom && (
        <>
          <h3 className="text-lg font-semibold mt-4">Room: {joinedRoom}</h3>
          <div className="bg-white shadow-md p-4 rounded-lg mt-2">
            <h4 className="font-semibold">Users in Room:</h4>
            <ul>
              {users.map((id, i) => (
                <li key={i} className="text-gray-700">
                  {id === userId ? "You" : usernames[id] || `Fetching...`}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="mt-4 w-96 bg-white shadow-md rounded-lg p-4 h-80 overflow-y-auto flex flex-col space-y-2">
        {messages.map((msg, i) => {
          const isCurrentUser = String(msg.senderId) === String(userId);
          return (
            <div
              key={i}
              className={`p-2 rounded-lg max-w-[70%] ${
                isCurrentUser
                  ? "bg-blue-500 text-white self-end ml-auto"
                  : "bg-gray-300 text-black self-start"
              }`}
            >
              <strong>{isCurrentUser ? "You" : `User ${msg.senderId}`}</strong>:{" "}
              {msg.text}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex space-x-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="px-3 py-2 border rounded-lg w-64 focus:outline-none"
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default RoomChat;
