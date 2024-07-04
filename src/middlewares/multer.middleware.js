

import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedFileTypes = ['.jpg', '.jpeg', '.png',];

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // cb(null, "./public/images");
        cb(null, path.join(__dirname, "..", "Public", "images"));
    },
    filename: function (req, file, cb) {
              const uniqueSuffix = Math.round(Math.random()*1E9); 
              const randomFilename = uniqueSuffix+'-'+file.originalname; 
              cb(null, randomFilename); 
            }
            
});
const limits = { fileSize: 1024*1000};
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





