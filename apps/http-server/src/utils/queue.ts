import Redis from "ioredis";

const REDIS_URL = process.env.SERVER_VAR_REDIS_URL;
// const REDIS_HOST = process.env.SERVER_VAR_REDIS_HOST || "127.0.0.1";
// const REDIS_PORT = Number(process.env.SERVER_VAR_REDIS_PORT) || 6379;

const redis = new Redis(REDIS_URL || "redis://127.0.0.1:6379");

export const sendToQueue = async (queueName: string, data: any) => {
    try {
        // LPUSH adds to the head of the list
        await redis.lpush(queueName, JSON.stringify(data));
        console.log(`Pushed to ${queueName}:`, data);
    } catch (error) {
        console.error("Redis Error:", error);
    }
};