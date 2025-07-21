import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sumaiya.prova321@gmail.com',
    pass: 'efpl ijvk rxxq yyhb' // not your Gmail password!
  }
});

export const sendVerificationEmail = async (email, token) => {
  const verificationLink = `http://localhost:5000/verify-email?token=${token}`;
  await transporter.sendMail({
    from: '"University of Cambridge" <sumaiya.prova321@gmail.com>',
    to: email,
    subject: 'Verify Your Email',
    html: `
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationLink}">${verificationLink}</a>
    `
  });
};
