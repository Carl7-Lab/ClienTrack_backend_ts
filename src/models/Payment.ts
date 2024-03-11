import mongoose, {
  Schema,
  type Document,
  type Types,
  type Model
} from 'mongoose';

export interface IPayment extends Document {
  date: Date;
  value: number;
  note: string;
  reason: 'Pago' | 'Devolucion';
  client: Types.ObjectId;
  seller: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now()
    },
    value: {
      type: Number,
      required: true,
      trim: true
    },
    note: {
      type: String,
      trim: true
    },
    reason: {
      type: String,
      required: true,
      enum: ['Pago', 'Devolucion']
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

const Payment: Model<IPayment> = mongoose.model('Payment', paymentSchema);

export default Payment;
