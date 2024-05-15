import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { ApiError } from "./utils/ApiError.js"
const app = express()
app.use(cors({
    origin: ['http://localhost:3000','https://localhost:3000','http://localhost:5173'],
    credentials: true,
    secure: false,
     optionSuccessStatus: 200,
    Headers: true,
    exposedHeaders: 'Set-Cookie',
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
   allowedHeaders: [
    'Access-Control-Allow-Origin',
    'Content-Type',
    'Authorization'
  ]
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("Public"))
app.use(cookieParser())



//routes import
import userRouter from './routes/user.routes.js'
import customerRoutes from "./routes/customer.route.js";
import leadRoutes from "./routes/lead.routes.js"

//routes declaration
app.use("/api/users", userRouter)
app.use("/api/customers", customerRoutes);
app.use("/api/leads", leadRoutes);

// app.use((err, req, res, next) => {
//     console.log(err.stack);
//     res.status(500).json({ error: "Something went wrong" });
//   });

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
      console.error(`API Error: ${err.message}`);
      if (err.errors.length > 0) {
          console.error('Validation Errors:', err.errors);
      }
      
      return res.status(err.statusCode).json({
          success: false,
          message: err.message,
          errors: err.errors,
          stack:err.stack
      });
  }
  console.error('Internal Server Error:', err);
  return res.status(500).json({
      success: false,
      message: "Internal Server Error"
  });
}

app.use(errorHandler); 

app.use((req, res) => {
    res.status(404).json({ message: "No route found" });
  }); 

export { app }
