import React from 'react'

const AboutProjectAndTeam = () => {
  return (
    <section className="space-y-12 pt-6">
      
      {/* ─── Hero / Landing Showcase Section ─── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-emerald-500/20 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              IoT-Driven Precision Agriculture Prototype
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Automated <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-lime-400 bg-clip-text text-transparent">Hydroponic Lettuce</span> Farming System
            </h2>
            
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              A high-yield, closed-loop <strong>NFT (Nutrient Film Technique)</strong> smart vertical farming setup designed to cultivate crisp, organic fresh lettuce. Monitored with live sensors, automated nutrient balancing, full-spectrum LED growth lights, and proactive web alert notifications.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a href="#sensor-grid" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition flex items-center gap-1.5">
                <span>View Live Sensors</span>
              </a>
              <a href="#about-project" className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs hover:bg-slate-700 transition flex items-center gap-1.5">
                <span>Project Specs</span>
              </a>
              <a href="#team-mentors" className="px-5 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition flex items-center gap-1.5">
                <span>Team & Faculty</span>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-5 border-t border-slate-800/80">
              <div>
                <p className="text-2xl font-extrabold text-emerald-400 font-mono">90%</p>
                <p className="text-[11px] text-slate-400 font-medium">Water Conservation</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-teal-400 font-mono">30-35</p>
                <p className="text-[11px] text-slate-400 font-medium">Days Harvest Cycle</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-lime-400 font-mono">24/7</p>
                <p className="text-[11px] text-slate-400 font-medium">Live Telemetry & Alerts</p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-500/30 group">
              <img src="/hero-team-rig.jpg" alt="Team beside Hydroponic Setup" className="w-full h-[400px] object-cover group-hover:scale-105 transition duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
              
              <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Actual Batch: Grand Rapids Lettuce
              </div>

              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold text-amber-300">Full Spectrum LED Grow Lights</span>
                  <span className="text-emerald-400 font-bold">Optimal Health</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Multi-tier PVC NFT channels circulating nutrient solution with submerged submersible pump.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── About Project Section ─── */}
      <div id="about-project" className="space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            Engineering & Agronomy
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">About NutriFlow Hydroponics</h2>
          <p className="text-slate-600 dark:text-zinc-400 text-sm mt-2">
            NutriFlow is a closed-loop urban farming prototype designed to optimize biomass growth for Grand Rapids lettuce through automated IoT regulation of pH, dissolved salts, temperature, and lighting.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">🌿 NFT Recirculating Rig</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-xs leading-relaxed">
              Food-grade PVC channels with tailored net-pot slots. Recirculating pumps maintain a thin film of nutrient solution across the roots, maximizing dissolved oxygen absorption.
            </p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">⚡ Dual Edge Architecture</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-xs leading-relaxed">
              Arduino Uno R3 coordinates analog probes, ultrasonic depth, and LCD feedback, while an ESP32-S3 handles cloud streaming, plant vision, and threshold dispatch.
            </p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">💡 Photoperiod Lighting</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-xs leading-relaxed">
              Full-spectrum PAR LED fixtures deliver 14-16 hours of targeted vegetative photosynthetic radiation daily, accelerating harvest cycles to 30-35 days.
            </p>
          </div>
        </div>

        {/* Technical Highlights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-zinc-800 text-center">
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold uppercase">Target pH</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">6.5 – 7.5</p>
            <p className="text-[10px] text-slate-400 mt-1">Buffered Mineral Feed</p>
          </div>
          <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-zinc-800 text-center">
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold uppercase">Target EC</p>
            <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">0.5 – 3.5</p>
            <p className="text-[10px] text-slate-400 mt-1">mS/cm Conductivity</p>
          </div>
          <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-zinc-800 text-center">
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold uppercase">Target TDS</p>
            <p className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">50 – 400</p>
            <p className="text-[10px] text-slate-400 mt-1">PPM Dissolved Solids</p>
          </div>
          <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-zinc-800 text-center">
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold uppercase">Water Temp</p>
            <p className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-0.5">18°C – 28°C</p>
            <p className="text-[10px] text-slate-400 mt-1">Controlled Root Temp</p>
          </div>
        </div>

        {/* Lettuce Rig Photos Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm relative group">
            <img src="/hydroponics-setup-1.jpg" alt="Lettuce in NFT Channels" className="w-full h-64 object-cover group-hover:scale-105 transition duration-500" />
            <div className="absolute bottom-2 left-2 bg-slate-900/80 px-2.5 py-1 rounded-md text-[10px] text-white">
              🌱 Multi-Tier Food Grade Channels
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm relative group">
            <img src="/hydroponics-setup-2.jpg" alt="Lush Healthy Lettuce" className="w-full h-64 object-cover group-hover:scale-105 transition duration-500" />
            <div className="absolute bottom-2 left-2 bg-slate-900/80 px-2.5 py-1 rounded-md text-[10px] text-white">
              🥬 30-Day Fresh Harvest Batch
            </div>
          </div>
        </div>
      </div>

      {/* ─── Team Members Section ─── */}
      <div id="team-mentors" className="space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-500/10 dark:text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            Project Innovators
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">Meet Our Student Team</h2>
          <p className="text-slate-600 dark:text-zinc-400 text-sm mt-2">
            Undergraduate Engineers from Thapar Institute of Engineering and Technology combining embedded systems, agronomy, and software development.
          </p>
        </div>

        {/* 5 Members Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          
          {/* Devansh Kaushal */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-3 border-2 border-emerald-500/30 shadow-md">
                <img src="/team-devansh.jpg" alt="Devansh Kaushal" className="w-full h-full object-cover object-top" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Devansh Kaushal</h4>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 mt-1">
                Roll: 102309050
              </span>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1.5">Project Lead & IoT</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Microcontroller circuits, sensor calibrations, telemetry pipeline, and lettuce environmental controls.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 text-xs text-slate-400">
              <a href="mailto:dkaushal_be23@thapar.edu" className="hover:text-emerald-500 transition">Email Lead</a>
            </div>
          </div>

          {/* Pavit Dhiman */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-3 border-2 border-teal-500/30 shadow-md">
                <img src="/team-pavit.png" alt="Pavit Dhiman" className="w-full h-full object-cover object-top" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Pavit Dhiman</h4>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-500/10 text-teal-800 dark:text-teal-400 mt-1">
                Roll: 102309070
              </span>
              <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mt-1.5">Hardware & Embedded</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Microcontroller firmware, analog sensor signal conditioning, and ultrasonic water level depth mapping.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 text-xs text-slate-400">
              <a href="mailto:pdhiman_be23@thapar.edu" className="hover:text-teal-500 transition">pdhiman_be23@thapar.edu</a>
            </div>
          </div>

          {/* Gaurav Malik */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-3 border-2 border-purple-500/30 shadow-md">
                <img src="/team-gaurav.jpg" alt="Gaurav Malik" className="w-full h-full object-cover object-center" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Gaurav Malik</h4>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-500/10 text-purple-800 dark:text-purple-400 mt-1">
                Roll: 102303899
              </span>
              <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mt-1.5">Nutrient Chemistry</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Hoagland solution formulation, pH buffering, and electrical conductivity EC probe calibrations.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 text-xs text-slate-400">
              <a href="mailto:gmalik_be23@thapar.edu" className="hover:text-purple-500 transition">gmalik_be23@thapar.edu</a>
            </div>
          </div>

          {/* Yogesh Aggarwal */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-3 border-2 border-blue-500/30 shadow-md">
                <img src="/team-yogesh.jpg" alt="Yogesh Aggarwal" className="w-full h-full object-cover object-top" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Yogesh Aggarwal</h4>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 mt-1">
                Roll: 102323035
              </span>
              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-1.5">Fullstack & UI Dashboard</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Web dashboard visualization, telemetry charts, and real-time threshold alert notification dispatcher.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 text-xs text-slate-400">
              <a href="mailto:yaggarwal1_be23@thapar.edu" className="hover:text-blue-500 transition">yaggarwal1_be23@thapar.edu</a>
            </div>
          </div>

          {/* Parth Bakshi */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-zinc-800 dark:to-zinc-700 text-slate-600 dark:text-zinc-300 flex flex-col items-center justify-center mx-auto mb-3 border-2 border-slate-300 dark:border-zinc-700 shadow-md">
                <span className="text-2xl">👤</span>
                <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-zinc-400 mt-1">Photo Pending</span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Parth Bakshi</h4>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 mt-1">
                Roll: 102309043
              </span>
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mt-1.5">Hydraulics & Rig Design</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
                NFT PVC channel framing, gradient flow angles, pump manifolding, and mechanical rig stability.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 text-xs text-slate-400">
              <a href="mailto:pbakshi_be23@thapar.edu" className="hover:text-amber-500 transition">pbakshi_be23@thapar.edu</a>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Faculty Mentors Section ─── */}
      <div className="space-y-6">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-500/10 dark:text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            Academic Mentorship
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">Faculty Mentors & Advisors</h2>
          <p className="text-slate-600 dark:text-zinc-400 text-sm mt-2">
            Special thanks to our honorable professors and faculty mentors at Thapar Institute of Engineering and Technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          
          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-2xl overflow-hidden mb-3 border-2 border-teal-500/30 shadow-md">
              <img src="/mentor-madhup.jpg" alt="Dr. Madhup Kumar Mittal" className="w-full h-full object-cover object-top" />
            </div>
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider bg-teal-50 dark:bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-500/20 mb-1.5">Faculty Mentor</span>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Dr. Madhup Kumar Mittal</h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Faculty Advisor</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-2xl overflow-hidden mb-3 border-2 border-emerald-500/30 shadow-md">
              <img src="/mentor-sandeep.jpg" alt="Dr. Sandeep Kumar Sharma" className="w-full h-full object-cover object-top" />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 mb-1.5">Faculty Mentor</span>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Dr. Sandeep Kumar Sharma</h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Faculty Advisor</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-2xl overflow-hidden mb-3 border-2 border-blue-500/30 shadow-md">
              <img src="/mentor-raja.jpg" alt="Dr. Raja Rout" className="w-full h-full object-cover object-top" />
            </div>
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20 mb-1.5">Faculty Mentor</span>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Dr. Raja Rout</h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Faculty Advisor</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-2xl overflow-hidden mb-3 border-2 border-purple-500/30 shadow-md">
              <img src="/mentor-sachin.jpg" alt="Dr. Sachin Singh" className="w-full h-full object-cover object-top" />
            </div>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider bg-purple-50 dark:bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-500/20 mb-1.5">Faculty Mentor</span>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Dr. Sachin Singh</h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Faculty Advisor</p>
          </div>

        </div>
      </div>

    </section>
  )
}

export default AboutProjectAndTeam
