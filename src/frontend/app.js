const form = document.getElementById('tx-form');
const balanceDisplay = document.getElementById('balance-display');
async function updateBalance() {
    const target = document.getElementById('target-currency').value;
    const res = await fetch(`/api/balance?target=${target}`);
    const data = await res.json();
    balanceDisplay.innerText = `${data.total} ${data.targetCurrency}`;
}
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        amount: document.getElementById('amount').value,
        currency: document.getElementById('currency').value,
        date: document.getElementById('date').value,
        type: document.getElementById('type').value
    };
    await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    updateBalance();
});
export {};
//# sourceMappingURL=app.js.map