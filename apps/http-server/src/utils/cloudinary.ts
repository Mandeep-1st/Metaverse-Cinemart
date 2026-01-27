import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.SERVER_VAR_CLOUD_NAME,
    api_key: process.env.SERVER_VAR_API_KEY,
    api_secret: process.env.SERVER_VAR_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

async function uploadOnCloudinary(localFilePath: string) {
    try {
        if (!localFilePath) {
            throw "There is no file Provided";
        }
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "Metaverse-Cinemart"
        });

        //Deleting the locally saved file
        fs.unlinkSync(localFilePath);
        return result;
    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw new Error("Cloudinary save error");
    }
}

export { uploadOnCloudinary };