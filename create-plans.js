const mongoose = require("mongoose");
require("dotenv").config();

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    features: [{ type: String, required: true }],
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    duration: { type: Number, required: true, min: 1 },
    durationType: {
      type: String,
      enum: ["days", "months", "years"],
      default: "months",
    },
    trialPeriod: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    category: { type: String, required: true },
    maxUsers: { type: Number, default: 1, min: 1 },
    accessLevel: {
      type: String,
      enum: ["basic", "premium", "enterprise"],
      default: "basic",
    },
    includedProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],
    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "lifetime"],
      default: "monthly",
    },
    setupFee: { type: Number, min: 0 },
    cancellationPolicy: { type: String, default: "Cancel anytime" },
    refundPolicy: { type: String, default: "30-day money back guarantee" },
    supportLevel: {
      type: String,
      enum: ["basic", "priority", "dedicated"],
      default: "basic",
    },
    customBranding: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    storageLimit: { type: String },
    bandwidth: { type: String },
    slug: { type: String },
    metaTitle: { type: String },
    metaDescription: { type: String },
  },
  { timestamps: true }
);

const SubscriptionPlan = mongoose.model(
  "SubscriptionPlan",
  subscriptionPlanSchema
);

async function createSamplePlans() {
  try {
    await mongoose.connect(process.env.DB_URL, { dbName: "BPSDB" });
    console.log("Connected to database");

    // Check existing plans
    const existingPlans = await SubscriptionPlan.find({});
    console.log(`Found ${existingPlans.length} existing plans`);

    if (existingPlans.length > 0) {
      console.log("Existing plans:");
      existingPlans.forEach((plan) => {
        console.log(
          `- ${plan.name}: active=${plan.isActive}, featured=${plan.isFeatured}, price=${plan.price}`
        );
      });
    }

    // Create sample plans if none exist
    if (existingPlans.length === 0) {
      console.log("Creating sample subscription plans...");

      const samplePlans = [
        {
          name: "Basic Plan",
          description:
            "Perfect for individuals and small teams getting started",
          features: [
            "Up to 5 team members",
            "10GB storage",
            "Basic support",
            "Core features access",
            "Mobile app access",
          ],
          price: 999, // $9.99
          originalPrice: 1299,
          duration: 1,
          durationType: "months",
          trialPeriod: 7,
          isActive: true,
          isFeatured: false,
          category: "individual",
          maxUsers: 5,
          accessLevel: "basic",
          billingCycle: "monthly",
          supportLevel: "basic",
          storageLimit: "10GB",
          bandwidth: "100GB",
          slug: "basic-plan",
          metaTitle: "Basic Plan - Affordable Solution",
          metaDescription:
            "Get started with our basic plan featuring essential tools and 7-day free trial",
        },
        {
          name: "Professional Plan",
          description: "Advanced features for growing businesses",
          features: [
            "Up to 25 team members",
            "100GB storage",
            "Priority support",
            "Advanced analytics",
            "API access",
            "Custom integrations",
            "White-label options",
          ],
          price: 2499, // $24.99
          originalPrice: 3499,
          duration: 1,
          durationType: "months",
          trialPeriod: 14,
          isActive: true,
          isFeatured: true,
          category: "business",
          maxUsers: 25,
          accessLevel: "premium",
          billingCycle: "monthly",
          supportLevel: "priority",
          customBranding: true,
          apiAccess: true,
          storageLimit: "100GB",
          bandwidth: "1TB",
          slug: "professional-plan",
          metaTitle: "Professional Plan - Advanced Business Solution",
          metaDescription:
            "Scale your business with our professional plan featuring advanced tools and 14-day free trial",
        },
        {
          name: "Enterprise Plan",
          description: "Complete solution for large organizations",
          features: [
            "Unlimited team members",
            "Unlimited storage",
            "Dedicated support",
            "Advanced security",
            "Custom development",
            "SLA guarantee",
            "On-premise deployment",
            "24/7 phone support",
          ],
          price: 9999, // $99.99
          originalPrice: 14999,
          duration: 1,
          durationType: "months",
          trialPeriod: 30,
          isActive: true,
          isFeatured: false,
          category: "enterprise",
          maxUsers: 1000,
          accessLevel: "enterprise",
          billingCycle: "monthly",
          supportLevel: "dedicated",
          customBranding: true,
          apiAccess: true,
          storageLimit: "Unlimited",
          bandwidth: "Unlimited",
          slug: "enterprise-plan",
          metaTitle: "Enterprise Plan - Complete Business Solution",
          metaDescription:
            "Enterprise-grade solution with unlimited resources and dedicated support",
        },
      ];

      const createdPlans = await SubscriptionPlan.insertMany(samplePlans);
      console.log(`✅ Created ${createdPlans.length} subscription plans:`);
      createdPlans.forEach((plan) => {
        console.log(
          `- ${plan.name}: $${(plan.price / 100).toFixed(2)}/${
            plan.billingCycle
          }`
        );
      });
    } else {
      console.log("Plans already exist, skipping creation");
    }

    await mongoose.disconnect();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

createSamplePlans();
