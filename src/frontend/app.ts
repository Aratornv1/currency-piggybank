const form = document.getElementById('tx-form') as HTMLFormElement;
const balanceDisplay = document.getElementById('balance-display') as HTMLDivElement;

async function updateBalance() {
    const target = (document.getElementById('target-currency') as HTMLSelectElement).value;
    const res = await fetch(`/api/balance?target=${target}`);
    const data = await res.json();
    balanceDisplay.innerText = `${data.total} ${data.targetCurrency}`;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        amount: (document.getElementById('amount') as HTMLInputElement).value,
        currency: (document.getElementById('currency') as HTMLSelectElement).value,
        date: (document.getElementById('date') as HTMLInputElement).value,
        type: (document.getElementById('type') as HTMLSelectElement).value
    };
    await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    updateBalance();
});