import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
      validate: /^[a-zA-Z\s]*$/ // Validate only alphabets and spaces
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/ // Validate email format
    },
    avatar: {
      type: String,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      // Implement further checks for password strength if necessary
    },
    refreshToken: {
      type: String
    },
    role: {
      type: String,
      enum: ["admin", "salesman"],
      default: "salesman", // Set a default role if not provided
      required: true
    },
    forgetEmailVerified: {
      type: Boolean,
      default: false,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);








// import mongoose, {Schema} from "mongoose";
// import jwt from "jsonwebtoken"
// import bcrypt from "bcrypt"

// const userSchema = new Schema(
//     {
//         fullName: {
//             type: String,
//             required: true,
//             trim: true, 
//             index: true
//         },
//         email: {
//             type: String,
//             required:[true,'email is required'] ,
//             unique: true,
//             lowecase: true,
//             trim: true, 
//         },
       
//         avatar: {
//             type: String, 
//         },
       
//         password: {
//             type: String,
//             required: [true, 'Password is required']
//         },
//         refreshToken: {
//             type: String
//         },

//         role: {
//           type: String,
//           enum: ["admin", "salesman"],
//           required:true
//        },

//        forgetEmailVerified: {
//         type: Boolean,
//         default: false, 
//       },
//       resetToken: {
//         type: String,
//         default: null,
//       },
//       resetTokenExpiry: {
//         type: Date,
//         default: null,
//       },

//     },
//     {
//         timestamps: true
//     }
// )

// userSchema.pre("save", async function (next) {
//     if(!this.isModified("password")) return next();

//     this.password = await bcrypt.hash(this.password, 10)
//     next()
// })

// userSchema.methods.isPasswordCorrect = async function(password){
//     return await bcrypt.compare(password, this.password)
// }

// userSchema.methods.generateAccessToken = function(){
//     return jwt.sign(
//         {
//             _id: this._id,
//             email: this.email,
//             fullName: this.fullName
//         },
//         process.env.ACCESS_TOKEN_SECRET,
//         {
//             expiresIn: process.env.ACCESS_TOKEN_EXPIRY
//         }
//     )
// }
// userSchema.methods.generateRefreshToken = function(){
//     return jwt.sign(
//         {
//             _id: this._id,
            
//         },
//         process.env.REFRESH_TOKEN_SECRET,
//         {
//             expiresIn: process.env.REFRESH_TOKEN_EXPIRY
//         }
//     )
// }

// export const User = mongoose.model("User", userSchema)