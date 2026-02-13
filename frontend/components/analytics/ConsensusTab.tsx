'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, TrendingUp, TrendingDown, ThumbsUp, ThumbsDown, Download, MessageCircle, BarChart3, AlertCircle, CheckCircle2, Users, Star, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import api from '@/utils/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { ConsensusReport, ConsensusReportHistory, EventFeedbackRead, EventRead } from '@/types/api';

interface ConsensusTabProps {
  eventId: string;
  event: EventRead | null;
}

export default function ConsensusTab({ eventId, event }: ConsensusTabProps) {
  const [report, setReport] = useState<ConsensusReport | null>(null);
  const [feedbacks, setFeedbacks] = useState<EventFeedbackRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both report and feedbacks
      const [reportRes, feedbackRes] = await Promise.all([
        api.get<ConsensusReport>(`/api/reports/events/${eventId}/latest`).catch(err => {
          if (err.response?.status === 404) {
            throw new Error('no-report');
          }
          throw err;
        }),
        api.get<EventFeedbackRead[]>(`/events/${eventId}/feedback`)
      ]);
      
      setReport(reportRes.data);
      setFeedbacks(feedbackRes.data);
    } catch (err: any) {
      if (err.message === 'no-report') {
        setError('no-report');
      } else {
        setError('Failed to load report');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setError(null);
      const response = await api.post<ConsensusReport>(`/api/reports/events/${eventId}/generate`);
      console.log('📊 Report API Response:', response.data);
      console.log('📊 highlights:', response.data.highlights);
      console.log('📊 concerns:', response.data.concerns);
      setReport(response.data);
      
      // Refresh feedbacks in case they changed
      const feedbackRes = await api.get<EventFeedbackRead[]>(`/events/${eventId}/feedback`);
      setFeedbacks(feedbackRes.data);
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || 'Failed to generate report. Please try again.';
      
      // User-friendly rate limit message
      if (err.response?.status === 429 || errorDetail.includes('rate limit')) {
        setError('⏱️ API rate limit reached. Please wait 10-15 seconds and try again.');
      } else {
        setError(errorDetail);
      }
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current || !report) {
      alert('Report content not found. Please try again.');
      return;
    }
    
    try {
      setDownloadingPDF(true);
      
      // Create a completely separate DOM structure with ZERO Tailwind/modern CSS
      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = 'position: absolute; left: -9999px; width: 800px; background: white; padding: 40px; font-family: Arial, sans-serif;';
      document.body.appendChild(pdfContainer);
      
      // Build PDF content with pure inline styles
      pdfContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #9333ea;">
          <h1 style="font-size: 32px; color: #111827; margin: 0 0 10px 0;">📊 Feedback Analysis Report</h1>
          <p style="font-size: 18px; color: #6b7280; margin: 0;">${report.event_title || 'Event Feedback'}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px;">
          <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #166534; margin-bottom: 5px;">${report?.highlights?.length || 0}</div>
            <div style="font-size: 12px; color: #166534; font-weight: bold;">STRENGTHS</div>
          </div>
          <div style="background: #fff7ed; border: 2px solid #fdba74; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #9a3412; margin-bottom: 5px;">${report?.concerns?.length || 0}</div>
            <div style="font-size: 12px; color: #9a3412; font-weight: bold;">TO IMPROVE</div>
          </div>
          <div style="background: #eff6ff; border: 2px solid #93c5fd; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #1e40af; margin-bottom: 5px;">${feedbacks.length}</div>
            <div style="font-size: 12px; color: #1e40af; font-weight: bold;">RESPONSES</div>
          </div>
          <div style="background: #faf5ff; border: 2px solid #c084fc; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #7e22ce; margin-bottom: 5px;">${Math.round(report?.analytics?.satisfaction_score || 0)}%</div>
            <div style="font-size: 12px; color: #7e22ce; font-weight: bold;">SATISFACTION</div>
          </div>
        </div>
        
        <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
          <h3 style="font-size: 24px; color: #1e40af; margin: 0 0 15px 0;">📊 Overall Summary</h3>
          <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0;">${report?.summary?.main_summary || 'No summary available'}</p>
        </div>
        
        ${report?.highlights && report.highlights.length > 0 ? `
          <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <h3 style="font-size: 24px; color: #166534; margin: 0 0 20px 0; padding-bottom: 15px; border-bottom: 2px solid #86efac;">✨ What Went Great</h3>
            ${report.highlights.map((item, i) => `
              <div style="background: white; border-left: 4px solid #22c55e; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
                <div style="font-weight: bold; color: #166534; margin-bottom: 5px;">${i + 1}. Strength</div>
                <p style="font-size: 15px; color: #374151; margin: 0; line-height: 1.5;">${item}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${report?.concerns && report.concerns.length > 0 ? `
          <div style="background: #fff7ed; border: 2px solid #f97316; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <h3 style="font-size: 24px; color: #9a3412; margin: 0 0 20px 0; padding-bottom: 15px; border-bottom: 2px solid #fdba74;">🎯 Action Items for Improvement</h3>
            ${report.concerns.map((item, i) => {
              const parts = item.split('→').map(s => s.trim());
              const issue = parts[0] || item;
              const suggestion = parts[1];
              return `
                <div style="background: white; border-left: 4px solid #f97316; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                  <div style="font-weight: bold; color: #9a3412; margin-bottom: 8px;">${i + 1}. ${issue}</div>
                  ${suggestion ? `
                    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 12px; margin-top: 8px;">
                      <div style="font-size: 12px; font-weight: bold; color: #166534; margin-bottom: 5px;">✅ ACTION TO TAKE:</div>
                      <p style="font-size: 14px; color: #374151; margin: 0; line-height: 1.5;">${suggestion}</p>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
        
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin-top: 30px;">
          <div style="font-size: 14px; color: #6b7280;">
            📅 ${report.generated_at ? new Date(report.generated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Just now'} 
            &nbsp;&nbsp;|&nbsp;&nbsp; 
            ⏱️ Generated in ${typeof report.generation_time === 'number' ? report.generation_time.toFixed(1) : report.generation_time}s 
            &nbsp;&nbsp;|&nbsp;&nbsp; 
            💬 ${report.feedback_count} responses
          </div>
        </div>
      `;
      
      // Capture the simple HTML
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      // Cleanup
      document.body.removeChild(pdfContainer);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate how many pages we need
      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;
      let heightLeft = scaledHeight;
      let position = 0;
      
      // Add the first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;
      
      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`consensus-report-event-${eventId}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert(`Failed to download PDF: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Parse sentiment data for charts from actual feedback
  const getSentimentData = () => {
    if (!feedbacks || feedbacks.length === 0) return null;
    
    // Count actual sentiment from feedback
    const sentimentCounts = feedbacks.reduce((acc, fb) => {
      const sentiment = fb.sentiment || 'Neutral';
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const data = [];
    if (sentimentCounts.Positive) {
      data.push({ name: 'Positive', value: sentimentCounts.Positive, color: '#10b981' });
    }
    if (sentimentCounts.Negative) {
      data.push({ name: 'Negative', value: sentimentCounts.Negative, color: '#ef4444' });
    }
    if (sentimentCounts.Neutral) {
      data.push({ name: 'Neutral', value: sentimentCounts.Neutral, color: '#f59e0b' });
    }
    
    return data.length > 0 ? data : null;
  };

  // Get meaningful reviews (longer than 20 characters)
  const getMeaningfulReviews = () => {
    if (!report || !report.summary || !report.summary.top_weighted_points) return [];
    return report.summary.top_weighted_points
      .filter(point => point.length > 20)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your insights...</p>
        </div>
      </div>
    );
  }

  if (error === 'no-report') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-12 border-2 border-purple-200">
          <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No AI Report Yet</h3>
          <p className="text-gray-600 mb-6">
            Generate your first AI-powered consensus report to get deep insights from your feedback.
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing Feedback...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate AI Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const sentimentData = getSentimentData();
  const meaningfulReviews = getMeaningfulReviews();

  return (
    <div className="space-y-6">
      {/* Header with Download */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8" />
              <h2 className="text-3xl font-bold">AI-Powered Insights</h2>
            </div>
            <p className="text-purple-100 text-lg">
              Smart analysis of {feedbacks.length} feedback responses
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Loader2 className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
            
            <button
              onClick={downloadPDF}
              disabled={downloadingPDF}
              className="px-6 py-3 bg-white text-purple-600 hover:bg-purple-50 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
            >
              {downloadingPDF ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Content - PDF Target */}
      <div ref={reportRef} className="space-y-8 bg-gradient-to-br from-gray-50 to-white p-10 rounded-3xl shadow-xl">
        
        {/* Report Header */}
        <div className="text-center pb-6 border-b-4 border-purple-200">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">📊 Feedback Analysis Report</h1>
          <p className="text-xl text-gray-600">{report.event_title || 'Event Feedback'}</p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-2xl p-6 text-center shadow-lg transform hover:scale-105 transition-transform">
            <ThumbsUp className="w-10 h-10 text-green-600 mb-3 mx-auto" />
            <div className="text-4xl font-bold text-green-700 mb-2">{report?.highlights?.length || 0}</div>
            <div className="text-sm text-green-700 font-semibold uppercase tracking-wide">Strengths</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-2xl p-6 text-center shadow-lg transform hover:scale-105 transition-transform">
            <ThumbsDown className="w-10 h-10 text-orange-600 mb-3 mx-auto" />
            <div className="text-4xl font-bold text-orange-700 mb-2">{report?.concerns?.length || 0}</div>
            <div className="text-sm text-orange-700 font-semibold uppercase tracking-wide">To Improve</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-6 text-center shadow-lg transform hover:scale-105 transition-transform">
            <Users className="w-10 h-10 text-blue-600 mb-3 mx-auto" />
            <div className="text-4xl font-bold text-blue-700 mb-2">{feedbacks.length}</div>
            <div className="text-sm text-blue-700 font-semibold uppercase tracking-wide">Responses</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-2xl p-6 text-center shadow-lg transform hover:scale-105 transition-transform">
            <Star className="w-10 h-10 text-purple-600 mb-3 mx-auto" />
            <div className="text-4xl font-bold text-purple-700 mb-2">
              {Math.round(report?.analytics?.satisfaction_score || 0)}%
            </div>
            <div className="text-sm text-purple-700 font-semibold uppercase tracking-wide">Satisfaction</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

        {/* Sentiment Visualization */}
        {sentimentData && (
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-blue-600" />
              Feedback Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Key Insights - Simplified */}
        <div className="bg-white border-2 border-blue-300 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-blue-200">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              📊 Overall Summary
            </h3>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
            <p className="text-gray-800 leading-relaxed text-lg">
              {report?.summary?.main_summary || 'No summary available'}
            </p>
          </div>
        </div>

        {/* Strengths */}
        {report?.highlights && report.highlights.length > 0 && (
          <div className="bg-white border-2 border-green-300 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-green-200">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-800">
                ✨ What Went Great
              </h3>
            </div>
            <div className="space-y-4">
              {report.highlights.map((item, index) => (
                <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
                      {index + 1}
                    </div>
                    <p className="text-gray-800 text-lg leading-relaxed flex-1 pt-2">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Areas to Improve */}
        {report?.concerns && report.concerns.length > 0 && (
          <div className="bg-white border-2 border-orange-300 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-200">
              <div className="p-3 bg-orange-100 rounded-xl">
                <AlertCircle className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-orange-800">
                🎯 Action Items for Improvement
              </h3>
            </div>
            <div className="space-y-5">
              {report.concerns.map((item, index) => {
                // Parse format: "Issue → Suggestion"
                const parts = item.split('→').map(s => s.trim());
                const issue = parts[0] || item;
                const suggestion = parts[1];
                
                return (
                  <div key={index} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
                          <p className="text-sm text-orange-600 font-semibold mb-1">📋 ISSUE:</p>
                          <p className="text-gray-900 text-base leading-relaxed">{issue}</p>
                        </div>
                        {suggestion && (
                          <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                            <p className="text-sm text-green-600 font-semibold mb-1">✅ ACTION TO TAKE:</p>
                            <p className="text-gray-800 text-base leading-relaxed">{suggestion}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Reviews */}
        {meaningfulReviews.length > 0 && (
          <div className="bg-white border-2 border-purple-300 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-2">
              <MessageCircle className="w-8 h-8 text-purple-600" />
              💬 Detailed Feedback from Attendees
            </h3>
            <div className="space-y-6">
              {meaningfulReviews.map((review, index) => (
                <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-l-4 border-purple-500 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 text-lg leading-relaxed italic">
                        "{review}"
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-sm text-purple-600">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-medium">Top-rated feedback</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        {report?.next_steps && report.next_steps.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-indigo-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
              📋 Recommended Next Steps
            </h3>
            <div className="grid gap-4">
              {report.next_steps.map((item, index) => (
                <div key={index} className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm border-l-4 border-indigo-500">
                  <div className="w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-gray-800 text-base flex-1">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300 shadow-sm">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <span className="text-gray-700 font-medium">
                {report.generated_at ? new Date(report.generated_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                }) : 'Just now'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <span className="text-gray-700 font-medium">
                Generated in {typeof report.generation_time === 'number' ? report.generation_time.toFixed(1) : report.generation_time}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <span className="text-gray-700 font-medium">
                Based on {report.feedback_count} responses
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
