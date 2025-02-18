import bcrypt from 'bcryptjs';
import User from "../models/User.model.js";
import {generateToken} from "../utils/token.js";

// Signup
export const signup = async(req, res) => {
    const {fullName, email, password} = req.body;

    try {
        // Check for required fields
        if (!fullName || !email || !password) {
            return res.status(400).json({message: 'All fields are required'});
       }

        // Check password length
        if (password.length < 6) {
            return res.status(400).json({message: 'Password must be at least 6 characters'});
       }

        // Check if user already exists
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(401).json({message: 'User already exists'});
       }

        // Create new user model in DB
        const newUser = new User({
            fullName,
            email,
            password
       });

        // Save the new user to the database
        await newUser.save();

        // Generate token
        generateToken(newUser._id, res);

        // Send response without the password
        return res.status(201).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            picture: newUser.picture,
       });

   } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Internal Server Error'});
   }
};

// Login
export const login = async(req, res) => {
    const {email, password} = req.body;

    try {
        // Check for required fields
        if (!email || !password) {
            return res.status(400).json({message: 'All fields are required'});
       }

        // Check if user exists
        const user = await User.findOne({email});
        if (!user) {
            return res.status(401).json({message: 'Invalid Email'});
       }

        // Check if password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({message: 'Invalid Password'});
       }

        // Generate token
        generateToken(user._id, res);

        // Send response without the password
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            picture: user.picture,
       });

   } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Internal Server Error'});
   }
};

// Logout
export const logout = (req, res) => {
    try {
        // Clear the JWT cookie
        res.cookie("jwt", "", {
            maxAge: 0,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "development",
       });

        res.status(200).json({message: 'Logged out successfully'});

   } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Internal Server Error'});
   }
};

//check profile
export const checkAuth = (req,res) =>{
    try {
        res.status(200).json(req.user)
   } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Internal Server Error'});
   }
}

// ✅ Get Current User
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get User by ID
export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const user = await User.findById(userId).select('fullName');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};