import csvPartse from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface CSVTransactions {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(file: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', file);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvPartse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: CSVTransactions[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, value, type, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitle = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(file);

    return createdTransactions;

    // parseCSV.on('data', async ({title, type, value, category}) => {
    //   let transactionCategory = await categoriesRepository.findOne({
    //     where: {
    //       title: category,
    //     }
    //   })

    //   if (!transactionCategory) {
    //     transactionCategory = categoriesRepository.create({
    //       title: category,
    //     })
    //   }

    //   await categoriesRepository.save(transactionCategory);

    //   const transaction = {
    //     title,
    //     type,
    //     value,
    //     category: transactionCategory
    //   }

    //   transactionRepository.create(transaction);

    //   await transactionRepository.save(transaction);
    // });
  }
}

export default ImportTransactionsService;
