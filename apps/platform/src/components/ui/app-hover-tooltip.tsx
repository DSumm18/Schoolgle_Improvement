"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, TrendingUp, Lightbulb, ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResearchData {
  title: string;
  description: string;
  source: string;
  year: number;
  url?: string;
}

interface AppHoverTooltipProps {
  appTitle: string;
  appDescription: string;
  howToUse: string[];
  researchData: ResearchData[];
  keyFeatures: string[];
  targetUsers: string[];
  benefits: string[];
  children: React.ReactNode;
  className?: string;
}

export function AppHoverTooltip({
  appTitle,
  appDescription,
  howToUse,
  researchData,
  keyFeatures,
  targetUsers,
  benefits,
  children,
  className
}: AppHoverTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setPosition({
        top: rect.bottom + scrollTop + 8,
        left: rect.left + scrollLeft
      });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div 
      ref={triggerRef}
      className={cn("relative", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 w-96 max-h-96 overflow-y-auto"
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          <Card className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {appTitle} - Quick Guide
                </CardTitle>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {appDescription}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Quick How-to */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Quick Start
                </h4>
                <ol className="space-y-1">
                  {howToUse.slice(0, 3).map((step, index) => (
                    <li key={index} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center justify-center mt-0.5">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                  {howToUse.length > 3 && (
                    <li className="text-xs text-slate-500 dark:text-slate-500 italic">
                      +{howToUse.length - 3} more steps...
                    </li>
                  )}
                </ol>
              </div>

              {/* Key Features */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Key Features
                </h4>
                <div className="flex flex-wrap gap-1">
                  {keyFeatures.slice(0, 4).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                      {feature}
                    </Badge>
                  ))}
                  {keyFeatures.length > 4 && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      +{keyFeatures.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Target Users */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  For
                </h4>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {targetUsers.slice(0, 2).join(", ")}
                  {targetUsers.length > 2 && ` +${targetUsers.length - 2} more`}
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Benefits
                </h4>
                <ul className="space-y-1">
                  {benefits.slice(0, 2).map((benefit, index) => (
                    <li key={index} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-green-500"></div>
                      {benefit}
                    </li>
                  ))}
                  {benefits.length > 2 && (
                    <li className="text-xs text-slate-500 dark:text-slate-500 italic">
                      +{benefits.length - 2} more benefits
                    </li>
                  )}
                </ul>
              </div>

              {/* Research Foundation */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Research
                </h4>
                <div className="space-y-2">
                  {researchData.slice(0, 2).map((research, index) => (
                    <div key={index} className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1">
                          <h5 className="text-xs font-medium text-slate-800 dark:text-slate-200 mb-1">
                            {research.title}
                          </h5>
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                            <span>{research.source}</span>
                            <span>•</span>
                            <span>{research.year}</span>
                          </div>
                        </div>
                        {research.url && (
                          <a
                            href={research.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {researchData.length > 2 && (
                    <div className="text-xs text-slate-500 dark:text-slate-500 italic text-center">
                      +{researchData.length - 2} more studies
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
