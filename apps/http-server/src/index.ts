import 'dotenv/config'
import '@repo/db'
import { connectDB } from '@repo/db'
const PORT = Number(process.env.SERVER_VAR_PORT) || 8001
import { app } from './app'

const dbUrl = process.env.SERVER_VAR_DATABASE_URL;

if (!dbUrl) {
    console.error("FATAL: SERVER_VAR_DATABASE_URL is not defined in .env");
    process.exit(1);
}

connectDB(dbUrl)
    .then(() => {
        app.listen(PORT, () => {
            console.log("Connection Successful with app at Port:", PORT)
        }).on("error", (error: any) => {
            console.log("App is not able to connect with the database.", error)
        })
    })
    .catch((err) => {
        console.log(`Err : connection failed with db : `, err)
    })
