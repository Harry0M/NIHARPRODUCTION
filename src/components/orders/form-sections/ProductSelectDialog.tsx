import { useState, useEffect, useCallback } from "react";
import { 
  NoAnimationDialog as Dialog, 
  NoAnimationDialogContent as DialogContent, 
  NoAnimationDialogHeader as DialogHeader, 
  NoAnimationDialogTitle as DialogTitle 
} from "@/components/purchases/NoAnimationDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Product {
  id: string;
  name: string;
  bag_length?: number;
  bag_width?: number;
  border_dimension?: number;
  default_rate?: number;
  default_quantity?: number;
  [key: string]: any;
}

interface ProductSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSelect: (product: Product) => void;
  isLoading: boolean;
  searchFields?: string[];
}

const ITEMS_PER_PAGE = 10;

export function ProductSelectDialog({
  open,
  onOpenChange,
  products,
  onSelect,
  isLoading,
  searchFields = ["name"]
}: ProductSelectDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Debug log
  console.log("ProductSelectDialog - Products received:", products?.length, products);
  
  // Update filteredProducts when products prop changes
  useEffect(() => {
    if (products && Array.isArray(products)) {
      setFilteredProducts(products);
      console.log("ProductSelectDialog - Updated filtered products:", products.length);
    } else {
      console.warn("ProductSelectDialog - No products data or invalid format");
      setFilteredProducts([]);
    }
  }, [products]);
  
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Update filtered products when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products || []);
      return;
    }

    if (!products || !Array.isArray(products)) {
      console.warn("ProductSelectDialog - Cannot filter: products data is invalid");
      return;
    }

    const lowerQuery = searchQuery.toLowerCase().trim();
    const filtered = products.filter(product => {
      return searchFields.some(field => {
        if (!product || !product[field]) return false;
        return product[field].toString().toLowerCase().includes(lowerQuery);
      });
    });

    console.log("ProductSelectDialog - Filtered products:", filtered.length, "out of", products.length);
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page on new search
  }, [products, searchQuery, searchFields]);

  // Clear search, reset page, and log products when dialog opens/closes
  useEffect(() => {
    if (open) {
      console.log("Dialog opened with products:", products?.length);
      // Force refresh filtered products when dialog opens
      if (products && Array.isArray(products)) {
        setFilteredProducts([...products]);
      }
    } else {
      setSearchQuery("");
      setCurrentPage(1);
    }
  }, [open, products]);

  const handleSelect = (product: Product) => {
    onSelect(product);
    onOpenChange(false);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Product</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-72">
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">
              Loading products...
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className="space-y-1">
              {paginatedProducts.map((product) => (
                <Button
                  key={product.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => handleSelect(product)}
                >
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.bag_length && product.bag_width 
                        ? `${product.bag_length}" × ${product.bag_width}"`
                        : "No dimensions"
                      }
                      {product.default_quantity && product.default_quantity > 1 
                        ? ` - ${product.default_quantity} units` 
                        : ''
                      }
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              {products && products.length > 0 ? (
                <>No matching products found</>  
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <span>No products available</span>
                  <span className="text-xs">Please try refreshing the page</span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        {/* Pagination controls */}
        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
