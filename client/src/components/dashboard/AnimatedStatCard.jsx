import { motion } from "framer-motion";
import { createElement } from "react";
import { AnimatedNumber } from "./AnimatedNumber.jsx";

const MotionDiv = motion.div;

export function AnimatedStatCard({ label, value, icon: Icon, accentClass, delayMs = 0, formatter }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delayMs / 1000 }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-black/5 bg-white/85 p-5 shadow-[0_18px_50px_-28px_rgba(30,25,18,0.35)] backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-ink-900">
            <AnimatedNumber
              value={value}
              formatter={formatter}
            />
          </p>
        </div>
        {Icon ? (
          <div className={`rounded-xl p-3 ${accentClass ?? "bg-brand-100 text-brand-700"}`}>
            {createElement(Icon, { size: 20 })}
          </div>
        ) : null}
      </div>
    </MotionDiv>
  );
}



