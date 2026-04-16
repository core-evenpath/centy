import { registerBlock } from '../registry';
import { registerHospitalityBlocks } from './hospitality';
import { registerHealthcareBlocks } from './healthcare';
import { registerFoodBeverageBlocks } from './food_beverage';
import { registerBusinessBlocks } from './business';
import { registerEducationBlocks } from './education';
import { registerPersonalWellnessBlocks } from './personal_wellness';
import { registerAutomotiveBlocks } from './automotive';
import { registerTravelTransportBlocks } from './travel_transport';
import { registerEventsEntertainmentBlocks } from './events_entertainment';
import { registerFinancialServicesBlocks } from './financial_services';
import { registerHomePropertyBlocks } from './home_property';
import { registerFoodSupplyBlocks } from './food_supply';
import { registerPublicNonprofitBlocks } from './public_nonprofit';

import GreetingBlock, { definition as greetingDef } from './ecommerce/greeting';
import ProductCardBlock, { definition as productCardDef } from './ecommerce/product-card';
import ProductDetailBlock, { definition as productDetailDef } from './ecommerce/product-detail';
import CompareBlock, { definition as compareDef } from './ecommerce/compare';
import CartBlock, { definition as cartDef } from './ecommerce/cart';
import OrderConfirmationBlock, { definition as orderConfirmationDef } from './ecommerce/order-confirmation';
import OrderConfirmationLive from './ecommerce/order-confirmation-live';
import OrderTrackerBlock, { definition as orderTrackerDef } from './ecommerce/order-tracker';
import OrderTrackerLive from './ecommerce/order-tracker-live';
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
  // Live wrappers: same definitions, but the render components fetch
  // real order data from `/api/relay/order` when an `orderId` /
  // `order` prop is supplied. Falls back to the design sample otherwise.
  registerBlock(orderConfirmationDef, OrderConfirmationLive);
  registerBlock(orderTrackerDef, OrderTrackerLive);
  registerBlock(promoDef, PromoBlock);
  // Shared
  registerBlock(nudgeDef, NudgeBlock);
  registerBlock(suggestionsDef, SuggestionsBlock);
  registerBlock(contactDef, ContactBlock);
  // Verticals
  registerHospitalityBlocks();
  registerHealthcareBlocks();
  registerFoodBeverageBlocks();
  registerBusinessBlocks();
  registerEducationBlocks();
  registerPersonalWellnessBlocks();
  registerAutomotiveBlocks();
  registerTravelTransportBlocks();
  registerEventsEntertainmentBlocks();
  registerFinancialServicesBlocks();
  registerHomePropertyBlocks();
  registerFoodSupplyBlocks();
  registerPublicNonprofitBlocks();
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
