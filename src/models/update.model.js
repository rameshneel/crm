import mongoose from "mongoose";
const { Schema } = mongoose;

const updateSchema = new Schema({
  content: {
    type: String,
     trim:true
  },
  files: [{
    type: String,
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Update',
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

const Update = mongoose.model('Update', updateSchema);
export default Update;
