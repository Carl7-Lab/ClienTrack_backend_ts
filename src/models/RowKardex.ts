import mongoose, { type Model, Schema, type Types } from 'mongoose';

export interface IRowKardex extends Document {
  date: Date;
  description: 'Compra a Credito' | 'Compra al Contado' | 'Pago' | 'Devolucion';
  debit: number;
  credit: number;
  balance: number;
  type: Types.ObjectId;
  typeModel: 'Payment' | 'Purchase';
  client: Types.ObjectId;
  seller: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const rowKardexSchema = new Schema<IRowKardex>(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now()
    },
    description: {
      type: String,
      trim: true,
      enum: ['Compra a Credito', 'Compra al Contado', 'Pago', 'Devolucion']
    },
    debit: {
      type: Number,
      required: true,
      trim: true
    },
    credit: {
      type: Number,
      required: true,
      trim: true
    },
    balance: {
      type: Number,
      required: true,
      trim: true
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'typeModel'
    },
    typeModel: {
      type: String,
      enum: ['Payment', 'Purchase']
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

const RowKardex: Model<IRowKardex> = mongoose.model(
  'RowKardex',
  rowKardexSchema
);

export default RowKardex;
