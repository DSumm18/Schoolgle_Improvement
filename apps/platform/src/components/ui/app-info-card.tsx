"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, TrendingUp, Lightbulb, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResearchData {
  title: string;
  description: string;
  source: string;
  year: number;
  url?: string;
}

interface AppInfoCardProps {
  appTitle: string;
  appDescription: string;
  howToUse: string[];
  researchData: ResearchData[];
  keyFeatures: string[];
  targetUsers: string[];
  benefits: string[];
  className?: string;
}

export function AppInfoCard({
  appTitle,
  appDescription,
  howToUse,
  researchData,
  keyFeatures,
  targetUsers,
  benefits,
  className
}: AppInfoCardProps) {
  return (
    <Card className={cn("h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-700", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            About {appTitle}
          </CardTitle>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {appDescription}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* How to Use */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            How to Use
          </h4>
          <ol className="space-y-2">
            {howToUse.map((step, index) => (
              <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Key Features */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Key Features
          </h4>
          <div className="flex flex-wrap gap-1">
            {keyFeatures.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Target Users */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Who Should Use This
          </h4>
          <ul className="space-y-1">
            {targetUsers.map((user, index) => (
              <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                {user}
              </li>
            ))}
          </ul>
        </div>

        {/* Benefits */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Key Benefits
          </h4>
          <ul className="space-y-1">
            {benefits.map((benefit, index) => (
              <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Research Foundation */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Research Foundation
          </h4>
          <div className="space-y-3">
            {researchData.map((research, index) => (
              <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                      {research.title}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      {research.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
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
                      className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
