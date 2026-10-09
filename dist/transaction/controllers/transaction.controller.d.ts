import { ITransactionService } from '@transaction/services/transaction.service';
import { QueryTransactionDto } from '@transaction/dto/view-transaction.dto';
import { PaginationParams } from '@common/decorators/pagination.decorator';
export declare class TransactionController {
    private readonly transactionService;
    private readonly logger;
    constructor(transactionService: ITransactionService);
    list(pagination: PaginationParams, queryTransactionDto: QueryTransactionDto): Promise<any>;
    getDetail(staffId: string): Promise<{
        payment: Partial<import("../schemas/transaction.schema").Payment>;
        payout: Pick<import("../schemas/transaction.schema").Payout, "status" | "createdAt" | "id" | "code" | "histories">;
        _id: string;
        type: import("@src/transaction/contracts/constant").TransactionType;
        paymentMethod: import("@src/transaction/contracts/constant").PaymentMethod;
        amount: number;
        debitAccount: import("../schemas/transaction.schema").TransactionAccount;
        creditAccount: import("../schemas/transaction.schema").TransactionAccount;
        description: string;
        status: import("@common/contracts/constant").TransactionStatus;
    }>;
}
