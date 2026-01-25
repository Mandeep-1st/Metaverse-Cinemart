import express from 'express'

const app = express();

const PORT = process.env.SERVER_VAR_PORT || 8000;

app.listen(PORT, () => {
    console.log("SERver is listenign on port ", PORT)
})