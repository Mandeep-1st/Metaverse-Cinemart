import mongoose from 'mongoose'

let isConnected = false;


export const connectDB = async (uri: string) => {

    if (isConnected) return;

    try {
        const db = await mongoose.connect(uri);
        isConnected = db.connections[0]?.readyState === 1;
        console.log("Mongodb Connected")

    } catch (er) {
        console.log("Mongodb Connection Error", er);
        process.exit(1)
    }
}


// export * from './models/User'; >>> we will be going to export like this .