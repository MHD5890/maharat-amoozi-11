// lib/dbConnect.js
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://maharat:maharat123@cluster0.nj2zieq.mongodb.net/maharat?retryWrites=true&w=majority&appName=Cluster0";

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        console.log('Attempting to connect to MongoDB...');
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            // useNewUrlParser/UnifiedTopology no longer needed in modern mongoose
        }).then((mongoose) => {
            console.log("✅ اتصال موفق به MongoDB");
            return mongoose;
        }).catch(err => {
            console.error('MongoDB connection error:', err);
            throw err;
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

export default dbConnect;
