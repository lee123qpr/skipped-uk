import { useState, useEffect } from "react";
import { Search, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SearchSuggestionsProps {
  searchTerm: string;
  onSuggestionClick: (suggestion: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

const SearchSuggestions = ({ searchTerm, onSuggestionClick, onClose, isVisible }: SearchSuggestionsProps) => {
  const [recentSearches] = useState([
    "Bricks & Blocks",
    "Cement",
    "Steel beams",  
    "Scaffolding",
    "Roof tiles"
  ]);

  const [trendingSearches] = useState([
    "Insulation materials",
    "Timber & Wood",
    "Wall & Ceiling Finishes",
    "Concrete blocks",
    "Roofing materials",
    "Site Support & Props",
    "Kitchen & Bathroom"
  ]);

  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    // Mock suggestions based on search term
    const mockSuggestions = [
      "Bricks red clay",
      "Bricks concrete blocks",
      "Cement Portland",
      "Concrete aggregates",
      "Steel beams I-beam",
      "Steel scaffolding poles",
      "Roof tiles clay",
      "Roofing materials felt",
      "Insulation foam boards",
      "Insulation fibreglass rolls",
      "Timber treated hardwood",
      "Timber scaffolding boards",
      "Doors internal external",
      "Windows double glazed",
      "Plumbing copper pipes",
      "Electrical cable conduit",
      "Flooring laminate tiles",
      "Kitchen units worktops",
      "Bathroom suites sanitaryware",
      "Fencing panels posts",
      "Paving slabs blocks",
      "Safety helmets workwear"
    ].filter(item =>
      item.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    setSuggestions(mockSuggestions);
  }, [searchTerm]);

  if (!isVisible) return null;

  return (
    <Card className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border-border shadow-lg max-h-96 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Search suggestions based on input */}
        {suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Suggestions</span>
            </div>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => {
                    onSuggestionClick(suggestion);
                    onClose();
                  }}
                >
                  <Search className="h-3 w-3 mr-2 text-muted-foreground" />
                  <span className="truncate">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Recent searches */}
        {!searchTerm.trim() && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Recent</span>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => {
                      onSuggestionClick(search);
                      onClose();
                    }}
                  >
                    <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                    <span className="truncate">{search}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Trending searches */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Trending</span>
              </div>
              <div className="space-y-1">
                {trendingSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => {
                      onSuggestionClick(search);
                      onClose();
                    }}
                  >
                    <TrendingUp className="h-3 w-3 mr-2 text-muted-foreground" />
                    <span className="truncate">{search}</span>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default SearchSuggestions;