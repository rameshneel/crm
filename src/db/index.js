
import mongoose from "mongoose";
const DB_NAME = "crm";

const connectDB = async () => {
    try {
        const uri = `${process.env.MONGODB_URI}`; // MONGODB_URI se connect karna
        // console.log(`MongoDB se connect kar rahe hain URI ke saath: ${uri}/${DB_NAME}`);

        // In options ko remove kar diya gaya hai
        const connectionInstance = await mongoose.connect(uri, {
            dbName: DB_NAME, // Database name specify karo
        });
        
        console.log(`\nMongoDB connected! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MONGODB connection FAILED", error);
        process.exit(1);
    }
};

export default connectDB;

// import mongoose from "mongoose";
// const DB_NAME="crm"


// const connectDB = async () => {
//     try {
//         const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
//     } catch (error) {
//         console.log("MONGODB connection FAILED ", error);
//         process.exit(1)
//     }
// }

// export default connectDB
