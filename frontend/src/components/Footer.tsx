// src/components/Footer.tsx
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Footer() {
    const [totalPosts, setTotalPosts] = useState<number | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/stats`)
                const data = await response.json()
                setTotalPosts(data.totalImages)
            } catch (error) {
                console.error('Failed to fetch stats:', error)
            }
        }

        fetchStats()
    }, [])

    return (
        <footer className="p-4 flex justify-center items-center text-sm gap-2">
            <Link
                to="/about"
                className="text-[#008000] hover:text-[#00ff00] transition-colors duration-200"
            >
                About
            </Link>
            <span className="text-[#008000]">•</span>
            <a
                href="https://x.com/Aizkmusic"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#008000] hover:text-[#00ff00] transition-colors duration-200"
            >
                Made by @Aizkmusic
            </a>
            {totalPosts !== null && (
                <>
                    <span className="text-[#008000]">•</span>
                    <span className="text-[#008000]">
                        {totalPosts.toLocaleString()} posts
                    </span>
                </>
            )}
        </footer>
    )
}

export default Footer
