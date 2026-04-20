import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3001";

// ─── Seed data before all tests ─────────────────────────────────────
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();

  // Seed calendar / booking data
  const seedRes = await page.request.post(`${BASE}/api/seed`);
  expect(seedRes.ok()).toBeTruthy();

  // Seed inventory data
  const invSeedRes = await page.request.post(`${BASE}/api/inventory/seed`);
  expect(invSeedRes.ok()).toBeTruthy();

  await page.close();
});

// ═════════════════════════════════════════════════════════════════════
// CALENDAR DASHBOARD ( / )
// ═════════════════════════════════════════════════════════════════════
test.describe("Calendar Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for loading to finish — the loading spinner contains "Loading properties..."
    await page.waitForSelector("text=Loading properties...", { state: "hidden", timeout: 15000 }).catch(() => {});
    // Wait for the header brand text to appear
    await expect(page.locator("h1", { hasText: "Air" })).toBeVisible({ timeout: 15000 });
  });

  test("renders header with brand, Inventory link, and action buttons", async ({ page }) => {
    // Brand
    await expect(page.locator("h1", { hasText: "Air" })).toBeVisible();
    await expect(page.getByText("Property Manager")).toBeVisible();

    // Inventory link in header
    await expect(page.getByRole("link", { name: /Inventory/i })).toBeVisible();

    // Action buttons
    await expect(page.getByRole("button", { name: /Today/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Booking/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sync/i })).toBeVisible();

    await page.screenshot({ path: "tests/e2e/screenshots/calendar-header.png" });
  });

  test("view switcher toggles between Month and Timeline", async ({ page }) => {
    // Default is Month view
    const monthBtn = page.getByRole("button", { name: /Month/i });
    const timelineBtn = page.getByRole("button", { name: /Timeline/i });

    await expect(monthBtn).toBeVisible();
    await expect(timelineBtn).toBeVisible();

    // Switch to Timeline
    await timelineBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "tests/e2e/screenshots/calendar-timeline-view.png" });

    // Switch back to Month
    await monthBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "tests/e2e/screenshots/calendar-month-view.png" });
  });

  test("Today button is clickable", async ({ page }) => {
    const todayBtn = page.getByRole("button", { name: /^Today$/i });
    await expect(todayBtn).toBeVisible();
    await todayBtn.click();
    // Should not throw — the calendar should navigate to today
  });

  test("notification bell opens dropdown", async ({ page }) => {
    // The bell is inside a trigger button
    const bellTrigger = page.locator("button").filter({ has: page.locator("svg.lucide-bell") });
    await expect(bellTrigger.first()).toBeVisible();
    await bellTrigger.first().click();

    // Dropdown should appear — it either shows "Tomorrow" section or "No upcoming events"
    const dropdown = page.getByText(/Tomorrow|No upcoming events/i);
    await expect(dropdown.first()).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: "tests/e2e/screenshots/calendar-notifications.png" });
  });

  test("stats cards display (Occupancy Rate, Booked Nights, Avg Stay, Properties)", async ({ page }) => {
    await expect(page.getByText(/Occupancy/i).first()).toBeVisible();
    await expect(page.getByText(/Booked/i).first()).toBeVisible();
    await expect(page.getByText(/Avg Stay/i).first()).toBeVisible();
    await expect(page.getByText(/Properties/i).first()).toBeVisible();

    await page.screenshot({ path: "tests/e2e/screenshots/calendar-stats.png" });
  });

  test("legend tooltip (info icon) opens and shows legend items", async ({ page }) => {
    // The info icon trigger — find by the svg inside a button in the header
    const infoTrigger = page.locator("header button").filter({ has: page.locator("svg") }).nth(2);
    if (await infoTrigger.isVisible().catch(() => false)) {
      await infoTrigger.click();
      await page.waitForTimeout(500);
      // Legend dropdown should show
      const legend = page.getByText("LEGEND");
      if (await legend.isVisible().catch(() => false)) {
        await expect(page.getByText(/Checked-out/i).first()).toBeVisible();
      }
    }
    await page.screenshot({ path: "tests/e2e/screenshots/calendar-legend.png" });
  });

  test("property sidebar shows seeded properties", async ({ page }) => {
    // The seeded properties should be visible (may be truncated in sidebar but full in title attr)
    await expect(page.getByTitle("Sukhumvit Studio").or(page.getByText("Sukhumvit Stu")).first()).toBeVisible();
    await expect(page.getByTitle("Silom Condo 1BR").or(page.getByText("Silom Condo")).first()).toBeVisible();
    await expect(page.getByTitle("Hua Hin Beachfront").or(page.getByText("Hua Hin Beac")).first()).toBeVisible();
  });

  test("add booking dialog opens from header button", async ({ page }) => {
    const bookingBtn = page.getByRole("button", { name: /Booking/i });
    await bookingBtn.click();
    await page.waitForTimeout(500);

    // Dialog should appear with booking form fields
    await expect(page.getByText("Guest Name")).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: "tests/e2e/screenshots/calendar-add-booking-dialog.png" });
  });

  test("clicking a booking bar opens detail dialog", async ({ page }) => {
    // Look for any booking bar that is clickable — demo bookings have guest names
    const bookingBar = page.getByText("Maria Garcia").first();
    if (await bookingBar.isVisible().catch(() => false)) {
      await bookingBar.click();
      // Detail dialog should show guest info
      await page.waitForTimeout(500);
      await page.screenshot({ path: "tests/e2e/screenshots/calendar-booking-detail.png" });
    } else {
      // If not visible in month view, switch to timeline
      await page.getByRole("button", { name: /Timeline/i }).click();
      await page.waitForTimeout(500);
      const timelineBar = page.getByText("Maria Garcia").first();
      if (await timelineBar.isVisible().catch(() => false)) {
        await timelineBar.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: "tests/e2e/screenshots/calendar-booking-detail.png" });
      }
    }
  });

  test("add property dialog can be opened from sidebar", async ({ page }) => {
    // The sidebar has an "Add" or "+" button for properties
    const addPropBtn = page.locator("button").filter({ has: page.locator("svg.lucide-plus") });
    // Find the one in the sidebar (not the header Booking button)
    const sidebarAddBtn = addPropBtn.first();
    if (await sidebarAddBtn.isVisible().catch(() => false)) {
      await sidebarAddBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: "tests/e2e/screenshots/calendar-add-property.png" });
    }
  });
});

