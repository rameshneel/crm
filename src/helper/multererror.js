import multer from 'multer';
import { upload } from '../middlewares/multer.middleware.js';
import { uploadForUpdate } from '../middlewares/multerforpdate.middleware.js';

export const uploadFile = (req, res, next) => {
    console.log(multer.MulterError);
    upload.single('avatar')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds limit of 1MB' });
        }
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next()
    });
  };

  export const uploadLogoForCustomers = (req, res, next) => {
    console.log(multer.MulterError);
    upload.single('logo')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds limit of 1MB' });
        }
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next()
    });
  };

  export const uploadFile2 = (req, res, next) => {
    console.log("multer2",multer.MulterError);
    upload.single('customerSignature')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds limit of 1MB' });
        }
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next()
    });
  };

  export const fileUploadforupdate = (req, res, next) => {
    uploadForUpdate.array('files', 20)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds limit of 50MB' });
        }
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };

  export const fileUploadGallery = (req, res, next) => {
    uploadForUpdate.array('fileUrl', 5)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds limit of 50MB' });
        }
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
  