'use client';
import React from 'react';
import defaultHrLogo from '../images/hrportal_logo1.png';
import { getImageUrl } from '../utils/getImageUrl';
import '../css/CommonLoader.css';

export default function CommonLoader({
  fullScreen = true,
  text = 'Loading Recruiter Portal',
  size = 'default',
  logo = defaultHrLogo,
  backdropBlur = false,
  showProgress = true,
  showAmbient = true,
  style = {},
  className = '',
}) {
  const logoSrc = getImageUrl(logo || defaultHrLogo);

  // Responsive dynamic widths
  const logoWidth = size === 'small' ? 140 : size === 'large' ? 240 : 190;
  const barWidth = size === 'small' ? 120 : size === 'large' ? 190 : 150;

  // Clean trailing dots if passed in text (e.g., "Loading Candidate Data..." -> "Loading Candidate Data")
  const cleanText = text ? text.replace(/\.+$/, '') : '';

  const wrapperInlineStyle = {
    position: fullScreen ? 'fixed' : 'relative',
    top: 0,
    left: 0,
    width: fullScreen ? '100vw' : '100%',
    height: fullScreen ? '100vh' : 'auto',
    minHeight: fullScreen ? '100vh' : '220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: fullScreen ? 999999 : 10,
    background: fullScreen
      ? backdropBlur
        ? 'rgba(255, 255, 255, 0.92)'
        : '#ffffff'
      : 'transparent',
    boxSizing: 'border-box',
    ...style,
  };

  return (
    <div
      className={`common-loader-wrapper ${fullScreen ? 'fullscreen' : 'inline'} ${
        backdropBlur ? 'backdrop-blur' : ''
      } ${className}`}
      style={wrapperInlineStyle}
    >
      {/* Aurora Ambient Lighting Effect */}
      {fullScreen && showAmbient && (
        <div className="cf-loader-ambient" aria-hidden="true">
          <div className="cf-loader-glow-1" />
          <div className="cf-loader-glow-2" />
        </div>
      )}

      <div className="common-loader-content">
        {/* HR Brand Logo */}
        <div className="cf-logo-box">
          <img
            src={logoSrc}
            alt="CareerFast Recruiter Portal"
            className="brand-logo-img"
            style={{ width: `${logoWidth}px` }}
          />
        </div>

        {/* Sleek Minimal Progress Line */}
        {showProgress && (
          <div className="cf-progress-track" style={{ width: `${barWidth}px` }}>
            <div className="cf-progress-indicator" />
          </div>
        )}

        {/* Subtle Text with Bouncing Brand Dots */}
        {cleanText && (
          <p className="loading-caption">
            <span>{cleanText}</span>
            <span className="loading-dots">
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
