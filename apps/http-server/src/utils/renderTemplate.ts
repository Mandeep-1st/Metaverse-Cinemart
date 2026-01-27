import fs from "fs";
import path from "path";

export const renderTemplate = (
    templateName: string,
    variables: Record<string, string>
) => {
    const templatePath = path.join(
        __dirname,
        `../public/templates/${templateName}.html`
    );

    let html = fs.readFileSync(templatePath, "utf-8");

    Object.keys(variables).forEach((key) => {
        html = html.replace(new RegExp(`{{${key}}}`, "g"), variables[key] || "");
    });

    return html;
};
