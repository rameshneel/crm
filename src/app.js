import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
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
  
  app.use((req, res) => {
    res.status(404).json({ error: "No route found lol!" });
  });

export { app }
