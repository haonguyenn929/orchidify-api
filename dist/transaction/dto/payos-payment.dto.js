"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayOSRefundTransactionDto = exports.TransactionType = exports.PayOSPaymentResponseDto = exports.CreatePayOSPaymentResponseDto = exports.CreatePayOSPaymentResponse = void 0;
const swagger_1 = require("@nestjs/swagger");
const openapi_builder_1 = require("../../common/contracts/openapi-builder");
const constant_1 = require("../contracts/constant");
class CreatePayOSPaymentResponse {
}
exports.CreatePayOSPaymentResponse = CreatePayOSPaymentResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreatePayOSPaymentResponse.prototype, "bin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreatePayOSPaymentResponse.prototype, "accountNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreatePayOSPaymentResponse.prototype, "accountName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreatePayOSPaymentResponse.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreatePayOSPaymentResponse.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreatePayOSPaymentResponse.prototype, "orderCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreatePayOSPaymentResponse.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreatePayOSPaymentResponse.prototype, "paymentLinkId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: constant_1.PayOSStatus
    }),
    __metadata("design:type", String)
], CreatePayOSPaymentResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreatePayOSPaymentResponse.prototype, "checkoutUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreatePayOSPaymentResponse.prototype, "qrCode", void 0);
class CreatePayOSPaymentResponseDto extends (0, openapi_builder_1.DataResponse)(CreatePayOSPaymentResponse) {
}
exports.CreatePayOSPaymentResponseDto = CreatePayOSPaymentResponseDto;
class PayOSPaymentResponseDto {
}
exports.PayOSPaymentResponseDto = PayOSPaymentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PayOSPaymentResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PayOSPaymentResponseDto.prototype, "orderCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PayOSPaymentResponseDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PayOSPaymentResponseDto.prototype, "amountPaid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PayOSPaymentResponseDto.prototype, "amountRemaining", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: constant_1.PayOSStatus
    }),
    __metadata("design:type", String)
], PayOSPaymentResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PayOSPaymentResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], PayOSPaymentResponseDto.prototype, "transactions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PayOSPaymentResponseDto.prototype, "cancellationReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PayOSPaymentResponseDto.prototype, "canceledAt", void 0);
class TransactionType {
}
exports.TransactionType = TransactionType;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction reference code'
    }),
    __metadata("design:type", String)
], TransactionType.prototype, "reference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TransactionType.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransactionType.prototype, "accountNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransactionType.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransactionType.prototype, "transactionDateTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransactionType.prototype, "virtualAccountName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransactionType.prototype, "virtualAccountNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransactionType.prototype, "counterAccountBankId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransactionType.prototype, "counterAccountBankName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransactionType.prototype, "counterAccountName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransactionType.prototype, "counterAccountNumber", void 0);
class PayOSRefundTransactionDto {
}
exports.PayOSRefundTransactionDto = PayOSRefundTransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PayOSRefundTransactionDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PayOSRefundTransactionDto.prototype, "cancellationReason", void 0);
//# sourceMappingURL=payos-payment.dto.js.map