import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Sick Leave', 'Vacation', 'Personal Leave', 'Other'],
    required: true
  },
  managerResponded: {
    type: Boolean,
    default: false
  },
  managerResponse: {
    type: String,
    enum: ['Approved', 'Rejected', 'Pending'],
    default: 'Pending'
  },
  managerComments: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  leaveReason: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    required: true
  },
  totalWorkingDays: {
    type: Number,
    required: true,
    default: 0
  },
  totalDayHoliday: {
    type: Number,
    default: 0 // Field for total days including weekends
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  notified: {
    type: Boolean,
    default: false
  },
  warning: {
    type: Boolean,
    default: false 
  }
}, {
  timestamps: true
});


function calculateTotalDays(startDate, endDate) {
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 3600 * 24)) + 1; // +1 to include end date
  return totalDays;
}


function calculateWorkingDays(startDate, endDate) {
  let totalWorkingDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const day = currentDate.getDay();
    if (day !== 0 && day !== 6) { // 0 = Sunday, 6 = Saturday
      totalWorkingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalWorkingDays;
}


leaveSchema.pre('save', async function(next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date.'));
  }
  if (this.returnDate <= this.endDate) {
    return next(new Error('Return date must be after end date.'));
  }

  // Calculate total days including weekends
  const totalDays = calculateTotalDays(this.startDate, this.endDate);
  this.totalDayHoliday = totalDays;

  // Calculate totalWorkingDays excluding weekends
  const totalWorkingDays = calculateWorkingDays(this.startDate, this.endDate);
  this.totalWorkingDays = totalWorkingDays;

  // Check the number of leaves taken in the current year
  const currentYear = new Date().getFullYear();
  const leaveCount = await Leave.countDocuments({
    employeeId: this.employeeId,
    startDate: { $gte: new Date(currentYear, 0, 1) },
    endDate: { $lte: new Date(currentYear, 11, 31) },
    isDeleted: false // Exclude soft deleted leaves
  });

  if (leaveCount + totalWorkingDays > 20) {
    this.warning = true; // Set warning flag if exceeding 20 days
  }

  next();
});

const Leave = mongoose.models.Leave || mongoose.model('Leave', leaveSchema);

export default Leave;
