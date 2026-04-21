import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export function Button({
    className = '',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    children,
    ...props
}: ButtonProps) {
    const baseStyle = 'inline-flex items-center justify-center rounded-xl font-[var(--font-display)] font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a1628] disabled:opacity-50 disabled:pointer-events-none transform active:scale-95 hover:scale-105 hover:-translate-y-0.5 cursor-pointer';

    const variants = {
        primary: 'bg-gradient-to-r from-sky to-aqua text-white shadow-lg shadow-sky/30 hover:shadow-sky/50 focus:ring-sky',
        secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 focus:ring-white/30 shadow-lg shadow-black/10',
        danger: 'bg-gradient-to-r from-red-500 to-coral text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 focus:ring-red-500',
        ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/10 focus:ring-white/20'
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg tracking-wide'
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
