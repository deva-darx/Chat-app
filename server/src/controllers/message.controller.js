import User from "../models/User.model.js";
import Message from "../models/message.model.js";
import {getReceiverSocketId, io} from "../utils/socket.js";


// Function to get all users except the logged-in user
export const getUsers = async(req,res) =>{
    try {
        // Retrieve the logged-in user's ID from the request object
        const loggedInUserId = req.user._id  

        // Find all users except the logged-in user, excluding the password field
        const filteredUsers = await User.find({_id: {$ne:loggedInUserId}}).select("-password")

        res.status(200).json(filteredUsers)
   } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Internal Server Error'});   }
}

// Function to get messages between the logged-in user and another user
export const getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const myId = req.user._id;

        let messages;
        if (id.startsWith("room_")) {
            const normalizedRoom = id.toLowerCase();
            messages = await Message.find({ room: normalizedRoom }).sort({ createdAt: 1 });
        } else {
            messages = await Message.find({
                $or: [
                    { senderId: myId, receiverId: id },
                    { senderId: id, receiverId: myId },
                ],
            }).sort({ createdAt: 1 }).lean();
        }

        // console.log("Fetched messages:", messages);
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


// Function to send messages between the logged-in user and another user
export const sendMessages = async (req, res) => {
    try {
        const { text } = req.body;
        let { id } = req.params; // Can be a userId or a room name
        const senderId = req.user._id;

        if (!text.trim()) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }
        
        let newMessage;
        if (id.startsWith("room_")) {
            id = id.toLowerCase(); // Normalize room name
            newMessage = new Message({ senderId, room: id, text });
        } else {
            newMessage = new Message({ senderId, receiverId: id, text });
        }

        const savedMessage = await newMessage.save();
        if (!savedMessage) {
            console.error("Message saving failed");
            return res.status(500).json({ message: "Message not saved" });
        }

        // console.log("Message saved:", savedMessage);

        if (id.startsWith("room_")) {
            io.to(id).emit("roomMessage", savedMessage);
        } else {
            const receiverSocketId = getReceiverSocketId(id);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", savedMessage);
            }
        }

        res.status(200).json(savedMessage);
    } catch (error) {
        console.error("Error sending message:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


  
