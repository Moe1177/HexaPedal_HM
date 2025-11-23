// tests/e2e/rider-happy-path.spec.ts
import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

test.beforeAll(() => {
    if (!EMAIL || !PASSWORD) {
        throw new Error('Missing credentials. Add them in your .env');
    }
});

test.describe('Rider Happy Path', () => {

    test('rider reserves bike, unlocks, rides, returns, and sees bill', async ({ page }) => {
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

        // 3. Unlock bike - use sidebar button specifically
        await page.getByRole('complementary').getByRole('button', { name: 'Unlock Bike' }).click();

        // 4. Select destination station
        await expect(page.locator('text=Choose Your Destination')).toBeVisible({ timeout: 10000 });
        await page.locator('text=Station B').first().click();
        await page.locator('button:has-text("Confirm & Unlock")').click();

        // 5. Verify trip started
        await expect(page.locator('h4:has-text("Active Trip")')).toBeVisible({ timeout: 20000 });

        // 6. Return bike - use sidebar button specifically
        await page.getByRole('complementary').getByRole('button', { name: 'Return Bike' }).click();

        // 7. Select return station
        await expect(page.locator('h2:has-text("Return Bike")')).toBeVisible({ timeout: 10000 });
        await page.locator('.space-y-3 > div').nth(1).click();

        // Click "Return Bike" button inside the modal (not sidebar)
        await page.locator('.fixed button:has-text("Return Bike")').click();

        // 8. Handle success alert
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Bike returned successfully');
            await dialog.accept();
        });

        await page.waitForTimeout(2000); // Wait for alert and state update

        // 9. Check billing and trip information
        await page.locator('button:has-text("Payment")').click();
        await expect(page.locator('text=Billing & Payment')).toBeVisible({ timeout: 10000 });
        
        // Verify billing information is displayed
        // Check for billing history or trip summary
        const billingContent = page.locator('text=Billing & Payment');
        await expect(billingContent).toBeVisible();
        
        // Verify trip information appears in billing history
        // Look for ride details (station names, cost, etc.)
        await expect(page.locator('text=/Ride|Trip|Station|Cost|CAD/i').first()).toBeVisible({ timeout: 5000 });
    });
});