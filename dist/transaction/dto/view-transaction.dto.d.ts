import { BaseTransactionDto } from './base.transaction.dto';
import { TransactionStatus } from '@common/contracts/constant';
import { PaymentMethod, TransactionType } from '@transaction/contracts/constant';
export declare class QueryTransactionDto {
    type: TransactionType[];
    paymentMethod: PaymentMethod[];
    status: TransactionStatus[];
    fromAmount: number;
    toAmount: number;
}
declare const TransactionListItemResponse_base: import("@nestjs/common").Type<Pick<BaseTransactionDto, "status" | "createdAt" | "updatedAt" | "_id" | "type" | "description" | "amount" | "paymentMethod" | "debitAccount" | "creditAccount">>;
declare class TransactionListItemResponse extends TransactionListItemResponse_base {
}
declare const TransactionListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof TransactionListItemResponse)[];
    totalDocs: number;
    offset: number;
    limit: number;
    totalPages: number;
    page?: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage?: number;
    nextPage?: number;
}>;
declare class TransactionListResponse extends TransactionListResponse_base {
}
declare const TransactionListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof TransactionListResponse;
}>;
export declare class TransactionListDataResponse extends TransactionListDataResponse_base {
}
declare const TransactionDetailResponse_base: import("@nestjs/common").Type<Pick<BaseTransactionDto, "status" | "createdAt" | "updatedAt" | "_id" | "type" | "description" | "amount" | "paymentMethod" | "debitAccount" | "creditAccount" | "payment" | "payout">>;
declare class TransactionDetailResponse extends TransactionDetailResponse_base {
}
declare const TransactionDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof TransactionDetailResponse;
}>;
export declare class TransactionDetailDataResponse extends TransactionDetailDataResponse_base {
}
export {};
