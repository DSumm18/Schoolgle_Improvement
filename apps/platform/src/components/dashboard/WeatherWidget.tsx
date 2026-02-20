"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudSun, CloudRain, Sun, Snowflake, Wind, CloudDrizzle } from "lucide-react";

interface WeatherData {
    temp: number;
    condition: string;
    condition_code: number;
    humidity: number;
    wind_speed: number;
    location: string;
    feels_like: number;
}

interface WeatherWidgetProps {
    schoolName?: string;
    schoolLocation?: {
        lat?: number;
        lon?: number;
        town?: string;
    };
}

export function WeatherWidget({ schoolName, schoolLocation }: WeatherWidgetProps) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If no location data, try to derive from school name
        const deriveLocation = async () => {
            setLoading(true);
            try {
                // Use Open-Meteo API (free, no key required)
                // Default to London if no location specified
                const lat = schoolLocation?.lat ?? 51.5074;
                const lon = schoolLocation?.lon ?? -0.1278;
                const town = schoolLocation?.town || schoolName || "London";

                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto&forecast_daily=weather_code,temperature_2m_max,temperature_2m_min&daily=precipitation_probability`
                );

                if (response.ok) {
                    const data = await response.json();
                    const current = data.current;
                    const weatherCode = current.weather_code;

                    setWeather({
                        temp: Math.round(current.temperature_2m),
                        condition: getWeatherDescription(weatherCode),
                        condition_code: weatherCode,
                        humidity: current.relative_humidity_2m,
                        wind_speed: Math.round(current.wind_speed_10m),
                        location: town,
                        feels_like: Math.round(current.apparent_temperature),
                    });
                }
            } catch (error) {
                console.error("Failed to fetch weather:", error);
            } finally {
                setLoading(false);
            }
        };

        deriveLocation();
    }, [schoolName, schoolLocation]);

    const getWeatherIcon = (code: number) => {
        // WMO weather codes
        if (code === 0) return Sun;
        if (code >= 1 && code <= 3) return CloudSun;
        if (code >= 45 && code <= 48) return CloudDrizzle;
        if (code >= 51 && code <= 67) return CloudRain;
        if (code >= 71 && code <= 77) return Snowflake;
        if (code >= 80 && code <= 99) return CloudRain;
        if (code >= 95 && code <= 99) return Cloud;
        return CloudSun; // default
    };

    const getWeatherDescription = (code: number): string => {
        const descriptions: Record<number, string> = {
            0: "Clear",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Drizzle",
            51: "Light drizzle",
            53: "Moderate drizzle",
            55: "Heavy drizzle",
            61: "Slight rain",
            63: "Moderate rain",
            65: "Heavy rain",
            71: "Slight snow",
            73: "Moderate snow",
            75: "Heavy snow",
            80: "Showers",
            95: "Thunderstorm",
            99: "Heavy thunderstorm",
        };
        return descriptions[code] || "Cloudy";
    };

    if (loading || !weather) {
        // Show a loading state or placeholder
        return (
            <div
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
            >
                <CloudSun className="w-4 h-4 text-slate-400 animate-pulse" />
                <span className="font-semibold text-slate-400">Loading...</span>
            </div>
        );
    }

    const WeatherIcon = getWeatherIcon(weather.condition_code);

    return (
        <div
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
            title={`Weather in ${weather.location}`}
        >
            <WeatherIcon
                className={`w-4 h-4 ${
                    weather.condition_code === 0
                        ? "text-amber-500"
                        : weather.condition_code >= 1 && weather.condition_code <= 3
                        ? "text-blue-400"
                        : weather.condition_code >= 45 && weather.condition_code <= 67
                        ? "text-blue-600"
                        : weather.condition_code >= 71 && weather.condition_code <= 77
                        ? "text-blue-300"
                        : "text-slate-600"
                }`}
            />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
                {weather.temp}°C
            </span>
            <span className="text-slate-500 hidden sm:inline">| {weather.condition}</span>
        </div>
    );
}
