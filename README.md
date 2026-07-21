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
2. **Add income** — switch to the **💵 Income** tab and click **+ Add Income** each time you get paid. Record the source, amount, date, and frequency.
3. **Fund your envelopes** — click **🔥 Fund Envelopes** to distribute your available income across envelopes. This is the "give every dollar a job" step.
4. **Spend from an envelope** — click **💳 Spend** on an envelope's row to log a purchase against it. The envelope's Spent total goes up and its remaining balance (Funded − Spent) goes down.

That's the whole loop: **add income → fund envelopes → spend from envelopes**, repeated every payday. Once that feels familiar and your paycheck split / regular bills stop changing, set up **Templates** (below) so steps 2-4 take one click instead of manual re-entry each time.

## The tabs

The app is organized into five tabs, always visible at the top: **💰 Budget** (envelopes + dashboard), **📊 Reports**, **🏦 Accounts**, **💵 Income**, and **📊 Cash Flow**. Anything you'd do often lives in a tab; less-frequent setup tasks (Templates, Categories, multi-budget management, backup) live under the **📋 Templates** and **⚙️ Tools** menus instead.

## Feature guide

### Envelopes
Envelopes are listed in a table on the **💰 Budget** tab, with Planned/Funded/Spent/Balance columns. Each row keeps just one button visible plus a **⋮** menu for everything else:
- **💳 Spend** — log a purchase against that envelope (its Spent goes up, Balance goes down).
- **⋮** menu — **📋 History** (view that envelope's transaction history), **✏️ Edit** (change its name, planned amount, or category), and **🗑️ Delete** (removes it and its transaction history).
- The **Planned** amount is also directly click-to-edit inline, without opening the Edit modal.
- Use the category filter bar to view envelopes grouped by category (e.g. only "Wants").

### Income & allocation status
The **💵 Income** tab shows every income record as a tile (two per row), plus summary stats (Total Income / Allocated / Unallocated / Income Records) at the top:
- Click **+ Add Income** (in this tab) to log a paycheck or other income — source, amount, date, frequency, and optionally which bank account it landed in.
- Click any income tile to open it for editing — that same screen also has a **🗑️ Delete** button, so you won't find separate Edit/Delete buttons cluttering the tile itself.
- Each tile shows its allocation status:
  - **○ Not yet allocated** — none of this income has been funded to envelopes yet
  - **◐ Partially allocated** — part of it has been funded
  - **✓ Fully allocated** — all of it has been funded
  - Income is allocated **oldest-first**: when you fund envelopes, the app draws from your oldest unallocated paycheck before newer ones.
- Editing or deleting income that's already been allocated shows a warning, since it can make "Available to Fund" go negative.

### Fund Envelopes
Click **🔥 Fund Envelopes** to see how much income is available and distribute it across envelopes in one step. You don't have to fund an envelope's full planned amount at once — partial funding is fine, and unfunded amounts just roll forward as "Available to Fund."

### Templates: set up once, apply in one click
Templates exist purely to save time on the parts of your budget that repeat every month — the same paycheck split, the same list of bills. You do the data entry once; after that, applying a template is a single click instead of redoing the manual steps. There are two kinds, for the two recurring routines in the app: **funding** your envelopes, and **recording** your recurring bills.

#### Funding Templates — for the paycheck-to-envelope split you always make
If a given paycheck gets divided across envelopes the same way every time, save that split once and apply it every payday instead of re-entering it in **🔥 Fund Envelopes** by hand.

1. Go to **📋 Templates → Funding Templates → + Create New Template**.
2. Name it after the paycheck it represents (e.g. "Job 1 - Biweekly").
3. Set **Day of Month** — the day this paycheck usually lands (1-31).
4. Set **Expected Amount** — the paycheck's usual total.
5. Under **Allocation Plan**, enter how much should go to each envelope. Watch the **Remaining** figure in the summary — get it to $0.00 so the whole paycheck is assigned somewhere.
6. Click **Save Template**.
7. From then on, each payday: open **Templates → Funding Templates** and click **⚡ Apply Now** on the template — it funds every envelope per your saved plan instantly, no manual entry needed.
8. Edit or delete a template anytime from the same list if your split changes.

#### Spending Templates — for the recurring bills you record every month
If you pay the same rent, subscriptions, or utility bills every month, list them once as a Spending Template instead of adding each one as a separate transaction every time.

1. Go to **📋 Templates → Spending Templates → + Create Spending Template**.
2. Name it (e.g. "Monthly Bills").
3. Optional: pick a **Reference Funding Template** so the form shows how much you *planned* to fund each envelope, as a sanity check against what you're about to spend.
4. Click **+ Add Expense** for each recurring bill, and for each row set: which **envelope** it comes out of, the **amount**, the **day of month** it's due, and (optionally) which **account** it's paid from. Repeat for every recurring bill.
5. Click **Save Template**.
6. Each month, apply it one of these ways:
   - **⚡ Apply Now (Today's Date)** (from the Spending Templates list) — records every expense immediately, dated today, as already spent.
   - **📅 Apply with Template Dates** (same list) — records every expense using each bill's own configured day of month instead of today.
   - **⏳ Load as Pending** (from an account's Register, in the **🏦 Accounts** tab) — the gentler option: stages every expense as a **pending** transaction instead of marking it spent right away, so you can check them off (mark cleared ✓) as each bill actually clears your account.
7. Edit or delete a spending template anytime from the Spending Templates list.

### Accounts & the register
**🏦 Accounts** tracks actual bank/cash accounts alongside your envelopes. The tab is split into two panels: your account list on the left, and the selected account's **register** (transaction ledger) on the right — click any account to load its register without leaving the tab. In the register you can:
- Log transactions as **cleared** (money has actually moved) or **pending** (expected but not yet happened)
- Transfer money between accounts
- See a running account balance, with the table growing to fit however much history you have (no cramped inner scrollbox)

This is a second, complementary view of your money: envelopes track *what it's for*, accounts track *where it physically sits*.

### Reports tab
Switch to the **📊 Reports** tab for a monthly overview: total income vs. allocated vs. spent, a spending-by-category breakdown, your top spending envelopes, and a **Budget Performance** bar for each envelope showing percent of its planned amount spent (turns amber near 90%, red past 100%).

### Cash Flow Calendar
The **📊 Cash Flow** tab projects your bank balance forward 30 days based on upcoming income and pending transactions, so you can spot a low-balance day before it happens. Enter your current bank balance once to anchor the projection.

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

## Restarting after a break
The app doesn't know real time passed while you were away — it stays on whichever month you last left it on, and income/transactions are never auto-deleted or scoped to a month. If you're picking the app back up after weeks or months off and want to **keep your existing envelopes**, do this before resuming the normal loop:

1. **Roll the month forward once.** Click **📅 → Start New Month** and choose **Reset to Zero** (not rollover) — stale Funded/Spent amounts from months ago aren't a meaningful carryover. This keeps every envelope's name, category, and planned amount exactly as you left it, archives your last active month for the record, and sets "today" as the current month.
2. **Check the 💵 Income tab for stale records.** Since income persists forever and "Available to Fund" is calculated from *all* income ever entered minus *all* funding ever done, any old income still marked "Not yet allocated" will inflate that number. Delete records for money you've already dealt with in real life, or leave them if it's genuinely still unallocated cash.
3. **If you use 🏦 Accounts**, reconcile each account's balance with a one-time adjustment transaction dated today for the real-vs-calculated difference, rather than editing "Starting Balance" (which shifts the gap instead of closing it, since starting balance stacks with all historical income/transactions on that account).
4. **Resume the normal loop** — add today's income, fund envelopes (or apply a saved Funding Template), spend as usual.

Steps 1 and 4 are the real requirements; 2 and 3 are optional data-hygiene checks — skip them if you don't mind the historical figures being a little noisy.

## Tips
- Fund envelopes right after you get paid so "Available to Fund" reflects reality.
- If an envelope keeps running out before the month ends, its Planned amount is probably too low — adjust it rather than borrowing from another envelope.
- Set up Funding and Spending Templates once your budget stabilizes; they turn a 10-step monthly routine into a couple of clicks.
