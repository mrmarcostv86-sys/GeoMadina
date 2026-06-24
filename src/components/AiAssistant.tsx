import React, { useState } from "react";
import { Project } from "../types";
import Markdown from "react-markdown";
import { Sparkles, Brain, Cpu, FileText, Send, Loader2, AlertTriangle, RefreshCw } from "lucide-react";

interface AiAssistantProps {
  project: Project;
}

export default function AiAssistant({ project }: AiAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");

  const runAiTask = async (taskType: "error_detection" | "generate_legal_desc" | "explain_coordinate", optionalText?: string) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: optionalText || customPrompt,
          contextPoints: project.points,
          taskType
        })
      });

      if (!res.ok) {
        throw new Error("Failed to contact AI Engine. Ensure server is online.");
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResponse(data.text);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    runAiTask("explain_coordinate", customPrompt);
  };

  return (
    <div id="ai-survey-assistant" className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#0B1220] text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl">
      {/* Task selectors */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-lg text-white font-sans">GeoMadina AI Co-Pilot</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Integrated Gemini neural network trained in Moroccan Cadastre standards (ONIGT), coordinate geometries, and error tolerances.
        </p>

        {/* Task Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => runAiTask("error_detection")}
            disabled={loading}
            className="w-full text-left p-3 bg-[#080C16] border border-slate-800 hover:border-indigo-500 rounded-xl transition-all group flex items-start space-x-3 cursor-pointer"
          >
            <div className="bg-amber-950/40 p-2 rounded-lg border border-amber-900/30 group-hover:bg-amber-900/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div>
              <span className="block font-bold text-xs text-slate-200 group-hover:text-indigo-400">Run QA & Error Detection</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Validate active coordinates for typos or vertical spikes.</span>
            </div>
          </button>

          <button
            onClick={() => runAiTask("generate_legal_desc")}
            disabled={loading}
            className="w-full text-left p-3 bg-[#080C16] border border-slate-800 hover:border-emerald-500 rounded-xl transition-all group flex items-start space-x-3 cursor-pointer"
          >
            <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/30 group-hover:bg-emerald-900/20">
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="block font-bold text-xs text-slate-200 group-hover:text-emerald-400">Draft PV de Bornage (Legal)</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Generate legal boundaries report matching Rabat Conservation.</span>
            </div>
          </button>

          <button
            onClick={() => runAiTask("explain_coordinate")}
            disabled={loading}
            className="w-full text-left p-3 bg-[#080C16] border border-slate-800 hover:border-indigo-500 rounded-xl transition-all group flex items-start space-x-3 cursor-pointer"
          >
            <div className="bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/30 group-hover:bg-indigo-900/20">
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="block font-bold text-xs text-slate-200 group-hover:text-indigo-400">Explain Geodetic Datums</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Formulas for WGS84 to Morocco Lambert 1-4 transformations.</span>
            </div>
          </button>
        </div>

        {/* Custom chat query */}
        <form onSubmit={handleCustomSubmit} className="pt-4 border-t border-slate-800 space-y-2">
          <label className="block text-[10px] text-slate-400 font-mono font-bold">ASK AI ANYTHING ABOUT SURVEYING</label>
          <div className="flex items-center bg-[#080C16] rounded-lg border border-slate-800 p-1 shadow-inner">
            <input
              type="text"
              placeholder="e.g. What is RGF93 coordinate offset?"
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-white outline-none placeholder-slate-600"
            />
            <button
              type="submit"
              disabled={loading || !customPrompt.trim()}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 rounded text-white transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Output console */}
      <div className="lg:col-span-2 flex flex-col bg-[#080C16] border border-slate-800 rounded-xl p-5 min-h-[300px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <span className="text-xs text-indigo-400 font-mono flex items-center space-x-1 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI ENGINE OUT_STREAM</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono font-bold">ACTIVE PROJECT: {project.name}</span>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 space-y-4">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center space-y-3 py-16">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="text-center">
                <p className="text-xs text-white font-bold">Neural Core Processing...</p>
                <p className="text-[10px] text-slate-400 mt-1">Applying geomatic transformations & ONIGT rules</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-lg text-xs text-red-400 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Analysis Error</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {!loading && !response && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-500">
              <Sparkles className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
              <p className="text-xs max-w-xs">Select one of the AI validation modules on the left, or input a custom geodetic prompt.</p>
            </div>
          )}

          {!loading && response && (
            <div className="markdown-body text-slate-300 text-xs leading-relaxed space-y-2 max-w-none">
              <Markdown>{response}</Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
