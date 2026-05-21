"use client";

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function MarkdownBlock({ content }: { content: string }) {
    if (!content) return null;

    // Split content to detect SVG blocks (either inside ```xml/html/svg code blocks or raw)
    const blockRegex = /(```(?:xml|html|svg)?\s*<svg[\s\S]*?<\/svg>\s*```|<svg[\s\S]*?<\/svg>)/gi;
    const parts = content.split(blockRegex);

    return (
        <div className="prose prose-sm max-w-none text-[13px] leading-[1.6] space-y-4">
            {parts.map((part, index) => {
                if (!part) return null;
                
                const isSvg = part.trim().toLowerCase().startsWith('<svg') || 
                              (part.trim().startsWith('```') && part.toLowerCase().includes('<svg'));

                if (isSvg) {
                    let svgText = part.trim();
                    if (svgText.startsWith('```')) {
                        svgText = svgText.replace(/^```(?:xml|html|svg)?\s*/i, '');
                        svgText = svgText.replace(/\s*```$/, '');
                    }
                    
                    return (
                        <div 
                            key={`svg-${index}`}
                            className="my-6 flex justify-center items-center overflow-x-auto bg-white p-4 rounded-xl border border-slate-100 shadow-sm"
                            dangerouslySetInnerHTML={{ __html: svgText }}
                        />
                    );
                } else {
                    return (
                        <ReactMarkdown 
                            key={`md-${index}`} 
                            remarkPlugins={[remarkMath]} 
                            rehypePlugins={[rehypeKatex]}
                        >
                            {part}
                        </ReactMarkdown>
                    );
                }
            })}
        </div>
    );
}

