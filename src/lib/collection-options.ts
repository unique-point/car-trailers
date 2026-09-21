import type {Commercial} from './pricing';
// Shared by server pricing and browser configuration; contains no provider or schema code.
export const collectionOptions=(product:Commercial)=>[product.collection,...(product.collections||[]).filter(c=>c.id!==product.collection.id)];
