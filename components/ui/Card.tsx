import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div className={`bg-white/[0.07] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-lg shadow-black/10 ${className}`}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }: CardProps) {
    return (
        <div className={`px-6 py-4 border-b border-white/10 ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '' }: CardProps) {
    return (
        <h3 className={`text-lg font-[var(--font-display)] font-bold text-white ${className}`}>
            {children}
        </h3>
    );
}

export function CardContent({ children, className = '' }: CardProps) {
    return (
        <div className={`p-6 ${className}`}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className = '' }: CardProps) {
    return (
        <div className={`px-6 py-4 bg-white/5 border-t border-white/10 ${className}`}>
            {children}
        </div>
    );
}
