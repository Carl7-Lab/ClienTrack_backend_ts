import mongoose, {
  type Document,
  Schema,
  type Model,
  type Types
} from 'mongoose';

interface IClient extends Document {
  name: string;
  lastName?: string;
  cell: string;
  email?: string;
  description?: string;
  alias?: string;
  addresses: Types.ObjectId[];
  seller: Types.ObjectId;
  hide: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    cell: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      match: /.+@.+\..+/,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    alias: {
      type: String,
      trim: true
    },
    addresses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
      }
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    hide: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Client: Model<IClient> = mongoose.model('Client', clientSchema);

export default Client;
