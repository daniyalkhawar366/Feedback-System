import React from 'react';

/**
 * VISUAL PREVIEW: AI Consensus Tab
 * 
 * This is what your users will see when they click the "AI Consensus" tab
 * in the event analytics page.
 */

// ============================================================
// TAB NAVIGATION (at top of analytics page)
// ============================================================
// 
//  [Overview] [✨ AI Consensus] [Trends] [Keywords] [Quality] [Feedbacks]
//             ^^^^^^^^^^^^^^^^
//             NEW TAB HERE!
//

// ============================================================
// PURPLE GRADIENT HEADER
// ============================================================
// 
//  ╔══════════════════════════════════════════════════════════════╗
//  ║  ✨ AI Consensus Report                    [🔄 Regenerate]  ║
//  ║  Advanced LLM-powered analysis extracting themes,            ║
//  ║  consensus, and insights from feedback                       ║
//  ║  ──────────────────────────────────────────────────────────  ║
//  ║  🕐 Generated 2/1/2026, 9:42 PM  •  7 feedback  •  20.8s    ║
//  ╚══════════════════════════════════════════════════════════════╝
//

// ============================================================
// MAIN SUMMARY SECTION (white card)
// ============================================================
// 
//  ┌─────────────────────────────────────────────────────────────┐
//  │ 📝 Main Summary                                             │
//  ├─────────────────────────────────────────────────────────────┤
//  │                                                             │
//  │ The speaker delivery was well-received, with 86% of the    │
//  │ feedback indicating it was helpful. The overall polarity    │
//  │ of the feedback was +0.71, with a confidence level of       │
//  │ 0.80. The speakers approach was appreciated, with many      │
//  │ attendees enjoying the atmosphere of the event. Some        │
//  │ attendees suggested that the speaker could speak a bit      │
//  │ louder to improve the experience. The majority of the       │
//  │ feedback was positive...                                    │
//  │                                                             │
//  └─────────────────────────────────────────────────────────────┘
//

// ============================================================
// CONFLICTING STATEMENT (amber card - only if conflicts exist)
// ============================================================
// 
//  ┌─────────────────────────────────────────────────────────────┐
//  │ ⚠️  ⚠️ Conflicting Views                                    │
//  ├─────────────────────────────────────────────────────────────┤
//  │                                                             │
//  │ There was a split in opinions regarding the speaker        │
//  │ delivery, with some attendees indicating a stance-          │
//  │ sentiment mismatch, with a weight score of 0.86.           │
//  │                                                             │
//  └─────────────────────────────────────────────────────────────┘
//

// ============================================================
// TOP WEIGHTED POINTS (white card with blue highlights)
// ============================================================
// 
//  ┌─────────────────────────────────────────────────────────────┐
//  │ ⭐ Top Weighted Points                                      │
//  ├─────────────────────────────────────────────────────────────┤
//  │                                                             │
//  │  ┌─────────────────────────────────────────────────────┐   │
//  │  │ 1  Very nice atmosphere and I am happy with the     │   │
//  │  │    speakers approach. If he could speak a bit       │   │
//  │  │    louder then it would surely help.                │   │
//  │  └─────────────────────────────────────────────────────┘   │
//  │                                                             │
//  │  ┌─────────────────────────────────────────────────────┐   │
//  │  │ 2  Very nice event. Good work done by the speaker   │   │
//  │  └─────────────────────────────────────────────────────┘   │
//  │                                                             │
//  │  ┌─────────────────────────────────────────────────────┐   │
//  │  │ 3  Very nice event. Good work done by the speaker   │   │
//  │  └─────────────────────────────────────────────────────┘   │
//  │                                                             │
//  └─────────────────────────────────────────────────────────────┘
//

// ============================================================
// TWO COLUMN LAYOUT (Highlights and Concerns side by side)
// ============================================================
// 
//  ┌──────────────────────────┐  ┌──────────────────────────┐
//  │ ✅ What We Agree On      │  │ ❌ Where We Disagree     │
//  ├──────────────────────────┤  ├──────────────────────────┤
//  │                          │  │                          │
//  │ • Speaker Delivery —     │  │ • Speaker Delivery —     │
//  │   leaning HELPED (86%);  │  │   split (lead=HELPED     │
//  │   polarity +0.71,        │  │   86%) — reasons:        │
//  │   confidence 0.80        │  │   Stance–sentiment       │
//  │                          │  │   mismatch weight        │
//  │                          │  │   0.86 ≥ 0.10            │
//  │                          │  │                          │
//  └──────────────────────────┘  └──────────────────────────┘
//

