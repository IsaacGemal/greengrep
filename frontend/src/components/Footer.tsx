// src/components/Footer.tsx
import { Link } from 'react-router-dom'

function Footer() {
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
        </footer>
    )
}

export default Footer
