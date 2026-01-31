
import { PartnerModuleCategory } from "@/lib/modules/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CategoryFilterProps {
    categories: PartnerModuleCategory[];
    selectedCategory: string | undefined;
    onSelectCategory: (categoryId: string | undefined) => void;
    className?: string;
}

export function CategoryFilter({
    categories,
    selectedCategory,
    onSelectCategory,
    className,
}: CategoryFilterProps) {
    if (categories.length === 0) return null;

    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            <Button
                variant={selectedCategory === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => onSelectCategory(undefined)}
                className="rounded-full"
            >
                All
            </Button>
            {categories
                .sort((a, b) => a.order - b.order)
                .map((category) => (
                    <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => onSelectCategory(category.id)}
                        className="rounded-full"
                    >
                        {category.icon && <span className="mr-1">{category.icon}</span>}
                        {category.name}
                        {category.itemCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="ml-2 h-5 px-1.5 text-[10px]"
                            >
                                {category.itemCount}
                            </Badge>
                        )}
                    </Button>
                ))}
        </div>
    );
}
