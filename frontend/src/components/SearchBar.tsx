// src/components/SearchBar.tsx
import { Search } from 'lucide-react'

interface SearchBarProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    handleSearch: () => void
}

function SearchBar({ searchQuery, setSearchQuery, handleSearch }: SearchBarProps) {
    return (
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#008000]" />
            <input
                type="text"
                value={searchQuery}
                placeholder="search for greentexts..."
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-[#002f1f] border border-[#004d2f] text-[#00ff00] placeholder-[#008000] pl-10 pr-4 py-2 text-md rounded-md focus:outline-none focus:ring-2 focus:ring-[#00ff00] focus:border-transparent"
            />
        </div>
    )
}

export default SearchBar