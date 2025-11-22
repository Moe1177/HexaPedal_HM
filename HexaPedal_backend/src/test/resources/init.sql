-- Add UUID extension first
CREATE
EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE station_fullness AS ENUM (
    'balanced',
    'empty',
    'full',
    'almost full'
);

CREATE
OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at
= CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TABLE bikes
(
    id                            SERIAL PRIMARY KEY,
    bike_status                   VARCHAR(255) NOT NULL,
    reservation_exp_date          DATE,
    reservation_exp_time          TIME,
    type                          VARCHAR(255) NOT NULL,
    user_id                       BIGINT,
    trip_start_station_name       VARCHAR(255),
    trip_start_time               TIMESTAMP,
    trip_destination_latitude     DOUBLE PRECISION,
    trip_destination_longitude    DOUBLE PRECISION,
    trip_destination_station_id   BIGINT,
    trip_destination_station_name VARCHAR(255),
    CONSTRAINT bikes_bike_status_check CHECK ((bike_status = ANY
                                               (ARRAY['available', 'reserved', 'on_trip', 'maintenance'])))
);

CREATE TABLE docking_stations
(
    id                   BIGSERIAL PRIMARY KEY,
    address              VARCHAR(255) NOT NULL,
    bike_capacity        INTEGER      NOT NULL,
    name                 VARCHAR(255) NOT NULL,
    reservationhold_time TIME,
    status               VARCHAR(255) NOT NULL,
    latitude             DOUBLE PRECISION,
    longitude            DOUBLE PRECISION,
    CONSTRAINT docking_stations_status_check CHECK ((status = ANY (ARRAY['empty', 'full', 'out_of_service', 'active'])))
);

CREATE TABLE docks
(
    id         SERIAL PRIMARY KEY,
    bike_id    INTEGER,
    station_id BIGINT,
    CONSTRAINT uk_docks_bike_id UNIQUE (bike_id)
);

CREATE TABLE event
(
    event_type  VARCHAR(31)              NOT NULL,
    id          UUID                     NOT NULL PRIMARY KEY,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT
);

CREATE TABLE events
(
    id          UUID                     DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()             NOT NULL,
    description TEXT                     DEFAULT '',
    event_type  TEXT
);

CREATE TABLE payment_methods
(
    id                         BIGSERIAL PRIMARY KEY,
    active                     BOOLEAN      NOT NULL,
    city                       VARCHAR(255),
    country                    VARCHAR(255),
    line1                      VARCHAR(255),
    line2                      VARCHAR(255),
    postal_code                VARCHAR(255),
    state                      VARCHAR(255),
    brand                      VARCHAR(255),
    card_holder_name           VARCHAR(255),
    default_method             BOOLEAN      NOT NULL,
    exp_month                  INTEGER,
    exp_year                   INTEGER,
    last4                      VARCHAR(255),
    provider                   VARCHAR(255) NOT NULL,
    provider_payment_method_id VARCHAR(255) NOT NULL UNIQUE,
    type                       VARCHAR(255) NOT NULL,
    user_id                    BIGINT       NOT NULL,
    CONSTRAINT payment_methods_brand_check CHECK ((brand = ANY (ARRAY['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER', 'OTHER']))),
    CONSTRAINT payment_methods_provider_check CHECK ((provider = ANY (ARRAY['STRIPE', 'ADYEN', 'PAYPAL']))),
    CONSTRAINT payment_methods_type_check CHECK ((type = ANY (ARRAY['CARD', 'BANK_ACCOUNT', 'WALLET'])))
);

CREATE TABLE reservation_history
(
    id                     BIGSERIAL PRIMARY KEY,
    claimed_at             TIMESTAMP WITH TIME ZONE,
    created_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    outcome                VARCHAR(255)             NOT NULL,
    outcome_changed_at     TIMESTAMP WITH TIME ZONE,
    reservation_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reservation_expiry_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at             TIMESTAMP WITH TIME ZONE,
    bike_id                INTEGER                  NOT NULL,
    rider_id               BIGINT                   NOT NULL,
    CONSTRAINT reservation_history_outcome_check CHECK ((outcome = ANY (ARRAY['PENDING', 'CLAIMED', 'EXPIRED', 'CANCELLED'])))
);

