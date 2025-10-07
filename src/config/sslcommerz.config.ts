// config/sslcommerz.config.ts
import config from "./index";

interface SSLCommerzConfig {
  storeId: string;
  storePassword: string;
  isLive: boolean;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}

export const getSSLCommerzConfig = (): SSLCommerzConfig => {
  // 🔧 Force sandbox mode for development
  const isProduction = false; // Always use sandbox for now

  console.log("🔧 Environment Detection:", {
    NODE_ENV: process.env.NODE_ENV,
    isProduction,
    forcedSandbox: true,
  });

  // ✅ READ FROM ENVIRONMENT VARIABLES (.env file)
  const sslConfig = {
    storeId: config.sslcommerz_store_id || "",
    storePassword: config.sslcommerz_store_password || "",
    isLive: false, // Always false for sandbox testing
    successUrl: config.ssl_payment_success_url || "",
    failUrl: config.ssl_payment_fail_url || "",
    cancelUrl: config.ssl_payment_cancel_url || "",
    ipnUrl: config.ssl_payment_ipn_url || "",
  };

  // ✅ Validate required fields
  if (!sslConfig.storeId || !sslConfig.storePassword) {
    throw new Error(
      "SSLCommerz credentials missing! Check SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD in .env file"
    );
  }

  if (
    !sslConfig.successUrl ||
    !sslConfig.failUrl ||
    !sslConfig.cancelUrl ||
    !sslConfig.ipnUrl
  ) {
    throw new Error(
      "SSLCommerz payment URLs missing! Check SSL_PAYMENT_* variables in .env file"
    );
  }

  console.log("✅ SSLCommerz Config Loaded:", {
    storeId: sslConfig.storeId,
    isLive: sslConfig.isLive,
    successUrl: sslConfig.successUrl,
    ipnUrl: sslConfig.ipnUrl,
  });

  return sslConfig;
};

export const validateSSLCommerzEnvironment = (): boolean => {
  try {
    const sslConfig = getSSLCommerzConfig();

    console.log("🔧 Validating SSLCommerz Configuration:", {
      storeId: sslConfig.storeId,
      isLive: sslConfig.isLive,
      successUrl: sslConfig.successUrl,
      failUrl: sslConfig.failUrl,
      cancelUrl: sslConfig.cancelUrl,
      ipnUrl: sslConfig.ipnUrl,
    });

    // Validate required fields (already done in getSSLCommerzConfig)
    if (!sslConfig.storeId || !sslConfig.storePassword) {
      throw new Error("Store ID and Password are required");
    }

    // Additional validation for production
    if (sslConfig.isLive) {
      // Check if URLs are HTTPS in production
      const httpsUrls = [
        sslConfig.successUrl,
        sslConfig.failUrl,
        sslConfig.cancelUrl,
        sslConfig.ipnUrl,
      ];
      const invalidUrls = httpsUrls.filter(
        (url) => !url.startsWith("https://")
      );

      if (invalidUrls.length > 0) {
        console.warn("⚠️  Production URLs should use HTTPS:", invalidUrls);
      }
    } else {
      // Development mode - allow localhost URLs
      console.log(
        "✅ Development mode: Using sandbox credentials and localhost URLs"
      );
    }

    console.log("✅ SSLCommerz configuration is valid!");
    return true;
  } catch (error) {
    console.error("❌ SSLCommerz configuration validation failed:", error);
    return false;
  }
};

// Export for use in other modules
export default {
  getSSLCommerzConfig,
  validateSSLCommerzEnvironment,
};
