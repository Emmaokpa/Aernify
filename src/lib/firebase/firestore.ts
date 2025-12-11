
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Product } from '@/lib/types';

/**
 * Fetches a single product document from Firestore by its ID.
 * This is designed to be used on the server side.
 * @param productId The ID of the product to fetch.
 * @returns The product object including its ID, or null if not found.
 */
export async function getProductById(productId: string): Promise<Product | null> {
  // We must initialize firebase on the server for this to work.
  const { firestore } = initializeFirebase();
  const productDocRef = doc(firestore, 'products', productId);

  try {
    const docSnap = await getDoc(productDocRef);

    if (docSnap.exists()) {
      // Return the document data and explicitly include the document ID
      return { id: docSnap.id, ...docSnap.data() } as Product;
    } else {
      // The document does not exist, return null
      console.log(`No product found with ID: ${productId}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    // In case of an error (e.g., permissions), also return null
    return null;
  }
}
