# FoodStall — Responsive Campus Food Ordering Website

A responsive, mobile-first website demo for campus food ordering in the DEBESMSCAT context. It runs in a web browser; it is not a native mobile application. All vendors, food, campus locations, prices, orders, and vendor actions are demonstration data. FoodStall is not represented as an official college service.

## Requirements

- Node.js 20.19+ or 22.12+ (Node 22 recommended for current Vite 8)
- npm

## Run locally

```bash
npm install
npm run dev
```

Vite prints a local URL (typically `http://localhost:5173`). Open it in a browser. The demo launches directly into the storefront; no login or account setup is required.

## Production build / preview

```bash
npm run typecheck
npm run build
npm run preview
```

## Main demo journeys

- Search by stall or dish, filter by category, open status, delivery support, and budget; sort results.
- Browse fictional stalls and menu items, customize portion sizes/add-ons, save favorites, and build a one-vendor cart.
- Checkout using pickup or campus-only demo delivery locations. Payment is cash at pickup or cash at handoff only.
- Place a local demo order, view its confirmation and tracking timeline, and revisit it from order history.
- Use **Vendor demo** to accept/reject orders, progress valid order statuses, manage menu items, and pause/open a stall.
- Use **Operations demo** to view cross-vendor demo state and reset the sample dataset.

## Restore the demo

In the interface, open the menu and select **Operations demo**, then choose **Restore demo data**. This clears FoodStall's local cart/favorites and restores the original sample vendors, menus, availability, and seed orders. The browser's localStorage is demonstration persistence only, not secure storage.

## Configuration and structure

- `src/config/brand.ts` — product name, campus wording, fee, and demonstration campus locations.
- `src/data/demoData.ts` — fictional vendors, categories, and food menu.
- `src/types/` — shared TypeScript data types.
- `src/lib/pricing.ts` — reusable cart and delivery-fee calculations.
- `src/lib/orderLifecycle.ts` — allowed status transitions and customer-facing labels.
- `src/lib/persistence.ts` — safe localStorage helpers.
- `src/app/App.tsx` — website shell, customer pages, local state, and demo vendor/operations tools.
- `src/styles/globals.css` — responsive design tokens and styles.

## Important prototype boundaries

- No backend, database, authentication, student verification, or server-side authorization.
- No real payment processing, GCash, external notifications, dispatch, GPS, or live vendor availability.
- Campus points are editable placeholders and are **not verified campus facilities**.
- Vendor identities, menus, ratings, availability, delivery fee, and order statuses are fictional demo data.
- Food imagery uses remote Unsplash source URLs, with an in-app fallback when an image fails. Internet may be required for images and the optional web font; the core UI and simulated flows are local.
- This is a frontend demonstration, not production-ready ordering software.

## Known limitations

- The prototype uses one local browser's state, so vendor/customer changes are not shared between devices or users. The optional profile is a local display name only, not an authenticated account.
- Order progress advances only when someone uses the demo vendor controls; there is no real-time service.
- Only cash at pickup/handoff is represented. No actual money is collected.

## Mobile usability refinements

- Phone layouts have dedicated type and spacing rules, including specific narrow-screen behavior at 320–380 px.
- Important mobile actions use larger tap areas; text fields use 16 px font sizes to avoid automatic zoom on iOS Safari focus.
- The cart reflows item details and quantity controls, checkout fields stack for narrow screens, and search filters wrap into a readable grid.
- Food customization uses a scrollable bottom sheet that respects safe-area insets and a dynamic viewport height.
- Mobile bottom navigation and toast messages account for the safe area and reserve space at the bottom of the page.
- These changes are source-level refinements; layout should still be verified in an actual browser after dependencies are installed.

## Recommended responsive QA before presentation

Run the website and inspect at 320×720, 360×800, 375×812, 390×844, 430×932, 768 px, 1024×768, 1280×800, 1440×900, and 1920 px. On phones, verify that the hero search is comfortably tappable, text wraps without clipping, category/filter rows remain usable, quantity controls do not collide with prices, checkout fields remain visible above the keyboard, and the bottom navigation does not cover the last action. Also test zoom, keyboard focus, reduced motion, and modal scrolling.

## Validation note for this handoff

- Demo-data integrity, menu/vendor references, configurable price calculations, delivery-fee calculations, and pickup/delivery status transitions passed isolated smoke tests.
- The stylesheet was parsed with zero CSS syntax errors.
- An isolated application-source TypeScript check passed with temporary declarations for unavailable third-party types; this is not a substitute for the full project typecheck.
- Dependency installation timed out in the generation environment, so the full `npm run typecheck`, production Vite build, and browser-based responsive/end-to-end tests were not completed here. After `npm install` succeeds locally, run `npm run typecheck` and `npm run build` as the next verification steps.


## Profile section

- A customer-facing profile overview is available without registration or student-ID verification.
- The optional display name is stored in localStorage and is used for new demo orders when the checkout name field is blank.
- The page shows counts for orders, completed orders, saved items, and cart quantity; provides shortcuts to orders, favorites, and cart; and lists the three most recent demo orders.
- The Profile destination is available in desktop navigation and the six-item mobile bottom navigation, as well as the mobile menu and header avatar on wider screens.
- Profile information is demonstration-only and should not be treated as secure account storage.

## Publish on GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`. It installs dependencies, runs the TypeScript project check, builds the Vite website, and publishes the `dist/` output to GitHub Pages whenever code is pushed to `main`. Vite uses relative built asset paths so the project can be hosted at a repository subpath.

### First-time setup

1. Create a repository on GitHub named `FoodStall` (or choose another name). If you choose another name, the relative Vite base path is still suitable.
2. Upload/push the **contents** of this project folder into the repository root. Do not upload `node_modules/` or `dist/`.
3. In the GitHub repository, open **Settings → Pages**. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Open the **Actions** tab and watch **Deploy FoodStall to GitHub Pages**. The first run begins when you push the `main` branch, or it can be started manually from the workflow page.
5. When the workflow succeeds, open **Settings → Pages** or the workflow summary to find the published website URL. For a regular repository it will usually be `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

### Push from a terminal

After creating an empty GitHub repository in your account, open a terminal in this folder and run (replace the URL with your repository URL):

```bash
git init
git add .
git commit -m "Prepare FoodStall website for GitHub Pages"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/FoodStall.git
git push -u origin main
```

If Git is already initialized, do not repeat `git init`; add the remote only if it does not already exist. GitHub may ask you to sign in using a browser or credential manager. Never put a GitHub password or personal access token into this README or source code.
