// Клієнт Frankfurter (курси ЄЦБ, без ключа) + кеш у пам'яті.
const API = 'https://api.frankfurter.app';
const TTL_MS = 60 * 60 * 1000; // курси оновлюються раз на день — кеш на 1 годину

interface RatesEntry {
    rates: Record<string, number>;
    fetchedAt: number;
}

// rates[X] = скільки X за 1 base (формат Frankfurter ?from=base)
const ratesCache = new Map<string, RatesEntry>();
let currenciesCache: { list: Record<string, string>; fetchedAt: number } | null = null;

const isFresh = (fetchedAt: number) => Date.now() - fetchedAt < TTL_MS;

export const getRates = async (base: string): Promise<Record<string, number>> => {
    const cached = ratesCache.get(base);
    if (cached && isFresh(cached.fetchedAt)) return cached.rates;

    try {
        const res = await fetch(`${API}/latest?from=${encodeURIComponent(base)}`);
        if (!res.ok) throw new Error(`Frankfurter відповів ${res.status}`);
        const data = (await res.json()) as { rates: Record<string, number> };
        const rates = { ...data.rates, [base]: 1 };
        ratesCache.set(base, { rates, fetchedAt: Date.now() });
        return rates;
    } catch (err) {
        if (cached) return cached.rates; // fallback на застарілий кеш
        throw err;
    }
};

// Конвертує суму з валюти `from` у `to` (major units).
export const convert = async (amount: number, from: string, to: string): Promise<number> => {
    if (from === to) return amount;
    const rates = await getRates(to); // скільки `from` за 1 `to`
    const perTo = rates[from];
    if (!perTo) throw new Error(`Немає курсу для конвертації ${from} → ${to}`);
    return amount / perTo;
};

export const getSupportedCurrencies = async (): Promise<Record<string, string>> => {
    if (currenciesCache && isFresh(currenciesCache.fetchedAt)) return currenciesCache.list;
    try {
        const res = await fetch(`${API}/currencies`);
        if (!res.ok) throw new Error(`Frankfurter відповів ${res.status}`);
        const list = (await res.json()) as Record<string, string>;
        currenciesCache = { list, fetchedAt: Date.now() };
        return list;
    } catch (err) {
        if (currenciesCache) return currenciesCache.list;
        throw err;
    }
};

export const isSupported = async (currency: string): Promise<boolean> => {
    const list = await getSupportedCurrencies();
    return currency in list;
};
