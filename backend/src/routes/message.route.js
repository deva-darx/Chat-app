import express from 'express'
import { protectedRoute } from '../middleware/auth.middleware.js'
import { getUsers,getMessages, sendMessages } from '../controllers/message.controller.js'

const router = express.Router()

router.get('/users',protectedRoute,getUsers)
router.get('/:id',protectedRoute,getMessages)
router.post('/:id',protectedRoute,sendMessages)

export default router