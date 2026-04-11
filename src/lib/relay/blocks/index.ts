import { registerBlock } from '../registry';
import { registerHospitalityBlocks } from './hospitality';

import GreetingBlock, { definition as greetingDef } from './ecommerce/greeting';
import ProductCardBlock, { definition as productCardDef } from './ecommerce/product-card';
import ProductDetailBlock, { definition as productDetailDef } from './ecommerce/product-detail';
import CompareBlock, { definition as compareDef } from './ecommerce/compare';
import CartBlock, { definition as cartDef } from './ecommerce/cart';
import OrderConfirmationBlock, { definition as orderConfirmationDef } from './ecommerce/order-confirmation';
import OrderTrackerBlock, { definition as orderTrackerDef } from './ecommerce/order-tracker';
import PromoBlock, { definition as promoDef } from './ecommerce/promo';
import NudgeBlock, { definition as nudgeDef } from './shared/nudge';
import SuggestionsBlock, { definition as suggestionsDef } from './shared/suggestions';
import ContactBlock, { definition as contactDef } from './shared/contact';

export function registerAllBlocks(): void {
  // Ecommerce
  registerBlock(greetingDef, GreetingBlock);
  registerBlock(productCardDef, ProductCardBlock);
  registerBlock(productDetailDef, ProductDetailBlock);
  registerBlock(compareDef, CompareBlock);
  registerBlock(cartDef, CartBlock);
  registerBlock(orderConfirmationDef, OrderConfirmationBlock);
  registerBlock(orderTrackerDef, OrderTrackerBlock);
  registerBlock(promoDef, PromoBlock);
  // Shared
  registerBlock(nudgeDef, NudgeBlock);
  registerBlock(suggestionsDef, SuggestionsBlock);
  registerBlock(contactDef, ContactBlock);
  // Hospitality
  registerHospitalityBlocks();
}

export {
  GreetingBlock,
  ProductCardBlock,
  ProductDetailBlock,
  CompareBlock,
  CartBlock,
  OrderConfirmationBlock,
  OrderTrackerBlock,
  PromoBlock,
  NudgeBlock,
  SuggestionsBlock,
  ContactBlock,
};
