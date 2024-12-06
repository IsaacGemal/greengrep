import { useEffect, useRef } from 'react';

interface LoadingTriggerProps {
    onIntersect: () => void;
    enabled: boolean;
}

function LoadingTrigger({ onIntersect, enabled }: LoadingTriggerProps) {
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && enabled) {
                    onIntersect();
                }
            },
            {
                rootMargin: '300px', // Load more content before user reaches the bottom
                threshold: 0
            }
        );

        const currentTrigger = triggerRef.current;
        if (currentTrigger) {
            observer.observe(currentTrigger);
        }

        return () => {
            if (currentTrigger) {
                observer.unobserve(currentTrigger);
            }
        };
    }, [onIntersect, enabled]);

    return <div ref={triggerRef} className="h-1" />;
}

export default LoadingTrigger;