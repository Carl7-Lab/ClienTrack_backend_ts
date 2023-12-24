import mongoose, {
  Schema,
  type Document,
  type Types,
  type Model
} from 'mongoose';

interface IPayment extends Document {
  date: Date;
  value: number;
  note: string;
  client: Types.ObjectId;
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
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    }
  },
  {
    timestamps: true
  }
);

const Payment: Model<IPayment> = mongoose.model('Payment', paymentSchema);

export default Payment;
