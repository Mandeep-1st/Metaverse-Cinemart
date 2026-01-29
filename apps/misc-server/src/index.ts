import 'dotenv/config'
import Redis from "ioredis";
import { sendMail } from './utils/mailerService';
import axios from 'axios';

const REDIS_HOST = process.env.SERVER_VAR_REDIS_HOST || "127.0.0.1";
const REDIS_PORT = 6379;

const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null
});

const sendPasswordToUser = async (task: any) => {
    //we will send the password here in email and use axios to hit the route of http server.
    console.log(task)
    const response: any = await sendMail(task);

    if (!response) {
        console.error(response?.message)
    }

    // we are informing http server that we have sent the email
    console.log("Going for http")
    const res = await axios.post('http://localhost:3002/api/v1/users/password-email-sent', { email: task.to });
    console.log(res);
};

const startPasswordWorker = async () => {
    console.log("Worker Service Started... Waiting for passwords");

    while (true) {
        try {
            // BRPOP blocks execution until an item is available in "video-tasks"
            // "0" means wait indefinitely
            const response = await redis.brpop("sendPassword", 0);

            // response will be [queueName, value]
            if (response) {
                const data = JSON.parse(response[1]);
                await sendPasswordToUser(data);
                console.log("pass sent")
            }

        } catch (error) {
            // Wait a bit before retrying to avoid crash loops
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

startPasswordWorker()