'use server';
import 'server-only';
import type { UserProfile } from './types';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
  throw new Error('Paystack secret key is not configured in environment variables.');
}

interface PaystackCustomer {
  email: string;
  first_name?: string;
  last_name?: string;
}

interface PaystackDedicatedAccountPayload {
  customer: string; // Customer ID or code
  preferred_bank: string;
}

interface PaystackApiError {
  status: boolean;
  message: string;
}

interface CreateCustomerResponse {
  status: boolean;
  message: string;
  data: {
    customer_code: string;
    // ... other fields
  };
}

interface CreateDedicatedAccountResponse {
  status: boolean;
  message: string;
  data: {
    bank: {
      name: string;
      id: number;
      slug: string;
    };
    account_name: string;
    account_number: string;
    // ... other fields
  };
}

/**
 * Creates a new customer on Paystack.
 * @param customerData The customer's details.
 * @returns The customer code.
 */
async function createPaystackCustomer(customerData: PaystackCustomer): Promise<string> {
  const response = await fetch(`${PAYSTACK_API_URL}/customer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });

  const result: CreateCustomerResponse | PaystackApiError = await response.json();

  if (!result.status) {
    throw new Error(`Paystack API Error (Create Customer): ${result.message}`);
  }

  return (result as CreateCustomerResponse).data.customer_code;
}

/**
 * Creates a Dedicated Virtual Account for a Paystack customer.
 * @param profile The user's profile from Firestore.
 * @returns The bank name and account number of the new DVA.
 */
export async function createDedicatedAccount(profile: UserProfile): Promise<{ bankName: string, accountNumber: string }> {
  try {
    // Step 1: Create a customer on Paystack
    const customerCode = await createPaystackCustomer({
      email: profile.email,
      first_name: profile.displayName.split(' ')[0],
      last_name: profile.displayName.split(' ').slice(1).join(' '),
    });

    // Step 2: Create a dedicated account and assign it to the customer
    const dvaPayload: PaystackDedicatedAccountPayload = {
      customer: customerCode,
      preferred_bank: 'wema-bank', // Wema Bank is often used for DVAs
    };

    const response = await fetch(`${PAYSTACK_API_URL}/dedicated_account`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dvaPayload),
    });

    const result: CreateDedicatedAccountResponse | PaystackApiError = await response.json();

    if (!result.status) {
      throw new Error(`Paystack API Error (Create DVA): ${result.message}`);
    }

    const { bank, account_number } = (result as CreateDedicatedAccountResponse).data;

    return {
      bankName: bank.name,
      accountNumber: account_number,
    };
  } catch (error) {
    console.error('Error creating dedicated account:', error);
    throw new Error('Failed to create a dedicated payment account.');
  }
}
