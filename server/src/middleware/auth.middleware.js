import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

export const protectedRoute = async (req, res, next) => {
    try {
        // Check if the token exists
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({message: 'Unauthorized - Token not provided'});
       }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({message: 'Unauthorized - Invalid Token'});
       }

        // Find the user in the database
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({message: 'Unauthorized - User not found'});
       }

        // Attach the user to the request object
        req.user = user;
        next();
   } catch (error) {
        console.error('Error in protectedRoute middleware:', error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({message: 'Unauthorized - Token expired'});
       }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({message: 'Unauthorized - Invalid Token'});
       }

        res.status(500).json({message: 'Internal Server Error'});
   }
};
