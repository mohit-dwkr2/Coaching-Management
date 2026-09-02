import {
  StudentFeeData,
  FeeTransaction,
} from "../types";

export interface FeeAnalyticsData {
  totalAssigned: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionPercentage: number;

  pendingStudents: number;
  partialStudents: number;
  overdueStudents: number;

  todayCollection: number;
  monthCollection: number;
}

export function analyticsCalculations(
  studentFees: StudentFeeData[],
  feeTransactions: FeeTransaction[]
): FeeAnalyticsData {

  const totalAssigned = studentFees.reduce(
    (sum, fee) => sum + (fee.final_fee || 0),
    0
  );

  const totalCollected = studentFees.reduce(
    (sum, fee) => sum + (fee.paid_amount || 0),
    0
  );

  const totalOutstanding = studentFees.reduce(
    (sum, fee) => sum + (fee.remaining_amount || 0),
    0
  );

  const collectionPercentage =
    totalAssigned === 0
      ? 0
      : Math.round((totalCollected / totalAssigned) * 100);

  const pendingStudents = studentFees.filter(
    (fee) => fee.status === "Pending"
  ).length;

  const partialStudents = studentFees.filter(
    (fee) => fee.status === "Partial"
  ).length;

  const today = new Date();

  const overdueStudents = studentFees.filter((fee) => {
    if (!fee.next_due_date) return false;

    return (
      new Date(fee.next_due_date) < today &&
      fee.remaining_amount > 0
    );
  }).length;

  // Payment table connect hone ke baad
  // real calculation karenge.

const todayCollection = feeTransactions
  .filter((transaction) => {
    const transactionDate = new Date(transaction.transaction_date);

    return (
      transactionDate.getFullYear() === today.getFullYear() &&
      transactionDate.getMonth() === today.getMonth() &&
      transactionDate.getDate() === today.getDate()
    );
  })
  .reduce((sum, transaction) => sum + transaction.amount, 0);



const monthCollection = feeTransactions
  .filter((transaction) => {
    const transactionDate = new Date(transaction.transaction_date);

    return (
      transactionDate.getFullYear() === today.getFullYear() &&
      transactionDate.getMonth() === today.getMonth()
    );
  })
  .reduce((sum, transaction) => sum + transaction.amount, 0);



  return {
    totalAssigned,
    totalCollected,
    totalOutstanding,
    collectionPercentage,

    pendingStudents,
    partialStudents,
    overdueStudents,

    todayCollection,
    monthCollection,
  };
}