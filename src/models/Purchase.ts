import mongoose, {
  Schema,
  type Document,
  type Types,
  type Model
} from 'mongoose';

export interface IPurchase extends Document {
  date: Date;
  items: Array<{
    name: string;
    description: string;
    value: number;
  }>;
  value: number;
  note: string;
  typePay: 'Contado' | 'Credito';
  client: Types.ObjectId;
  seller: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now()
    },
    items: [
      {
        name: {
          type: String,
          required: true,
          trim: true
        },
        description: {
          type: String,
          trim: true
        },
        value: {
          type: Number,
          required: true,
          trim: true
        },
        returned: {
          type: Boolean,
          default: false
        }
      }
    ],
    value: {
      type: Number,
      required: true,
      trim: true
    },
    note: {
      type: String,
      trim: true
    },
    typePay: {
      type: String,
      required: true,
      enum: ['Contado', 'Credito']
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
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

const Purchase: Model<IPurchase> = mongoose.model('Purchase', purchaseSchema);

export default Purchase;