// ============================================================
// NEXT STEPS (purple card - only if action items exist)
// ============================================================
// 
//  ┌─────────────────────────────────────────────────────────────┐
//  │ ➡️  🤔 What to Decide Next                                  │
//  ├─────────────────────────────────────────────────────────────┤
//  │                                                             │
//  │ • Venue Size — clarify before deciding (lead=NEUTRAL 50%;  │
//  │   needs stronger evidence)                                  │
//  │                                                             │
//  │ • Audio Equipment — requires discussion (conflicting       │
//  │   feedback on quality)                                      │
//  │                                                             │
//  └─────────────────────────────────────────────────────────────┘
//

// ============================================================
// REPORT METADATA (gray footer)
// ============================================================
// 
//  ┌─────────────────────────────────────────────────────────────┐
//  │ Category: FEEDBACK RETROSPECTIVE  •  Report ID: #42         │
//  │ Feedback Analyzed: 7  •  Processing Time: 20.82s           │
//  └─────────────────────────────────────────────────────────────┘
//

// ============================================================
// REPORT HISTORY (white card at bottom)
// ============================================================
// 
//  ┌─────────────────────────────────────────────────────────────┐
//  │ 📊 Report History (3)                                       │
//  ├─────────────────────────────────────────────────────────────┤
//  │                                                             │
//  │  #42  2/1/2026, 9:42:30 PM     7 feedback     20.8s       │
//  │  #41  2/1/2026, 3:15:12 PM     6 feedback     18.2s       │
//  │  #40  1/31/2026, 11:20:45 AM   5 feedback     15.5s       │
//  │                                                             │
//  └─────────────────────────────────────────────────────────────┘
//

// ============================================================
// COLOR SCHEME
// ============================================================
//
// Header:         Purple gradient (from-purple-500 to-pink-500)
// Summary:        White with gray border
// Conflicts:      Amber/Yellow (amber-50, amber-200 border)
// Top Points:     Blue highlights (blue-50 background)
// Highlights:     Green (green-50, green-200 border)
// Concerns:       Red (red-50, red-200 border)
// Next Steps:     Purple (purple-50, purple-200 border)
// Metadata:       Gray (gray-50)
// History:        White with gray border
//

// ============================================================
// ICONS USED
// ============================================================
//
// ✨ Sparkles       - Tab icon and header
// 🔄 RefreshCw      - Generate/Regenerate button
// 📝 Document       - Main Summary
// ⚠️  AlertTriangle - Conflicting Views
// ⭐ Star           - Top Weighted Points
// ✅ CheckCircle    - What We Agree On
// ❌ X              - Where We Disagree
// ➡️  ArrowRight    - What to Decide Next
// 🕐 Clock          - Generation timestamp
// 📊 BarChart       - Report History
//

// ============================================================
// LOADING STATE (during generation)
// ============================================================
//
//  ┌─────────────────────────────────────────────────────────────┐
//  │ 🔄 Generating Consensus Report...                           │
//  ├─────────────────────────────────────────────────────────────┤
//  │                                                             │
//  │ This may take 30-90 seconds. Our AI is analyzing feedback, │
//  │ extracting themes, detecting consensus patterns, and        │
//  │ generating insights.                                        │
//  │                                                             │
//  │ • Extracting dimensions (themes, sentiment, emotions)...   │
//  │ • Clustering similar themes...                             │
//  │ • Detecting consensus and dissent...                       │
//  │ • Generating summary...                                    │
//  │                                                             │
//  └─────────────────────────────────────────────────────────────┘
//

export default function VisualPreview() {
  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✨</span>
                <h2 className="text-2xl font-bold">AI Consensus Report</h2>
              </div>
              <p className="text-purple-100 mb-4">
                Advanced LLM-powered analysis extracting themes, consensus, and insights
              </p>
              <div className="flex items-center gap-4 text-sm text-purple-100">
                <div className="flex items-center gap-1">
                  <span>🕐</span>
                  <span>Generated 2/1/2026, 9:42:30 PM</span>
                </div>
                <div><span className="font-semibold">7</span> feedback analyzed</div>
                <div><span className="font-semibold">20.8s</span> processing time</div>
              </div>
            </div>
            <button className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold">
              🔄 Regenerate
            </button>
          </div>
        </div>

        {/* Main Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📝 Main Summary</h3>
          <p className="text-gray-700 leading-relaxed">
            The speaker delivery was well-received, with 86% of the feedback indicating it was helpful...
          </p>
        </div>

        {/* Top Points */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">⭐ Top Weighted Points</h3>
          <div className="space-y-3">
            <div className="flex gap-3 p-4 bg-blue-50 rounded-lg">
              <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
              <p className="text-gray-700">Very nice atmosphere and I am happy with the speakers approach...</p>
            </div>
          </div>
        </div>

        {/* Two Columns */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-green-900 mb-4">✅ What We Agree On</h3>
            <div className="text-sm text-green-800">
              • Speaker Delivery — leaning HELPED (86%)
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-red-900 mb-4">❌ Where We Disagree</h3>
            <div className="text-sm text-red-800">
              • Speaker Delivery — split opinions...
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
