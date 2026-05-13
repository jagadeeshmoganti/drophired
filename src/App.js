import { useState, useEffect, useRef, useCallback } from "react";
import { jsPDF } from "jspdf";

/* ═══════════════════════════════════════════════════
   PROFILE & RESUME — loaded from localStorage
   Set via the onboarding/settings screens
═══════════════════════════════════════════════════ */
const getProfile = () => {
  try { return JSON.parse(localStorage.getItem("dh_profile") || "null") || {}; } 
  catch { return {}; }
};
const getResumeText = () => localStorage.getItem("dh_resume_text") || "";
const CANDIDATE = getProfile();
const RESUME_TEXT = getResumeText();

/* ═══════════════════════════════════════════════════
   API KEYS — loaded from localStorage (set in Settings)
═══════════════════════════════════════════════════ */
const getKeys = () => ({
  ANTHROPIC_KEY: localStorage.getItem("dh_anthropic_key") || "",
  ADZUNA_APP_ID: localStorage.getItem("dh_adzuna_id") || "",
  ADZUNA_APP_KEY: localStorage.getItem("dh_adzuna_key") || "",
});

/* ═══════════════════════════════════════════════════
   PDF TEXT EXTRACTOR — reads resume PDF in browser
═══════════════════════════════════════════════════ */
const extractTextFromPDF = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) { reject(new Error("PDF.js not loaded")); return; }
        const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const cnt = await page.getTextContent();
          text += cnt.items.map(item => item.str).join(" ") + " ";
        }
        resolve(text.trim());
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

/* ═══════════════════════════════════════════════════
   PRESET SEARCH QUERIES
═══════════════════════════════════════════════════ */
const PRESET_SEARCHES = [
  { id: "p1", label: "Microsoft Fabric Engineer", query: "Microsoft Fabric Data Engineer", icon: "⚡" },
  { id: "p2", label: "Senior Data Engineer", query: "Senior Data Engineer Azure", icon: "🔷" },
  { id: "p3", label: "AI Data Engineer", query: "AI Data Engineer Machine Learning", icon: "🤖" },
  { id: "p4", label: "Azure Data Architect", query: "Azure Data Platform Architect", icon: "☁️" },
  { id: "p5", label: "Fabric Analytics Architect", query: "Microsoft Fabric Analytics Architect", icon: "📊" },
  { id: "p6", label: "Data Platform Engineer", query: "Data Platform Engineer Databricks Spark", icon: "🏗️" },
  { id: "p7", label: "Cloud Data Engineer", query: "Cloud Data Engineer Azure Databricks", icon: "🌩️" },
  { id: "p8", label: "Data Governance Engineer", query: "Data Governance Engineer Purview", icon: "🛡️" },
  { id: "p9", label: "ML Data Engineer", query: "Machine Learning Data Engineer MLOps", icon: "🧠" },
  { id: "p10", label: "Power BI Engineer", query: "Power BI Data Engineer Semantic Model", icon: "📈" },
];

/* ═══════════════════════════════════════════════════
   TOP 50 MNC COMPANY LIST FOR APIFY
═══════════════════════════════════════════════════ */
const MNC_COMPANIES = [
  { id: "microsoft", name: "Microsoft", domain: "microsoft.com", color: "#00a4ef", emoji: "🪟" },
  { id: "google", name: "Google", domain: "google.com", color: "#4285f4", emoji: "🔍" },
  { id: "amazon", name: "Amazon", domain: "amazon.jobs", color: "#ff9900", emoji: "📦" },
  { id: "meta", name: "Meta", domain: "metacareers.com", color: "#0668e1", emoji: "🌐" },
  { id: "apple", name: "Apple", domain: "apple.com", color: "#555", emoji: "🍎" },
  { id: "tesla", name: "Tesla", domain: "tesla.com", color: "#cc0000", emoji: "⚡" },
  { id: "x", name: "X (Twitter)", domain: "x.com", color: "#000", emoji: "𝕏" },
  { id: "spacex", name: "SpaceX", domain: "spacex.com", color: "#005288", emoji: "🚀" },
  { id: "nvidia", name: "NVIDIA", domain: "nvidia.com", color: "#76b900", emoji: "🎮" },
  { id: "databricks", name: "Databricks", domain: "databricks.com", color: "#ff3621", emoji: "🧱" },
  { id: "snowflake", name: "Snowflake", domain: "snowflake.com", color: "#29b5e8", emoji: "❄️" },
  { id: "salesforce", name: "Salesforce", domain: "salesforce.com", color: "#00a1e0", emoji: "☁️" },
  { id: "ibm", name: "IBM", domain: "ibm.com", color: "#054ada", emoji: "💙" },
  { id: "oracle", name: "Oracle", domain: "oracle.com", color: "#f80000", emoji: "🔴" },
  { id: "sap", name: "SAP", domain: "sap.com", color: "#0070f2", emoji: "🔷" },
  { id: "accenture", name: "Accenture", domain: "accenture.com", color: "#a100ff", emoji: "🟣" },
  { id: "deloitte", name: "Deloitte", domain: "deloitte.com", color: "#86bc25", emoji: "🟢" },
  { id: "capgemini", name: "Capgemini", domain: "capgemini.com", color: "#0070ad", emoji: "🔵" },
  { id: "infosys", name: "Infosys", domain: "infosys.com", color: "#007cc3", emoji: "💼" },
  { id: "wipro", name: "Wipro", domain: "wipro.com", color: "#341c6c", emoji: "🟤" },
  { id: "tcs", name: "TCS", domain: "tcs.com", color: "#0c2d83", emoji: "🏢" },
  { id: "cognizant", name: "Cognizant", domain: "cognizant.com", color: "#1a5276", emoji: "🧩" },
  { id: "jpmorgan", name: "JPMorgan", domain: "jpmorgan.com", color: "#003087", emoji: "🏦" },
  { id: "bofa", name: "Bank of America", domain: "bankofamerica.com", color: "#e31837", emoji: "💳" },
  { id: "goldman", name: "Goldman Sachs", domain: "goldmansachs.com", color: "#6699ff", emoji: "📈" },
  { id: "citi", name: "Citi", domain: "citi.com", color: "#003b70", emoji: "🌍" },
  { id: "wellsfargo", name: "Wells Fargo", domain: "wellsfargo.com", color: "#d71e28", emoji: "🐎" },
  { id: "att", name: "AT&T", domain: "att.com", color: "#00a8e0", emoji: "📡" },
  { id: "verizon", name: "Verizon", domain: "verizon.com", color: "#cd040b", emoji: "📶" },
  { id: "cisco", name: "Cisco", domain: "cisco.com", color: "#1ba0d7", emoji: "🌐" },
  { id: "intel", name: "Intel", domain: "intel.com", color: "#0071c5", emoji: "💻" },
  { id: "servicenow", name: "ServiceNow", domain: "servicenow.com", color: "#62d84e", emoji: "🔧" },
  { id: "workday", name: "Workday", domain: "workday.com", color: "#f97c1b", emoji: "📅" },
  { id: "palantir", name: "Palantir", domain: "palantir.com", color: "#101010", emoji: "🔮" },
  { id: "adobe", name: "Adobe", domain: "adobe.com", color: "#ff0000", emoji: "🎨" },
  { id: "uber", name: "Uber", domain: "uber.com", color: "#000000", emoji: "🚗" },
  { id: "airbnb", name: "Airbnb", domain: "airbnb.com", color: "#ff5a5f", emoji: "🏠" },
  { id: "linkedin", name: "LinkedIn", domain: "linkedin.com", color: "#0077b5", emoji: "💼" },
  { id: "stripe", name: "Stripe", domain: "stripe.com", color: "#635bff", emoji: "💳" },
  { id: "openai", name: "OpenAI", domain: "openai.com", color: "#10a37f", emoji: "🤖" },
  { id: "anthropic", name: "Anthropic", domain: "anthropic.com", color: "#b5694c", emoji: "🧡" },
  { id: "bytedance", name: "ByteDance", domain: "bytedance.com", color: "#161823", emoji: "🎵" },
  { id: "netflix", name: "Netflix", domain: "netflix.com", color: "#e50914", emoji: "🎬" },
  { id: "boeing", name: "Boeing", domain: "boeing.com", color: "#1d4289", emoji: "✈️" },
  { id: "ge", name: "GE", domain: "ge.com", color: "#003DA5", emoji: "⚙️" },
  { id: "honeywell", name: "Honeywell", domain: "honeywell.com", color: "#e2231a", emoji: "🏭" },
  { id: "fedex", name: "FedEx", domain: "fedex.com", color: "#4d148c", emoji: "📦" },
  { id: "ups", name: "UPS", domain: "ups.com", color: "#351c15", emoji: "🚚" },
  { id: "walmart", name: "Walmart", domain: "walmart.com", color: "#0071ce", emoji: "🛒" },
  { id: "target", name: "Target", domain: "target.com", color: "#cc0000", emoji: "🎯" },
];

/* ═══════════════════════════════════════════════════
   ADZUNA API — free 1000/month, replaces JSearch
═══════════════════════════════════════════════════ */
const ADZUNA_COUNTRY_MAP = {
  "us":"us","gb":"gb","ca":"ca","au":"au","de":"de","in":"in","sg":"sg","ae":"ae",
};

const searchRealJobs = async (query, dateFilter, country = "us") => {
  const countryCode = ADZUNA_COUNTRY_MAP[country] || "us";
  const daysMap = { "24h": 1, "1w": 7, "1m": 30 };
  const params = new URLSearchParams({
    app_id: getKeys().ADZUNA_APP_ID,
    app_key: getKeys().ADZUNA_APP_KEY,
    results_per_page: "20",
    what: query,
    max_days_old: String(daysMap[dateFilter] || 7),
    sort_by: "date",
  });
  // Adzuna supports CORS from browser — no extra headers needed
  const res = await fetch(
    `/adzuna/v1/api/jobs/${countryCode}/search/1?${params}`
  );
  if (!res.ok) {
    console.error("Adzuna error:", res.status, await res.text());
    throw new Error("Adzuna API error: " + res.status);
  }
  const data = await res.json();
  return (data.results || []).map(job => normalizeAdzunaJob(job));
};

const normalizeAdzunaJob = (job) => {
  const loc = job.location?.display_name || job.location?.area?.join(", ") || "Unknown";
  const minSal = job.salary_min;
  const maxSal = job.salary_max;
  const salary = minSal && maxSal
    ? `$${Math.round(minSal/1000)}k - $${Math.round(maxSal/1000)}k`
    : minSal ? `From $${Math.round(minSal/1000)}k` : "Not listed";
  const desc = job.description || "";
  const titleDesc = (job.title || "") + " " + desc;
  return {
    id: job.id || `adzuna-${Date.now()}-${Math.random()}`,
    title: job.title || "Unknown Title",
    company: job.company?.display_name || "Unknown Company",
    location: loc,
    salary,
    salaryPeriod: "yearly",
    jobType: job.contract_time === "part_time" ? "Part-time" : "Full-time",
    isRemote: titleDesc.toLowerCase().includes("remote"),
    sponsorship: "Not specified",
    description: desc,
    applyUrl: job.redirect_url || "",
    postedAt: job.created ? new Date(job.created).getTime() : Date.now(),
    skills: extractSkills(titleDesc),
    matchScore: 0,
    source: "Adzuna",
    logo: null,
    requiredExp: "See posting",
    requiredEdu: "See posting",
    contractType: detectContractType(titleDesc),
    sourceType: "jobboard",
  };
};

const detectContractType = (text) => {
  const t = text.toLowerCase();
  if (t.includes("c2c") || t.includes("corp to corp")) return "C2C";
  if (t.includes("contract")) return "Contract";
  if (t.includes("part-time") || t.includes("part time")) return "Part-time";
  if (t.includes("freelance")) return "Freelance";
  return "Full-time";
};

const extractSkills = (desc) => {
  const skills = ["Microsoft Fabric","Azure","PySpark","Python","SQL","Power BI","Databricks","Synapse","Purview","Medallion","Lakehouse","Spark","ETL","dbt","Kafka","Airflow","Terraform","AWS","GCP","Snowflake","MLflow","Kubernetes","Docker","Scala","Java","Hadoop","Hive","Flink","Delta Lake","Unity Catalog"];
  return skills.filter(s => desc.toLowerCase().includes(s.toLowerCase())).slice(0, 8);
};

/* ═══════════════════════════════════════════════════
   COMPANY CAREERS — Uses JSearch with company targeting
   (Apify scraper requires server-side; JSearch works from browser)
═══════════════════════════════════════════════════ */
const searchApifyJobs = async (companies, query, dateFilter = "1m", country = "us") => {
  const results = [];
  const daysMap = { "24h": 1, "1w": 7, "1m": 30 };
  const countryCode = ADZUNA_COUNTRY_MAP[country] || "us";
  const batchSize = 3;

  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (company) => {
        try {
          const companyQuery = `${query} ${company.name}`;
          const params = new URLSearchParams({
            app_id: getKeys().ADZUNA_APP_ID,
            app_key: getKeys().ADZUNA_APP_KEY,
            results_per_page: 5,
            what: companyQuery,
            max_days_old: daysMap[dateFilter] || 30,
            sort_by: "date",
          });
          const res = await fetch(
            `/adzuna/v1/api/jobs/${countryCode}/search/1?${params}`,
            { headers: { "Content-Type": "application/json" } }
          );
          const data = await res.json();
          return (data.results || [])
            .map(j => normalizeAdzunaJob(j))
            .filter(job => {
              const empName = (job.company || "").toLowerCase();
              const coName = company.name.toLowerCase().split(" ")[0];
              return empName.includes(coName) || coName.includes(empName.split(" ")[0]);
            })
            .slice(0, 4)
            .map(job => ({
              ...job,
              sourceType: "careers",
              companyColor: company.color,
              companyEmoji: company.emoji,
              source: company.name,
            }));
        } catch (e) {
          console.log(`Career search error for ${company.name}:`, e);
          return [];
        }
      })
    );
    batchResults.forEach(r => results.push(...r));
  }

  const seen = new Set();
  return results.filter(j => {
    if (seen.has(j.id)) return false;
    seen.add(j.id);
    return true;
  });
};

/* ═══════════════════════════════════════════════════
   CLAUDE API
═══════════════════════════════════════════════════ */
const callClaude = async (system, userMsg) => {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getKeys().ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 4000, system, messages: [{ role: "user", content: userMsg }] })
  });
  const d = await r.json();
  const text = (d.content || []).map(b => b.text || "").join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
};

const BATCH_SCORE_SYSTEM = `You are a job match scorer for a senior Microsoft Fabric / Azure Data Engineer with DP-700 certification, 6+ years experience. Given a list of job titles and required skills, return ONLY valid JSON array of match scores. Be honest and quick — no explanations needed.
Respond ONLY: [{"id":"<job_id>","score":<0-100>}]
Score based on: Microsoft Fabric/Azure skills match, seniority level, data engineering relevance. Score 85-100 for Fabric/Azure roles, 70-84 for general data engineering, 50-69 for partial match, below 50 for poor match.`;

const ANALYSIS_SYSTEM = `Expert job application strategist for data engineering/Azure/Fabric roles. Given resume + JD, respond ONLY valid JSON:
{"matchScore":<0-100>,"matchLabel":"<Excellent Match|Strong Match|Good Match|Partial Match>","roleTitle":"<title>","company":"<co>","keyInsights":["<i1>","<i2>","<i3>"],"skillsMatched":["<s1>","<s2>","<s3>","<s4>","<s5>"],"skillsGap":["<g1>","<g2>"],"tailoredSummary":"<3-4 sentences tailored to JD>","tailoredBullets":[{"company":"<co>","original":"<orig>","tailored":"<rewritten>"}],"coverLetter":"<full 3-para cover letter>","interviewTips":["<t1>","<t2>","<t3>","<t4>"]}
Rules: EXACTLY 7 tailoredBullets minimum spread across all experience entries in the resume; honest matchScore; only real skillsGap.`;

const RESUME_QUESTIONS_SYSTEM = `Expert resume coach. Generate exactly 4 questions. First is always GitHub question. Respond ONLY valid JSON:
{"questions":[{"id":"q1","question":"Would you like to include your GitHub profile link in this resume? (Default: Yes)","why":"GitHub demonstrates active coding and projects","placeholder":"Yes / No"},{"id":"q2","question":"<JD-specific gap question>","why":"<why>","placeholder":"<example>"},{"id":"q3","question":"<achievement/metric question>","why":"<why>","placeholder":"<example>"},{"id":"q4","question":"<tool/tech question from JD>","why":"<why>","placeholder":"<example>"}]}`;

