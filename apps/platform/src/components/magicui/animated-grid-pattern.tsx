"use client";

import { useEffect, useId, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface AnimatedGridPatternProps {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    strokeDasharray?: any;
    numSquares?: number;
    className?: string;
    maxOpacity?: number;
    duration?: number;
    repeatDelay?: number;
}

export default function AnimatedGridPattern({
    width = 40,
    height = 40,
    x = -1,
    y = -1,
    strokeDasharray = 0,
    numSquares = 50,
    className,
    maxOpacity = 0.5,
    duration = 4,
    repeatDelay = 0.5,
    ...props
}: AnimatedGridPatternProps) {
    const id = useId();
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [squares, setSquares] = useState<{ id: number; x: number; y: number }[]>(
        [],
    );

    const getPos = useCallback(() => {
        return [
            Math.floor((Math.random() * dimensions.width) / width),
            Math.floor((Math.random() * dimensions.height) / height),
        ];
    }, [dimensions, width, height]);

    // Function to generate a single square
    const generateSquare = useCallback((count: number) => {
        const [x, y] = getPos();
        return {
            id: count,
            x,
            y,
        };
    }, [getPos]);

    const updateSquarePercentage = useCallback(() => {
        if (dimensions.width === 0 || dimensions.height === 0) return;

        setSquares((currentSquares) => {
            if (currentSquares.length < numSquares) {
                const newSquare = generateSquare(currentSquares.length);
                return [...currentSquares, newSquare];
            }

            // Replace a random square
            const indexToReplace = Math.floor(Math.random() * currentSquares.length);
            const newSquare = generateSquare(currentSquares[indexToReplace].id);
            const updatedSquares = [...currentSquares];
            updatedSquares[indexToReplace] = newSquare;
            return updatedSquares;
        });
    }, [dimensions, numSquares, generateSquare]);

    // Resize observer to update container dimensions
    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, [containerRef]);

    // Update squares periodically
    useEffect(() => {
        if (dimensions.width === 0 || dimensions.height === 0) return;

        const interval = setInterval(updateSquarePercentage, 1000);

        return () => clearInterval(interval);
    }, [dimensions, updateSquarePercentage]);

    return (
        <svg
            ref={containerRef}
            aria-hidden="true"
            className={cn(
                "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30",
                className,
            )}
            {...props}
        >
            <defs>
                <pattern
                    id={id}
                    width={width}
                    height={height}
                    patternUnits="userSpaceOnUse"
                    x={x}
                    y={y}
                >
                    <path
                        d={`M.5 ${height}V.5H${width}`}
                        fill="none"
                        strokeDasharray={strokeDasharray}
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${id})`} />
            <svg x={x} y={y} className="overflow-visible">
                {squares.map(({ x, y, id }, index) => (
                    <motion.rect
                        initial={{ opacity: 0 }}
                        animate={{ opacity: maxOpacity }}
                        transition={{
                            duration,
                            repeat: Infinity,
                            repeatType: "reverse",
                            delay: index * 0.1,
                            repeatDelay,
                        }}
                        key={`${x}-${y}-${id}`}
                        width={width - 1}
                        height={height - 1}
                        x={x * width + 1}
                        y={y * height + 1}
                        fill="currentColor"
                        strokeWidth="0"
                    />
                ))}
            </svg>
        </svg>
    );
}
