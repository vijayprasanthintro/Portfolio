import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema(
  {
    // `unique` already creates the index; declaring both is redundant.
    section: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Content', contentSchema);
