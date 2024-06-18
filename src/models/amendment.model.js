import mongoose from "mongoose";
const { Schema } = mongoose;

const amendmentschema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    refNo: {
      type: String,
      unique: true,
    },

    date_current: {
      type: Date,
      required: true,
    },

    customer_status: {
      type: String,
      enum: {
        values: ["Live Site", "Demo Link", ""],
        message: "{VALUE} is not supported",
      },
      default: "",
    },
    date_complete: {
      type: Date,
    },
    priority: {
      type: String,
      enum: {
        values: ["Critical", "Low", ""],
        message: "{VALUE} is not supported",
      },
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["In Query", "Complete", "In Process", ""],
        message: "{VALUE} is not supported",
      },
      default: "",
    },
    generated_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      // required: true
    },
    updated_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Update",
      },
    ],
  },
  { timestamps: true }
);

amendmentschema.pre("save", async function (next) {
  const amendment = this;
  if (amendment.isNew && !amendment.refNo) {
    try {
      const lastAmendment = await mongoose
        .model("Amendment")
        .findOne()
        .sort({ refNo: -1 });
      let newAmendmentNo = "A001";
      if (lastAmendment && lastAmendment.refNo) {
        const lastAmendmentNo = lastAmendment.refNo;
        const lastNumber = lastAmendmentNo.startsWith("A")
          ? parseInt(lastAmendmentNo.replace("A", ""), 10)
          : null;
        if (lastNumber !== null) {
          let found = true;
          let nextNumber = lastNumber + 1;
          while (found) {
            const potentialAmendmentNo = "A" + nextNumber;
            const existingAmendment = await mongoose
              .model("Amendment")
              .findOne({ refNo: potentialAmendmentNo });
            if (!existingAmendment) {
              found = false;
              newAmendmentNo = potentialAmendmentNo;
            } else {
              nextNumber++;
            }
          }
        }
      }

      amendment.refNo = newAmendmentNo;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const Amendment = mongoose.model("Amendment", amendmentschema);

export default Amendment;