CREATE TABLE rider_loyalty
(
    id                                        BIGSERIAL PRIMARY KEY,
    created_at                                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_tier                              VARCHAR(255) NOT NULL,
    last_evaluated_at                         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_tier_notification_shown              BOOLEAN NOT NULL DEFAULT FALSE,
    missed_reservations_last_year             INTEGER DEFAULT 0,
    previous_tier                             VARCHAR(255) DEFAULT 'NONE',
    successful_claimed_reservations_last_year INTEGER DEFAULT 0,
    tier_changed_at                           TIMESTAMP WITH TIME ZONE,
    total_successful_returns                  INTEGER DEFAULT 0,
    total_trips                               INTEGER DEFAULT 0,
    trips_last_year                           INTEGER DEFAULT 0,
    updated_at                                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id                                   BIGINT NOT NULL UNIQUE,
    CONSTRAINT rider_loyalty_current_tier_check CHECK ((current_tier = ANY (ARRAY['NONE', 'BRONZE', 'SILVER', 'GOLD']))),
    CONSTRAINT rider_loyalty_previous_tier_check CHECK ((previous_tier = ANY (ARRAY['NONE', 'BRONZE', 'SILVER', 'GOLD'])))
);

CREATE TABLE rides
(
    ride_id           BIGSERIAL PRIMARY KEY,
    user_id           BIGINT                     NOT NULL,
    start_location    VARCHAR(255)               NOT NULL,
    end_location      VARCHAR(255)               NOT NULL,
    duration          DOUBLE PRECISION           NOT NULL,
    distance          DOUBLE PRECISION           NOT NULL,
    cost              DOUBLE PRECISION DEFAULT 0 NOT NULL,
    start_timestamp   TIMESTAMP WITH TIME ZONE,
    end_timestamp     TIMESTAMP WITH TIME ZONE,
    bike_id           BIGINT,
    flex_dollars_used INTEGER
);

CREATE TABLE subscription_plans
(
    id              BIGSERIAL PRIMARY KEY,
    plan_type       VARCHAR(255)         NOT NULL UNIQUE,
    name            VARCHAR(255)         NOT NULL,
    price           NUMERIC(10, 2)       NOT NULL,
    stripe_price_id VARCHAR(255),
    description     VARCHAR(500),
    active          BOOLEAN DEFAULT true NOT NULL,
    rate_per_minute NUMERIC(10, 2),
    CONSTRAINT chk_plan_type CHECK ((plan_type = ANY (ARRAY['MONTHLY', 'YEARLY', 'PAY_PER_TRIP'])))
);

