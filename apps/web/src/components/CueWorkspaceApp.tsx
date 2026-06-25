"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUp,
  BookOpen,
  Brain,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  GitBranch,
  Hash,
  LogOut,
  Moon,
  Plus,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Video,
  type LucideIcon,
} from "lucide-react";
import type {
  ActivityEvent,
  ApprovalRecord,
  ChatMessageRecord,
  ChatThreadWithMessages,
  CueAssistantMessage,
  EvidenceChip,
  HomeSnapshot,
  SuggestedAction,
  WorkspaceSource,
} from "@cue-h0/types";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
html,body{margin:0;padding:0}

.cue-app{
  --canvas:#F5F3ED; --surface:#FFFFFF; --surface-2:#FAF8F3; --inset:#F1EEE6;
  --ink:#1B1D23; --ink-2:#5A5F6B; --ink-3:#8B8F9A; --ink-4:#B4B7BF;
  --line:#E9E5DB; --line-soft:#F0ECE3;
  --accent:#4F5BD5; --accent-soft:rgba(79,91,213,.10); --accent-tint:rgba(79,91,213,.14);
  --signal:#C96A1E; --signal-bright:#E68A3E; --signal-tint:#FAEEDF;
  --ok:#2F8F6B; --ok-tint:#E5F1EB; --stop:#C44536; --stop-tint:#F7E9E6;
  --shadow:0 1px 2px rgba(20,23,31,.04); --shadow-pop:0 6px 20px rgba(20,23,31,.10);
  --sans:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  --mono:'Geist Mono',ui-monospace,'SF Mono',Menlo,monospace;
  display:flex; flex-direction:column; height:100vh; overflow:hidden;
  font-family:var(--sans); color:var(--ink); background:var(--canvas);
  -webkit-font-smoothing:antialiased; font-size:14px; letter-spacing:-0.006em;
}
.cue-app.dark{
  --canvas:#17181B; --surface:#1F2024; --surface-2:#26282D; --inset:#26282D;
  --ink:#ECEDF1; --ink-2:#A6ABB6; --ink-3:#777C88; --ink-4:#565B66;
  --line:#2C2E34; --line-soft:#26282D;
  --accent:#8B92F5; --accent-soft:rgba(139,146,245,.14); --accent-tint:rgba(139,146,245,.20);
  --signal:#E68A3E; --signal-bright:#E68A3E; --signal-tint:rgba(230,138,62,.16);
  --ok:#4FB892; --ok-tint:rgba(79,184,146,.15); --stop:#E0786C; --stop-tint:rgba(224,120,108,.15);
  --shadow:0 1px 2px rgba(0,0,0,.3); --shadow-pop:0 8px 24px rgba(0,0,0,.45);
}
*{box-sizing:border-box}
.mono{font-family:var(--mono);letter-spacing:-0.01em}
.eyebrow{font-family:var(--mono);font-size:10.5px;font-weight:500;letter-spacing:.13em;text-transform:uppercase;color:var(--ink-3)}
.cue-dot{width:8px;height:8px;border-radius:999px;background:var(--signal-bright);
  box-shadow:0 0 0 0 rgba(230,138,62,.55);animation:cuePulse 2.6s ease-out infinite;flex-shrink:0}
@keyframes cuePulse{0%{box-shadow:0 0 0 0 rgba(230,138,62,.5)}70%{box-shadow:0 0 0 7px rgba(230,138,62,0)}100%{box-shadow:0 0 0 0 rgba(230,138,62,0)}}

.topbar{height:54px;flex-shrink:0;border-bottom:1px solid var(--line);background:var(--surface);
  display:flex;align-items:center;gap:8px;padding:0 18px;position:relative;z-index:40}
.tb-brand{display:flex;align-items:center;gap:9px;margin-right:18px}
.tb-brand .brand-mark{font-size:18px;font-weight:600;letter-spacing:-0.03em}
.tb-nav{display:flex;gap:4px}
.tb-link{font-family:var(--sans);font-size:13.5px;color:var(--ink-2);background:none;border:none;cursor:pointer;
  padding:6px 13px;border-radius:9px;transition:background .15s,color .15s}
.tb-link:hover{background:var(--surface-2);color:var(--ink)}
.tb-link.active{background:var(--accent-soft);color:var(--accent);font-weight:500}
.tb-right{margin-left:auto;display:flex;align-items:center;gap:10px}
.top-date{font-family:var(--mono);font-size:11px;color:var(--ink-3)}
.icon-btn{width:32px;height:32px;border-radius:9px;border:1px solid var(--line);background:var(--surface);
  display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink-2);transition:.15s}
.icon-btn:hover{border-color:var(--ink-4);color:var(--ink)}.icon-btn svg{width:15px;height:15px;stroke-width:2}
.avatar-wrap{position:relative}
.avatar{width:32px;height:32px;border-radius:999px;background:linear-gradient(135deg,#3A4150,#1B1D23);color:#fff;
  border:none;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;cursor:pointer}
.backdrop{position:fixed;inset:0;z-index:45}
.menu{position:absolute;right:0;top:42px;width:248px;background:var(--surface);border:1px solid var(--line);
  border-radius:13px;box-shadow:var(--shadow-pop);z-index:50;overflow:hidden;animation:pop .16s ease both}
@keyframes pop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}
.menu-head{padding:13px 15px;border-bottom:1px solid var(--line-soft)}
.menu-name{font-size:13.5px;font-weight:500}.menu-ws{margin-top:2px;font-family:var(--mono);font-size:10.5px;color:var(--ink-3)}
.menu-lab{padding:11px 15px 5px}
.menu-conns{display:flex;flex-wrap:wrap;gap:6px;padding:0 15px 12px}
.conn-badge{display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:10px;color:var(--ink-2);
  border:1px solid var(--line);border-radius:999px;padding:3px 8px}
.conn-badge .dot{width:5px;height:5px;border-radius:999px;background:var(--ok)}
.menu-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 15px;background:none;border:none;
  border-top:1px solid var(--line-soft);font-family:var(--sans);font-size:13px;color:var(--ink-2);cursor:pointer;text-align:left;transition:background .15s}
