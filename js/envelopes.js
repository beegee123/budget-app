// envelopes.js - Core business logic for the budgeting app

const BudgetApp = {
    
    // ===== ENVELOPE OPERATIONS =====
    
    // Create a new envelope
    createEnvelope(name, planned, category = 'needs') {
        const envelope = {
            id: this.generateId(), // Unique identifier
            name: name,
            planned: parseFloat(planned), // Monthly budget goal
            funded: 0, // Actual money allocated from paychecks
            spent: 0, // Money already spent
            category: category // needs/wants/savings
        };
        
        Storage.addEnvelope(envelope);
        return envelope;
    },

    // Get all envelopes
    getAllEnvelopes() {
        return Storage.getEnvelopes();
    },

    // Get a single envelope by ID
    getEnvelope(id) {
        const envelopes = Storage.getEnvelopes();
        return envelopes.find(env => env.id === id);
    },

    // Update envelope (name, planned amount, category)
    updateEnvelope(id, updates) {
        Storage.updateEnvelope(id, updates);
    },

    // Delete an envelope
    deleteEnvelope(id) {
        Storage.deleteEnvelope(id);
        // Also delete all transactions associated with this envelope
        const transactions = Storage.getTransactions();
        const filtered = transactions.filter(txn => txn.envelopeId !== id);
        Storage.saveTransactions(filtered);
    },

    // Calculate remaining balance in an envelope (funded - spent)
    getEnvelopeBalance(envelopeId) {
        const envelope = this.getEnvelope(envelopeId);
        if (!envelope) return 0;
        return envelope.funded - envelope.spent;
    },

    // ===== INCOME OPERATIONS =====
    
    // Add income/paycheck
    addIncome(source, amount, date, frequency = 'other', accountId = null) {
        const income = {
            id: this.generateId(),
            source: source,
            frequency: frequency,
            amount: parseFloat(amount),
            date: date,
            allocated: false,
            accountId: accountId || null
        };
        
        Storage.addIncome(income);
        return income;
    },

    // Get all income records
    getAllIncome() {
        return Storage.getIncome();
    },

    // Get available money that hasn't been allocated yet
    getAvailableToFund() {
        // Calculate as: Total Income - Total Funded
        const totalIncome = Storage.getIncome().reduce((sum, inc) => sum + inc.amount, 0);
        const totalFunded = this.getTotalFunded();
        return totalIncome - totalFunded;
    },

    // ===== FUNDING OPERATIONS =====
    
    // Allocate money from income to envelopes
    // fundingPlan is an object like: { envelopeId1: 100, envelopeId2: 200, ... }
    fundEnvelopes(fundingPlan) {
        const available = this.getAvailableToFund();
        
        // Calculate total amount trying to allocate
        const totalToAllocate = Object.values(fundingPlan).reduce((sum, amt) => sum + parseFloat(amt || 0), 0);
        
        // Check if we have enough unallocated income
        if (totalToAllocate > available) {
            throw new Error(`Cannot allocate $${totalToAllocate.toFixed(2)}. Only $${available.toFixed(2)} available.`);
        }

        // Update each envelope's funded amount
        Object.keys(fundingPlan).forEach(envelopeId => {
            const amountToAdd = parseFloat(fundingPlan[envelopeId] || 0);
            if (amountToAdd > 0) {
                const envelope = this.getEnvelope(envelopeId);
                if (envelope) {
                    Storage.updateEnvelope(envelopeId, {
                        funded: envelope.funded + amountToAdd
                    });
                }
            }
        });

        return true;
    },

    // ===== TRANSACTION OPERATIONS =====
    
    // Record a spending transaction
   addTransaction(envelopeId, amount, description, date, accountId = null, status = 'cleared', type = 'expense') {
    const envelope = this.getEnvelope(envelopeId);
    
    if (!envelope) {
        throw new Error('Envelope not found');
    }

    const amountNum = parseFloat(amount);
    
    // Check if envelope has enough funded money (only for cleared expenses)
    if (status === 'cleared' && type === 'expense') {
        const balance = this.getEnvelopeBalance(envelopeId);
        if (amountNum > balance) {
            throw new Error(`Insufficient funds in envelope. Balance: $${balance.toFixed(2)}`);
        }
    }

    // Create transaction
    const transaction = {
        id: this.generateId(),
        envelopeId: envelopeId,
        amount: amountNum,
        description: description,
        date: date,
        accountId: accountId || null,
        status: status, // 'cleared' or 'pending'
        type: type // 'expense', 'income', 'transfer'
    };
    
    Storage.addTransaction(transaction);

    // Update envelope's spent amount (only for cleared expenses)
    if (status === 'cleared' && type === 'expense') {
        Storage.updateEnvelope(envelopeId, {
            spent: envelope.spent + amountNum
        });
    }

    return transaction;
    },

    // Add account-level transaction (no envelope required)
addAccountTransaction(accountId, amount, description, date, status = 'cleared', type = 'expense', envelopeId = null) {
    if (!accountId) {
        throw new Error('Account ID required');
    }

    const amountNum = parseFloat(amount);
    
    // If envelope specified and it's an expense, check balance and update envelope
    if (envelopeId && type === 'expense' && status === 'cleared') {
        const envelope = this.getEnvelope(envelopeId);
        if (!envelope) {
            throw new Error('Envelope not found');
        }
        
        const balance = this.getEnvelopeBalance(envelopeId);
        if (amountNum > balance) {
            throw new Error(`Insufficient funds in envelope. Balance: $${balance.toFixed(2)}`);
        }
        
        // Update envelope spent
        Storage.updateEnvelope(envelopeId, {
            spent: envelope.spent + amountNum
        });
    }

    // Create transaction
    const transaction = {
        id: this.generateId(),
        envelopeId: envelopeId || null,
        amount: amountNum,
        description: description,
        date: date,
        accountId: accountId,
        status: status,
        type: type
    };
    
    Storage.addTransaction(transaction);
    return transaction;
    },

    // Get all transactions for an account with running balance
getAccountTransactionsWithBalance(accountId) {
    const account = this.getAccount(accountId);
    if (!account) return [];
    
    // Get all transactions for this account
    let transactions = Storage.getTransactions().filter(txn => txn.accountId === accountId);
    
    // Get all income for this account
    const income = Storage.getIncome().filter(inc => inc.accountId === accountId);
    
    // Convert income to transaction format
    const incomeTransactions = income.map(inc => ({
        id: inc.id,
        date: inc.date,
        description: inc.source,
        amount: inc.amount,
        accountId: inc.accountId,
        type: 'income',
        status: 'cleared',
        envelopeId: null,
        isIncome: true // Flag to identify income records
    }));
    
    // Combine all transactions
    transactions = [...transactions, ...incomeTransactions];
    
    // Sort by date (oldest first)
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate running balance
    let runningBalance = account.balance;
    transactions.forEach(txn => {
        if (txn.type === 'income') {
            runningBalance += txn.amount;
        } else {
            runningBalance -= txn.amount;
        }
        txn.balance = runningBalance;
    });
    
    return transactions;
    },

    // Get all transactions for an envelope
    getEnvelopeTransactions(envelopeId) {
        return Storage.getTransactionsByEnvelope(envelopeId);
    },

    // ===== DASHBOARD CALCULATIONS =====
    
    // Calculate total planned across all envelopes
    getTotalPlanned() {
        const envelopes = Storage.getEnvelopes();
        return envelopes.reduce((sum, env) => sum + env.planned, 0);
    },

    // Calculate total funded across all envelopes
    getTotalFunded() {
        const envelopes = Storage.getEnvelopes();
        return envelopes.reduce((sum, env) => sum + env.funded, 0);
    },

    // Calculate total spent across all envelopes
    getTotalSpent() {
        const envelopes = Storage.getEnvelopes();
        return envelopes.reduce((sum, env) => sum + env.spent, 0);
    },

    // ===== UTILITY =====
    
    // Generate a unique ID (simple timestamp + random)
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Format number as currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // ===== FUNDING TEMPLATES =====
    
    // Create a new funding template
    createTemplate(name, dayOfMonth, expectedAmount, allocations) {
        const template = {
            id: this.generateId(),
            name: name,
            dayOfMonth: parseInt(dayOfMonth),
            expectedAmount: parseFloat(expectedAmount),
            allocations: allocations, // Object: { envelopeId: amount }
            createdAt: new Date().toISOString()
        };
        
        Storage.addTemplate(template);
        return template;
    },

    // Get all templates
    getAllTemplates() {
        return Storage.getTemplates();
    },

    // Get a single template
    getTemplate(id) {
        return Storage.getTemplate(id);
    },

    // Update template
    updateTemplate(id, updates) {
        Storage.updateTemplate(id, updates);
    },

    // Delete template
    deleteTemplate(id) {
        Storage.deleteTemplate(id);
    },

    // Apply a template (fund envelopes according to template)
    applyTemplate(templateId) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        const available = this.getAvailableToFund();
        const totalNeeded = Object.values(template.allocations).reduce((sum, amt) => sum + amt, 0);

        if (totalNeeded > available) {
            throw new Error(`Template requires ${this.formatCurrency(totalNeeded)} but only ${this.formatCurrency(available)} is available.`);
        }

        // Apply the funding plan
        this.fundEnvelopes(template.allocations);

        return template;
    },

    // Get templates for today
    getTemplatesForToday() {
        const today = new Date().getDate(); // Day of month (1-31)
        const templates = this.getAllTemplates();
        return templates.filter(t => t.dayOfMonth === today);
    },

    // ===== ACCOUNT MANAGEMENT =====
    
    // Create a new account
    createAccount(name, type, balance) {
        const account = {
            id: this.generateId(),
            name: name,
            type: type,
            balance: parseFloat(balance),
            createdAt: new Date().toISOString()
        };
        
        Storage.addAccount(account);
        return account;
    },

    // Get all accounts
    getAllAccounts() {
        return Storage.getAccounts();
    },

    // Get a single account
    getAccount(id) {
        return Storage.getAccount(id);
    },

    // Update account
    updateAccount(id, updates) {
        Storage.updateAccount(id, updates);
    },

    // Delete account
    deleteAccount(id) {
        Storage.deleteAccount(id);
    },

    // Get account balance (calculated from transactions and income)
    getAccountBalance(accountId) {
        const account = this.getAccount(accountId);
        if (!account) return 0;
        
        let balance = account.balance; // Starting balance
        
        // Add income to this account
        const income = Storage.getIncome();
        income.forEach(inc => {
            if (inc.accountId === accountId) {
                balance += inc.amount;
            }
        });
        
        // Process transactions from this account
        const transactions = Storage.getTransactions();
        transactions.forEach(txn => {
            if (txn.accountId === accountId) {
                // 👈 NEW: Check transaction type
                if (txn.type === 'income') {
                    balance += txn.amount; // Income increases balance
                } else {
                    balance -= txn.amount; // Expenses decrease balance
                }
            }
        });
        
        return balance;
    },

    // Get total across all accounts
    getTotalAccountsBalance() {
        const accounts = this.getAllAccounts();
        return accounts.reduce((sum, acc) => sum + this.getAccountBalance(acc.id), 0);
    },

    // ===== MONTH MANAGEMENT =====
    
    // Get current month info
    getCurrentMonth() {
        return Storage.getCurrentMonth();
    },

    // Get month name
    getMonthName(monthNum) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[monthNum - 1];
    },

    // Start a new month (rollover)
    startNewMonth(rolloverUnspent = true) {
        const currentMonth = this.getCurrentMonth();
        const envelopes = this.getAllEnvelopes();
        
        // Create archive of current month
        const archive = {
            id: this.generateId(),
            monthKey: currentMonth.monthKey,
            year: currentMonth.year,
            month: currentMonth.month,
            monthName: this.getMonthName(currentMonth.month),
            archivedDate: new Date().toISOString(),
            summary: {
                totalPlanned: this.getTotalPlanned(),
                totalFunded: this.getTotalFunded(),
                totalSpent: this.getTotalSpent()
            },
            envelopeSnapshots: envelopes.map(env => ({
                id: env.id,
                name: env.name,
                category: env.category,
                planned: env.planned,
                funded: env.funded,
                spent: env.spent,
                balance: env.funded - env.spent
            }))
        };
        
        Storage.addMonthArchive(archive);
        
        // Update envelopes for new month
        envelopes.forEach(env => {
            const unspent = env.funded - env.spent;
            const newFunded = rolloverUnspent && unspent > 0 ? unspent : 0;
            
            Storage.updateEnvelope(env.id, {
                funded: newFunded,
                spent: 0
                // Keep planned amount the same
            });
        });
        
        // Update current month
        const now = new Date();
        const newMonth = {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            monthKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        };
        Storage.setCurrentMonth(newMonth);
        
        return {
            archived: archive,
            newMonth: newMonth
        };
    },

    // Get all month archives
    getMonthArchives() {
        return Storage.getMonthArchives();
    },

    // Get a specific archive
    getMonthArchive(monthKey) {
        return Storage.getMonthArchive(monthKey);
    },

    // ===== SPENDING TEMPLATES =====
    
    createSpendingTemplate(name, expenses) {
        const template = {
            id: this.generateId(),
            name: name,
            expenses: expenses, // Array of { envelopeId, amount, description, dayOfMonth, accountId }
            createdAt: new Date().toISOString()
        };
        
        Storage.addSpendingTemplate(template);
        return template;
    },

    getAllSpendingTemplates() {
        return Storage.getSpendingTemplates();
    },

    getSpendingTemplate(id) {
        return Storage.getSpendingTemplate(id);
    },

    updateSpendingTemplate(id, updates) {
        Storage.updateSpendingTemplate(id, updates);
    },

    deleteSpendingTemplate(id) {
        Storage.deleteSpendingTemplate(id);
    },

    applySpendingTemplate(templateId, useTemplateDate = false) {
        const template = this.getSpendingTemplate(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        const results = {
            success: [],
            failed: []
        };

        const today = new Date();
        
        template.expenses.forEach(expense => {
            try {
                // Determine date to use
                let dateToUse;
                if (useTemplateDate && expense.dayOfMonth) {
                    dateToUse = new Date(today.getFullYear(), today.getMonth(), expense.dayOfMonth);
                } else {
                    dateToUse = today;
                }
                
                const dateString = dateToUse.toISOString().split('T')[0];
                
                // Record transaction
                this.addTransaction(
                    expense.envelopeId,
                    expense.amount,
                    expense.description,
                    dateString,
                    expense.accountId || null
                );
                
                results.success.push(expense.description);
            } catch (error) {
                results.failed.push({
                    description: expense.description,
                    error: error.message
                });
            }
        });

        return results;
    },

    getSpendingTemplatesForToday() {
        const today = new Date().getDate();
        const templates = this.getAllSpendingTemplates();
        
        return templates.filter(template => {
            return template.expenses.some(exp => exp.dayOfMonth === today);
        });
    }
};