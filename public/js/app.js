document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentUser = null;
    let sheets = [];
    let currentSheetId = null;
    let expenses = [];
    let isRegistering = false;
    let editingExpenseId = null;

    // DOM Elements
    const authView = document.getElementById('auth-view');
    const dashboardView = document.getElementById('dashboard-view');
    const authForm = document.getElementById('auth-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const authSubmitBtn = document.getElementById('auth-submit');
    const toggleAuthBtn = document.getElementById('toggle-auth-btn');
    const authTitle = document.querySelector('.auth-container h2');
    const authDesc = document.querySelector('.auth-container p');
    const navUsername = document.getElementById('nav-username');
    const logoutBtn = document.getElementById('logout-btn');
    const sheetsList = document.getElementById('sheets-list');
    const newSheetBtn = document.getElementById('new-sheet-btn');
    const sheetModal = document.getElementById('sheet-modal');
    const sheetForm = document.getElementById('sheet-form');
    const sheetTitleInput = document.getElementById('sheet-title');
    const expensesArea = document.getElementById('expenses-area');
    const noSheetSelected = document.getElementById('no-sheet-selected');
    const currentSheetTitle = document.getElementById('current-sheet-title');
    const deleteSheetBtn = document.getElementById('delete-sheet-btn');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const expenseModal = document.getElementById('expense-modal');
    const expenseForm = document.getElementById('expense-form');
    const expenseModalTitle = document.getElementById('expense-modal-title');
    const expensesList = document.getElementById('expenses-list');
    const totalAmount = document.getElementById('total-amount');
    const toastEl = document.getElementById('toast');

    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmOkBtn = document.getElementById('confirm-ok');
    const confirmCancelBtn = document.getElementById('confirm-cancel');

    // UI Helpers
    function showToast(message, isError = false) {
        toastEl.textContent = message;
        toastEl.className = `toast ${isError ? 'error' : ''}`;
        toastEl.classList.remove('hidden');
        setTimeout(() => {
            toastEl.classList.add('hidden');
        }, 3000);
    }

    function useCustomConfirm(title, message, onConfirm) {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        confirmModal.classList.remove('hidden');

        const handleOk = () => {
            cleanup();
            onConfirm();
        };

        const handleCancel = () => {
            cleanup();
        };

        const cleanup = () => {
            confirmModal.classList.add('hidden');
            confirmOkBtn.removeEventListener('click', handleOk);
            confirmCancelBtn.removeEventListener('click', handleCancel);
        };

        confirmOkBtn.addEventListener('click', handleOk);
        confirmCancelBtn.addEventListener('click', handleCancel);
    }

    function toggleView(isLoggedIn) {
        if (isLoggedIn) {
            authView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
            navUsername.textContent = currentUser.username;
            loadSheets();
        } else {
            authView.classList.remove('hidden');
            dashboardView.classList.add('hidden');
            usernameInput.value = '';
            passwordInput.value = '';
        }
    }

    function checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            currentUser = JSON.parse(user);
            toggleView(true);
        } else {
            toggleView(false);
        }
    }

    // Auth Logic
    toggleAuthBtn.addEventListener('click', () => {
        isRegistering = !isRegistering;
        if (isRegistering) {
            authTitle.textContent = 'Create Account';
            authDesc.textContent = 'Sign up to manage your expenses';
            authSubmitBtn.textContent = 'Register';
            toggleAuthBtn.textContent = 'Login';
        } else {
            authTitle.textContent = 'Welcome';
            authDesc.textContent = 'Sign in to manage your expenses';
            authSubmitBtn.textContent = 'Login';
            toggleAuthBtn.textContent = 'Register';
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;

        try {
            if (isRegistering) {
                await ApiService.register(username, password);
                showToast('Registration successful! Please login.');
                toggleAuthBtn.click(); // Switch back to login
            } else {
                const res = await ApiService.login(username, password);
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));
                currentUser = res.user;
                showToast('Login successful!');
                toggleView(true);
            }
        } catch (err) {
            showToast(err.message, true);
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        currentSheetId = null;
        toggleView(false);
    });

    // Sheets Logic
    async function loadSheets() {
        try {
            sheets = await ApiService.getSheets();
            renderSheets();
            if (sheets.length > 0 && !currentSheetId) {
                selectSheet(sheets[0]._id, sheets[0].title);
            } else if (sheets.length === 0) {
                expensesArea.classList.add('hidden');
                noSheetSelected.classList.remove('hidden');
            }
        } catch (err) {
            showToast('Failed to load sheets', true);
        }
    }

    function renderSheets() {
        sheetsList.innerHTML = '';
        sheets.forEach(sheet => {
            const el = document.createElement('div');
            el.className = `sheet-item ${sheet._id === currentSheetId ? 'active' : ''}`;
            el.textContent = sheet.title;
            el.onclick = () => selectSheet(sheet._id, sheet.title);
            sheetsList.appendChild(el);
        });
    }

    function selectSheet(id, title) {
        currentSheetId = id;
        currentSheetTitle.textContent = title;
        renderSheets();
        expensesArea.classList.remove('hidden');
        noSheetSelected.classList.add('hidden');
        loadExpenses();
    }

    newSheetBtn.addEventListener('click', () => {
        sheetModal.classList.remove('hidden');
        sheetTitleInput.focus();
    });

    sheetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const newSheet = await ApiService.createSheet(sheetTitleInput.value);
            sheetModal.classList.add('hidden');
            sheetTitleInput.value = '';
            showToast('Sheet created!');
            await loadSheets();
            selectSheet(newSheet._id, newSheet.title);
        } catch (err) {
            showToast(err.message, true);
        }
    });

    deleteSheetBtn.addEventListener('click', () => {
        useCustomConfirm('Delete Sheet', 'Are you sure you want to delete this sheet and all its expenses?', async () => {
            try {
                await ApiService.deleteSheet(currentSheetId);
                showToast('Sheet deleted');
                currentSheetId = null;
                loadSheets();
            } catch (err) {
                showToast(err.message, true);
            }
        });
    });

    // Expenses Logic
    async function loadExpenses() {
        try {
            expenses = await ApiService.getExpenses(currentSheetId);
            renderExpenses();
        } catch (err) {
            showToast('Failed to load expenses', true);
        }
    }

    function renderExpenses() {
        expensesList.innerHTML = '';
        let total = 0;

        expenses.forEach(expense => {
            total += expense.amount;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(expense.date).toLocaleDateString()}</td>
                <td>${expense.description}</td>
                <td><span class="btn-small btn-secondary" style="background: rgba(255,255,255,0.1)">${expense.category}</span></td>
                <td style="font-weight: 600">$${expense.amount.toFixed(2)}</td>
                <td class="action-btns">
                    <button class="btn-small btn-secondary edit-btn" data-id="${expense._id}">Edit</button>
                    <button class="btn-small btn-danger delete-btn" data-id="${expense._id}">Del</button>
                </td>
            `;
            expensesList.appendChild(tr);
        });

        totalAmount.textContent = `$${total.toFixed(2)}`;

        // Attach listeners dynamically
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteExpense(e.target.dataset.id));
        });
    }

    addExpenseBtn.addEventListener('click', () => {
        editingExpenseId = null;
        expenseForm.reset();
        document.getElementById('expense-date').valueAsDate = new Date();
        expenseModalTitle.textContent = 'Add Expense';
        expenseModal.classList.remove('hidden');
    });

    function openEditModal(id) {
        const expense = expenses.find(e => e._id === id);
        if (!expense) return;
        
        editingExpenseId = id;
        document.getElementById('expense-date').value = expense.date.split('T')[0];
        document.getElementById('expense-desc').value = expense.description;
        document.getElementById('expense-category').value = expense.category;
        document.getElementById('expense-amount').value = expense.amount;
        
        expenseModalTitle.textContent = 'Edit Expense';
        expenseModal.classList.remove('hidden');
    }

    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            sheetId: currentSheetId,
            date: document.getElementById('expense-date').value,
            description: document.getElementById('expense-desc').value,
            category: document.getElementById('expense-category').value,
            amount: document.getElementById('expense-amount').value
        };

        try {
            if (editingExpenseId) {
                await ApiService.updateExpense(editingExpenseId, data);
                showToast('Expense updated');
            } else {
                await ApiService.addExpense(data);
                showToast('Expense added');
            }
            expenseModal.classList.add('hidden');
            loadExpenses();
        } catch (err) {
            showToast(err.message, true);
        }
    });

    function deleteExpense(id) {
        useCustomConfirm('Delete Expense', 'Are you sure you want to delete this expense?', async () => {
            try {
                await ApiService.deleteExpense(id);
                showToast('Expense deleted');
                loadExpenses();
            } catch (err) {
                showToast(err.message, true);
            }
        });
    }

    // Modal Close Logic
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.add('hidden');
        });
    });

    // Init
    checkAuth();
});
