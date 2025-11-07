package com.hexpedal.backend.model;

public enum SubscriptionPlan {
    MONTHLY("price_1SQd2A2QOR1PTnkYt1Lx3LjL", "Monthly", 0.0, 0.0, 0.0, 0.0, 0.0),
    YEARLY("price_1SQd1n2QOR1PTnkYIKC46uxy", "Yearly", 0.0, 0.0, 0.0, 0.0, 0.0);

    private final String stripePriceId;
    private final String displayName;
    private final double baseFee;
    private final double perMinuteRate;
    private final double perKmRate;
    private final double unlockFee;
    private final double subscriptionFee;

    SubscriptionPlan(String stripePriceId, String displayName, double baseFee, 
                     double perMinuteRate, double perKmRate, double unlockFee, 
                     double subscriptionFee) {
        this.stripePriceId = stripePriceId;
        this.displayName = displayName;
        this.baseFee = baseFee;
        this.perMinuteRate = perMinuteRate;
        this.perKmRate = perKmRate;
        this.unlockFee = unlockFee;
        this.subscriptionFee = subscriptionFee;
    }

    public String getStripePriceId() {
        return stripePriceId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public double getBaseFee() {
        return baseFee;
    }

    public double getPerMinuteRate() {
        return perMinuteRate;
    }

    public double getPerKmRate() {
        return perKmRate;
    }

    public double getUnlockFee() {
        return unlockFee;
    }

    public double getSubscriptionFee() {
        return subscriptionFee;
    }

    public static SubscriptionPlan fromStripePriceId(String priceId) {
        for (SubscriptionPlan plan : values()) {
            if (plan.stripePriceId.equals(priceId)) {
                return plan;
            }
        }
        throw new IllegalArgumentException("Unknown Stripe price ID: " + priceId);
    }
}

