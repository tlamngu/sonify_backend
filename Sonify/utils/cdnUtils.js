import cloudinary from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv'; 

dotenv.config(); 
cloudinary.v2.config({
  secure: true,
});

const config = cloudinary.v2.config();
if (!config.cloud_name || !config.api_key || !config.api_secret) {
  console.warn(
    'Cloudinary configuration missing! Check environment variables (CLOUDINARY_URL or CLOUD_NAME, API_KEY, API_SECRET). Uploads will fail.'
  );
} else {
  console.log('Cloudinary configured successfully for cloud:', config.cloud_name);
}


const uploadToCloudinary = async (file, folder = 'audio', public_id) => {
  if (!file || !file.buffer) {
    throw new Error('Invalid file object provided. Expected an object with a "buffer" property.');
  }
  if (!cloudinary.v2.config().cloud_name) {
      throw new Error('Cloudinary is not configured. Set environment variables.');
  }

  return new Promise((resolve, reject) => {
    const options = {
      resource_type: 'video',
      folder: folder, 
      timeout: 1800000,
    };

    if (public_id) {
      options.public_id = public_id;
      options.overwrite = true;
    }

    const uploadStream = cloudinary.v2.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(new Error(`Cloudinary upload failed: ${error.message || error}`));
        }
        if (!result) {
           console.error('Cloudinary upload failed: No result received.');
           return reject(new Error('Cloudinary upload failed: No result received.'));
        }
        console.log('Cloudinary upload successful:', result.secure_url);
        return resolve(result); 
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

export { uploadToCloudinary };