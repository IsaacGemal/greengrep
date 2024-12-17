// src/components/Header.tsx
import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import SearchBar from './SearchBar'
import NsfwToggle from './NsfwToggle'

interface HeaderProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    handleSearch: () => void
    nsfwEnabled: boolean
    setNsfwEnabled: (val: boolean) => void
}

function Header({ searchQuery, setSearchQuery, handleSearch, nsfwEnabled, setNsfwEnabled }: HeaderProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    return (
        <>
            <header className="flex justify-between items-center p-4 border-b border-[#004d2f]">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#00ff00] rounded-full"></div>
                    <span className="text-xl font-bold">
                        GREEN<span className="text-[#7cfc00]">GREP</span>
                    </span>
                </Link>

                {/* Desktop Search */}
                <div className="hidden lg:flex flex-1 max-w-xl mx-4 items-center gap-4">
                    <SearchBar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        handleSearch={handleSearch}
                    />
                    <NsfwToggle nsfwEnabled={nsfwEnabled} setNsfwEnabled={setNsfwEnabled} />
                </div>

                {/* Mobile Search Button */}
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="lg:hidden text-[#00ff00] p-2"
                >
                    <Search className="w-6 h-6" />
                </button>
            </header>

            {/* Mobile Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-[#001f0f] bg-opacity-95 z-50 lg:hidden">
                    <div className="p-4 max-w-xl mx-auto">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setIsSearchOpen(false)}
                                className="text-[#00ff00]"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <SearchBar
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    handleSearch={() => {
                                        handleSearch()
                                        setIsSearchOpen(false)
                                    }}
                                />
                            </div>
                            <NsfwToggle nsfwEnabled={nsfwEnabled} setNsfwEnabled={setNsfwEnabled} />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Header