const RESUME_BUILD_SYSTEM = `Expert ATS resume writer. Build complete tailored resume. Respond ONLY valid JSON:
{"name":"<name>","title":"<tailored title>","contact":{"email":"<e>","phone":"<p>","location":"<l>","linkedin":"<li>","github":"<gh or empty>"},"summary":"<3-4 sentence ATS summary>","experience":[{"company":"<co>","title":"<title>","dates":"<dates>","bullets":["<b1>","<b2>","<b3>","<b4>","<b5>","<b6>","<b7>"]}],"skillGroups":[{"category":"<cat>","skills":"<s1, s2, s3>"}],"education":[{"degree":"<deg>","school":"<sch>","year":"<yr>"}],"certifications":["<c1>"]}
Rules: Keep original experience order from resume. MINIMUM 6 bullets per role. 6 skill groups. ATS keywords from JD. Never truncate.`;

const COLD_EMAIL_SYSTEM = `Expert cold outreach coach. Write punchy cold email. Respond ONLY valid JSON:
{"subject":"<max 8 words>","body":"<3-4 short paragraphs, max 120 words, NO fluff>","followUpSubject":"<follow-up subject>","followUpBody":"<1 para, max 40 words>","linkedinNote":"<max 25 words>"}
Rules: Sound human. Be specific. No 'I hope this finds you well'. Lead with value.`;

/* ═══════════════════════════════════════════════════
   FORM FIELDS
═══════════════════════════════════════════════════ */
const FORM_FIELDS = [
  { id: "first_name", label: "First Name", type: "text" }, { id: "last_name", label: "Last Name", type: "text" },
  { id: "email", label: "Email", type: "email" }, { id: "phone", label: "Phone", type: "tel" },
  { id: "location", label: "City, State", type: "text" }, { id: "linkedin", label: "LinkedIn", type: "url" },
  { id: "current_title", label: "Current Title", type: "text" }, { id: "years_exp", label: "Years Experience", type: "text" },
  { id: "education", label: "Education", type: "text" }, { id: "skills", label: "Key Skills", type: "textarea" },
  { id: "summary", label: "Professional Summary", type: "textarea" }, { id: "cover_letter", label: "Cover Letter", type: "textarea" },
  { id: "salary", label: "Expected Salary", type: "text" }, { id: "availability", label: "Availability", type: "text" },
  { id: "work_auth", label: "Work Authorization", type: "text" }, { id: "sponsorship", label: "Require Sponsorship?", type: "text" },
  { id: "remote_pref", label: "Work Preference", type: "text" }, { id: "referral", label: "Referral Source", type: "text" },
];

/* ═══════════════════════════════════════════════════
   APPLICATION TRACKER
═══════════════════════════════════════════════════ */
const STORAGE_KEY = "drophired_v2_applications";
const loadApplications = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } };
const saveApplication = (app) => { const apps = loadApplications(); const i = apps.findIndex(a => a.id === app.id); if (i >= 0) apps[i] = app; else apps.unshift(app); localStorage.setItem(STORAGE_KEY, JSON.stringify(apps)); return apps; };
const updateAppStatus = (id, status) => { const apps = loadApplications(); const i = apps.findIndex(a => a.id === id); if (i >= 0) { apps[i].status = status; apps[i].updatedAt = Date.now(); } localStorage.setItem(STORAGE_KEY, JSON.stringify(apps)); return apps; };
const deleteApplication = (id) => { const apps = loadApplications().filter(a => a.id !== id); localStorage.setItem(STORAGE_KEY, JSON.stringify(apps)); return apps; };

/* ═══════════════════════════════════════════════════
   PDF UTILS
═══════════════════════════════════════════════════ */
const sanitizeForPDF = (text) => {
  if (!text) return "";
  return text.replace(/→/g, ">").replace(/←/g, "<").replace(/↗/g, "->").replace(/•/g, "-").replace(/·/g, "-").replace(/—/g, "-").replace(/–/g, "-").replace(/'/g, "'").replace(/'/g, "'").replace(/"/g, '"').replace(/"/g, '"').replace(/…/g, "...").replace(/[^\u0000-\u007F]/g, "");
};

const generateResumePDF = (resume, company) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = 612, ml = 52, mr = 52, cw = W - ml - mr;
  let y = 48;
  const hr = (thick = 0.75, color = [60, 60, 60]) => { doc.setDrawColor(...color); doc.setLineWidth(thick); doc.line(ml, y, W - mr, y); y += 10; };
  const section = (title) => { doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 30); doc.text(title, ml, y); y += 3; hr(0.5, [180, 180, 180]); };
  doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 15, 15); doc.text(sanitizeForPDF(resume.name), ml, y); y += 16;
  doc.setFontSize(11); doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60); doc.text(sanitizeForPDF(resume.title), ml, y); y += 14;
  const cp = [resume.contact?.email, resume.contact?.phone, resume.contact?.location, resume.contact?.linkedin, resume.contact?.github || ""].filter(Boolean).map(sanitizeForPDF);
  const cl = doc.splitTextToSize(cp.join("  |  "), cw); doc.setFontSize(8.5); doc.setTextColor(80, 80, 80); doc.text(cl, ml, y); y += cl.length * 11 + 6;
  hr(1, [40, 40, 40]);
  section("PROFESSIONAL SUMMARY");
  doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); doc.setTextColor(45, 45, 45);
  const sl = doc.splitTextToSize(sanitizeForPDF(resume.summary), cw); doc.text(sl, ml, y); y += sl.length * 13 + 10;
  section("EXPERIENCE");
  (resume.experience || []).forEach(exp => {
    if (y > 680) { doc.addPage(); y = 48; }
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 15, 15); doc.text(sanitizeForPDF(exp.title), ml, y);
    const ds = sanitizeForPDF(exp.dates || ""); doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(90, 90, 90); doc.text(ds, W - mr - doc.getTextWidth(ds), y); y += 13;
    doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.setTextColor(50, 50, 50); doc.text(sanitizeForPDF(exp.company), ml, y); y += 13;
    (exp.bullets || []).forEach(b => { if (y > 715) { doc.addPage(); y = 48; } doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(45, 45, 45); const bl = doc.splitTextToSize(`- ${sanitizeForPDF(b)}`, cw - 10); doc.text(bl, ml + 6, y); y += bl.length * 12.5; });
    y += 8;
  });
  section("SKILLS");
  (resume.skillGroups || []).forEach(sg => { if (y > 715) { doc.addPage(); y = 48; } doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(45, 45, 45); const sl2 = doc.splitTextToSize(`- ${sanitizeForPDF(sg.category)}: ${sanitizeForPDF(sg.skills)}`, cw - 6); doc.text(sl2, ml + 6, y); y += sl2.length * 12.5; });
  y += 6; section("EDUCATION");
  (resume.education || []).forEach(e => { doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 15, 15); doc.text(`${sanitizeForPDF(e.degree)} - ${sanitizeForPDF(e.school)}`, ml, y); const yw = doc.getTextWidth(e.year || ""); doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(90, 90, 90); doc.text(sanitizeForPDF(e.year || ""), W - mr - yw, y); y += 14; });
  if (resume.certifications?.length > 0) { y += 4; section("CERTIFICATIONS"); resume.certifications.forEach(c => { doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); doc.setTextColor(45, 45, 45); doc.text(`- ${sanitizeForPDF(c)}`, ml + 6, y); y += 13; }); }
  doc.save(`${(resume.name || "Resume").replace(/\s+/g, "_")}_${(company || "Resume").replace(/\s+/g, "_")}.pdf`);
};

