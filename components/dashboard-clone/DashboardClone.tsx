"use client";

import React, { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useMotion } from "./MotionProvider";
import { staticDatabase } from "@/lib/mock/database";
import { 
  Activity, 
  Users, 
  DollarSign, 
  Server, 
  Play, 
  Pause,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";

// Register GSAP plugins if needed (ScrollTrigger etc.)
gsap.registerPlugin(useGSAP);

export function DashboardClone() {
  const { motionEnabled, toggleMotion } = useMotion();
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!motionEnabled) return;

    const tl = gsap.timeline();

    // Initial stagger in
    tl.from(".gsap-header", {
      y: -50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
    })
    .from(".gsap-stat-card", {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "back.out(1.2)",
    }, "-=0.4")
    .from(".gsap-chart", {
      scale: 0.95,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
    }, "-=0.2")
    .from(".gsap-activity", {
      x: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
    }, "-=0.6");

  }, { scope: container, dependencies: [motionEnabled] });

  // Interactive hover effects for cards
  const onCardEnter = (e: React.MouseEvent) => {
    if (!motionEnabled) return;
    gsap.to(e.currentTarget, {
      y: -5,
      scale: 1.02,
      duration: 0.3,
      ease: "power2.out",
      boxShadow: "0 20px 40px -10px rgba(0, 255, 128, 0.1)",
      borderColor: "rgba(0, 255, 128, 0.3)",
    });
  };

  const onCardLeave = (e: React.MouseEvent) => {
    if (!motionEnabled) return;
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
      boxShadow: "none",
      borderColor: "var(--border-subtle)",
    });
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'dollar': return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case 'users': return <Users className="w-5 h-5 text-blue-400" />;
      case 'activity': return <Activity className="w-5 h-5 text-rose-400" />;
      case 'server': return <Server className="w-5 h-5 text-purple-400" />;
      default: return <Activity className="w-5 h-5 text-text-primary" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpRight className="w-4 h-4 text-emerald-400" />;
    if (trend === 'down') return <ArrowDownRight className="w-4 h-4 text-rose-400" />;
    return <Minus className="w-4 h-4 text-text-secondary" />;
  };

  return (
    <div 
      ref={container} 
      className="min-h-screen bg-background text-text-primary overflow-hidden font-sans relative"
      style={{
        backgroundImage: "radial-gradient(circle at top right, rgba(0, 255, 128, 0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(0, 128, 255, 0.05), transparent 40%)"
      }}
    >
      {/* Background ambient light */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />

      <main className="max-w-7xl mx-auto p-6 md:p-12 relative z-10">
        {/* Header */}
        <header className="gsap-header flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 bg-gradient-to-r from-text-primary via-text-primary to-text-secondary bg-clip-text text-transparent">
              Welcome back, {staticDatabase.user.name.split(' ')[0]}
            </h1>
            <p className="text-text-secondary text-lg">Here's what's happening with your projects today.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMotion}
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated border border-border-subtle hover:border-primary/50 transition-colors"
            >
              <div className="relative w-8 h-8 rounded-full bg-surface flex items-center justify-center border border-border overflow-hidden">
                {motionEnabled ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-text-secondary" />}
                {motionEnabled && (
                  <span className="absolute inset-0 rounded-full border border-primary animate-ping opacity-20" />
                )}
              </div>
              <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                Motion: {motionEnabled ? "On" : "Off"}
              </span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-border-subtle">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-text-primary">{staticDatabase.user.name}</div>
                <div className="text-xs text-text-secondary">{staticDatabase.user.role}</div>
              </div>
              <img 
                src={staticDatabase.user.avatar} 
                alt="User" 
                className="w-10 h-10 rounded-full border border-border-subtle"
              />
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {staticDatabase.stats.map((stat) => (
            <div 
              key={stat.id}
              className="gsap-stat-card p-6 rounded-2xl bg-surface-elevated/40 backdrop-blur-xl border border-border-subtle relative overflow-hidden group"
              onMouseEnter={onCardEnter}
              onMouseLeave={onCardLeave}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 rounded-lg bg-surface border border-border/50">
                  {getIcon(stat.icon)}
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-emerald-400' : 
                  stat.trend === 'down' ? 'text-rose-400' : 'text-text-secondary'
                }`}>
                  {stat.percentage}
                  {getTrendIcon(stat.trend)}
                </div>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-text-secondary text-sm font-medium mb-1">{stat.title}</h3>
                <div className="text-3xl font-black text-text-primary tracking-tight">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Area */}
          <div className="gsap-chart lg:col-span-2 p-6 rounded-2xl bg-surface-elevated/30 backdrop-blur-md border border-border-subtle relative overflow-hidden flex flex-col h-[400px]">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-bold text-text-primary">Revenue vs Expenses</h2>
               <div className="flex gap-4 text-sm text-text-secondary">
                 <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary" /> Revenue</div>
                 <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-border" /> Expenses</div>
               </div>
             </div>
             
             {/* Beautiful CSS/HTML Chart Representation (since we don't have Recharts installed for sure) */}
             <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 mt-auto pt-4 border-t border-border/30 relative">
                {/* Horizontal Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-px bg-border/20" />
                  ))}
                </div>

                {staticDatabase.chartData.map((data, i) => {
                  const maxVal = 10000;
                  const revHeight = (data.revenue / maxVal) * 100;
                  const expHeight = (data.expenses / maxVal) * 100;
                  return (
                    <div key={data.month} className="flex flex-col items-center gap-2 h-full justify-end w-full group relative z-10">
                      <div className="flex gap-1 w-full justify-center items-end h-[85%] relative">
                        <div 
                          className="w-1/3 max-w-8 bg-gradient-to-t from-primary/20 to-primary rounded-t-md transition-all duration-500 group-hover:shadow-[0_0_15px_rgba(0,255,128,0.3)]" 
                          style={{ height: `${revHeight}%` }}
                        />
                        <div 
                          className="w-1/3 max-w-8 bg-gradient-to-t from-border/20 to-border rounded-t-md transition-all duration-500"
                          style={{ height: `${expHeight}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary font-medium">{data.month}</span>
                    </div>
                  )
                })}
             </div>
          </div>

          {/* Activity List */}
          <div className="bg-surface-elevated/30 backdrop-blur-md rounded-2xl border border-border-subtle p-6">
            <h2 className="text-lg font-bold text-text-primary mb-6">Recent Activity</h2>
            
            <div className="flex flex-col gap-6">
              {staticDatabase.activities.map((item, index) => (
                <div key={item.id} className="gsap-activity flex gap-4 relative">
                  {/* Timeline connector */}
                  {index !== staticDatabase.activities.length - 1 && (
                    <div className="absolute top-10 left-5 w-px h-full bg-border-subtle" />
                  )}
                  
                  <img src={item.user.avatar} alt={item.user.name} className="w-10 h-10 rounded-full border-2 border-surface bg-surface z-10" />
                  
                  <div className="flex-1">
                    <p className="text-sm text-text-primary">
                      <span className="font-semibold">{item.user.name}</span> {item.action}
                    </p>
                    <p className="text-sm font-medium text-primary mt-0.5">{item.target}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-text-secondary">{item.time}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        item.status === 'failed' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
