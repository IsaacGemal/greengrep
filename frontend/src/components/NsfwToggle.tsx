// src/components/NsfwToggle.tsx
interface NsfwToggleProps {
    nsfwEnabled: boolean
    setNsfwEnabled: (val: boolean) => void
}

function NsfwToggle({ nsfwEnabled, setNsfwEnabled }: NsfwToggleProps) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-[#008000]">NSFW</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={nsfwEnabled}
                    onChange={(e) => setNsfwEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-[#002f1f] peer-focus:outline-none rounded-full peer 
                    peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                    peer-checked:after:border-white after:content-[''] after:absolute 
                    after:top-[2px] after:start-[2px] after:bg-[#008000] after:border-[#008000] 
                    after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                    peer-checked:bg-[#004d2f]">
                </div>
            </label>
        </div>
    )
}

export default NsfwToggle
