import React, { useState, useRef, useEffect } from "react";

interface ExpandableTextProps {
  text: string;
}

export default function ExpandableText({ text }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const visibleRef = useRef<HTMLParagraphElement>(null);
  const hiddenRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (visibleRef.current && hiddenRef.current) {
      const fullHeight = hiddenRef.current.offsetHeight;
      const visibleHeight = visibleRef.current.offsetHeight;
      setShowSeeMore(fullHeight > visibleHeight);
    }
  }, [text, isExpanded]);

  return (
    <div>
      <p
        ref={hiddenRef}
        className="invisible absolute top-0 left-0 pointer-events-none"
        style={{ whiteSpace: "normal" }}
      >
        {text}
      </p>
      <p
        ref={visibleRef}
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
