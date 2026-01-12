// app.js - UI Controller and Event Handlers

// ===== APP STATE =====
const AppState = {
    activeCategory: null, // null means "show all", otherwise it's a category name
    
    setCategory(category) {
        this.activeCategory = category;
        renderEnvelopes();
        renderCategoryFilters();
    },
    
    clearCategory() {
        this.activeCategory = null;
        renderEnvelopes();
        renderCategoryFilters();
    }
};

// ===== INITIALIZATION =====

// Run when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize budgets system
    initializeBudgets();

    setupEventListeners();
    document.getElementById('incomeDate').valueAsDate = new Date();
    updateMonthDisplay(); // Add this line
    updateDashboard();
    renderCategoryFilters();
    renderEnvelopes();
    updateCategorySuggestions();
}

function setupEventListeners() {
    // Envelope form submission
    document.getElementById('envelopeForm').addEventListener('submit', handleCreateEnvelope);
    
    // Edit envelope form submission
    document.getElementById('editEnvelopeForm').addEventListener('submit', handleEditEnvelope);
    
    // Income form submission
    document.getElementById('incomeForm').addEventListener('submit', handleAddIncome);
    
    // Edit income form submission
    document.getElementById('editIncomeForm').addEventListener('submit', handleEditIncome);
    
    // Template form submission
    document.getElementById('templateForm').addEventListener('submit', handleTemplateFormSubmit);
    
    // Spending template form submission
    document.getElementById('spendingTemplateForm').addEventListener('submit', handleSpendingTemplateFormSubmit);
    
    // Account form submission
    document.getElementById('accountForm').addEventListener('submit', handleAccountFormSubmit);
}

// ===== DASHBOARD UPDATES =====

function updateDashboard() {
    // Get all totals from BudgetApp
    const totalPlanned = BudgetApp.getTotalPlanned();
    const totalFunded = BudgetApp.getTotalFunded();
    const totalSpent = BudgetApp.getTotalSpent();
    const availableToFund = BudgetApp.getAvailableToFund();

    // Update HTML elements
    document.getElementById('totalPlanned').textContent = BudgetApp.formatCurrency(totalPlanned);
    document.getElementById('totalFunded').textContent = BudgetApp.formatCurrency(totalFunded);
    document.getElementById('totalSpent').textContent = BudgetApp.formatCurrency(totalSpent);
    document.getElementById('availableToFund').textContent = BudgetApp.formatCurrency(availableToFund);
}

function renderCategoryFilters() {
    const envelopes = BudgetApp.getAllEnvelopes();
    const container = document.getElementById('categoryFilters');
    
    if (envelopes.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    // Get unique categories with counts
    const categoryStats = {};
    envelopes.forEach(env => {
        if (!categoryStats[env.category]) {
            categoryStats[env.category] = {
                count: 0,
                planned: 0,
                funded: 0,
                spent: 0
            };
        }
        categoryStats[env.category].count++;
        categoryStats[env.category].planned += env.planned;
        categoryStats[env.category].funded += env.funded;
        categoryStats[env.category].spent += env.spent;
    });
    
    const categories = Object.keys(categoryStats).sort();
    
    // Build filter buttons
    let html = `
        <button 
            class="category-filter-btn ${AppState.activeCategory === null ? 'active' : ''}" 
            onclick="AppState.clearCategory()"
        >
            All Categories
            <span class="category-count">${envelopes.length}</span>
        </button>
    `;
    
    categories.forEach(cat => {
        html += `
            <button 
                class="category-filter-btn ${AppState.activeCategory === cat ? 'active' : ''}" 
                onclick="AppState.setCategory('${cat}')"
            >
                ${cat}
                <span class="category-count">${categoryStats[cat].count}</span>
            </button>
        `;
    });
    
    container.innerHTML = html;
}

// ===== ENVELOPE OPERATIONS =====

function handleCreateEnvelope(e) {
    e.preventDefault();
    
    const name = document.getElementById('envelopeName').value;
    const planned = document.getElementById('envelopePlanned').value;
    const category = document.getElementById('envelopeCategory').value;
    
    BudgetApp.createEnvelope(name, planned, category);
    
    // Update UI
    renderCategoryFilters(); // Add this line
    renderEnvelopes();
    updateDashboard();
    
    e.target.reset();
    closeModal('envelopeModal');
}

function renderEnvelopes() {
    const envelopesContainer = document.getElementById('envelopesList');
    let envelopes = BudgetApp.getAllEnvelopes();
    
    // Filter by active category if one is selected
    if (AppState.activeCategory !== null) {
        envelopes = envelopes.filter(env => env.category === AppState.activeCategory);
    }
    
    // If no envelopes, show a helpful message
    if (envelopes.length === 0) {
        const message = AppState.activeCategory 
            ? `No envelopes in "${AppState.activeCategory}" category yet.`
            : 'No envelopes yet!';
        const action = AppState.activeCategory
            ? `<button class="btn btn-primary" onclick="openModal('envelopeModal')">+ Add Envelope to ${AppState.activeCategory}</button>`
            : '<p>Click "Create Envelope" to get started.</p>';
        
        envelopesContainer.innerHTML = `
            <div class="empty-state">
                <h3>${message}</h3>
                ${action}
            </div>
        `;
        return;
    }
    
    // Show category summary if filtered
    let summaryHTML = '';
    if (AppState.activeCategory !== null) {
        const stats = envelopes.reduce((acc, env) => {
            acc.planned += env.planned;
            acc.funded += env.funded;
            acc.spent += env.spent;
            return acc;
        }, { planned: 0, funded: 0, spent: 0 });
        
        const balance = stats.funded - stats.spent;
        
        summaryHTML = `
            <div class="category-summary">
                <div class="category-summary-item">
                    <div class="label">Total Planned</div>
                    <div class="value">${BudgetApp.formatCurrency(stats.planned)}</div>
                </div>
                <div class="category-summary-item">
                    <div class="label">Total Funded</div>
                    <div class="value" style="color: #48bb78;">${BudgetApp.formatCurrency(stats.funded)}</div>
                </div>
                <div class="category-summary-item">
                    <div class="label">Total Spent</div>
                    <div class="value" style="color: #f56565;">${BudgetApp.formatCurrency(stats.spent)}</div>
                </div>
                <div class="category-summary-item">
                    <div class="label">Balance</div>
                    <div class="value" style="color: ${balance >= 0 ? '#48bb78' : '#f56565'};">
                        ${BudgetApp.formatCurrency(balance)}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Build table HTML
    envelopesContainer.innerHTML = summaryHTML + `
        <table class="envelopes-table">
            <thead>
                <tr>
                    <th>Envelope</th>
                    <th style="text-align: right;">
                        Planned ✏️
                        <div style="font-size: 0.75em; font-weight: 400; opacity: 0.8;">Click to edit</div>
                    </th>
                    <th style="text-align: right;">Funded</th>
                    <th style="text-align: right;">Spent</th>
                    <th style="text-align: right;">Balance</th>
                    <th style="text-align: center;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${envelopes.map(env => {
                    const balance = BudgetApp.getEnvelopeBalance(env.id);
                    const percentFunded = env.planned > 0 ? (env.funded / env.planned * 100) : 0;
                    const balanceClass = balance > 0 ? 'amount-positive' : balance < 0 ? 'amount-negative' : 'amount-neutral';
                    
                    return `
                        <tr>
                            <td>
                                <div class="envelope-name">
                                    ${env.name}
                                    <span class="envelope-category-badge">${env.category}</span>
                                </div>
                            </td>
                            <td 
                                id="planned_${env.id}" 
                                class="amount-cell amount-neutral editable-cell" 
                                onclick="makeEnvelopePlannedEditable('${env.id}')"
                                title="Click to edit planned amount"
                            >
                                ${BudgetApp.formatCurrency(env.planned)}
                            </td>
                            <td class="amount-cell">
                                ${BudgetApp.formatCurrency(env.funded)}
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill" style="width: ${Math.min(percentFunded, 100)}%"></div>
                                </div>
                            </td>
                            <td class="amount-cell amount-negative">
                                ${BudgetApp.formatCurrency(env.spent)}
                            </td>
                            <td class="amount-cell ${balanceClass}">
                                <strong>${BudgetApp.formatCurrency(balance)}</strong>
                            </td>
                            <td class="actions-cell">
                                <button class="btn btn-secondary btn-small" onclick="openSpendModal('${env.id}')">
                                    💳 Spend
                                </button>
                                <button class="btn btn-primary btn-small" onclick="openTransactionHistory('${env.id}')">
                                    📋 History
                                </button>
                                <button class="btn btn-info btn-small" onclick="openEditEnvelopeModal('${env.id}')">
                                    ✏️ Edit
                                </button>
                                <button class="btn btn-delete btn-small" onclick="deleteEnvelopeConfirm('${env.id}')">
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function updateCategorySuggestions() {
    const envelopes = BudgetApp.getAllEnvelopes();
    
    // Get unique categories from existing envelopes
    const categories = [...new Set(envelopes.map(env => env.category))];
    
    // Update the datalist with existing categories
    const datalist = document.getElementById('categoryList');
    datalist.innerHTML = categories.map(cat => `<option value="${cat}">`).join('');
}

function deleteEnvelopeConfirm(envelopeId) {
    const envelope = BudgetApp.getEnvelope(envelopeId);
    if (confirm(`Delete "${envelope.name}" envelope? This cannot be undone.`)) {
        BudgetApp.deleteEnvelope(envelopeId);
        renderEnvelopes();
        updateDashboard();
    }
}

// ===== EDIT ENVELOPE =====

function openEditEnvelopeModal(envelopeId) {
    const envelope = BudgetApp.getEnvelope(envelopeId);
    
    if (!envelope) {
        alert('Envelope not found');
        return;
    }
    
    // Update category suggestions before opening
    updateCategorySuggestions();
    
    // Pre-fill the form with current values
    document.getElementById('editEnvelopeId').value = envelope.id;
    document.getElementById('editEnvelopeName').value = envelope.name;
    document.getElementById('editEnvelopePlanned').value = envelope.planned;
    document.getElementById('editEnvelopeCategory').value = envelope.category;
    
    // Open the modal
    openModal('editEnvelopeModal');
}

function handleEditEnvelope(e) {
    e.preventDefault();
    
    const id = document.getElementById('editEnvelopeId').value;
    const name = document.getElementById('editEnvelopeName').value;
    const planned = parseFloat(document.getElementById('editEnvelopePlanned').value);
    const category = document.getElementById('editEnvelopeCategory').value.trim();
    
    // Validate
    if (!name || !category || isNaN(planned) || planned < 0) {
        alert('Please fill in all fields with valid values');
        return;
    }
    
    // Update the envelope (preserves funded and spent)
    BudgetApp.updateEnvelope(id, {
        name: name,
        planned: planned,
        category: category
    });
    
    // Update UI
    renderCategoryFilters();
    renderEnvelopes();
    updateDashboard();
    updateCategorySuggestions();
    
    // Close modal and reset form
    closeModal('editEnvelopeModal');
    e.target.reset();
    
    alert('✅ Envelope updated successfully!');
}

// ===== EDIT ENVELOPE =====

function openEditEnvelopeModal(envelopeId) {
    const envelope = BudgetApp.getEnvelope(envelopeId);
    
    if (!envelope) {
        alert('Envelope not found');
        return;
    }
    
    // Pre-fill the form with current values
    document.getElementById('editEnvelopeId').value = envelope.id;
    document.getElementById('editEnvelopeName').value = envelope.name;
    document.getElementById('editEnvelopePlanned').value = envelope.planned;
    document.getElementById('editEnvelopeCategory').value = envelope.category;
    
    // Open the modal
    openModal('editEnvelopeModal');
}

function handleEditIncome(e) {
    e.preventDefault();
    
    const id = document.getElementById('editIncomeId').value;
    const source = document.getElementById('editIncomeSource').value.trim();
    const frequency = document.getElementById('editIncomeFrequency').value;
    const amount = parseFloat(document.getElementById('editIncomeAmount').value);
    const date = document.getElementById('editIncomeDate').value;
    
    // Validate
    if (!source || !frequency || isNaN(amount) || amount <= 0 || !date) {
        alert('Please fill in all fields with valid values');
        return;
    }
    
    // Get current income record
    const allIncome = Storage.getIncome();
    const incomeIndex = allIncome.findIndex(inc => inc.id === id);
    
    if (incomeIndex === -1) {
        alert('Income record not found');
        return;
    }
    
    const oldIncome = allIncome[incomeIndex];
    
    // Warn if allocated and amount is decreasing
    if (oldIncome.allocated && amount < oldIncome.amount) {
        const difference = oldIncome.amount - amount;
        if (!confirm(`⚠️ Warning: You're decreasing allocated income by ${BudgetApp.formatCurrency(difference)}. This may cause your "Available to Fund" to go negative. Continue?`)) {
            return;
        }
    }
    
    // Update the income record
    allIncome[incomeIndex] = {
        ...oldIncome,
        source: source,
        frequency: frequency,
        amount: amount,
        date: date
    };
    
    Storage.saveIncome(allIncome);
    
    // Update UI
    updateDashboard();
    renderIncomeRecordsList();
    closeModal('editIncomeModal');
    
    alert('✅ Income record updated!');
}

// ===== INLINE EDITING =====

function makeEnvelopePlannedEditable(envelopeId) {
    const envelope = BudgetApp.getEnvelope(envelopeId);
    if (!envelope) return;
    
    // Find the cell
    const cell = document.getElementById(`planned_${envelopeId}`);
    if (!cell) return;
    
    const currentValue = envelope.planned;
    
    // Replace cell content with input
    cell.innerHTML = `
        <input 
            type="number" 
            class="editing-input" 
            id="edit_planned_${envelopeId}" 
            value="${currentValue}" 
            step="0.01" 
            min="0"
        >
        <div class="edit-hint">Enter to save, Esc to cancel</div>
    `;
    
    const input = document.getElementById(`edit_planned_${envelopeId}`);
    input.focus();
    input.select(); // Highlight the current value
    
    // Handle Enter key (save)
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            savePlannedAmount(envelopeId, input.value);
        } else if (e.key === 'Escape') {
            // Cancel - just re-render
            renderEnvelopes();
        }
    });
    
    // Handle blur (clicking away) - save
    input.addEventListener('blur', function() {
        // Small delay to allow Enter key to process first
        setTimeout(() => {
            if (document.getElementById(`edit_planned_${envelopeId}`)) {
                savePlannedAmount(envelopeId, input.value);
            }
        }, 100);
    });
}

