

import multer from "multer";
import path from "path";

// Define allowed file types
const allowedFileTypes = ['.jpg', '.jpeg', '.png', '.webp'];

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public");
    },
    filename: function (req, file, cb) {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); 
              const randomFilename = uniqueSuffix + '-' + file.originalname; 
              cb(null, randomFilename); 
            }
            
});

const limits = { fileSize: 20000000 };


const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
        cb(null, true); 
    } else {
        cb(new Error('Only image files are allowed!'), false); 
    }
};

export const upload = multer({ 
    storage, 
    limits,
    fileFilter, 
});
