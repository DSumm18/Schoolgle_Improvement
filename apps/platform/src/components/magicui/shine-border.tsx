"use client";

import { cn } from "@/lib/utils";

type TColorProp = string | string[];

interface ShineBorderProps {
    borderRadius?: number;
    borderWidth?: number;
    duration?: number;
    color?: TColorProp;
    className?: string;
    children: React.ReactNode;
}

/**
 * @name Shine Border
 * @description It is an animated background border effect that adds a shiny, focused edge to any component.
 */
export default function ShineBorder({
    borderRadius = 8,
    borderWidth = 1,
    duration = 14,
    color = "#000000",
    className,
    children,
}: ShineBorderProps) {
    return (
        <div
            style={
                {
                    "--border-radius": `${borderRadius}px`,
                } as React.CSSProperties
            }
            className={cn(
                "relative min-h-[60px] w-fit min-w-[300px] place-items-center rounded-[--border-radius] bg-white text-black dark:bg-black dark:text-white",
                className,
            )}
        >
            <div
                style={
                    {
                        "--border-width": `${borderWidth}px`,
                        "--duration": `${duration}s`,
                        "--mask-linear-gradient": `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                        "--background-radial-gradient": `radial-gradient(transparent,transparent, ${Array.isArray(color) ? color.join(",") : color
                            },transparent,transparent)`,
                    } as React.CSSProperties
                }
                className={`before:absolute before:inset-0 before:size-full before:rounded-[--border-radius] before:p-[--border-width] before:will-change-[background-position] before:content-[""] before:![-webkit-mask-composite:xor] before:![mask-composite:exclude] before:[mask:--mask-linear-gradient] motion-safe:before:animate-shine`}
                className={cn(
                    "before:absolute before:inset-0 before:size-full before:rounded-[--border-radius] before:p-[--border-width] before:will-change-[background-position] before:content-[''] before:![-webkit-mask-composite:xor] before:![mask-composite:exclude] before:[mask:--mask-linear-gradient] motion-safe:before:animate-[shine_var(--duration)_linear_infinite]",
                    "before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]"
                )}
                style={{
                    backgroundImage: `radial-gradient(circle at center, ${Array.isArray(color) ? color.join(",") : color}, transparent)`
                } as any}
            ></div>
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
}
