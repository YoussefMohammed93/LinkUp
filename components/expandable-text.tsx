import React, { useState, useRef, useEffect } from "react";

interface ExpandableTextProps {
  text: string;
}

export default function ExpandableText({ text }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current) {
      if (!isExpanded) {
        setShowSeeMore(
          textRef.current.scrollHeight > textRef.current.clientHeight
        );
      }
    }
  }, [text, isExpanded]);

  return (
    <div>
      <p
        ref={textRef}
        className={`text-foreground transition-all ${
          !isExpanded ? "line-clamp-2" : ""
        }`}
      >
        {text}
      </p>
      {!isExpanded && showSeeMore && (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-primary mt-1 text-sm"
        >
          <b>See more...</b>
        </button>
      )}
    </div>
  );
}
