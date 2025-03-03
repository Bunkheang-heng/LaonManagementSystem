const { db } = require('../firebase-admin');

async function getNextId(type) {
    const counterRef = db.collection('counters').doc(type);
    
    try {
        const result = await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(counterRef);
            const newCount = (doc.exists ? doc.data().count : 0) + 1;
            
            transaction.set(counterRef, { count: newCount });
            
            return newCount;
        });

        return `${type}${result.toString().padStart(3, '0')}`;
    } catch (error) {
        console.error(`Error generating ${type} ID:`, error);
        throw error;
    }
}

async function generateUserId() {
    return getNextId('USER');
}

async function generateLoanId() {
    return getNextId('LOAN');
}

async function generatePaymentId() {
    return getNextId('PAY');
}

module.exports = { generateLoanId, generateUserId, generatePaymentId }; 