.menu-item:hover{background:var(--surface-2);color:var(--ink)}.menu-item svg{width:15px;height:15px;stroke-width:2}

.main-body{flex:1;min-height:0;position:relative;display:flex;flex-direction:column}
.scroll{flex:1;overflow-y:auto;scroll-behavior:smooth}
.scroll::-webkit-scrollbar{width:10px}.scroll::-webkit-scrollbar-thumb{background:var(--line);border-radius:99px;border:3px solid var(--canvas)}

.home{max-width:1040px;margin:0 auto;padding:38px 28px 60px}
.fade{opacity:0;animation:fadeUp .5s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.greeting{font-size:28px;font-weight:500;letter-spacing:-0.025em}
.greet-sub{margin-top:6px;color:var(--ink-2);font-size:14px}.greet-sub b{color:var(--ink);font-weight:500}
.hero-ask{display:flex;align-items:center;gap:13px;background:var(--surface);border:1px solid var(--line);
  border-radius:14px;padding:0 8px 0 18px;height:58px;margin-top:20px;box-shadow:var(--shadow);transition:border-color .18s,box-shadow .18s}
.hero-ask:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.hero-ask>svg{width:19px;height:19px;color:var(--ink-3);stroke-width:2;flex-shrink:0}
.hero-ask input{flex:1;border:none;outline:none;background:none;font-family:var(--sans);font-size:15px;color:var(--ink)}
.hero-ask input::placeholder{color:var(--ink-4)}
.ask-pill{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10.5px;color:var(--ink-3);
  border:1px solid var(--line);border-radius:7px;padding:4px 8px;white-space:nowrap}.ask-pill svg{width:11px;height:11px;color:var(--signal)}
.send{width:40px;height:40px;border-radius:11px;border:none;background:var(--ink);color:var(--surface);cursor:pointer;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .14s,opacity .14s}
.send:hover{transform:translateY(-1px)}.send:disabled{opacity:.3;cursor:default;transform:none}.send svg{width:16px;height:16px;stroke-width:2.4}
.hero-hint{margin-top:9px;padding-left:4px;font-family:var(--mono);font-size:10.5px;color:var(--ink-4)}

.home-grid{display:grid;grid-template-columns:1fr 322px;gap:20px;align-items:start;margin-top:28px}
.col{display:flex;flex-direction:column;gap:18px}
.sec-lab{margin-bottom:11px;display:flex;align-items:center;justify-content:space-between}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.card-head{padding:12px 16px;border-bottom:1px solid var(--line-soft)}

.panel-head{display:flex;gap:18px;padding:13px 16px 0}
.tab{font-size:13px;color:var(--ink-3);cursor:pointer;background:none;border:none;font-family:var(--sans);
  padding:0 0 11px;border-bottom:2px solid transparent;transition:color .15s,border-color .15s;display:flex;align-items:center;gap:6px}
.tab:hover{color:var(--ink-2)}.tab.active{color:var(--accent);font-weight:500;border-bottom-color:var(--accent)}
.tab-badge{font-family:var(--mono);font-size:9.5px;font-weight:500;background:var(--accent-tint);color:var(--accent);padding:1px 5px;border-radius:999px}
.feed-body{border-top:1px solid var(--line-soft)}
.feed-item{display:flex;gap:11px;padding:12px 16px;border-bottom:1px solid var(--line-soft);cursor:pointer;transition:background .15s;align-items:flex-start}
.feed-item:last-child{border-bottom:none}.feed-item:hover{background:var(--surface-2)}
.feed-src{width:26px;height:26px;border-radius:7px;background:var(--inset);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.feed-src.warn{background:var(--signal-tint)}.feed-src svg{width:13px;height:13px;stroke-width:2}
.feed-main{flex:1;min-width:0}
.feed-title{font-size:13px;line-height:1.4;color:var(--ink);font-weight:450;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.feed-meta{margin-top:3px;font-family:var(--mono);font-size:10px;color:var(--ink-3)}
.feed-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}
.feed-time{font-family:var(--mono);font-size:10px;color:var(--ink-4)}
.unread{width:7px;height:7px;border-radius:999px;background:var(--accent)}
.mini-chip{font-family:var(--mono);font-size:9.5px;font-weight:500;padding:2px 7px;border-radius:999px;background:var(--signal-tint);color:var(--signal)}

.src-slack{color:#6B4FA0}.src-github{color:#2E3138}.src-linear{color:#4B59C9}.src-notion{color:#3A3F4B}.src-vercel{color:#14171F}.src-meet{color:var(--signal)}.src-cue{color:var(--signal)}.src-posthog{color:var(--accent)}
.cue-app.dark .src-github{color:#C9CDD6}.cue-app.dark .src-notion{color:#C9CDD6}.cue-app.dark .src-vercel{color:#ECEDF1}.cue-app.dark .src-slack{color:#B79CE6}.cue-app.dark .src-linear{color:#9AA0EE}

.t-row{display:flex;align-items:center;gap:11px;padding:10px 16px;border-bottom:1px solid var(--line-soft)}
.t-row:last-child{border-bottom:none}
.t-row.hot{background:linear-gradient(90deg,var(--signal-tint),transparent 75%)}
.t-time{font-family:var(--mono);font-size:10px;color:var(--ink-3);width:42px;flex-shrink:0;line-height:1.3}
.t-mid{flex:1;min-width:0}.t-title{font-size:12.5px;font-weight:500}.t-sub{margin-top:1px;font-size:11px;color:var(--ink-3)}
.join-btn{display:inline-flex;align-items:center;gap:5px;background:var(--ink);color:var(--surface);border:none;border-radius:7px;
  padding:5px 10px;font-family:var(--sans);font-size:11px;font-weight:500;cursor:pointer;transition:transform .14s;flex-shrink:0}
.join-btn:hover{transform:translateY(-1px)}.join-btn svg{width:11px;height:11px}
.due-row{display:flex;align-items:center;gap:11px;padding:10px 16px;border-bottom:1px solid var(--line-soft);cursor:pointer;transition:background .15s}
.due-row:last-child{border-bottom:none}.due-row:hover{background:var(--surface-2)}
.due-box{width:16px;height:16px;border-radius:5px;border:1.6px solid var(--ink-4);flex-shrink:0}
.due-t{font-size:12.5px;font-weight:450}.due-m{margin-top:1px;font-family:var(--mono);font-size:10px;color:var(--ink-3)}
.due-divider{padding:8px 16px 4px}
.see-all{display:flex;align-items:center;justify-content:center;gap:5px;padding:10px;font-family:var(--mono);font-size:10.5px;color:var(--ink-3);cursor:pointer;transition:color .15s}
.see-all:hover{color:var(--accent)}.see-all svg{width:12px;height:12px}
.wait-row{display:flex;gap:11px;align-items:center;padding:11px 16px;border-bottom:1px solid var(--line-soft)}
.wait-row:last-child{border-bottom:none}
.wait-ico{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--signal-tint);color:var(--signal)}
.wait-ico svg{width:14px;height:14px;stroke-width:2}
.wait-mid{flex:1;min-width:0}.wait-t{font-size:12.5px;font-weight:500;line-height:1.3}.wait-m{margin-top:2px;font-family:var(--mono);font-size:10px;color:var(--ink-3)}
.wait-btn{font-family:var(--sans);font-size:11px;font-weight:500;color:var(--accent);background:var(--accent-soft);border:none;border-radius:7px;padding:5px 11px;cursor:pointer;transition:.14s;flex-shrink:0}
.wait-btn:hover{background:var(--accent-tint)}

.ra-row{display:flex;align-items:center;gap:11px;padding:11px 16px;border-bottom:1px solid var(--line-soft);cursor:pointer;transition:background .15s}
.ra-row:last-child{border-bottom:none}.ra-row:hover{background:var(--surface-2)}
.ra-ic{width:26px;height:26px;border-radius:7px;background:var(--inset);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ra-ic svg{width:13px;height:13px;stroke-width:2}
.ra-t{flex:1;font-size:12.5px;color:var(--ink);min-width:0}
.ra-time{font-family:var(--mono);font-size:10px;color:var(--ink-4);flex-shrink:0}

.chats{display:grid;grid-template-columns:248px 1fr;height:100%;min-width:0}
.threads{border-right:1px solid var(--line);background:var(--surface);display:flex;flex-direction:column;overflow:hidden}
.threads-head{padding:14px 12px 10px}
.new-btn{display:flex;align-items:center;gap:9px;width:100%;padding:9px 12px;border-radius:11px;border:1px solid var(--line);
  background:var(--surface);color:var(--ink);font-family:var(--sans);font-size:13.5px;font-weight:500;cursor:pointer;box-shadow:var(--shadow);transition:border-color .16s,transform .14s}
.new-btn:hover{border-color:var(--signal-bright);transform:translateY(-1px)}.new-btn svg{width:15px;height:15px;stroke-width:2.2;color:var(--signal)}
.t-list{flex:1;overflow-y:auto;padding-bottom:12px}
.t-day{padding:13px 16px 5px}
.t-item{display:flex;gap:9px;align-items:flex-start;padding:8px 12px;margin:0 8px;border-radius:9px;cursor:pointer;transition:background .15s}
.t-item:hover{background:var(--surface-2)}.t-item.active{background:var(--accent-soft)}
.t-dot{width:6px;height:6px;border-radius:999px;margin-top:6px;flex-shrink:0}
.t-itxt{font-size:12.5px;color:var(--ink-2);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.t-item.active .t-itxt{color:var(--ink);font-weight:500}

.convo-wrap{display:flex;flex-direction:column;min-width:0;height:100%;background:var(--canvas)}
.convo{flex:1;overflow-y:auto;padding:28px 0 24px}
.convo-inner{max-width:720px;margin:0 auto;padding:0 26px;display:flex;flex-direction:column;gap:24px}
.msg-in{animation:fadeUp .5s cubic-bezier(.2,.7,.2,1) both}
.u-msg{align-self:flex-end;max-width:78%;background:var(--ink);color:var(--surface);padding:11px 15px;border-radius:16px 16px 5px 16px;font-size:14.5px;line-height:1.45}
.c-msg{display:flex;gap:13px;align-items:flex-start}
.c-avatar{width:27px;height:27px;border-radius:8px;background:var(--surface);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.c-body{flex:1;min-width:0;border-left:2px solid var(--line);padding-left:15px;margin-left:-1px}
.c-body.signal{border-left-color:var(--signal-bright)}.c-body.green{border-left-color:var(--ok)}
.verdict{display:flex;align-items:center;gap:9px;font-size:15.5px;font-weight:500;letter-spacing:-0.015em;flex-wrap:wrap}
.chip-status{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10.5px;font-weight:500;padding:3px 9px 3px 8px;border-radius:999px;white-space:nowrap}
.light{width:7px;height:7px;border-radius:999px}
.chip-status.warn{background:var(--signal-tint);color:var(--signal)}.chip-status.warn .light{background:var(--signal-bright)}
.chip-status.ok{background:var(--ok-tint);color:var(--ok)}.chip-status.ok .light{background:var(--ok)}
.live .light{animation:cuePulse 2.6s ease-out infinite}
.answer-sub{margin-top:7px;color:var(--ink-2);font-size:14px;line-height:1.55}.answer-sub b{color:var(--ink);font-weight:500}
.blocks{margin-top:16px;display:flex;flex-direction:column;gap:9px}
.block{background:var(--surface);border:1px solid var(--line);border-radius:11px;padding:12px 14px;display:flex;gap:11px}
.block-ico{width:15px;height:15px;color:var(--stop);flex-shrink:0;margin-top:1px;stroke-width:2}
.block-t{font-size:13.5px;font-weight:500}.block-d{margin-top:3px;font-size:12.5px;color:var(--ink-2);line-height:1.5}
.block-ref{margin-top:6px;font-family:var(--mono);font-size:10.5px;color:var(--ink-3)}
.no-block{margin-top:14px;display:flex;align-items:center;gap:9px;font-size:13px;color:var(--ok);background:var(--ok-tint);border-radius:10px;padding:11px 14px}.no-block svg{width:15px;height:15px}
.layer-lab{margin-top:18px;margin-bottom:9px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-flex;align-items:center;gap:7px;background:var(--surface);border:1px solid var(--line);border-radius:9px;padding:6px 11px;font-family:var(--mono);font-size:11.5px;color:var(--ink-2);cursor:pointer;transition:transform .15s,border-color .15s}
.chip:hover{transform:translateY(-1px);border-color:var(--accent);color:var(--ink)}.chip svg{width:12px;height:12px;stroke-width:2}
.actions{margin-top:18px;display:flex;flex-wrap:wrap;gap:9px}
.act{display:inline-flex;align-items:center;gap:7px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px 13px;font-family:var(--sans);font-size:12.5px;font-weight:500;color:var(--ink);cursor:pointer;transition:transform .15s,border-color .15s}
.act:hover{transform:translateY(-1px);border-color:var(--signal-bright)}.act svg{width:13px;height:13px;color:var(--signal);stroke-width:2.2}
.act.done{background:var(--ok-tint);border-color:var(--ok-tint);color:var(--ok)}.act.done svg{color:var(--ok)}
.thinking{display:flex;align-items:center;gap:10px}
.think-line{font-size:13.5px;background:linear-gradient(90deg,var(--ink-4) 25%,var(--ink-2) 50%,var(--ink-4) 75%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shimmer 1.6s linear infinite}
@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
.tdots{display:flex;gap:4px}.tdot{width:5px;height:5px;border-radius:999px;background:var(--signal-bright);animation:tdot 1.1s ease-in-out infinite}
.tdot:nth-child(2){animation-delay:.18s}.tdot:nth-child(3){animation-delay:.36s}
@keyframes tdot{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}
.welcome{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;animation:fadeUp .5s ease both}
.welcome-mark{width:46px;height:46px;border-radius:13px;background:var(--surface);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow);margin-bottom:18px}
.welcome h2{font-size:21px;font-weight:500;letter-spacing:-0.02em;margin:0}
.welcome p{margin:8px 0 0;font-size:13.5px;color:var(--ink-2);max-width:400px;line-height:1.5}
.sugg{display:flex;flex-wrap:wrap;gap:9px;justify-content:center;margin-top:22px;max-width:520px}
.sugg-chip{background:var(--surface);border:1px solid var(--line);border-radius:11px;padding:9px 14px;font-size:13px;color:var(--ink);cursor:pointer;box-shadow:var(--shadow);transition:transform .15s,border-color .15s}
.sugg-chip:hover{transform:translateY(-2px);border-color:var(--accent)}
.convo-foot{border-top:1px solid var(--line);background:var(--surface);padding:14px 26px 16px}
.composer{display:flex;align-items:flex-end;gap:10px;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:11px 11px 11px 17px;max-width:720px;margin:0 auto;transition:border-color .18s,box-shadow .18s}
.composer:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.composer textarea{flex:1;border:none;outline:none;resize:none;font-family:var(--sans);font-size:14.5px;color:var(--ink);background:none;line-height:1.45;max-height:120px;padding:5px 0}
.composer textarea::placeholder{color:var(--ink-4)}

.modal-back{position:fixed;inset:0;background:rgba(20,23,31,.32);z-index:60;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .18s ease both}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{width:440px;max-width:100%;background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow-pop);overflow:hidden;animation:pop .2s ease both}
.modal-top{padding:18px 20px 0;display:flex;align-items:center;gap:10px}
.modal-badge{width:30px;height:30px;border-radius:9px;background:var(--signal-tint);color:var(--signal);display:flex;align-items:center;justify-content:center}
.modal-badge svg{width:16px;height:16px;stroke-width:2}
.modal-t{font-size:15px;font-weight:500;letter-spacing:-0.01em}
.modal-d{padding:12px 20px 0;font-size:13px;color:var(--ink-2);line-height:1.55}
.modal-foot{display:flex;gap:9px;padding:18px 20px 20px;justify-content:flex-end}
.btn-approve{background:var(--ink);color:var(--surface);border:none;border-radius:9px;padding:8px 16px;font-size:13px;font-weight:500;font-family:var(--sans);cursor:pointer;transition:transform .14s}.btn-approve:hover{transform:translateY(-1px)}
.btn-reject{background:var(--surface);color:var(--ink-2);border:1px solid var(--line);border-radius:9px;padding:8px 16px;font-size:13px;font-weight:500;font-family:var(--sans);cursor:pointer}.btn-reject:hover{border-color:var(--ink-4)}

.toast-wrap{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);z-index:55;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}
.toast{display:flex;align-items:center;gap:9px;background:var(--ink);color:var(--surface);padding:10px 15px;border-radius:11px;font-size:13px;box-shadow:var(--shadow-pop);animation:toastIn .4s cubic-bezier(.2,.8,.2,1) both}
.toast svg{width:14px;height:14px;color:var(--signal-bright)}
@keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:none}}
.load-state{flex:1;display:flex;align-items:center;justify-content:center;color:var(--ink-2);font-size:13px}
.error-state{padding:20px;color:var(--stop);font-size:13px}

@media (max-width:1000px){.home-grid{grid-template-columns:1fr}}
@media (max-width:680px){.chats{grid-template-columns:1fr}.threads{display:none}.tb-brand{margin-right:8px}.ask-pill{display:none}}
@media (prefers-reduced-motion:reduce){*{animation-duration:.001s!important;transition-duration:.001s!important}.cue-dot,.live .light{animation:none!important}}
`;

interface BootstrapResponse {
  snapshot: HomeSnapshot;
  threads: ChatThreadWithMessages[];
}

interface ChatMutationResponse extends BootstrapResponse {
  thread: ChatThreadWithMessages;
}

interface ApprovalDialog {
  id?: string;
  title: string;
  description: string;
  action?: SuggestedAction;
}

interface ToastMessage {
  id: number;
  text: string;
}

const sourceIcon: Record<WorkspaceSource, LucideIcon> = {
  slack: Hash,
  github: GitBranch,
  linear: Circle,
  notion: BookOpen,
  vercel: Rocket,
  meet: CalendarClock,
  cue: Brain,
  posthog: Sparkles,
};

export function CueWorkspaceApp() {
  const [view, setView] = useState<"home" | "chats">("home");
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<HomeSnapshot | null>(null);
  const [threads, setThreads] = useState<ChatThreadWithMessages[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thinkingId, setThinkingId] = useState<string | null>(null);
  const [feedTab, setFeedTab] = useState<"Suggested" | "Recent" | "Mentions">("Suggested");
  const [draft, setDraft] = useState("");
  const [approval, setApproval] = useState<ApprovalDialog | null>(null);
  const [doneActions, setDoneActions] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const convoRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const toastCounterRef = useRef(0);

  const active = useMemo(() => threads.find((thread) => thread.id === activeId), [activeId, threads]);
  const feedGroups = useMemo(() => buildFeedGroups(snapshot), [snapshot]);
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const partOfDay = getPartOfDay();

  useEffect(() => {
    let cancelled = false;
    async function loadBootstrap() {
      try {
        const bootstrap = await getJson<BootstrapResponse>("/api/bootstrap");
        if (cancelled) {
          return;
        }
        setSnapshot(bootstrap.snapshot);
        setThreads(bootstrap.threads);
        setActiveId(bootstrap.threads[0]?.id ?? null);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load Cue workspace.");
        }
      }
    }

    void loadBootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (convoRef.current) {
      convoRef.current.scrollTop = convoRef.current.scrollHeight;
    }
  }, [active?.messages.length, thinkingId, view]);

  useEffect(() => {
    if (view === "chats" && active && active.messages.length === 0) {
      inputRef.current?.focus();
    }
  }, [active, view]);

  function toast(text: string) {
    const id = ++toastCounterRef.current;
    setToasts((currentToasts) => [...currentToasts, { id, text }]);
    setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toastMessage) => toastMessage.id !== id));
    }, 2600);
  }

  function newChat() {
    const now = new Date().toISOString();
    const newThread: ChatThreadWithMessages = {
      id: `new_${Date.now()}`,
      workspaceId: snapshot?.workspace.id ?? "workspace_cue_h0",
      title: "New chat",
      status: "muted",
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    setThreads((currentThreads) => [newThread, ...currentThreads]);
    setActiveId(newThread.id);
    setView("chats");
    setDraft("");
  }

  async function askFresh(question: string) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || !snapshot) {
      return;
    }

    const now = new Date().toISOString();
    const pendingThreadId = `pending_${Date.now()}`;
    const pendingThread: ChatThreadWithMessages = {
      id: pendingThreadId,
      workspaceId: snapshot.workspace.id,
      title: clip(trimmedQuestion),
      status: "muted",
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: `${pendingThreadId}_user`,
          threadId: pendingThreadId,
          role: "user",
          content: trimmedQuestion,
          createdAt: now,
        },
      ],
    };

    setThreads((currentThreads) => [pendingThread, ...currentThreads]);
    setActiveId(pendingThreadId);
    setThinkingId(pendingThreadId);
    setView("chats");

    try {
      const result = await postJson<ChatMutationResponse>("/api/chats", { message: trimmedQuestion });
      setSnapshot(result.snapshot);
      setThreads(result.threads);
      setActiveId(result.thread.id);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Cue could not answer that.");
      setThreads((currentThreads) => currentThreads.filter((thread) => thread.id !== pendingThreadId));
    } finally {
      setThinkingId(null);
    }
  }

  async function send(question: string) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || !active) {
      return;
    }
    if (active.messages.length === 0 || active.id.startsWith("new_")) {
      await askFresh(trimmedQuestion);
      return;
    }

    const now = new Date().toISOString();
    const optimisticMessage: ChatMessageRecord = {
      id: `pending_message_${Date.now()}`,
      threadId: active.id,
      role: "user",
      content: trimmedQuestion,
      createdAt: now,
    };
    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        thread.id === active.id
          ? { ...thread, messages: [...thread.messages, optimisticMessage], updatedAt: now }
          : thread,
      ),
    );
    setThinkingId(active.id);

    try {
      const result = await postJson<{ thread: ChatThreadWithMessages; snapshot: HomeSnapshot }>(
        `/api/chats/${active.id}/messages`,
        { message: trimmedQuestion },
      );
      setSnapshot(result.snapshot);
      setThreads((currentThreads) => currentThreads.map((thread) => (thread.id === result.thread.id ? result.thread : thread)));
    } catch (error) {
      toast(error instanceof Error ? error.message : "Cue could not answer that.");
    } finally {
      setThinkingId(null);
    }
  }

  function onAction(action: SuggestedAction) {
    if (doneActions.has(action.id)) {
      return;
    }
    if (!action.requiresApproval) {
      setDoneActions((currentDoneActions) => new Set(currentDoneActions).add(action.id));
      toast("Cue opened the related context");
      return;
    }
    setApproval({
      id: action.approvalId,
      title: `Approve: ${action.label}`,
      description: "Cue will carry this out once you approve. Nothing happens until then.",
      action,
    });
  }

  async function approveNow() {
    if (!approval) {
      return;
    }
    try {
      if (approval.id) {
        await patchJson(`/api/approvals/${approval.id}`, { status: "approved" });
        setSnapshot((currentSnapshot) =>
          currentSnapshot
            ? {
                ...currentSnapshot,
                pendingApprovals: currentSnapshot.pendingApprovals.filter((pendingApproval) => pendingApproval.id !== approval.id),
              }
            : currentSnapshot,
        );
      }
      if (approval.action) {
        setDoneActions((currentDoneActions) => new Set(currentDoneActions).add(approval.action!.id));
      }
      toast("Approved - Cue is on it");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Approval failed.");
    } finally {
      setApproval(null);
    }
  }

  function discardNow() {
    toast("Discarded");
    setApproval(null);
  }

  const topBar = (
    <header className="topbar">
      <div className="tb-brand">
        <span className="cue-dot" />
        <span className="brand-mark">Cue</span>
      </div>
      <nav className="tb-nav">
        <button className={`tb-link ${view === "home" ? "active" : ""}`} onClick={() => setView("home")}>
          Home
        </button>
        <button className={`tb-link ${view === "chats" ? "active" : ""}`} onClick={() => setView("chats")}>
          Chats
        </button>
      </nav>
      <div className="tb-right">
        <span className="top-date">{dateLabel}</span>
        <button className="icon-btn" onClick={() => setDark((currentDark) => !currentDark)} title="Toggle theme">
          {dark ? <Sun /> : <Moon />}
        </button>
        <div className="avatar-wrap">
          <button className="avatar" onClick={() => setMenuOpen((currentOpen) => !currentOpen)}>
            AV
          </button>
          {menuOpen && snapshot && (
            <>
              <div className="backdrop" onClick={() => setMenuOpen(false)} />
              <div className="menu">
                <div className="menu-head">
                  <div className="menu-name">{snapshot.workspace.userDisplayName} Varma</div>
                  <div className="menu-ws">{snapshot.workspace.name}</div>
                </div>
                <div className="menu-lab eyebrow">Connectors</div>
                <div className="menu-conns">
                  {snapshot.connectors.map((connector) => (
                    <span className="conn-badge" key={connector.id}>
                      <span className="dot" />
                      {connector.label}
                    </span>
                  ))}
                </div>
                <button
                  className="menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    toast("Settings coming soon");
                  }}
                >
                  <Settings />
                  Settings
                </button>
                <button
                  className="menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    toast("Signed out");
                  }}
                >
                  <LogOut />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );

  return (
    <div className={`cue-app${dark ? " dark" : ""}`}>
      <style>{CSS}</style>
      {topBar}
      <div className="main-body">
        {!snapshot && !loadError && <div className="load-state">Loading Cue workspace...</div>}
        {loadError && <div className="error-state">{loadError}</div>}
        {snapshot && (view === "home" ? renderHomeView() : renderChatsView())}
        {toasts.length > 0 && (
          <div className="toast-wrap">
            {toasts.map((toastMessage) => (
              <div className="toast" key={toastMessage.id}>
                <CheckCircle2 />
                {toastMessage.text}
              </div>
            ))}
          </div>
        )}
      </div>
      {approval && (
        <div className="modal-back" onClick={discardNow}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-top">
              <div className="modal-badge">
                <ShieldCheck />
              </div>
              <div className="modal-t">{approval.title}</div>
            </div>
            <div className="modal-d" style={{ whiteSpace: "pre-line" }}>
              {approval.description}
            </div>
            <div className="modal-foot">
              <button className="btn-reject" onClick={discardNow}>
                Discard
              </button>
              <button className="btn-approve" onClick={approveNow}>
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderHomeView() {
    if (!snapshot) {
      return null;
    }

    return (
      <div className="scroll">
        <div className="home">
          <div className="fade">
            <h1 className="greeting">Good {partOfDay}, {snapshot.workspace.userDisplayName}</h1>
            <p className="greet-sub">
              Search across your workspace, or ask Cue. <b>{snapshot.pendingApprovals.length + snapshot.dueTasks.length} things</b> need a look today.
            </p>
          </div>
          <div className="fade" style={{ animationDelay: ".04s" }}>
            <div className="hero-ask">
              <Search />
              <input
                placeholder="Search or ask anything across Slack, GitHub, Linear, Notion…"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void askFresh(draft);
                    setDraft("");
                  }
                }}
              />
              <span className="ask-pill">
                <Sparkles />
                Ask Cue
              </span>
              <button
                className="send"
                disabled={!draft.trim()}
                onClick={() => {
                  void askFresh(draft);
                  setDraft("");
                }}
              >
                <ArrowUp />
              </button>
            </div>
            <div className="hero-hint">Searches your connected sources · press Enter to open an AI thread with citations</div>
          </div>

          <div className="home-grid">
            <div className="col fade" style={{ animationDelay: ".09s" }}>
              <div>
                <div className="sec-lab">
                  <span className="eyebrow">For you</span>
                </div>
                <div className="card">
                  <div className="panel-head">
                    {(["Suggested", "Recent", "Mentions"] as const).map((tab) => {
                      const unread = feedGroups[tab].filter((feedItem) => feedItem.unread).length;
                      return (
                        <button key={tab} className={`tab ${feedTab === tab ? "active" : ""}`} onClick={() => setFeedTab(tab)}>
                          {tab}
                          {unread > 0 && <span className="tab-badge">{unread}</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="feed-body">
                    {feedGroups[feedTab].map((feedItem) => renderFeedItem(feedItem))}
                  </div>
                </div>
              </div>
              <div>
                <div className="sec-lab">
                  <span className="eyebrow">Recent activity</span>
                </div>
                <div className="card">
                  {snapshot.recentActivity.map((activityEvent) => {
                    const Icon = sourceIcon[activityEvent.source] ?? Hash;
                    return (
                      <div className="ra-row" key={activityEvent.id} onClick={() => void askFresh(activityEvent.query)}>
                        <div className="ra-ic">
                          <Icon className={`src-${activityEvent.source}`} />
                        </div>
                        <span className="ra-t">{activityEvent.title}</span>
                        <span className="ra-time">{formatRelativeTime(activityEvent.occurredAt)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="col fade" style={{ animationDelay: ".13s" }}>
              <div className="card">
                <div className="card-head">
                  <span className="eyebrow">Today</span>
                </div>
                {snapshot.meetings.map((meeting) => (
                  <div className={`t-row ${meeting.title.toLowerCase().includes("h0") ? "hot" : ""}`} key={meeting.id}>
                    <span className="t-time">{formatMeetingTime(meeting.startsAt)}</span>
                    <div className="t-mid">
                      <div className="t-title">{meeting.title}</div>
                      <div className="t-sub">{meeting.location} · {meeting.attendees.slice(0, 3).join(", ")}</div>
                    </div>
                    {meeting.joinUrl && (
                      <button className="join-btn" onClick={() => toast("Opening meeting...")}>
                        <Video />
                        Join
                      </button>
                    )}
                  </div>
                ))}
                <div className="due-divider eyebrow">Due</div>
                {snapshot.dueTasks.map((task) => (
                  <div className="due-row" key={task.id} onClick={() => void askFresh(`What is blocking ${task.title}?`)}>
                    <span className="due-box" />
                    <div>
                      <div className="due-t">{task.title}</div>
                      <div className="due-m">{task.dueAt ? formatDue(task.dueAt) : "no due date"} · {task.ownerName ?? "unassigned"}</div>
                    </div>
                  </div>
                ))}
                <div className="due-divider eyebrow">Tickets needing attention</div>
                {snapshot.ticketsNeedingAttention.map((ticket) => (
                  <div className="due-row" key={ticket.id} onClick={() => void askFresh(`What is the status of ${ticket.externalId}?`)}>
                    <span className="due-box" />
                    <div>
                      <div className="due-t">{ticket.externalId}: {ticket.title}</div>
                      <div className="due-m">{ticket.source} · {ticket.status} · {ticket.ownerName ?? "unassigned"}</div>
                    </div>
                  </div>
                ))}
                <div className="see-all" onClick={() => toast("Calendar coming soon")}>
                  See all events <ChevronRight />
                </div>
              </div>
              <div className="card">
                <div className="card-head">
                  <span className="eyebrow">Waiting on you</span>
                </div>
                {snapshot.pendingApprovals.map((pendingApproval) => (
                  <div className="wait-row" key={pendingApproval.id}>
                    <div className="wait-ico">
                      <ShieldCheck />
                    </div>
                    <div className="wait-mid">
                      <div className="wait-t">{pendingApproval.title}</div>
                      <div className="wait-m">drafted by Cue</div>
                    </div>
                    <button
                      className="wait-btn"
                      onClick={() =>
                        setApproval({
                          id: pendingApproval.id,
                          title: pendingApproval.title,
                          description: pendingApproval.description,
                        })
                      }
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderChatsView() {
    const isEmpty = active && active.messages.length === 0 && thinkingId !== active.id;
    const groupedThreads = groupThreads(threads);

    return (
      <div className="chats">
        <div className="threads">
          <div className="threads-head">
            <button className="new-btn" onClick={newChat}>
              <Plus />
              New chat
            </button>
          </div>
          <div className="t-list">
            {Object.entries(groupedThreads).map(([day, dayThreads]) => {
              if (!dayThreads.length) {
                return null;
              }
              return (
                <div key={day}>
                  <div className="t-day eyebrow">{day}</div>
                  {dayThreads.map((thread) => (
                    <div
                      key={thread.id}
                      className={`t-item ${thread.id === activeId ? "active" : ""}`}
                      onClick={() => setActiveId(thread.id)}
                    >
                      <span className="t-dot" style={{ background: statusColor(thread.status) }} />
                      <span className="t-itxt">{thread.title}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <div className="convo-wrap">
          {isEmpty ? (
            <div className="welcome">
              <div className="welcome-mark">
                <span className="cue-dot" />
              </div>
              <h2>Ask Cue anything about your work</h2>
              <p>I search across Slack, GitHub, Linear, Notion, Vercel, and your meetings - and every answer comes with its sources.</p>
              <div className="sugg">
                {["Are we ready to submit H0?", "What's blocking the Aurora migration?", "Summarize Priya's ask in #leadership"].map((suggestion) => (
                  <button className="sugg-chip" key={suggestion} onClick={() => void send(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="convo scroll" ref={convoRef}>
              <div className="convo-inner">
                {active?.messages.map((message) =>
                  message.role === "user" ? (
                    <div className="u-msg msg-in" key={message.id}>
                      {message.content}
                    </div>
                  ) : (
                    <CueMessage key={message.id} message={message} onAction={onAction} doneActions={doneActions} />
                  ),
                )}
                {thinkingId === active?.id && <Thinking />}
              </div>
            </div>
          )}
          <div className="convo-foot">
            <div className="composer">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder={isEmpty ? "Message Cue..." : "Ask a follow-up..."}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send(draft);
                    setDraft("");
                  }
                }}
              />
              <button
                className="send"
                disabled={!draft.trim()}
                onClick={() => {
                  void send(draft);
                  setDraft("");
                }}
              >
                <ArrowUp />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderFeedItem(feedItem: ActivityEvent) {
    const Icon = sourceIcon[feedItem.source] ?? Hash;
    return (
      <div className="feed-item" key={feedItem.id} onClick={() => void askFresh(feedItem.query)}>
        <div className={`feed-src ${feedItem.kind === "blocker" || feedItem.kind === "launch_risk" ? "warn" : ""}`}>
          <Icon className={`src-${feedItem.source}`} />
        </div>
        <div className="feed-main">
          <div className="feed-title">
            {feedItem.title}
            {(feedItem.kind === "blocker" || feedItem.kind === "launch_risk") && <span className="mini-chip">needs attention</span>}
          </div>
          <div className="feed-meta">{feedItem.subtitle}</div>
        </div>
        <div className="feed-right">
          <span className="feed-time">{formatRelativeTime(feedItem.occurredAt)}</span>
          {feedItem.unread && <span className="unread" />}
        </div>
      </div>
    );
  }
}

function CueMessage({
  message,
  onAction,
  doneActions,
}: {
  message: ChatMessageRecord;
  onAction: (action: SuggestedAction) => void;
  doneActions: Set<string>;
}) {
  const structuredMessage = message.structuredContent ?? fallbackTextAnswer(message.content);
  return (
    <div className="c-msg msg-in">
      <div className="c-avatar">
        <span className="cue-dot" />
      </div>
      {structuredMessage.kind === "structured" ? (
        <div className={`c-body ${structuredMessage.tone || "signal"}`}>
          <div className="verdict">
            {structuredMessage.verdict}
            {structuredMessage.statusPill && (
              <StatusChip className={structuredMessage.statusPill.className} text={structuredMessage.statusPill.text} live={structuredMessage.statusPill.className === "warn"} />
            )}
          </div>
          <div className="answer-sub">{structuredMessage.summary}</div>
          {structuredMessage.blocks.length > 0 && (
            <div className="blocks">
              {structuredMessage.blocks.map((block) => (
                <div className="block" key={`${block.title}-${block.reference}`}>
                  <AlertTriangle className="block-ico" />
                  <div>
                    <div className="block-t">{block.title}</div>
                    <div className="block-d">{block.description}</div>
                    <div className="block-ref">{block.reference}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {structuredMessage.noBlock && (
            <div className="no-block">
              <CheckCircle2 />
              {structuredMessage.noBlock}
            </div>
          )}
          {structuredMessage.missingEvidence.length > 0 && (
            <>
              <div className="eyebrow layer-lab">Missing evidence</div>
              <div className="blocks">
                {structuredMessage.missingEvidence.map((missingEvidence) => (
                  <div className="block" key={missingEvidence}>
                    <AlertTriangle className="block-ico" />
                    <div>
                      <div className="block-t">Evidence gap</div>
                      <div className="block-d">{missingEvidence}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <EvidenceLayer evidence={structuredMessage.evidence} />
          <ActionLayer actions={structuredMessage.actions} doneActions={doneActions} onAction={onAction} />
        </div>
      ) : (
        <div className={`c-body ${structuredMessage.tone || "signal"}`}>
          <div className="answer-sub" style={{ marginTop: 2 }}>{structuredMessage.text}</div>
          <EvidenceLayer evidence={structuredMessage.evidence} />
          <ActionLayer actions={structuredMessage.actions} doneActions={doneActions} onAction={onAction} />
        </div>
      )}
    </div>
  );
}

function StatusChip({ className, text, live }: { className: "warn" | "ok"; text: string; live?: boolean }) {
  return (
    <span className={`chip-status ${className} ${live ? "live" : ""}`}>
      <span className="light" />
      {text}
    </span>
  );
}

function EvidenceLayer({ evidence }: { evidence: EvidenceChip[] }) {
  if (evidence.length === 0) {
    return null;
  }
  return (
    <>
      <div className="eyebrow layer-lab">Evidence</div>
      <div className="chips">
        {evidence.map((evidenceChip) => (
          <EvidenceChipButton key={`${evidenceChip.source}-${evidenceChip.label}`} evidenceChip={evidenceChip} />
        ))}
      </div>
    </>
  );
}

function EvidenceChipButton({ evidenceChip }: { evidenceChip: EvidenceChip }) {
  const Icon = sourceIcon[evidenceChip.source] ?? Hash;
  return (
    <button className="chip">
      <Icon className={`src-${evidenceChip.source}`} />
      {evidenceChip.label}
    </button>
  );
}

function ActionLayer({
  actions,
  doneActions,
  onAction,
}: {
  actions: SuggestedAction[];
  doneActions: Set<string>;
  onAction: (action: SuggestedAction) => void;
}) {
  if (actions.length === 0) {
    return null;
  }
  return (
    <div className="actions">
      {actions.map((action) => {
        const done = doneActions.has(action.id);
        return (
          <button key={action.id} className={`act ${done ? "done" : ""}`} onClick={() => onAction(action)}>
            {done ? <Check /> : <Plus />}
            {done ? "Approved" : action.label}
          </button>
        );
      })}
    </div>
  );
}

function Thinking() {
  const steps = ["Searching Slack #launch...", "Checking GitHub #482...", "Cross-referencing Linear...", "Grounding the answer..."];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((currentIndex) => (currentIndex + 1) % steps.length), 900);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="c-msg msg-in">
      <div className="c-avatar">
        <span className="cue-dot" />
      </div>
      <div className="c-body signal">
        <div className="thinking">
          <div className="tdots">
            <span className="tdot" />
            <span className="tdot" />
            <span className="tdot" />
          </div>
          <span className="think-line">{steps[index]}</span>
        </div>
      </div>
    </div>
  );
}

function buildFeedGroups(snapshot: HomeSnapshot | null): Record<"Suggested" | "Recent" | "Mentions", ActivityEvent[]> {
  if (!snapshot) {
    return { Suggested: [], Recent: [], Mentions: [] };
  }
  return {
    Suggested: snapshot.forYou,
    Recent: snapshot.recentActivity,
    Mentions: snapshot.forYou.filter((event) => event.kind === "mention"),
  };
}

type ThreadGroups = {
  Today: ChatThreadWithMessages[];
  Yesterday: ChatThreadWithMessages[];
  Earlier: ChatThreadWithMessages[];
};

function groupThreads(threads: ChatThreadWithMessages[]): ThreadGroups {
  const today = new Date().toDateString();
  const groupedThreads: ThreadGroups = { Today: [], Yesterday: [], Earlier: [] };
  for (const thread of threads) {
    const updatedDate = new Date(thread.updatedAt);
    const dayDifference = Math.floor((Date.now() - updatedDate.getTime()) / 86_400_000);
    if (updatedDate.toDateString() === today || dayDifference < 1) {
      groupedThreads.Today.push(thread);
    } else if (dayDifference < 2) {
      groupedThreads.Yesterday.push(thread);
    } else {
      groupedThreads.Earlier.push(thread);
    }
  }
  return groupedThreads;
}

function fallbackTextAnswer(content: string): CueAssistantMessage {
  return {
    role: "assistant",
    kind: "text",
    tone: "signal",
    text: content,
    evidence: [],
    citations: [],
    actions: [],
  };
}

function statusColor(status: "ok" | "warn" | "muted") {
  if (status === "ok") {
    return "var(--ok)";
  }
  if (status === "warn") {
    return "var(--signal-bright)";
  }
  return "var(--ink-4)";
}

function getPartOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "morning";
  }
  if (hour < 18) {
    return "afternoon";
  }
  return "evening";
}

function clip(question: string) {
  return question.length > 42 ? `${question.slice(0, 42)}...` : question;
}

function formatMeetingTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDue(isoString: string) {
  const date = new Date(isoString);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return "due today";
  }
  return `due ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function formatRelativeTime(isoString: string) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(isoString).getTime()) / 60_000));
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  return `${Math.round(diffHours / 24)}d`;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<T>;
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<T>;
}

async function patchJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<T>;
}