CREATE TABLE trucks
(
    truck_id BIGSERIAL PRIMARY KEY,
    capacity INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE truck_bikes
(
    truck_id BIGINT  NOT NULL,
    bike_id  INTEGER NOT NULL
);

CREATE TABLE user_subscriptions
(
    id                     BIGSERIAL PRIMARY KEY,
    user_id                BIGINT                              NOT NULL,
    plan_id                BIGINT                              NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status                 VARCHAR(255)                        NOT NULL,
    current_period_start   TIMESTAMP,
    current_period_end     TIMESTAMP,
    cancel_at_period_end   BOOLEAN   DEFAULT false,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_subscription_status CHECK ((status = ANY
                                               (ARRAY['ACTIVE', 'CANCELLED', 'PAST_DUE', 'INCOMPLETE', 'TRIALING',
                                                'UNPAID'])))
);

CREATE TABLE users
(
    id                      BIGSERIAL PRIMARY KEY,
    full_name               VARCHAR(255),
    address                 VARCHAR(255),
    role                    VARCHAR(31),
    username                VARCHAR(255) NOT NULL,
    email                   VARCHAR(255),
    password                VARCHAR(255),
    enabled                 BOOLEAN,
    verification_code       VARCHAR(255),
    verification_expiration TIMESTAMP WITH TIME ZONE,
    truck_id                BIGINT UNIQUE,
    stripe_customer_id      VARCHAR(255) UNIQUE,
    flex_dollars            INTEGER
);

-- Create indexes
CREATE INDEX idx_outcome_created ON reservation_history (outcome, reservation_created_at);
CREATE INDEX idx_rider_created ON reservation_history (rider_id, reservation_created_at);
CREATE INDEX idx_rides_bike_id ON rides (bike_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions (status);
CREATE INDEX idx_user_subscriptions_stripe_id ON user_subscriptions (stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions (user_id);
CREATE INDEX idx_user_subscriptions_user_status ON user_subscriptions (user_id, status);

-- Create triggers
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE
    ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Foreign key constraints
ALTER TABLE users
    ADD CONSTRAINT fk_users_truck FOREIGN KEY (truck_id) REFERENCES trucks (truck_id);
ALTER TABLE reservation_history
    ADD CONSTRAINT fk_reservation_history_rider FOREIGN KEY (rider_id) REFERENCES users (id);
ALTER TABLE rides
    ADD CONSTRAINT fk_rides_bike FOREIGN KEY (bike_id) REFERENCES bikes (id) ON DELETE SET NULL;
ALTER TABLE user_subscriptions
    ADD CONSTRAINT fk_user_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans (id) ON DELETE RESTRICT;
ALTER TABLE user_subscriptions
    ADD CONSTRAINT fk_user_subscriptions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE truck_bikes
    ADD CONSTRAINT fk_truck_bikes_bike FOREIGN KEY (bike_id) REFERENCES bikes (id);
ALTER TABLE payment_methods
    ADD CONSTRAINT fk_payment_methods_user FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE docks
    ADD CONSTRAINT fk_docks_station FOREIGN KEY (station_id) REFERENCES docking_stations (id);
ALTER TABLE docks
    ADD CONSTRAINT fk_docks_bike FOREIGN KEY (bike_id) REFERENCES bikes (id);
ALTER TABLE bikes
    ADD CONSTRAINT fk_bikes_user FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE rides
    ADD CONSTRAINT fk_rides_user FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE reservation_history
    ADD CONSTRAINT fk_reservation_history_bike FOREIGN KEY (bike_id) REFERENCES bikes (id);
ALTER TABLE truck_bikes
    ADD CONSTRAINT fk_truck_bikes_truck FOREIGN KEY (truck_id) REFERENCES trucks (truck_id);
ALTER TABLE rider_loyalty
    ADD CONSTRAINT fk_rider_loyalty_user FOREIGN KEY (user_id) REFERENCES users (id);


-- Testing seed

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================
INSERT INTO public.subscription_plans (id, plan_type, name, price, stripe_price_id, description, active,
                                       rate_per_minute)
VALUES (3, 'PAY_PER_TRIP', 'Pay Per Trip', 0.00, NULL, 'Pay as you go at $0.01 CAD per minute', TRUE, 0.01),
       (1, 'MONTHLY', 'Monthly Subscription', 12.00, 'price_1SQd2A2QOR1PTnkYt1Lx3LjL',
        'Unlimited rides for one month at $12 CAD/month', TRUE, 0.00),
       (2, 'YEARLY', 'Yearly Subscription', 100.00, 'price_1SQd1n2QOR1PTnkYIKC46uxy',
        'Unlimited rides for one year at $100 CAD/year', TRUE, 0.00);


-- ============================================================
-- USERS, Password: TestPassword123!
-- ============================================================

-- Rider WITH subscription
INSERT INTO public.users (id, full_name, address, role, username, email, password, enabled, flex_dollars)
VALUES (1001, 'Test Rider Sub', '123 Test St', 'RIDER', 'testsub', 'testsub@example.com',
        '$2a$10$xn3LI/AjqicFYZFruSwve.681477XaVNaUQbr1gioaWPn4t1KsnmG', TRUE, 0);

-- Rider WITHOUT subscription
INSERT INTO public.users (id, full_name, address, role, username, email, password, enabled, flex_dollars)
VALUES (1002, 'Test Rider Free', '456 Free St', 'RIDER', 'testfree', 'testfree@example.com',
        '$2a$10$xn3LI/AjqicFYZFRuSwve.681477XaVNaUQbr1gioaWPn4t1KsnmG', TRUE, 0);


-- ============================================================
-- USER SUBSCRIPTIONS (Only Rider 1001)
-- ============================================================

INSERT INTO public.user_subscriptions
(id, user_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end)
VALUES (5001, 1001, 1, 'ACTIVE', NOW(), NOW() + INTERVAL '30 days', FALSE);


-- ============================================================
-- RIDER LOYALTY
-- ============================================================

INSERT INTO public.rider_loyalty
(id, user_id, current_tier, created_at, total_trips, total_successful_returns, last_tier_notification_shown)
VALUES
    (7001, 1001, 'BRONZE', NOW(), 10, 9, FALSE),
    (7002, 1002, 'NONE', NOW(), 0, 0, FALSE);
-- ============================================================
-- TRUCKS
-- ============================================================

INSERT INTO public.trucks (truck_id, capacity)
VALUES (2001, 10);


-- ============================================================
-- DOCKING STATIONS
-- ============================================================

INSERT INTO public.docking_stations (id, address, bike_capacity, name, status, latitude, longitude)
VALUES (1, '100 Station Ave', 10, 'Station A', 'active', 45.5017, -73.5673),
       (2, '200 Station Blvd', 10, 'Station B', 'active', 45.5020, -73.5680);


-- ============================================================
-- BIKES
-- ============================================================

INSERT INTO public.bikes (id, bike_status, type)
VALUES (1, 'available', 'regular'),
       (2, 'available', 'regular'),
       (3, 'available', 'regular'),
       (4, 'available', 'regular'),
       (5, 'available', 'regular'),
       (6, 'maintenance', 'regular');

SELECT setval('bikes_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM bikes));
-- ============================================================
-- DOCKS (link bikes to stations)
-- ============================================================

INSERT INTO public.docks (id, bike_id, station_id)
VALUES (1, 1, 1),
       (2, 2, 1),
       (3, 3, 1),
       (4, 4, 2),
       (5, NULL, 2),
       (6, NULL, 1);


-- ============================================================
-- TRUCK_BIKES (truck carries bike #6)
-- ============================================================

INSERT INTO public.truck_bikes (truck_id, bike_id)
VALUES (2001, 6);


-- ============================================================
-- PAYMENT METHODS (1 method for Rider 1001)
-- ============================================================

INSERT INTO public.payment_methods
(id, active, default_method, brand, provider, provider_payment_method_id, type, user_id, exp_month, exp_year, last4,
 card_holder_name)
VALUES (3001, TRUE, TRUE, 'VISA', 'STRIPE', 'pm_test_123', 'CARD', 1001, 12, 2050, '4242', 'Test Rider Sub');


-- ============================================================
-- RESERVATION HISTORY (example)
-- ============================================================

INSERT INTO public.reservation_history
(id, bike_id, rider_id, outcome, reservation_created_at, reservation_expiry_at, claimed_at)
VALUES (4001, 2, 1001, 'CLAIMED', NOW() - INTERVAL '5 minutes', NOW() + INTERVAL '10 minutes',
        NOW() - INTERVAL '4 minutes');


-- ============================================================
-- RIDES (example)
-- ============================================================

INSERT INTO public.rides
(ride_id, user_id, bike_id, start_location, end_location, duration, distance, start_timestamp, end_timestamp, cost)
VALUES (6001, 1001, 1, 'Station A', 'Station B', 600, 2.3, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '50 minutes', 0);

-- Add the missing is_guest column to users table
ALTER TABLE users ADD COLUMN is_guest BOOLEAN DEFAULT false;

-- Update the existing users to have is_guest = false
UPDATE users SET is_guest = false WHERE is_guest IS NULL;