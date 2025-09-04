import Notification from '../models/Notification.js';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import { sendToUser } from './realtime.js';

// Configure email transporter
const transporter = (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS)
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  : nodemailer.createTransport({
      jsonTransport: true
    });

export const sendNotification = async ({ type, requestId, recipientId, recipientRole, title, message }) => {
  try {
    let recipients = [];

    if (recipientId) {
      recipients = [recipientId];
    } else if (recipientRole) {
      // Find users with the specified role
      const users = await User.find({ role: recipientRole, isActive: true });
      recipients = users.map(user => user._id);
    }

    for (const recipientId of recipients) {
      // Create in-app notification
      const notification = new Notification({
        recipient: recipientId,
        request: requestId,
        type,
        title,
        message
      });
      await notification.save();

      // Push real-time notification via SSE
      sendToUser(recipientId, {
        type: 'notification',
        payload: {
          _id: notification._id,
          title,
          message,
          createdAt: notification.createdAt,
          isRead: false,
          request: requestId
        }
      });

      // Send email notification
      const user = await User.findById(recipientId);
      if (user && user.email) {
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: title,
            html: `
              <h2>${title}</h2>
              <p>Dear ${user.name},</p>
              <p>${message}</p>
              <p>Please log in to the Budget Management System to take action.</p>
              <p>Best regards,<br>Budget Management System</p>
            `
          });

          notification.emailSent = true;
          await notification.save();
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
        }
      }
    }
  } catch (error) {
    console.error('Notification sending failed:', error);
  }
};