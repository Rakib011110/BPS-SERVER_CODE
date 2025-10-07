import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,
  BASE_URL: process.env.BASE_URL,
  db_url: process.env.DB_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  admin_email: process.env.ADMIN_EMAIL,

  email_host: process.env.EMAIL_HOST,
  email_port: process.env.EMAIL_PORT,
  email_user: process.env.EMAIL_USER,
  email_pass: process.env.EMAIL_PASS,
  email_from: process.env.EMAIL_FROM,
  client_url: process.env.CLIENT_URL,

  // Bulk SMS Configuration
  bulk_sms_api_key: process.env.BULK_SMS_API_KEY,
  bulk_sms_sender_id: process.env.BULK_SMS_SENDER_ID,
  bulk_sms_base_url: process.env.BULK_SMS_BASE_URL,

  // Payment Gateway Configuration

  // SSLCommerz Configuration
  sslcommerz_store_id: process.env.SSLCOMMERZ_STORE_ID,
  sslcommerz_store_password: process.env.SSLCOMMERZ_STORE_PASSWORD,
  ssl_payment_success_url: process.env.SSL_PAYMENT_SUCCESS_URL,
  ssl_payment_fail_url: process.env.SSL_PAYMENT_FAIL_URL,
  ssl_payment_cancel_url: process.env.SSL_PAYMENT_CANCEL_URL,
  ssl_payment_ipn_url: process.env.SSL_PAYMENT_IPN_URL,

  //   admin_password: process.env.ADMIN_PASSWORD,
  //   admin_profile_photo: process.env.ADMIN_PROFILE_PHOTO,
  //   admin_mobile_number: process.env.ADMIN_MOBILE_NUMBER,
  //   cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  //   cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  //   cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  //   meilisearch_host: process.env.MEILISEARCH_HOST,
  //   meilisearch_master_key: process.env.MEILISEARCH_MASTER_KEY,
  //   sender_email: process.env.SENDER_EMAIL,
  //   sender_app_password: process.env.SENDER_APP_PASS,
};
