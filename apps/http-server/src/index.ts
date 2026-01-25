import 'dotenv/config'
import '@repo/db'
import { connectDB } from '@repo/db'
const PORT = process.env.SERVER_VAR_PORT || 8001
import { app } from './app'


connectDB("")
    .then(() => {
        app.on("error", (error: any) => {
            console.log("App is not able to connect with the database.")
        })

        app.listen(PORT, () => {
            console.log("Connection Successful with app at Port:", PORT)
        })
    })
    .catch((err) => {
        console.log(`Err : connection failed with db : `, err)
    })
