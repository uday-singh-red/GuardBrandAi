const mongoose = require('mongoose');

const userschema =new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            trim:true
        },
        email:{
            type:String,
            required:true,
            trim:true,
            unique:true,
            lowercase:true
        },
        password:{
            type:String,
            required:true
        },
        isVerified:{
            type:Boolean,
            default:false
        },
        otp:{
            type:String
        },
        otpExp:{
            type:Date
        }

    },{
        timestamps:true
    }
);

const User = mongoose.model('User',userschema);

module.exports={User};