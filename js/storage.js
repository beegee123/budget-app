// storage.js - Handles all localStorage operations
// LocalStorage is like a mini database in your browser - data persists even after closing the browser

const Storage = {
    // Keys for localStorage (like table names in a database)
    KEYS: {
        ENVELOPES: 'budgetApp_envelopes',
        INCOME: 'budgetApp_income',
        TRANSACTIONS: 'budgetApp_transactions',
        BANK_BALANCE: 'budgetApp_bankBalance',
        TEMPLATES: 'budgetApp_fundingTemplates',
        SPENDING_TEMPLATES: 'budgetApp_spendingTemplates',
        ACCOUNTS: 'budgetApp_accounts',
        CURRENT_MONTH: 'budgetApp_currentMonth',
        MONTH_ARCHIVES: 'budgetApp_monthArchives',
        BUDGETS: 'budgetApp_budgets',           // NEW: List of all budgets
        ACTIVE_BUDGET: 'budgetApp_activeBudget' // NEW: Currently selected budget ID
    },

    // ===== ENVELOPES =====
    
    // Get all envelopes from localStorage
    getEnvelopes() {
        const data = localStorage.getItem(this._getKey('envelopes'));
        return data ? JSON.parse(data) : [];
    },

    // Save envelopes array to localStorage
    saveEnvelopes(envelopes) {
        localStorage.setItem(this._getKey('envelopes'), JSON.stringify(envelopes));
    },

    // Add a single envelope
    addEnvelope(envelope) {
        const envelopes = this.getEnvelopes();
        envelopes.push(envelope);
        this.saveEnvelopes(envelopes);
    },

    // Update an existing envelope
    updateEnvelope(id, updatedData) {
        const envelopes = this.getEnvelopes();
        // Find the envelope by ID and update it
        const index = envelopes.findIndex(env => env.id === id);
        if (index !== -1) {
            envelopes[index] = { ...envelopes[index], ...updatedData };
            this.saveEnvelopes(envelopes);
        }
    },

    // Delete an envelope
    deleteEnvelope(id) {
        const envelopes = this.getEnvelopes();
        // Filter out the envelope with matching ID
        const filtered = envelopes.filter(env => env.id !== id);
        this.saveEnvelopes(filtered);
    },

    // ===== INCOME =====
    
    // Get all income records
    getIncome() {
        const data = localStorage.getItem(this._getKey('income'));
        return data ? JSON.parse(data) : [];
    },

    // Save income records
    saveIncome(income) {
        localStorage.setItem(this._getKey('income'), JSON.stringify(income));
    },

    // Add a single income record
    addIncome(incomeRecord) {
        const income = this.getIncome();
        income.push(incomeRecord);
        this.saveIncome(income);
    },

    // Get total income that hasn't been allocated yet
    getUnallocatedIncome() {
        const income = this.getIncome();
        // Sum up all income where allocated = false
        return income
            .filter(inc => !inc.allocated)
            .reduce((sum, inc) => sum + inc.amount, 0);
    },

    // Mark income as allocated (after distributing to envelopes)
    markIncomeAllocated(incomeIds) {
        const income = this.getIncome();
        income.forEach(inc => {
            if (incomeIds.includes(inc.id)) {
                inc.allocated = true;
            }
        });
        this.saveIncome(income);
    },

    // ===== TRANSACTIONS =====
    
    // Get all transactions
    getTransactions() {
        const data = localStorage.getItem(this._getKey('transactions'));
        return data ? JSON.parse(data) : [];
    },

    // Save transactions
    saveTransactions(transactions) {
        localStorage.setItem(this._getKey('transactions'), JSON.stringify(transactions));
    },

    // Add a single transaction
    addTransaction(transaction) {
        const transactions = this.getTransactions();
        transactions.push(transaction);
        this.saveTransactions(transactions);
    },

    // Get transactions for a specific envelope
    getTransactionsByEnvelope(envelopeId) {
        const transactions = this.getTransactions();
        return transactions.filter(txn => txn.envelopeId === envelopeId);
    },

    // ===== UTILITY =====
    
    // Export all data as JSON (for backup) - ALL BUDGETS
    exportData() {
        const allBudgets = this.getBudgets();
        const activeBudgetId = this.getActiveBudget();
        
        // Collect data from ALL budgets
        const budgetData = {};
        
        allBudgets.forEach(budget => {
            // Temporarily switch to this budget to read its data
            const originalActiveBudget = this.getActiveBudget();
            localStorage.setItem(this.KEYS.ACTIVE_BUDGET, budget.id);
            
            budgetData[budget.id] = {
                envelopes: this.getEnvelopes(),
                income: this.getIncome(),
                transactions: this.getTransactions(),
                bankBalance: this.getBankBalance(),
                templates: this.getTemplates(),
                spendingTemplates: this.getSpendingTemplates(),
                accounts: this.getAccounts(),
                currentMonth: this.getCurrentMonth(),
                monthArchives: this.getMonthArchives()
            };
            
            // Restore original active budget
            localStorage.setItem(this.KEYS.ACTIVE_BUDGET, originalActiveBudget);
        });
        
        return {
            exportVersion: '2.0', // Multi-budget format
            exportDate: new Date().toISOString(),
            budgets: allBudgets,
            activeBudget: activeBudgetId,
            budgetData: budgetData
        };
    },

  // Import data from JSON (restore from backup) - ALL BUDGETS
    importData(data) {
        // Check if this is the new multi-budget format (v2.0+)
        if (data.exportVersion === '2.0' && data.budgets && data.budgetData) {
            console.log('📦 Importing multi-budget backup...');
            
            // Restore budgets list
            this.saveBudgets(data.budgets);
            
            // Restore active budget
            if (data.activeBudget) {
                this.setActiveBudget(data.activeBudget);
            }
            
            // Restore data for each budget
            Object.keys(data.budgetData).forEach(budgetId => {
                const budgetInfo = data.budgetData[budgetId];
                
                // Save data with proper namespace
                if (budgetInfo.envelopes) {
                    localStorage.setItem(`${budgetId}_envelopes`, JSON.stringify(budgetInfo.envelopes));
                }
                if (budgetInfo.income) {
                    localStorage.setItem(`${budgetId}_income`, JSON.stringify(budgetInfo.income));
                }
                if (budgetInfo.transactions) {
                    localStorage.setItem(`${budgetId}_transactions`, JSON.stringify(budgetInfo.transactions));
                }
                if (budgetInfo.bankBalance !== undefined) {
                    localStorage.setItem(`${budgetId}_bankBalance`, budgetInfo.bankBalance.toString());
                }
                if (budgetInfo.templates) {
                    localStorage.setItem(`${budgetId}_fundingTemplates`, JSON.stringify(budgetInfo.templates));
                }
                if (budgetInfo.spendingTemplates) {
                    localStorage.setItem(`${budgetId}_spendingTemplates`, JSON.stringify(budgetInfo.spendingTemplates));
                }
                if (budgetInfo.accounts) {
                    localStorage.setItem(`${budgetId}_accounts`, JSON.stringify(budgetInfo.accounts));
                }
                if (budgetInfo.currentMonth) {
                    localStorage.setItem(`${budgetId}_currentMonth`, JSON.stringify(budgetInfo.currentMonth));
                }
                if (budgetInfo.monthArchives) {
                    localStorage.setItem(`${budgetId}_monthArchives`, JSON.stringify(budgetInfo.monthArchives));
                }
                
                console.log(`✅ Restored budget: ${budgetId}`);
            });
            
            console.log('✅ Multi-budget import complete!');
            
        } else {
            // Legacy single-budget format - import into current budget
            console.log('📦 Importing legacy single-budget backup into current budget...');
            
            if (data.envelopes) this.saveEnvelopes(data.envelopes);
            if (data.income) this.saveIncome(data.income);
            if (data.transactions) this.saveTransactions(data.transactions);
            if (data.bankBalance !== undefined) this.saveBankBalance(data.bankBalance);
            if (data.templates) this.saveTemplates(data.templates);
            if (data.spendingTemplates) this.saveSpendingTemplates(data.spendingTemplates);
            if (data.accounts) this.saveAccounts(data.accounts);
            if (data.currentMonth) this.setCurrentMonth(data.currentMonth);
            if (data.monthArchives) this.saveMonthArchives(data.monthArchives);
            
            console.log('✅ Legacy import complete!');
        }
    },
    // Clear ALL data for current budget (use with caution!)
    clearAll() {
        const activeBudget = this.getActiveBudget();
        const dataKeys = [
            'envelopes', 'income', 'transactions', 'bankBalance',
            'fundingTemplates', 'spendingTemplates', 'accounts',
            'currentMonth', 'monthArchives'
        ];
        
        dataKeys.forEach(key => {
            localStorage.removeItem(`${activeBudget}_${key}`);
        });
    },

    // Clear all data with confirmation (safer)
    clearAllConfirm() {
        const confirm = window.confirm(
            '⚠️ WARNING: This will delete ALL your budget data!\n\n' +
            'This includes:\n' +
            '- All envelopes\n' +
            '- All income records\n' +
            '- All transactions\n' +
            '- All templates\n' +
            '- All accounts\n' +
            '- All month archives\n\n' +
            'This CANNOT be undone!\n\n' +
            'Are you absolutely sure?'
        );
        
        if (confirm) {
            const doubleConfirm = window.confirm(
                '🚨 FINAL WARNING!\n\n' +
                'This will permanently delete everything.\n\n' +
                'Have you exported a backup?\n\n' +
                'Click OK to DELETE ALL DATA'
            );
            
            if (doubleConfirm) {
                this.clearAll();
                return true;
            }
        }
        
        return false;
    },

    // ===== BANK BALANCE =====
    
    // Get current bank balance
    getBankBalance() {
        const data = localStorage.getItem(this._getKey('bankBalance'));
        return data ? parseFloat(data) : 0;
    },

    // Save bank balance
    saveBankBalance(balance) {
        localStorage.setItem(this._getKey('bankBalance'), balance.toString());
    },

    // ===== FUNDING TEMPLATES =====
    
    // Get all templates
    getTemplates() {
        const data = localStorage.getItem(this._getKey('fundingTemplates'));
        return data ? JSON.parse(data) : [];
    },

    // Save all templates
    saveTemplates(templates) {
        localStorage.setItem(this._getKey('fundingTemplates'), JSON.stringify(templates));
    },

    // Add a template
    addTemplate(template) {
        const templates = this.getTemplates();
        templates.push(template);
        this.saveTemplates(templates);
    },

    // Update a template
    updateTemplate(id, updatedData) {
        const templates = this.getTemplates();
        const index = templates.findIndex(t => t.id === id);
        if (index !== -1) {
            templates[index] = { ...templates[index], ...updatedData };
            this.saveTemplates(templates);
        }
    },

    // Delete a template
    deleteTemplate(id) {
        const templates = this.getTemplates();
        const filtered = templates.filter(t => t.id !== id);
        this.saveTemplates(filtered);
    },

    // Get a single template by ID
    getTemplate(id) {
        const templates = this.getTemplates();
        return templates.find(t => t.id === id);
    },

    // ===== ACCOUNTS =====
    
    // Get all accounts
    getAccounts() {
        const data = localStorage.getItem(this._getKey('accounts'));
        return data ? JSON.parse(data) : [];
    },

    // Save all accounts
    saveAccounts(accounts) {
        localStorage.setItem(this._getKey('accounts'), JSON.stringify(accounts));
    },

    // Add an account
    addAccount(account) {
        const accounts = this.getAccounts();
        accounts.push(account);
        this.saveAccounts(accounts);
    },

    // Update an account
    updateAccount(id, updatedData) {
        const accounts = this.getAccounts();
        const index = accounts.findIndex(acc => acc.id === id);
        if (index !== -1) {
            accounts[index] = { ...accounts[index], ...updatedData };
            this.saveAccounts(accounts);
        }
    },

    // Delete an account
    deleteAccount(id) {
        const accounts = this.getAccounts();
        const filtered = accounts.filter(acc => acc.id !== id);
        this.saveAccounts(filtered);
    },

    // Get a single account by ID
    getAccount(id) {
        const accounts = this.getAccounts();
        return accounts.find(acc => acc.id === id);
    },

    // ===== MONTH MANAGEMENT =====
    
    // Get current active month
    getCurrentMonth() {
        const data = localStorage.getItem(this._getKey('currentMonth'));
        if (!data) {
            // Initialize with current month if not set
            const now = new Date();
            const currentMonth = {
                year: now.getFullYear(),
                month: now.getMonth() + 1, // 1-12
                monthKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` // "2025-01"
            };
            this.setCurrentMonth(currentMonth);
            return currentMonth;
        }
        return JSON.parse(data);
    },

    // Set current active month
    setCurrentMonth(monthData) {
        localStorage.setItem(this._getKey('currentMonth'), JSON.stringify(monthData));
    },

    // Get all month archives
    getMonthArchives() {
        const data = localStorage.getItem(this._getKey('monthArchives'));
        return data ? JSON.parse(data) : [];
    },

    // Save month archives
    saveMonthArchives(archives) {
        localStorage.setItem(this._getKey('monthArchives'), JSON.stringify(archives));
    },

    // Add a month archive
    addMonthArchive(archive) {
        const archives = this.getMonthArchives();
        archives.push(archive);
        this.saveMonthArchives(archives);
    },

    // Get a specific month archive
    getMonthArchive(monthKey) {
        const archives = this.getMonthArchives();
        return archives.find(arch => arch.monthKey === monthKey);
    },

    // ===== SPENDING TEMPLATES =====
    
    getSpendingTemplates() {
        const data = localStorage.getItem(this._getKey('spendingTemplates'));
        return data ? JSON.parse(data) : [];
    },

    saveSpendingTemplates(templates) {
        localStorage.setItem(this._getKey('spendingTemplates'), JSON.stringify(templates));
    },

    addSpendingTemplate(template) {
        const templates = this.getSpendingTemplates();
        templates.push(template);
        this.saveSpendingTemplates(templates);
    },

    updateSpendingTemplate(id, updatedData) {
        const templates = this.getSpendingTemplates();
        const index = templates.findIndex(t => t.id === id);
        if (index !== -1) {
            templates[index] = { ...templates[index], ...updatedData };
            this.saveSpendingTemplates(templates);
        }
    },

    deleteSpendingTemplate(id) {
        const templates = this.getSpendingTemplates();
        const filtered = templates.filter(t => t.id !== id);
        this.saveSpendingTemplates(filtered);
    },

    getSpendingTemplate(id) {
        const templates = this.getSpendingTemplates();
        return templates.find(t => t.id === id);
    },

    // ===== BUDGET MANAGEMENT =====

    // Get all budgets
    getBudgets() {
        const data = localStorage.getItem(this.KEYS.BUDGETS);
        if (!data) {
            // Initialize with default budget
            const defaultBudget = {
                id: 'default',
                name: 'My Budget',
                createdAt: new Date().toISOString()
            };
            this.saveBudgets([defaultBudget]);
            return [defaultBudget];
        }
        return JSON.parse(data);
    },

    // Save budgets list
    saveBudgets(budgets) {
        localStorage.setItem(this.KEYS.BUDGETS, JSON.stringify(budgets));
    },

    // Get active budget ID
    getActiveBudget() {
        const data = localStorage.getItem(this.KEYS.ACTIVE_BUDGET);
        if (!data) {
            // Initialize with default
            this.setActiveBudget('default');
            return 'default';
        }
        return data;
    },

    // Set active budget
    setActiveBudget(budgetId) {
        localStorage.setItem(this.KEYS.ACTIVE_BUDGET, budgetId);
    },

    // Create new budget
    createBudget(name) {
        const budgets = this.getBudgets();
        const newBudget = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: name,
            createdAt: new Date().toISOString()
        };
        budgets.push(newBudget);
        this.saveBudgets(budgets);
        return newBudget;
    },

    // Rename budget
    renameBudget(budgetId, newName) {
        const budgets = this.getBudgets();
        const budget = budgets.find(b => b.id === budgetId);
        if (budget) {
            budget.name = newName;
            this.saveBudgets(budgets);
        }
    },

    // Delete budget (and all its data)
    deleteBudget(budgetId) {
        // Don't allow deleting if it's the only budget
        const budgets = this.getBudgets();
        if (budgets.length <= 1) {
            throw new Error('Cannot delete the last budget');
        }
        
        // Don't allow deleting active budget
        if (this.getActiveBudget() === budgetId) {
            throw new Error('Cannot delete the active budget. Switch to another budget first.');
        }
        
        // Delete all data for this budget
        const dataKeys = [
            'envelopes', 'income', 'transactions', 'bankBalance',
            'fundingTemplates', 'spendingTemplates', 'accounts',
            'currentMonth', 'monthArchives'
        ];
        
        dataKeys.forEach(key => {
            localStorage.removeItem(`${budgetId}_${key}`);
        });
        
        // Remove from budgets list
        const filtered = budgets.filter(b => b.id !== budgetId);
        this.saveBudgets(filtered);
    },

    // Get namespaced key for current budget
    _getKey(baseKey) {
        const activeBudget = this.getActiveBudget();
        return `${activeBudget}_${baseKey}`;
    },

    // ===== DATA MIGRATION =====

    // Migrate data from old non-namespaced keys to budget-namespaced keys
    migrateOldData() {
        console.log('🔄 Checking for data to migrate...');
        
        // Check if old data exists
        const oldEnvelopes = localStorage.getItem('budgetApp_envelopes');
        if (!oldEnvelopes) {
            console.log('✅ No old data found - already migrated or fresh install');
            return false;
        }
        
        console.log('📦 Old data found! Migrating to default budget...');
        
        // Get the default budget ID
        const budgets = this.getBudgets();
        const defaultBudget = budgets[0]; // Should be 'default' or first budget
        
        // Map of old keys to new keys
        const keysToMigrate = {
            'budgetApp_envelopes': 'envelopes',
            'budgetApp_income': 'income',
            'budgetApp_transactions': 'transactions',
            'budgetApp_bankBalance': 'bankBalance',
            'budgetApp_fundingTemplates': 'fundingTemplates',
            'budgetApp_spendingTemplates': 'spendingTemplates',
            'budgetApp_accounts': 'accounts',
            'budgetApp_currentMonth': 'currentMonth',
            'budgetApp_monthArchives': 'monthArchives'
        };
        
        // Copy data from old keys to new namespaced keys
        Object.keys(keysToMigrate).forEach(oldKey => {
            const data = localStorage.getItem(oldKey);
            if (data) {
                const newKey = `${defaultBudget.id}_${keysToMigrate[oldKey]}`;
                localStorage.setItem(newKey, data);
                console.log(`✅ Migrated: ${oldKey} → ${newKey}`);
            }
        });
        
        // 🔥 NEW: DELETE OLD KEYS SO MIGRATION DOESN'T RUN AGAIN
        console.log('🗑️ Deleting old keys...');
        Object.keys(keysToMigrate).forEach(oldKey => {
            localStorage.removeItem(oldKey);
            console.log(`🗑️ Deleted: ${oldKey}`);
        });
        
        console.log('✅ Migration complete!');
        return true;
    }
};