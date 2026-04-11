import { registerBlock } from '../../registry';

import MenuItemBlock, { definition as menuItemDef } from './menu-item';
import MenuDetailBlock, { definition as menuDetailDef } from './menu-detail';
import CategoryBrowserBlock, { definition as categoryBrowserDef } from './category-browser';
import DietaryFilterBlock, { definition as dietaryFilterDef } from './dietary-filter';
import OrderCustomizerBlock, { definition as orderCustomizerDef } from './order-customizer';
import TableReservationBlock, { definition as tableReservationDef } from './table-reservation';
import DailySpecialsBlock, { definition as dailySpecialsDef } from './daily-specials';
import KitchenQueueBlock, { definition as kitchenQueueDef } from './kitchen-queue';
import ComboMealBlock, { definition as comboMealDef } from './combo-meal';
import DrinkMenuBlock, { definition as drinkMenuDef } from './drink-menu';
import ChefProfileBlock, { definition as chefProfileDef } from './chef-profile';
import CateringBlock, { definition as cateringDef } from './catering';
import NutritionBlock, { definition as nutritionDef } from './nutrition';
import DinerReviewBlock, { definition as dinerReviewDef } from './diner-review';

export function registerFoodBeverageBlocks(): void {
  registerBlock(menuItemDef, MenuItemBlock);
  registerBlock(menuDetailDef, MenuDetailBlock);
  registerBlock(categoryBrowserDef, CategoryBrowserBlock);
  registerBlock(dietaryFilterDef, DietaryFilterBlock);
  registerBlock(orderCustomizerDef, OrderCustomizerBlock);
  registerBlock(tableReservationDef, TableReservationBlock);
  registerBlock(dailySpecialsDef, DailySpecialsBlock);
  registerBlock(kitchenQueueDef, KitchenQueueBlock);
  registerBlock(comboMealDef, ComboMealBlock);
  registerBlock(drinkMenuDef, DrinkMenuBlock);
  registerBlock(chefProfileDef, ChefProfileBlock);
  registerBlock(cateringDef, CateringBlock);
  registerBlock(nutritionDef, NutritionBlock);
  registerBlock(dinerReviewDef, DinerReviewBlock);
}

export {
  MenuItemBlock, MenuDetailBlock, CategoryBrowserBlock, DietaryFilterBlock,
  OrderCustomizerBlock, TableReservationBlock, DailySpecialsBlock, KitchenQueueBlock,
  ComboMealBlock, DrinkMenuBlock, ChefProfileBlock, CateringBlock,
  NutritionBlock, DinerReviewBlock,
};
