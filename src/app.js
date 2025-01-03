import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      "http://localhost:5173",
      "https://hom-seven.vercel.app",
      "https://high-oaks-media-crm.vercel.app",
    ],
    credentials: true,
    secure: false,
    optionSuccessStatus: 200,
    Headers: true,
    exposedHeaders: "Set-Cookie",
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Access-Control-Allow-Origin",
      "Content-Type",
      "Authorization",
    ],
  })
);
app.use((req, res, next) => {
  req.baseUrl = `${config.baseUrl}`;
  next();
});

// fornted ke liye
// app.use(express.static(path.join(__dirname, 'client/build')));
// app.use(express.static(path.join(__dirname, 'public')));
app.use("/public", express.static(path.join(__dirname, "..", "public")));
// app.use(express.static( 'public'));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import newWebsiteRoute from "./routes/newWebsiteContent.routes.js";
import amendmentRoutes from "./routes/amendment.routes.js";
import orderRoutes from "./routes/order.routes.js";
import technicalMasterRoutes from "./routes/techincalMaster.routes.js";
import technicalTrackerRoutes from "./routes/technicalTracker.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import filesRoutes from "./routes/files.routes.js";
import updatesRoutes from "./routes/update.routes.js";
import productFlowRoutes from "./routes/productFlow.routes.js";
import copywriterTrackerRoutes from "./routes/copywriterTracker.routes.js";
import leaveRoutes from './routes/leave.routes.js';
import salesRoutes from './routes/sales.routes.js';

//routes declaration
app.use("/api/users", userRouter);
app.use("/api/customers", customerRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/newwebsite", newWebsiteRoute);
app.use("/api/amendments", amendmentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/technicalmasters", technicalMasterRoutes);
app.use("/api/technicaltrackers", technicalTrackerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/updates", updatesRoutes);
app.use("/api/productflows", productFlowRoutes);
app.use("/api/copywritertrackers", copywriterTrackerRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/sales', salesRoutes);

// app.use((err, req, res, next) => {
//     console.log(err.stack);
//     res.status(500).json({ error: "Something went wrong" });
//   });

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    console.error(`API Error: ${err.message}`);
    if (err.errors.length > 0) {
      console.error("Validation Errors:", err.errors);
    }

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      stack: err.stack,
    });
  }
  console.error("Internal Server Error:", err);
  return res.status(500).json({
    success: false,
    message: err.message,
    // errors: err.errors,
    stack: err.stack,
  });
}

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ message: "No route found" });
});

export { app };
