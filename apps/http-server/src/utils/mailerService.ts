import { mailTransporter } from "./nodemailer";
import { renderTemplate } from "./renderTemplate";

type SendMailResult = {
    success: boolean;
    message: string;
};

type SendMailOptions = {
    to: string;
    subject: string;
    templateName: string;
    variables: Record<string, string>;
};

export const sendMail = async (
    options: SendMailOptions
): Promise<SendMailResult> => {
    try {
        const html = renderTemplate(options.templateName, options.variables);

        const info = await mailTransporter.sendMail({
            from: `"CINE MART" <${process.env.MAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html,
        });

        return {
            success: true,
            message: `Email sent: ${info.messageId}`,
        };
    } catch (error: any) {
        console.error("Email send failed:", error);

        return {
            success: false,
            message: error?.message || "Email delivery failed",
        };
    }
};