/* ═══════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════ */
const scoreColor = s => s >= 88 ? "#34d399" : s >= 75 ? "#60a5fa" : s >= 60 ? "#fbbf24" : "#f87171";
const timeAgo = ms => { const h = Math.floor((Date.now() - ms) / 3600000); return h < 1 ? "Just now" : h < 24 ? `${h}h ago` : h < 168 ? `${Math.floor(h / 24)}d ago` : `${Math.floor(h / 168)}w ago`; };
const STATUS_CONFIG = {
  applied: { label: "Applied", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  interview: { label: "Interview 🎯", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  offer: { label: "Offer 🎉", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  rejected: { label: "Rejected", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  ghosted: { label: "Ghosted 👻", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
};

const linkedinCompanyUrl = (company) => `https://www.linkedin.com/company/${company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
const linkedinRecruiterUrl = (company) => `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`recruiter "talent acquisition" ${company} data engineer`)}`;

/* ═══════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════ */
export default function App() {
  const [activeView, setActiveView] = useState("search");
  const [showSettings, setShowSettings] = useState(false);
  const [onboardStep, setOnboardStep] = useState(() => {
    const hasKeys = !!(localStorage.getItem("dh_anthropic_key") && localStorage.getItem("dh_adzuna_id") && localStorage.getItem("dh_adzuna_key"));
    const hasProfile = !!localStorage.getItem("dh_profile");
    const hasResume = !!localStorage.getItem("dh_resume_text");
    if (!hasKeys) return "keys";
    if (!hasProfile || !hasResume) return "profile";
    return "done";
  });
  const [keysConfigured, setKeysConfigured] = useState(() => {
    return !!(localStorage.getItem("dh_anthropic_key") && localStorage.getItem("dh_adzuna_id") && localStorage.getItem("dh_adzuna_key"));
  });
  const [profileConfigured, setProfileConfigured] = useState(() => {
    return !!(localStorage.getItem("dh_profile") && localStorage.getItem("dh_resume_text"));
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeParsing, setResumeParsing] = useState(false);
  const [resumeText, setResumeText] = useState(localStorage.getItem("dh_resume_text") || "");
  const [profileForm, setProfileForm] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dh_profile") || "null") || {
      name:"", firstName:"", lastName:"", email:"", phone:"",
      location:"", linkedin:"", github:"", title:"", yearsExperience:"",
      skills:"", summary:"", education:"", certifications:"",
      salary:"Open", availability:"2 weeks", workAuth:"Yes",
      sponsorship:"No", remote:"Open to remote, hybrid, or on-site",
    }; } catch { return {}; }
  });
  const [settingsForm, setSettingsForm] = useState({
    anthropic: localStorage.getItem("dh_anthropic_key") || "",
    adzuna_id: localStorage.getItem("dh_adzuna_id") || "",
    adzuna_key: localStorage.getItem("dh_adzuna_key") || "",
  });
  const [searchMode, setSearchMode] = useState("jobboard"); // jobboard | careers
  const [selectedPreset, setSelectedPreset] = useState("p1");
  const [customQuery, setCustomQuery] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPresets, setCustomPresets] = useState([]);
  const [dateFilter, setDateFilter] = useState("1w");
  const [countryFilter, setCountryFilter] = useState("us");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [batchScoring, setBatchScoring] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedCompanies, setSelectedCompanies] = useState(["microsoft", "google", "amazon", "databricks", "snowflake"]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [analysisTab, setAnalysisTab] = useState("jd");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [showAppliedPrompt, setShowAppliedPrompt] = useState(false);
  const [applications, setApplications] = useState(loadApplications());
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetailTab, setAppDetailTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [filledFields, setFilledFields] = useState(null);
  const [editedFields, setEditedFields] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState("preview");
  const [coldEmail, setColdEmail] = useState(null);
  const [coldEmailLoading, setColdEmailLoading] = useState(false);
  const [recruiterName, setRecruiterName] = useState("");
  const [rbStep, setRbStep] = useState("intro");
  const [rbQuestions, setRbQuestions] = useState([]);
  const [rbAnswers, setRbAnswers] = useState({});
  const [rbResume, setRbResume] = useState(null);
  const [rbLoading, setRbLoading] = useState(false);
  const [rbFormat, setRbFormat] = useState("pdf");
  const canvasRef = useRef();

  const allPresets = [...PRESET_SEARCHES, ...customPresets];
  const activePreset = allPresets.find(p => p.id === selectedPreset);
  const searchQuery = activePreset?.query || customQuery;

  /* Load PDF.js from CDN */
  useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      };
      document.head.appendChild(script);
    }
  }, []);

  /* Particle BG */
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d");
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const pts = Array.from({ length: 60 }, () => ({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, r: Math.random() * 1.5 + .3, a: Math.random() * .2 + .04, hue: Math.random() > 0.5 ? 210 : 160 }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > c.width) p.vx *= -1;
        if (p.y < 0 || p.y > c.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,65%,${p.a})`; ctx.fill();
      });
      pts.forEach((a, i) => pts.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 100) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = `hsla(210,80%,65%,${.03 * (1 - d / 100)})`; ctx.lineWidth = .4; ctx.stroke(); }
      }));
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const handleResumeUpload = async (file) => {
    if (!file || file.type !== "application/pdf") {
      showToast("Please upload a PDF file!", "error"); return;
    }
    setResumeFile(file); setResumeParsing(true);
    try {
      const text = await extractTextFromPDF(file);
      if (!text || text.length < 50) throw new Error("Could not extract text");
      setResumeText(text);
      localStorage.setItem("dh_resume_text", text);
      showToast("✅ Resume parsed successfully!");
    } catch (e) {
      // Fallback — let user paste manually
      showToast("PDF parsing failed. Please paste your resume text manually.", "error");
    }
    setResumeParsing(false);
  };

  const saveProfile = () => {
    if (!profileForm.name || !profileForm.email || !profileForm.title) {
      showToast("Please fill Name, Email and Title at minimum!", "error"); return;
    }
    if (!resumeText || resumeText.length < 50) {
      showToast("Please upload your resume PDF or paste resume text!", "error"); return;
    }
    // Auto-split name
    const parts = profileForm.name.trim().split(" ");
    const profile = {
      ...profileForm,
      firstName: parts.slice(0, -1).join(" ") || parts[0],
      lastName: parts[parts.length - 1],
    };
    localStorage.setItem("dh_profile", JSON.stringify(profile));
    localStorage.setItem("dh_resume_text", resumeText);
    setProfileConfigured(true);
    setOnboardStep("done");
    showToast("✅ Profile saved! You're all set.");
    // Reload so CANDIDATE and RESUME_TEXT pick up new values
    setTimeout(() => window.location.reload(), 800);
  };

  const saveKeys = () => {
    if (!settingsForm.anthropic || !settingsForm.adzuna_id || !settingsForm.adzuna_key) {
      showToast("Please fill in all API keys!", "error"); return;
    }
    localStorage.setItem("dh_anthropic_key", settingsForm.anthropic.trim());
    localStorage.setItem("dh_adzuna_id", settingsForm.adzuna_id.trim());
    localStorage.setItem("dh_adzuna_key", settingsForm.adzuna_key.trim());
    setKeysConfigured(true);
    setShowSettings(false);
    if (!profileConfigured) setOnboardStep("profile");
    else setOnboardStep("done");
    showToast("✅ API keys saved!");
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const batchScoreJobs = async (jobList) => {
    if (!jobList.length) return jobList;
    setBatchScoring(true); setBatchProgress(0);
    try {
      // Score in batches of 15 to stay within token limits
      const batchSize = 15;
      let scored = [...jobList];
      for (let i = 0; i < jobList.length; i += batchSize) {
        const batch = jobList.slice(i, i + batchSize);
        const jobsDesc = batch.map(j => `{"id":"${j.id}","title":"${j.title}","company":"${j.company}","skills":"${j.skills.join(", ")}"}`).join("\n");
        try {
          const r = await callClaude(BATCH_SCORE_SYSTEM, `Score these jobs for a Microsoft Fabric / Azure Data Engineer (DP-700 certified, 6yrs exp):\n${jobsDesc}`);
          if (Array.isArray(r)) {
            r.forEach(item => {
              const idx = scored.findIndex(j => j.id === item.id);
              if (idx >= 0) scored[idx] = { ...scored[idx], matchScore: item.score };
            });
          }
        } catch (e) { /* skip batch on error */ }
        setBatchProgress(Math.round(((i + batchSize) / jobList.length) * 100));
        setJobs([...scored]);
      }
      setBatchScoring(false); setBatchProgress(0);
      return scored;
    } catch {
      setBatchScoring(false); setBatchProgress(0);
      return jobList;
    }
  };

  const handleSearch = useCallback(async () => {
    setSearching(true); setSelectedJob(null); setAnalysis(null); setError(""); setSearchError(""); setJobs([]);
    try {
      let results = [];
      if (searchMode === "jobboard") {
        setSearchProgress("Scanning LinkedIn, Indeed & Glassdoor...");
        results = await searchRealJobs(searchQuery, dateFilter, countryFilter);
        if (results.length === 0) setSearchError("No jobs found. Try different keywords or expand date range.");
      } else {
        setSearchProgress(`Searching ${selectedCompanies.length} companies...`);
        const companies = MNC_COMPANIES.filter(c => selectedCompanies.includes(c.id));
        results = await searchApifyJobs(companies, searchQuery, dateFilter, countryFilter);
        if (results.length === 0) setSearchError("No results from career pages. Try selecting more companies or different keywords.");
      }
      setJobs(results);
      setSearching(false); setHasSearched(true); setSearchProgress("");
      // Now batch score all results in background
      if (results.length > 0) {
        setSearchProgress("AI scoring all jobs...");
        await batchScoreJobs(results);
        setSearchProgress("");
      }
    } catch (e) {
      console.error("Search error:", e);
      setSearchError("Search failed: " + (e.message || "Check console for details"));
      setSearching(false); setHasSearched(true); setSearchProgress("");
    }
  }, [searchMode, searchQuery, dateFilter, countryFilter, selectedCompanies]);

  const analyzeJob = async (job) => {
    // Check if already applied
    const alreadyApplied = applications.find(a => a.jobId === job.id || (a.title === job.title && a.company === job.company));
    setSelectedJob(job); setAnalysis(null); setAnalyzing(true); setAnalysisTab("jd"); setError("");
    setColdEmail(null); setRecruiterName(""); setRbStep("intro"); setRbResume(null); setRbQuestions([]); setRbAnswers({});
    setShowAppliedPrompt(false);
    // If already applied, load saved analysis instead of re-running
    if (alreadyApplied?.analysis) {
      setAnalysis(alreadyApplied.analysis);
      setAnalyzing(false);
      return;
    }
    const jd = `Role: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\nSalary: ${job.salary}\nType: ${job.jobType} / ${job.contractType}\nRemote: ${job.isRemote ? "Yes" : "No"}\nSponsorship: ${job.sponsorship}\nRequired Experience: ${job.requiredExp}\nSkills: ${job.skills.join(", ")}\n\nDescription:\n${job.description.slice(0, 2500)}`;
    try {
      const r = await callClaude(ANALYSIS_SYSTEM, `RESUME:\n${RESUME_TEXT}\n\nJOB:\n${jd}`);
      setAnalysis(r);
      // Update match score on job card only if not already batch-scored
      if (!job.matchScore || job.matchScore === 0) {
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, matchScore: r.matchScore } : j));
      }
      setSelectedJob(prev => ({ ...prev, matchScore: r.matchScore || prev.matchScore }));
    } catch { setError("Analysis failed. Please retry."); }
    setAnalyzing(false);
  };

  const runAutofill = async () => {
    setAutofillLoading(true);
    try {
      const sys = `Expert form filler. Respond ONLY valid JSON: {"fields":[{"id":"<id>","label":"<label>","value":"<value>"}]}`;
      const r = await callClaude(sys, `CANDIDATE:\n${JSON.stringify(CANDIDATE)}\nROLE: ${selectedJob?.title} at ${selectedJob?.company}\nSummary: ${analysis?.tailoredSummary || CANDIDATE.summary}\nCover: ${analysis?.coverLetter || ""}\nFIELDS:\n${FORM_FIELDS.map(f => `${f.id}: ${f.label}`).join("\n")}`);
      const init = {}; (r.fields || []).forEach(f => { init[f.id] = f.value; });
      setEditedFields(init); setFilledFields(r); setShowModal(true); setModalStep("preview");
    } catch { setError("Auto-fill failed."); }
    finally { setAutofillLoading(false); }
  };

  const generateColdEmail = async () => {
    setColdEmailLoading(true); setColdEmail(null);
    try {
      const r = await callClaude(COLD_EMAIL_SYSTEM, `CANDIDATE: ${CANDIDATE.name}, ${CANDIDATE.title}, ${CANDIDATE.location}. ${CANDIDATE.certifications}. Skills: ${CANDIDATE.skills}.\nROLE: ${selectedJob?.title} at ${selectedJob?.company}, ${selectedJob?.location}.\nRECRUITER: ${recruiterName || "Hiring Team"}\nMatch: ${analysis?.matchScore || "N/A"}%`);
      setColdEmail(r);
    } catch { setError("Cold email failed."); }
    finally { setColdEmailLoading(false); }
  };

  const generateRbQuestions = async () => {
    setRbLoading(true); setRbStep("questions");
    try {
      const jd = `Role: ${selectedJob?.title} at ${selectedJob?.company}. Skills: ${selectedJob?.skills?.join(", ")}. ${selectedJob?.description?.slice(0, 1500)}`;
      const r = await callClaude(RESUME_QUESTIONS_SYSTEM, `RESUME:\n${RESUME_TEXT}\n\nJD:\n${jd}`);
      setRbQuestions(r.questions || []); setRbAnswers({}); setRbStep("answering");
    } catch { setError("Failed to generate questions."); setRbStep("intro"); }
    finally { setRbLoading(false); }
  };

  const buildTailoredResume = async () => {
    setRbLoading(true); setRbStep("building");
    try {
      const includeGithub = (rbAnswers["q1"] || "yes").toLowerCase().trim() !== "no";
      const answersText = rbQuestions.map(q => `Q: ${q.question}\nA: ${rbAnswers[q.id] || "(skipped)"}`).join("\n\n");
      const jd = `Role: ${selectedJob?.title} at ${selectedJob?.company}. Skills: ${selectedJob?.skills?.join(", ")}.\n${selectedJob?.description?.slice(0, 2000)}`;
      const r = await callClaude(RESUME_BUILD_SYSTEM, `RESUME:\n${RESUME_TEXT}\n\nJD:\n${jd}\n\nCANDIDATE ANSWERS:\n${answersText}\n\nincludeGithub: ${includeGithub}\nGitHub: ${CANDIDATE.github}`);
      if (!includeGithub && r.contact) r.contact.github = "";
      setRbResume(r); setRbStep("done");
    } catch { setError("Resume build failed."); setRbStep("answering"); }
    finally { setRbLoading(false); }
  };

  const saveApplicationRecord = (extraData = {}) => {
    const appRecord = {
      id: `app-${Date.now()}`,
      jobId: selectedJob.id,
      title: selectedJob.title,
      company: selectedJob.company,
      location: selectedJob.location,
      salary: selectedJob.salary,
      jobType: selectedJob.jobType,
      contractType: selectedJob.contractType,
      isRemote: selectedJob.isRemote,
      sponsorship: selectedJob.sponsorship,
      applyUrl: selectedJob.applyUrl,
      source: selectedJob.source,
      sourceType: selectedJob.sourceType,
      appliedAt: Date.now(),
      updatedAt: Date.now(),
      status: "applied",
      matchScore: analysis?.matchScore || 0,
      analysis,
      filledFields: editedFields,
      tailoredSummary: analysis?.tailoredSummary || "",
      coverLetter: analysis?.coverLetter || "",
      tailoredBullets: analysis?.tailoredBullets || [],
      interviewTips: analysis?.interviewTips || [],
      skillsMatched: analysis?.skillsMatched || [],
      skillsGap: analysis?.skillsGap || [],
      jobDescription: selectedJob.description,
      notes: "",
      ...extraData,
    };
    const updated = saveApplication(appRecord);
    setApplications(updated);
    return appRecord;
  };

  const confirmAndSave = () => {
    setModalStep("confirming");
    setTimeout(() => { saveApplicationRecord({ filledFields: editedFields }); setModalStep("submitted"); }, 1100);
  };

  const handleAppliedClick = () => {
    saveApplicationRecord();
    setShowAppliedPrompt(false);
    showToast("✅ Application saved to tracker!");
    // Mark job as applied in job list
    setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, applied: true } : j));
    setSelectedJob(prev => ({ ...prev, applied: true }));
  };

  const copy = (text, key) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 2000); };

  const COUNTRIES = [
    { code: "us", label: "🇺🇸 United States" },
    { code: "ca", label: "🇨🇦 Canada" },
    { code: "gb", label: "🇬🇧 United Kingdom" },
    { code: "au", label: "🇦🇺 Australia" },
    { code: "de", label: "🇩🇪 Germany" },
    { code: "in", label: "🇮🇳 India" },
    { code: "sg", label: "🇸🇬 Singapore" },
    { code: "ae", label: "🇦🇪 UAE" },
  ];
  const g = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    boxShadow: "0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)",
  };
  const sc = analysis ? scoreColor(analysis.matchScore) : "#818cf8";
  const stats = { total: applications.length, interview: applications.filter(a => a.status === "interview").length, offer: applications.filter(a => a.status === "offer").length };
  const filteredApps = statusFilter === "all" ? applications : applications.filter(a => a.status === statusFilter);
  const ANALYSIS_TABS = [
    { id: "jd", l: "Job Details", ic: "📋" },
    { id: "overview", l: "AI Analysis", ic: "✦" },
    { id: "resume", l: "Bullets", ic: "◎" },
    { id: "builder", l: "Resume Builder", ic: "⬇" },
    { id: "cover", l: "Cover Letter", ic: "✉" },
    { id: "interview", l: "Interview", ic: "◇" },
    { id: "outreach", l: "Outreach", ic: "⟡" },
    { id: "autofill", l: "Auto-Fill", ic: "⚡" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#06040f", color:"#e2e8f0", fontFamily:"'DM Sans',sans-serif", position:"relative", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:rgba(99,102,241,0.04)}
        ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#6366f1,#8b5cf6);border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.75)}}
        @keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes shimmer{0%{background-position:-800px 0}100%{background-position:800px 0}}
        @keyframes meshMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes orb1{0%{transform:translate(0,0)}33%{transform:translate(40px,-30px)}66%{transform:translate(-25px,20px)}100%{transform:translate(0,0)}}
        @keyframes orb2{0%{transform:translate(0,0)}33%{transform:translate(-30px,25px)}66%{transform:translate(20px,-15px)}100%{transform:translate(0,0)}}
        @keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-7px) rotate(1.5deg)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3),0 0 60px rgba(99,102,241,0.1)}50%{box-shadow:0 0 40px rgba(139,92,246,0.5),0 0 80px rgba(99,102,241,0.2)}}
        @keyframes borderShimmer{0%{border-color:rgba(99,102,241,0.25)}50%{border-color:rgba(139,92,246,0.55)}100%{border-color:rgba(99,102,241,0.25)}}
        .fadeUp{animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both}
        .spin{animation:spin .85s linear infinite}
        .pulse-dot{animation:pulse 2.5s ease-in-out infinite}
        .float-logo{animation:float 5s ease-in-out infinite}
        .skeleton{background:linear-gradient(90deg,rgba(99,102,241,0.05) 25%,rgba(139,92,246,0.1) 50%,rgba(99,102,241,0.05) 75%);background-size:800px 100%;animation:shimmer 2s ease-in-out infinite;border-radius:10px}
        button,input,textarea,select{font-family:inherit;cursor:pointer}
        input,textarea{outline:none}
        .job-card{transition:all .22s cubic-bezier(.16,1,.3,1)}
        .job-card:hover{border-color:rgba(139,92,246,0.45)!important;transform:translateX(4px) translateY(-1px);box-shadow:0 8px 40px rgba(99,102,241,0.2),inset 0 1px 0 rgba(255,255,255,0.08)!important;background:rgba(99,102,241,0.07)!important}
        .company-tile{transition:all .2s cubic-bezier(.16,1,.3,1)}
        .company-tile:hover{transform:scale(1.1) translateY(-3px);z-index:5;box-shadow:0 16px 48px rgba(0,0,0,0.5)!important}
        .pill-active{background:linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.2))!important;border-color:rgba(139,92,246,0.5)!important;color:#c4b5fd!important;box-shadow:0 0 20px rgba(99,102,241,0.15)}
        .tab-active{background:linear-gradient(135deg,rgba(99,102,241,0.22),rgba(139,92,246,0.16))!important;border-color:rgba(139,92,246,0.45)!important;color:#c4b5fd!important}
        .mode-active{background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))!important;border-color:rgba(139,92,246,0.4)!important;box-shadow:0 0 30px rgba(99,102,241,0.15),inset 0 1px 0 rgba(255,255,255,0.08)}
        .hunt-btn{background:linear-gradient(135deg,#4f46e5,#7c3aed,#6d28d9);background-size:200% 200%;animation:meshMove 4s ease infinite;border:none!important;box-shadow:0 0 50px rgba(99,102,241,0.4),0 4px 24px rgba(0,0,0,0.4);transition:all .25s!important}
        .hunt-btn:hover{transform:translateY(-3px)!important;box-shadow:0 0 80px rgba(99,102,241,0.6),0 8px 40px rgba(0,0,0,0.5)!important}
        .hunt-btn:active{transform:translateY(-1px)!important}
        .hunt-btn:disabled{background:rgba(255,255,255,0.06)!important;animation:none!important;box-shadow:none!important}
        .apply-link{background:linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.15))!important;border-color:rgba(16,185,129,0.4)!important;color:#34d399!important;box-shadow:0 0 20px rgba(16,185,129,0.15)}
        .apply-link:hover{box-shadow:0 0 40px rgba(16,185,129,0.3)!important;transform:translateY(-2px)}
        .applied-banner{animation:glowPulse 3s ease-in-out infinite;border-color:rgba(16,185,129,0.4)!important}
        .glow-border{animation:borderShimmer 3s ease-in-out infinite}
        a{text-decoration:none;transition:all .15s}
        input:focus{border-color:rgba(139,92,246,0.55)!important;box-shadow:0 0 0 3px rgba(99,102,241,0.12)!important}
        textarea:focus{border-color:rgba(139,92,246,0.55)!important;box-shadow:0 0 0 3px rgba(99,102,241,0.12)!important}
        .stat-card:hover{transform:translateY(-4px)!important;box-shadow:0 16px 48px rgba(0,0,0,0.5)!important}
      `}</style>

      {/* ── MESH BACKGROUND ── */}
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(125deg,#06040f 0%,#0f0a1e 35%,#080515 65%,#06040f 100%)"}}/>
        <div style={{position:"absolute",top:"-15%",right:"-10%",width:800,height:800,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.22) 0%,rgba(139,92,246,0.1) 35%,transparent 65%)",animation:"orb1 14s ease-in-out infinite"}}/>
        <div style={{position:"absolute",bottom:"-20%",left:"-10%",width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(16,185,129,0.15) 0%,rgba(5,150,105,0.07) 35%,transparent 65%)",animation:"orb2 18s ease-in-out infinite"}}/>
        <div style={{position:"absolute",top:"40%",left:"35%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(236,72,153,0.08) 0%,transparent 60%)",animation:"orb1 22s ease-in-out infinite reverse"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)",backgroundSize:"64px 64px"}}/>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 80% 50% at 50% 0%,rgba(99,102,241,0.06),transparent)"}}/>
      </div>
      <canvas ref={canvasRef} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1,opacity:0.35}}/>

      {/* ══ HEADER ══ */}
      <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(6,4,15,0.82)",backdropFilter:"blur(32px)",borderBottom:"1px solid rgba(99,102,241,0.18)",padding:"0 28px",height:58,display:"flex",alignItems:"center",gap:18,boxShadow:"0 1px 0 rgba(99,102,241,0.12),0 4px 24px rgba(0,0,0,0.4)"}}>

        {/* Logo */}
        <div className="float-logo" style={{display:"flex",alignItems:"center",gap:10,marginRight:6}}>
          <div style={{width:36,height:36,borderRadius:12,background:"linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 24px rgba(99,102,241,0.6),0 0 60px rgba(99,102,241,0.2)",border:"1px solid rgba(255,255,255,0.2)"}}>⚡</div>
          <div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:17,letterSpacing:"-0.05em",background:"linear-gradient(90deg,#818cf8,#c4b5fd,#a5f3fc,#6ee7b7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundSize:"200% 100%",animation:"meshMove 5s ease infinite"}}>DropHired</div>
            <div style={{fontSize:8,color:"rgba(255,255,255,0.22)",letterSpacing:"0.22em",marginTop:-1}}>AI JOB HUNTER · by Jagadeesh M</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{display:"flex",gap:3,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:4,border:"1px solid rgba(255,255,255,0.07)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04)"}}>
          {[{id:"search",label:"⚡ Hunt Jobs"},{id:"tracker",label:`📋 Applications${applications.length>0?` (${applications.length})`:""}`}].map(n=>(
            <button key={n.id} onClick={()=>setActiveView(n.id)}
              style={{padding:"6px 16px",borderRadius:9,fontSize:12,fontWeight:activeView===n.id?700:400,background:activeView===n.id?"linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.18))":"transparent",border:`1px solid ${activeView===n.id?"rgba(139,92,246,0.45)":"transparent"}`,color:activeView===n.id?"#c4b5fd":"rgba(255,255,255,0.38)",transition:"all .18s",boxShadow:activeView===n.id?"0 0 20px rgba(99,102,241,0.15)":"none"}}>
              {n.label}
            </button>
          ))}
        </div>

        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
          {stats.interview>0&&<div style={{fontSize:11,color:"#c4b5fd",background:"rgba(139,92,246,0.12)",padding:"4px 12px",borderRadius:20,border:"1px solid rgba(139,92,246,0.25)",boxShadow:"0 0 20px rgba(139,92,246,0.15)"}}>🎯 {stats.interview} interview{stats.interview>1?"s":""}</div>}
          {stats.offer>0&&<div style={{fontSize:11,color:"#6ee7b7",background:"rgba(16,185,129,0.1)",padding:"4px 12px",borderRadius:20,border:"1px solid rgba(16,185,129,0.25)",boxShadow:"0 0 20px rgba(16,185,129,0.15)"}}>🎉 {stats.offer} offer{stats.offer>1?"s":""}</div>}
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#34d399",display:"inline-block",boxShadow:"0 0 8px #34d399"}} className="pulse-dot"/>
            <span style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.18em"}}>LIVE</span>
          </div>
          <button onClick={()=>setShowSettings(true)}
            style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",color:"rgba(255,255,255,0.5)",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}
            title="Settings">⚙️</button>
        </div>
      </header>

      {/* ── WATERMARK ── */}
      <div style={{position:"fixed",bottom:16,right:18,zIndex:50,display:"flex",alignItems:"center",gap:8}}>
        <a href={"https://linkedin.com/in/" + (JSON.parse(localStorage.getItem("dh_profile")||"{}" ).linkedin || "").replace("linkedin.com/in/","")} target="_blank" rel="noopener noreferrer"
          style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,background:"rgba(10,102,194,0.12)",border:"1px solid rgba(10,102,194,0.2)",textDecoration:"none",transition:"all .2s",backdropFilter:"blur(12px)"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(10,102,194,0.25)";e.currentTarget.style.borderColor="rgba(10,102,194,0.4)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(10,102,194,0.12)";e.currentTarget.style.borderColor="rgba(10,102,194,0.2)";}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#0a66c2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          <span style={{fontSize:11,fontWeight:600,color:"#93c5fd",letterSpacing:"0.01em"}}>{(JSON.parse(localStorage.getItem("dh_profile")||"{}" ).name || "DropHired").split(" ")[0]}</span>
        </a>
        <div style={{fontSize:9,color:"rgba(255,255,255,0.15)",letterSpacing:"0.1em"}}>© DropHired</div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",zIndex:300,background:toast.type==="success"?"linear-gradient(135deg,rgba(16,185,129,0.95),rgba(5,150,105,0.95))":"linear-gradient(135deg,rgba(248,113,113,0.95),rgba(220,38,38,0.95))",color:"#fff",padding:"10px 22px",borderRadius:24,fontSize:13,fontWeight:700,boxShadow:"0 8px 40px rgba(0,0,0,0.4)",backdropFilter:"blur(12px)",animation:"fadeUp .3s ease",border:"1px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",gap:8}}>
          {toast.msg}
          <button onClick={()=>setToast(null)} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:20,color:"#fff",fontSize:11,padding:"1px 7px",marginLeft:4}}>×</button>
        </div>
      )}

      {/* ── BATCH SCORING PROGRESS ── */}
      {batchScoring && (
        <div style={{position:"fixed",top:58,left:0,right:0,zIndex:200,height:3,background:"rgba(99,102,241,0.15)"}}>
          <div style={{height:"100%",background:"linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa)",backgroundSize:"200% 100%",animation:"meshMove 1.5s ease infinite",width:`${batchProgress}%`,transition:"width .5s ease",borderRadius:"0 2px 2px 0"}}/>
          <div style={{position:"absolute",right:12,top:6,fontSize:10,color:"rgba(167,139,250,0.8)",fontWeight:600}}>AI scoring {batchProgress}%</div>
        </div>
      )}
      {activeView==="search"&&(
        <div style={{display:"flex",maxWidth:1440,margin:"0 auto",padding:"0 20px",gap:18,paddingTop:22,position:"relative",zIndex:2,height:"calc(100vh - 58px)",overflow:"hidden"}}>

          {/* LEFT PANEL */}
          <div style={{width:370,flexShrink:0,display:"flex",flexDirection:"column",gap:12,overflowY:"auto",paddingRight:4,paddingBottom:20}}>

            {/* Mode toggle */}
            <div style={{...g,padding:5,display:"flex",gap:4}} className="fadeUp">
              {[{id:"jobboard",label:"⚡ Job Boards",sub:"LinkedIn · Indeed · Glassdoor"},{id:"careers",label:"🏢 Company Targeted",sub:"Search within specific MNCs"}].map(m=>(
                <button key={m.id} onClick={()=>setSearchMode(m.id)}
                  className={searchMode===m.id?"mode-active":""}
                  style={{flex:1,padding:"11px 8px",borderRadius:12,background:"transparent",border:"1px solid transparent",textAlign:"center",transition:"all .2s"}}>
                  <div style={{fontSize:12,fontWeight:700,color:searchMode===m.id?"#c4b5fd":"rgba(255,255,255,0.3)",marginBottom:2}}>{m.label}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.2)"}}>{m.sub}</div>
                </button>
              ))}
            </div>

            {/* Preset searches — collapsible */}
            <div style={{...g,padding:"12px 16px"}} className="fadeUp">
              <button onClick={()=>setShowQuickSearch(p=>!p)}
                style={{width:"100%",background:"none",border:"none",display:"flex",alignItems:"center",justifyContent:"space-between",padding:0}}>
                <div style={{fontSize:9,letterSpacing:"0.18em",color:"rgba(255,255,255,0.22)",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{display:"inline-block",width:14,height:1,background:"linear-gradient(90deg,#6366f1,transparent)"}}/>
                  QUICK SEARCH
                  {activePreset&&<span style={{fontSize:9,color:"rgba(167,139,250,0.7)",background:"rgba(99,102,241,0.1)",padding:"1px 7px",borderRadius:10,border:"1px solid rgba(99,102,241,0.15)"}}>{activePreset.label}</span>}
                </div>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.25)",transition:"transform .2s",display:"inline-block",transform:showQuickSearch?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
              </button>
              {showQuickSearch&&(
                <div className="fadeUp" style={{marginTop:10}}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                    {[...PRESET_SEARCHES,...customPresets].map((p,i)=>(
                      <button key={p.id} onClick={()=>{setSelectedPreset(p.id);setShowCustomInput(false);setShowQuickSearch(false);}}
                        className={selectedPreset===p.id?"pill-active":""}
                        style={{padding:"5px 11px",borderRadius:20,fontSize:11,fontWeight:500,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.45)",display:"flex",alignItems:"center",gap:5,transition:"all .15s"}}>
                        <span style={{fontSize:12}}>{p.icon}</span>{p.label}
                      </button>
                    ))}
                    <button onClick={()=>setShowCustomInput(!showCustomInput)}
                      style={{padding:"5px 11px",borderRadius:20,fontSize:11,fontWeight:600,background:showCustomInput?"rgba(236,72,153,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${showCustomInput?"rgba(236,72,153,0.35)":"rgba(255,255,255,0.07)"}`,color:showCustomInput?"#f9a8d4":"rgba(255,255,255,0.32)",transition:"all .15s"}}>
                      + Custom
                    </button>
                  </div>
                  {showCustomInput&&(
                    <div style={{display:"flex",gap:6}} className="fadeUp">
                      <input value={customQuery} onChange={e=>setCustomQuery(e.target.value)}
                        placeholder="e.g. Databricks Architect..."
                        onKeyDown={e=>{if(e.key==="Enter"&&customQuery.trim()){const np={id:`c-${Date.now()}`,label:customQuery.slice(0,20),query:customQuery,icon:"✨"};setCustomPresets(p=>[...p,np]);setSelectedPreset(np.id);setShowCustomInput(false);setShowQuickSearch(false);setCustomQuery("");}}}
                        style={{flex:1,background:"rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,color:"rgba(255,255,255,0.75)",fontSize:12,padding:"8px 12px"}}/>
                      <button onClick={()=>{if(customQuery.trim()){const np={id:`c-${Date.now()}`,label:customQuery.slice(0,20),query:customQuery,icon:"✨"};setCustomPresets(p=>[...p,np]);setSelectedPreset(np.id);setShowCustomInput(false);setShowQuickSearch(false);setCustomQuery("");}}}
                        style={{padding:"8px 14px",background:"rgba(236,72,153,0.15)",border:"1px solid rgba(236,72,153,0.3)",borderRadius:10,color:"#f9a8d4",fontSize:12,fontWeight:700}}>Add</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date + Country filter */}
            <div style={{...g,padding:"13px 16px"}} className="fadeUp">
              <div style={{fontSize:9,letterSpacing:"0.18em",color:"rgba(255,255,255,0.22)",marginBottom:9}}>DATE POSTED</div>
              <div style={{display:"flex",gap:5,marginBottom:12}}>
                {[{v:"24h",l:"24 hrs"},{v:"1w",l:"1 Week"},{v:"1m",l:"1 Month"}].map(o=>(
                  <button key={o.v} onClick={()=>setDateFilter(o.v)}
                    className={dateFilter===o.v?"pill-active":""}
                    style={{flex:1,padding:"7px 0",borderRadius:20,fontSize:11,fontWeight:500,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.4)",transition:"all .15s"}}>
                    {o.l}
                  </button>
                ))}
              </div>
              <div style={{fontSize:9,letterSpacing:"0.18em",color:"rgba(255,255,255,0.22)",marginBottom:9}}>COUNTRY</div>
              <div style={{position:"relative"}}>
                <button onClick={()=>setShowCountryPicker(p=>!p)}
                  style={{width:"100%",padding:"8px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,color:"rgba(255,255,255,0.65)",fontSize:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span>{COUNTRIES.find(c=>c.code===countryFilter)?.label||"🇺🇸 United States"}</span>
                  <span style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>▾</span>
                </button>
                {showCountryPicker&&(
                  <div className="fadeUp" style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#12103a",border:"1px solid rgba(99,102,241,0.25)",borderRadius:12,zIndex:50,overflow:"hidden",boxShadow:"0 12px 40px rgba(0,0,0,0.5)"}}>
                    {COUNTRIES.map(c=>(
                      <button key={c.code} onClick={()=>{setCountryFilter(c.code);setShowCountryPicker(false);}}
                        style={{width:"100%",padding:"9px 14px",background:countryFilter===c.code?"rgba(99,102,241,0.15)":"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,0.04)",color:countryFilter===c.code?"#c4b5fd":"rgba(255,255,255,0.55)",fontSize:12,textAlign:"left",cursor:"pointer"}}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Company grid */}
            {searchMode==="careers"&&(
              <div style={{...g,padding:"14px 16px"}} className="fadeUp">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}>
                  <div style={{fontSize:9,letterSpacing:"0.18em",color:"rgba(255,255,255,0.22)"}}>{selectedCompanies.length} COMPANIES SELECTED</div>
                  <button onClick={()=>setSelectedCompanies(selectedCompanies.length===MNC_COMPANIES.length?[]:MNC_COMPANIES.map(c=>c.id))}
                    style={{fontSize:9,color:"#818cf8",background:"none",border:"none",fontWeight:600}}>
                    {selectedCompanies.length===MNC_COMPANIES.length?"Clear":"Select All"}
                  </button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
                  {MNC_COMPANIES.map(c=>{
                    const sel=selectedCompanies.includes(c.id);
                    return(
                      <button key={c.id} className="company-tile" onClick={()=>setSelectedCompanies(p=>sel?p.filter(x=>x!==c.id):[...p,c.id])}
                        style={{padding:"7px 4px",borderRadius:10,background:sel?`linear-gradient(135deg,${c.color}25,${c.color}12)`:"rgba(255,255,255,0.03)",border:`1px solid ${sel?c.color+"50":"rgba(255,255,255,0.07)"}`,textAlign:"center",boxShadow:sel?`0 0 16px ${c.color}30`:"none"}}>
                        <div style={{fontSize:14}}>{c.emoji}</div>
                        <div style={{fontSize:8,color:sel?"rgba(255,255,255,0.75)":"rgba(255,255,255,0.28)",marginTop:2,lineHeight:1.2}}>{c.name.split(" ")[0]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hunt button */}
            <button onClick={handleSearch} disabled={searching} className="hunt-btn"
              style={{borderRadius:14,color:searching?"rgba(255,255,255,0.25)":"#fff",fontSize:14,fontWeight:800,padding:"14px 0",display:"flex",alignItems:"center",justifyContent:"center",gap:9,letterSpacing:"0.03em",transition:"all .25s"}}>
              {searching?<><span style={{width:15,height:15,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block"}} className="spin"/>{searchProgress||"Hunting..."}</>:`⚡ Hunt ${searchMode==="careers"?"Company Careers":"Job Boards"}`}
            </button>

            {searchError&&<div style={{...g,padding:"10px 14px",borderColor:"rgba(248,113,113,0.25)",background:"rgba(248,113,113,0.06)",fontSize:11,color:"#fca5a5"}}>⚠ {searchError}</div>}

            {/* Job results */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {searching&&Array.from({length:4}).map((_,i)=>(
                <div key={i} style={{...g,padding:16,borderRadius:14}}>
                  <div style={{height:12,marginBottom:8,width:"68%"}} className="skeleton"/>
                  <div style={{height:10,marginBottom:6,width:"44%"}} className="skeleton"/>
                  <div style={{height:9,width:"52%"}} className="skeleton"/>
                </div>
              ))}

              {!searching&&jobs.map((job,i)=>{
                const isSel=selectedJob?.id===job.id;
                const sc2=job.matchScore>0?scoreColor(job.matchScore):null;
                const isApplied = job.applied || applications.some(a => a.jobId === job.id || (a.title === job.title && a.company === job.company));
                return(
                  <div key={job.id} className="job-card fadeUp" onClick={()=>analyzeJob(job)}
                    style={{...g,padding:"14px 16px",borderRadius:14,cursor:"pointer",
                      border:`1px solid ${isSel?"rgba(139,92,246,0.5)":isApplied?"rgba(16,185,129,0.25)":"rgba(255,255,255,0.07)"}`,
                      background:isSel?"rgba(99,102,241,0.1)":isApplied?"rgba(16,185,129,0.04)":"rgba(255,255,255,0.025)",
                      boxShadow:isSel?"0 0 30px rgba(99,102,241,0.2),inset 0 1px 0 rgba(255,255,255,0.07)":"0 4px 24px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.04)",
                      animationDelay:`${i*0.04}s`,position:"relative",overflow:"hidden"}}>
                    {isSel&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:"linear-gradient(180deg,#818cf8,#34d399,#818cf8)",backgroundSize:"100% 200%",animation:"meshMove 3s ease infinite"}}/>}
                    {isApplied&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:"#10b981"}}/>}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                      <div style={{fontWeight:600,fontSize:12.5,color:isSel?"#e2e8f0":"rgba(255,255,255,0.78)",lineHeight:1.35,flex:1,marginRight:8}}>{job.title}</div>
                      <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
                        {isApplied&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:"rgba(16,185,129,0.12)",color:"#6ee7b7",border:"1px solid rgba(16,185,129,0.25)"}}>✓ Applied</span>}
                        {sc2&&<div style={{fontSize:10,fontWeight:800,color:sc2,background:`${sc2}15`,padding:"2px 8px",borderRadius:20,border:`1px solid ${sc2}35`,boxShadow:`0 0 10px ${sc2}25`}}>{job.matchScore}%</div>}
                      </div>
                    </div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:7}}>{job.company} · {job.location}</div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                      {job.isRemote&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:"rgba(16,185,129,0.1)",color:"#6ee7b7",border:"1px solid rgba(16,185,129,0.2)"}}>Remote</span>}
                      <span style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:"rgba(99,102,241,0.08)",color:"rgba(167,139,250,0.7)",border:"1px solid rgba(99,102,241,0.15)"}}>{job.contractType}</span>
                      {job.salary!=="Not listed"&&<span style={{fontSize:9,color:"rgba(255,255,255,0.28)"}}>{job.salary}</span>}
                      <span style={{fontSize:9,color:"rgba(255,255,255,0.18)",marginLeft:"auto"}}>{timeAgo(job.postedAt)}</span>
                    </div>
                  </div>
                );
              })}

              {!searching&&!hasSearched&&(
                <div style={{...g,padding:30,textAlign:"center"}}>
                  <div style={{fontSize:40,marginBottom:12,opacity:0.5}}>⚡</div>
                  <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.3)",marginBottom:4}}>Ready to Hunt</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.15)"}}>Pick a preset and fire</div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{flex:1,minWidth:0,overflowY:"auto",paddingBottom:20}}>
            {!selectedJob?(
              <div style={{...g,height:"100%",minHeight:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:56,background:"rgba(99,102,241,0.03)"}} className="fadeUp">
                <div style={{width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))",border:"1px solid rgba(139,92,246,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,marginBottom:22,boxShadow:"0 0 60px rgba(99,102,241,0.2)",animation:"float 4s ease-in-out infinite"}}>⚡</div>
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:24,marginBottom:10,letterSpacing:"-0.04em",background:"linear-gradient(135deg,#c4b5fd,#a5f3fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Select a job to begin</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.25)",maxWidth:360,lineHeight:1.85}}>AI scores your match, tailors your resume, writes a cover letter, preps interview tips, and drafts cold outreach — instantly.</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:30,width:"100%",maxWidth:520}}>
                  {[{ic:"🎯",l:"Match Score",c:"#818cf8"},{ic:"📄",l:"Resume Builder",c:"#6ee7b7"},{ic:"✉",l:"Cold Outreach",c:"#f9a8d4"},{ic:"⚡",l:"Auto-Fill",c:"#fcd34d"}].map(f=>(
                    <div key={f.l} style={{...g,padding:"14px 8px",textAlign:"center",borderRadius:14,background:`linear-gradient(135deg,${f.c}08,transparent)`}}>
                      <div style={{fontSize:22,marginBottom:6}}>{f.ic}</div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",fontWeight:500}}>{f.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ):(
              <div className="fadeUp">

                {/* Job Header */}
                <div style={{...g,padding:"20px 24px",marginBottom:14,background:"rgba(99,102,241,0.04)"}} className="glow-border">
                  <div style={{display:"flex",gap:18,alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:20,color:"#f1f5f9",letterSpacing:"-0.04em",marginBottom:4,lineHeight:1.25}}>{selectedJob.title}</div>
                      <div style={{fontSize:13,color:"rgba(255,255,255,0.38)",marginBottom:12}}>{selectedJob.company} · {selectedJob.location}</div>

                      {/* Meta badges */}
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                        {[
                          {l:selectedJob.salary,c:"#6ee7b7",bg:"rgba(16,185,129,0.08)",border:"rgba(16,185,129,0.2)"},
                          {l:selectedJob.contractType,c:"#c4b5fd",bg:"rgba(139,92,246,0.08)",border:"rgba(139,92,246,0.2)"},
                          {l:selectedJob.isRemote?"🌍 Remote":"📍 On-site",c:selectedJob.isRemote?"#a5f3fc":"rgba(255,255,255,0.35)",bg:selectedJob.isRemote?"rgba(6,182,212,0.08)":"rgba(255,255,255,0.04)",border:selectedJob.isRemote?"rgba(6,182,212,0.2)":"rgba(255,255,255,0.07)"},
                          {l:`Exp: ${selectedJob.requiredExp}`,c:"rgba(255,255,255,0.4)",bg:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)"},
                          {l:`Sponsorship: ${selectedJob.sponsorship}`,c:"#fcd34d",bg:"rgba(251,191,36,0.07)",border:"rgba(251,191,36,0.2)"},
                        ].filter(b=>b.l&&b.l!=="Not listed"&&b.l!=="See posting").map((b,i)=>(
                          <span key={i} style={{fontSize:10,padding:"3px 10px",borderRadius:20,background:b.bg,color:b.c,border:`1px solid ${b.border}`,boxShadow:`0 0 12px ${b.bg}`}}>{b.l}</span>
                        ))}
                      </div>

                      {/* Action links */}
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                        {selectedJob.applyUrl&&(
                          <a href={selectedJob.applyUrl} target="_blank" rel="noopener noreferrer"
                            onClick={()=>setTimeout(()=>setShowAppliedPrompt(true),2000)}
                            className="apply-link"
                            style={{fontSize:11,fontWeight:700,padding:"6px 16px",borderRadius:20,display:"inline-flex",alignItems:"center",gap:5,border:"1px solid",transition:"all .2s"}}>
                            ↗ Apply on {selectedJob.source}
                          </a>
                        )}
                        <a href={linkedinCompanyUrl(selectedJob.company)} target="_blank" rel="noopener noreferrer"
                          style={{fontSize:11,padding:"6px 13px",borderRadius:20,background:"rgba(10,102,194,0.1)",border:"1px solid rgba(10,102,194,0.25)",color:"#93c5fd"}}>🔗 Company</a>
                        <a href={linkedinRecruiterUrl(selectedJob.company)} target="_blank" rel="noopener noreferrer"
                          style={{fontSize:11,padding:"6px 13px",borderRadius:20,background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.22)",color:"#c4b5fd"}}>👤 Recruiter</a>
                      </div>
                    </div>

                    {/* Score ring */}
                    <div style={{textAlign:"center",flexShrink:0}}>
                      {analyzing?(
                        <div style={{width:84,height:84,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <div style={{width:28,height:28,border:"2.5px solid rgba(99,102,241,0.2)",borderTopColor:"#818cf8",borderRadius:"50%",display:"inline-block"}} className="spin"/>
                        </div>
                      ):analysis?(
                        <>
                          <svg width="84" height="84" style={{transform:"rotate(-90deg)"}}>
                            <circle cx="42" cy="42" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7"/>
                            <circle cx="42" cy="42" r="34" fill="none" stroke={sc} strokeWidth="7"
                              strokeDasharray={`${2*Math.PI*34}`}
                              strokeDashoffset={`${2*Math.PI*34*(1-analysis.matchScore/100)}`}
                              strokeLinecap="round"
                              style={{filter:`drop-shadow(0 0 10px ${sc})`,transition:"stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)"}}/>
                          </svg>
                          <div style={{marginTop:-60,marginBottom:32,textAlign:"center"}}>
                            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:19,color:sc,lineHeight:1,textShadow:`0 0 20px ${sc}`}}>{analysis.matchScore}</div>
                            <div style={{fontSize:8,color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em"}}>MATCH</div>
                          </div>
                        </>
                      ):null}
                    </div>
                  </div>

                  {/* Applied prompt */}
                  {showAppliedPrompt&&(
                    <div className="applied-banner fadeUp" style={{marginTop:14,padding:"13px 18px",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:12,display:"flex",alignItems:"center",gap:12}}>
                      <div style={{fontSize:20}}>🎯</div>
                      <div style={{flex:1,fontSize:12.5,color:"rgba(255,255,255,0.75)",fontWeight:500}}>Did you apply? Save everything to your tracker — resume, cover letter, interview tips.</div>
                      <button onClick={handleAppliedClick} style={{background:"linear-gradient(135deg,#10b981,#059669)",border:"none",borderRadius:10,color:"#fff",fontSize:12,fontWeight:800,padding:"8px 20px",whiteSpace:"nowrap",boxShadow:"0 0 30px rgba(16,185,129,0.3)"}}>✓ Yes, Saved!</button>
                      <button onClick={()=>setActiveView("tracker")} style={{background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:10,color:"#c4b5fd",fontSize:11,padding:"8px 12px",whiteSpace:"nowrap"}}>View Tracker</button>
                      <button onClick={()=>setShowAppliedPrompt(false)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,color:"rgba(255,255,255,0.3)",fontSize:11,padding:"8px 12px"}}>✕</button>
                    </div>
                  )}

                  {analyzing&&(
                    <div style={{marginTop:12,padding:"10px 14px",background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
                      <span style={{width:13,height:13,border:"2px solid rgba(99,102,241,0.2)",borderTopColor:"#818cf8",borderRadius:"50%",display:"inline-block"}} className="spin"/>
                      <span style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>AI analyzing your fit · Tailoring resume · Writing cover letter...</span>
                    </div>
                  )}
                  {error&&<div style={{marginTop:8,padding:"8px 12px",background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:8,fontSize:11,color:"#fca5a5"}}>⚠ {error}</div>}
                </div>

                {/* Analysis Tabs */}
                {(analysis||analysisTab==="jd")&&(
                  <>
                    <div style={{display:"flex",gap:2,...g,padding:4,borderRadius:14,marginBottom:14,overflowX:"auto",background:"rgba(255,255,255,0.025)"}}>
                      {ANALYSIS_TABS.map(t=>(
                        <button key={t.id} onClick={()=>setAnalysisTab(t.id)}
                          className={analysisTab===t.id?"tab-btn tab-active":"tab-btn"}
                          style={{flex:1,minWidth:58,padding:"8px 4px",background:"transparent",border:"1px solid transparent",borderRadius:10,color:analysisTab===t.id?"#c4b5fd":"rgba(255,255,255,0.28)",fontSize:9.5,fontWeight:analysisTab===t.id?700:400,transition:"all .15s",whiteSpace:"nowrap"}}>
                          <div style={{fontSize:11,marginBottom:2}}>{t.ic}</div>{t.l}
                        </button>
                      ))}
                    </div>

                    {/* JD TAB */}
                    {analysisTab==="jd"&&(
                      <div className="fadeUp">
                        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
                          {[{l:"Job Type",v:selectedJob.jobType,ic:"💼",c:"#818cf8"},{l:"Contract",v:selectedJob.contractType,ic:"📋",c:"#c4b5fd"},{l:"Location",v:selectedJob.isRemote?"Remote":selectedJob.location,ic:"📍",c:"#6ee7b7"},{l:"Salary",v:selectedJob.salary,ic:"💰",c:"#6ee7b7"},{l:"Experience",v:selectedJob.requiredExp,ic:"⏱",c:"#fcd34d"},{l:"Sponsorship",v:selectedJob.sponsorship,ic:"🛂",c:"#fcd34d"}].map(m=>(
                            <div key={m.l} style={{...g,padding:"14px 16px",borderRadius:14,background:`linear-gradient(135deg,${m.c}06,transparent)`}}>
                              <div style={{fontSize:20,marginBottom:6}}>{m.ic}</div>
                              <div style={{fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"0.1em",marginBottom:4}}>{m.l.toUpperCase()}</div>
                              <div style={{fontSize:12.5,fontWeight:600,color:"rgba(255,255,255,0.72)"}}>{m.v||"N/A"}</div>
                            </div>
                          ))}
                        </div>
                        {selectedJob.skills?.length>0&&(
                          <div style={{...g,padding:"14px 18px",marginBottom:12}}>
                            <div style={{fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"0.15em",marginBottom:10}}>MATCHED SKILLS IN JD</div>
                            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                              {selectedJob.skills.map((s,i)=><span key={s} className="tag-pop" style={{fontSize:11,padding:"4px 12px",borderRadius:20,background:"rgba(99,102,241,0.1)",color:"#c4b5fd",border:"1px solid rgba(99,102,241,0.2)",boxShadow:"0 0 12px rgba(99,102,241,0.1)",animationDelay:`${i*0.05}s`}}>{s}</span>)}
                            </div>
                          </div>
                        )}
                        <div style={{...g,padding:"18px 22px"}}>
                          <div style={{fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"0.15em",marginBottom:14}}>FULL JOB DESCRIPTION</div>
                          <div style={{fontSize:12.5,color:"rgba(255,255,255,0.48)",lineHeight:1.95,whiteSpace:"pre-wrap",maxHeight:420,overflowY:"auto"}}>{selectedJob.description||"Visit the job posting for the full description."}</div>
                          {selectedJob.applyUrl&&<a href={selectedJob.applyUrl} target="_blank" rel="noopener noreferrer" className="apply-link" style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:16,fontSize:12,fontWeight:700,padding:"9px 20px",borderRadius:20,border:"1px solid"}}>↗ View Full Posting on {selectedJob.source}</a>}
                        </div>
                      </div>
                    )}

                    {/* AI ANALYSIS TAB */}
                    {analysisTab==="overview"&&analysis&&(
                      <div className="fadeUp">
                        <div style={{...g,padding:"18px 20px",marginBottom:11,background:"rgba(99,102,241,0.04)"}}>
                          <div style={{fontSize:9,letterSpacing:"0.15em",color:"rgba(255,255,255,0.22)",marginBottom:11}}>TAILORED SUMMARY</div>
                          <p style={{fontSize:13,lineHeight:1.9,color:"rgba(255,255,255,0.65)"}}>{analysis.tailoredSummary}</p>
                          <button onClick={()=>copy(analysis.tailoredSummary,"sum")} style={{marginTop:11,background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:8,color:"#c4b5fd",fontSize:11,padding:"5px 13px"}}>{copied==="sum"?"✓ Copied":"Copy"}</button>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,marginBottom:11}}>
                          <div style={{...g,padding:"14px 16px",background:"rgba(16,185,129,0.04)"}}>
                            <div style={{fontSize:9,color:"#6ee7b7",letterSpacing:"0.15em",marginBottom:9}}>✓ SKILLS MATCHED</div>
                            {analysis.skillsMatched?.map(s=><div key={s} style={{fontSize:11.5,color:"rgba(255,255,255,0.5)",marginBottom:6,display:"flex",gap:7,alignItems:"center"}}><span style={{width:5,height:5,borderRadius:"50%",background:"#6ee7b7",flexShrink:0,boxShadow:"0 0 6px #6ee7b7"}}/>{s}</div>)}
                          </div>
                          <div style={{...g,padding:"14px 16px",background:"rgba(251,191,36,0.04)"}}>
                            <div style={{fontSize:9,color:"#fcd34d",letterSpacing:"0.15em",marginBottom:9}}>△ GAPS TO BRIDGE</div>
                            {analysis.skillsGap?.length>0?analysis.skillsGap.map(s=><div key={s} style={{fontSize:11.5,color:"rgba(255,255,255,0.5)",marginBottom:6,display:"flex",gap:7,alignItems:"center"}}><span style={{width:5,height:5,borderRadius:"50%",background:"#fcd34d",flexShrink:0}}/>{s}</div>):<div style={{fontSize:12,color:"rgba(255,255,255,0.2)"}}>No significant gaps! 🎉</div>}
                          </div>
                        </div>
                        <div style={{...g,padding:"14px 16px"}}>
                          <div style={{fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"0.15em",marginBottom:9}}>KEY INSIGHTS</div>
                          {analysis.keyInsights?.map((ins,i)=><div key={i} style={{fontSize:12.5,color:"rgba(255,255,255,0.52)",marginBottom:8,paddingLeft:12,borderLeft:"2px solid rgba(99,102,241,0.35)",lineHeight:1.75}}>{ins}</div>)}
                        </div>
                      </div>
                    )}

                    {/* BULLETS TAB */}
                    {analysisTab==="resume"&&analysis&&(
                      <div className="fadeUp">
                        {analysis.tailoredBullets?.map((b,i)=>(
                          <div key={i} style={{...g,padding:"15px 18px",marginBottom:10}}>
                            <div style={{fontSize:9,color:"#818cf8",letterSpacing:"0.15em",marginBottom:8}}>{(b.company||"").toUpperCase()}</div>
                            <div style={{marginBottom:9}}><div style={{fontSize:9,color:"rgba(255,255,255,0.2)",marginBottom:3}}>ORIGINAL</div><div style={{fontSize:11,color:"rgba(255,255,255,0.25)",lineHeight:1.7,fontStyle:"italic"}}>— {b.original}</div></div>
                            <div style={{borderTop:"1px solid rgba(99,102,241,0.15)",paddingTop:9}}><div style={{fontSize:9,color:"#6ee7b7",marginBottom:3}}>TAILORED ↗</div><div style={{fontSize:12.5,color:"rgba(255,255,255,0.78)",lineHeight:1.8}}>→ {b.tailored}</div></div>
                            <button onClick={()=>copy(b.tailored,`b${i}`)} style={{marginTop:9,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:7,color:"#c4b5fd",fontSize:11,padding:"4px 12px"}}>{copied===`b${i}`?"✓ Copied":"Copy"}</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* RESUME BUILDER TAB */}
                    {analysisTab==="builder"&&(
                      <div className="fadeUp">
                        {rbStep==="intro"&&(
                          <div style={{...g,padding:"36px",textAlign:"center",background:"rgba(99,102,241,0.04)"}}>
                            <div style={{fontSize:44,marginBottom:16}}>📄</div>
                            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:20,marginBottom:8,background:"linear-gradient(135deg,#c4b5fd,#a5f3fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Build Tailored Resume</div>
                            <div style={{fontSize:13,color:"rgba(255,255,255,0.32)",lineHeight:1.85,marginBottom:22,maxWidth:380,margin:"0 auto 22px"}}>AI asks 4 smart questions for this specific role, then generates a complete ATS-optimized resume ready to download.</div>
                            <button onClick={generateRbQuestions} disabled={rbLoading} className="hunt-btn"
                              style={{borderRadius:12,color:"#fff",fontSize:13,fontWeight:700,padding:"11px 32px",display:"inline-flex",alignItems:"center",gap:8}}>
                              {rbLoading?<><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block"}} className="spin"/>Generating questions...</>:"⟡ Start Resume Builder"}
                            </button>
                          </div>
                        )}
                        {rbStep==="questions"&&<div style={{...g,padding:40,textAlign:"center"}}><span style={{width:28,height:28,border:"3px solid rgba(99,102,241,0.2)",borderTopColor:"#818cf8",borderRadius:"50%",display:"inline-block",marginBottom:12}} className="spin"/><div style={{fontSize:12,color:"rgba(255,255,255,0.38)"}}>Analyzing JD and preparing questions...</div></div>}
                        {rbStep==="answering"&&(
                          <div>
                            {rbQuestions.map((q,i)=>(
                              <div key={q.id} style={{...g,padding:"16px 18px",marginBottom:11}}>
                                <div style={{display:"flex",gap:10,marginBottom:10}}>
                                  <div style={{width:24,height:24,borderRadius:7,background:"linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))",border:"1px solid rgba(139,92,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:10,color:"#c4b5fd",flexShrink:0,boxShadow:"0 0 12px rgba(99,102,241,0.2)"}}>{i+1}</div>
                                  <div><div style={{fontSize:12.5,fontWeight:600,color:"rgba(255,255,255,0.82)",lineHeight:1.5,marginBottom:3}}>{q.question}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.25)",fontStyle:"italic"}}>{q.why}</div></div>
                                </div>
                                <textarea value={rbAnswers[q.id]||""} onChange={e=>setRbAnswers(p=>({...p,[q.id]:e.target.value}))} placeholder={q.placeholder} rows={2}
                                  style={{width:"100%",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"rgba(255,255,255,0.72)",fontSize:12,padding:"9px 12px",lineHeight:1.6,resize:"vertical"}}/>
                              </div>
                            ))}
                            <div style={{display:"flex",gap:8}}>
                              <button onClick={()=>setRbStep("intro")} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:12,color:"rgba(255,255,255,0.38)",fontSize:12,padding:"10px 16px"}}>← Back</button>
                              <button onClick={buildTailoredResume} className="hunt-btn" style={{flex:1,borderRadius:12,color:"#fff",fontSize:13,fontWeight:700,padding:"10px 0",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                                {rbLoading?<><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block"}} className="spin"/>Building...</>:"⟡ Build My Tailored Resume →"}
                              </button>
                            </div>
                          </div>
                        )}
                        {rbStep==="building"&&<div style={{...g,padding:50,textAlign:"center"}}><span style={{width:36,height:36,border:"3px solid rgba(99,102,241,0.2)",borderTopColor:"#818cf8",borderRadius:"50%",display:"inline-block",marginBottom:16}} className="spin"/><div style={{fontSize:14,fontWeight:600,color:"rgba(255,255,255,0.6)",marginBottom:5}}>Building ATS-optimized resume...</div><div style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>Tailoring every bullet · Matching JD keywords · Formatting</div></div>}
                        {rbStep==="done"&&rbResume&&(
                          <div className="fadeUp">
                            <div style={{...g,padding:"14px 18px",marginBottom:14,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",background:"rgba(16,185,129,0.05)"}}>
                              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"#6ee7b7",marginBottom:1}}>✅ Resume Ready to Download!</div><div style={{fontSize:10,color:"rgba(255,255,255,0.28)"}}>Tailored for {selectedJob.title} at {selectedJob.company}</div></div>
                              <div style={{display:"flex",gap:5}}>
                                {["pdf","csv"].map(f=><button key={f} onClick={()=>setRbFormat(f)} className={rbFormat===f?"pill-active":""} style={{padding:"5px 14px",borderRadius:20,fontSize:11,fontWeight:600,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.38)",transition:"all .15s"}}>{f.toUpperCase()}</button>)}
                              </div>
                              <button onClick={()=>rbFormat==="pdf"?generateResumePDF(rbResume,selectedJob.company):null} className="hunt-btn" style={{borderRadius:10,color:"#fff",fontSize:12,fontWeight:800,padding:"9px 20px"}}>⬇ Download</button>
                              <button onClick={()=>setRbStep("answering")} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,color:"rgba(255,255,255,0.3)",fontSize:11,padding:"9px 12px"}}>Redo</button>
                            </div>
                            <div style={{...g,padding:"26px 30px"}}>
                              <div style={{borderBottom:"1px solid rgba(99,102,241,0.15)",paddingBottom:16,marginBottom:18}}>
                                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:21,color:"#f1f5f9",marginBottom:3}}>{rbResume.name}</div>
                                <div style={{fontSize:12.5,color:"#818cf8",fontWeight:600,marginBottom:8}}>{rbResume.title}</div>
                                <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",display:"flex",gap:10,flexWrap:"wrap"}}>{[rbResume.contact?.email,rbResume.contact?.phone,rbResume.contact?.location,rbResume.contact?.linkedin,rbResume.contact?.github].filter(Boolean).map((c,i)=><span key={i}>{i>0&&<span style={{opacity:.3,marginRight:8}}>|</span>}{c}</span>)}</div>
                              </div>
                              <div style={{marginBottom:16}}><div style={{fontSize:8,color:"rgba(255,255,255,0.2)",letterSpacing:"0.16em",marginBottom:8,borderBottom:"1px solid rgba(99,102,241,0.1)",paddingBottom:5}}>PROFESSIONAL SUMMARY</div><p style={{fontSize:12,lineHeight:1.85,color:"rgba(255,255,255,0.52)"}}>{rbResume.summary}</p></div>
                              <div style={{marginBottom:16}}>
                                <div style={{fontSize:8,color:"rgba(255,255,255,0.2)",letterSpacing:"0.16em",marginBottom:12,borderBottom:"1px solid rgba(99,102,241,0.1)",paddingBottom:5}}>EXPERIENCE</div>
                                {rbResume.experience?.map((exp,i)=><div key={i} style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><div style={{fontWeight:700,fontSize:12.5,color:"#e2e8f0"}}>{exp.title}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.25)"}}>{exp.dates}</div></div><div style={{fontSize:11,color:"#818cf8",fontWeight:600,marginBottom:7}}>{exp.company}</div>{exp.bullets?.map((b,j)=><div key={j} style={{fontSize:11.5,color:"rgba(255,255,255,0.48)",lineHeight:1.75,marginBottom:5,paddingLeft:14,position:"relative"}}><span style={{position:"absolute",left:0,color:"rgba(99,102,241,0.5)"}}>•</span>{b}</div>)}</div>)}
                              </div>
                              <div style={{marginBottom:14}}><div style={{fontSize:8,color:"rgba(255,255,255,0.2)",letterSpacing:"0.16em",marginBottom:9,borderBottom:"1px solid rgba(99,102,241,0.1)",paddingBottom:5}}>SKILLS</div>{rbResume.skillGroups?.map((sg,i)=><div key={i} style={{fontSize:11.5,color:"rgba(255,255,255,0.45)",marginBottom:5}}><strong style={{color:"rgba(255,255,255,0.62)"}}>{sg.category}:</strong> {sg.skills}</div>)}</div>
                              <div style={{marginBottom:14}}><div style={{fontSize:8,color:"rgba(255,255,255,0.2)",letterSpacing:"0.16em",marginBottom:9,borderBottom:"1px solid rgba(99,102,241,0.1)",paddingBottom:5}}>EDUCATION</div>{rbResume.education?.map((e,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"rgba(255,255,255,0.48)",marginBottom:4}}><span>{e.degree} — {e.school}</span><span>{e.year}</span></div>)}</div>
                              {rbResume.certifications?.length>0&&<div><div style={{fontSize:8,color:"rgba(255,255,255,0.2)",letterSpacing:"0.16em",marginBottom:9,borderBottom:"1px solid rgba(99,102,241,0.1)",paddingBottom:5}}>CERTIFICATIONS</div>{rbResume.certifications.map((c,i)=><div key={i} style={{fontSize:12,color:"rgba(255,255,255,0.48)",marginBottom:4}}>• {c}</div>)}</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* COVER LETTER TAB */}
                    {analysisTab==="cover"&&analysis&&(
                      <div className="fadeUp">
                        <div style={{...g,padding:"22px 26px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
                            <div style={{fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"0.15em"}}>COVER LETTER</div>
                            <button onClick={()=>copy(analysis.coverLetter,"cl")} style={{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.22)",borderRadius:8,color:"#6ee7b7",fontSize:11,fontWeight:600,padding:"5px 14px"}}>{copied==="cl"?"✓ Copied":"Copy Letter"}</button>
                          </div>
                          <div style={{fontSize:13,lineHeight:2.05,color:"rgba(255,255,255,0.6)",whiteSpace:"pre-wrap",borderLeft:"2px solid rgba(16,185,129,0.2)",paddingLeft:18}}>{analysis.coverLetter}</div>
                        </div>
                      </div>
                    )}

                    {/* INTERVIEW TAB */}
                    {analysisTab==="interview"&&analysis&&(
                      <div className="fadeUp">
                        {analysis.interviewTips?.map((tip,i)=>(
                          <div key={i} style={{...g,padding:"14px 16px",marginBottom:9,display:"flex",gap:12,alignItems:"flex-start"}}>
                            <div style={{width:28,height:28,borderRadius:8,flexShrink:0,background:`linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))`,border:"1px solid rgba(139,92,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,color:"#c4b5fd",boxShadow:"0 0 16px rgba(99,102,241,0.15)"}}>{i+1}</div>
                            <div style={{fontSize:12.5,color:"rgba(255,255,255,0.62)",lineHeight:1.8}}>{tip}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* OUTREACH TAB */}
                    {analysisTab==="outreach"&&(
                      <div className="fadeUp">
                        <div style={{...g,padding:"16px 18px",marginBottom:12}}>
                          <div style={{fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"0.15em",marginBottom:10}}>STEP 1 — FIND THE RECRUITER</div>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                            <a href={linkedinCompanyUrl(selectedJob.company)} target="_blank" rel="noopener noreferrer" style={{fontSize:12,fontWeight:600,padding:"7px 16px",borderRadius:20,background:"rgba(10,102,194,0.1)",border:"1px solid rgba(10,102,194,0.28)",color:"#93c5fd"}}>🔗 {selectedJob.company} on LinkedIn</a>
                            <a href={linkedinRecruiterUrl(selectedJob.company)} target="_blank" rel="noopener noreferrer" style={{fontSize:12,fontWeight:600,padding:"7px 16px",borderRadius:20,background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.22)",color:"#c4b5fd"}}>👤 Find Recruiters</a>
                          </div>
                          <div style={{fontSize:10,color:"rgba(255,255,255,0.22)",padding:"8px 12px",background:"rgba(255,255,255,0.03)",borderRadius:9,border:"1px solid rgba(255,255,255,0.06)",lineHeight:1.7}}>💡 Use <strong style={{color:"rgba(255,255,255,0.45)"}}>hunter.io</strong> or <strong style={{color:"rgba(255,255,255,0.45)"}}>apollo.io</strong> (free) to find their work email after finding their name on LinkedIn.</div>
                        </div>
                        <div style={{...g,padding:"16px 18px",marginBottom:12}}>
                          <div style={{fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"0.15em",marginBottom:10}}>STEP 2 — GENERATE EMAIL</div>
                          <div style={{display:"flex",gap:8}}>
                            <input value={recruiterName} onChange={e=>setRecruiterName(e.target.value)} placeholder="Recruiter name (optional)"
                              style={{flex:1,background:"rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,color:"rgba(255,255,255,0.72)",fontSize:12,padding:"9px 13px"}}/>
                            <button onClick={generateColdEmail} disabled={coldEmailLoading}
                              style={{background:coldEmailLoading?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#7c3aed,#5b21b6)",border:"none",borderRadius:10,color:coldEmailLoading?"rgba(255,255,255,0.25)":"#fff",fontSize:12,fontWeight:700,padding:"9px 18px",display:"flex",alignItems:"center",gap:6,boxShadow:coldEmailLoading?"none":"0 0 20px rgba(124,58,237,0.35)"}}>
                              {coldEmailLoading?<><span style={{width:12,height:12,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block"}} className="spin"/>...</>:"✉ Generate"}
                            </button>
                          </div>
                        </div>
                        {coldEmail&&(
                          <div className="fadeUp">
                            <div style={{...g,padding:"17px 19px",marginBottom:10,background:"rgba(139,92,246,0.04)"}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:11}}>
                                <div style={{fontSize:9,color:"#c4b5fd",letterSpacing:"0.15em"}}>COLD EMAIL</div>
                                <button onClick={()=>copy(`Subject: ${coldEmail.subject}\n\n${coldEmail.body}`,"ce")} style={{background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.22)",borderRadius:7,color:"#c4b5fd",fontSize:11,padding:"3px 12px"}}>{copied==="ce"?"✓ Copied":"Copy"}</button>
                              </div>
                              <div style={{padding:"8px 12px",background:"rgba(139,92,246,0.07)",borderRadius:9,marginBottom:11,border:"1px solid rgba(139,92,246,0.15)"}}><div style={{fontSize:9,color:"rgba(255,255,255,0.22)",marginBottom:2}}>SUBJECT LINE</div><div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.82)"}}>{coldEmail.subject}</div></div>
                              <div style={{fontSize:13,lineHeight:1.95,color:"rgba(255,255,255,0.58)",whiteSpace:"pre-wrap",borderLeft:"2px solid rgba(139,92,246,0.25)",paddingLeft:14}}>{coldEmail.body}</div>
                            </div>
                            <div style={{...g,padding:"14px 17px",marginBottom:10}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}><div style={{fontSize:9,color:"#fcd34d",letterSpacing:"0.15em"}}>FOLLOW-UP (1 WEEK)</div><button onClick={()=>copy(`Subject: ${coldEmail.followUpSubject}\n\n${coldEmail.followUpBody}`,"fu")} style={{background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.18)",borderRadius:7,color:"#fcd34d",fontSize:11,padding:"3px 11px"}}>{copied==="fu"?"✓":"Copy"}</button></div>
                              <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.62)",marginBottom:6}}>{coldEmail.followUpSubject}</div>
                              <div style={{fontSize:12,color:"rgba(255,255,255,0.42)",lineHeight:1.75}}>{coldEmail.followUpBody}</div>
                            </div>
                            <div style={{...g,padding:"13px 15px"}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><div style={{fontSize:9,color:"#93c5fd",letterSpacing:"0.15em"}}>LINKEDIN CONNECTION NOTE</div><button onClick={()=>copy(coldEmail.linkedinNote,"ln")} style={{background:"rgba(96,165,250,0.07)",border:"1px solid rgba(96,165,250,0.18)",borderRadius:7,color:"#93c5fd",fontSize:11,padding:"3px 11px"}}>{copied==="ln"?"✓":"Copy"}</button></div>
                              <div style={{fontSize:12.5,color:"rgba(255,255,255,0.55)",fontStyle:"italic"}}>"{coldEmail.linkedinNote}"</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AUTOFILL TAB */}
                    {analysisTab==="autofill"&&(
                      <div className="fadeUp">
                        <div style={{...g,padding:"20px 22px",marginBottom:12,background:"rgba(99,102,241,0.04)"}}>
                          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:16,color:"#f1f5f9",marginBottom:6}}>Auto-Fill Application</div>
                          <div style={{fontSize:12.5,color:"rgba(255,255,255,0.35)",lineHeight:1.75,marginBottom:16}}>AI fills all {FORM_FIELDS.length} fields for <strong style={{color:"rgba(255,255,255,0.6)"}}>{selectedJob.title}</strong> at <strong style={{color:"rgba(255,255,255,0.6)"}}>{selectedJob.company}</strong>. Review and edit everything. Confirming saves automatically to your tracker.</div>
                          <div style={{display:"flex",gap:10}}>
                            <button onClick={runAutofill} disabled={autofillLoading} className="hunt-btn"
                              style={{borderRadius:12,color:autofillLoading?"rgba(255,255,255,0.2)":"#fff",fontSize:13,fontWeight:700,padding:"11px 24px",display:"flex",alignItems:"center",gap:8}}>
                              {autofillLoading?<><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block"}} className="spin"/>Filling fields...</>:"⚡ Generate Auto-Fill"}
                            </button>
                            {selectedJob.applyUrl&&<a href={selectedJob.applyUrl} target="_blank" rel="noopener noreferrer" className="apply-link" style={{fontSize:12,fontWeight:600,padding:"11px 18px",borderRadius:12,border:"1px solid",display:"inline-flex",alignItems:"center"}}>↗ Open Posting</a>}
                          </div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                          {[{n:"1",t:"AI Fills",d:"Every field tailored to this role",c:"#818cf8"},{n:"2",t:"You Review",d:"Edit any field freely",c:"#6ee7b7"},{n:"3",t:"Auto-Saved",d:"Saves to tracker with all AI content",c:"#f9a8d4"}].map(s=>(
                            <div key={s.n} style={{...g,padding:"14px 16px",background:`linear-gradient(135deg,${s.c}06,transparent)`}}>
                              <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:22,color:s.c,marginBottom:5,textShadow:`0 0 20px ${s.c}60`}}>{s.n}</div>
                              <div style={{fontWeight:600,fontSize:12,color:"#f1f5f9",marginBottom:3}}>{s.t}</div>
                              <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",lineHeight:1.6}}>{s.d}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TRACKER VIEW ══ */}
      {activeView==="tracker"&&(
        <div style={{maxWidth:1440,margin:"0 auto",padding:"22px 20px",position:"relative",zIndex:2}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}} className="fadeUp">
            {[{l:"Total Applied",v:stats.total,c:"#818cf8",cg:"rgba(99,102,241,0.15)",ic:"📋"},{l:"Interviews",v:stats.interview,c:"#c4b5fd",cg:"rgba(139,92,246,0.12)",ic:"🎯"},{l:"Offers",v:stats.offer,c:"#6ee7b7",cg:"rgba(16,185,129,0.1)",ic:"🎉"},{l:"Response Rate",v:stats.total>0?`${Math.round((stats.interview+stats.offer)/stats.total*100)}%`:"—",c:"#fcd34d",cg:"rgba(251,191,36,0.08)",ic:"📈"}].map((s,i)=>(
              <div key={s.l} className="stat-card" style={{...g,padding:"18px 20px",background:`linear-gradient(135deg,${s.cg},transparent)`,border:`1px solid ${s.c}20`,transition:"all .2s",cursor:"default"}}>
                <div style={{fontSize:24,marginBottom:7}}>{s.ic}</div>
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:30,color:s.c,lineHeight:1,textShadow:`0 0 30px ${s.c}50`}}>{s.v}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",marginTop:5,letterSpacing:"0.05em"}}>{s.l}</div>
              </div>
            ))}
          </div>

          {applications.length===0?(
            <div style={{...g,padding:70,textAlign:"center"}} className="fadeUp">
              <div style={{fontSize:56,marginBottom:18}}>📋</div>
              <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:22,marginBottom:10,background:"linear-gradient(135deg,#c4b5fd,#a5f3fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>No applications yet</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.25)",marginBottom:24,lineHeight:1.8}}>Hunt jobs, analyze them, click "I Applied!" to save everything here.</div>
              <button onClick={()=>setActiveView("search")} className="hunt-btn" style={{borderRadius:14,color:"#fff",fontSize:13,fontWeight:800,padding:"12px 28px",display:"inline-flex",alignItems:"center",gap:8}}>⚡ Start Hunting</button>
            </div>
          ):(
            <div style={{display:"flex",gap:18}}>
              <div style={{width:420,flexShrink:0}}>
                <div style={{display:"flex",gap:5,marginBottom:11,flexWrap:"wrap"}}>
                  {["all",...Object.keys(STATUS_CONFIG)].map(s=>(
                    <button key={s} onClick={()=>setStatusFilter(s)}
                      className={statusFilter===s?"pill-active":""}
                      style={{padding:"4px 12px",borderRadius:20,fontSize:10,fontWeight:500,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.35)",transition:"all .15s"}}>
                      {s==="all"?`All (${applications.length})`:`${STATUS_CONFIG[s].label} (${applications.filter(a=>a.status===s).length})`}
                    </button>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:"calc(100vh - 260px)",overflowY:"auto",paddingRight:3}}>
                  {filteredApps.map((app,i)=>{
                    const st=STATUS_CONFIG[app.status]||STATUS_CONFIG.applied;
                    const isSel=selectedApp?.id===app.id;
                    return(
                      <div key={app.id} className="job-card fadeUp" onClick={()=>{setSelectedApp(app);setAppDetailTab("overview");}}
                        style={{...g,padding:"13px 15px",borderRadius:14,cursor:"pointer",
                          border:`1px solid ${isSel?"rgba(139,92,246,0.45)":"rgba(255,255,255,0.07)"}`,
                          background:isSel?"rgba(99,102,241,0.08)":"rgba(255,255,255,0.025)",
                          animationDelay:`${i*0.04}s`}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <div style={{fontWeight:600,fontSize:12.5,color:"#f1f5f9",flex:1,marginRight:8,lineHeight:1.3}}>{app.title}</div>
                          <span style={{fontSize:9,padding:"2px 9px",borderRadius:20,background:st.bg,color:st.color,flexShrink:0,border:`1px solid ${st.color}25`}}>{st.label}</span>
                        </div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,0.32)",marginBottom:6}}>{app.company} · {app.location}</div>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          {app.matchScore>0&&<span style={{fontSize:10,color:scoreColor(app.matchScore),fontWeight:700,textShadow:`0 0 10px ${scoreColor(app.matchScore)}60`}}>{app.matchScore}% match</span>}
                          <span style={{fontSize:9,color:"rgba(255,255,255,0.18)",marginLeft:"auto"}}>Applied {timeAgo(app.appliedAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{flex:1,minWidth:0}}>
                {!selectedApp?(
                  <div style={{...g,padding:44,textAlign:"center",minHeight:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontSize:36,marginBottom:12,opacity:0.25}}>👈</div>
                    <div style={{fontSize:13,color:"rgba(255,255,255,0.22)"}}>Select an application to review</div>
                  </div>
                ):(
                  <div className="fadeUp">
                    <div style={{...g,padding:"16px 20px",marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:11}}>
                        <div><div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:17,color:"#f1f5f9",marginBottom:2}}>{selectedApp.title}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.32)"}}>{selectedApp.company} · {selectedApp.location} · {selectedApp.salary}</div></div>
                        {selectedApp.matchScore>0&&<div style={{textAlign:"center"}}><div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:24,color:scoreColor(selectedApp.matchScore),textShadow:`0 0 20px ${scoreColor(selectedApp.matchScore)}50`}}>{selectedApp.matchScore}%</div><div style={{fontSize:8,color:"rgba(255,255,255,0.2)"}}>MATCH</div></div>}
                      </div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:9}}>
                        <span style={{fontSize:10,color:"rgba(255,255,255,0.2)",marginRight:4}}>Status:</span>
                        {Object.entries(STATUS_CONFIG).map(([key,cfg])=>(
                          <button key={key} onClick={()=>{const u=updateAppStatus(selectedApp.id,key);setApplications(u);setSelectedApp(p=>({...p,status:key}));}}
                            style={{padding:"3px 11px",borderRadius:20,fontSize:10,fontWeight:600,border:`1px solid ${selectedApp.status===key?cfg.color+"55":"rgba(255,255,255,0.07)"}`,background:selectedApp.status===key?cfg.bg:"transparent",color:selectedApp.status===key?cfg.color:"rgba(255,255,255,0.28)",transition:"all .15s"}}>
                            {cfg.label}
                          </button>
                        ))}
                        {selectedApp.applyUrl&&<a href={selectedApp.applyUrl} target="_blank" rel="noopener noreferrer" className="apply-link" style={{marginLeft:"auto",fontSize:11,fontWeight:600,padding:"4px 13px",borderRadius:20,border:"1px solid"}}>↗ Posting</a>}
                      </div>
                      <button onClick={()=>{const u=deleteApplication(selectedApp.id);setApplications(u);setSelectedApp(null);}} style={{fontSize:10,background:"rgba(248,113,113,0.05)",border:"1px solid rgba(248,113,113,0.15)",borderRadius:7,color:"rgba(248,113,113,0.5)",padding:"4px 12px"}}>Delete</button>
                    </div>

                    <div style={{display:"flex",gap:2,...g,padding:4,borderRadius:12,marginBottom:12,background:"rgba(255,255,255,0.025)"}}>
                      {[{id:"overview",l:"Overview"},{id:"jd",l:"Job Details"},{id:"resume",l:"Resume Used"},{id:"cover",l:"Cover Letter"},{id:"interview",l:"Interview Tips"},{id:"fields",l:"Form Fields"}].map(t=>(
                        <button key={t.id} onClick={()=>setAppDetailTab(t.id)}
                          className={appDetailTab===t.id?"tab-btn tab-active":"tab-btn"}
                          style={{flex:1,padding:"7px 4px",background:"transparent",border:"1px solid transparent",borderRadius:8,color:appDetailTab===t.id?"#c4b5fd":"rgba(255,255,255,0.28)",fontSize:9.5,fontWeight:appDetailTab===t.id?700:400}}>
                          {t.l}
                        </button>
                      ))}
                    </div>

                    {appDetailTab==="overview"&&<div className="fadeUp"><div style={{...g,padding:"14px 17px",marginBottom:11}}><div style={{fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"0.15em",marginBottom:9}}>TAILORED SUMMARY USED</div><p style={{fontSize:12.5,lineHeight:1.85,color:"rgba(255,255,255,0.52)"}}>{selectedApp.tailoredSummary||"—"}</p></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div style={{...g,padding:"13px 15px",background:"rgba(16,185,129,0.04)"}}><div style={{fontSize:9,color:"#6ee7b7",letterSpacing:"0.15em",marginBottom:9}}>✓ SKILLS MATCHED</div>{selectedApp.skillsMatched?.map(s=><div key={s} style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginBottom:4}}>• {s}</div>)}</div><div style={{...g,padding:"13px 15px",background:"rgba(251,191,36,0.04)"}}><div style={{fontSize:9,color:"#fcd34d",letterSpacing:"0.15em",marginBottom:9}}>△ GAPS</div>{selectedApp.skillsGap?.length>0?selectedApp.skillsGap.map(s=><div key={s} style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginBottom:4}}>• {s}</div>):<div style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>No gaps!</div>}</div></div></div>}
                    {appDetailTab==="jd"&&<div className="fadeUp"><div style={{...g,padding:"17px 20px"}}><div style={{fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"0.15em",marginBottom:13}}>JOB DESCRIPTION AT TIME OF APPLICATION</div><div style={{fontSize:12,color:"rgba(255,255,255,0.42)",lineHeight:1.95,whiteSpace:"pre-wrap",maxHeight:420,overflowY:"auto"}}>{selectedApp.jobDescription||"Not saved."}</div></div></div>}
                    {appDetailTab==="resume"&&<div className="fadeUp">{selectedApp.tailoredBullets?.map((b,i)=><div key={i} style={{...g,padding:"13px 16px",marginBottom:9}}><div style={{fontSize:9,color:"#818cf8",letterSpacing:"0.15em",marginBottom:6}}>{(b.company||"").toUpperCase()}</div><div style={{fontSize:12.5,color:"rgba(255,255,255,0.68)",lineHeight:1.8}}>→ {b.tailored}</div><button onClick={()=>copy(b.tailored,`tb${i}`)} style={{marginTop:8,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.18)",borderRadius:7,color:"#c4b5fd",fontSize:10,padding:"3px 11px"}}>{copied===`tb${i}`?"✓":"Copy"}</button></div>)}</div>}
                    {appDetailTab==="cover"&&<div className="fadeUp"><div style={{...g,padding:"19px 23px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:13}}><div style={{fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"0.15em"}}>COVER LETTER SUBMITTED</div><button onClick={()=>copy(selectedApp.coverLetter,"tcl")} style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:7,color:"#6ee7b7",fontSize:11,padding:"3px 12px"}}>{copied==="tcl"?"✓":"Copy"}</button></div><div style={{fontSize:12.5,lineHeight:2,color:"rgba(255,255,255,0.52)",whiteSpace:"pre-wrap",borderLeft:"2px solid rgba(16,185,129,0.15)",paddingLeft:16}}>{selectedApp.coverLetter||"—"}</div></div></div>}
                    {appDetailTab==="interview"&&<div className="fadeUp">{selectedApp.interviewTips?.map((tip,i)=><div key={i} style={{...g,padding:"13px 15px",marginBottom:8,display:"flex",gap:10}}><div style={{width:24,height:24,borderRadius:7,flexShrink:0,background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:10,color:"#c4b5fd",boxShadow:"0 0 12px rgba(99,102,241,0.2)"}}>{i+1}</div><div style={{fontSize:12.5,color:"rgba(255,255,255,0.58)",lineHeight:1.8}}>{tip}</div></div>)}</div>}
                    {appDetailTab==="fields"&&<div className="fadeUp"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{Object.entries(selectedApp.filledFields||{}).map(([key,val])=><div key={key} style={{...g,padding:"10px 12px",borderRadius:10,gridColumn:(key==="summary"||key==="cover_letter"||key==="skills")?"span 2":"span 1"}}><div style={{fontSize:8,color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em",marginBottom:4}}>{key.replace(/_/g," ").toUpperCase()}</div><div style={{fontSize:11.5,color:"rgba(255,255,255,0.52)",lineHeight:1.65}}>{val}</div></div>)}</div></div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ AUTOFILL MODAL ══ */}
      {showModal&&filledFields&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(16px)"}}
          onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div style={{width:"100%",maxWidth:860,background:"linear-gradient(135deg,#0d0a1e,#0a0818)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"22px 22px 0 0",maxHeight:"92vh",display:"flex",flexDirection:"column",animation:"slideUp .45s cubic-bezier(.16,1,.3,1)",boxShadow:"0 -20px 80px rgba(99,102,241,0.15)"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid rgba(99,102,241,0.12)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(99,102,241,0.04)"}}>
              <div><div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:"#f1f5f9"}}>{modalStep==="submitted"?"✅ Saved to Tracker!":"Review & Confirm Auto-Fill"}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.28)",marginTop:2}}>{modalStep==="submitted"?"Everything saved — resume, cover letter, form fields & interview tips":"Review all fields · Edit freely · Confirming saves to tracker"}</div></div>
              <button onClick={()=>setShowModal(false)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"rgba(255,255,255,0.45)",fontSize:17,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            {modalStep==="submitted"?(
              <div style={{padding:"50px 28px",textAlign:"center"}}>
                <div style={{fontSize:56,marginBottom:16}}>🎯</div>
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:22,marginBottom:9,background:"linear-gradient(135deg,#c4b5fd,#6ee7b7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Application Saved!</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.35)",lineHeight:1.8,maxWidth:420,margin:"0 auto 26px"}}>When a recruiter calls, go to <strong style={{color:"#818cf8"}}>My Applications</strong> to instantly recall the resume, cover letter, and interview tips you used.</div>
                <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                  <button onClick={()=>{setShowModal(false);setModalStep("preview");setActiveView("tracker");}} className="hunt-btn" style={{borderRadius:12,color:"#fff",fontSize:13,fontWeight:700,padding:"11px 24px"}}>📋 View in Tracker</button>
                  <button onClick={()=>{setShowModal(false);setModalStep("preview");}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:12,color:"rgba(255,255,255,0.45)",fontSize:13,padding:"11px 20px"}}>Continue Hunting</button>
                </div>
              </div>
            ):(
              <>
                <div style={{overflowY:"auto",padding:"16px 24px",flex:1}}>
                  {modalStep==="confirming"?(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:160}}>
                      <span style={{width:32,height:32,border:"3px solid rgba(99,102,241,0.2)",borderTopColor:"#818cf8",borderRadius:"50%",display:"inline-block",marginBottom:14}} className="spin"/>
                      <div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>Saving to tracker...</div>
                    </div>
                  ):(
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {FORM_FIELDS.map(field=>(
                        <div key={field.id} style={{background:"rgba(99,102,241,0.04)",border:"1px solid rgba(99,102,241,0.1)",borderRadius:10,padding:"10px 13px",gridColumn:field.type==="textarea"?"span 2":"span 1"}}>
                          <div style={{fontSize:8,color:"rgba(255,255,255,0.22)",letterSpacing:"0.12em",marginBottom:5}}>{field.label.toUpperCase()}</div>
                          {field.type==="textarea"
                            ?<textarea value={editedFields[field.id]??""} onChange={e=>setEditedFields(p=>({...p,[field.id]:e.target.value}))} style={{width:"100%",background:"transparent",border:"none",color:"rgba(255,255,255,0.68)",fontSize:11.5,lineHeight:1.7,minHeight:62,resize:"vertical"}}/>
                            :<input value={editedFields[field.id]??""} onChange={e=>setEditedFields(p=>({...p,[field.id]:e.target.value}))} style={{width:"100%",background:"transparent",border:"none",color:"rgba(255,255,255,0.68)",fontSize:12.5}}/>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{padding:"13px 24px",borderTop:"1px solid rgba(99,102,241,0.1)",background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <div style={{flex:1}}><div style={{fontSize:10,fontWeight:600,color:"#fcd34d",marginBottom:1}}>⚠ Review all fields before confirming</div><div style={{fontSize:9,color:"rgba(255,255,255,0.22)"}}>No form is auto-submitted. Confirming saves to your tracker.</div></div>
                  <button onClick={()=>setShowModal(false)} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,color:"rgba(255,255,255,0.32)",fontSize:11,fontWeight:600,padding:"8px 15px"}}>Cancel</button>
                  <button onClick={()=>copy(Object.entries(editedFields).map(([k,v])=>`${k}: ${v}`).join("\n\n"),"all")} style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:9,color:"#c4b5fd",fontSize:11,fontWeight:600,padding:"8px 14px"}}>{copied==="all"?"✓ Copied!":"Copy All"}</button>
                  <button onClick={confirmAndSave} className="hunt-btn" style={{borderRadius:9,color:"#fff",fontSize:12,fontWeight:800,padding:"8px 20px"}}>✓ Confirm & Save</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ ONBOARDING — shown if no keys set ══ */}
      {(onboardStep === "keys" || onboardStep === "profile") && !showSettings && (
        <div style={{position:"fixed",inset:0,background:"rgba(6,4,15,0.97)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(20px)"}}>
          <div style={{maxWidth:560,width:"100%",padding:"0 20px"}}>
            {/* Header */}
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{width:72,height:72,borderRadius:20,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 18px",boxShadow:"0 0 60px rgba(99,102,241,0.4)"}}>⚡</div>
              <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:26,background:"linear-gradient(90deg,#818cf8,#c4b5fd,#a5f3fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:6}}>Welcome to DropHired</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.35)",lineHeight:1.7}}>Complete setup in 2 steps — takes under 3 minutes</div>
            </div>

            {/* Step indicators */}
            <div style={{display:"flex",gap:8,marginBottom:24,justifyContent:"center"}}>
              {[{n:"1",l:"API Keys"},{n:"2",l:"Your Profile"}].map((s,i)=>{
                const active = (i===0&&onboardStep==="keys")||(i===1&&onboardStep==="profile");
                const done = (i===0&&onboardStep==="profile");
                return(
                  <div key={s.n} style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:done?"#10b981":active?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",boxShadow:active?"0 0 20px rgba(99,102,241,0.4)":"none"}}>
                      {done?"✓":s.n}
                    </div>
                    <span style={{fontSize:11,color:active?"#c4b5fd":done?"#6ee7b7":"rgba(255,255,255,0.25)",fontWeight:active?700:400}}>{s.l}</span>
                    {i===0&&<div style={{width:32,height:1,background:"rgba(255,255,255,0.1)",marginLeft:4}}/>}
                  </div>
                );
              })}
            </div>

            {/* STEP 1 — API Keys */}
            {onboardStep==="keys"&&(
              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:20,padding:26}}>
                <div style={{fontSize:13,fontWeight:700,color:"#c4b5fd",marginBottom:18}}>🔑 Step 1 — Add your free API keys</div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",marginBottom:6,display:"flex",justifyContent:"space-between"}}>
                    Anthropic API Key <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{color:"rgba(167,139,250,0.7)",fontSize:10}}>Get free key →</a>
                  </div>
                  <input value={settingsForm.anthropic} onChange={e=>setSettingsForm(p=>({...p,anthropic:e.target.value}))}
                    placeholder="sk-ant-api03-..."
                    style={{width:"100%",background:"rgba(0,0,0,0.4)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:10,color:"rgba(255,255,255,0.8)",fontSize:12,padding:"10px 14px",fontFamily:"monospace",outline:"none"}}/>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",marginTop:3}}>Powers all AI features — $5 free credits to start</div>
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",marginBottom:6,display:"flex",justifyContent:"space-between"}}>
                    Adzuna App ID <a href="https://developer.adzuna.com" target="_blank" rel="noopener noreferrer" style={{color:"rgba(110,231,183,0.7)",fontSize:10}}>Get free key →</a>
                  </div>
                  <input value={settingsForm.adzuna_id} onChange={e=>setSettingsForm(p=>({...p,adzuna_id:e.target.value}))}
                    placeholder="e.g. a1b2c3d4"
                    style={{width:"100%",background:"rgba(0,0,0,0.4)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,color:"rgba(255,255,255,0.8)",fontSize:12,padding:"10px 14px",fontFamily:"monospace",outline:"none"}}/>
                </div>
                <div style={{marginBottom:22}}>
                  <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",marginBottom:6}}>Adzuna App Key</div>
                  <input value={settingsForm.adzuna_key} onChange={e=>setSettingsForm(p=>({...p,adzuna_key:e.target.value}))}
                    placeholder="e.g. 8b6a3c566d97..."
                    style={{width:"100%",background:"rgba(0,0,0,0.4)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,color:"rgba(255,255,255,0.8)",fontSize:12,padding:"10px 14px",fontFamily:"monospace",outline:"none"}}/>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",marginTop:3}}>Free job search — 1000 searches/month</div>
                </div>
                <button onClick={saveKeys} style={{width:"100%",background:"linear-gradient(135deg,#4f46e5,#7c3aed)",border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:800,padding:"13px 0",boxShadow:"0 0 40px rgba(99,102,241,0.4)",cursor:"pointer"}}>
                  Continue → Set Up Profile
                </button>
              </div>
            )}

            {/* STEP 2 — Profile + Resume Upload */}
            {onboardStep==="profile"&&(
              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:20,padding:26,maxHeight:"70vh",overflowY:"auto"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#6ee7b7",marginBottom:18}}>👤 Step 2 — Your Profile & Resume</div>

                {/* Resume Upload — FIRST and prominent */}
                <div style={{marginBottom:20,padding:16,background:resumeText?"rgba(16,185,129,0.08)":"rgba(99,102,241,0.06)",border:`1px solid ${resumeText?"rgba(16,185,129,0.3)":"rgba(99,102,241,0.2)"}`,borderRadius:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:resumeText?"#6ee7b7":"#c4b5fd",marginBottom:10}}>
                    {resumeText?"✅ Resume Uploaded!":"📄 Upload Your Resume PDF"}
                  </div>
                  {!resumeText?(
                    <>
                      <div
                        onClick={()=>document.getElementById("resume-upload").click()}
                        style={{border:"2px dashed rgba(99,102,241,0.3)",borderRadius:12,padding:"24px 16px",textAlign:"center",cursor:"pointer",transition:"all .2s",background:"rgba(99,102,241,0.04)"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(99,102,241,0.6)"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(99,102,241,0.3)"}>
                        <div style={{fontSize:32,marginBottom:8}}>📎</div>
                        <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.6)",marginBottom:4}}>
                          {resumeParsing?"Parsing your resume...":"Drop your resume PDF here"}
                        </div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>or click to browse</div>
                        {resumeParsing&&<div style={{marginTop:10,width:40,height:40,border:"3px solid rgba(99,102,241,0.2)",borderTopColor:"#818cf8",borderRadius:"50%",display:"inline-block",animation:"spin .8s linear infinite"}}/>}
                      </div>
                      <input id="resume-upload" type="file" accept=".pdf" style={{display:"none"}}
                        onChange={e=>e.target.files[0]&&handleResumeUpload(e.target.files[0])}/>
                      <div style={{marginTop:10,fontSize:10,color:"rgba(255,255,255,0.2)",textAlign:"center"}}>
                        Or paste your resume text manually below ↓
                      </div>
                      <textarea
                        value={resumeText} onChange={e=>{setResumeText(e.target.value);localStorage.setItem("dh_resume_text",e.target.value);}}
                        placeholder="Paste your resume text here as an alternative to PDF upload..."
                        rows={4}
                        style={{width:"100%",marginTop:8,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"rgba(255,255,255,0.6)",fontSize:11,padding:"10px 12px",lineHeight:1.6,resize:"vertical",outline:"none"}}/>
                    </>
                  ):(
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{resumeFile?.name||"Resume loaded"} · {Math.round(resumeText.length/5)} words extracted</div>
                      <button onClick={()=>{setResumeText("");localStorage.removeItem("dh_resume_text");setResumeFile(null);}}
                        style={{fontSize:10,color:"rgba(248,113,113,0.6)",background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.15)",borderRadius:7,padding:"3px 10px",cursor:"pointer"}}>Remove</button>
                    </div>
                  )}
                </div>

                {/* Profile fields */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  {[
                    {key:"name",label:"Full Name *",placeholder:"John Smith",full:true},
                    {key:"email",label:"Email *",placeholder:"john@email.com"},
                    {key:"phone",label:"Phone",placeholder:"+1 234 567 8900"},
                    {key:"location",label:"Location",placeholder:"Dallas, TX"},
                    {key:"title",label:"Current Title *",placeholder:"Senior Data Engineer",full:true},
                    {key:"yearsExperience",label:"Years Experience",placeholder:"5"},
                    {key:"linkedin",label:"LinkedIn",placeholder:"linkedin.com/in/yourprofile"},
                    {key:"github",label:"GitHub (optional)",placeholder:"github.com/yourusername"},
                    {key:"skills",label:"Key Skills",placeholder:"Python, SQL, Azure, Spark...",full:true},
                    {key:"certifications",label:"Certifications",placeholder:"AWS Certified, etc.",full:true},
                    {key:"workAuth",label:"US Work Auth?",placeholder:"Yes / No"},
                    {key:"sponsorship",label:"Need Sponsorship?",placeholder:"Yes / No"},
                  ].map(f=>(
                    <div key={f.key} style={{gridColumn:f.full?"span 2":"span 1"}}>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginBottom:4}}>{f.label}</div>
                      <input value={profileForm[f.key]||""} onChange={e=>setProfileForm(p=>({...p,[f.key]:e.target.value}))}
                        placeholder={f.placeholder}
                        style={{width:"100%",background:"rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,color:"rgba(255,255,255,0.75)",fontSize:12,padding:"8px 11px",outline:"none"}}/>
                    </div>
                  ))}
                </div>

                <button onClick={saveProfile} style={{width:"100%",background:"linear-gradient(135deg,#10b981,#059669)",border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:800,padding:"13px 0",boxShadow:"0 0 40px rgba(16,185,129,0.3)",cursor:"pointer",marginTop:6}}>
                  ⚡ Launch DropHired!
                </button>
                <button onClick={()=>setOnboardStep("keys")} style={{width:"100%",marginTop:8,background:"transparent",border:"none",color:"rgba(255,255,255,0.25)",fontSize:11,cursor:"pointer",padding:"6px 0"}}>
                  ← Back to API Keys
                </button>
              </div>
            )}

            <div style={{textAlign:"center",marginTop:14,fontSize:10,color:"rgba(255,255,255,0.15)"}}>
              🔒 Everything stored locally on your device. Never shared.
            </div>
          </div>
        </div>
      )}

      {/* ══ SETTINGS MODAL ══ */}
      {showSettings && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(12px)"}}
          onClick={e=>e.target===e.currentTarget&&setShowSettings(false)}>
          <div style={{width:"100%",maxWidth:480,background:"linear-gradient(135deg,#0d0a1e,#0a0818)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:20,padding:28,boxShadow:"0 20px 80px rgba(0,0,0,0.6)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div>
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:17,color:"#f1f5f9"}}>⚙️ Settings</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>Update your API keys anytime</div>
              </div>
              <button onClick={()=>setShowSettings(false)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"rgba(255,255,255,0.45)",fontSize:17,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:"#c4b5fd",marginBottom:6}}>Anthropic API Key</div>
              <input value={settingsForm.anthropic} onChange={e=>setSettingsForm(p=>({...p,anthropic:e.target.value}))}
                placeholder="sk-ant-api03-..."
                style={{width:"100%",background:"rgba(0,0,0,0.4)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:10,color:"rgba(255,255,255,0.8)",fontSize:12,padding:"9px 13px",fontFamily:"monospace",outline:"none"}}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:"#6ee7b7",marginBottom:6}}>Adzuna App ID</div>
              <input value={settingsForm.adzuna_id} onChange={e=>setSettingsForm(p=>({...p,adzuna_id:e.target.value}))}
                placeholder="e.g. a1b2c3d4"
                style={{width:"100%",background:"rgba(0,0,0,0.4)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,color:"rgba(255,255,255,0.8)",fontSize:12,padding:"9px 13px",fontFamily:"monospace",outline:"none"}}/>
            </div>
            <div style={{marginBottom:24}}>
              <div style={{fontSize:11,fontWeight:700,color:"#6ee7b7",marginBottom:6}}>Adzuna App Key</div>
              <input value={settingsForm.adzuna_key} onChange={e=>setSettingsForm(p=>({...p,adzuna_key:e.target.value}))}
                placeholder="e.g. 8b6a3c566d97..."
                style={{width:"100%",background:"rgba(0,0,0,0.4)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,color:"rgba(255,255,255,0.8)",fontSize:12,padding:"9px 13px",fontFamily:"monospace",outline:"none"}}/>
            </div>
            <div style={{marginTop:14,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:14}}>
              <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:8}}>Update Resume</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div onClick={()=>document.getElementById("settings-resume-upload").click()}
                  style={{flex:1,padding:"9px 14px",background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:10,cursor:"pointer",textAlign:"center",fontSize:12,color:"#c4b5fd"}}>
                  {resumeParsing?"Parsing...":"📄 Upload New Resume PDF"}
                </div>
                <input id="settings-resume-upload" type="file" accept=".pdf" style={{display:"none"}}
                  onChange={e=>e.target.files[0]&&handleResumeUpload(e.target.files[0])}/>
                <button onClick={()=>setOnboardStep("profile")} style={{padding:"9px 14px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,color:"#6ee7b7",fontSize:12,cursor:"pointer"}}>Edit Profile</button>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:14}}>
              <button onClick={()=>setShowSettings(false)} style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,color:"rgba(255,255,255,0.4)",fontSize:13,padding:"10px 0",cursor:"pointer"}}>Cancel</button>
              <button onClick={saveKeys} style={{flex:2,background:"linear-gradient(135deg,#4f46e5,#7c3aed)",border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:800,padding:"10px 0",boxShadow:"0 0 30px rgba(99,102,241,0.3)",cursor:"pointer"}}>💾 Save Keys</button>
            </div>
            <div style={{marginTop:12,padding:"9px 13px",background:"rgba(99,102,241,0.06)",borderRadius:10,border:"1px solid rgba(99,102,241,0.12)"}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",lineHeight:1.7}}>🔒 Keys stored in your browser only. Never sent anywhere except the official APIs.</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}