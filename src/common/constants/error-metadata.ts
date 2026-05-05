import { HttpStatus } from '@nestjs/common';

/**
 * Raw error definitions. This is the internal Single Source of Truth.
 */
export const ErrorMetadata = {
  UNAUTHORIZED: {
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  },
  INVALID_CREDENTIALS: {
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid name or password',
  },
  INVALID_REFRESH_TOKEN: {
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  },
  MISSING_ROLE: {
    status: HttpStatus.FORBIDDEN,
    description: 'Missing required role',
    args: { roles: 'ADMIN, USER' },
  },
  DEPARTMENT_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    description: 'Department not found',
    args: { departmentName: 'Engineering' },
  },
  DEPARTMENT_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    description: 'A department already exists with the same name',
    args: { departmentName: 'Engineering' },
  },
  DEPARTMENT_IN_USE: {
    status: HttpStatus.CONFLICT,
    description: 'Department is in use and cannot be deleted',
    args: { departmentName: 'Engineering' },
  },
  DEPARTMENT_HAS_MEMBERS: {
    status: HttpStatus.CONFLICT,
    description: 'Department has members and cannot be deleted',
    args: { departmentName: 'Engineering' },
  },
  MANAGER_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    description: 'The specified manager user was not found',
    args: { managerId: '1' },
  },
  MANAGER_NOT_MEMBER_OF_DEPARTMENT: {
    status: HttpStatus.CONFLICT,
    description: 'The specified manager does not belong to this department',
    args: { managerId: '1', departmentName: 'Engineering' },
  },
  MANAGER_ALREADY_MANAGES_DEPARTMENT: {
    status: HttpStatus.CONFLICT,
    description: 'The specified manager is already managing another department',
    args: { managerId: '1', departmentName: 'Engineering' },
  },
  USER_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    description: 'No user was found with such id',
    args: { userId: '1' },
  },
  USER_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    description: 'A user already exists with the same name',
    args: { userName: 'john_doe' },
  },
  USER_ENGAGED_IN_SYSTEM: {
    status: HttpStatus.CONFLICT,
    description: 'User is engaged in the system and cannot be deleted',
    args: { userId: '1' },
  },
  DOCUMENT_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
    args: { documentId: '1' },
  },
  DOCUMENT_ALREADY_USED: {
    status: HttpStatus.CONFLICT,
    description: 'Document is already used in another transaction',
    args: { documentId: '1' },
  },
  NOT_DOCUMENT_UPLOADER: {
    status: HttpStatus.FORBIDDEN,
    description: 'You are not the uploader of this document',
    args: { documentId: '1' },
  },
  NOT_DOCUMENT_VIEWER: {
    status: HttpStatus.FORBIDDEN,
    description: 'You are not authorized to view this document',
    args: { documentId: '1' },
  },
  NOT_DOCUMENT_ATTACHER: {
    status: HttpStatus.FORBIDDEN,
    description: 'You are not the attacher of this document',
    args: { transactionId: '1', documentId: '1' },
  },
  TRANSACTION_TYPE_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction type not found',
    args: { typeName: 'Financial' },
  },
  TRANSACTION_TYPE_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    description: 'A transaction type already exists with the same name',
    args: { typeName: 'Financial' },
  },
  TRANSACTION_TYPE_IN_USE: {
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete transaction type that is in use',
    args: { typeName: 'Financial' },
  },
  NOT_TRANSACTION_TYPE_CREATOR: {
    status: HttpStatus.FORBIDDEN,
    description: 'You are not the creator of this transaction type',
    args: { typeName: 'Financial' },
  },
  TRANSACTION_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction not found',
    args: { transactionId: '1' },
  },
  TRANSACTION_HAS_FORWARDS: {
    status: HttpStatus.CONFLICT,
    description: 'Transaction has forwards and cannot be deleted',
    args: { transactionId: '1' },
  },
  TRANSACTION_ALREADY_FULFILLED: {
    status: HttpStatus.CONFLICT,
    description: 'Transaction has already been fulfilled',
    args: { transactionId: '1' },
  },
  TRANSACTION_NOT_APPROVED: {
    status: HttpStatus.CONFLICT,
    description: 'Transaction not approved',
    args: { transactionId: '1' },
  },
  NOT_TRANSACTION_CREATOR: {
    status: HttpStatus.FORBIDDEN,
    description: 'You are not the creator of this transaction',
    args: { transactionId: '1' },
  },
  NOT_TRANSACTION_PARTICIPANT: {
    status: HttpStatus.FORBIDDEN,
    description: 'You are not a participant in this transaction',
    args: { transactionId: '1' },
  },
  NOT_LATEST_ACCOUNTANT: {
    status: HttpStatus.FORBIDDEN,
    description: 'You are not the latest accountant for this transaction',
    args: { transactionId: '1' },
  },
  MISSING_BUDGET_INFO: {
    status: HttpStatus.BAD_REQUEST,
    description: 'Missing budget information',
    args: { required: 'budgetName, budgetAllocation' },
  },
  INSUFFICIENT_BUDGET: {
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient budget',
    args: {
      categoryName: 'Engineering',
      availableAmount: '50',
      requestedAmount: '100',
    },
  },
  RESTRICTED_FIELD_UPDATE: {
    status: HttpStatus.FORBIDDEN,
    description: 'Updating some fields is restricted',
    args: { fields: 'FIELD_1, FIELD_2' },
  },
  TRANSACTION_FORWARD_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction forward not found',
    args: { forwardId: '1', transactionId: '1' },
  },
  TRANSACTION_FORWARD_RECEIVER_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction forward receiver not found',
    args: { receiverId: '1' },
  },
  FORWARD_ALREADY_SEEN: {
    status: HttpStatus.CONFLICT,
    description: 'Forward has already been seen',
    args: { forwardId: '1' },
  },
  FORWARD_ALREADY_RESPONDED: {
    status: HttpStatus.CONFLICT,
    description: 'Forward has already been responded to',
    args: { forwardId: '1' },
  },
  FORWARD_NOT_RESPONDED: {
    status: HttpStatus.CONFLICT,
    description: 'Forward has not been responded to yet',
    args: { transactionId: '1' },
  },
  NOT_LATEST_RECEIVER: {
    status: HttpStatus.FORBIDDEN,
    description: 'You are not the latest receiver of this transaction',
    args: { transactionId: '1' },
  },
  NOT_FORWARD_RECEIVER: {
    status: HttpStatus.FORBIDDEN,
    description: 'You are not the receiver of this forward',
    args: { forwardId: '1' },
  },
  NOT_FORWARD_SENDER: {
    status: HttpStatus.FORBIDDEN,
    description: 'You are not the sender of this forward',
    args: { forwardId: '1' },
  },
  BUDGET_CATEGORY_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    description: 'Budget category not found',
    args: { categoryName: 'Engineering' },
  },
  BUDGET_CATEGORY_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    description: 'Budget category already exists',
    args: { categoryName: 'Engineering' },
  },
  BUDGET_CATEGORY_IN_USE: {
    status: HttpStatus.CONFLICT,
    description: 'Budget category is in use',
    args: { categoryName: 'Engineering' },
  },
  BUDGET_ENTRY_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    description: 'Budget entry not found',
    args: { entryId: '1' },
  },
  NOT_LATEST_BUDGET_ENTRY: {
    status: HttpStatus.FORBIDDEN,
    description: 'Not the latest budget entry',
    args: { entryId: '1' },
  },
  NOTIFICATION_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
    args: { notificationId: '1' },
  },
} as const;
