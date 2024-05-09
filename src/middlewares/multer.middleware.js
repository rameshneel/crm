

import multer from "multer";
import path from "path";

const allowedFileTypes = ['.jpg', '.jpeg', '.png',];

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./Public");
    },
    filename: function (req, file, cb) {
              const uniqueSuffix = Math.round(Math.random()*1E9); 
              const randomFilename = uniqueSuffix+'-'+file.originalname; 
              cb(null, randomFilename); 
            }
            
});

const limits = { fileSize: 51250};


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





