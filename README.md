# 💰 Smart Envelopes

Smart Envelopes is a browser-based **envelope budgeting** app. Instead of tracking spending against one big pool of money, you divide your income into labeled "envelopes" (Groceries, Rent, Car, Savings...) and only spend what's actually in each envelope. It works entirely in your browser — your data is saved on your device (with optional cloud backup), no account or server required.

## Core idea: envelope budgeting in 3 numbers

Every envelope tracks three numbers:

| | Meaning |
|---|---|
| **Planned** | Your monthly target for this envelope (e.g. $500 for Groceries) |
| **Funded** | Money you've actually put into the envelope so far |
| **Spent** | Money you've spent out of the envelope |

You can only spend money that's been **funded**. The dashboard at the top of the app shows these totals across all envelopes, plus **Available to Fund** — how much of your income hasn't been assigned to an envelope yet.

## Getting started

1. **Create envelopes** — click **+ Create Envelope**, give it a name, a monthly planned amount, and a category (e.g. Needs/Wants/Savings, or your own).
2. **Add income** — click **💵 Add Income** each time you get paid. Record the source, amount, date, and frequency.
3. **Fund your envelopes** — click **🔥 Fund Envelopes** to distribute your available income across envelopes. This is the "give every dollar a job" step.
4. **Spend from an envelope** — open an envelope and click to log a purchase against it. The envelope's Spent total goes up and its remaining balance (Funded − Spent) goes down.

That's the whole loop: **add income → fund envelopes → spend from envelopes**, repeated every payday.

## Feature guide

### Envelopes
- Click an envelope to see its balance and log transactions against it (spend, or view history).
- Edit an envelope's name, planned amount, or category, or delete it (deleting also removes its transaction history).
- Use the category filter bar to view envelopes grouped by category (e.g. only "Wants").

### Income & allocation status
- **💵 Add Income** logs a paycheck or other income with a source, amount, date, frequency, and optionally which bank account it landed in.
- **⚙️ Tools → 📊 Manage Income** lists every income record and shows its allocation status:
  - **○ Not yet allocated** — none of this income has been funded to envelopes yet
  - **◐ Partially allocated** — part of it has been funded
  - **✓ Fully allocated** — all of it has been funded
  - Income is allocated **oldest-first**: when you fund envelopes, the app draws from your oldest unallocated paycheck before newer ones.
- Editing or deleting income that's already been allocated shows a warning, since it can make "Available to Fund" go negative.

### Fund Envelopes
Click **🔥 Fund Envelopes** to see how much income is available and distribute it across envelopes in one step. You don't have to fund an envelope's full planned amount at once — partial funding is fine, and unfunded amounts just roll forward as "Available to Fund."

### Funding Templates
If your paycheck gets split into envelopes the same way every time, save that split as a **Funding Template** (Templates → Funding Templates). Applying a template instantly runs that same allocation plan again instead of re-entering it by hand.

### Spending Templates
For recurring bills (rent, subscriptions, utilities), create a **Spending Template** (Templates → Spending Templates) listing each recurring expense, its envelope, amount, and day of the month. From an account's register, you can **"Load as Pending"** to drop all of a template's expenses in as pending transactions for the month, then mark each one cleared (✓) as it actually happens — a quick way to pre-stage a month's known bills.

### Accounts & the register
**🏦 Accounts** lets you track actual bank/cash accounts alongside your envelopes. Each account has its own **register** (a transaction ledger) where you can:
- Log transactions as **cleared** (money has actually moved) or **pending** (expected but not yet happened)
- Transfer money between accounts
- See a running account balance

This is a second, complementary view of your money: envelopes track *what it's for*, accounts track *where it physically sits*.

### Reports tab
Switch to the **📊 Reports** tab for a monthly overview: total income vs. allocated vs. spent, a spending-by-category breakdown, your top spending envelopes, and a **Budget Performance** bar for each envelope showing percent of its planned amount spent (turns amber near 90%, red past 100%).

### Cash Flow Calendar
**⚙️ Tools → 📊 Cash Flow** projects your bank balance forward 30 days based on upcoming income and pending transactions, so you can spot a low-balance day before it happens. Enter your current bank balance once to anchor the projection.

### Categories
**⚙️ Tools → 🏷️ Manage Categories** lets you rename or remove the category labels used to group envelopes (e.g. Needs / Wants / Savings, or your own custom set).

### Monthly rollover
Click the **📅** month button, then **➡️ Start New Month** at the end of a budgeting period. You choose:
- **Rollover Unspent Funds** — leftover money in each envelope carries into next month
- **Reset to Zero** — every envelope starts fresh at $0 funded

Your planned amounts stay the same either way, and the closed month is saved to **Month Archives** so you can look back at it later. Income history is never deleted by this — it's kept permanently so past allocation status stays accurate.

### Multiple budgets
Use the **Budget** dropdown (top of the page) and **Manage Budgets** to keep entirely separate budgets side by side — for example, "My Home" and "Rental Property." Each budget has its own envelopes, income, accounts, and templates; switching the dropdown switches your whole workspace.

### Backup & sync
Your data lives in the browser (localStorage), tied to this device and browser. From **⚙️ Tools** you can:
- **💾 Export Data / 📂 Import Data** — save/load a JSON backup file
- **☁️ Save to Cloud / ⬇️ Load from Cloud** — manually back up to (or restore from) cloud storage, so you can move data to another device
- **🚨 Reset All Data** — wipe everything and start over (irreversible — export a backup first if in doubt)

## Tips
- Fund envelopes right after you get paid so "Available to Fund" reflects reality.
- If an envelope keeps running out before the month ends, its Planned amount is probably too low — adjust it rather than borrowing from another envelope.
- Set up Funding and Spending Templates once your budget stabilizes; they turn a 10-step monthly routine into a couple of clicks.
