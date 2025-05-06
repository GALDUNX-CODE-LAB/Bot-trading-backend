import mongoose, { Document, Schema, model, Types } from "mongoose";

export interface IRoi extends Document {
  percentageAmount: number;
  imageLink: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoiSchema = new Schema<IRoi>(
  {
    percentageAmount: {
      type: Number,
      required: true,
    },
    imageLink: String,
  },
  { timestamps: true }
);

export default mongoose.model<IRoi>("Roi", RoiSchema);