function savePlannedAmount(envelopeId, newValue) {
    const numValue = parseFloat(newValue);
    
    // Validate
    if (isNaN(numValue) || numValue < 0) {
        alert('Please enter a valid positive number');
        renderEnvelopes();
        return;
    }
    
    // Update the envelope
    BudgetApp.updateEnvelope(envelopeId, { planned: numValue });
    
    // Update UI
    updateDashboard();
    renderCategoryFilters();
    renderEnvelopes();
}

// ===== INCOME OPERATIONS =====

function handleAddIncome(e) {
    e.preventDefault();
    
    const source = document.getElementById('incomeSource').value.trim();
    const frequency = document.getElementById('incomeFrequency').value;
    const amount = document.getElementById('incomeAmount').value;
    const date = document.getElementById('incomeDate').value;
    const accountId = document.getElementById('incomeAccount').value; // Add this line
    
    // Validate source name
    if (!source) {
        alert('Please enter an income source name');
        return;
    }
    
    BudgetApp.addIncome(source, amount, date, frequency, accountId); // Update this line
    
    // Update UI
    updateDashboard();
    
    // Reset and close
    e.target.reset();
    document.getElementById('incomeDate').valueAsDate = new Date();
    closeModal('incomeModal');
    
    alert(`Income of ${BudgetApp.formatCurrency(amount)} added! Go to "Fund Envelopes" to allocate it.`);
}

// ===== FUNDING OPERATIONS =====

