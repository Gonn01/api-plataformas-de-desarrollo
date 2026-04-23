export const MovementType = Object.freeze({
    CREATION: 'CREATION',
    PAYMENT:  'PAYMENT',
    REFUND:   'REFUND',
    DELETE:   'DELETE',
});

export const Currency = Object.freeze({
    ARS: 'ARS',
    USD: 'USD',
    EUR: 'EUR',
});

export const ExpenseType = Object.freeze({
    EGRESO:  'EGRESO',
    INGRESO: 'INGRESO',
});

export const ExpenseStatus = Object.freeze({
    ACTIVE:            'ACTIVE',
    PENDING_APPROVAL:  'PENDING_APPROVAL',
    REJECTED:          'REJECTED',
});