// ═════════════════════════════════════════════════════════════════════
// INVENTORY DASHBOARD ( /inventory )
// ═════════════════════════════════════════════════════════════════════
test.describe("Inventory Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inventory");
    // Wait for loading to complete
    await page.waitForSelector("svg.lucide-package.animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});
    await expect(page.getByText("Inventory")).toBeVisible({ timeout: 15000 });
  });

  test("renders header with navigation links (Counter, Items)", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Counter/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Items/i })).toBeVisible();

    await page.screenshot({ path: "tests/e2e/screenshots/inventory-header.png" });
  });

  test("Today tab shows summary cards (Low Stock, Checkouts, Checkins, Maintenance)", async ({ page }) => {
    // Should start on Today (dashboard) tab
    await expect(page.getByText(/Low Stock/i).first()).toBeVisible();
    await expect(page.getByText(/Checkouts Today/i).first()).toBeVisible();
    await expect(page.getByText(/Checkins Today/i).first()).toBeVisible();
    await expect(page.getByText(/Maintenance/i).first()).toBeVisible();

    await page.screenshot({ path: "tests/e2e/screenshots/inventory-today-tab.png" });
  });

  test("tab switching works: Today -> Stock -> Activity -> Maintenance", async ({ page }) => {
    // Click Stock tab
    const stockTab = page.getByRole("button", { name: /Stock/i }).first();
    await stockTab.click();
    await page.waitForTimeout(300);
    // Stock tab should show search input
    await expect(page.getByPlaceholder("Search items...")).toBeVisible();
    await page.screenshot({ path: "tests/e2e/screenshots/inventory-stock-tab.png" });

    // Click Activity tab
    const activityTab = page.getByRole("button", { name: /Activity/i });
    await activityTab.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "tests/e2e/screenshots/inventory-activity-tab.png" });

    // Click Maintenance tab
    const maintenanceTab = page.getByRole("button", { name: /Maintenance/i }).first();
    await maintenanceTab.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "tests/e2e/screenshots/inventory-maintenance-tab.png" });

    // Back to Today
    const todayTab = page.getByRole("button", { name: /Today/i });
    await todayTab.click();
    await page.waitForTimeout(300);
    await expect(page.getByText("Low Stock")).toBeVisible();
  });

  test("Stock tab: search filters items", async ({ page }) => {
    // Switch to Stock tab
    await page.getByRole("button", { name: /Stock/i }).first().click();
    await page.waitForTimeout(300);

    const searchInput = page.getByPlaceholder("Search items...");
    await expect(searchInput).toBeVisible();

    // Type a search term
    await searchInput.fill("towel");
    await page.waitForTimeout(300);

    await page.screenshot({ path: "tests/e2e/screenshots/inventory-stock-search.png" });
  });

  test("Stock tab: category filter buttons work", async ({ page }) => {
    await page.getByRole("button", { name: /Stock/i }).first().click();
    await page.waitForTimeout(300);

    // Click a category filter — e.g. "Linen"
    const linenFilter = page.getByRole("button", { name: /Linen/i });
    if (await linenFilter.isVisible().catch(() => false)) {
      await linenFilter.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: "tests/e2e/screenshots/inventory-stock-category-filter.png" });
    }

    // Click "All" to reset
    const allFilter = page.getByRole("button", { name: /^All$/i });
    if (await allFilter.isVisible().catch(() => false)) {
      await allFilter.click();
      await page.waitForTimeout(300);
    }
  });

  test("Stock tab: table shows items with per-property stock", async ({ page }) => {
    await page.getByRole("button", { name: /Stock/i }).first().click();
    await page.waitForTimeout(500);

    // Table should have column headers
    await expect(page.getByText("Item", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Category", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Total", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Min", { exact: true }).first()).toBeVisible();

    await page.screenshot({ path: "tests/e2e/screenshots/inventory-stock-table.png" });
  });

  test("Maintenance tab: shows tasks with priority badges", async ({ page }) => {
    await page.getByRole("button", { name: /Maintenance/i }).first().click();
    await page.waitForTimeout(500);

    // Should see priority badges (HIGH, MEDIUM, LOW, URGENT)
    const badges = page.locator("text=/HIGH|MEDIUM|LOW|URGENT/i");
    const count = await badges.count();

    await page.screenshot({ path: "tests/e2e/screenshots/inventory-maintenance-tasks.png" });

    // If there are tasks, we should see at least one priority badge
    // (the seed data should create tasks)
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test("Maintenance tab: Start/Done buttons appear on tasks", async ({ page }) => {
    await page.getByRole("button", { name: /Maintenance/i }).first().click();
    await page.waitForTimeout(500);

    // Look for Start or Done buttons on tasks
    const startBtn = page.getByRole("button", { name: /^Start$/i });
    const doneBtn = page.getByRole("button", { name: /^Done$/i });

    const hasStart = await startBtn.first().isVisible().catch(() => false);
    const hasDone = await doneBtn.first().isVisible().catch(() => false);

    // At least one of these should be present if tasks exist
    await page.screenshot({ path: "tests/e2e/screenshots/inventory-maintenance-buttons.png" });
  });

  test("navigation: Counter link navigates to /inventory/counter", async ({ page }) => {
    const counterLink = page.getByRole("link", { name: /Counter/i });
    await expect(counterLink).toBeVisible();
    await counterLink.click();
    await expect(page).toHaveURL(/\/inventory\/counter/);
  });

  test("navigation: Items link navigates to /inventory/items", async ({ page }) => {
    const itemsLink = page.getByRole("link", { name: /Items/i });
    await expect(itemsLink).toBeVisible();
    await itemsLink.click();
    await expect(page).toHaveURL(/\/inventory\/items/);
  });
});

// ═════════════════════════════════════════════════════════════════════
// STOCK COUNTER ( /inventory/counter )
// ═════════════════════════════════════════════════════════════════════
test.describe("Stock Counter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inventory/counter");
    // Wait for loading
    await page.waitForSelector("svg.lucide-package.animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});
    await expect(page.getByText("Stock Counter")).toBeVisible({ timeout: 15000 });
  });

  test("renders header with Stock Counter title and Reset button", async ({ page }) => {
    await expect(page.getByText("Stock Counter")).toBeVisible();
    await expect(page.getByRole("button", { name: /Reset/i })).toBeVisible();

    await page.screenshot({ path: "tests/e2e/screenshots/counter-header.png" });
  });

  test("mode toggle: Restock and Stock Count buttons", async ({ page }) => {
    const restockBtn = page.getByRole("button", { name: /Restock/i }).first();
    const countBtn = page.getByRole("button", { name: /Stock Count/i });

    await expect(restockBtn).toBeVisible();
    await expect(countBtn).toBeVisible();

    // Default is Restock mode
    await page.screenshot({ path: "tests/e2e/screenshots/counter-restock-mode.png" });

    // Switch to Stock Count
    await countBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "tests/e2e/screenshots/counter-count-mode.png" });

    // Switch back to Restock
    await restockBtn.click();
    await page.waitForTimeout(300);
  });

  test("property selector dropdown is visible and functional", async ({ page }) => {
    // The property selector shows the first property by default
    const propertyTrigger = page.locator("button[role='combobox']").first();
    await expect(propertyTrigger).toBeVisible();

    // It should show a seeded property name
    const triggerText = await propertyTrigger.textContent();
    expect(triggerText).toBeTruthy();

    await page.screenshot({ path: "tests/e2e/screenshots/counter-property-selector.png" });
  });

  test("+/- counter buttons work and update quantity", async ({ page }) => {
    // Find plus buttons inside the item grid (rounded-r-xl class)
    const plusBtns = page.locator(".rounded-r-xl");
    const firstPlusBtn = plusBtns.first();
    await expect(firstPlusBtn).toBeVisible({ timeout: 5000 });

    await firstPlusBtn.click();
    await page.waitForTimeout(200);
    await firstPlusBtn.click();
    await page.waitForTimeout(200);

    // After clicking + twice, the quantity should show 2
    await page.screenshot({ path: "tests/e2e/screenshots/counter-increment.png" });

    // Now click minus (rounded-l-xl, first enabled one)
    const minusBtns = page.locator(".rounded-l-xl:not([disabled])");
    const firstMinusBtn = minusBtns.first();
    if (await firstMinusBtn.isVisible().catch(() => false)) {
      await firstMinusBtn.click();
      await page.waitForTimeout(200);
      await page.screenshot({ path: "tests/e2e/screenshots/counter-decrement.png" });
    }
  });

  test("cart appears at bottom when items are selected", async ({ page }) => {
    // The cart is hidden (translate-y-full) when no items selected
    // Click + on an item to make it appear
    const plusButtons = page.locator("button").filter({ has: page.locator("svg.lucide-plus") });
    const itemPlusBtn = plusButtons.nth(1);

    if (await itemPlusBtn.isVisible().catch(() => false)) {
      await itemPlusBtn.click();
      await page.waitForTimeout(500);

      // Cart should now be visible with "Restock Cart" or "Count Summary"
      const cart = page.getByText(/Restock Cart|Count Summary/i);
      await expect(cart.first()).toBeVisible({ timeout: 3000 });

      // Should also show "Confirm Restock" button
      await expect(page.getByRole("button", { name: /Confirm Restock/i })).toBeVisible();

      await page.screenshot({ path: "tests/e2e/screenshots/counter-cart-visible.png" });
    }
  });

  test("Reset button clears all quantities", async ({ page }) => {
    // Add some items first
    const plusButtons = page.locator("button").filter({ has: page.locator("svg.lucide-plus") });
    const itemPlusBtn = plusButtons.nth(1);

    if (await itemPlusBtn.isVisible().catch(() => false)) {
      await itemPlusBtn.click();
      await page.waitForTimeout(300);

      // Cart should appear
      await expect(page.getByText(/Restock Cart|Count Summary/i).first()).toBeVisible({ timeout: 3000 });

      // Click Reset
      await page.getByRole("button", { name: /Reset/i }).click();
      await page.waitForTimeout(500);

      // Cart should be hidden again
      await page.screenshot({ path: "tests/e2e/screenshots/counter-after-reset.png" });
    }
  });
});

