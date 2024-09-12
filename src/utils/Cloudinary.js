import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRECT 
});


const uploadOnCloudinary = async(localPath)=>{
    try{
        if(!localPath) return null;
        //upload the file
        const response = await cloudinary.uploader.upload(localPath,{resource_type:"auto"})
        fs.unlinkSync(localPath)
        // console.log(response);
        return response
    }catch(err){
        fs.unlinkSync(localPath)
        return null
    }
}

// const uploadResult = await cloudinary.uploader
//        .upload(
//            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//                public_id: 'shoes',
//            }
//        )
//        .catch((error) => {
//            console.log(error);
//        });
    
//     console.log(uploadResult);
    
export {uploadOnCloudinary}