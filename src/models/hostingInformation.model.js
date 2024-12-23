import mongoose from "mongoose";

const { Schema } = mongoose;

// Define the schema
const HostingSchema = new Schema({
  hostName: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['Shared', 'VPS', 'Dedicated', 'Cloud'],
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending', 'Suspended'],
    default: 'Active'
  },
  technicalSpecifications: {
    operatingSystem: {
      type: String
    },
    serverType: {
      type: String
    },
    cpu: {
      cores: {
        type: Number
      },
      speed: {
        type: String
      }
    },
    ram: {
      type: String
    },
    storage: {
      type: String
    },
    bandwidth: {
      monthlyLimit: {
        type: String
      },
      currentUsage: {
        type: String
      }
    },
    ipAddress: {
      type: String
    }
  },
  accountInformation: {
    accountName: {
      type: String
    },
    accountType: {
      type: String,
      enum: ['Individual', 'Business', 'Reseller']
    },
    billingInformation: {
      billingCycle: {
        type: String
      },
      paymentMethod: {
        type: String
      },
      invoices: {
        type: [String]
      }
    },
    supportContacts: {
      type: [String]
    }
  },
  securityDetails: {
    firewall: {
      type: Boolean
    },
    sslCertificates: {
      type: String
    },
    backups: {
      frequency: {
        type: String
      },
      lastBackupDate: {
        type: Date
      },
      backupLocation: {
        type: String
      }
    },
    securityGroups: {
      type: [String]
    }
  },
  webHostingSpecifics: {
    domainNames: {
      type: [String]
    },
    dnsSettings: {
      type: String
    },
    webApplications: {
      type: [String]
    },
    emailHosting: {
      type: [String]
    }
  },
  performanceMonitoring: {
    uptime: {
      type: String
    },
    performanceMetrics: {
      type: String
    },
    alerts: {
      type: [String]
    }
  },
  maintenanceAndUpdates: {
    patchManagement: {
      type: String
    },
    scheduledMaintenance: {
      type: String
    },
    changeLog: {
      type: [String]
    }
  },
  legalAndCompliance: {
    termsOfService: {
      type: String
    },
    privacyPolicy: {
      type: String
    },
    complianceCertifications: {
      type: [String]
    }
  },
  additionalFeatures: {
    controlPanel: {
      type: String
    },
    apis: {
      type: [String]
    },
    addOns: {
      type: [String]
    }
  }
});

// Create the model
const Hosting = mongoose.model('Hosting', HostingSchema);


export default Hosting;