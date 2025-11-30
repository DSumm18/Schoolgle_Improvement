"use client";

import React from 'react';
import { Play } from 'lucide-react';

interface Testimonial {
    heading: string;
    quote: string;
    author: string;
    role: string;
    image: string;
}

const testimonials: Testimonial[] = [
    {
        heading: "SEF, PP and Sports Premium now take hours, not weeks.",
        quote: "Schoolgle has completely changed how we prepare for inspection. Everything is structured, evidenced and ready – and staff are far less stressed.",
        author: "Headteacher",
        role: "Primary Academy, West Yorkshire",
        image: "https://images.unsplash.com/photo-1544717305-2782549b5136?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    },
    {
        heading: "I finally feel in control of our systems, not the other way round.",
        quote: "New staff used to take months to get confident in our MIS and HR systems. With Ed on screen, they're flying in a couple of days.",
        author: "School Business Manager",
        role: "Multi-Academy Trust",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    }
];

const Testimonials = () => {
    return (
        <section className="py-24 bg-gray-50">
            <div className="container mx-auto max-w-7xl px-4 md:px-8">
                <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-16">Stories from our community</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="group relative aspect-video rounded-3xl overflow-hidden bg-gray-200 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-500">
                            <img
                                src={testimonial.image}
                                alt={testimonial.author}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[0.7]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
                                <div className="mb-auto self-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform mb-8">
                                    <Play fill="currentColor" />
                                </div>

                                <h3 className="text-2xl md:text-3xl font-medium text-white mb-6 leading-tight">
                                    "{testimonial.heading}"
                                </h3>

                                <div className="space-y-4 border-l-2 border-white/30 pl-6">
                                    <p className="text-lg text-white/90 italic leading-relaxed">"{testimonial.quote}"</p>
                                    <div>
                                        <div className="font-bold text-white text-lg">{testimonial.author}</div>
                                        <div className="text-white/70">{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;