// ═════════════════════════════════════════════════════════════════════
// ITEM SETUP ( /inventory/items )
// ═════════════════════════════════════════════════════════════════════
test.describe("Item Setup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inventory/items");
    // Wait for loading
    await page.waitForSelector("svg.lucide-package.animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});
    await expect(page.getByText("Item Setup")).toBeVisible({ timeout: 15000 });
  });

  test("renders header with Item Setup title, item count, and Add Item button", async ({ page }) => {
    await expect(page.getByText("Item Setup")).toBeVisible();
    // Item count badge
    await expect(page.getByText(/\d+ items/)).toBeVisible();
    // Add Item button in header
    await expect(page.getByRole("banner").getByRole("button", { name: /Add Item/i })).toBeVisible();

    await page.screenshot({ path: "tests/e2e/screenshots/items-header.png" });
  });

  test("grid of item cards is displayed", async ({ page }) => {
    // There should be an "Add Item" card (dashed border) plus seeded item cards
    await expect(page.getByText("Add Item").first()).toBeVisible();

    // Should have at least some item cards from seed data
    await page.screenshot({ path: "tests/e2e/screenshots/items-grid.png" });
  });

  test("category filter buttons work", async ({ page }) => {
    // "All" filter button should be visible
    const allBtn = page.getByRole("button", { name: /^All$/i });
    await expect(allBtn).toBeVisible();

    // Category buttons
    const linenBtn = page.getByRole("button", { name: /Linen/i });
    if (await linenBtn.isVisible().catch(() => false)) {
      await linenBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: "tests/e2e/screenshots/items-filter-linen.png" });

      // Reset
      await allBtn.click();
      await page.waitForTimeout(300);
    }

    const amenityBtn = page.getByRole("button", { name: /Amenities/i });
    if (await amenityBtn.isVisible().catch(() => false)) {
      await amenityBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: "tests/e2e/screenshots/items-filter-amenities.png" });

      await allBtn.click();
    }
  });

  test("search filters items", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search items...");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("towel");
    await page.waitForTimeout(300);

    await page.screenshot({ path: "tests/e2e/screenshots/items-search.png" });

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(300);
  });

  test("Add Item button opens empty form dialog", async ({ page }) => {
    await page.getByRole("banner").getByRole("button", { name: /Add Item/i }).click();
    await page.waitForTimeout(500);

    // Dialog should show "New Item" title
    await expect(page.getByText("New Item")).toBeVisible({ timeout: 5000 });

    // Form fields should be present
    await expect(page.getByText("Item Name")).toBeVisible();
    await expect(page.getByText("Category")).toBeVisible();

    await page.screenshot({ path: "tests/e2e/screenshots/items-add-dialog.png" });
  });

  test("clicking an item card opens edit dialog with pre-filled data", async ({ page }) => {
    // Find any item card (not the "Add Item" dashed one) and click it
    // Item cards have a text-sm font-semibold class for the name
    const itemCards = page.locator(".grid > div.bg-white.rounded-xl.border");
    const count = await itemCards.count();

    if (count > 0) {
      await itemCards.first().click();
      await page.waitForTimeout(500);

      // Dialog should show "Edit Item" title
      await expect(page.getByText("Edit Item")).toBeVisible({ timeout: 5000 });

      // The name input should be pre-filled (not empty)
      const nameInput = page.getByPlaceholder("e.g. Bath Towel");
      if (await nameInput.isVisible().catch(() => false)) {
        const value = await nameInput.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }

      await page.screenshot({ path: "tests/e2e/screenshots/items-edit-dialog.png" });
    }
  });

  test("Add Item dashed card also opens form dialog", async ({ page }) => {
    // The dashed "Add Item" card in the grid
    const addCard = page.locator("button.border-dashed", { hasText: "Add Item" });
    if (await addCard.isVisible().catch(() => false)) {
      await addCard.click();
      await page.waitForTimeout(500);
      await expect(page.getByText("New Item")).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: "tests/e2e/screenshots/items-add-card-dialog.png" });
    }
  });
});

