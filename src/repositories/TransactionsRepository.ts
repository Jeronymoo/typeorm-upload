import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
     const transactions = await this.find();

     const {income, outcome} = transactions.reduce((accum: Balance, curr: Transaction) => {
      if (curr.type === "income") {
        accum.income += curr.value;
      }
      if (curr.type === "outcome") {
        accum.outcome += curr.value;
      }

      return accum;
     }, {
       income: 0,
       outcome: 0,
       total: 0
     });

     const total = income - outcome;

     return {income, outcome, total}
  }
}

export default TransactionsRepository;
