'use client';

import React from 'react';

/**
 * Component for adding Streamlit-like styling to the meeting summarizer
 * Based on the CSS styles from the provided reference code
 */
export function MeetingSummarizerStyles() {
  return (
    <style jsx global>{`
      /* Custom styles for the meeting summarizer feature */
      .meeting-summarizer .main {
        padding: 2rem;
      }
      
      .meeting-summarizer .result-container {
        background-color: #f8f9fa;
        padding: 1.5rem;
        border-radius: 10px;
        margin-bottom: 1rem;
      }
      
      .meeting-summarizer h1, 
      .meeting-summarizer h2, 
      .meeting-summarizer h3 {
        color: #2c3e50;
      }
      
      .meeting-summarizer .action-item {
        background-color: #e3f2fd;
        padding: 0.8rem;
        border-radius: 5px;
        margin: 0.5rem 0;
        border-left: 4px solid #1976d2;
      }
      
      /* Upload area styling */
      .meeting-summarizer .upload-area {
        border: 2px dashed #ccc;
        border-radius: 10px;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .meeting-summarizer .upload-area:hover {
        border-color: #4299e1;
        background-color: #ebf8ff;
      }
      
      /* Processing spinner */
      .meeting-summarizer .processing-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        margin-right: 8px;
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: #3498db;
        animation: spin 1s ease-in-out infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Success and error states */
      .meeting-summarizer .success-message {
        padding: 1rem;
        background-color: #d4edda;
        color: #155724;
        border-radius: 5px;
        margin-bottom: 1rem;
      }
      
      .meeting-summarizer .error-message {
        padding: 1rem;
        background-color: #f8d7da;
        color: #721c24;
        border-radius: 5px;
        margin-bottom: 1rem;
      }
      
      /* Summary and action items containers */
      .meeting-summarizer .summary-container,
      .meeting-summarizer .action-items-container {
        background-color: white;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }
      
      /* Download buttons */
      .meeting-summarizer .download-button {
        display: inline-flex;
        align-items: center;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        border-radius: 5px;
        background-color: #e6f7ff;
        color: #1890ff;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .meeting-summarizer .download-button:hover {
        background-color: #bae7ff;
      }
      
      .meeting-summarizer .download-button svg {
        margin-right: 0.5rem;
      }
    `}</style>
  );
}