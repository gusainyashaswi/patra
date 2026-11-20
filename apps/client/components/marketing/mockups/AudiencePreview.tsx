"use client";

import { useState } from "react";

export function AudiencePreview() {
  const [activeTab, setActiveTab] = useState<"ready" | "invalid" | "duplicates" | "suppressed">("ready");

  const rows = {
    ready: [
      { email: "riya.sen@company.test", name: "Riya Sen", company: "FinTech Labs", note: "Valid syntax, active status" },
      { email: "ananya.rao@cloud.test", name: "Ananya Rao", company: "DevStudio", note: "Valid syntax, active status" },
      { email: "vikram.malhotra@corp.test", name: "Vikram M.", company: "HyperScale", note: "Valid syntax, active status" },
    ],
    invalid: [
      { email: "not-an-email-address", name: "Kunal Verma", company: "Unknown", note: "Syntax error: missing @" },
      { email: "dev.patel@", name: "Dev Patel", company: "Acme", note: "Syntax error: missing domain" },
    ],
    duplicates: [
      { email: "riya.sen@company.test", name: "Riya Sen", company: "FinTech Labs", note: "Duplicate row in spreadsheet (Row 42)" },
    ],
    suppressed: [
      { email: "former.user@bounced.test", name: "Samir K.", company: "Legacy", note: "Suppressed: Previous hard bounce (550 User Unknown)" },
    ],
  };

  return (
    <div className="w-full border-2 border-[#0755B5] bg-[#F4F2E8] p-5 sm:p-7 text-[#0755B5] shadow-sm font-sans select-none">
      {/* Top File Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(7,85,181,0.25)] pb-4">
        <div>
          <span className="font-pixel text-[11px] uppercase tracking-widest text-[rgba(7,85,181,0.7)]">
            Spreadsheet Import Inspector · 50,000 Row Capacity
          </span>
          <h3 className="font-yellix text-[22px] font-semibold tracking-tight text-[#0755B5] mt-0.5">
            contacts_q4_attendees.xlsx (1.4 MB)
          </h3>
        </div>
        <span className="text-[11px] font-mono uppercase bg-[rgba(7,85,181,0.08)] border border-[#0755B5] px-2.5 py-1">
          Non-committing preview
        </span>
      </div>

      {/* Validation Category Summary Tabs */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[12px]">
        <button
          onClick={() => setActiveTab("ready")}
          className={`border p-2.5 text-left transition-colors cursor-pointer ${
            activeTab === "ready" ? "border-[#0755B5] bg-[#ffffff] font-bold" : "border-[rgba(7,85,181,0.3)] bg-[rgba(7,85,181,0.03)]"
          }`}
        >
          <div className="text-[10px] text-[rgba(7,85,181,0.6)] uppercase">Ready to Import</div>
          <div className="text-[18px] text-[#1D7438] font-bold mt-0.5">1,248</div>
        </button>
        <button
          onClick={() => setActiveTab("invalid")}
          className={`border p-2.5 text-left transition-colors cursor-pointer ${
            activeTab === "invalid" ? "border-[#0755B5] bg-[#ffffff] font-bold" : "border-[rgba(7,85,181,0.3)] bg-[rgba(7,85,181,0.03)]"
          }`}
        >
          <div className="text-[10px] text-[rgba(7,85,181,0.6)] uppercase">Invalid Rows</div>
          <div className="text-[18px] text-[#B42318] font-bold mt-0.5">14</div>
        </button>
        <button
          onClick={() => setActiveTab("duplicates")}
          className={`border p-2.5 text-left transition-colors cursor-pointer ${
            activeTab === "duplicates" ? "border-[#0755B5] bg-[#ffffff] font-bold" : "border-[rgba(7,85,181,0.3)] bg-[rgba(7,85,181,0.03)]"
          }`}
        >
          <div className="text-[10px] text-[rgba(7,85,181,0.6)] uppercase">Duplicates</div>
          <div className="text-[18px] text-[#8F5200] font-bold mt-0.5">8</div>
        </button>
        <button
          onClick={() => setActiveTab("suppressed")}
          className={`border p-2.5 text-left transition-colors cursor-pointer ${
            activeTab === "suppressed" ? "border-[#0755B5] bg-[#ffffff] font-bold" : "border-[rgba(7,85,181,0.3)] bg-[rgba(7,85,181,0.03)]"
          }`}
        >
          <div className="text-[10px] text-[rgba(7,85,181,0.6)] uppercase">Suppressed</div>
          <div className="text-[18px] text-[#0755B5] font-bold mt-0.5">6</div>
        </button>
      </div>

      {/* Table Preview */}
      <div className="mt-5 border border-[#0755B5] bg-[#ffffff] overflow-x-auto -mx-1 sm:mx-0">
        <table className="w-full min-w-[500px] sm:min-w-full text-left font-mono text-[12px] border-collapse">
          <thead>
            <tr className="border-b border-[#0755B5] bg-[rgba(7,85,181,0.05)] text-[11px] uppercase tracking-wider text-[rgba(7,85,181,0.7)]">
              <th className="p-2.5">Email</th>
              <th className="p-2.5">Name</th>
              <th className="p-2.5">Custom Fields</th>
              <th className="p-2.5">Parser Evaluation</th>
            </tr>
          </thead>
          <tbody>
            {rows[activeTab].map((row, index) => (
              <tr key={index} className="border-b border-[rgba(7,85,181,0.15)] last:border-0 hover:bg-[rgba(7,85,181,0.02)]">
                <td className="p-2.5 font-bold">{row.email}</td>
                <td className="p-2.5 text-[rgba(7,85,181,0.85)]">{row.name}</td>
                <td className="p-2.5 text-[rgba(7,85,181,0.7)] font-sans text-[11px]">{row.company}</td>
                <td className="p-2.5">
                  <span
                    className={`inline-block px-2 py-0.5 text-[11px] font-semibold ${
                      activeTab === "ready"
                        ? "bg-[#DCEBD9] text-[#1D7438]"
                        : activeTab === "invalid"
                        ? "bg-[#F6D7D1] text-[#B42318]"
                        : activeTab === "duplicates"
                        ? "bg-[#F4E4C4] text-[#8F5200]"
                        : "bg-[rgba(7,85,181,0.1)] text-[#0755B5]"
                    }`}
                  >
                    {row.note}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ingestion Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[12px] font-mono pt-4 border-t border-[rgba(7,85,181,0.2)]">
        <div className="flex items-center gap-2">
          <span className="text-[rgba(7,85,181,0.7)]">Duplicate handling:</span>
          <span className="font-bold border border-[#0755B5] px-2 py-0.5 bg-white">
            Skip Duplicates
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="underline text-[rgba(7,85,181,0.8)] cursor-pointer hover:text-[#0755B5]">
            Export Skipped Rows (.csv)
          </button>
          <span className="mkt-btn mkt-btn-primary mkt-btn-sm text-[12px]">
            Commit 1,248 Contacts
          </span>
        </div>
      </div>
    </div>
  );
}
