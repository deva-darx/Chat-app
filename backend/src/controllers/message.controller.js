import User from "../models/User.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../utils/socket.js";


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
        res.status(500).json({ message: 'Internal Server Error' });    }
}

// Function to get messages between the logged-in user and another user
export const getMessages = async(req,res) =>{
    try {
        // Get the ID of the user to chat with from the request parameters
        const {id: userToChatId } = req.params
        // Get the logged-in user's ID from the request object
        const myId = req.user.id

        // Find messages where the logged-in user and the other user are either sender or receiver
        const messages = await Message.find({
            $or:[
                {senderId:myId, receiverId: userToChatId},
                {senderId:userToChatId, receiverId: myId},
                
            ]
        }).sort({ createdAt: 1 }); //sort messages by creation time in ascending order

        res.status(200).json(messages)
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal Server Error' }); 
    }
}


// Function to send messages between the logged-in user and another user
export const sendMessages = async(req,res) => {
try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

       res.status(200).json(newMessage)
} catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal Server Error' }); 
}
}
