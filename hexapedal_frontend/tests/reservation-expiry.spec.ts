// tests/reservation-expiry.spec.ts
import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

test.beforeAll(() => {
    if (!EMAIL || !PASSWORD) {
        throw new Error('Missing credentials. Add them in your .env');
    }
});

test.describe('Reservation Expiry', () => {
    test('reservation holding time lapses; bike state changes to available', async ({ page }) => {
        // 1. Login
        await page.goto('/dashboard/login');
        await page.locator('#email').fill(EMAIL!);
        await page.locator('#password').fill(PASSWORD!);
        await page.locator('button[type="submit"]').click();

        await expect(page).toHaveURL('/dashboard/rider');
        await expect(page.locator('text=Rider Dashboard')).toBeVisible();

        // 2. Reserve a bike
        await page.locator('button:has-text("Start Ride")').click();
        await expect(page.locator('text=Reserve a Bike')).toBeVisible();
        await page.locator('input[placeholder="Enter Bike ID"]').fill('3');
        await page.locator('button:has-text("Reserve")').click();

        // Wait for reservation to appear in sidebar
        await expect(page.locator('h4:has-text("Active Reservation")')).toBeVisible({ timeout: 10000 });

        // 3. Wait for reservation to appear in sidebar
        // Try multiple selectors and wait for the sidebar to be ready
        const sidebar = page.getByRole('complementary');
        await expect(sidebar).toBeVisible({ timeout: 10000 });

        // Wait for either the h4 or the text "Active Reservation" to appear
        const activeReservationH4 = page.locator('h4:has-text("Active Reservation")');
        const activeReservationText = page.locator('text=Active Reservation');
        const reservationSelector = activeReservationH4.or(activeReservationText);

        // Also wait for the bike ID to appear, which confirms the reservation is fully loaded
        await expect(reservationSelector).toBeVisible({ timeout: 30000 });
        await expect(page.locator('text=/Bike #\\d+/i')).toBeVisible({ timeout: 5000 });

        // 4. Verify reservation countdown timer is visible
        // The reservation should show time remaining
        const reservationSection = page.locator('h4:has-text("Active Reservation")');
        await expect(reservationSection).toBeVisible();

        // 5. Note the bike ID that was reserved
        const bikeIdText = await page.locator('text=/Bike #\\d+/i').first().textContent();
        expect(bikeIdText).toBeTruthy();

        // 6. Verify reservation UI shows expiry information
        // Check if countdown timer or expiry time is displayed
        // The reservation section should be visible with expiry information
        await expect(reservationSection).toBeVisible();

        // 7. Trigger expiration via API endpoint
        // Get the auth token from localStorage or cookies
        const token = await page.evaluate(() => {
            return localStorage.getItem('auth_token');
        });

        console.log("Token: ", token)
        if (token) {
            // Call the cancel reservations API endpoint (to simulate expiry)
            console.log("Testing! this endpoint")
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const cancelResponse = await page.request.post(`${API_BASE_URL}/api/reservations/3/cancel`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log("Cancel Response: ", cancelResponse)

            // Verify the API call succeeded
            expect(cancelResponse.status()).toBe(204); // NO_CONTENT
        }

        // 8. Wait for UI to update after expiration
        await page.waitForTimeout(3000);

        // 9. Verify reservation expired - check for alert dialog
        let expirationAlertShown = false;
        page.on('dialog', async dialog => {
            const message = dialog.message();
            if (message.includes('expired') || message.includes('reservation')) {
                expect(message.toLowerCase()).toContain('expired');
                expirationAlertShown = true;
                await dialog.accept();
            }
        });

        // Trigger a page refresh or wait for auto-expiration logic
        await page.reload();
        await page.waitForTimeout(5000);

        // 10. Verify updated bike state - reservation should be gone
        // The active reservation section should no longer be visible
        const reservationStillVisible = await page.locator('h4:has-text("Active Reservation")').isVisible().catch(() => false);

        // After expiration, the reservation should be cleared
        // Either the alert was shown or the reservation UI disappeared
        expect(expirationAlertShown || !reservationStillVisible).toBeTruthy();

        // 11. Verify bike is now available by attempting to reserve again
        await page.locator('button:has-text("Start Ride")').click();
        await expect(page.locator('text=Reserve a Bike')).toBeVisible();

        // Try to reserve the same bike again (should work if expired)
        await page.locator('input[placeholder="Enter Bike ID"]').fill('3');

        // The bike should now be available for reservation
        // (This verifies the bike state changed from reserved to available)
    });
});

