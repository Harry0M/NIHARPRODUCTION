
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MaterialSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  placeholder?: string;
}

export const MaterialSearchBar = ({ 
  searchQuery, 
  setSearchQuery,
  placeholder = "Search materials..." 
}: MaterialSearchBarProps) => {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9 bg-white border-slate-200"
      />
    </div>
  );
};
