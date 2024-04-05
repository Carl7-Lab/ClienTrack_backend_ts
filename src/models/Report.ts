import mongoose, {
  Schema,
  type Document,
  type Types,
  type Model
} from 'mongoose';

export interface IReport extends Document {
  name: string;
  purchases: {
    value: number;
    clientsDetails: Array<{
      value: number;
      clientId: Types.ObjectId;
    }>;
  };
  payments: {
    value: number;
    paymentsDetails: {
      value: number;
      clientsDetails: Array<{
        value: number;
        clientId: Types.ObjectId;
      }>;
    };
    purchasesPayDetails: {
      value: number;
      clientsDetails: Array<{
        value: number;
        clientId: Types.ObjectId;
      }>;
    };
    returnsDetails: {
      value: number;
      clientsDetails: Array<{
        value: number;
        clientId: Types.ObjectId;
      }>;
    };
  };
  seller: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    name: {
      type: String
    },
    purchases: {
      value: {
        type: Number
      },
      clientsDetails: [
        {
          clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client'
          },
          value: {
            type: Number
          }
        }
      ]
    },
    payments: {
      value: {
        type: Number
      },
      paymentsDetails: {
        value: {
          type: Number
        },
        clientsDetails: [
          {
            clientId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Client'
            },
            value: {
              type: Number
            }
          }
        ]
      },
      purchasesPayDetails: {
        value: {
          type: Number
        },
        clientsDetails: [
          {
            clientId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Client'
            },
            value: {
              type: Number
            }
          }
        ]
      },
      returnsDetails: {
        value: {
          type: Number
        },
        clientsDetails: [
          {
            clientId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Client'
            },
            value: {
              type: Number
            }
          }
        ]
      }
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

const Report: Model<IReport> = mongoose.model('Report', reportSchema);

export default Report;
