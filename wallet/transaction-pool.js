const Transaction = require('./transaction')

class TransactionPool {
  constructor() {
    this.transactionMap = {}
  }

  setTransaction(transaction) {
    this.transactionMap[transaction.id] = transaction
  }

  clear() {
    this.transactionMap = {}
  }

  clearBlockchainTransactions( { chain } ) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i]

      for (let transaction of block.data) {
        if (this.transactionMap[transaction.id]) {
          delete this.transactionMap[transaction.id]
        }
      }
    }
  }

  existingTransaction({ inputAddress }) {
    const transactions = Object.values(this.transactionMap)

    return transactions.find((t) => t.input.address === inputAddress)
  }

  validTransactions() {
    return Object.values(this.transactionMap).filter(
      (t) => Transaction.validTransaction(t)
    )
  }
}

module.exports = TransactionPool