"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  Star,
  Sparkles,
  GraduationCap,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// 1. EVENT COUNTDOWN WIDGET
// Shows countdown to next school event with animated timer
// ═══════════════════════════════════════════════════════════════════════

interface CountdownProps {
  eventName: string;
  eventDate: string;
  eventTime?: string;
}

export function EventCountdown({ eventName, eventDate, eventTime }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const target = new Date(`${eventDate}${eventTime ? `T${eventTime}` : "T09:00"}`);

    const update = () => {
      const now = Date.now();
      const diff = target.getTime() - now;

      if (diff <= 0) {
        setIsPast(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [eventDate, eventTime]);

  if (isPast) return null;

  const blocks = [
    { value: timeLeft.days, label: "days" },
    { value: timeLeft.hours, label: "hrs" },
    { value: timeLeft.minutes, label: "min" },
    { value: timeLeft.seconds, label: "sec" },
  ];

  // Only show seconds if less than 1 day away
  const visibleBlocks = timeLeft.days > 0 ? blocks.slice(0, 3) : blocks;

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 opacity-80" />
        <span className="text-sm font-semibold opacity-80">Coming Up</span>
      </div>
      <h4 className="font-bold text-lg mb-4 leading-tight">{eventName}</h4>
      <div className="flex gap-2">
        {visibleBlocks.map(({ value, label }) => (
          <div key={label} className="flex-1 bg-white/20 rounded-xl p-2 text-center backdrop-blur-sm">
            <div className="text-2xl font-black tabular-nums">{value}</div>
            <div className="text-xs uppercase tracking-wider opacity-70">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 2. WEATHER WIDGET
// Fetches weather from a free API (Open-Meteo, no key needed)
// ═══════════════════════════════════════════════════════════════════════

interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

const WEATHER_ICONS: Record<string, typeof Sun> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  windy: Wind,
};

function mapWeatherCode(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: "Clear sky", icon: "sunny" };
  if (code <= 3) return { condition: "Partly cloudy", icon: "cloudy" };
  if (code <= 48) return { condition: "Foggy", icon: "cloudy" };
  if (code <= 57) return { condition: "Drizzle", icon: "rainy" };
  if (code <= 67) return { condition: "Rain", icon: "rainy" };
  if (code <= 77) return { condition: "Snow", icon: "snowy" };
  if (code <= 82) return { condition: "Rain showers", icon: "rainy" };
  if (code <= 86) return { condition: "Snow showers", icon: "snowy" };
  return { condition: "Stormy", icon: "rainy" };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    // Open-Meteo API — free, no key needed
    // Default to London coordinates; in production, use school's location
    const lat = 51.5074;
    const lon = -0.1278;

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Europe/London`
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.current) {
          const { condition, icon } = mapWeatherCode(d.current.weather_code);
          setWeather({
            temperature: Math.round(d.current.temperature_2m),
            condition,
            icon,
            humidity: d.current.relative_humidity_2m,
            windSpeed: Math.round(d.current.wind_speed_10m),
          });
        }
      })
      .catch(() => {});

    // Refresh every 30 minutes
    const interval = setInterval(() => {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Europe/London`
      )
        .then((r) => r.json())
        .then((d) => {
          if (d.current) {
            const { condition, icon } = mapWeatherCode(d.current.weather_code);
            setWeather({
              temperature: Math.round(d.current.temperature_2m),
              condition,
              icon,
              humidity: d.current.relative_humidity_2m,
              windSpeed: Math.round(d.current.wind_speed_10m),
            });
          }
        })
        .catch(() => {});
    }, 1800000);

    return () => clearInterval(interval);
  }, []);

  if (!weather) return null;

  const WeatherIcon = WEATHER_ICONS[weather.icon] || Cloud;

  return (
    <div className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-4xl font-bold">{weather.temperature}°C</div>
          <div className="text-sm opacity-80">{weather.condition}</div>
        </div>
        <WeatherIcon className="w-12 h-12 opacity-90" />
      </div>
      <div className="flex gap-4 mt-3 text-xs opacity-80">
        <span className="flex items-center gap-1">
          <Droplets className="w-3 h-3" />
          {weather.humidity}%
        </span>
        <span className="flex items-center gap-1">
          <Wind className="w-3 h-3" />
          {weather.windSpeed} km/h
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 3. CELEBRATION BANNER
// Animated celebration for achievements, birthdays, awards
// ═══════════════════════════════════════════════════════════════════════

interface CelebrationProps {
  title: string;
  subtitle?: string;
  type?: "star" | "graduation" | "sparkle";
}

export function CelebrationBanner({ title, subtitle, type = "star" }: CelebrationProps) {
  const icons = {
    star: Star,
    graduation: GraduationCap,
    sparkle: Sparkles,
  };
  const Icon = icons[type];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 rounded-2xl p-6 text-center">
      {/* Animated sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `sparkle ${1.5 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      <Icon className="w-10 h-10 text-yellow-800 mx-auto mb-2 relative z-10" />
      <h3 className="text-2xl font-black text-yellow-900 relative z-10">{title}</h3>
      {subtitle && (
        <p className="text-lg text-yellow-800 mt-1 relative z-10">{subtitle}</p>
      )}
      <style>{`
        @keyframes sparkle {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 4. SCHOOL DAY PROGRESS BAR
// Visual indicator of how far through the school day we are
// ═══════════════════════════════════════════════════════════════════════

interface DayProgressProps {
  startTime?: string; // '08:45'
  endTime?: string;   // '15:15'
  breakTimes?: { label: string; start: string; end: string }[];
}

export function SchoolDayProgress({
  startTime = "08:45",
  endTime = "15:15",
  breakTimes = [
    { label: "Break", start: "10:30", end: "10:45" },
    { label: "Lunch", start: "12:00", end: "13:00" },
  ],
}: DayProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentPeriod, setCurrentPeriod] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      const start = new Date(`${todayStr}T${startTime}`);
      const end = new Date(`${todayStr}T${endTime}`);
      const nowMs = now.getTime();

      if (nowMs < start.getTime()) {
        setProgress(0);
        setCurrentPeriod("Before school");
        return;
      }
      if (nowMs > end.getTime()) {
        setProgress(100);
        setCurrentPeriod("After school");
        return;
      }

      const total = end.getTime() - start.getTime();
      const elapsed = nowMs - start.getTime();
      setProgress(Math.round((elapsed / total) * 100));

      // Determine current period
      for (const bt of breakTimes) {
        const bStart = new Date(`${todayStr}T${bt.start}`);
        const bEnd = new Date(`${todayStr}T${bt.end}`);
        if (nowMs >= bStart.getTime() && nowMs <= bEnd.getTime()) {
          setCurrentPeriod(bt.label);
          return;
        }
      }
      setCurrentPeriod("Lesson time");
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [startTime, endTime, breakTimes]);

  return (
    <div className="bg-white rounded-2xl p-4 border shadow-sm">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-500">{startTime}</span>
        <span className="font-semibold text-gray-700">{currentPeriod}</span>
        <span className="text-gray-500">{endTime}</span>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
        {/* Break time markers */}
        {breakTimes.map((bt, i) => {
          const todayStr = new Date().toISOString().split("T")[0];
          const start = new Date(`${todayStr}T${startTime}`);
          const end = new Date(`${todayStr}T${endTime}`);
          const bStart = new Date(`${todayStr}T${bt.start}`);
          const total = end.getTime() - start.getTime();
          const pos = ((bStart.getTime() - start.getTime()) / total) * 100;
          return (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
              style={{ left: `${pos}%` }}
              title={bt.label}
            />
          );
        })}
      </div>
      <div className="text-xs text-center text-gray-400 mt-1">{progress}% of school day</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 5. SCREENSAVER MODE
// Beautiful ambient display when no content is active (after hours)
// ═══════════════════════════════════════════════════════════════════════

interface ScreensaverProps {
  schoolName: string;
  schoolMotto?: string;
  logoUrl?: string;
  primaryColor?: string;
}

export function Screensaver({ schoolName, schoolMotto, logoUrl, primaryColor = "#1e40af" }: ScreensaverProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9000] flex flex-col items-center justify-center text-white"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd, ${primaryColor}88)`,
      }}
    >
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              animation: `float ${10 + Math.random() * 20}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="w-24 h-24 object-contain mb-8 opacity-90"
        />
      )}

      {/* Time */}
      <div className="text-8xl font-extralight tracking-widest mb-2 tabular-nums">
        {time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </div>

      <div className="text-2xl opacity-60 mb-12">
        {time.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </div>

      <h1 className="text-4xl font-bold mb-3">{schoolName}</h1>
      {schoolMotto && (
        <p className="text-xl italic opacity-70">{schoolMotto}</p>
      )}

      <style>{`
        @keyframes float {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-10vh) translateX(${Math.random() > 0.5 ? "" : "-"}${Math.random() * 50}px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
