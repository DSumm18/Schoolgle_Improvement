"use client";

import React, { useState } from "react";
import { CheckSquare, Square, ChevronDown, ChevronRight, BookOpen } from "lucide-react";

// Static NC objectives for client-side matching (subset — full set loaded from DB in production)
const NC_OBJECTIVES: Record<string, Record<string, { code: string; text: string; strand: string }[]>> = {
  Science: {
    "Year 1": [
      { code: "Y1.SC.P.1", text: "Identify and name a variety of common wild and garden plants, including deciduous and evergreen trees", strand: "Plants" },
      { code: "Y1.SC.P.2", text: "Identify and describe the basic structure of a variety of common flowering plants, including trees", strand: "Plants" },
      { code: "Y1.SC.AH.1", text: "Identify and name a variety of common animals including fish, amphibians, reptiles, birds and mammals", strand: "Animals including humans" },
      { code: "Y1.SC.AH.4", text: "Identify, name, draw and label the basic parts of the human body and say which part of the body is associated with each sense", strand: "Animals including humans" },
      { code: "Y1.SC.EM.1", text: "Distinguish between an object and the material from which it is made", strand: "Everyday materials" },
      { code: "Y1.SC.EM.2", text: "Identify and name a variety of everyday materials, including wood, plastic, glass, metal, water, and rock", strand: "Everyday materials" },
      { code: "Y1.SC.SC.1", text: "Observe changes across the four seasons", strand: "Seasonal changes" },
    ],
    "Year 2": [
      { code: "Y2.SC.LH.1", text: "Explore and compare the differences between things that are living, dead, and things that have never been alive", strand: "Living things and their habitats" },
      { code: "Y2.SC.LH.2", text: "Identify that most living things live in habitats to which they are suited", strand: "Living things and their habitats" },
      { code: "Y2.SC.P.1", text: "Observe and describe how seeds and bulbs grow into mature plants", strand: "Plants" },
      { code: "Y2.SC.AH.1", text: "Notice that animals, including humans, have offspring which grow into adults", strand: "Animals including humans" },
    ],
    "Year 3": [
      { code: "Y3.SC.P.1", text: "Identify and describe the functions of different parts of flowering plants: roots, stem/trunk, leaves and flowers", strand: "Plants" },
      { code: "Y3.SC.R.1", text: "Identify that animals, including humans, need the right types and amount of nutrition", strand: "Rocks" },
      { code: "Y3.SC.L.1", text: "Recognise that they need light in order to see things and that dark is the absence of light", strand: "Light" },
    ],
    "Year 4": [
      { code: "Y4.SC.LH.1", text: "Recognise that living things can be grouped in a variety of ways", strand: "Living things and their habitats" },
      { code: "Y4.SC.AH.1", text: "Describe the simple functions of the basic parts of the digestive system in humans", strand: "Animals including humans" },
      { code: "Y4.SC.S.1", text: "Identify common appliances that run on electricity", strand: "Electricity" },
    ],
    "Year 5": [
      { code: "Y5.SC.LH.1", text: "Describe the differences in the life cycles of a mammal, an amphibian, an insect and a bird", strand: "Living things and their habitats" },
      { code: "Y5.SC.P.1", text: "Describe the movement of the Earth, and other planets, relative to the Sun in the solar system", strand: "Earth and space" },
      { code: "Y5.SC.F.1", text: "Explain that unsupported objects fall towards the Earth because of the force of gravity acting between the Earth and the falling object", strand: "Forces" },
    ],
    "Year 6": [
      { code: "Y6.SC.LH.1", text: "Describe how living things are classified into broad groups according to common observable characteristics", strand: "Living things and their habitats" },
      { code: "Y6.SC.AH.1", text: "Identify and name the main parts of the human circulatory system", strand: "Animals including humans" },
      { code: "Y6.SC.E.1", text: "Associate the brightness of a lamp or the volume of a buzzer with the number and voltage of cells used in the circuit", strand: "Electricity" },
    ],
  },
  Maths: {
    "Year 1": [
      { code: "Y1.MA.N.1", text: "Count to and across 100, forwards and backwards, beginning with 0 or 1, or from any given number", strand: "Number and place value" },
      { code: "Y1.MA.N.2", text: "Count, read and write numbers to 100 in numerals; count in multiples of twos, fives and tens", strand: "Number and place value" },
      { code: "Y1.MA.AS.1", text: "Read, write and interpret mathematical statements involving addition (+), subtraction (−) and equals (=) signs", strand: "Addition and subtraction" },
      { code: "Y1.MA.G.1", text: "Recognise and name common 2-D and 3-D shapes", strand: "Geometry" },
    ],
    "Year 2": [
      { code: "Y2.MA.N.1", text: "Count in steps of 2, 3, and 5 from 0, and in tens from any number, forward and backward", strand: "Number and place value" },
      { code: "Y2.MA.MD.1", text: "Recall and use multiplication and division facts for the 2, 5 and 10 multiplication tables", strand: "Multiplication and division" },
      { code: "Y2.MA.F.1", text: "Recognise, find, name and write fractions ⅓, ¼, 2⁄4 and ¾ of a length, shape, set of objects or quantity", strand: "Fractions" },
    ],
    "Year 3": [
      { code: "Y3.MA.N.1", text: "Count from 0 in multiples of 4, 8, 50 and 100; find 10 or 100 more or less than a given number", strand: "Number and place value" },
      { code: "Y3.MA.F.1", text: "Count up and down in tenths; recognise that tenths arise from dividing an object into 10 equal parts", strand: "Fractions" },
    ],
    "Year 4": [
      { code: "Y4.MA.N.1", text: "Count in multiples of 6, 7, 9, 25 and 1000", strand: "Number and place value" },
      { code: "Y4.MA.F.1", text: "Recognise and show, using diagrams, families of common equivalent fractions", strand: "Fractions" },
    ],
    "Year 5": [
      { code: "Y5.MA.N.1", text: "Read, write, order and compare numbers to at least 1 000 000 and determine the value of each digit", strand: "Number and place value" },
      { code: "Y5.MA.F.1", text: "Compare and order fractions whose denominators are all multiples of the same number", strand: "Fractions" },
    ],
    "Year 6": [
      { code: "Y6.MA.N.1", text: "Read, write, order and compare numbers up to 10 000 000 and determine the value of each digit", strand: "Number and place value" },
      { code: "Y6.MA.R.1", text: "Solve problems involving the relative sizes of two quantities where missing values can be found by using integer multiplication and division facts", strand: "Ratio and proportion" },
      { code: "Y6.MA.A.1", text: "Use simple formulae", strand: "Algebra" },
    ],
  },
  English: {
    "Year 1": [
      { code: "Y1.EN.R.1", text: "Apply phonic knowledge and skills as the route to decode words", strand: "Reading - word reading" },
      { code: "Y1.EN.W.1", text: "Write sentences by saying out loud what they are going to write about", strand: "Writing - composition" },
    ],
    "Year 2": [
      { code: "Y2.EN.R.1", text: "Continue to apply phonic knowledge and skills as the route to decode words until automatic decoding has become embedded", strand: "Reading - word reading" },
      { code: "Y2.EN.W.1", text: "Develop positive attitudes towards and stamina for writing", strand: "Writing - composition" },
    ],
    "Year 3": [
      { code: "Y3.EN.R.1", text: "Apply their growing knowledge of root words, prefixes and suffixes", strand: "Reading - word reading" },
      { code: "Y3.EN.W.1", text: "Plan their writing by discussing writing similar to that which they are planning to write", strand: "Writing - composition" },
    ],
    "Year 4": [
      { code: "Y4.EN.R.1", text: "Apply their growing knowledge of root words, prefixes and suffixes to read aloud and to understand the meaning of new words", strand: "Reading - word reading" },
    ],
    "Year 5": [
      { code: "Y5.EN.R.1", text: "Apply their growing knowledge of root words, prefixes and suffixes, both to read aloud and to understand the meaning of new words they meet", strand: "Reading - word reading" },
    ],
    "Year 6": [
      { code: "Y6.EN.R.1", text: "Apply their growing knowledge of root words, prefixes and suffixes to read aloud and to understand the meaning of new words that they meet", strand: "Reading - word reading" },
    ],
  },
};

