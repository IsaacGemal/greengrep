// src/components/Header.tsx
import { Link } from 'react-router-dom'
import SearchBar from './SearchBar'
import NsfwToggle from './NsfwToggle.tsx'

interface HeaderProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    handleSearch: () => void
    nsfwEnabled: boolean
    setNsfwEnabled: (val: boolean) => void
}

function Header({ searchQuery, setSearchQuery, handleSearch, nsfwEnabled, setNsfwEnabled }: HeaderProps) {
    return (
        <header className="flex justify-between items-center p-4 border-b border-[#004d2f]">
            <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#00ff00] rounded-full"></div>
                <span className="text-xl font-bold">
                    GREEN<span className="text-[#7cfc00]">GREP</span>
                </span>
            </Link>

            <div className="flex-1 max-w-xl mx-4 flex items-center gap-4">
                <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleSearch={handleSearch}
                />
                <NsfwToggle nsfwEnabled={nsfwEnabled} setNsfwEnabled={setNsfwEnabled} />
            </div>
        </header>
    )
}

export default Header
