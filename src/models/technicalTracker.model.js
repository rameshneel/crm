import mongoose, { Schema } from 'mongoose';

const technicalTrackerSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    refNumber: {
      type: String,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    priority: {
      type: String,
      enum: ['1 Day SLA', 'Critical', 'Low', '2 Day SLA', '3 Day SLA', ''],
      default: '',
    },
    status: {
      type: String,
      enum: ['In Process', 'Complete', 'In Query', 'Back With Repo', ''],
      default: 'In Process',
    },
    dateComplete: Date,
    timeTakenMinutes: Number,
    technicalTask: {
      type: String,
      enum: [
        'GSUITE Setup',
        'Email Backup',
        'Domain/Email Forward',
        'Email Setup Call',
        'Others',
        'Server Setup',
        'Website Down',
        'Hosting Setup',
        'Issue With Emails',
        'Suspension/Termination',
        'SSL Issue',
        '',
      ],
      default: '',
    },
    updates: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Update',
      },
    ],
  },
  {
    timestamps: true,
  }
);

technicalTrackerSchema.pre('save', async function (next) {
  if (!this.refNumber) {
    try {
      const lastTracker = await this.constructor.findOne(
        {},
        {},
        { sort: { refNumber: -1 } }
      );
      const lastNumber = lastTracker
        ? parseInt(lastTracker.refNumber.slice(1))
        : 0;
      this.refNumber = `A${(lastNumber + 1).toString().padStart(3, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const TechnicalTracker = mongoose.model(
  'TechnicalTracker',
  technicalTrackerSchema
);

export default TechnicalTracker;

// import mongoose, { Schema } from "mongoose";

// const priorityEnum = [
//   "1 Day SLA",
//   "Critical",
//   "Low",
//   "2 Day SLA",
//   "3 Day SLA",
//   "",
// ] as const;

// const statusEnum = [
//   "In Process",
//   "Complete",
//   "In Query",
//   "Back With Repo",
//   "",
// ] as const;

// const technicalTaskEnum = [
//   "GSUITE Setup",
//   "Email Backup",
//   "Domain/Email Forward",
//   "Email Setup Call",
//   "Others",
//   "Server Setup",
//   "Website Down",
//   "Hosting Setup",
//   "Issue With Emails",
//   "Suspension/Termination",
//   "SSL Issue",
//   "",
// ] as const;

// const technicalTrackerSchema = new Schema({
//   customer: {
//     type: Schema.Types.ObjectId,
//     ref: "Customer",
//     required: [true, "Customer is required"],
//   },
//   createdBy: {
//     type: Schema.Types.ObjectId,
//     ref: "User",
//     required: [true, "Created by user is required"],
//   },
//   updatedBy: {
//     type: Schema.Types.ObjectId,
//     ref: "User",
//   },
//   refNumber: {
//     type: String,
//     unique: true,
//     required: true,
//   },
//   date: {
//     type: Date,
//     default: Date.now,
//   },
//   priority: {
//     type: String,
//     enum: priorityEnum,
//     default: "",
//   },
//   status: {
//     type: String,
//     enum: statusEnum,
//     default: "In Process",
//   },
//   dateComplete: Date,
//   timeTakenMinutes: Number,
//   technicalTask: {
//     type: String,
//     enum: technicalTaskEnum,
//     default: "",
//   },
//   updates: [{
//     type: Schema.Types.ObjectId,
//     ref: 'Update',
//   }],
// }, {
//   timestamps: true,
// });

// technicalTrackerSchema.pre('save', async function(next) {
//   if (!this.refNumber) {
//     try {
//       const lastTracker = await this.constructor.findOne({}, {}, { sort: { 'refNumber': -1 } });
//       const lastNumber = lastTracker ? parseInt(lastTracker.refNumber.slice(1)) : 0;
//       this.refNumber = `A${(lastNumber + 1).toString().padStart(3, '0')}`;
//     } catch (error) {
//       return next(error);
//     }
//   }
//   next();
// });

// const TechnicalTracker = mongoose.model("TechnicalTracker", technicalTrackerSchema);

// export default TechnicalTracker;

// import mongoose, { Schema } from "mongoose";

// const priorities = ["1 Day SLA", "Critical", "Low", "2 Day SLA", "3 Day SLA", ""] as const;
// const statuses = ["In Process", "Complete", "In Query", "Back With Repo", ""] as const;
// const technicalTasks = [
//   "GSUITE Setup",
//   "Email Backup",
//   "Domain/Email Forward",
//   "Email Setup Call",
//   "Others",
//   "Server Setup",
//   "Website Down",
//   "Hosting Setup",
//   "Issue With Emails",
//   "Suspension/Termination",
//   "SSL Issue",
//   ""
// ] as const;

// const technicalTrackerSchema = new Schema({
//   customer: {
//     type: Schema.Types.ObjectId,
//     ref: "Customer",
//     required: true
//   },
//   createdBy: {
//     type: Schema.Types.ObjectId,
//     ref: "User",
//     required: true
//   },
//   updatedBy: {
//     type: Schema.Types.ObjectId,
//     ref: "User"
//   },
//   refNumber: {
//     type: String,
//     unique: true
//   },
//   date: {
//     type: Date,
//     default: Date.now
//   },
//   priority: {
//     type: String,
//     enum: priorities,
//     default: ""
//   },
//   status: {
//     type: String,
//     enum: statuses,
//     default: "In Process"
//   },
//   dateComplete: Date,
//   timeTakenMinutes: Number,
//   technicalTask: {
//     type: String,
//     enum: technicalTasks,
//     default: ""
//   },
//   updates: [{
//     type: Schema.Types.ObjectId,
//     ref: 'Update'
//   }]
// }, {
//   timestamps: true
// });

// technicalTrackerSchema.pre('save', async function(next) {
//   try {
//     if (!this.refNumber) {
//       const lastTracker = await this.constructor.findOne({}, {}, { sort: { 'refNumber': -1 } });
//       const lastNumber = lastTracker ? parseInt(lastTracker.refNumber.slice(1)) : 0;
//       this.refNumber = `A${(lastNumber + 1).toString().padStart(3, '0')}`;
//     }
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// const TechnicalTracker = mongoose.model("TechnicalTracker", technicalTrackerSchema);

// export default TechnicalTracker;

// import mongoose, { Schema } from "mongoose";
// import AutoIncrementFactory from 'mongoose-sequence';

// // const connection = mongoose.createConnection('mongodb://localhost/yourDatabase');
// // const AutoIncrement = AutoIncrementFactory(connection);
// const technicalTrackerSchema = new Schema({
//   customer: {
//     type: Schema.Types.ObjectId,
//     ref: "Customer",
//     required: true
//   },
//   createdBy: {
//     type: Schema.Types.ObjectId,
//     ref: "User",
//     required: true
//   },
//   updatedBy: {
//     type: Schema.Types.ObjectId,
//     ref: "User"
//   },
//   refNumber: {
//     type: String,
//     unique: true
//   },
//   date: {
//     type: Date,
//     default: Date.now
//   },
//   priority: {
//     type: String,
//     enum: ["1 Day SLA", "Critical", "Low", "2 Day SLA", "3 Day SLA", ""],
//     default: ""
//   },
//   status: {
//     type: String,
//     enum: ["In Process", "Complete", "In Query", "Back With Repo", ""],
//     default: "In Process"
//   },
//   dateComplete: Date,
//   timeTakenMinutes: Number,
//   technicalTask: {
//     type: String,
//     enum: [
//       "GSUITE Setup",
//       "Email Backup",
//       "Domain/Email Forward",
//       "Email Setup Call",
//       "Others",
//       "Server Setup",
//       "Website Down",
//       "Hosting Setup",
//       "Issue With Emails",
//       "Suspension/Termination",
//       "SSL Issue",
//       ""
//     ],
//     default: ""
//   },
//   updates: [{
//     type: Schema.Types.ObjectId,
//     ref: 'Update'
//   }]
// }, {
//   timestamps: true
// });

// technicalTrackerSchema.plugin(AutoIncrement, {
//   inc_field: 'refNumberCounter',
//   start_seq: 1
// });

// technicalTrackerSchema.pre('save', function(next) {
//   if (!this.refNumber) {
//     this.refNumber = `A${this.refNumberCounter.toString().padStart(3, '0')}`;
//   }
//   next();
// });

// const TechnicalTracker = mongoose.model("TechnicalTracker", technicalTrackerSchema);

// export default TechnicalTracker;
