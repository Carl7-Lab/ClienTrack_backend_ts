/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import nodemailer, { type Transporter } from 'nodemailer';

interface EmailData {
  email: string;
  name: string;
  token: string;
}

export const emailRegister = async (datos: EmailData): Promise<void> => {
  const { email, name, token } = datos;

  const transport: Transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST ?? '',
    port: process.env.MAILTRAP_PORT ? parseInt(process.env.MAILTRAP_PORT) : 0,
    auth: {
      user: process.env.MAILTRAP_USER ?? '',
      pass: process.env.MAILTRAP_PASS ?? ''
    }
  });

  await transport.sendMail({
    from: '"ClienTrack - Administra tus Clientes" <cuentas@clientrack.com>',
    to: email,
    subject: 'ClienTrack - Confirma tu Cuenta',
    text: 'Confirma tu Cuenta en ClienTrack',
    html: ` <p>Hola: ${name},</p>
      <p>Comprueba tu cuenta en ClienTrack</p>
      <p>Tu cuenta ya esta casi lista, solo debes de comprobarla en el siguiente enlace:</p>
      <a href="${process.env.FRONTEND_URL}/confirm-account/${token}">Comprobar Cuenta</a>
      <p>Si tu no creaste esta cuenta, puedes ignorar el mensaje</p>
      `
  });
};

export const emailForgetPassword = async (datos: EmailData): Promise<void> => {
  const { email, name, token } = datos;

  const transport: Transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST ?? '',
    port: process.env.MAILTRAP_PORT ? parseInt(process.env.MAILTRAP_PORT) : 0,
    auth: {
      user: process.env.MAILTRAP_USER ?? '',
      pass: process.env.MAILTRAP_PASS ?? ''
    }
  });

  await transport.sendMail({
    from: '"ClienTrack - Administra tus Clientes" <cuentas@clientrack.com>',
    to: email,
    subject: 'ClienTrack - Restablecimiento tu Password',
    text: 'Restablecimiento tu Password en ClienTrack',
    html: ` <p>Estimado: ${name},</p> 
    <p>Has solicitado restablecer tu password,</p>
    <p>por favor, sigue en el siguiente enlace:</p>
    <a href="${process.env.FRONTEND_URL}/forget-password/${token}">Restablecer tu Password</a>
    <p>Una vez que accedas al enlace, podrás establecer un nuevo password</p>
    <p>siguiendo las instrucciones proporcionadas en la página.</p>
    <p>Si tu no solicitaste este email, puedes ignorar el mensaje</p>
    `
  });
};
