"use client";

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function MarkdownBlock({ content }: { content: string }) {
    return (
        <div className="prose prose-sm max-w-none text-[13px] leading-[1.6]">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
