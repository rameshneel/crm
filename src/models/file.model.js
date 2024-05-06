import mongoose from "mongoose";

const filesSchema = new mongoose.Schema({
    fileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    }
  });

  const File = mongoose.model("File", filesSchema);

export default File;