function openModal(modalId) {
    // Special handling for envelope modal
    if (modalId === 'envelopeModal') {
        updateCategorySuggestions();
        
        if (AppState.activeCategory !== null) {
            setTimeout(() => {
                document.getElementById('envelopeCategory').value = AppState.activeCategory;
            }, 10);
        }
    }
    
    // Special handling for income modal
    if (modalId === 'incomeModal') {
        populateAccountDropdown('incomeAccount');
    }
    
    // Special handling for funding modal
    if (modalId === 'fundingModal') {
        prepareFundingModal();
    }
    
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function prepareFundingModal() {
    const available = BudgetApp.getAvailableToFund();
    const envelopes = BudgetApp.getAllEnvelopes();
    const templates = BudgetApp.getAllTemplates();
    
    // Update available amount
    document.getElementById('fundingAvailable').textContent = BudgetApp.formatCurrency(available);
    
    // Build template quick-apply section
    let templateQuickApplyHTML = '';
    if (templates.length > 0) {
        const today = new Date().getDate();
        const todaysTemplates = templates.filter(t => t.dayOfMonth === today);
        
        const templateOptions = templates
            .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
            .map(t => {
                const isToday = t.dayOfMonth === today;
                return `<option value="${t.id}">${isToday ? '⭐ ' : ''}${t.name} (${t.dayOfMonth}${getDaySuffix(t.dayOfMonth)})</option>`;
            }).join('');
        
        templateQuickApplyHTML = `
            <div class="template-quick-apply">
                <h3>⚡ Quick Apply Template</h3>
                ${todaysTemplates.length > 0 ? '<p style="color: #48bb78; font-size: 0.9em; margin-bottom: 8px;">⭐ You have templates scheduled for today!</p>' : ''}
                <div class="template-select-row">
                    <select id="templateSelect">
                        <option value="">Select a template...</option>
                        ${templateOptions}
                    </select>
                    <button class="btn btn-primary" onclick="applySelectedTemplate()">Apply</button>
                </div>
            </div>
        `;
    }
    
    function applySelectedTemplate() {
        const select = document.getElementById('templateSelect');
        const templateId = select.value;
        
        if (!templateId) {
            alert('Please select a template');
            return;
        }
        
        try {
            const template = BudgetApp.getTemplate(templateId);
            
            // Fill in the funding inputs with template values
            Object.entries(template.allocations).forEach(([envId, amount]) => {
                const input = document.getElementById(`fund_${envId}`);
                if (input) {
                    input.value = amount.toFixed(2);
                }
            });
            
            alert(`✅ Template "${template.name}" loaded! Review and click "Apply Funding" to confirm.`);
            
        } catch (error) {
            alert('❌ ' + error.message);
        }
    }

    // Build input fields for each envelope
    const fundingList = document.getElementById('fundingList');
    
    if (available === 0) {
        fundingList.innerHTML = templateQuickApplyHTML + `
            <div style="text-align: center; padding: 20px; color: #718096;">
                <p>No unallocated income available.</p>
                <p>Add income first using the "Add Income" button.</p>
            </div>
        `;
        return;
    }
    
    if (envelopes.length === 0) {
        fundingList.innerHTML = templateQuickApplyHTML + `
            <div style="text-align: center; padding: 20px; color: #718096;">
                <p>No envelopes to fund.</p>
                <p>Create envelopes first!</p>
            </div>
        `;
        return;
    }
    
    fundingList.innerHTML = templateQuickApplyHTML + envelopes.map(env => {
        const remaining = env.planned - env.funded;
        const suggestedAmount = Math.min(remaining, available);
        
        return `
            <div class="funding-item">
                <label>
                    <strong>${env.name}</strong><br>
                    <small>Planned: ${BudgetApp.formatCurrency(env.planned)} | 
                    Funded: ${BudgetApp.formatCurrency(env.funded)} | 
                    Remaining: ${BudgetApp.formatCurrency(remaining)}</small>
                </label>
                <input 
                    type="number" 
                    id="fund_${env.id}" 
                    placeholder="0.00" 
                    step="0.01" 
                    min="0"
                    max="${available}"
                    value="${suggestedAmount > 0 ? suggestedAmount.toFixed(2) : ''}"
                >
            </div>
        `;
    }).join('');
}

function applyFunding() {
    const envelopes = BudgetApp.getAllEnvelopes();
    const fundingPlan = {};
    
    // Collect amounts from input fields
    envelopes.forEach(env => {
        const input = document.getElementById(`fund_${env.id}`);
        const amount = parseFloat(input.value || 0);
        if (amount > 0) {
            fundingPlan[env.id] = amount;
        }
    });
    
    // Try to apply funding
    try {
        BudgetApp.fundEnvelopes(fundingPlan);
        
        // Success! Update UI
        updateDashboard();
        renderEnvelopes();
        closeModal('fundingModal');
        
        alert('Funding applied successfully!');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ===== SPENDING OPERATIONS =====

function openSpendModal(envelopeId) {
    const envelope = BudgetApp.getEnvelope(envelopeId);
    const balance = BudgetApp.getEnvelopeBalance(envelopeId);
    
    // Get accounts for dropdown
    const accounts = BudgetApp.getAllAccounts();
    const accountOptions = accounts.length > 0 
        ? '<option value="">Select account...</option>' + accounts.map(acc => 
            `<option value="${acc.id}">${acc.name} (${acc.type})</option>`
          ).join('')
        : '<option value="">No accounts - add one first</option>';
    
    // Create a modal dynamically for spending
    const modalHTML = `
        <div id="spendModal" class="modal" style="display: block;">
            <div class="modal-content">
                <span class="close" onclick="closeModal('spendModal'); this.parentElement.parentElement.remove();">&times;</span>
                <h2>Record Expense: ${envelope.name}</h2>
                <p class="info">Available balance: <strong>${BudgetApp.formatCurrency(balance)}</strong></p>
                <form id="spendForm" onsubmit="handleSpend(event, '${envelopeId}')">
                    <label>Amount:</label>
                    <input type="number" id="spendAmount" placeholder="25.50" step="0.01" max="${balance}" required>
                    
                    <label>Description:</label>
                    <input type="text" id="spendDescription" placeholder="e.g., Walmart groceries" required>
                    
                    <label>Date:</label>
                    <input type="date" id="spendDate" required>
                    
                    <label>Paid From Account:</label>
                    <select id="spendAccount">
                        ${accountOptions}
                    </select>
                    <small style="color: #718096; font-size: 0.85em; display: block; margin-top: 5px;">
                        💡 Optional: Track which account paid for this
                    </small>
                    
                    <button type="submit" class="btn btn-primary">Record Expense</button>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Set today's date
    document.getElementById('spendDate').valueAsDate = new Date();
}

function handleSpend(e, envelopeId) {
    e.preventDefault();
    
    const amount = document.getElementById('spendAmount').value;
    const description = document.getElementById('spendDescription').value;
    const date = document.getElementById('spendDate').value;
    const accountId = document.getElementById('spendAccount').value; // Add this line
    
    try {
        BudgetApp.addTransaction(envelopeId, amount, description, date, accountId); // Update this line
        
        // Update UI
        updateDashboard();
        renderEnvelopes();
        
        // Remove modal
        const modal = document.getElementById('spendModal');
        modal.remove();
        
        alert('Expense recorded!');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ===== TRANSACTION HISTORY =====

function openTransactionHistory(envelopeId) {
    const envelope = BudgetApp.getEnvelope(envelopeId);
    const transactions = BudgetApp.getEnvelopeTransactions(envelopeId);
    
    if (!envelope) return;
    
    // Sort transactions by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Build transaction list HTML
    let transactionsHTML = '';
    
    if (transactions.length === 0) {
        transactionsHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <h3>No transactions yet</h3>
                <p>Spending recorded in this envelope will appear here.</p>
            </div>
        `;
    } else {
        transactionsHTML = `
            <div class="transaction-list">
                ${transactions.map(txn => {
                    const account = txn.accountId ? BudgetApp.getAccount(txn.accountId) : null;
                    const accountLabel = account ? ` 🏦 ${account.name}` : '';
                    
                    return `
                        <div class="transaction-item">
                            <div class="transaction-main">
                                <div class="transaction-info">
                                    <div class="transaction-description">${txn.description}</div>
                                    <div class="transaction-date">${formatDate(txn.date)}${accountLabel}</div>
                                </div>
                                <div class="transaction-amount">
                                    ${BudgetApp.formatCurrency(txn.amount)}
                                </div>
                            </div>
                            <div class="transaction-actions">
                                <button 
                                    class="btn-delete-transaction" 
                                    onclick="deleteTransaction('${txn.id}', '${envelopeId}')"
                                    title="Delete transaction"
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    // Create modal
    const modalHTML = `
        <div id="transactionHistoryModal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 600px;">
                <span class="close" onclick="closeTransactionHistoryModal()">&times;</span>
                <h2>Transaction History: ${envelope.name}</h2>
                <div class="transaction-summary">
                    <div class="summary-row">
                        <span>Total Spent:</span>
                        <strong>${BudgetApp.formatCurrency(envelope.spent)}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Transactions:</span>
                        <strong>${transactions.length}</strong>
                    </div>
                </div>
                ${transactionsHTML}
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeTransactionHistoryModal() {
    const modal = document.getElementById('transactionHistoryModal');
    if (modal) {
        modal.remove();
    }
}

function deleteTransaction(transactionId, envelopeId) {
    if (!confirm('Delete this transaction? This cannot be undone.')) {
        return;
    }
    
    // Get the transaction details before deleting
    const transactions = Storage.getTransactions();
    const transaction = transactions.find(txn => txn.id === transactionId);
    
    if (!transaction) {
        alert('Transaction not found');
        return;
    }
    
    // Remove transaction from storage
    const filtered = transactions.filter(txn => txn.id !== transactionId);
    Storage.saveTransactions(filtered);
    
    // Update envelope's spent amount (subtract the deleted transaction)
    const envelope = BudgetApp.getEnvelope(envelopeId);
    if (envelope) {
        BudgetApp.updateEnvelope(envelopeId, {
            spent: envelope.spent - transaction.amount
        });
    }
    
    // Update UI
    updateDashboard();
    renderCategoryFilters();
    renderEnvelopes();
    
    // Close and reopen the modal to show updated list
    closeTransactionHistoryModal();
    openTransactionHistory(envelopeId);
}

function formatDate(dateString) {
    // Parse the date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ===== CASH FLOW CALENDAR =====

function openCashFlowModal() {
    const currentBalance = Storage.getBankBalance();
    
    const modalHTML = `
        <div id="cashFlowModal" class="modal cashflow-modal" style="display: block;">
            <div class="modal-content">
                <span class="close" onclick="closeCashFlowModal()">&times;</span>
                <h2>📊 Cash Flow Calendar - Next 30 Days</h2>
                
                <!-- Bank Balance Input -->
                <div class="balance-input-section">
                    <div class="balance-input-row">
                        <label>Current Bank Balance:</label>
                        <input 
                            type="number" 
                            id="bankBalanceInput" 
                            value="${currentBalance}" 
                            step="0.01" 
                            placeholder="0.00"
                        >
                        <button class="btn btn-primary" onclick="saveBankBalance()">
                            💾 Save Balance
                        </button>
                    </div>
                </div>
                
                <div id="cashFlowContent">
                    <!-- Content will be generated here -->
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    renderCashFlowTimeline();
}

function closeCashFlowModal() {
    const modal = document.getElementById('cashFlowModal');
    if (modal) {
        modal.remove();
    }
}

function saveBankBalance() {
    const input = document.getElementById('bankBalanceInput');
    const balance = parseFloat(input.value) || 0;
    
    Storage.saveBankBalance(balance);
    renderCashFlowTimeline();
    
    alert('✅ Bank balance saved!');
}

function renderCashFlowTimeline() {
    const container = document.getElementById('cashFlowContent');
    const startingBalance = Storage.getBankBalance();
    
    if (startingBalance === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <h3>💡 Enter Your Current Bank Balance</h3>
                <p>Set your current bank balance above to see your cash flow projection.</p>
            </div>
        `;
        return;
    }
    
    // Get all income and transactions
    const income = Storage.getIncome();
    const transactions = Storage.getTransactions();
    
    // Build timeline data for next 30 days
    const timeline = buildTimelineData(startingBalance, income, transactions, 30);
    
    // Calculate summary stats
    const totalIncome = income
        .filter(inc => {
            const incomeDate = new Date(inc.date);
            const today = new Date();
            const futureDate = new Date();
            futureDate.setDate(today.getDate() + 30);
            return incomeDate >= today && incomeDate <= futureDate;
        })
        .reduce((sum, inc) => sum + inc.amount, 0);
    
    const totalExpenses = transactions
        .filter(txn => {
            const txnDate = new Date(txn.date);
            const today = new Date();
            const futureDate = new Date();
            futureDate.setDate(today.getDate() + 30);
            return txnDate >= today && txnDate <= futureDate;
        })
        .reduce((sum, txn) => sum + txn.amount, 0);
    
    const endingBalance = timeline[timeline.length - 1].balance;
    const lowestBalance = Math.min(...timeline.map(day => day.balance));
    
    // Build summary
    const summaryHTML = `
        <div class="cashflow-summary">
            <div class="cashflow-summary-item">
                <div class="label">Starting Balance</div>
                <div class="value">${BudgetApp.formatCurrency(startingBalance)}</div>
            </div>
            <div class="cashflow-summary-item">
                <div class="label">Income (30 days)</div>
                <div class="value positive">+${BudgetApp.formatCurrency(totalIncome)}</div>
            </div>
            <div class="cashflow-summary-item">
                <div class="label">Expenses (30 days)</div>
                <div class="value negative">-${BudgetApp.formatCurrency(totalExpenses)}</div>
            </div>
            <div class="cashflow-summary-item">
                <div class="label">Projected Balance</div>
                <div class="value ${endingBalance >= 0 ? 'positive' : 'negative'}">
                    ${BudgetApp.formatCurrency(endingBalance)}
                </div>
            </div>
            <div class="cashflow-summary-item">
                <div class="label">Lowest Point</div>
                <div class="value ${lowestBalance >= 0 ? 'positive' : 'negative'}">
                    ${BudgetApp.formatCurrency(lowestBalance)}
                </div>
            </div>
        </div>
    `;
    
    // Build timeline HTML
    const timelineHTML = timeline.map(day => {
        const balanceClass = day.balance < 0 ? 'negative' : day.balance < 500 ? 'warning' : 'positive';
        
        let transactionsHTML = '';
        if (day.items.length === 0) {
            transactionsHTML = '<div class="no-activity">No activity</div>';
        } else {
            transactionsHTML = day.items.map(item => `
                <div class="timeline-transaction ${item.type}">
                    <span class="description">${item.description}</span>
                    <span class="amount">${item.type === 'income' ? '+' : '-'}${BudgetApp.formatCurrency(Math.abs(item.amount))}</span>
                </div>
            `).join('');
        }
        
        let warningHTML = '';
        if (day.balance < 0) {
            warningHTML = '<div class="balance-warning">⚠️ Overdraft Warning!</div>';
        } else if (day.balance < 500 && day.balance >= 0) {
            warningHTML = '<div class="balance-warning" style="background: #feebc8; color: #7c2d12; border-left-color: #ed8936;">⚠️ Low Balance Warning</div>';
        }
        
        return `
            <div class="timeline-day">
                <div class="timeline-date">
                    <div class="day-name">${day.dayName}</div>
                    <div class="day-number">${day.dayMonth}</div>
                </div>
                <div class="timeline-content">
                    <div class="timeline-balance ${balanceClass}">
                        Balance: ${BudgetApp.formatCurrency(day.balance)}
                    </div>
                    ${warningHTML}
                    <div class="timeline-transactions">
                        ${transactionsHTML}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = summaryHTML + '<div class="timeline-container">' + timelineHTML + '</div>';
}

function buildTimelineData(startingBalance, income, transactions, days) {
    const timeline = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentBalance = startingBalance;
    
    for (let i = 0; i < days; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Get all income for this date
        const dayIncome = income.filter(inc => inc.date === dateString);
        
        // Get all transactions for this date
        const dayTransactions = transactions.filter(txn => txn.date === dateString);
        
        // Build items array
        const items = [];
        
        dayIncome.forEach(inc => {
            const frequencyLabel = inc.frequency ? ` (${getFrequencyLabel(inc.frequency)})` : '';
            items.push({
                type: 'income',
                description: `${inc.source}${frequencyLabel}`,
                amount: inc.amount
            });
            currentBalance += inc.amount;
        });
                
        dayTransactions.forEach(txn => {
            const envelope = BudgetApp.getEnvelope(txn.envelopeId);
            items.push({
                type: 'expense',
                description: `${txn.description} (${envelope ? envelope.name : 'Unknown'})`,
                amount: txn.amount
            });
            currentBalance -= txn.amount;
        });
        
        timeline.push({
            date: currentDate,
            dateString: dateString,
            dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
            dayMonth: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            balance: currentBalance,
            items: items
        });
    }
    
    return timeline;
}

// ===== BACKUP & RESTORE =====

function exportData() {
    try {
        // Get all data from storage
        const data = Storage.exportData();
        
        // Create a blob (file in memory)
        const jsonString = JSON.stringify(data, null, 2); // Pretty print with 2-space indent
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `budget-backup-${timestamp}.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        alert('✅ Backup exported successfully!\n\nFile saved as: ' + link.download);
    } catch (error) {
        alert('❌ Error exporting data: ' + error.message);
        console.error('Export error:', error);
    }
}

function importData(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    // Confirm before overwriting existing data
    const confirmMsg = '⚠️ WARNING: Importing will REPLACE all current data!\n\n' +
                      'Current data will be lost unless you have a backup.\n\n' +
                      'Continue with import?';
    
    if (!confirm(confirmMsg)) {
        // Reset file input
        event.target.value = '';
        return;
    }
    
    // Read the file
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            // Parse JSON
            const data = JSON.parse(e.target.result);
            
            // Validate the data structure (support both v2.0 and legacy formats)
            const isNewFormat = data.exportVersion === '2.0' && data.budgets && data.budgetData;
            const isLegacyFormat = data.envelopes || data.income || data.transactions;
            
            if (!isNewFormat && !isLegacyFormat) {
                throw new Error('Invalid backup file format. Missing required data.');
            }
            
            // Import the data
            Storage.importData(data);
            
            // Refresh the entire UI
            updateBudgetDropdown(); // Update budget selector
            updateMonthDisplay(); // Update month display
            updateDashboard();
            renderCategoryFilters();
            renderEnvelopes();
            
            // Show appropriate success message based on format
            if (isNewFormat) {
                // Multi-budget import
                const budgetCount = data.budgets ? data.budgets.length : 0;
                const budgetNames = data.budgets ? data.budgets.map(b => b.name).join(', ') : '';
                const activeBudgetName = data.budgets.find(b => b.id === data.activeBudget)?.name || 'Unknown';
                
                alert('✅ Complete backup restored!\n\n' +
                      `Budgets restored: ${budgetCount}\n` +
                      `(${budgetNames})\n\n` +
                      `Active budget: ${activeBudgetName}`);
            } else {
                // Legacy single-budget import
                alert('✅ Data imported successfully!\n\n' +
                      `Envelopes: ${data.envelopes?.length || 0}\n` +
                      `Income records: ${data.income?.length || 0}\n` +
                      `Transactions: ${data.transactions?.length || 0}\n` +
                      `Bank Balance: ${BudgetApp.formatCurrency(data.bankBalance || 0)}`);
            }
            
        } catch (error) {
            alert('❌ Error importing data: ' + error.message + '\n\nPlease check the file and try again.');
            console.error('Import error:', error);
        }
        
        // Reset file input so same file can be imported again if needed
        event.target.value = '';
    };
    
    reader.onerror = function() {
        alert('❌ Error reading file. Please try again.');
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// ===== FUNDING TEMPLATES =====

function openTemplatesModal() {
    openModal('templatesModal');
    renderTemplatesList();
}

function renderTemplatesList() {
    const container = document.getElementById('templatesList');
    const templates = BudgetApp.getAllTemplates();
    
    if (templates.length === 0) {
        container.innerHTML = `
            <div class="empty-templates">
                <h3>No templates yet!</h3>
                <p>Create a template to save your funding plan and apply it quickly each month.</p>
            </div>
        `;
        return;
    }
    
    // Sort by day of month
    templates.sort((a, b) => a.dayOfMonth - b.dayOfMonth);
    
    const today = new Date().getDate();
    
    container.innerHTML = `
        <div class="templates-list">
            ${templates.map(template => {
                const isToday = template.dayOfMonth === today;
                const totalAllocated = Object.values(template.allocations).reduce((sum, amt) => sum + amt, 0);
                
                // Build allocation preview
                const allocationItems = Object.entries(template.allocations)
                    .map(([envId, amount]) => {
                        const envelope = BudgetApp.getEnvelope(envId);
                        if (!envelope) return '';
                        return `<span class="allocation-badge">${envelope.name}: ${BudgetApp.formatCurrency(amount)}</span>`;
                    })
                    .filter(html => html !== '')
                    .join('');
                
                return `
                    <div class="template-card">
                        <div class="template-header">
                            <div class="template-title">${template.name}</div>
                            <div class="template-date-badge ${isToday ? 'today' : ''}">
                                ${isToday ? '📅 TODAY - ' : '📅 '}${template.dayOfMonth}${getDaySuffix(template.dayOfMonth)} of month
                            </div>
                        </div>
                        
                        <div class="template-amount">
                            Expected: ${BudgetApp.formatCurrency(template.expectedAmount)}
                        </div>
                        
                        <div class="template-allocations-preview">
                            ${allocationItems}
                        </div>
                        
                        <div style="margin-bottom: 10px; color: #718096; font-size: 0.9em;">
                            Total Allocated: ${BudgetApp.formatCurrency(totalAllocated)}
                        </div>
                        
                        <div class="template-actions">
                            <button class="btn btn-primary btn-small" onclick="applyTemplateNow('${template.id}')">
                                ⚡ Apply Now
                            </button>
                            <button class="btn btn-info btn-small" onclick="editTemplate('${template.id}')">
                                ✏️ Edit
                            </button>
                            <button class="btn btn-delete btn-small" onclick="deleteTemplateConfirm('${template.id}')">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function getDaySuffix(day) {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

function openCreateTemplateModal() {
    document.getElementById('templateModalTitle').textContent = 'Create Funding Template';
    document.getElementById('templateId').value = '';
    document.getElementById('templateForm').reset();
    
    renderTemplateAllocationInputs();
    openModal('createTemplateModal');
}

function renderTemplateAllocationInputs() {
    const container = document.getElementById('templateAllocations');
    const envelopes = BudgetApp.getAllEnvelopes();
    
    if (envelopes.length === 0) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #718096;">
                <p>No envelopes available. Create envelopes first!</p>
            </div>
        `;
        return;
    }
    
    // Get existing allocations if editing
    const templateId = document.getElementById('templateId').value;
    let existingAllocations = {};
    if (templateId) {
        const template = BudgetApp.getTemplate(templateId);
        if (template) {
            existingAllocations = template.allocations;
        }
    }
    
    container.innerHTML = envelopes.map(env => `
        <div class="allocation-input-row">
            <label>${env.name}</label>
            <input 
                type="number" 
                id="alloc_${env.id}" 
                placeholder="0.00" 
                step="0.01" 
                min="0"
                value="${existingAllocations[env.id] || ''}"
            >
        </div>
    `).join('');
}

function handleTemplateFormSubmit(e) {
    e.preventDefault();
    
    const templateId = document.getElementById('templateId').value;
    const name = document.getElementById('templateName').value;
    const day = parseInt(document.getElementById('templateDay').value);
    const expectedAmount = parseFloat(document.getElementById('templateAmount').value);
    
    // Validate day
    if (day < 1 || day > 31) {
        alert('Day must be between 1 and 31');
        return;
    }
    
    // Collect allocations
    const envelopes = BudgetApp.getAllEnvelopes();
    const allocations = {};
    let totalAllocated = 0;
    
    envelopes.forEach(env => {
        const input = document.getElementById(`alloc_${env.id}`);
        const amount = parseFloat(input.value || 0);
        if (amount > 0) {
            allocations[env.id] = amount;
            totalAllocated += amount;
        }
    });
    
    // Validate at least one allocation
    if (Object.keys(allocations).length === 0) {
        alert('Please allocate to at least one envelope');
        return;
    }
    
    // Warn if over-allocated
    if (totalAllocated > expectedAmount) {
        if (!confirm(`Warning: Total allocations (${BudgetApp.formatCurrency(totalAllocated)}) exceed expected amount (${BudgetApp.formatCurrency(expectedAmount)}). Continue anyway?`)) {
            return;
        }
    }
    
    // Create or update template
    if (templateId) {
        BudgetApp.updateTemplate(templateId, {
            name: name,
            dayOfMonth: day,
            expectedAmount: expectedAmount,
            allocations: allocations
        });
        alert('✅ Template updated!');
    } else {
        BudgetApp.createTemplate(name, day, expectedAmount, allocations);
        alert('✅ Template created!');
    }
    
    // Close modal and refresh list
    closeModal('createTemplateModal');
    renderTemplatesList();
}


function handleSpendingTemplateFormSubmit(e) {
    e.preventDefault();
    
    const templateId = document.getElementById('spendingTemplateId').value;
    const name = document.getElementById('spendingTemplateName').value.trim();
    
    if (!name) {
        alert('Please enter a template name');
        return;
    }
    
    // Collect expenses from table rows
    const expenseRows = document.querySelectorAll('#spendingTemplateExpenses tr');
    const expenses = [];
    let validationErrors = [];
    
    expenseRows.forEach((row, index) => {
        const envelopeId = row.querySelector('.expense-envelope').value;
        const envelopeSelect = row.querySelector('.expense-envelope');
        const envelopeName = envelopeSelect.options[envelopeSelect.selectedIndex]?.text || '';
        const amountValue = row.querySelector('.expense-amount').value;
        const dayValue = row.querySelector('.expense-day').value;
        const accountId = row.querySelector('.expense-account').value || null;
        
        // Parse values
        const amount = parseFloat(amountValue);
        const dayOfMonth = dayValue ? parseInt(dayValue) : null;
        
        // Validate this row
        if (!envelopeId) {
            validationErrors.push(`Row ${index + 1}: Please select an envelope`);
        }
    
        if (!amountValue || isNaN(amount) || amount <= 0) {
            validationErrors.push(`Row ${index + 1}: Please enter a valid amount greater than 0`);
        }
        
        // If all required fields are valid, add the expense
        if (envelopeId && !isNaN(amount) && amount > 0) {
            expenses.push({
                envelopeId,
                description: envelopeName,
                amount,
                dayOfMonth,
                accountId
            });
        }
    });
    
    // Show validation errors if any
    if (validationErrors.length > 0) {
        alert('Please fix these errors:\n\n' + validationErrors.join('\n'));
        return;
    }
    
    if (expenses.length === 0) {
        alert('Please add at least one valid expense');
        return;
    }
    
    try {
        if (templateId) {
            BudgetApp.updateSpendingTemplate(templateId, { name, expenses });
            alert('✅ Spending template updated!');
        } else {
            BudgetApp.createSpendingTemplate(name, expenses);
            alert('✅ Spending template created!');
        }
        
        closeModal('createSpendingTemplateModal');
        renderSpendingTemplatesList();
        
    } catch (error) {
        alert('❌ Error: ' + error.message);
        console.error('Spending template error:', error);
    }
}

function editTemplate(templateId) {
    const template = BudgetApp.getTemplate(templateId);
    if (!template) {
        alert('Template not found');
        return;
    }
    
    // Pre-fill form
    document.getElementById('templateModalTitle').textContent = 'Edit Funding Template';
    document.getElementById('templateId').value = template.id;
    document.getElementById('templateName').value = template.name;
    document.getElementById('templateDay').value = template.dayOfMonth;
    document.getElementById('templateAmount').value = template.expectedAmount;
    
    renderTemplateAllocationInputs();
    openModal('createTemplateModal');
}

function deleteTemplateConfirm(templateId) {
    const template = BudgetApp.getTemplate(templateId);
    if (confirm(`Delete template "${template.name}"? This cannot be undone.`)) {
        BudgetApp.deleteTemplate(templateId);
        renderTemplatesList();
    }
}

function applyTemplateNow(templateId) {
    try {
        const template = BudgetApp.applyTemplate(templateId);
        
        // Update UI
        updateDashboard();
        renderCategoryFilters();
        renderEnvelopes();
        
        alert(`✅ Template "${template.name}" applied successfully!`);
        
        // Close templates modal if open
        closeModal('templatesModal');
    } catch (error) {
        alert('❌ ' + error.message);
    }
}

// ===== INCOME MANAGEMENT =====

function openManageIncomeModal() {
    openModal('manageIncomeModal');
    renderIncomeRecordsList();
}

function renderIncomeRecordsList() {
    const container = document.getElementById('incomeRecordsList');
    const income = BudgetApp.getAllIncome();
    
    if (income.length === 0) {
        container.innerHTML = `
            <div class="empty-income">
                <h3>No income records yet!</h3>
                <p>Add income using the "Add Income" button to track your paychecks.</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    income.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate summary stats
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    const allocatedIncome = income.filter(inc => inc.allocated).reduce((sum, inc) => sum + inc.amount, 0);
    const unallocatedIncome = income.filter(inc => !inc.allocated).reduce((sum, inc) => sum + inc.amount, 0);
    
    // Build summary
    const summaryHTML = `
        <div class="income-summary-stats">
            <div class="income-stat-item">
                <div class="label">Total Income</div>
                <div class="value positive">${BudgetApp.formatCurrency(totalIncome)}</div>
            </div>
            <div class="income-stat-item">
                <div class="label">Allocated</div>
                <div class="value">${BudgetApp.formatCurrency(allocatedIncome)}</div>
            </div>
            <div class="income-stat-item">
                <div class="label">Unallocated</div>
                <div class="value positive">${BudgetApp.formatCurrency(unallocatedIncome)}</div>
            </div>
            <div class="income-stat-item">
                <div class="label">Income Records</div>
                <div class="value">${income.length}</div>
            </div>
        </div>
    `;
    
    // Build income records list
    const recordsHTML = income.map(inc => {
        const frequencyLabel = getFrequencyLabel(inc.frequency);
        const account = inc.accountId ? BudgetApp.getAccount(inc.accountId) : null;
        const accountLabel = account ? `🏦 ${account.name}` : '';
        
        return `
            <div class="income-record-card ${inc.allocated ? 'allocated' : ''}">
                <div class="income-record-header">
                    <div>
                        <div class="income-record-source">${inc.source}</div>
                        ${inc.frequency ? `<div style="color: #718096; font-size: 0.9em; margin-top: 4px;">${frequencyLabel}</div>` : ''}
                        ${accountLabel ? `<div style="color: #3182ce; font-size: 0.9em; margin-top: 4px;">${accountLabel}</div>` : ''}
                    </div>
                    <div class="income-record-date">${formatDate(inc.date)}</div>
                </div>
                
                <div class="income-record-amount">
                    ${BudgetApp.formatCurrency(inc.amount)}
                </div>
                
                <div class="income-record-status ${inc.allocated ? 'allocated' : 'unallocated'}">
                    ${inc.allocated ? '✓ Allocated to envelopes' : '○ Not yet allocated'}
                </div>
                
                <div class="income-record-actions">
                    <button class="btn btn-info btn-small" onclick="openEditIncomeModal('${inc.id}')">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-delete btn-small" onclick="deleteIncomeConfirm('${inc.id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = summaryHTML + '<div class="income-records-list">' + recordsHTML + '</div>';
}

function openEditIncomeModal(incomeId) {
    const income = Storage.getIncome().find(inc => inc.id === incomeId);
    
    if (!income) {
        alert('Income record not found');
        return;
    }
    
    // Populate account dropdown
    populateAccountDropdown('editIncomeAccount');
    
    // Pre-fill form
    document.getElementById('editIncomeId').value = income.id;
    document.getElementById('editIncomeSource').value = income.source;
    document.getElementById('editIncomeFrequency').value = income.frequency || 'other';
    document.getElementById('editIncomeAmount').value = income.amount;
    document.getElementById('editIncomeDate').value = income.date;
    document.getElementById('editIncomeAccount').value = income.accountId || ''; // Add this line
    
    // Show warning if already allocated
    const warningDiv = document.getElementById('editIncomeWarning');
    if (income.allocated) {
        warningDiv.style.display = 'block';
    } else {
        warningDiv.style.display = 'none';
    }
    
    openModal('editIncomeModal');
}

function handleEditIncome(e) {
    e.preventDefault();
    
    const id = document.getElementById('editIncomeId').value;
    const source = document.getElementById('editIncomeSource').value.trim();
    const frequency = document.getElementById('editIncomeFrequency').value;
    const amount = parseFloat(document.getElementById('editIncomeAmount').value);
    const date = document.getElementById('editIncomeDate').value;
    const accountId = document.getElementById('editIncomeAccount').value; // Add this line
    
    // Validate
    if (!source || !frequency || isNaN(amount) || amount <= 0 || !date) {
        alert('Please fill in all fields with valid values');
        return;
    }
    
    // Get current income record
    const allIncome = Storage.getIncome();
    const incomeIndex = allIncome.findIndex(inc => inc.id === id);
    
    if (incomeIndex === -1) {
        alert('Income record not found');
        return;
    }
    
    const oldIncome = allIncome[incomeIndex];
    
    // Warn if allocated and amount is decreasing
    if (oldIncome.allocated && amount < oldIncome.amount) {
        const difference = oldIncome.amount - amount;
        if (!confirm(`⚠️ Warning: You're decreasing allocated income by ${BudgetApp.formatCurrency(difference)}. This may cause your "Available to Fund" to go negative. Continue?`)) {
            return;
        }
    }
    
    // Update the income record
    allIncome[incomeIndex] = {
        ...oldIncome,
        source: source,
        frequency: frequency,
        amount: amount,
        date: date,
        accountId: accountId || null // Add this line
    };
    
    Storage.saveIncome(allIncome);
    
    // Update UI
    updateDashboard();
    renderIncomeRecordsList();
    closeModal('editIncomeModal');
    
    alert('✅ Income record updated!');
}

function deleteIncomeConfirm(incomeId) {
    const income = Storage.getIncome().find(inc => inc.id === incomeId);
    
    if (!income) {
        alert('Income record not found');
        return;
    }
    
    let confirmMsg = `Delete income record?\n\n`;
    confirmMsg += `Source: ${income.source}\n`;
    confirmMsg += `Amount: ${BudgetApp.formatCurrency(income.amount)}\n`;
    confirmMsg += `Date: ${formatDate(income.date)}\n\n`;
    
    if (income.allocated) {
        confirmMsg += `⚠️ WARNING: This income was already allocated to envelopes. Deleting it will make your "Available to Fund" go negative by ${BudgetApp.formatCurrency(income.amount)}.\n\n`;
        confirmMsg += `This cannot be undone. Continue?`;
    } else {
        confirmMsg += `This cannot be undone.`;
    }
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // Delete the income
    const allIncome = Storage.getIncome();
    const filtered = allIncome.filter(inc => inc.id !== incomeId);
    Storage.saveIncome(filtered);
    
    // Update UI
    updateDashboard();
    renderIncomeRecordsList();
    
    alert('Income record deleted.');
}

function getFrequencyLabel(frequency) {
    const labels = {
        'weekly': 'Weekly',
        'biweekly': 'Biweekly (Every 2 weeks)',
        'semimonthly': 'Twice Monthly',
        'monthly': 'Monthly',
        'quarterly': 'Quarterly',
        'annually': 'Annually',
        'other': 'One-time/Other'
    };
    return labels[frequency] || 'Other';
}

// ===== ACCOUNT MANAGEMENT =====

function openAccountsModal() {
    openModal('accountsModal');
    renderAccountsList();
}

function renderAccountsList() {
    const container = document.getElementById('accountsList');
    const accounts = BudgetApp.getAllAccounts();
    
    if (accounts.length === 0) {
        container.innerHTML = `
            <div class="empty-accounts">
                <h3>No accounts yet!</h3>
                <p>Add your bank accounts, credit cards, and cash to track where your money is.</p>
            </div>
        `;
        return;
    }
    
    // Calculate summary
    const totalBalance = BudgetApp.getTotalAccountsBalance();
    const accountCount = accounts.length;
    
    const summaryHTML = `
        <div class="accounts-summary">
            <div class="account-summary-item">
                <div class="label">Total Balance</div>
                <div class="value">${BudgetApp.formatCurrency(totalBalance)}</div>
            </div>
            <div class="account-summary-item">
                <div class="label">Accounts</div>
                <div class="value">${accountCount}</div>
            </div>
        </div>
    `;
    
    // Build accounts list
    const accountsHTML = accounts.map(acc => {
        const balance = BudgetApp.getAccountBalance(acc.id);
        const balanceClass = balance < 0 ? 'negative' : '';
        
        return `
            <div class="account-card ${acc.type}">
                <div class="account-header">
                    <div class="account-name">${acc.name}</div>
                    <div class="account-type-badge">${acc.type}</div>
                </div>
                
                <div class="account-balance ${balanceClass}">
                    ${BudgetApp.formatCurrency(balance)}
                </div>
                
                <div class="account-details">
                    <div>Starting: ${BudgetApp.formatCurrency(acc.balance)}</div>
                </div>
                
                <div class="account-actions">
                    <button class="btn btn-primary btn-small" onclick="openAccountRegister('${acc.id}')">
                        📋 Open Register
                    </button>
                    <button class="btn btn-info btn-small" onclick="editAccount('${acc.id}')">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-delete btn-small" onclick="deleteAccountConfirm('${acc.id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = summaryHTML + '<div class="accounts-list">' + accountsHTML + '</div>';
}

function openCreateAccountModal() {
    document.getElementById('accountModalTitle').textContent = 'Add Bank Account';
    document.getElementById('accountId').value = '';
    document.getElementById('accountForm').reset();
    openModal('createAccountModal');
}

function handleAccountFormSubmit(e) {
    e.preventDefault();
    
    const accountId = document.getElementById('accountId').value;
    const name = document.getElementById('accountName').value.trim();
    const type = document.getElementById('accountType').value;
    const balance = parseFloat(document.getElementById('accountBalance').value);
    
    if (!name || isNaN(balance)) {
        alert('Please fill in all fields with valid values');
        return;
    }
    
    if (accountId) {
        // Update existing account
        BudgetApp.updateAccount(accountId, {
            name: name,
            type: type,
            balance: balance
        });
        alert('✅ Account updated!');
    } else {
        // Create new account
        BudgetApp.createAccount(name, type, balance);
        alert('✅ Account created!');
    }
    
    closeModal('createAccountModal');
    renderAccountsList();
    updateDashboard(); // Refresh dashboard in case it shows account totals
}

function editAccount(accountId) {
    const account = BudgetApp.getAccount(accountId);
    
    if (!account) {
        alert('Account not found');
        return;
    }
    
    document.getElementById('accountModalTitle').textContent = 'Edit Account';
    document.getElementById('accountId').value = account.id;
    document.getElementById('accountName').value = account.name;
    document.getElementById('accountType').value = account.type;
    document.getElementById('accountBalance').value = account.balance;
    
    openModal('createAccountModal');
}

function deleteAccountConfirm(accountId) {
    const account = BudgetApp.getAccount(accountId);
    
    // Check if account is being used
    const income = Storage.getIncome();
    const transactions = Storage.getTransactions();
    
    const incomeCount = income.filter(inc => inc.accountId === accountId).length;
    const transactionCount = transactions.filter(txn => txn.accountId === accountId).length;
    
    let confirmMsg = `Delete account "${account.name}"?\n\n`;
    
    if (incomeCount > 0 || transactionCount > 0) {
        confirmMsg += `⚠️ WARNING: This account is being used:\n`;
        if (incomeCount > 0) confirmMsg += `- ${incomeCount} income record(s)\n`;
        if (transactionCount > 0) confirmMsg += `- ${transactionCount} transaction(s)\n`;
        confirmMsg += `\nDeleting will remove account assignment from these records.\n\n`;
    }
    
    confirmMsg += `This cannot be undone. Continue?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // Remove account assignment from income and transactions
    if (incomeCount > 0) {
        income.forEach(inc => {
            if (inc.accountId === accountId) {
                delete inc.accountId;
            }
        });
        Storage.saveIncome(income);
    }
    
    if (transactionCount > 0) {
        transactions.forEach(txn => {
            if (txn.accountId === accountId) {
                delete txn.accountId;
            }
        });
        Storage.saveTransactions(transactions);
    }
    
    BudgetApp.deleteAccount(accountId);
    renderAccountsList();
    updateDashboard();
    
    alert('Account deleted.');
}

function populateAccountDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const accounts = BudgetApp.getAllAccounts();
    
    let options = '<option value="">Not specified</option>';
    
    if (accounts.length > 0) {
        options += accounts.map(acc => 
            `<option value="${acc.id}">${acc.name} (${acc.type})</option>`
        ).join('');
    } else {
        options += '<option value="">No accounts - add one first</option>';
    }
    
    select.innerHTML = options;
}

// ===== MONTH MANAGEMENT =====

function updateMonthDisplay() {
    const currentMonth = BudgetApp.getCurrentMonth();
    const monthName = BudgetApp.getMonthName(currentMonth.month);
    const display = document.getElementById('currentMonthDisplay');
    
    if (display) {
        display.textContent = `${monthName} ${currentMonth.year}`;
    }
}

function openMonthMenu() {
    const currentMonth = BudgetApp.getCurrentMonth();
    const monthName = BudgetApp.getMonthName(currentMonth.month);
    
    // Update current month display in modal
    document.getElementById('monthMenuCurrentMonth').textContent = `${monthName} ${currentMonth.year}`;
    
    // Render archives list
    renderMonthArchivesList();
    
    openModal('monthMenuModal');
}

function renderMonthArchivesList() {
    const container = document.getElementById('monthArchivesList');
    const archives = BudgetApp.getMonthArchives();
    
    if (archives.length === 0) {
        container.innerHTML = `
            <div class="empty-archives">
                <p>No archived months yet.</p>
                <p style="font-size: 0.9em; margin-top: 5px;">Archives will appear here when you start a new month.</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    archives.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });
    
    container.innerHTML = archives.map(archive => `
        <div class="month-archive-item" onclick="viewMonthArchive('${archive.monthKey}')">
            <div class="archive-month-name">${archive.monthName} ${archive.year}</div>
            <div class="archive-summary">
                <span>📊 Planned: ${BudgetApp.formatCurrency(archive.summary.totalPlanned)}</span>
                <span>💰 Funded: ${BudgetApp.formatCurrency(archive.summary.totalFunded)}</span>
                <span>💳 Spent: ${BudgetApp.formatCurrency(archive.summary.totalSpent)}</span>
            </div>
        </div>
    `).join('');
}

function openStartNewMonthModal() {
    // Close month menu
    closeModal('monthMenuModal');
    
    // Update rollover preview when option changes
    const radios = document.querySelectorAll('input[name="rolloverOption"]');
    radios.forEach(radio => {
        radio.addEventListener('change', updateRolloverPreview);
    });
    
    // Show initial preview
    updateRolloverPreview();
    
    openModal('startNewMonthModal');
}

function updateRolloverPreview() {
    const rolloverOption = document.querySelector('input[name="rolloverOption"]:checked').value;
    const envelopes = BudgetApp.getAllEnvelopes();
    const previewContainer = document.getElementById('rolloverPreview');
    
    const rollover = rolloverOption === 'rollover';
    
    let totalUnspent = 0;
    let totalRollover = 0;
    
    const previewItems = envelopes.map(env => {
        const unspent = env.funded - env.spent;
        totalUnspent += unspent;
        const newFunded = rollover && unspent > 0 ? unspent : 0;
        totalRollover += newFunded;
        
        if (unspent > 0) {
            return `
                <div class="rollover-preview-item">
                    <span>${env.name}</span>
                    <span style="color: ${rollover ? '#48bb78' : '#f56565'};">
                        ${rollover ? `→ ${BudgetApp.formatCurrency(unspent)}` : '→ $0.00'}
                    </span>
                </div>
            `;
        }
        return '';
    }).filter(html => html !== '').join('');
    
    if (previewItems === '') {
        previewContainer.innerHTML = `
            <p style="text-align: center; color: #718096;">
                No unspent funds to rollover.
            </p>
        `;
    } else {
        previewContainer.innerHTML = `
            <h4 style="margin-bottom: 10px;">Preview:</h4>
            ${previewItems}
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #cbd5e0; font-weight: 600;">
                <div class="rollover-preview-item">
                    <span>Total Unspent:</span>
                    <span>${BudgetApp.formatCurrency(totalUnspent)}</span>
                </div>
                <div class="rollover-preview-item">
                    <span>Will Carry Over:</span>
                    <span style="color: ${rollover ? '#48bb78' : '#f56565'}; font-size: 1.1em;">
                        ${BudgetApp.formatCurrency(totalRollover)}
                    </span>
                </div>
            </div>
        `;
    }
}

function confirmStartNewMonth() {
    const rolloverOption = document.querySelector('input[name="rolloverOption"]:checked').value;
    const rollover = rolloverOption === 'rollover';
    
    const confirmMsg = rollover 
        ? 'Start new month and rollover unspent funds?\n\nThis will archive the current month and carry over unspent money.'
        : 'Start new month and reset everything to zero?\n\nThis will archive the current month. Unspent funds will NOT carry over.';
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    try {
        const result = BudgetApp.startNewMonth(rollover);
        
        // Update UI
        updateMonthDisplay();
        updateDashboard();
        renderCategoryFilters();
        renderEnvelopes();
        
        // Close modals
        closeModal('startNewMonthModal');
        
        const newMonthName = BudgetApp.getMonthName(result.newMonth.month);
        alert(`✅ New month started!\n\nWelcome to ${newMonthName} ${result.newMonth.year}!\n\n${result.archived.monthName} ${result.archived.year} has been archived.`);
        
    } catch (error) {
        alert('❌ Error starting new month: ' + error.message);
        console.error('Month rollover error:', error);
    }
}

function viewMonthArchive(monthKey) {
    const archive = BudgetApp.getMonthArchive(monthKey);
    
    if (!archive) {
        alert('Archive not found');
        return;
    }
    
    // Update title
    document.getElementById('archiveMonthTitle').textContent = `${archive.monthName} ${archive.year} - Archive`;
    
    // Build content
    const content = document.getElementById('archiveContent');
    
    const summaryHTML = `
        <div class="archive-summary-stats">
            <div class="archive-stat-item">
                <div class="label">Total Planned</div>
                <div class="value">${BudgetApp.formatCurrency(archive.summary.totalPlanned)}</div>
            </div>
            <div class="archive-stat-item">
                <div class="label">Total Funded</div>
                <div class="value">${BudgetApp.formatCurrency(archive.summary.totalFunded)}</div>
            </div>
            <div class="archive-stat-item">
                <div class="label">Total Spent</div>
                <div class="value">${BudgetApp.formatCurrency(archive.summary.totalSpent)}</div>
            </div>
            <div class="archive-stat-item">
                <div class="label">Total Unspent</div>
                <div class="value" style="color: #48bb78;">
                    ${BudgetApp.formatCurrency(archive.summary.totalFunded - archive.summary.totalSpent)}
                </div>
            </div>
        </div>
    `;
    
    const envelopesTableHTML = `
        <table class="archive-envelopes-table">
            <thead>
                <tr>
                    <th>Envelope</th>
                    <th>Category</th>
                    <th style="text-align: right;">Planned</th>
                    <th style="text-align: right;">Funded</th>
                    <th style="text-align: right;">Spent</th>
                    <th style="text-align: right;">Balance</th>
                </tr>
            </thead>
            <tbody>
                ${archive.envelopeSnapshots.map(env => `
                    <tr>
                        <td><strong>${env.name}</strong></td>
                        <td>${env.category}</td>
                        <td style="text-align: right;">${BudgetApp.formatCurrency(env.planned)}</td>
                        <td style="text-align: right;">${BudgetApp.formatCurrency(env.funded)}</td>
                        <td style="text-align: right;">${BudgetApp.formatCurrency(env.spent)}</td>
                        <td style="text-align: right; font-weight: 600; color: ${env.balance >= 0 ? '#48bb78' : '#f56565'};">
                            ${BudgetApp.formatCurrency(env.balance)}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    content.innerHTML = summaryHTML + envelopesTableHTML;
    
    // Close month menu and open archive view
    closeModal('monthMenuModal');
    openModal('viewArchiveModal');
}

// ===== SPENDING TEMPLATES =====

function openSpendingTemplatesModal() {
    openModal('spendingTemplatesModal');
    renderSpendingTemplatesList();
}

function renderSpendingTemplatesList() {
    const container = document.getElementById('spendingTemplatesList');
    const templates = BudgetApp.getAllSpendingTemplates();
    
    if (templates.length === 0) {
        container.innerHTML = `
            <div class="empty-templates">
                <h3>No spending templates yet!</h3>
                <p>Create templates for recurring bills and expenses to record them quickly each month.</p>
            </div>
        `;
        return;
    }
    
    const today = new Date().getDate();
    
    container.innerHTML = `
        <div class="templates-list">
            ${templates.map(template => {
                const totalAmount = template.expenses.reduce((sum, exp) => sum + exp.amount, 0);
                const hasTodayExpenses = template.expenses.some(exp => exp.dayOfMonth === today);
                
                const expenseItems = template.expenses
                    .map(exp => {
                        const envelope = BudgetApp.getEnvelope(exp.envelopeId);
                        if (!envelope) return '';
                        const dayLabel = exp.dayOfMonth ? ` (${exp.dayOfMonth}${getDaySuffix(exp.dayOfMonth)})` : '';
                        return `<span class="expense-preview-badge">${exp.description}: ${BudgetApp.formatCurrency(exp.amount)}${dayLabel}</span>`;
                    })
                    .filter(html => html !== '')
                    .join('');
                
                return `
                    <div class="template-card">
                        <div class="template-header">
                            <div class="template-title">${template.name}</div>
                            ${hasTodayExpenses ? '<div class="template-date-badge today">📅 Has expenses due today!</div>' : ''}
                        </div>
                        
                        <div class="spending-template-total">
                            Total: ${BudgetApp.formatCurrency(totalAmount)}
                        </div>
                        
                        <div class="spending-template-preview">
                            ${expenseItems}
                        </div>
                        
                        <div class="template-actions">
                            <button class="btn btn-primary btn-small" onclick="applySpendingTemplateNow('${template.id}')">
                                ⚡ Apply Now (Today's Date)
                            </button>
                            <button class="btn btn-secondary btn-small" onclick="applySpendingTemplateWithDates('${template.id}')">
                                📅 Apply with Template Dates
                            </button>
                            <button class="btn btn-info btn-small" onclick="editSpendingTemplate('${template.id}')">
                                ✏️ Edit
                            </button>
                            <button class="btn btn-delete btn-small" onclick="deleteSpendingTemplateConfirm('${template.id}')">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function openCreateSpendingTemplateModal() {
    document.getElementById('spendingTemplateModalTitle').textContent = 'Create Spending Template';
    document.getElementById('spendingTemplateId').value = '';
    document.getElementById('spendingTemplateForm').reset();
    
    // Populate funding template selector
    populateFundingTemplateSelector();
    
    // Clear existing rows
    const container = document.getElementById('spendingTemplateExpenses');
    container.innerHTML = '';
    spendingExpenseCounter = 0;
    
    // Start with one expense row
    addSpendingTemplateExpenseRow();
    
    openModal('createSpendingTemplateModal');
}

let spendingExpenseCounter = 0;

function addSpendingTemplateExpenseRow(existingData = null) {
    const container = document.getElementById('spendingTemplateExpenses');
    const rowId = `expense_row_${spendingExpenseCounter++}`;
    
    const envelopes = BudgetApp.getAllEnvelopes();
    const accounts = BudgetApp.getAllAccounts();
    
    if (envelopes.length === 0) {
        alert('Please create envelopes first before adding expenses.');
        return;
    }
    
    // Sort envelopes alphabetically
    const sortedEnvelopes = [...envelopes].sort((a, b) => a.name.localeCompare(b.name));
    
    const envelopeOptions = sortedEnvelopes.map(env => 
        `<option value="${env.id}" ${existingData && existingData.envelopeId === env.id ? 'selected' : ''}>${env.name}</option>`
    ).join('');
    
    const accountOptions = '<option value="">Not specified</option>' + accounts.map(acc =>
        `<option value="${acc.id}" ${existingData && existingData.accountId === acc.id ? 'selected' : ''}>${acc.name}</option>`
    ).join('');
    
    const rowHTML = `
        <tr id="${rowId}">
            <td>
                <select class="expense-envelope" onchange="updateFundedReference('${rowId}')" required>
                    <option value="">Select...</option>
                    ${envelopeOptions}
                </select>
            </td>
            <td>
                <div class="funded-reference" id="funded_${rowId}" style="color: #718096; font-weight: 600; text-align: right;">-</div>
            </td>
            <td>
                <input type="number" class="expense-amount" placeholder="0.00" step="0.01" min="0" value="${existingData ? existingData.amount : ''}" required>
            </td>
            <td>
                <input type="number" class="expense-day" placeholder="1-31" min="1" max="31" value="${existingData && existingData.dayOfMonth ? existingData.dayOfMonth : ''}">
            </td>
            <td>
                <select class="expense-account">
                    ${accountOptions}
                </select>
            </td>
            <td style="text-align: center;">
                <button type="button" class="btn-delete-expense-row" onclick="removeSpendingExpenseRow('${rowId}')" title="Delete expense">
                    🗑️
                </button>
            </td>
        </tr>
    `;
    
    container.insertAdjacentHTML('beforeend', rowHTML);
    
    // Update funded reference if envelope is pre-selected
    if (existingData && existingData.envelopeId) {
        updateFundedReference(rowId);
    }
}

function removeSpendingExpenseRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        if (document.querySelectorAll('#spendingTemplateExpenses tr').length <= 1) {
            alert('Template must have at least one expense.');
            return;
        }
        row.remove();
    }
}

function removeSpendingExpenseRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
    }
}

function editSpendingTemplate(templateId) {
    const template = BudgetApp.getSpendingTemplate(templateId);
    if (!template) {
        alert('Template not found');
        return;
    }
    
    document.getElementById('spendingTemplateModalTitle').textContent = 'Edit Spending Template';
    document.getElementById('spendingTemplateId').value = template.id;
    document.getElementById('spendingTemplateName').value = template.name;
    
    // Clear and rebuild table rows
    const container = document.getElementById('spendingTemplateExpenses');
    container.innerHTML = '';
    spendingExpenseCounter = 0;
    
    // Add a row for each expense
    template.expenses.forEach(expense => {
        addSpendingTemplateExpenseRow(expense);
    });
    
    openModal('createSpendingTemplateModal');
}

function deleteSpendingTemplateConfirm(templateId) {
    const template = BudgetApp.getSpendingTemplate(templateId);
    if (confirm(`Delete spending template "${template.name}"? This cannot be undone.`)) {
        BudgetApp.deleteSpendingTemplate(templateId);
        renderSpendingTemplatesList();
    }
}

function applySpendingTemplateNow(templateId) {
    if (!confirm('Record all expenses from this template with today\'s date?')) {
        return;
    }
    
    try {
        const results = BudgetApp.applySpendingTemplate(templateId, false);
        
        updateDashboard();
        renderEnvelopes();
        
        let message = `✅ Template applied!\n\n`;
        message += `Success: ${results.success.length} expense(s) recorded\n`;
        
        if (results.failed.length > 0) {
            message += `\n⚠️ Failed: ${results.failed.length}\n`;
            results.failed.forEach(fail => {
                message += `- ${fail.description}: ${fail.error}\n`;
            });
        }
        
        alert(message);
        closeModal('spendingTemplatesModal');
        
    } catch (error) {
        alert('❌ ' + error.message);
    }
}

function applySpendingTemplateWithDates(templateId) {
    if (!confirm('Record all expenses using their template dates (day of month)?')) {
        return;
    }
    
    try {
        const results = BudgetApp.applySpendingTemplate(templateId, true);
        
        updateDashboard();
        renderEnvelopes();
        
        let message = `✅ Template applied with dates!\n\n`;
        message += `Success: ${results.success.length} expense(s) recorded\n`;
        
        if (results.failed.length > 0) {
            message += `\n⚠️ Failed: ${results.failed.length}\n`;
            results.failed.forEach(fail => {
                message += `- ${fail.description}: ${fail.error}\n`;
            });
        }
        
        alert(message);
        closeModal('spendingTemplatesModal');
        
    } catch (error) {
        alert('❌ ' + error.message);
    }
}

// ===== DROPDOWN MENU SYSTEM =====

function toggleDropdown(dropdownId) {
    // Close all other dropdowns first
    closeAllDropdowns(dropdownId);
    
    // Toggle the clicked dropdown
    const dropdown = document.getElementById(dropdownId);
    dropdown.classList.toggle('show');
}

function closeAllDropdowns(exceptId = null) {
    const dropdowns = document.querySelectorAll('.dropdown-content');
    dropdowns.forEach(dropdown => {
        if (dropdown.id !== exceptId) {
            dropdown.classList.remove('show');
        }
    });
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.matches('.btn-menu')) {
        closeAllDropdowns();
    }
});

// Prevent dropdown from closing when clicking inside it
document.addEventListener('click', function(event) {
    if (event.target.closest('.dropdown-content')) {
        // Don't close if clicking inside dropdown
        // The closeAllDropdowns() in the link onclick will handle closing
    }
});

// ===== TAB SYSTEM =====

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-view`).classList.add('active');
    
    // If switching to reports, render them
    if (tabName === 'reports') {
        populateMonthSelector();
        renderReports();
    }
}

// ===== REPORTS SYSTEM =====

let categoryChart = null;
let envelopeChart = null;

function populateMonthSelector() {
    const select = document.getElementById('reportsMonthSelect');
    const currentMonth = BudgetApp.getCurrentMonth();
    const archives = BudgetApp.getMonthArchives();
    
    // Build options: current month + archives
    let options = `<option value="current">${BudgetApp.getMonthName(currentMonth.month)} ${currentMonth.year} (Current)</option>`;
    
    // Sort archives by date (newest first)
    archives.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });
    
    archives.forEach(archive => {
        options += `<option value="${archive.monthKey}">${archive.monthName} ${archive.year}</option>`;
    });
    
    select.innerHTML = options;
}

function renderReports() {
    const selectedMonth = document.getElementById('reportsMonthSelect').value;
    
    let data;
    if (selectedMonth === 'current') {
        data = getCurrentMonthData();
    } else {
        data = getArchivedMonthData(selectedMonth);
    }
    
    renderSummaryStats(data);
    renderCategoryChart(data);
    renderEnvelopeChart(data);
    renderBudgetPerformance(data);
}

function getCurrentMonthData() {
    const envelopes = BudgetApp.getAllEnvelopes();
    const income = BudgetApp.getAllIncome();
    const transactions = Storage.getTransactions();
    
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    const totalAllocated = envelopes.reduce((sum, env) => sum + env.funded, 0);
    const totalSpent = envelopes.reduce((sum, env) => sum + env.spent, 0);
    
    // Group spending by category
    const categorySpending = {};
    envelopes.forEach(env => {
        if (env.spent > 0) {
            categorySpending[env.category] = (categorySpending[env.category] || 0) + env.spent;
        }
    });
    
    return {
        totalIncome,
        totalAllocated,
        totalSpent,
        unspent: totalAllocated - totalSpent,
        envelopes,
        categorySpending
    };
}

function getArchivedMonthData(monthKey) {
    const archive = BudgetApp.getMonthArchive(monthKey);
    if (!archive) return getCurrentMonthData();
    
    const totalIncome = archive.summary.totalFunded; // Best proxy we have
    const totalAllocated = archive.summary.totalFunded;
    const totalSpent = archive.summary.totalSpent;
    
    // Group spending by category
    const categorySpending = {};
    archive.envelopeSnapshots.forEach(env => {
        if (env.spent > 0) {
            categorySpending[env.category] = (categorySpending[env.category] || 0) + env.spent;
        }
    });
    
    return {
        totalIncome,
        totalAllocated,
        totalSpent,
        unspent: totalAllocated - totalSpent,
        envelopes: archive.envelopeSnapshots,
        categorySpending
    };
}

function renderSummaryStats(data) {
    document.getElementById('reportTotalIncome').textContent = BudgetApp.formatCurrency(data.totalIncome);
    document.getElementById('reportTotalAllocated').textContent = BudgetApp.formatCurrency(data.totalAllocated);
    document.getElementById('reportTotalSpent').textContent = BudgetApp.formatCurrency(data.totalSpent);
    document.getElementById('reportUnspent').textContent = BudgetApp.formatCurrency(data.unspent);
}

function renderCategoryChart(data) {
    const canvas = document.getElementById('categoryChart');
    const emptyState = document.getElementById('categoryChartEmpty');
    
    if (Object.keys(data.categorySpending).length === 0) {
        canvas.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    canvas.style.display = 'block';
    emptyState.style.display = 'none';
    
    const categories = Object.keys(data.categorySpending);
    const amounts = Object.values(data.categorySpending);
    
    // Destroy existing chart
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    categoryChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    '#667eea',
                    '#48bb78',
                    '#ed8936',
                    '#f56565',
                    '#38b2ac',
                    '#9f7aea',
                    '#ed64a6'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = BudgetApp.formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderEnvelopeChart(data) {
    const canvas = document.getElementById('envelopeChart');
    const emptyState = document.getElementById('envelopeChartEmpty');
    
    // Get top 5 spending envelopes
    const sortedEnvelopes = [...data.envelopes]
        .filter(env => env.spent > 0)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5);
    
    if (sortedEnvelopes.length === 0) {
        canvas.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    canvas.style.display = 'block';
    emptyState.style.display = 'none';
    
    const labels = sortedEnvelopes.map(env => env.name);
    const amounts = sortedEnvelopes.map(env => env.spent);
    
    // Destroy existing chart
    if (envelopeChart) {
        envelopeChart.destroy();
    }
    
    envelopeChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Spent',
                data: amounts,
                backgroundColor: '#667eea',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Spent: ' + BudgetApp.formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

function renderBudgetPerformance(data) {
    const container = document.getElementById('budgetPerformanceList');
    
    if (data.envelopes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No envelopes created yet.</p>
            </div>
        `;
        return;
    }
    
    // Sort by percentage used (highest first)
    const sorted = [...data.envelopes].sort((a, b) => {
        const aPercent = a.planned > 0 ? (a.spent / a.planned) * 100 : 0;
        const bPercent = b.planned > 0 ? (b.spent / b.planned) * 100 : 0;
        return bPercent - aPercent;
    });
    
    container.innerHTML = sorted.map(env => {
        const percentage = env.planned > 0 ? (env.spent / env.planned) * 100 : 0;
        const displayPercentage = Math.min(percentage, 100);
        
        let barClass = '';
        if (percentage > 100) {
            barClass = 'over-budget';
        } else if (percentage > 90) {
            barClass = 'warning';
        }
        
        return `
            <div class="performance-item">
                <div class="performance-header">
                    <div class="performance-envelope">${env.name}</div>
                    <div class="performance-stats">
                        ${BudgetApp.formatCurrency(env.spent)} / ${BudgetApp.formatCurrency(env.planned)}
                    </div>
                </div>
                <div class="performance-bar">
                    <div class="performance-bar-fill ${barClass}" style="width: ${displayPercentage}%">
                        ${percentage > 15 ? percentage.toFixed(0) + '%' : ''}
                    </div>
                    ${percentage <= 15 ? `<div class="performance-percentage">${percentage.toFixed(0)}%</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ===== CATEGORY MANAGEMENT =====

function openManageCategoriesModal() {
    openModal('manageCategoriesModal');
    renderCategoriesList();
}

function renderCategoriesList() {
    const container = document.getElementById('categoriesList');
    const envelopes = BudgetApp.getAllEnvelopes();
    
    if (envelopes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No envelopes yet. Create envelopes to see categories here.</p>
            </div>
        `;
        return;
    }
    
    // Count envelopes per category
    const categoryCount = {};
    envelopes.forEach(env => {
        categoryCount[env.category] = (categoryCount[env.category] || 0) + 1;
    });
    
    // Sort alphabetically
    const categories = Object.keys(categoryCount).sort();
    
    container.innerHTML = `
        <div class="categories-list">
            ${categories.map(cat => `
                <div class="category-item">
                    <div class="category-info">
                        <div class="category-name">${cat}</div>
                        <div class="category-envelope-count">${categoryCount[cat]} envelope(s)</div>
                    </div>
                    <button 
                        class="btn btn-delete btn-small" 
                        onclick="deleteCategory('${cat}')"
                        ${categoryCount[cat] > 0 ? 'disabled' : ''}
                    >
                        🗑️ Delete
                    </button>
                </div>
            `).join('')}
        </div>
        <div style="margin-top: 20px; padding: 15px; background: #edf2f7; border-radius: 8px;">
            <p style="font-size: 0.9em; color: #4a5568;">
                💡 <strong>Tip:</strong> You can only delete categories that have no envelopes. 
                To delete a category, first move or delete all envelopes in that category.
            </p>
        </div>
    `;
}

function deleteCategory(categoryName) {
    const envelopes = BudgetApp.getAllEnvelopes();
    const hasEnvelopes = envelopes.some(env => env.category === categoryName);
    
    if (hasEnvelopes) {
        alert(`Cannot delete "${categoryName}" - it still has envelopes. Move or delete them first.`);
        return;
    }
    
    // Category will be automatically removed when last envelope is deleted
    // Just refresh the list
    renderCategoriesList();
}

// ===== UPDATED SPENDING TEMPLATE FUNCTIONS =====

// Function to update funded reference when envelope is selected
function updateFundedReference(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    
    const envelopeSelect = row.querySelector('.expense-envelope');
    const fundedCell = document.getElementById(`funded_${rowId}`);
    const envelopeId = envelopeSelect.value;
    
    if (!envelopeId) {
        fundedCell.textContent = '-';
        return;
    }
    
    // Get selected funding template
    const templateSelector = document.getElementById('spendingTemplateReference');
    const fundingTemplateId = templateSelector ? templateSelector.value : '';
    
    if (!fundingTemplateId) {
        // No template selected - show dash
        fundedCell.textContent = '-';
        return;
    }
    
    // Get the funding template
    const fundingTemplate = BudgetApp.getTemplate(fundingTemplateId);
    if (!fundingTemplate) {
        fundedCell.textContent = '-';
        return;
    }
    
    // Get funded amount for this envelope from the template
    const fundedAmount = fundingTemplate.allocations[envelopeId] || 0;
    fundedCell.textContent = BudgetApp.formatCurrency(fundedAmount);
}

// Function to populate funding template selector
function populateFundingTemplateSelector() {
    const selector = document.getElementById('spendingTemplateReference');
    if (!selector) return;
    
    const templates = BudgetApp.getAllTemplates();
    
    let options = '<option value="">None - Don\'t show funded amounts</option>';
    
    if (templates.length > 0) {
        // Sort by day of month
        templates.sort((a, b) => a.dayOfMonth - b.dayOfMonth);
        
        options += templates.map(t => 
            `<option value="${t.id}">${t.name} (${t.dayOfMonth}${getDaySuffix(t.dayOfMonth)})</option>`
        ).join('');
    }
    
    selector.innerHTML = options;
    
    // Add change handler to update all rows when template changes
    // Add change handler to populate rows and update funded references
    selector.onchange = function() {
        const templateId = this.value;
        
        if (templateId) {
            // Populate rows from template
            populateRowsFromFundingTemplate(templateId);
        } else {
            // Just update funded references (clear them)
            const rows = document.querySelectorAll('#spendingTemplateExpenses tr');
            rows.forEach(row => {
                updateFundedReference(row.id);
            });
        }
    };
}

// Function to populate rows when funding template is selected
function populateRowsFromFundingTemplate(templateId) {
    if (!templateId) {
        // If "None" selected, just clear to one empty row
        const container = document.getElementById('spendingTemplateExpenses');
        container.innerHTML = '';
        spendingExpenseCounter = 0;
        addSpendingTemplateExpenseRow();
        return;
    }
    
    const template = BudgetApp.getTemplate(templateId);
    if (!template) return;
    
    // Confirm if there are already rows
    const existingRows = document.querySelectorAll('#spendingTemplateExpenses tr');
    if (existingRows.length > 0) {
        const proceed = confirm('Replace existing rows with envelopes from this funding template?');
        if (!proceed) return;
    }
    
    // Clear existing rows
    const container = document.getElementById('spendingTemplateExpenses');
    container.innerHTML = '';
    spendingExpenseCounter = 0;
    
    // Get all envelopes
    const allEnvelopes = BudgetApp.getAllEnvelopes();
    
    // Create a row for each allocation in the template
    Object.entries(template.allocations).forEach(([envelopeId, fundedAmount]) => {
        // Check if envelope still exists
        const envelope = allEnvelopes.find(env => env.id === envelopeId);
        if (!envelope) return; // Skip if envelope was deleted
        
        // Create row with pre-selected envelope
        addSpendingTemplateExpenseRow({
            envelopeId: envelopeId,
            amount: '', // Leave amount blank for user to fill
            dayOfMonth: null,
            accountId: null
        });
    });
    
    // If no allocations, add at least one empty row
    if (Object.keys(template.allocations).length === 0) {
        addSpendingTemplateExpenseRow();
    }
}

// ===== ACCOUNT REGISTER =====

let currentRegisterAccountId = null;

function openAccountRegister(accountId) {
    currentRegisterAccountId = accountId;
    const account = BudgetApp.getAccount(accountId);
    
    if (!account) {
        alert('Account not found');
        return;
    }
    
    // Set account name in modal title
    document.getElementById('registerAccountName').textContent = `📋 ${account.name} - Register`;
    document.getElementById('registerAccountId').value = accountId;
    
    // Set today's date
    document.getElementById('registerDate').valueAsDate = new Date();
    
    // Populate envelope dropdown
    populateRegisterEnvelopeDropdown();
    
    // Populate transfer account dropdown
    populateRegisterTransferDropdown(accountId);
    
    // Render transactions
    renderAccountRegister();
    
    // Open modal
    openModal('accountRegisterModal');
}

function closeAccountRegister() {
    closeModal('accountRegisterModal');
    currentRegisterAccountId = null;
    document.getElementById('registerAddForm').reset();
}

function populateRegisterEnvelopeDropdown() {
    const select = document.getElementById('registerEnvelope');
    const envelopes = BudgetApp.getAllEnvelopes();
    
    // Sort alphabetically
    envelopes.sort((a, b) => a.name.localeCompare(b.name));
    
    // Build options
    let options = '<option value="">Select...</option>';
    options += '<option value="_none">📝 Not assigned</option>';
    options += '<option value="_income">💰 Income</option>';
    options += '<option value="_transfer">🔄 Transfer</option>';
    options += '<optgroup label="Envelopes">';
    options += envelopes.map(env => `<option value="${env.id}">${env.name}</option>`).join('');
    options += '</optgroup>';
    
    select.innerHTML = options;
}

function populateRegisterTransferDropdown(currentAccountId) {
    const select = document.getElementById('registerTransferAccount');
    const accounts = BudgetApp.getAllAccounts().filter(acc => acc.id !== currentAccountId);
    
    let options = '<option value="">Select account...</option>';
    options += accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('');
    
    select.innerHTML = options;
}

function toggleRegisterDescription() {
    const envelopeSelect = document.getElementById('registerEnvelope');
    const descriptionInput = document.getElementById('registerDescription');
    const transferSelect = document.getElementById('registerTransferAccount');
    const value = envelopeSelect.value;
    
    if (value === '_none') {
        // Show description input
        descriptionInput.style.display = 'block';
        descriptionInput.required = true;
        transferSelect.style.display = 'none';
        transferSelect.required = false;
    } else if (value === '_income') {
        // Show description for income source
        descriptionInput.style.display = 'block';
        descriptionInput.required = true;
        descriptionInput.placeholder = 'Income source (e.g., Paycheck)';
        transferSelect.style.display = 'none';
        transferSelect.required = false;
    } else if (value === '_transfer') {
        // Show transfer account dropdown
        descriptionInput.style.display = 'none';
        descriptionInput.required = false;
        transferSelect.style.display = 'block';
        transferSelect.required = true;
    } else {
        // Hide both
        descriptionInput.style.display = 'none';
        descriptionInput.required = false;
        transferSelect.style.display = 'none';
        transferSelect.required = false;
    }
}

function addRegisterTransaction(e) {
    e.preventDefault();
    
    const accountId = document.getElementById('registerAccountId').value;
    const date = document.getElementById('registerDate').value;
    const envelopeValue = document.getElementById('registerEnvelope').value;
    const description = document.getElementById('registerDescription').value;
    const amount = parseFloat(document.getElementById('registerAmount').value);
    const status = document.getElementById('registerStatus').value;
    const transferAccountId = document.getElementById('registerTransferAccount').value;
    
    if (!envelopeValue) {
        alert('Please select an envelope or transaction type');
        return;
    }
    
    try {
        if (envelopeValue === '_none') {
            // Direct transaction (no envelope)
            BudgetApp.addAccountTransaction(accountId, Math.abs(amount), description, date, status, 'expense', null);
            
        } else if (envelopeValue === '_income') {
            // Income
            BudgetApp.addAccountTransaction(accountId, amount, description, date, status, 'income', null);
            
        } else if (envelopeValue === '_transfer') {
            // Transfer
            if (!transferAccountId) {
                alert('Please select an account to transfer to/from');
                return;
            }
            
            const fromAccount = BudgetApp.getAccount(accountId);
            const toAccount = BudgetApp.getAccount(transferAccountId);
            
            if (amount > 0) {
                // Transfer IN (from other account to this account)
                BudgetApp.addAccountTransaction(accountId, amount, `Transfer from ${toAccount.name}`, date, status, 'income', null);
                BudgetApp.addAccountTransaction(transferAccountId, amount, `Transfer to ${fromAccount.name}`, date, status, 'expense', null);
            } else {
                // Transfer OUT (from this account to other account)
                BudgetApp.addAccountTransaction(accountId, Math.abs(amount), `Transfer to ${toAccount.name}`, date, status, 'expense', null);
                BudgetApp.addAccountTransaction(transferAccountId, Math.abs(amount), `Transfer from ${fromAccount.name}`, date, status, 'income', null);
            }
            
        } else {
            // Envelope transaction
            BudgetApp.addAccountTransaction(accountId, Math.abs(amount), '', date, status, 'expense', envelopeValue);
        }
        
        // Reset form
        document.getElementById('registerAddForm').reset();
        document.getElementById('registerDate').valueAsDate = new Date();
        toggleRegisterDescription();
        
        // Refresh display
        renderAccountRegister();
        updateDashboard();
        renderEnvelopes();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function renderAccountRegister() {
    const accountId = currentRegisterAccountId;
    if (!accountId) return;
    
    const account = BudgetApp.getAccount(accountId);
    const transactions = BudgetApp.getAccountTransactionsWithBalance(accountId);
    
    // Calculate summary stats
    // Current Balance = balance as of last CLEARED transaction (reality right now)
    const clearedTransactions = transactions.filter(txn => txn.status === 'cleared');
    const currentBalance = clearedTransactions.length > 0 
        ? clearedTransactions[clearedTransactions.length - 1].balance 
        : account.balance;

    // Projected Balance = balance including ALL transactions (cleared + pending)
    const projectedBalance = transactions.length > 0 
        ? transactions[transactions.length - 1].balance 
        : account.balance;

    // Pending count
    const pendingTransactions = transactions.filter(txn => txn.status === 'pending');

    // Lowest point across ALL transactions (for overdraft warning)
    const lowestBalance = transactions.length > 0 
        ? Math.min(...transactions.map(txn => txn.balance)) 
        : account.balance;
    
    // Render summary
    const summaryHTML = `
        <div class="register-summary-item">
            <div class="label">Current Balance</div>
            <div class="value ${currentBalance >= 0 ? 'positive' : 'negative'}">
                ${BudgetApp.formatCurrency(currentBalance)}
            </div>
        </div>
        <div class="register-summary-item">
            <div class="label">Projected Balance</div>
            <div class="value ${projectedBalance >= 0 ? 'positive' : 'negative'}">
                ${BudgetApp.formatCurrency(projectedBalance)}
            </div>
        </div>
        <div class="register-summary-item">
            <div class="label">Lowest Point</div>
            <div class="value ${lowestBalance >= 0 ? 'positive' : lowestBalance < 100 ? 'warning' : 'negative'}">
                ${BudgetApp.formatCurrency(lowestBalance)}
            </div>
        </div>
        <div class="register-summary-item">
            <div class="label">Pending Transactions</div>
            <div class="value">${pendingTransactions.length}</div>
        </div>
    `;
    
    document.getElementById('registerSummary').innerHTML = summaryHTML;
    
    // Render transactions
    const tbody = document.getElementById('registerTransactions');
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #718096;">
                    No transactions yet. Add your first transaction above!
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = transactions.map(txn => {
        const envelope = txn.envelopeId ? BudgetApp.getEnvelope(txn.envelopeId) : null;
        const isIncome = txn.type === 'income';
        const isPending = txn.status === 'pending';
        const isNegative = txn.balance < 0;
        
        let rowClass = '';
        if (isIncome) rowClass += 'income-row ';
        if (!isIncome && txn.type === 'expense') rowClass += 'expense-row ';
        if (isPending) rowClass += 'pending-row ';
        if (isNegative) rowClass += 'negative-balance ';
        
        const amountClass = isIncome ? 'positive' : 'negative';
        const amountSign = isIncome ? '+' : '-';
        const balanceClass = txn.balance < 0 ? 'negative' : txn.balance < 500 ? 'warning' : 'positive';
        const statusIcon = isPending ? '⏳' : '✓';
        
        const displayName = envelope ? envelope.name : txn.description;
        
        return `
        <tr class="${rowClass}">
            <td 
                id="regdate_${txn.id}" 
                class="register-editable"
                onclick="makeRegisterDateEditable('${txn.id}')"
                title="Click to edit date"
            >
                ${formatDate(txn.date)}
            </td>
            <td 
                id="regenv_${txn.id}" 
                class="register-editable"
                onclick="makeRegisterEnvelopeEditable('${txn.id}', ${txn.isIncome || false})"
                title="Click to edit envelope"
            >
                <div class="register-envelope-name">${displayName}</div>
                ${envelope ? `<div class="register-description">${envelope.category}</div>` : ''}
            </td>
            <td 
                id="regamt_${txn.id}" 
                class="register-amount ${amountClass} register-editable"
                onclick="makeRegisterAmountEditable('${txn.id}')"
                title="Click to edit amount"
            >
                ${amountSign}${BudgetApp.formatCurrency(Math.abs(txn.amount))}
            </td>
            <td class="register-balance ${balanceClass}">
                ${BudgetApp.formatCurrency(txn.balance)}
            </td>
            <td 
                class="register-status editable" 
                onclick="toggleRegisterStatus('${txn.id}', ${txn.isIncome || false})"
                title="Click to toggle status"
            >
                ${statusIcon}
            </td>
            <td style="text-align: center;">
                <button class="btn btn-delete btn-small" onclick="deleteRegisterTransaction('${txn.id}', ${txn.isIncome || false})" title="Delete">
                    🗑️
                </button>
            </td>
        </tr>
    `;
    }).join('');
}

function deleteRegisterTransaction(transactionId, isIncome) {
    if (!confirm('Delete this transaction? This cannot be undone.')) {
        return;
    }
    
    if (isIncome) {
        // Delete income record
        const income = Storage.getIncome();
        const filtered = income.filter(inc => inc.id !== transactionId);
        Storage.saveIncome(filtered);
    } else {
        // Delete regular transaction
        const transactions = Storage.getTransactions();
        const transaction = transactions.find(txn => txn.id === transactionId);
        
        if (!transaction) {
            alert('Transaction not found');
            return;
        }
        
        // If it affected an envelope, update the envelope
        if (transaction.envelopeId && transaction.status === 'cleared' && transaction.type === 'expense') {
            const envelope = BudgetApp.getEnvelope(transaction.envelopeId);
            if (envelope) {
                BudgetApp.updateEnvelope(transaction.envelopeId, {
                    spent: envelope.spent - transaction.amount
                });
            }
        }
        
        // Remove transaction
        const filtered = transactions.filter(txn => txn.id !== transactionId);
        Storage.saveTransactions(filtered);
    }
    
    // Refresh display
    renderAccountRegister();
    updateDashboard();
    renderEnvelopes();
}

// ===== REGISTER INLINE EDITING =====

function makeRegisterDateEditable(transactionId) {
    const cell = document.getElementById(`regdate_${transactionId}`);
    if (!cell) return;
    
    // Get current transaction
    const transactions = Storage.getTransactions();
    const income = Storage.getIncome();
    const txn = transactions.find(t => t.id === transactionId) || income.find(i => i.id === transactionId);
    
    if (!txn) return;
    
    const currentDate = txn.date;
    
    // Replace cell content with date input
    cell.innerHTML = `
        <input 
            type="date" 
            class="register-editing-input" 
            id="edit_regdate_${transactionId}" 
            value="${currentDate}"
        >
        <div class="register-edit-hint">Enter to save, Esc to cancel</div>
    `;
    
    const input = document.getElementById(`edit_regdate_${transactionId}`);
    input.focus();
    
    // Handle Enter key (save)
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveRegisterDate(transactionId, input.value);
        } else if (e.key === 'Escape') {
            renderAccountRegister();
        }
    });
    
    // Handle blur (clicking away) - save
    input.addEventListener('blur', function() {
        setTimeout(() => {
            if (document.getElementById(`edit_regdate_${transactionId}`)) {
                saveRegisterDate(transactionId, input.value);
            }
        }, 100);
    });
}

function saveRegisterDate(transactionId, newDate) {
    if (!newDate) {
        alert('Please enter a valid date');
        renderAccountRegister();
        return;
    }
    
    // Update transaction
    const transactions = Storage.getTransactions();
    const txnIndex = transactions.findIndex(t => t.id === transactionId);
    
    if (txnIndex !== -1) {
        transactions[txnIndex].date = newDate;
        Storage.saveTransactions(transactions);
    } else {
        // Check if it's income
        const income = Storage.getIncome();
        const incIndex = income.findIndex(i => i.id === transactionId);
        if (incIndex !== -1) {
            income[incIndex].date = newDate;
            Storage.saveIncome(income);
        }
    }
    
    renderAccountRegister();
}

function makeRegisterEnvelopeEditable(transactionId, isIncome) {
    const cell = document.getElementById(`regenv_${transactionId}`);
    if (!cell) return;
    
    // Get current transaction
    const transactions = Storage.getTransactions();
    const txn = transactions.find(t => t.id === transactionId);
    
    if (!txn) return;
    
    // Can't edit income envelope assignments
    if (isIncome) {
        alert('Income descriptions cannot be changed here. Edit the income record instead.');
        return;
    }
    
    const currentEnvelopeId = txn.envelopeId || '_none';
    const envelopes = BudgetApp.getAllEnvelopes();
    
    // Build dropdown
    let options = '<option value="_none">📝 Not assigned</option>';
    options += '<optgroup label="Envelopes">';
    envelopes.sort((a, b) => a.name.localeCompare(b.name));
    options += envelopes.map(env => 
        `<option value="${env.id}" ${env.id === currentEnvelopeId ? 'selected' : ''}>${env.name}</option>`
    ).join('');
    options += '</optgroup>';
    
    // Replace cell content with dropdown
    cell.innerHTML = `
        <select 
            class="register-editing-select" 
            id="edit_regenv_${transactionId}"
        >
            ${options}
        </select>
        <div class="register-edit-hint">Enter to save, Esc to cancel</div>
    `;
    
    const select = document.getElementById(`edit_regenv_${transactionId}`);
    select.focus();
    
    // Handle change (save immediately on selection)
    select.addEventListener('change', function() {
        saveRegisterEnvelope(transactionId, select.value);
    });
    
    // Handle Enter key (save)
    select.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveRegisterEnvelope(transactionId, select.value);
        } else if (e.key === 'Escape') {
            renderAccountRegister();
        }
    });
    
    // Handle blur (clicking away) - save
    select.addEventListener('blur', function() {
        setTimeout(() => {
            if (document.getElementById(`edit_regenv_${transactionId}`)) {
                saveRegisterEnvelope(transactionId, select.value);
            }
        }, 100);
    });
}

function saveRegisterEnvelope(transactionId, newEnvelopeId) {
    const transactions = Storage.getTransactions();
    const txnIndex = transactions.findIndex(t => t.id === transactionId);
    
    if (txnIndex === -1) {
        alert('Transaction not found');
        renderAccountRegister();
        return;
    }
    
    const txn = transactions[txnIndex];
    const oldEnvelopeId = txn.envelopeId;
    const newEnvId = newEnvelopeId === '_none' ? null : newEnvelopeId;
    
    // If transaction is cleared, update envelope spent amounts
    if (txn.status === 'cleared' && txn.type === 'expense') {
        // Remove from old envelope
        if (oldEnvelopeId) {
            const oldEnvelope = BudgetApp.getEnvelope(oldEnvelopeId);
            if (oldEnvelope) {
                BudgetApp.updateEnvelope(oldEnvelopeId, {
                    spent: oldEnvelope.spent - txn.amount
                });
            }
        }
        
        // Add to new envelope (if not "not assigned")
        if (newEnvId) {
            const newEnvelope = BudgetApp.getEnvelope(newEnvId);
            if (newEnvelope) {
                const balance = BudgetApp.getEnvelopeBalance(newEnvId);
                if (txn.amount > balance) {
                    if (!confirm(`This will overdraw the envelope. Balance: ${BudgetApp.formatCurrency(balance)}. Continue?`)) {
                        renderAccountRegister();
                        return;
                    }
                }
                BudgetApp.updateEnvelope(newEnvId, {
                    spent: newEnvelope.spent + txn.amount
                });
            }
        }
    }
    
    // Update transaction
    transactions[txnIndex].envelopeId = newEnvId;
    Storage.saveTransactions(transactions);
    
    renderAccountRegister();
    updateDashboard();
    renderEnvelopes();
}

function makeRegisterAmountEditable(transactionId) {
    const cell = document.getElementById(`regamt_${transactionId}`);
    if (!cell) return;
    
    // Get current transaction
    const transactions = Storage.getTransactions();
    const income = Storage.getIncome();
    const txn = transactions.find(t => t.id === transactionId) || income.find(i => i.id === transactionId);
    
    if (!txn) return;
    
    const currentAmount = txn.amount;
    const isIncome = txn.type === 'income';
    
    // Replace cell content with input
    cell.innerHTML = `
        <input 
            type="number" 
            class="register-editing-input" 
            id="edit_regamt_${transactionId}" 
            value="${currentAmount}" 
            step="0.01"
            min="0"
            style="text-align: right;"
        >
        <div class="register-edit-hint">Enter to save, Esc to cancel</div>
    `;
    
    const input = document.getElementById(`edit_regamt_${transactionId}`);
    input.focus();
    input.select();
    
    // Handle Enter key (save)
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveRegisterAmount(transactionId, input.value, isIncome);
        } else if (e.key === 'Escape') {
            renderAccountRegister();
        }
    });
    
    // Handle blur (clicking away) - save
    input.addEventListener('blur', function() {
        setTimeout(() => {
            if (document.getElementById(`edit_regamt_${transactionId}`)) {
                saveRegisterAmount(transactionId, input.value, isIncome);
            }
        }, 100);
    });
}

function saveRegisterAmount(transactionId, newAmount, isIncome) {
    const numValue = parseFloat(newAmount);
    
    if (isNaN(numValue) || numValue < 0) {
        alert('Please enter a valid positive number');
        renderAccountRegister();
        return;
    }
    
    if (isIncome) {
        // Update income record
        const income = Storage.getIncome();
        const incIndex = income.findIndex(i => i.id === transactionId);
        if (incIndex !== -1) {
            income[incIndex].amount = numValue;
            Storage.saveIncome(income);
        }
    } else {
        // Update transaction
        const transactions = Storage.getTransactions();
        const txnIndex = transactions.findIndex(t => t.id === transactionId);
        
        if (txnIndex === -1) {
            alert('Transaction not found');
            renderAccountRegister();
            return;
        }
        
        const txn = transactions[txnIndex];
        const oldAmount = txn.amount;
        const difference = numValue - oldAmount;
        
        // If transaction is cleared and has an envelope, update envelope spent
        if (txn.status === 'cleared' && txn.type === 'expense' && txn.envelopeId) {
            const envelope = BudgetApp.getEnvelope(txn.envelopeId);
            if (envelope) {
                const newSpent = envelope.spent + difference;
                const newBalance = envelope.funded - newSpent;
                
                if (newBalance < 0) {
                    if (!confirm(`This will overdraw the envelope by ${BudgetApp.formatCurrency(Math.abs(newBalance))}. Continue?`)) {
                        renderAccountRegister();
                        return;
                    }
                }
                
                BudgetApp.updateEnvelope(txn.envelopeId, {
                    spent: newSpent
                });
            }
        }
        
        // Update transaction amount
        transactions[txnIndex].amount = numValue;
        Storage.saveTransactions(transactions);
    }
    
    renderAccountRegister();
    updateDashboard();
    renderEnvelopes();
}

function toggleRegisterStatus(transactionId, isIncome) {
    if (isIncome) {
        // Can't change income status
        return;
    }
    
    const transactions = Storage.getTransactions();
    const txnIndex = transactions.findIndex(t => t.id === transactionId);
    
    if (txnIndex === -1) {
        alert('Transaction not found');
        return;
    }
    
    const txn = transactions[txnIndex];
    const newStatus = txn.status === 'cleared' ? 'pending' : 'cleared';
    
    // If changing to cleared and has envelope, update envelope spent
    if (newStatus === 'cleared' && txn.type === 'expense' && txn.envelopeId) {
        const envelope = BudgetApp.getEnvelope(txn.envelopeId);
        if (envelope) {
            const balance = BudgetApp.getEnvelopeBalance(txn.envelopeId);
            if (txn.amount > balance) {
                if (!confirm(`This will overdraw the envelope. Balance: ${BudgetApp.formatCurrency(balance)}. Continue?`)) {
                    return;
                }
            }
            BudgetApp.updateEnvelope(txn.envelopeId, {
                spent: envelope.spent + txn.amount
            });
        }
    }
    
    // If changing to pending and has envelope, remove from envelope spent
    if (newStatus === 'pending' && txn.type === 'expense' && txn.envelopeId) {
        const envelope = BudgetApp.getEnvelope(txn.envelopeId);
        if (envelope) {
            BudgetApp.updateEnvelope(txn.envelopeId, {
                spent: envelope.spent - txn.amount
            });
        }
    }
    
    // Update transaction status
    transactions[txnIndex].status = newStatus;
    Storage.saveTransactions(transactions);
    
    renderAccountRegister();
    updateDashboard();
    renderEnvelopes();
}

// ===== RESET ALL DATA =====

function resetAllData() {
    const result = Storage.clearAllConfirm();
    
    if (result) {
        // Data was cleared, refresh the UI
        alert('✅ All data has been cleared!');
        
        // Refresh everything
        updateDashboard();
        renderCategoryFilters();
        renderEnvelopes();
        updateMonthDisplay();
        
        // Close any open modals
        closeAllDropdowns();
        
        // Reload page for clean slate
        window.location.reload();
    }
}

// ===== BUDGET MANAGEMENT =====

function initializeBudgets() {
    // First, try to migrate old data
    const migrated = Storage.migrateOldData();
    if (migrated) {
        alert('✅ Your data has been migrated to the new budget system!\n\nEverything is now in "My Budget".');
    }
    
    // Make sure we have at least one budget
    const budgets = Storage.getBudgets();
    const activeBudget = Storage.getActiveBudget();
    
    // If active budget doesn't exist in list, reset to first
    if (!budgets.find(b => b.id === activeBudget)) {
        Storage.setActiveBudget(budgets[0].id);
    }
    
    // Populate budget dropdown
    updateBudgetDropdown();
}

function updateBudgetDropdown() {
    const dropdown = document.getElementById('budgetDropdown');
    const budgets = Storage.getBudgets();
    const activeBudget = Storage.getActiveBudget();
    
    dropdown.innerHTML = budgets.map(budget => 
        `<option value="${budget.id}" ${budget.id === activeBudget ? 'selected' : ''}>${budget.name}</option>`
    ).join('');
}

function switchBudget(budgetId) {
    if (!budgetId) return;
    
    // Confirm if user wants to switch
    const currentBudget = Storage.getBudgets().find(b => b.id === Storage.getActiveBudget());
    const newBudget = Storage.getBudgets().find(b => b.id === budgetId);
    
    if (currentBudget.id === newBudget.id) return; // Same budget
    
    const confirmed = confirm(`Switch from "${currentBudget.name}" to "${newBudget.name}"?\n\nAny unsaved work will be preserved in "${currentBudget.name}".`);
    
    if (!confirmed) {
        // Reset dropdown to current
        updateBudgetDropdown();
        return;
    }
    
    // Switch budget
    Storage.setActiveBudget(budgetId);
    
    // Refresh entire UI
    updateDashboard();
    renderCategoryFilters();
    renderEnvelopes();
    updateMonthDisplay();
    
    // Close any open modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.style.display = 'none');
    
    alert(`✅ Switched to "${newBudget.name}"`);
}

function openManageBudgetsModal() {
    openModal('manageBudgetsModal');
    renderBudgetsList();
}

function renderBudgetsList() {
    const container = document.getElementById('budgetsList');
    const budgets = Storage.getBudgets();
    const activeBudget = Storage.getActiveBudget();
    
    if (budgets.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096;">No budgets found.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="budgets-list">
            ${budgets.map(budget => {
                const isActive = budget.id === activeBudget;
                return `
                    <div class="budget-item ${isActive ? 'active' : ''}">
                        <div class="budget-info">
                            <div class="budget-name">
                                ${budget.name}
                                ${isActive ? '<span class="budget-badge">Active</span>' : ''}
                            </div>
                            <div class="budget-meta">
                                Created: ${new Date(budget.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div class="budget-actions">
                            ${!isActive ? `<button class="btn btn-primary btn-small" onclick="switchBudgetFromList('${budget.id}')">Switch</button>` : ''}
                            <button class="btn btn-info btn-small" onclick="editBudget('${budget.id}')">✏️ Rename</button>
                            ${budgets.length > 1 && !isActive ? `<button class="btn btn-delete btn-small" onclick="deleteBudgetConfirm('${budget.id}')">🗑️</button>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function openCreateBudgetModal() {
    document.getElementById('budgetModalTitle').textContent = 'Create New Budget';
    document.getElementById('budgetId').value = '';
    document.getElementById('budgetForm').reset();
    closeModal('manageBudgetsModal');
    openModal('createBudgetModal');
}

function editBudget(budgetId) {
    const budget = Storage.getBudgets().find(b => b.id === budgetId);
    if (!budget) return;
    
    document.getElementById('budgetModalTitle').textContent = 'Rename Budget';
    document.getElementById('budgetId').value = budget.id;
    document.getElementById('budgetName').value = budget.name;
    closeModal('manageBudgetsModal');
    openModal('createBudgetModal');
}

function handleBudgetFormSubmit(e) {
    e.preventDefault();
    
    const budgetId = document.getElementById('budgetId').value;
    const budgetName = document.getElementById('budgetName').value.trim();
    
    if (!budgetName) {
        alert('Please enter a budget name');
        return;
    }
    
    if (budgetId) {
        // Rename existing budget
        Storage.renameBudget(budgetId, budgetName);
        alert(`✅ Budget renamed to "${budgetName}"`);
    } else {
        // Create new budget
        const newBudget = Storage.createBudget(budgetName);
        alert(`✅ Budget "${budgetName}" created!\n\nSwitch to it from the dropdown to start using it.`);
    }
    
    // Update dropdown
    updateBudgetDropdown();
    
    // Close modal and reopen manage budgets
    closeModal('createBudgetModal');
    openManageBudgetsModal();
}

function switchBudgetFromList(budgetId) {
    closeModal('manageBudgetsModal');
    document.getElementById('budgetDropdown').value = budgetId;
    switchBudget(budgetId);
}

function deleteBudgetConfirm(budgetId) {
    const budget = Storage.getBudgets().find(b => b.id === budgetId);
    if (!budget) return;
    
    const confirmed = confirm(
        `⚠️ DELETE BUDGET: "${budget.name}"?\n\n` +
        `This will permanently delete:\n` +
        `- All envelopes\n` +
        `- All income records\n` +
        `- All transactions\n` +
        `- All templates\n` +
        `- All accounts\n` +
        `- All month archives\n\n` +
        `This CANNOT be undone!\n\n` +
        `Are you sure?`
    );
    
    if (!confirmed) return;
    
    const doubleConfirm = confirm(
        `🚨 FINAL WARNING!\n\n` +
        `Delete "${budget.name}" permanently?\n\n` +
        `Click OK to DELETE`
    );
    
    if (!doubleConfirm) return;
    
    try {
        Storage.deleteBudget(budgetId);
        updateBudgetDropdown();
        renderBudgetsList();
        alert(`✅ Budget "${budget.name}" deleted`);
    } catch (error) {
        alert('❌ ' + error.message);
    }
}

// ===== FIREBASE CLOUD SYNC =====

async function manualSyncToCloud() {
    if (!FirebaseSync.isInitialized) {
        alert('❌ Firebase not initialized. Please refresh the page.');
        return;
    }
    
    const confirmed = confirm('☁️ Save all data to cloud?\n\nThis will overwrite any cloud data with your current local data.');
    
    if (!confirmed) return;
    
    const success = await FirebaseSync.saveToCloud();
    
    if (success) {
        alert('✅ Data saved to cloud!\n\nYour budget is now backed up and can be synced to other devices.');
    } else {
        alert('❌ Failed to save to cloud. Check console for errors.');
    }
}

async function manualLoadFromCloud() {
    if (!FirebaseSync.isInitialized) {
        alert('❌ Firebase not initialized. Please refresh the page.');
        return;
    }
    
    const confirmed = confirm('⬇️ Load data from cloud?\n\n⚠️ This will REPLACE your current local data with cloud data.');
    
    if (!confirmed) return;
    
    const cloudData = await FirebaseSync.loadFromCloud();
    
    if (cloudData) {
        // Import the cloud data
        Storage.importData(cloudData);
        
        // Refresh UI
        updateBudgetDropdown();
        updateMonthDisplay();
        updateDashboard();
        renderCategoryFilters();
        renderEnvelopes();
        
        alert('✅ Data loaded from cloud!\n\nYour local data has been updated.');
    } else {
        alert('📭 No cloud data found.\n\nSave to cloud first from another device.');
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

