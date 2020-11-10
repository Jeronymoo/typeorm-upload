import {MigrationInterface, QueryRunner, TableForeignKey} from "typeorm";

export default class AddTransactionForeignKey1604698654341 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createForeignKey('transactions', new TableForeignKey({
          name: 'CategoryProvider',
          columnNames: ['category_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'categories',
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropForeignKey('transactions', 'CategoryProvider');
    }

}
