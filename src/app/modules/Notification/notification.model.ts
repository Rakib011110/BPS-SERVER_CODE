import mongoose, { Schema } from 'mongoose';
import { TNotification } from './notification.interface';
import { NOTIFICATION_TYPE, NOTIFICATION_STATUS, NOTIFICATION_PRIORITY, NOTIFICATION_CHANNEL } from './notification.constant';

const notificationSchema = new Schema<TNotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      required: true
    },
    channel: {
      type: String,
      enum: Object.values(NOTIFICATION_CHANNEL),
      required: true,
      default: NOTIFICATION_CHANNEL.EMAIL
    },
    priority: {
      type: String,
      enum: Object.values(NOTIFICATION_PRIORITY),
      default: NOTIFICATION_PRIORITY.MEDIUM
    },
    recipient: {
      email: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      deviceToken: {
        type: String,
        trim: true
      }
    },
    subject: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    htmlContent: {
      type: String
    },
    template: {
      type: Schema.Types.ObjectId,
      ref: 'NotificationTemplate'
    },
    templateData: {
      type: Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: Object.values(NOTIFICATION_STATUS),
      default: NOTIFICATION_STATUS.PENDING
    },
    sentAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    },
    readAt: {
      type: Date
    },
    errorMessage: {
      type: String
    },
    retryCount: {
      type: Number,
      default: 0
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    relatedOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    relatedPayment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment'
    },
    relatedSubscription: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    relatedProduct: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    scheduledAt: {
      type: Date
    },
    expiresAt: {
      type: Date
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for better performance
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ scheduledAt: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if notification is read
notificationSchema.virtual('isRead').get(function() {
  return this.readAt !== undefined;
});

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.readAt = new Date();
  this.status = NOTIFICATION_STATUS.READ;
  return this.save();
};

// Instance method to mark as delivered
notificationSchema.methods.markAsDelivered = function() {
  this.deliveredAt = new Date();
  this.status = NOTIFICATION_STATUS.DELIVERED;
  return this.save();
};

// Instance method to mark as failed
notificationSchema.methods.markAsFailed = function(error: string) {
  this.errorMessage = error;
  this.status = NOTIFICATION_STATUS.FAILED;
  return this.save();
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({
    user: userId,
    status: { $nin: [NOTIFICATION_STATUS.READ] },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsReadForUser = function(userId: string) {
  return this.updateMany(
    { 
      user: userId,
      status: { $nin: [NOTIFICATION_STATUS.READ] }
    },
    { 
      readAt: new Date(),
      status: NOTIFICATION_STATUS.READ
    }
  );
};

// Static method to cleanup expired notifications
notificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Static method to find pending notifications
notificationSchema.statics.findPendingNotifications = function(limit = 100) {
  return this.find({
    status: NOTIFICATION_STATUS.PENDING,
    $or: [
      { scheduledAt: { $exists: false } },
      { scheduledAt: { $lte: new Date() } }
    ]
  }).limit(limit);
};

export const Notification = mongoose.model<TNotification>('Notification', notificationSchema);
export default Notification;