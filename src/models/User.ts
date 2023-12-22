import mongoose, { type Document, Schema, type Model } from 'mongoose';
import bcrypt from 'bcrypt';

interface IUser extends Document {
  userName: string;
  password: string;
  email: string;
  token?: string;
  confirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
  checkPassword: (passwordFormulario: string) => boolean;
}

const userSchema = new Schema<IUser>(
  {
    userName: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      match: /.+@.+\..+/,
      trim: true,
      unique: true
    },
    token: {
      type: String
    },
    confirmed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.checkPassword = async function (passwordFormulario: string) {
  return (await bcrypt.compare(
    passwordFormulario,
    this.password as string
  )) as boolean;
};

const User: Model<IUser> = mongoose.model('User', userSchema);

export default User;
