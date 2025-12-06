
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { User } from "../src/models/User";
import { GarbageIncident } from "../src/models/GarbageIncident";
import { RewardTransaction } from "../src/models/RewardTransaction";

// Load env vars
dotenv.config({ path: path.join(__dirname, "../.env") });

const resetDb = async () => {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/project-ganga";
    console.log(`Connecting to ${uri}...`);

    try {
        await mongoose.connect(uri);
        console.log("Connected.");

        console.log("Deleting all Users...");
        await User.deleteMany({});

        console.log("Deleting all Incidents...");
        await GarbageIncident.deleteMany({});

        console.log("Deleting all Transactions...");
        await RewardTransaction.deleteMany({});

        console.log("Database reset complete. All data cleared.");
    } catch (error) {
        console.error("Error resetting database:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
        process.exit(0);
    }
};

resetDb();