export interface CurriculumCheckpointPanelProps {
  subject: string;
  yearGroup: string;
  checkedCodes: string[];
  onToggle: (code: string) => void;
  matchedCodes?: string[];
}

export function CurriculumCheckpointPanel({
  subject,
  yearGroup,
  checkedCodes,
  onToggle,
  matchedCodes,
}: CurriculumCheckpointPanelProps) {
  const [expandedStrands, setExpandedStrands] = useState<Set<string>>(new Set());

  const objectives = NC_OBJECTIVES[subject]?.[yearGroup] ?? [];

  // Group by strand
  const strands = objectives.reduce<Record<string, typeof objectives>>((acc, obj) => {
    if (!acc[obj.strand]) acc[obj.strand] = [];
    acc[obj.strand].push(obj);
    return acc;
  }, {});

  const toggleStrand = (strand: string) => {
    setExpandedStrands((prev) => {
      const next = new Set(prev);
      if (next.has(strand)) next.delete(strand);
      else next.add(strand);
      return next;
    });
  };

  if (objectives.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-pink-500" />
          <h3 className="font-semibold text-slate-800 dark:text-white">Curriculum Checkpoints</h3>
        </div>
        <p className="text-sm text-slate-400">
          {!subject || !yearGroup
            ? "Select a subject and year group to see NC objectives."
            : `No objectives loaded for ${subject} — ${yearGroup}. Objectives will be available once the curriculum seed data is applied.`}
        </p>
      </div>
    );
  }

  const checkedCount = objectives.filter((o) => checkedCodes.includes(o.code)).length;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-pink-500" />
          <h3 className="font-semibold text-slate-800 dark:text-white">Curriculum Checkpoints</h3>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">
          {checkedCount}/{objectives.length} covered
        </span>
      </div>

      {/* Strands */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        {Object.entries(strands).map(([strand, objs]) => {
          const expanded = expandedStrands.has(strand);
          const strandChecked = objs.filter((o) => checkedCodes.includes(o.code)).length;

          return (
            <div key={strand}>
              <button
                onClick={() => toggleStrand(strand)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {expanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {strand}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {strandChecked}/{objs.length}
                </span>
              </button>

              {expanded && (
                <div className="px-4 pb-3 space-y-1">
                  {objs.map((obj) => {
                    const checked = checkedCodes.includes(obj.code);
                    const isMatched = matchedCodes?.includes(obj.code);

                    return (
                      <button
                        key={obj.code}
                        onClick={() => onToggle(obj.code)}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-lg transition-colors text-left ${
                          isMatched
                            ? "bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-800"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700/20"
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 mt-0.5 text-pink-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 mt-0.5 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {obj.code}
                          </span>
                          <span className={`text-xs leading-relaxed ${checked ? "text-slate-800 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                            {obj.text}
                          </span>
                          {isMatched && (
                            <span className="inline-block mt-1 text-[10px] font-medium text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30 px-1.5 py-0.5 rounded">
                              AI matched
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
