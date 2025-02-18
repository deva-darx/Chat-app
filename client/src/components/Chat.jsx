import { useEffect, useState } from "react";
import { getUsers, getMessages, sendMessage, getCurrentUser } from "../api";
import { io } from "socket.io-client";
import Logout from "./Logout";

const socket = io("http://localhost:5000", {
  withCredentials: true, // ✅ Ensures cookies are sent with requests
  transports: ["websocket", "polling"], // ✅ Ensures better connectivity
});

function Chat() {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await getCurrentUser();
        setCurrentUser(data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await getUsers();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      socket.emit("setup", currentUser._id); // ✅ Send userId when connecting
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentChat) return; // ✅ Prevents unnecessary API call

    const fetchMessages = async () => {
      try {
        const { data } = await getMessages(currentChat._id);
        setMessages(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [currentChat]);

  useEffect(() => {
    socket.on("newMessage", (msg) => {
      if (
        msg.senderId === currentChat?._id ||
        msg.receiverId === currentChat?._id
      ) {
        setMessages((prev) => [...prev, msg]); // ✅ Ensures React re-renders
      }
    });

    return () => socket.off("newMessage");
  }, [currentChat, setMessages]); // ✅ Added setMessages

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      const { data } = await sendMessage(currentChat._id, message);
      setMessages((prev) => [...prev, data]); // ✅ Update UI
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="flex h-screen">
      {/* User List */}
      <div className="w-1/4 p-4 bg-gray-800 text-white">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        {users.map((user) => (
          <p
            key={user._id}
            onClick={() => setCurrentChat(user)}
            className={`p-2 rounded-md cursor-pointer ${
              currentChat?._id === user._id
                ? "bg-blue-500"
                : "hover:bg-gray-700"
            }`}
          >
            {user.fullName}
          </p>
        ))}
        <Logout />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-gray-100">
        <div className="p-4 bg-white shadow-md">
          <h2 className="text-xl font-semibold">
            {currentChat
              ? `Chat with ${currentChat.fullName}`
              : "Select a User"}
          </h2>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 mb-2 rounded-lg max-w-xs ${
                msg.senderId === currentUser?._id
                  ? "bg-blue-500 text-white ml-auto"
                  : "bg-gray-300 text-black"
              }`}
            >
              <strong>
                {msg.senderId === currentUser?._id
                  ? "You"
                  : currentChat?.fullName}
              </strong>
              <p>{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Message Input Box */}
        {currentChat && (
          <div className="p-4 bg-white shadow-md flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2 text-white bg-blue-500 rounded-r-md hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
