import React from 'react';
import { cn } from "../lib/utils";
import { MoveRight, Star } from "lucide-react";

const GridBlogSection = ({
  title,
  description,
  backgroundLabel,
  backgroundPosition = "left",
  posts = [],
  className,
  onPostClick,
}) => {
  return (
    <section className={cn("hp-grid-section", className)}>
      <div className="hp-grid-header">
        <h1 className="hp-grid-title">{title}</h1>
        {backgroundLabel && (
          <span className={cn(
            "hp-grid-bg-label",
            backgroundPosition === "left" ? "bg-left" : "bg-right"
          )}>
            {backgroundLabel}
          </span>
        )}
        <p className="hp-grid-description">{description}</p>
      </div>

      <div className="hp-grid-layout">
        {posts.map((post, index) => {
          const isPrimary = index === 0;
          return (
            <div
              key={post.id || index}
              style={{ backgroundImage: `url(${post.imageUrl})` }}
              className={cn(
                "hp-grid-post-card",
                isPrimary && "is-primary"
              )}
              onClick={() => onPostClick?.(post)}
            >
              <div className="hp-grid-post-overlay" />
              
              <article className="hp-grid-post-content">
                <div className="hp-grid-post-info">
                  <h2 className="hp-grid-post-title">{post.title}</h2>
                  <div className="hp-grid-post-details">
                    <span className="hp-grid-post-category">{post.category}</span>
                    <div className="hp-grid-post-stats">
                      <div className="hp-grid-post-rating">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            size={16}
                            fill={idx < (post.rating || 4) ? "#ffa534" : "rgba(185, 184, 184, 0.6)"}
                            stroke={idx < (post.rating || 4) ? "#ffa534" : "rgba(185, 184, 184, 0.6)"}
                          />
                        ))}
                      </div>
                      <span className="hp-grid-post-views">({post.views} Views)</span>
                    </div>
                    {post.readTime && (
                      <div className="hp-grid-post-readtime">
                        {post.readTime} min read
                      </div>
                    )}
                  </div>
                </div>
                <MoveRight className="hp-grid-post-arrow" size={32} />
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default GridBlogSection;
