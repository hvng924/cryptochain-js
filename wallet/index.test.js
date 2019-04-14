const Wallet = require('./index')
const { verifySignature } = require('../util')
const Transaction = require('./transaction')
const Blockchain = require('../blockchain')
const { STARTING_BALANCE } = require('../config')

describe('Wallet', () => {
  let wallet

  beforeEach(() => {
    wallet = new Wallet()
  })

  it('has a `balance`', () => {
    expect(wallet).toHaveProperty('balance')
  })

  it('has a `publicKey`', () => {
    expect(wallet).toHaveProperty('publicKey')
  })

  describe('signing data', () => {
    const data = 'foobar'

    it('verifies a signature', () => {
      expect(verifySignature({
        publicKey: wallet.publicKey,
        data,
        signature: wallet.sign(data)
      })).toBe(true)
    })

    it('does not verify an invalid signature', () => {
      expect(verifySignature({
        publicKey: wallet.publicKey,
        data,
        signature: new Wallet().sign(data)
      })).toBe(false)
    })
  })
  
  describe('createTransaction()', () => {
    let transaction, amount, recipient

    beforeEach(() => {
      amount = 50
      recipient = 'foo-recipient'
      transaction = wallet.createTransaction({ amount, recipient })
    })

    describe('and the amount exceeds the balance', () => {
      it('throws an error', () => {
        expect(() => wallet.createTransaction({ amount: 999999999, recipient: 'foo' }))
          .toThrow('Amount exceeds balance')
      })
    })

    describe('and the amount is valid', () => {
      it('creates an instance of Transaction', () => {
        expect(transaction instanceof Transaction).toBe(true)
      })

      it('matches the transaction input with the wallet', () => {
        expect(transaction.input.address).toEqual(wallet.publicKey)
      })

      it('outputs the amount the recipient', () => {
        expect(transaction.outputMap[recipient]).toEqual(amount)
      })
    })

    describe('and a chain is passed', () => {
      it('calls `Wallet.calculateBalance`', () => {
        const calculateBalanceMock = jest.fn()

        const originalCalculateBalance = Wallet.calculateBalance

        Wallet.calculateBalance = calculateBalanceMock

        wallet.createTransaction({
          recipient: 'foo',
          amount: 10,
          chain: new Blockchain().chain
        })

        expect(calculateBalanceMock).toHaveBeenCalled()

        Wallet.calculateBalance = originalCalculateBalance
      })
    })
  })

  describe('calculateBalance()', () => {
    let blockchain

    beforeEach(() => {
      blockchain = new Blockchain()
    })

    describe('and there are no outputs for the wallet', () => {
      it('returns the `STARTING_BALANCE`', () => {
        const balance = Wallet.calculateBalance({
          chain: blockchain.chain,
          address: wallet.publicKey
        })
        expect(balance).toEqual(STARTING_BALANCE)
      })
    })

    describe('and there are outputs for the wallet', () => {
      let transactionOne, transactionTwo

      beforeEach(() => {
        transactionOne = new Wallet().createTransaction({
          amount: 50,
          recipient: wallet.publicKey
        })

        transactionTwo = new Wallet().createTransaction({
          amount: 60,
          recipient: wallet.publicKey
        })

        blockchain.addBlock({
          data: [transactionOne, transactionTwo]
        })
      })

      it('adds the sume of all outputs to the wallet balance', () => {
        const balance = Wallet.calculateBalance({
          chain: blockchain.chain,
          address: wallet.publicKey
        })
        expect(balance)
          .toEqual(
            STARTING_BALANCE +
            transactionOne.outputMap[wallet.publicKey] +
            transactionTwo.outputMap[wallet.publicKey]
        )
      })
    })
  })
})