import {
    insertTransaction,
    findAllTransactions,
    netByCurrency,
    type TxType,
} from '../repositories/transactionRepository';
import { convert, getSupportedCurrencies, isSupported } from './ratesProvider';

const today = () => new Date().toISOString().slice(0, 10);

const badRequest = (message: string) => Object.assign(new Error(message), { status: 400 });

export interface RecordInput {
    amount: number; // у валюті операції (напр. 12.50)
    currency: string;
    date?: string; // 'YYYY-MM-DD', за замовчуванням — сьогодні
}

const record = async (type: TxType, input: RecordInput): Promise<{ id: number }> => {
    if (!(await isSupported(input.currency))) {
        throw badRequest(`Валюта не підтримується: ${input.currency}`);
    }
    const id = await insertTransaction({
        amount: input.amount,
        currency: input.currency,
        type,
        date: input.date ?? today(),
    });
    return { id };
};

export const deposit = (input: RecordInput) => record('deposit', input);
export const withdraw = (input: RecordInput) => record('withdrawal', input);

// Агрегований баланс: усі валюти зводяться в одну `target`.
export const getBalance = async (target: string): Promise<{ currency: string; total: number }> => {
    if (!(await isSupported(target))) {
        throw badRequest(`Валюта не підтримується: ${target}`);
    }
    const nets = await netByCurrency();
    let total = 0;
    for (const { currency, net } of nets) {
        total += await convert(net, currency, target);
    }
    return { currency: target, total: Math.round(total * 100) / 100 };
};

export const getHistory = () => findAllTransactions();

export const listCurrencies = () => getSupportedCurrencies();
