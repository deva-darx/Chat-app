import mongoose from "mongoose";
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    fullName:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true,
        minlength:6
    },
    picture:{
        type:String,
        default:""
    }
},{timestamps:true})

// Pre-save middleware to hash the password
userSchema.pre('save', async function (next) {

    //check if the password is being modified (for new user or password updates)
    if(!this.isModified('password')){
        return next(); //Skip if password is not modified
    }

    try {
        const SALT = await bcrypt.genSalt(6)
        this.password = await bcrypt.hash(this.password,SALT)
        next()
    } catch (error) {
        next(error);
    }
})

const User = mongoose.model('User', userSchema)

export default User