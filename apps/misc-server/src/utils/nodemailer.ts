import nodemailer, { Transporter } from "nodemailer";

export const mailTransporter: Transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SERVER_VAR_MAIL_USER,
        pass: process.env.SERVER_VAR_GOOGLE_APP_PASSWORD_NODEMAILER,
    },
});

export const verifyMailer = async () => {
    try {
        await mailTransporter.verify();
        console.log("Mail server ready");
    } catch (err) {
        console.error("Mail server error", err);
    }
};

