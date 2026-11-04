import dns from "node:dns"
import mongoose from "mongoose"

dns.setServers(["8.8.8.8", "8.8.4.4"])

const connectDatabase = async (): Promise<void> => {
const mongoUri = process.env.MONGODB_URI

if (!mongoUri) {
throw new Error("MONGODB_URI is not defined")
}

await mongoose.connect(mongoUri)

console.log("MongoDB connected successfully")
}

export default connectDatabase
