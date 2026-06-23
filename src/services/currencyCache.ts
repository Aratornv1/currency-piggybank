export const getRates = async (targetCurrency: string): Promise<Record<string, number>> => {
    return { 'USD': 1.0, 'EUR': 0.92, 'GBP': 0.79, 'AUD': 1.52 };
};