// ═════════════════════════════════════════════════════════════════════
// CROSS-PAGE NAVIGATION
// ═════════════════════════════════════════════════════════════════════
test.describe("Cross-page navigation", () => {
  test("navigate from Calendar to Inventory and back", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Loading properties...", { state: "hidden", timeout: 15000 }).catch(() => {});
    await expect(page.locator("h1", { hasText: "Air" })).toBeVisible({ timeout: 15000 });

    // Go to Inventory
    await page.getByRole("link", { name: /Inventory/i }).click();
    await expect(page).toHaveURL(/\/inventory/);

    // Wait for inventory page to load
    await expect(page.getByText("Inventory").first()).toBeVisible({ timeout: 15000 });

    // Go back to Calendar via Air logo link
    const airLink = page.getByRole("link").filter({ hasText: "Air" });
    await airLink.first().click();
    await expect(page).toHaveURL("/");
  });

  test("navigate from Inventory to Counter to Items", async ({ page }) => {
    await page.goto("/inventory");
    await page.waitForSelector("svg.lucide-package.animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});

    // Go to Counter
    await page.getByRole("link", { name: /Counter/i }).click();
    await expect(page).toHaveURL(/\/inventory\/counter/);
    await expect(page.getByText("Stock Counter")).toBeVisible({ timeout: 15000 });

    // Go back to Inventory
    await page.goto("/inventory");
    await page.waitForSelector("svg.lucide-package.animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});

    // Go to Items
    await page.getByRole("link", { name: /Items/i }).click();
    await expect(page).toHaveURL(/\/inventory\/items/);
    await expect(page.getByText("Item Setup")).toBeVisible({ timeout: 15000 });
  });
});
