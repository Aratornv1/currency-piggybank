interface Transaction {
    id: number;
    amount: number;
    currency: string;
    type: 'deposit' | 'withdrawal';
    date: string;
}

const $ = <T extends HTMLElement>(id: string): T => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Не знайдено елемент #${id}`);
    return el as T;
};

const form = $<HTMLFormElement>('tx-form');
const balanceDisplay = $<HTMLDivElement>('balance-display');
const targetCurrency = $<HTMLSelectElement>('target-currency');
const currencySelect = $<HTMLSelectElement>('currency');
const typeSelect = $<HTMLSelectElement>('type');
const amountInput = $<HTMLInputElement>('amount');
const dateInput = $<HTMLInputElement>('date');
const historyContainer = $<HTMLDivElement>('history-container');

const api = async <T>(url: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(url, init);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? `Помилка ${res.status}`);
    return data as T;
};

// Заповнює обидва селекти валют зі списку, який віддає бекенд (/api/currencies).
async function loadCurrencies(): Promise<void> {
    const currencies = await api<Record<string, string>>('/api/currencies');
    const codes = Object.keys(currencies).sort();

    const fill = (select: HTMLSelectElement, selected: string) => {
        select.innerHTML = '';
        for (const code of codes) {
            const opt = document.createElement('option');
            opt.value = code;
            opt.textContent = `${code} — ${currencies[code]}`;
            if (code === selected) opt.selected = true;
            select.appendChild(opt);
        }
    };

    fill(currencySelect, 'USD');
    fill(targetCurrency, 'USD');
}

async function updateBalance(): Promise<void> {
    const currency = targetCurrency.value;
    const { total, currency: cur } = await api<{ total: number; currency: string }>(
        `/api/balance?currency=${encodeURIComponent(currency)}`
    );
    balanceDisplay.innerText = `${total.toFixed(2)} ${cur}`;
}

async function loadHistory(): Promise<void> {
    const txs = await api<Transaction[]>('/api/transactions');
    historyContainer.innerHTML = '';

    if (txs.length === 0) {
        historyContainer.innerHTML = '<p class="text-gray-400 text-sm">Поки що немає операцій</p>';
        return;
    }

    for (const tx of txs) {
        const isDeposit = tx.type === 'deposit';
        const row = document.createElement('div');
        row.className = 'flex justify-between items-center border-b pb-1 text-sm';
        row.innerHTML = `
            <span class="text-gray-500">${tx.date}</span>
            <span class="font-semibold ${isDeposit ? 'text-green-600' : 'text-red-600'}">
                ${isDeposit ? '+' : '−'}${tx.amount.toFixed(2)} ${tx.currency}
            </span>`;
        historyContainer.appendChild(row);
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = typeSelect.value; // 'deposit' | 'withdrawal'
    const url = type === 'deposit' ? '/api/deposits' : '/api/withdrawals';
    const body = {
        amount: amountInput.value,
        currency: currencySelect.value,
        date: dateInput.value,
    };

    try {
        await api(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        amountInput.value = '';
        await Promise.all([updateBalance(), loadHistory()]);
    } catch (err) {
        alert((err as Error).message);
    }
});

targetCurrency.addEventListener('change', updateBalance);

// Початкове завантаження.
(async () => {
    try {
        await loadCurrencies();
        await Promise.all([updateBalance(), loadHistory()]);
    } catch (err) {
        console.error(err);
    }
})();
